"""Relaciona a calculadora à Jornada sem alterar conteúdos ou acesso."""
import argparse,copy,getpass,json,shutil,socket,warnings
from pathlib import Path
from build import ScriptBlocks,sha
from calculator_link import CalculatorRelease,STYLE as HEADER_STYLE,LINK as HEADER_LINK
from release import R2,index_headers,require

HERE=Path(__file__).resolve().parent
SOURCE_SHA='d9d0f9679fa2280daaa9a1ab6c01eccb486c20dd91e9d4821eac3ec795f35f81'
DESTINATION='https://open.grupocsv.com/esc-tea-100'
ANCHOR='    <a class="porta p2 rv" href="https://open.grupocsv.com/jornada-tea/" target="_blank" rel="noopener">'
STYLE='''<!-- HUB-TEA-ESC-RELACIONADO:BEGIN --><style>
.jornada-grupo{grid-column:6/13;display:flex;flex-direction:column;gap:14px;min-width:0}
.jornada-recurso{display:grid;grid-template-columns:22px minmax(0,1fr);gap:12px;padding:6px 18px 4px;color:var(--tinta)}
.jornada-recurso>svg{width:22px;height:22px;margin-top:2px;fill:none;stroke:var(--verde);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.jornada-recurso h3{font:600 16px/1.4 var(--fb)}
.jornada-recurso h3 span{display:block;margin-bottom:3px;color:var(--dim);font-size:10.5px;letter-spacing:1px}
.jornada-recurso p{margin-top:6px;color:var(--dim);font-size:13px;line-height:1.6;max-width:48ch}
.jornada-recurso a{display:inline-flex;align-items:center;min-height:44px;margin-top:3px;color:var(--verde);font-size:13px;font-weight:600;line-height:1.45;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.jornada-recurso a:hover{color:var(--verde2)}
.jornada-recurso a:focus-visible{outline:3px solid var(--verde2);outline-offset:4px;border-radius:3px}
@media(max-width:1020px){.jornada-grupo{grid-column:1/3}}
@media(max-width:600px){.jornada-grupo{gap:16px}.jornada-recurso{padding:4px 12px 8px;gap:10px}}
</style><!-- HUB-TEA-ESC-RELACIONADO:END -->'''
RESOURCE='''
      <aside class="jornada-recurso" aria-labelledby="esc-tea-recurso-titulo">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5v3.5M8.5 18h.01M12 18h.01"/></svg>
        <div>
          <h3 id="esc-tea-recurso-titulo"><span>ESC-TEA-100</span>Escore de Severidade Clínica</h3>
          <p>Reúne triagem, CARS e CBDF em um escore para apoiar a clusterização.</p>
          <a href="https://open.grupocsv.com/esc-tea-100" target="_blank" rel="noopener" aria-label="Abrir calculadora e metodologia (abre em nova aba)">Abrir calculadora e metodologia</a>
        </div>
      </aside>
    </div>'''

def transform(raw):
 require(sha(raw)==SOURCE_SHA,'SOURCE_VERSION_CHANGED')
 original=raw.decode('utf-8')
 require(original.count(HEADER_LINK)==1 and original.count(HEADER_STYLE)==1,'HEADER_VERSION_CHANGED')
 text=original.replace(HEADER_LINK,'',1).replace(HEADER_STYLE+'\n','',1)
 require(text.count(ANCHOR)==1,'JORNADA_CARD_CHANGED')
 start=text.index(ANCHOR);end=text.index('</a>',start)+4;card=text[start:end]
 group='    <div class="jornada-grupo">\n'+card+RESOURCE
 text=text[:start]+group+text[end:]
 text=text.replace('</head>',STYLE+'\n</head>',1)
 restored=text.replace(group,card,1).replace(STYLE+'\n','',1)
 require(restored==original.replace(HEADER_LINK,'',1).replace(HEADER_STYLE+'\n','',1),'UNRELATED_HTML_CHANGED')
 require(ScriptBlocks(text).blocks==ScriptBlocks(original).blocks,'SCRIPTS_CHANGED')
 require(text.count(DESTINATION)==1 and text.count('class="restr"')==4,'LINK_OR_CARD_CHANGED')
 return text.encode('utf-8')

