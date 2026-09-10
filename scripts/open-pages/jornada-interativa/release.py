"""Publicação restrita ao index da Jornada TEA e a seu PNG aprovado.

Credencial lida por entrada protegida. Sem escrita em KV, Worker, DNS ou outras
slugs. Snapshot local obrigatório; divergência concorrente impede publicação.
"""
import argparse
from datetime import datetime, timezone
import getpass
import hashlib
import json
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request
import warnings
from build import normalize, require, sha, fetch, Tags

ACCOUNT='da0c29123f448f3c3892f784cd9f7cac'
API='https://api.cloudflare.com/client/v4'
R2=f'/accounts/{ACCOUNT}/r2/buckets/csv-open-pages/objects'
KV=f'/accounts/{ACCOUNT}/storage/kv/namespaces/7a21d052398e4724aabb3d3c62372d12/values/page%3Ajornada-tea'
KEY='jornada-tea/index.html'
URL='https://open.grupocsv.com/jornada-tea/'

def public_head(raw):
    head=[]
    for tag,attrs,_,_,end in Tags(raw.decode()).tags:
        if tag=='head' and end: break
        if tag=='meta' and (attrs.get('property','').startswith('og:') or attrs.get('name','').startswith('twitter:')):
            head.append([tag,attrs])
        if tag=='link' and 'icon' in attrs.get('rel',''):
            head.append([tag,attrs])
    require(any(item[1].get('property')=='og:image' for item in head),'PUBLIC_OG_MISSING')
    require(any(item[0]=='link' for item in head),'PUBLIC_FAVICONS_MISSING')
    return head

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        raise RuntimeError('REDIRECT_REFUSED')

