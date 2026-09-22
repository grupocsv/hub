"""Read-only scoped collection. Credentials remain only in memory."""
import getpass,json,os,re,urllib.request,urllib.parse,warnings
from pathlib import Path
from email.parser import BytesParser
from email.policy import default
ACCOUNT='da0c29123f448f3c3892f784cd9f7cac'
ROOT=Path(os.environ['LOCALAPPDATA'])/'GrupoCSV/PortaisArquivo/clavs-2026-09-21/hub-unimedgv'
ROOT.mkdir(parents=True,exist_ok=True)
warnings.simplefilter('error',getpass.GetPassWarning)
credential=json.loads(getpass.getpass('HUB_READ_ONLY_CREDENTIAL_READY> '))
assert credential.get('account')==ACCOUNT
TOKEN=credential['token'];credential.clear()
def request(path):
 assert path.startswith('/accounts/'+ACCOUNT+'/')
 req=urllib.request.Request('https://api.cloudflare.com/client/v4'+path,headers={'Authorization':'Bearer '+TOKEN})
 with urllib.request.urlopen(req,timeout=60) as r:
  chunks=[]
  while chunk:=r.read(262144):chunks.append(chunk)
  return b''.join(chunks),dict(r.headers)
def data(path):
 raw,_=request(path);payload=json.loads(raw);assert payload.get('success'), 'API did not confirm success';return payload['result']
def save(name,value):
 (ROOT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
base='/accounts/'+ACCOUNT+'/workers/scripts/hub-unimedgv'
settings=data(base+'/settings')
for binding in settings.get('bindings',[]):
 if binding.get('type')=='secret_text' or re.search('PASSWORD|TOKEN|SECRET',binding.get('name',''),re.I):
  for key in ('text','value','secret'):binding.pop(key,None)
  binding['value_redacted']=True
save('settings.sanitized.json',settings)
save('deployments.json',data(base+'/deployments'))
raw,headers=request(base)
content_type=next((v for k,v in headers.items() if k.lower()=='content-type'),'')
if 'multipart/' in content_type:
 msg=BytesParser(policy=default).parsebytes(('Content-Type: '+content_type+'\r\n\r\n').encode()+raw)
 for part in msg.iter_parts():
  name=part.get_filename() or part.get_param('name',header='content-disposition')
  assert name and not Path(name).is_absolute() and '..' not in Path(name).parts
  target=ROOT/'modules'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(part.get_payload(decode=True))
else:
 target=ROOT/'modules/index.js';target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
resources=[]
for binding in settings.get('bindings',[]):
 if binding.get('type')=='r2_bucket':
  bucket=binding['bucket_name'];path='/accounts/'+ACCOUNT+'/r2/buckets/'+urllib.parse.quote(bucket,safe='')+'/objects?per_page=1000'
  raw,_=request(path);result=json.loads(raw);assert result.get('success');objects=result['result'];save('objects-'+bucket+'.json',result)
  resources.append({'type':'r2','name':binding['name'],'bucket':bucket,'objects':len(objects)})
  for obj in objects:
   key=obj['key']
   if key.startswith(('tea/','pages/tea/')):
    body,_=request('/accounts/'+ACCOUNT+'/r2/buckets/'+urllib.parse.quote(bucket,safe='')+'/objects/'+urllib.parse.quote(key,safe=''))
    target=(ROOT/'objects'/bucket/key).resolve();assert target.is_relative_to((ROOT/'objects').resolve());target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(body)
 if binding.get('type')=='kv_namespace':
  namespace=binding['namespace_id'];path='/accounts/'+ACCOUNT+'/storage/kv/namespaces/'+namespace+'/values/'+urllib.parse.quote('page:tea',safe='')
  try:
   raw,_=request(path);meta=json.loads(raw);save('metadata-'+binding['name']+'.json',meta);resources.append({'type':'kv','name':binding['name'],'teaMetadata':True})
  except urllib.error.HTTPError as e:resources.append({'type':'kv','name':binding['name'],'teaMetadataStatus':e.code})
print(json.dumps({'snapshot':str(ROOT),'resources':resources,'modules':[str(p.relative_to(ROOT/'modules')) for p in (ROOT/'modules').rglob('*') if p.is_file()]},ensure_ascii=False),flush=True)
TOKEN=None
