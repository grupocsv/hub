"""Release restrita: Worker existente + tea/index.html; nenhuma exclusão ou migração."""
import argparse,copy,getpass,hashlib,json,re,socket,urllib.request,urllib.parse,urllib.error,warnings
from pathlib import Path
from datetime import datetime,timezone
from email.parser import BytesParser
from email.policy import default
from build import normalize_public
ACCOUNT='da0c29123f448f3c3892f784cd9f7cac'
API='https://api.cloudflare.com/client/v4'
WORKER=f'/accounts/{ACCOUNT}/workers/scripts/hub-unimedgv'
R2=f'/accounts/{ACCOUNT}/r2/buckets/hub-unimedgv'
KV=f'/accounts/{ACCOUNT}/storage/kv/namespaces/d5f5d3f2a5644b3e96a3f81e50aaaf35/values/page%3Atea'
HERE=Path(__file__).resolve().parent
MAP='https://open.grupocsv.com/jornada-tea/mapa-jornada-04689f954dadd0f5.png'
CONFIG_FIELDS={'placement','compatibility_date','compatibility_flags','usage_model','tags','tail_consumers','logpush','observability','limits'}
KNOWN_SETTINGS=CONFIG_FIELDS|{'bindings','annotations'}
WORKER_DOMAINS=f'/accounts/{ACCOUNT}/workers/domains'
def sha(b):return hashlib.sha256(b).hexdigest()
def require(ok,message):
 if not ok:raise ValueError(message)

def upload_metadata(settings):
 require(not (set(settings)-KNOWN_SETTINGS),'UNKNOWN_SETTINGS_REVIEW_REQUIRED')
 bindings=settings.get('bindings',[])
 require(len({b['name'] for b in bindings})==len(bindings),'DUPLICATE_BINDINGS')
 result={key:copy.deepcopy(settings[key]) for key in CONFIG_FIELDS if key in settings and settings[key] is not None}
 result.update(main_module='worker.mjs',bindings=[copy.deepcopy(b) for b in bindings if not b['type'].startswith('secret_')])
 keep=sorted({b['type'] for b in bindings if b['type'].startswith('secret_')})
 if keep:result['keep_bindings']=keep
 return result