def build(source,output):
 raw=(source/'index.html').read_bytes();html=transform(raw);output.mkdir(parents=True,exist_ok=True)
 for item in source.iterdir():
  if item.is_file() and item.suffix!='.json':shutil.copy2(item,output/item.name)
 (output/'index.html').write_bytes(html)
 manifest={'source_html_sha256':sha(raw),'output_html_sha256':sha(html),'source_bytes':len(raw),'output_bytes':len(html),'object_writes':['tea/index.html'],'scripts_unchanged':True,'card_content_unchanged':True,'destination':DESTINATION,'placement':'after-jornada-card','worker_unchanged':True,'legacy_preview_unchanged':True}
 (output/'calculator-related-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');print(json.dumps(manifest))

class RelatedRelease(CalculatorRelease):
 def __init__(self,token,base,labels,header,snapshot,state):
  super().__init__(token,base,labels,snapshot,state);super().apply_calculator(header)
 def apply_related(self,update):
  approved=json.loads((HERE/'calculator-related-approved.json').read_text(encoding='utf-8'))
  require(json.loads((update/'calculator-related-manifest.json').read_text(encoding='utf-8'))==approved,'UNAPPROVED_RELATED')
  require(sha(self.html)==approved['source_html_sha256'],'RELATED_BASELINE_CHANGED')
  new=(update/'index.html').read_bytes();require(sha(new)==approved['output_html_sha256'] and new==transform(self.html),'RELATED_BUILD_CHANGED')
  backup=self.state/'before-related.html'
  if backup.exists():require(backup.read_bytes()==self.html,'RELATED_BACKUP_CHANGED')
  else:backup.write_bytes(self.html)
  self.html=new;self.manifest=copy.deepcopy(self.manifest);self.manifest['output_html_sha256']=approved['output_html_sha256']
 def publish_related(self,update):
  self.verify();self.apply_related(update);self.log('related_put_attempt',sha256=sha(self.html))
  row=next(row for row in self.manifest['original_objects'] if row['key']=='tea/index.html')
  self.request(R2+'/objects/tea/index.html','PUT',self.html,index_headers(row));self.verify()

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['build','preflight','publish','verify'])
 for name in ('source-package','output','base-package','labels-package','snapshot','state'):parser.add_argument('--'+name,type=Path,required=name in ('source-package','output'))
 args=parser.parse_args()
 if args.action=='build':return build(args.source_package,args.output)
 require(args.base_package and args.labels_package and args.snapshot and args.state,'PRIVATE_PATHS_REQUIRED')
 warnings.simplefilter('error',getpass.GetPassWarning);token=getpass.getpass('HUB_RELATED_CREDENTIAL_READY> ')
 dns=socket.getaddrinfo;socket.getaddrinfo=lambda host,port,family=0,type=0,proto=0,flags=0:dns(host,port,socket.AF_INET if host=='api.cloudflare.com' else family,type,proto,flags);release=None
 try:
  release=RelatedRelease(token,args.base_package,args.labels_package,args.source_package,args.snapshot,args.state)
  if args.action=='publish':release.publish_related(args.output)
  elif args.action=='preflight':release.verify();release.apply_related(args.output);release.log('related_preflight_verified',sha256=sha(release.html))
  else:release.apply_related(args.output);release.verify()
 except Exception as error:print(json.dumps({'error':str(error).replace(token,'[redigido]'),'no_automatic_retry':True}));raise SystemExit(1) from None
 finally:
  if release:release.token=None
  token=None;socket.getaddrinfo=dns

if __name__=='__main__':main()
