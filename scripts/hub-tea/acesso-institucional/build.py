"""Constrói prévia pública sem o mapa, preservando scripts/fluxos do Hub."""
import argparse,hashlib,importlib.util,json,re,shutil,subprocess
from pathlib import Path
from html.parser import HTMLParser
HERE=Path(__file__).resolve().parent
START='<!-- HUB-TEA-PREVIA-PROTEGIDA:BEGIN -->'
END='<!-- HUB-TEA-PREVIA-PROTEGIDA:END -->'
CSS=""".jornada-convite{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:30px 20px;min-height:210px;background:#fffdf8;text-align:center;border:1px solid #e7e2d5;border-radius:8px}.p2 .folha .jornada-convite img{width:210px;max-width:85%;height:auto;margin:auto}.jornada-convite .jornada-legenda{font-family:var(--fd);font-size:clamp(20px,2vw,28px);line-height:1.25;color:var(--tinta)}.jornada-convite .jornada-acesso{display:inline-flex;gap:7px;align-items:center;color:var(--dim);font-family:var(--fs);font-size:12px;line-height:1.4}.jornada-convite .jornada-acesso svg{width:14px;height:14px;stroke:currentColor}@media(max-width:600px){.jornada-convite{min-height:200px;padding:24px 18px;gap:16px}.jornada-convite .jornada-legenda{font-size:24px}}"""
PREVIEW="""<span class="peca peca-f">
        <span class="folha">
          <span class="jornada-convite" aria-hidden="true">
            <img src="marca-cb.svg" width="450" height="150" alt="" loading="lazy" decoding="async">
            <span class="jornada-legenda">Cada etapa do cuidado,<br>em um mesmo caminho.</span>
            <span class="jornada-acesso"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Acesso institucional</span>
          </span>
        </span>
      </span>"""
def sha(raw):return hashlib.sha256(raw).hexdigest()

class ScriptBlocks(HTMLParser):
    """Compara scripts como HTML, incluindo variações válidas de tag/fechamento."""
    def __init__(self,text):
        super().__init__(convert_charrefs=False)
        self.text=text;self.blocks=[];self.start=None;self.lines=[0]
        for position,char in enumerate(text):
            if char=='\n':self.lines.append(position+1)
        self.feed(text);self.close()
        if self.start is not None:self.blocks.append(text[self.start:])
    def offset(self):
        line,column=self.getpos();return self.lines[line-1]+column
    def handle_starttag(self,tag,attrs):
        if tag=='script':self.start=self.offset()
    def handle_endtag(self,tag):
        if tag=='script' and self.start is not None:
            end=self.text.index('>',self.offset())+1
            self.blocks.append(self.text[self.start:end]);self.start=None
    def handle_startendtag(self,tag,attrs):
        if tag=='script':self.blocks.append(self.get_starttag_text())
