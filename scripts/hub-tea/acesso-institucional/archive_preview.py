"""Arquiva a prancha original antes da neutralização, sem sobrescrever divergências."""
import argparse,getpass,hashlib,json,socket,urllib.error,urllib.request,warnings
from pathlib import Path
from release import ACCOUNT,API,NoRedirect,require,sha

BUCKET='portais-eventos-arquivo'
BASE=f'/accounts/{ACCOUNT}/r2/buckets/{BUCKET}'
KEY='official-hub-tea/2026-09-21/peca-jornada-original.webp'
MANIFEST_KEY='official-hub-tea/2026-09-21/peca-jornada-original.manifest.json'

def run(token,snapshot):
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect)
    def request(path,method='GET',body=None,headers=None):
        require(path in (BASE+'/domains/managed',BASE+'/domains/custom',BASE+'/objects/'+KEY,BASE+'/objects/'+MANIFEST_KEY),'ARCHIVE_SCOPE')
        require(method=='GET' or (method=='PUT' and path in (BASE+'/objects/'+KEY,BASE+'/objects/'+MANIFEST_KEY)),'ARCHIVE_METHOD')
        req=urllib.request.Request(API+path,data=body,method=method,headers={'Authorization':'Bearer '+token,**(headers or {})})
        try:
            with opener.open(req,timeout=60) as response:
                chunks=[]
                while chunk:=response.read(262144):chunks.append(chunk)
                return b''.join(chunks)
        except urllib.error.HTTPError as error:
            if error.code==404 and method=='GET' and '/objects/' in path:return None
            raise RuntimeError('ARCHIVE_HTTP_'+str(error.code)) from None
    for kind in ('managed','custom'):
        data=json.loads(request(BASE+'/domains/'+kind));require(data.get('success'),'ARCHIVE_DOMAIN_CHECK_FAILED')
        result=data['result']
        require(result.get('enabled') is False if kind=='managed' else result.get('domains')==[],'ARCHIVE_IS_PUBLIC')
    original=(snapshot/'objects/hub-unimedgv/tea/peca-jornada.webp').read_bytes()
    rows=json.loads((snapshot/'objects-hub-unimedgv.json').read_text(encoding='utf-8'))['result']
    row=next(r for r in rows if r['key']=='tea/peca-jornada.webp')
    require(hashlib.md5(original).hexdigest()==row['etag'] and len(original)==row['size'],'ARCHIVE_SOURCE_CHANGED')
    manifest={'source_bucket':'hub-unimedgv','source_key':row['key'],'sha256':sha(original),'bytes':len(original),'http_metadata':row['http_metadata'],'custom_metadata':row['custom_metadata'],'storage_class':row['storage_class'],'archive_bucket':BUCKET,'archive_key':KEY}
    manifest_raw=(json.dumps(manifest,ensure_ascii=False,sort_keys=True,indent=2)+'\n').encode()
    for key,blob,content_type in ((KEY,original,'image/webp'),(MANIFEST_KEY,manifest_raw,'application/json')):
        path=BASE+'/objects/'+key;existing=request(path)
        if existing is not None:require(existing==blob,'ARCHIVE_EXISTING_OBJECT_DIFFERS')
        else:
            print(json.dumps({'event':'archive_put_attempt','key':key,'sha256':sha(blob),'bytes':len(blob)}),flush=True)
            request(path,'PUT',blob,{'Content-Type':content_type,'cf-r2-storage-class':'Standard'})
        require(request(path)==blob,'ARCHIVE_READBACK_DIFFERS')
    receipt={**manifest,'manifest_key':MANIFEST_KEY,'manifest_sha256':sha(manifest_raw),'verified_private':True,'verified_readback':True}
    (snapshot/'remote-preview-archive.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'event':'archive_verified','bucket':BUCKET,'key':KEY,'sha256':sha(original),'bytes':len(original),'manifest_sha256':sha(manifest_raw)}),flush=True)

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--snapshot',type=Path,required=True);args=parser.parse_args()
    warnings.simplefilter('error',getpass.GetPassWarning);token=getpass.getpass('HUB_ARCHIVE_CREDENTIAL_READY> ')
    original=socket.getaddrinfo
    socket.getaddrinfo=lambda host,port,family=0,type=0,proto=0,flags=0:original(host,port,socket.AF_INET if host=='api.cloudflare.com' else family,type,proto,flags)
    try:run(token,args.snapshot)
    except Exception as error:
        print(json.dumps({'stopped':str(error).replace(token,'[redigido]'),'no_automatic_retry':True}));raise SystemExit(1) from None
    finally:token=None;socket.getaddrinfo=original

if __name__=='__main__':main()