def index_headers(row):
 # This endpoint is used only for the reviewed object with no custom metadata.
 # Any future metadata needs an explicit, verified preservation strategy.
 require(row.get('http_metadata')=={'contentType':'text/html'},'INDEX_HTTP_METADATA_REVIEW_REQUIRED')
 require(row.get('custom_metadata')=={},'INDEX_CUSTOM_METADATA_REVIEW_REQUIRED')
 require(row.get('storage_class')=='Standard','INDEX_STORAGE_CLASS_REVIEW_REQUIRED')
 return {'Content-Type':'text/html','cf-r2-storage-class':'Standard'}
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
class Release:
 def __init__(self,token,package,snapshot,state):
  self.token=token;self.package=package;self.snapshot=snapshot;self.state=state
  self.state.mkdir(parents=True,exist_ok=True);self.opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect)
  self.manifest=json.loads((package/'build-manifest.json').read_text(encoding='utf-8'))
  approved=json.loads((HERE/'approved-output.json').read_text(encoding='utf-8'))
  require(self.manifest==approved,'UNAPPROVED_PACKAGE')
  self.html=(package/'index.html').read_bytes();require(sha(self.html)==approved['output_html_sha256'],'LOCAL_HTML_CHANGED')
  self.original=(snapshot/'objects/hub-unimedgv/tea/index.html').read_bytes();require(sha(self.original)==approved['source_html_sha256'],'BACKUP_CHANGED')
  self.modules={'worker.mjs':(HERE/'worker.mjs').read_bytes(),'production/hub-unimedgv-20260921.mjs':(HERE/'production/hub-unimedgv-20260921.mjs').read_bytes()}
  require(sha(self.modules['production/hub-unimedgv-20260921.mjs'])==approved['worker_baseline_sha256'],'BASELINE_MODULE_CHANGED')
  require(sha(self.modules['worker.mjs'])==approved['wrapper_sha256'],'WRAPPER_CHANGED')
 def log(self,event,**data):
  record={'time':datetime.now(timezone.utc).isoformat(),'event':event,**data}
  with (self.state/'events.jsonl').open('a',encoding='utf-8') as f:f.write(json.dumps(record,ensure_ascii=False)+'\n')
  print(json.dumps(record,ensure_ascii=False),flush=True)
 def request(self,path,method='GET',body=None,headers=None):
  permitted=path.startswith((WORKER,R2,KV)) or (method=='GET' and (path in ('/zones?name=unimedgv.com',WORKER_DOMAINS) or re.fullmatch(r'/zones/[a-f0-9]{32}/workers/routes',path))) or (method=='POST' and re.fullmatch(r'/zones/[a-f0-9]{32}/purge_cache',path))
  require(permitted,'API_TARGET_REFUSED')
  if method=='PUT':require(path in (WORKER+'?bindings_inherit=strict',R2+'/objects/tea/index.html'),'WRITE_TARGET_REFUSED')
  elif method=='POST':require(re.fullmatch(r'/zones/[a-f0-9]{32}/purge_cache',path),'POST_TARGET_REFUSED')
  else:require(method=='GET','METHOD_REFUSED')
  req=urllib.request.Request(API+path,data=body,method=method,headers={'Authorization':'Bearer '+self.token,**(headers or {})})
  try:
   with self.opener.open(req,timeout=60) as r:
    chunks=[]
    while chunk:=r.read(262144):chunks.append(chunk)
    return b''.join(chunks),dict(r.headers)
  except urllib.error.HTTPError as e:raise RuntimeError('API_HTTP_'+str(e.code)) from None
 def data(self,path):
  raw,_=self.request(path);result=json.loads(raw);require(result.get('success'),'API_NOT_SUCCESS');return result['result']
 def object(self,key):return self.request(R2+'/objects/'+urllib.parse.quote(key,safe=''))[0]
 def settings(self):
  current=self.data(WORKER+'/settings')
  original=json.loads((self.snapshot/'settings.sanitized.json').read_text(encoding='utf-8'))
  require(not (set(current)-KNOWN_SETTINGS),'UNKNOWN_SETTINGS_REVIEW_REQUIRED')
  require(not (set(original)-KNOWN_SETTINGS),'UNKNOWN_BASELINE_SETTINGS')
  for key in CONFIG_FIELDS|{'bindings'}:
   require(current.get(key)==original.get(key),'WORKER_SETTINGS_CHANGED:'+key)
  return current
 def zone(self):
  zones=self.data('/zones?name=unimedgv.com');require(len(zones)==1 and zones[0]['account']['id']==ACCOUNT,'ZONE_AMBIGUOUS')
  return zones[0]['id']
 def runtime_invariants(self):
  zone=self.zone()
  routes=self.data('/zones/'+zone+'/workers/routes')
  domains=self.data(WORKER_DOMAINS)
  require(isinstance(domains,list),'WORKER_DOMAINS_INVALID')
  return {'schedules':self.data(WORKER+'/schedules'),'subdomain':self.data(WORKER+'/subdomain'),'zone_id':zone,'routes':sorted((r for r in routes if r.get('script')=='hub-unimedgv'),key=lambda r:r['id']),'custom_domains':sorted((r for r in domains if r.get('service')=='hub-unimedgv'),key=lambda r:r['id'])}
 def snapshot_invariants(self):
  self.settings();current=self.modules_now()
  require(len(current)==1 and sha(next(iter(current.values())))==self.manifest['worker_baseline_sha256'],'WORKER_BASELINE_CHANGED')
  path=self.snapshot/'runtime-invariants.json';require(not path.exists(),'RUNTIME_SNAPSHOT_ALREADY_EXISTS')
  payload=json.dumps(self.runtime_invariants(),ensure_ascii=False,sort_keys=True,indent=2)+'\n'
  path.write_text(payload,encoding='utf-8');self.log('runtime_snapshot_saved',sha256=sha(payload.encode()))
 def check_invariants(self):
  before=json.loads((self.snapshot/'runtime-invariants.json').read_text(encoding='utf-8'))
  require(self.runtime_invariants()==before,'RUNTIME_INVARIANTS_CHANGED')
 def inventory(self,after=False):
  raw,_=self.request(R2+'/objects?per_page=1000');result=json.loads(raw)
  require(result.get('success') and not result.get('result_info',{}).get('is_truncated'),'INVENTORY_INCOMPLETE')
  current={r['key']:r for r in result['result'] if r['key'].startswith('tea/')}
  before={r['key']:r for r in self.manifest['original_objects']}
  require(set(current)==set(before),'TEA_OBJECT_SET_CHANGED')
  for key,row in current.items():
   for field in ('http_metadata','custom_metadata','storage_class'):
    require(row.get(field)==before[key].get(field),'OBJECT_METADATA_CHANGED:'+key+':'+field)
   if key=='tea/index.html' and after:continue
   require(row['etag']==before[key]['etag'] and row['size']==before[key]['bytes'],'UNEXPECTED_OBJECT_CHANGE:'+key)
  meta=json.loads(self.request(KV)[0]);original=json.loads((self.snapshot/'metadata-PAGES_KV.json').read_text(encoding='utf-8'))
  require(meta==original,'PAGE_METADATA_CHANGED')
  index_headers(current['tea/index.html'])
 def probe(self,url,status,location=None):
  for method in ('GET','HEAD'):
   request=urllib.request.Request(url,method=method,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'})
   try:
    with self.opener.open(request,timeout=45) as r:code=r.status;headers=r.headers;body=r.read(262144)
   except urllib.error.HTTPError as e:code=e.code;headers=e.headers;body=e.read(262144)
   require(code==status,'PUBLIC_STATUS_MISMATCH:'+str(code)+':'+url)
   require('no-store' in headers.get('Cache-Control',''),'PUBLIC_CACHE_NOT_DISABLED')
   require(headers.get('X-TEA-Access')=='required','PUBLIC_GATE_NOT_IDENTIFIED')
   if location:require(headers.get('Location')==location and not body,'LEGACY_REDIRECT_CHANGED')
   require(not body.startswith((b'\x89PNG',b'RIFF')),'PUBLIC_IMAGE_EXPOSED')
 def modules_now(self):
  raw,headers=self.request(WORKER);ctype=next((v for k,v in headers.items() if k.lower()=='content-type'),'')
  if 'multipart/' not in ctype:return {'index.js':raw}
  msg=BytesParser(policy=default).parsebytes(('Content-Type: '+ctype+'\r\n\r\n').encode()+raw)
  return {(part.get_filename() or part.get_param('name',header='content-disposition')):part.get_payload(decode=True) for part in msg.iter_parts()}
 def preflight(self):
  self.settings();self.check_invariants();self.inventory();self.probe(MAP,401)
  require(sha(self.object('tea/index.html'))==self.manifest['source_html_sha256'],'ORIGIN_HTML_CHANGED')
  current=self.modules_now();require(len(current)==1 and sha(next(iter(current.values())))==self.manifest['worker_baseline_sha256'],'WORKER_BASELINE_CHANGED')
  versions=self.data(WORKER+'/deployments')['deployments'][0]['versions'];require(versions==[{'version_id':self.manifest['baseline_version'],'percentage':100}],'WORKER_ACTIVE_VERSION_CHANGED')
  managed=self.data(R2+'/domains/managed');custom=self.data(R2+'/domains/custom')
  require(not managed.get('enabled'),'PUBLIC_R2_DEV_ENABLED')
  domains=custom.get('domains',[]) if isinstance(custom,dict) else custom
  require(not any(row.get('enabled',True) for row in domains),'PUBLIC_R2_CUSTOM_DOMAIN_ENABLED')
  (self.state/'preflight.json').write_text(json.dumps({'ready':True,'baseline_version':self.manifest['baseline_version'],'source_html_sha256':self.manifest['source_html_sha256'],'bucket_public_domains_disabled':True})+'\n')
  self.log('preflight_verified',bucket_public_domains_disabled=True)
 def publish_worker(self):
  self.preflight();settings=self.settings()
  boundary='----GrupoCSVHubTeaProtected20260921'
  metadata=upload_metadata(settings)
  parts=[]
  def part(name,body,ctype,filename=None):
   disposition='form-data; name="'+name+'"'+('; filename="'+filename+'"' if filename else '')
   parts.append(('--'+boundary+'\r\nContent-Disposition: '+disposition+'\r\nContent-Type: '+ctype+'\r\n\r\n').encode()+body+b'\r\n')
  part('metadata',json.dumps(metadata).encode(),'application/json')
  for name,body in self.modules.items():part(name,body,'application/javascript+module',name)
  payload=b''.join(parts)+('--'+boundary+'--\r\n').encode()
  self.log('worker_put_attempt',wrapper_sha256=self.manifest['wrapper_sha256'])
  self.request(WORKER+'?bindings_inherit=strict','PUT',payload,{'Content-Type':'multipart/form-data; boundary='+boundary})
  self.verify_worker()
 def verify_worker(self):
  require(self.modules_now()==self.modules,'DEPLOYED_MODULES_DIFFER')
  self.settings();self.check_invariants();self.probe('https://hub.unimedgv.com/tea/peca-jornada.webp',302,MAP);self.probe(MAP,401)
  active=self.data(WORKER+'/deployments')['deployments'][0]['versions']
  self.log('worker_verified',active_versions=active)
 def publish_page(self):
  self.verify_worker();self.inventory();require(sha(self.object('tea/index.html'))==self.manifest['source_html_sha256'],'ORIGIN_HTML_CHANGED')
  self.log('page_put_attempt',sha256=self.manifest['output_html_sha256'])
  original=next(row for row in self.manifest['original_objects'] if row['key']=='tea/index.html')
  self.request(R2+'/objects/tea/index.html','PUT',self.html,index_headers(original))
  self.verify()
 def verify(self):
  self.verify_worker();self.inventory(after=True);require(self.object('tea/index.html')==self.html,'PUBLISHED_HTML_DIFFERS')
  for row in self.manifest['original_objects']:
   if row['key']=='tea/index.html':continue
   require(sha(self.object(row['key']))==row['sha256'],'ORIGINAL_OBJECT_CHANGED:'+row['key'])
  request=urllib.request.Request('https://hub.unimedgv.com/tea/',headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'})
  with self.opener.open(request,timeout=45) as response:public=response.read(500000)
  require(normalize_public(public)==self.html,'PUBLIC_HTML_DIFFERS')
  self.log('release_verified',output_html_sha256=self.manifest['output_html_sha256'],metadata_unchanged=True,other_objects_unchanged=True)
 def purge(self):
  self.verify_worker();zone=self.zone()
  files=['https://hub.unimedgv.com/tea/','https://hub.unimedgv.com/tea/index.html','https://hub.unimedgv.com/tea/peca-jornada.webp','https://hub.unimedgv.com/tea/peca-jornada.webp/']
  self.log('purge_attempt',files=files)
  raw,_=self.request('/zones/'+zone+'/purge_cache','POST',json.dumps({'files':files}).encode(),{'Content-Type':'application/json'})
  require(json.loads(raw).get('success'),'PURGE_NOT_CONFIRMED');self.log('purge_verified',files=files)
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['snapshot-invariants','preflight','publish-worker','verify-worker','publish-page','verify','purge']);parser.add_argument('--package',type=Path,required=True);parser.add_argument('--snapshot',type=Path,required=True);parser.add_argument('--state',type=Path,required=True);args=parser.parse_args()
 warnings.simplefilter('error',getpass.GetPassWarning);token=getpass.getpass('HUB_RELEASE_CREDENTIAL_READY> ')
 original=socket.getaddrinfo
 socket.getaddrinfo=lambda host,port,family=0,type=0,proto=0,flags=0:original(host,port,socket.AF_INET if host=='api.cloudflare.com' else family,type,proto,flags)
 try:getattr(Release(token,args.package,args.snapshot,args.state),args.action.replace('-','_'))()
 except Exception as e:print(json.dumps({'error':str(e).replace(token,'[redigido]'),'no_automatic_retry':True}));raise SystemExit(1) from None
 finally:token=None;socket.getaddrinfo=original
if __name__=='__main__':main()