def normalize_public(raw):
    # Mesmo HTMLRewriter do Hub, mais o beacon versionado reconhecido.
    text=raw.decode('utf-8')
    text=re.sub(r'<script\b[^>]*src="https://static\.cloudflareinsights\.com/beacon\.min\.js/v[a-f0-9]{20,80}"[^>]*></script>\r?\n?', '', text)
    spec=importlib.util.spec_from_file_location('jornada_release_normalize',HERE.parents[1]/'open-pages/jornada-interativa/build.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module.normalize(text).encode()

def build(raw):
    source=raw.decode('utf-8')
    assert source.count('src="peca-jornada.webp"')==1,'Referência da prancha divergiu'
    pattern=r'<span class="peca peca-f">\s*<span class="folha">.*?</span>\s*</span>\s*</span>'
    matches=list(re.finditer(pattern,source,re.S))
    assert len(matches)==1 and 'peca-jornada.webp' in matches[0].group(),'Bloco da Jornada divergiu'
    found=matches[0]
    edited=source[:found.start()]+PREVIEW+source[found.end():]
    assert edited.count('</head>')==1
    style=START+'\n<style id="jornada-public-preview">'+CSS+'</style>\n'+END+'\n'
    edited=edited.replace('</head>',style+'</head>')
    assert 'peca-jornada.webp' not in edited
    assert ScriptBlocks(edited).blocks==ScriptBlocks(source).blocks,'Fluxo de scripts alterado'
    restored=edited.replace(style,'').replace(PREVIEW,found.group(),1)
    assert restored==source,'Conteúdo fora do escopo alterado'
    return edited.encode(),found.group()
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--snapshot',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    origin=args.snapshot/'objects/hub-unimedgv/tea';raw=(origin/'index.html').read_bytes()
    objects=json.loads((args.snapshot/'objects-hub-unimedgv.json').read_text(encoding='utf-8'))
    assert not objects.get('result_info',{}).get('is_truncated'),'Inventário incompleto'
    rows=[o for o in objects['result'] if o['key'].startswith('tea/')]
    inventory=[]
    for row in rows:
        body=(origin/row['key'].removeprefix('tea/')).read_bytes()
        assert hashlib.md5(body).hexdigest()==row['etag'],'Snapshot não confere com inventário: '+row['key']
        inventory.append({'key':row['key'],'bytes':len(body),'sha256':sha(body),'etag':row['etag'],**{key:row[key] for key in ('http_metadata','custom_metadata','storage_class')}})
    require_public=normalize_public((args.snapshot/'public-capture/tea/index.html').read_bytes())
    assert require_public==raw,'Captura pública diverge da origem R2'
    html,old=build(raw);args.output.mkdir(parents=True,exist_ok=True)
    for source in origin.iterdir():
        if source.name!='peca-jornada.webp':shutil.copy2(source,args.output/source.name)
    (args.output/'index.html').write_bytes(html)
    subprocess.run(['node',str(HERE/'render-safe-preview.mjs'),str(origin/'marca-cb.svg'),str(args.output/'peca-jornada.webp')],check=True)
    safe_preview=(args.output/'peca-jornada.webp').read_bytes()
    assert safe_preview[:4]==b'RIFF' and safe_preview[8:12]==b'WEBP','Prévia não é WebP'
    meta=json.loads((args.snapshot/'metadata-PAGES_KV.json').read_text(encoding='utf-8'))
    assert meta['file_count']==len(rows)
    worker=(HERE/'production/hub-unimedgv-20260921.mjs').read_bytes()
    assert worker==(args.snapshot/'modules/index.js').read_bytes()
    original_preview=next(row for row in inventory if row['key']=='tea/peca-jornada.webp')
    manifest={'worker':'hub-unimedgv','baseline_version':'6cd3fe16-8976-4ae9-8ff1-e0ffce368637','worker_baseline_sha256':sha(worker),'wrapper_sha256':sha((HERE/'worker.mjs').read_bytes()),'bucket':'hub-unimedgv','object_writes':['tea/index.html','tea/peca-jornada.webp'],'source_html_sha256':sha(raw),'output_html_sha256':sha(html),'source_bytes':len(raw),'output_bytes':len(html),'original_objects':inventory,'original_metadata_sha256':sha((args.snapshot/'metadata-PAGES_KV.json').read_bytes()),'protected_legacy_objects':['tea/peca-jornada.webp'],'protected_destination':'https://open.grupocsv.com/jornada-tea/mapa-jornada-04689f954dadd0f5.png','scripts_unchanged':True,'neutralized_preview':{'key':'tea/peca-jornada.webp','source_sha256':original_preview['sha256'],'output_sha256':sha(safe_preview),'output_bytes':len(safe_preview),'width':1600,'height':1130,'content_type':'image/webp','map_content':False}}
    (args.output/'build-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in manifest.items() if k!='original_objects'},ensure_ascii=False))
if __name__=='__main__':main()