class Release:
    def __init__(self,token,package,state):
        self.token=token
        self.package=package.resolve()
        self.state=state.resolve()
        self.state.mkdir(parents=True,exist_ok=True)
        self.opener=urllib.request.build_opener(NoRedirect)
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
        require(path.startswith((R2,KV)), 'API_PATH_REFUSED')
        if method=='PUT':
            require(path in (R2+'/'+KEY,R2+'/'+self.png_key),'WRITE_TARGET_REFUSED')
        else:
            require(method=='GET','METHOD_REFUSED')
        req=urllib.request.Request(API+path,data=body,method=method,headers={'Authorization':'Bearer '+self.token,**(headers or {})})
        try:
            with self.opener.open(req,timeout=55) as response:
                raw=response.read()
                require(len(raw)<30*1024*1024,'RESPONSE_TOO_LARGE')
                return raw,dict(response.headers)
        except urllib.error.HTTPError as error:
            raise RuntimeError('API_HTTP_'+str(error.code)) from None

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
        require(not meta.get('auth_gate'),'PUBLIC_ACCESS_CHANGED')
        return raw

    def snapshot(self):
        require(not (self.state/'snapshot.json').exists(),'SNAPSHOT_ALREADY_EXISTS')
        objects=self.list_objects()
        require(any(row['key']==KEY for row in objects),'INDEX_MISSING')
        metadata=self.metadata()
        (self.state/'page-metadata.json').write_bytes(metadata)
        entries=[]
        for row in objects:
            body,_=self.request(R2+'/'+urllib.parse.quote(row['key'],safe='/'))
            name=row['key'].removeprefix('jornada-tea/')
            target=(self.state/'objects'/name).resolve()
            require(target.is_relative_to((self.state/'objects').resolve()),'BACKUP_PATH_INVALID')
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(body)
            entries.append({**row,'sha256':sha(body)})
            if row['key']==KEY:
                require(sha(body)==self.manifest['source_current_sha256'],'ORIGIN_DIFFERS_FROM_BUILD')
        public,_=fetch(URL)
        require(sha(normalize(public.decode()).encode())==self.manifest['source_current_sha256'],'PUBLIC_SOURCE_DIFFERS')
        snapshot={'metadata_sha256':sha(metadata),'objects':entries,'public_head':public_head(public)}
        (self.state/'snapshot.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        self.log('snapshot_verified',objects=len(entries),source_sha256=self.manifest['source_current_sha256'],metadata_sha256=sha(metadata))

    def original(self):
        snapshot=json.loads((self.state/'snapshot.json').read_text(encoding='utf-8'))
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
        self.check_preserved(snapshot)
        public,_=fetch(URL)
        require(sha(normalize(public.decode()).encode())==self.manifest['source_current_sha256'],'PUBLIC_SOURCE_CHANGED')
        current,_=self.request(R2+'/'+KEY)
        require(sha(current)==self.manifest['source_current_sha256'],'ORIGIN_CHANGED_BEFORE_PUBLISH')
        # A imagem é publicada e relida antes de alterar o documento que a aponta.
        if any(row['key']==self.png_key for row in snapshot['objects']):
            saved,_=self.request(R2+'/'+self.png_key)
            require(sha(saved)==self.image['sha256'],'EXISTING_IMAGE_DIFFERS')
            self.log('image_reused',key=self.png_key,sha256=self.image['sha256'])
        else:
            self.log('image_put_attempt',key=self.png_key,sha256=self.image['sha256'])
            self.request(R2+'/'+self.png_key,'PUT',self.png_bytes,{'Content-Type':'image/png'})
        saved,_=self.request(R2+'/'+self.png_key)
        require(sha(saved)==self.image['sha256'],'IMAGE_WRITE_MISMATCH')
        current,_=self.request(R2+'/'+KEY)
        require(sha(current)==self.manifest['source_current_sha256'],'ORIGIN_CHANGED_BEFORE_INDEX_PUT')
        require(sha(self.metadata())==snapshot['metadata_sha256'],'METADATA_CHANGED_BEFORE_INDEX_PUT')
        self.log('index_put_attempt',key=KEY,sha256=self.manifest['output_sha256'])
        # No retry automático de escrita: qualquer resposta incerta exige readback.
        self.request(R2+'/'+KEY,'PUT',self.html_bytes,{'Content-Type':'text/html; charset=utf-8'})
        self.verify()

    def verify(self):
        snapshot=self.original()
        current=self.check_preserved(snapshot,after=True)
        served,_=self.request(R2+'/'+KEY)
        require(served==self.html_bytes and sha(served)==self.manifest['output_sha256'],'R2_HTML_MISMATCH')
        image,_=self.request(R2+'/'+self.png_key)
        require(sha(image)==self.image['sha256'],'R2_IMAGE_MISMATCH')
        public,_=fetch(URL)
        require(normalize(public.decode()).encode()==served,'PUBLIC_HTML_MISMATCH')
        require(public_head(public)==snapshot['public_head'],'PUBLIC_OG_OR_FAVICONS_CHANGED')
        artifacts=[]
        for row in current:
            if row['key']==KEY: continue
            body,ctype=fetch('https://open.grupocsv.com/'+row['key'])
            expected=self.image['sha256'] if row['key']==self.png_key else next(item['sha256'] for item in snapshot['objects'] if item['key']==row['key'])
            # O Worker também injeta seu head nos backups HTML existentes.
            compared=normalize(body.decode()).encode() if row['key'].endswith('.html') else body
            require(sha(compared)==expected,'PUBLIC_ASSET_MISMATCH:'+row['key'])
            if row['key'].endswith('.html'):
                origin,_=self.request(R2+'/'+row['key'])
                require(sha(origin)==expected,'R2_BACKUP_CHANGED:'+row['key'])
            artifacts.append({'key':row['key'],'status':200,'bytes':len(body),'sha256':sha(body),'content_type':ctype,'compared_sha256':sha(compared),'comparison':'normalized_html' if row['key'].endswith('.html') else 'raw_bytes'})
        report={'output_sha256':sha(served),'public_identical':True,'metadata_unchanged':True,'public_head_unchanged':True,'public_head':public_head(public),'existing_objects_unchanged':True,'artifacts':artifacts}
        (self.state/'verified.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        self.log('publication_verified',output_sha256=sha(served),public_identical=True,metadata_unchanged=True,assets=len(artifacts))

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['snapshot','publish','verify'])
    parser.add_argument('--package',type=Path,required=True)
    parser.add_argument('--state',type=Path,required=True)
    args=parser.parse_args()
    warnings.simplefilter('error',getpass.GetPassWarning)
    token=getpass.getpass('ENTRADA_PROTEGIDA_PRONTA> ')
    try:
        release=Release(token,args.package,args.state)
        getattr(release,args.action)()
    except Exception as error:
        # API response bodies and token never appear in errors or tracebacks.
        print(json.dumps({'error':str(error).replace(token,'[redigido]'),'no_automatic_retry':True}),flush=True)
        raise SystemExit(1) from None
    finally:
        token=None

if __name__=='__main__': main()
