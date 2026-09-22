"""Publicação restrita ao index da Jornada TEA e a seu PNG aprovado.

Credencial lida por entrada protegida. Sem escrita em KV, Worker, DNS ou outras
slugs. Snapshot local obrigatório; divergência concorrente impede publicação.
"""
import argparse
from datetime import datetime, timezone
import getpass
import hashlib
import json
import socket
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request
import warnings
from build import require, sha

ACCOUNT='da0c29123f448f3c3892f784cd9f7cac'
API='https://api.cloudflare.com/client/v4'
BUCKET='csv-open-pages-tea-private'
BUCKET_API=f'/accounts/{ACCOUNT}/r2/buckets/{BUCKET}'
R2=BUCKET_API+'/objects'
WORKER_SETTINGS=f'/accounts/{ACCOUNT}/workers/scripts/csv-open-pages/settings'
KV=f'/accounts/{ACCOUNT}/storage/kv/namespaces/7a21d052398e4724aabb3d3c62372d12/values/page%3Ajornada-tea'
KEY='jornada-tea/index.html'
URL='https://open.grupocsv.com/jornada-tea/'

def object_path(key):
    require(key.startswith('jornada-tea/'), 'OBJECT_PREFIX_REFUSED')
    return R2+'/'+urllib.parse.quote(key,safe='')

def write_object_path(key):
    require(key.startswith('jornada-tea/'), 'OBJECT_PREFIX_REFUSED')
    return R2+'/'+urllib.parse.quote(key,safe='/')

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        raise RuntimeError('REDIRECT_REFUSED')

