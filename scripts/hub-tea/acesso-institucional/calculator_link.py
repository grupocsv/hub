"""Acrescenta somente o acesso à calculadora no cabeçalho do Hub protegido."""
import argparse,copy,getpass,json,shutil,socket,warnings
from pathlib import Path
from build import ScriptBlocks,sha
from card_labels import LabelsRelease
from release import R2,index_headers,require

HERE=Path(__file__).resolve().parent
SOURCE_SHA='5aa0a09648103d7cd04d2083fe746b2285657ffb1a0ac4882a121f2b1ce39214'
DESTINATION='https://open.grupocsv.com/esc-tea-100'
STYLE='''<!-- HUB-TEA-CALCULADORA:BEGIN --><style>
.topo{display:grid;grid-template-columns:1fr auto auto;gap:24px}
.topo .calculadora-link{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:44px;padding:10px 15px;border:1px solid #c6d5c8;border-radius:12px;background:rgba(255,253,248,.8);color:var(--verde);font:600 13px/1.4 var(--fb);text-decoration:none;transition:background .18s,border-color .18s}
.calculadora-link svg{width:19px;height:19px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.topo .calculadora-link:hover{background:#eef4eb;border-color:#8faa94}
.topo .calculadora-link:focus-visible{outline:3px solid var(--verde2);outline-offset:4px}
@media(max-width:640px){.topo{grid-template-columns:1fr auto;column-gap:16px;row-gap:18px}.topo .calculadora-link{grid-column:1/-1;grid-row:2;justify-self:center;max-width:100%}}
@media(prefers-reduced-motion:reduce){.topo .calculadora-link{transition:none}}
</style><!-- HUB-TEA-CALCULADORA:END -->'''
LINK='''  <a class="calculadora-link" href="https://open.grupocsv.com/esc-tea-100" target="_blank" rel="noopener" aria-label="Calculadora ESC-TEA-100 (abre em nova aba)">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5v3.5M8.5 18h.01M12 18h.01"/></svg>
    <span>Calculadora ESC-TEA-100</span>
  </a>
'''
ANCHOR='  <img class="evs rv" src="marca-evs.webp" width="420" height="261" alt="Escritório de Valor em Saúde">'

def transform(raw):
 require(sha(raw)==SOURCE_SHA,'SOURCE_VERSION_CHANGED')
 original=raw.decode('utf-8')
 require(original.count(ANCHOR)==1 and original.count('</head>')==1,'HEADER_ANCHOR_CHANGED')
 text=original.replace(ANCHOR,LINK+ANCHOR,1).replace('</head>',STYLE+'\n</head>',1)
 require(text.replace(LINK,'',1).replace(STYLE+'\n','',1)==original,'UNRELATED_HTML_CHANGED')
 require(ScriptBlocks(text).blocks==ScriptBlocks(original).blocks,'SCRIPTS_CHANGED')
 return text.encode('utf-8')

def build(source,output):
 raw=(source/'index.html').read_bytes();html=transform(raw)
 output.mkdir(parents=True,exist_ok=True)
 for item in source.iterdir():
  if item.is_file() and item.suffix not in ('.json',):shutil.copy2(item,output/item.name)
 (output/'index.html').write_bytes(html)
 manifest={'source_html_sha256':sha(raw),'output_html_sha256':sha(html),'source_bytes':len(raw),'output_bytes':len(html),'object_writes':['tea/index.html'],'scripts_unchanged':True,'existing_links_unchanged':True,'added_destination':DESTINATION,'worker_unchanged':True,'legacy_preview_unchanged':True}
 (output/'calculator-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');print(json.dumps(manifest))

class CalculatorRelease(LabelsRelease):
 def __init__(self,token,base,labels,snapshot,state):
  super().__init__(token,base,snapshot,state)
  super().apply_package(labels)
 def apply_calculator(self,update):
  approved=json.loads((HERE/'calculator-approved.json').read_text(encoding='utf-8'))
  require(json.loads((update/'calculator-manifest.json').read_text(encoding='utf-8'))==approved,'UNAPPROVED_CALCULATOR')
  require(sha(self.html)==approved['source_html_sha256'],'CALCULATOR_BASELINE_CHANGED')
  new=(update/'index.html').read_bytes()
  require(sha(new)==approved['output_html_sha256'] and new==transform(self.html),'CALCULATOR_BUILD_CHANGED')
  backup=self.state/'before-calculator.html'
  if backup.exists():require(backup.read_bytes()==self.html,'CALCULATOR_BACKUP_CHANGED')
  else:backup.write_bytes(self.html)
  self.html=new;self.manifest=copy.deepcopy(self.manifest);self.manifest['output_html_sha256']=approved['output_html_sha256']
 def publish_calculator(self,update):
  self.verify();self.apply_calculator(update)
  self.log('calculator_put_attempt',sha256=sha(self.html))
  row=next(row for row in self.manifest['original_objects'] if row['key']=='tea/index.html')
  self.request(R2+'/objects/tea/index.html','PUT',self.html,index_headers(row));self.verify()

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('action',choices=['build','preflight','publish','verify'])
 parser.add_argument('--source-package',type=Path,required=True);parser.add_argument('--output',type=Path,required=True)
 parser.add_argument('--base-package',type=Path);parser.add_argument('--snapshot',type=Path);parser.add_argument('--state',type=Path);args=parser.parse_args()
 if args.action=='build':return build(args.source_package,args.output)
 require(args.base_package and args.snapshot and args.state,'PRIVATE_PATHS_REQUIRED')
 warnings.simplefilter('error',getpass.GetPassWarning);token=getpass.getpass('HUB_CALCULATOR_CREDENTIAL_READY> ')
 dns=socket.getaddrinfo;socket.getaddrinfo=lambda host,port,family=0,type=0,proto=0,flags=0:dns(host,port,socket.AF_INET if host=='api.cloudflare.com' else family,type,proto,flags)
 release=None
 try:
  release=CalculatorRelease(token,args.base_package,args.source_package,args.snapshot,args.state)
  if args.action=='publish':release.publish_calculator(args.output)
  elif args.action=='preflight':release.verify();release.apply_calculator(args.output);release.log('calculator_preflight_verified',sha256=sha(release.html))
  else:release.apply_calculator(args.output);release.verify()
 except Exception as error:print(json.dumps({'error':str(error).replace(token,'[redigido]'),'no_automatic_retry':True}));raise SystemExit(1) from None
 finally:
  if release:release.token=None
  token=None;socket.getaddrinfo=dns

if __name__=='__main__':main()
