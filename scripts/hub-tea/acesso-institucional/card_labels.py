"""Padroniza somente os rótulos dos cards do Hub já protegido."""
import argparse,copy,getpass,json,shutil,socket,warnings
from pathlib import Path
from build import PREVIEW,ScriptBlocks,sha
from release import Release,R2,index_headers,require

HERE=Path(__file__).resolve().parent
SOURCE_SHA='86a36a1b6cbfa525a80e29db08e8e63370afbaa88ca7757e17d030612d9a6bd7'
STYLE='<!-- HUB-TEA-RESTRITO:BEGIN --><style>.p1 .restr{color:#ffc07f}.p1 .restr svg{stroke:currentColor}.p2 .peca-f{padding-top:24px}@media(max-width:600px){.p2 .peca-f{padding-top:0}}</style><!-- HUB-TEA-RESTRITO:END -->'

def transform(raw):
 require(sha(raw)==SOURCE_SHA,'SOURCE_VERSION_CHANGED')
 original=raw.decode('utf-8');text=original
 start=text.index('<span class="restr">');badge=text[start:text.index('</span>',start)+7]
 require(text.count(badge)==2,'ORIGINAL_BADGES_CHANGED')
 insertions=[]
 for card,url in [('p1','caminhos-brilhantes'),('p2','jornada-tea')]:
  before=f'<a class="porta {card} rv" href="https://open.grupocsv.com/{url}/" target="_blank" rel="noopener">'
  require(text.count(before)==1,'CARD_LINK_CHANGED')
  after=before+'\n      '+badge;insertions.append((before,after));text=text.replace(before,after,1)
 start=PREVIEW.index('<span class="jornada-acesso">');label=PREVIEW[start:PREVIEW.index('</span>',start)+7]
 require(text.count(label)==1,'PREVIEW_LABEL_CHANGED')
 text=text.replace(label,'',1).replace('</head>',STYLE+'\n</head>',1)
 restored=text.replace(STYLE+'\n','',1)
 # Reversão literal prova que scripts, destinos e os outros cards não mudaram.
 for before,after in insertions:restored=restored.replace(after,before,1)
 empty='            \n          </span>'
 require(restored.count(empty)==1,'PREVIEW_ANCHOR_CHANGED')
 restored=restored.replace(empty,'            '+label+'\n          </span>',1)
 require(restored==original,'UNRELATED_HTML_CHANGED')
 require(ScriptBlocks(text).blocks==ScriptBlocks(original).blocks,'SCRIPTS_CHANGED')
 require(text.count(badge)==4 and 'Acesso institucional' not in text,'BADGES_INCOMPLETE')
 return text.encode('utf-8')

def build(source,output):
 raw=(source/'index.html').read_bytes();html=transform(raw)
 output.mkdir(parents=True,exist_ok=True)
 for item in source.iterdir():
  if item.is_file() and item.name!='build-manifest.json':shutil.copy2(item,output/item.name)
 (output/'index.html').write_bytes(html)
 manifest={'source_html_sha256':sha(raw),'output_html_sha256':sha(html),'source_bytes':len(raw),'output_bytes':len(html),'object_writes':['tea/index.html'],'scripts_unchanged':True,'links_unchanged':True,'badges':4,'worker_unchanged':True,'legacy_preview_unchanged':True}
 (output/'card-labels-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');print(json.dumps(manifest))

class LabelsRelease(Release):
 def request(self,path,method='GET',body=None,headers=None):
  require(method=='GET' or (method=='PUT' and path==R2+'/objects/tea/index.html'),'LABELS_WRITE_TARGET_REFUSED')
  return super().request(path,method,body,headers)
 def apply_package(self,update):
  approved=json.loads((HERE/'card-labels-approved.json').read_text(encoding='utf-8'))
  require(json.loads((update/'card-labels-manifest.json').read_text(encoding='utf-8'))==approved,'UNAPPROVED_LABELS')
  require(sha(self.html)==approved['source_html_sha256'],'LABELS_BASELINE_CHANGED')
  new=(update/'index.html').read_bytes();require(sha(new)==approved['output_html_sha256'] and new==transform(self.html),'LABELS_BUILD_CHANGED')
  backup=self.state/'before-labels.html'
  if backup.exists():require(backup.read_bytes()==self.html,'LABELS_BACKUP_CHANGED')
  else:backup.write_bytes(self.html)
  self.html=new;self.manifest=copy.deepcopy(self.manifest);self.manifest['output_html_sha256']=approved['output_html_sha256']
 def publish_labels(self,update):
  self.verify();self.apply_package(update)
  self.log('labels_put_attempt',sha256=sha(self.html))
  row=next(row for row in self.manifest['original_objects'] if row['key']=='tea/index.html')
  self.request(R2+'/objects/tea/index.html','PUT',self.html,index_headers(row));self.verify()

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['build','preflight','publish','verify']);parser.add_argument('--source-package',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--snapshot',type=Path);parser.add_argument('--state',type=Path);args=parser.parse_args()
 if args.action=='build':return build(args.source_package,args.output)
 require(args.snapshot and args.state,'PRIVATE_PATHS_REQUIRED')
 warnings.simplefilter('error',getpass.GetPassWarning);token=getpass.getpass('HUB_LABELS_CREDENTIAL_READY> ')
 dns=socket.getaddrinfo;socket.getaddrinfo=lambda host,port,family=0,type=0,proto=0,flags=0:dns(host,port,socket.AF_INET if host=='api.cloudflare.com' else family,type,proto,flags)
 release=None
 try:
  release=LabelsRelease(token,args.source_package,args.snapshot,args.state)
  if args.action=='publish':release.publish_labels(args.output)
  elif args.action=='preflight':release.verify();release.apply_package(args.output);release.log('labels_preflight_verified',sha256=sha(release.html))
  else:release.apply_package(args.output);release.verify()
 except Exception as error:print(json.dumps({'error':str(error).replace(token,'[redigido]'),'no_automatic_retry':True}));raise SystemExit(1) from None
 finally:
  if release:release.token=None
  token=None;socket.getaddrinfo=dns

if __name__=='__main__':main()