class Release:
    def __init__(self,token,package,state):
        self.token=token
        self.package=package.resolve()
        self.state=state.resolve()
        self.state.mkdir(parents=True,exist_ok=True)
        self.opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect)
        self.manifest=json.loads((package/'build-manifest.json').read_text(encoding='utf-8'))
        self.image=self.manifest['image']
        self.png_key='jornada-tea/'+self.image['name']
        require(self.image['name']=='mapa-jornada-'+self.image['sha256'][:16]+'.png','IMAGE_KEY_INVALID')
        self.html_bytes=(package/'index.html').read_bytes()
        self.png_bytes=(package/self.image['name']).read_bytes()
        require(sha(self.html_bytes)==self.manifest['output_sha256'],'LOCAL_HTML_CHANGED')
        require(sha(self.png_bytes)==self.image['sha256'],'LOCAL_IMAGE_CHANGED')

    def log(self,event,**data):
        record={'time':datetime.now(timezone.utc).isoformat(),'event':event,**data}
        with (self.state/'events.jsonl').open('a',encoding='utf-8') as stream:
            stream.write(json.dumps(record,ensure_ascii=False)+'\n')
        print(json.dumps(record,ensure_ascii=False),flush=True)

    def request(self,path,method='GET',body=None,headers=None):
        require(path in (KV,WORKER_SETTINGS,BUCKET_API+'/domains/managed',BUCKET_API+'/domains/custom') or path.startswith((R2+'/',R2+'?')), 'API_PATH_REFUSED')
        if method=='PUT':
            require(path in (write_object_path(KEY),write_object_path(self.png_key)),'WRITE_TARGET_REFUSED')
        else:
            require(method=='GET','METHOD_REFUSED')
        req=urllib.request.Request(API+path,data=body,method=method,headers={'Authorization':'Bearer '+self.token,**(headers or {})})
        try:
            with self.opener.open(req,timeout=55) as response:
                chunks=[]; size=0
                while chunk:=response.read(262144):
                    chunks.append(chunk); size+=len(chunk)
                    require(size<30*1024*1024,'RESPONSE_TOO_LARGE')
                return b''.join(chunks),dict(response.headers)
        except urllib.error.HTTPError as error:
            raise RuntimeError('API_HTTP_'+str(error.code)) from None

    def check_private_origin(self):
        def result(path):
            raw,_=self.request(path); data=json.loads(raw)
            require(data.get('success'),'PRIVATE_ORIGIN_API_FAILED')
            return data['result']
        managed=result(BUCKET_API+'/domains/managed')
        require(managed.get('enabled') is False,'PRIVATE_BUCKET_R2_DEV_ENABLED')
        custom=result(BUCKET_API+'/domains/custom')
        require(isinstance(custom,dict) and isinstance(custom.get('domains'),list),'PRIVATE_BUCKET_DOMAINS_INVALID')
        require(not custom['domains'],'PRIVATE_BUCKET_CUSTOM_DOMAINS_PRESENT')
        settings=result(WORKER_SETTINGS)
        bindings=[item for item in settings.get('bindings',[]) if item.get('name')=='TEA_CONTENT']
        require(len(bindings)==1 and bindings[0].get('type')=='r2_bucket' and bindings[0].get('bucket_name')==BUCKET,'TEA_CONTENT_BINDING_INVALID')
        return {'bucket':BUCKET,'binding':'TEA_CONTENT','public_domains':False}

    def list_objects(self):
        raw,_=self.request(R2+'?prefix=jornada-tea%2F&per_page=1000')
        data=json.loads(raw)
        require(data.get('success') and isinstance(data.get('result'),list),'R2_LIST_INVALID')
        require(not data.get('result_info',{}).get('is_truncated') and len(data['result'])<1000,'R2_LIST_INCOMPLETE')
        require(all(row['key'].startswith('jornada-tea/') for row in data['result']),'R2_PREFIX_MISMATCH')
        return sorted(data['result'],key=lambda row:row['key'])

    def metadata(self):
        raw,_=self.request(KV)
        meta=json.loads(raw)
        require(meta.get('slug')=='jornada-tea' and meta.get('status')=='active','SLUG_STATE_INVALID')
        require(meta.get('og_image')==URL+'og.png','OG_IMAGE_CHANGED')
        # O gate institucional é server-side e independe da antiga flag auth_gate.
        return raw

    def check_access_required(self, key=KEY):
        url='https://open.grupocsv.com/'+key
        for method in ('GET','HEAD'):
            request=urllib.request.Request(url,method=method,headers={'Cache-Control':'no-cache','User-Agent':'GrupoCSV-Jornada-AccessCheck/1.0'})
            try:
                with self.opener.open(request,timeout=45) as response:
                    status=response.status; headers=response.headers; body=response.read()
            except urllib.error.HTTPError as error:
                status=error.code; headers=error.headers; body=error.read()
            require(status==401,'INSTITUTIONAL_ACCESS_NOT_REQUIRED:'+method+':'+key)
            require(headers.get('X-TEA-Access')=='required','INSTITUTIONAL_GATE_NOT_IDENTIFIED:'+key)
            require('no-store' in headers.get('Cache-Control',''),'PROTECTED_RESPONSE_MAY_BE_CACHED:'+key)
            require(b'jornada-interactive-points' not in body and b'<svg' not in body and not body.startswith(b'\x89PNG'),'PROTECTED_CONTENT_EXPOSED:'+key)
            if method=='HEAD': require(not body,'HEAD_HAS_BODY:'+key)
        return {'key':key,'anonymous_get':401,'anonymous_head':401,'access':'required','cache':'no-store'}

    def snapshot(self):
        require(not (self.state/'snapshot.json').exists(),'SNAPSHOT_ALREADY_EXISTS')
        private_origin=self.check_private_origin()
        objects=self.list_objects()
        require(any(row['key']==KEY for row in objects),'INDEX_MISSING')
        metadata=self.metadata()
        (self.state/'page-metadata.json').write_bytes(metadata)
        entries=[]
        for row in objects:
            body,_=self.request(object_path(row['key']))
            name=row['key'].removeprefix('jornada-tea/')
            target=(self.state/'objects'/name).resolve()
            require(target.is_relative_to((self.state/'objects').resolve()),'BACKUP_PATH_INVALID')
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(body)
            entries.append({**row,'sha256':sha(body)})
            if row['key']==KEY:
                require(sha(body)==self.manifest['source_current_sha256'],'ORIGIN_DIFFERS_FROM_BUILD')
        gate=self.check_access_required()
        snapshot={'metadata_sha256':sha(metadata),'objects':entries,'institutional_access':gate,'private_origin':private_origin}
        (self.state/'snapshot.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        self.log('snapshot_verified',objects=len(entries),source_sha256=self.manifest['source_current_sha256'],metadata_sha256=sha(metadata))

    def original(self):
        snapshot=json.loads((self.state/'snapshot.json').read_text(encoding='utf-8'))
        require(snapshot.get('private_origin',{}).get('bucket')==BUCKET,'SNAPSHOT_PRIVATE_BUCKET_MISMATCH')
        require(sha((self.state/'objects/index.html').read_bytes())==self.manifest['source_current_sha256'],'BACKUP_CHANGED')
        return snapshot

    def check_preserved(self,snapshot,after=False):
        current=self.list_objects()
        by_key={row['key']:row for row in current}
        before_keys={row['key'] for row in snapshot['objects']}
        require(set(by_key)==before_keys | ({self.png_key} if after else set()),'OBJECT_SET_CHANGED')
        for row in snapshot['objects']:
            if after and row['key']==KEY: continue
            require(by_key[row['key']]=={k:v for k,v in row.items() if k!='sha256'},'UNEXPECTED_OBJECT_CHANGE:'+row['key'])
        require(sha(self.metadata())==snapshot['metadata_sha256'],'METADATA_CHANGED')
        return current

    def publish(self):
        approved=json.loads((Path(__file__).parent/'approved-output.json').read_text(encoding='utf-8'))
        for key in ['source_current_sha256','source_base_sha256','source_svg_sha256','output_sha256','image']:
            require(approved[key]==self.manifest[key],'UNAPPROVED_PACKAGE:'+key)
        snapshot=self.original()
        self.check_private_origin()
        self.check_preserved(snapshot)
        self.check_access_required()
        current,_=self.request(object_path(KEY))
        require(sha(current)==self.manifest['source_current_sha256'],'ORIGIN_CHANGED_BEFORE_PUBLISH')
        # A imagem é publicada e relida antes de alterar o documento que a aponta.
        if any(row['key']==self.png_key for row in snapshot['objects']):
            saved,_=self.request(object_path(self.png_key))
            require(sha(saved)==self.image['sha256'],'EXISTING_IMAGE_DIFFERS')
            self.log('image_reused',key=self.png_key,sha256=self.image['sha256'])
        else:
            self.log('image_put_attempt',key=self.png_key,sha256=self.image['sha256'])
            self.request(write_object_path(self.png_key),'PUT',self.png_bytes,{'Content-Type':'image/png'})
        saved,_=self.request(object_path(self.png_key))
        require(sha(saved)==self.image['sha256'],'IMAGE_WRITE_MISMATCH')
        current,_=self.request(object_path(KEY))
        require(sha(current)==self.manifest['source_current_sha256'],'ORIGIN_CHANGED_BEFORE_INDEX_PUT')
        require(sha(self.metadata())==snapshot['metadata_sha256'],'METADATA_CHANGED_BEFORE_INDEX_PUT')
        self.log('index_put_attempt',key=KEY,sha256=self.manifest['output_sha256'])
        # No retry automático de escrita: qualquer resposta incerta exige readback.
        self.request(write_object_path(KEY),'PUT',self.html_bytes,{'Content-Type':'text/html; charset=utf-8'})
        self.verify()

    def verify(self):
        snapshot=self.original()
        private_origin=self.check_private_origin()
        current=self.check_preserved(snapshot,after=True)
        served,_=self.request(object_path(KEY))
        require(served==self.html_bytes and sha(served)==self.manifest['output_sha256'],'R2_HTML_MISMATCH')
        image,_=self.request(object_path(self.png_key))
        require(sha(image)==self.image['sha256'],'R2_IMAGE_MISMATCH')
        artifacts=[]
        for row in current:
            key=row['key']
            expected=self.manifest['output_sha256'] if key==KEY else (self.image['sha256'] if key==self.png_key else next(item['sha256'] for item in snapshot['objects'] if item['key']==key))
            origin,_=self.request(object_path(key))
            require(sha(origin)==expected,'R2_ARTIFACT_CHANGED:'+key)
            gate=self.check_access_required(key)
            artifacts.append({**gate,'origin_bytes':len(origin),'origin_sha256':sha(origin)})
        report={'output_sha256':sha(served),'origin_identical':True,'metadata_unchanged':True,'anonymous_access_blocked':True,'existing_objects_unchanged':True,'authenticated_browser_qa_required':True,'private_origin':private_origin,'artifacts':artifacts}
        (self.state/'verified.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        self.log('publication_verified',output_sha256=sha(served),origin_identical=True,anonymous_access_blocked=True,metadata_unchanged=True,assets=len(artifacts),authenticated_browser_qa_required=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['snapshot','publish','verify'])
    parser.add_argument('--package',type=Path,required=True)
    parser.add_argument('--state',type=Path,required=True)
    args=parser.parse_args()
    warnings.simplefilter('error',getpass.GetPassWarning)
    token=getpass.getpass('ENTRADA_PROTEGIDA_PRONTA> ')
    original_dns=socket.getaddrinfo
    socket.getaddrinfo=lambda host,port,family=0,type=0,proto=0,flags=0:original_dns(host,port,socket.AF_INET if host=='api.cloudflare.com' else family,type,proto,flags)
    try:
        release=Release(token,args.package,args.state)
        getattr(release,args.action)()
    except Exception as error:
        # API response bodies and token never appear in errors or tracebacks.
        print(json.dumps({'error':str(error).replace(token,'[redigido]'),'no_automatic_retry':True}),flush=True)
        raise SystemExit(1) from None
    finally:
        token=None
        socket.getaddrinfo=original_dns

if __name__=='__main__': main()
