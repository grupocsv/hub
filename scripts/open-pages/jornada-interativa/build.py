"""Camada independente sobre a página viva. Não publica nem altera conteúdo editorial.

Saídas e captura ficam fora do Git. A publicação deve conferir o SHA da saída
em approved-output.json e preservar os demais objetos/metadados da slug.
"""
import argparse
import base64
import hashlib
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import urllib.request
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
URL = 'https://open.grupocsv.com/jornada-tea/'
START = '<!-- JORNADA-INTERATIVA:BEGIN -->'
END = '<!-- JORNADA-INTERATIVA:END -->'

def require(ok, message):
    if not ok:
        raise ValueError(message)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent':'GrupoCSV-Jornada/1.0','Cache-Control':'no-cache'})
    with urllib.request.urlopen(request, timeout=45) as response:
        require(response.status == 200, 'Resposta pública inválida')
        return response.read(), response.headers.get_content_type()

class Tags(HTMLParser):
    """Posições preservam os bytes de conteúdo; não serializa novamente o HTML."""
    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.text = text
        self.lines = [0]
        for i,c in enumerate(text):
            if c == '\n': self.lines.append(i+1)
        self.tags = []
        self.feed(text)
        self.close()

    def absolute_offset(self):
        line,column = self.getpos()
        return self.lines[line-1]+column

    def handle_starttag(self, tag, attrs):
        start = self.absolute_offset()
        self.tags.append((tag, dict(attrs), start, start+len(self.get_starttag_text()), False))

    def handle_startendtag(self, tag, attrs):
        start = self.absolute_offset()
        self.tags.append((tag, dict(attrs), start, start+len(self.get_starttag_text()), False))

    def handle_endtag(self, tag):
        start = self.absolute_offset()
        self.tags.append((tag, {}, start, self.text.index('>', start)+1, True))

def normalize(text):
    tags = Tags(text).tags
    heads = [t for t in tags if t[0]=='head' and not t[4]]
    require(len(heads)==1, 'Cabeçalho ambíguo')
    charsets = [t for t in tags if t[0]=='meta' and 'charset' in t[1]]
    require(len(charsets)==1, 'Charset ambíguo')
    a,b = heads[0][3],charsets[0][2]
    before = [t for t in tags if a<=t[2]<b]
    if before:
        require(any(t[0]=='link' and t[1].get('href')=='/_assets/favicons/favicon.ico' for t in before), 'Injeção desconhecida no cabeçalho')
        for tag,attrs,_,_,end in before:
            require(not end and ((tag=='link' and attrs.get('href','').startswith('/_assets/favicons/')) or (tag=='meta' and (attrs.get('property','').startswith('og:') or attrs.get('name','').startswith('twitter:')))), 'Cabeçalho contém conteúdo além da injeção conhecida')
        text = text[:a]+'\n'+text[b:]
    # Remove somente o beacon reconhecido, usando o analisador de HTML.
    tags = Tags(text).tags
    spans = []
    for i,t in enumerate(tags):
        src=urlsplit(t[1].get('src',''))
        if t[0]=='script' and not t[4] and src.scheme=='https' and src.netloc=='static.cloudflareinsights.com' and src.path=='/beacon.min.js':
            require(i+1<len(tags) and tags[i+1][0]=='script' and tags[i+1][4], 'Beacon sem fechamento')
            spans.append((t[2],tags[i+1][3]))
    for a,b in reversed(spans): text=text[:a]+text[b:]
    require('cloudflareinsights.com' not in text, 'Beacon não reconhecido')
    return text

def remove_owned(text):
    require(text.count(START)==text.count(END), 'Marcadores incompletos')
    while START in text:
        a=text.index(START); b=text.index(END,a)+len(END)
        # Our injections include a trailing newline, restored exactly on removal.
        require(text[b:b+1]=='\n','Formato da camada alterado')
        text=text[:a]+text[b+1:]
    return text

def extract_svg(text):
    tags=Tags(text).tags
    found=[i for i,t in enumerate(tags) if t[0]=='svg' and not t[4] and t[1].get('viewbox')=='0 0 1820 1375']
    require(len(found)==1,'Desenho oficial não identificado univocamente')
    i=found[0]; depth=0
    for t in tags[i:]:
        if t[0]=='svg':
            depth += -1 if t[4] else 1
            if depth==0: return text[tags[i][2]:t[3]]
    raise ValueError('SVG incompleto')

def export_svg(svg, out):
    # A cópia exportável incorpora as mesmas imagens; o SVG da página não muda.
    root=ET.fromstring(svg)
    records=[]
    for element in root.iter():
        if element.tag.endswith('}image'):
            href=element.attrib.get('href')
            require(href and href.startswith(('https://assets.grupocsv.com/','https://open.grupocsv.com/jornada-tea/')), 'Origem de imagem inesperada')
            raw,ctype=fetch(href)
            require(ctype in ('image/svg+xml','image/png','image/webp','image/jpeg'), 'Asset não é imagem')
            data='data:'+ctype+';base64,'+base64.b64encode(raw).decode()
            old='href="'+escape(href,quote=True)+'"'
            require(svg.count(old)==1,'Referência de imagem ambígua')
            svg=svg.replace(old,'href="'+data+'"')
            records.append({'url':href,'sha256':sha(raw),'bytes':len(raw)})
    target=out/'mapa-exportavel.svg'
    target.write_bytes(svg.encode())
    return target,records

def build(source, css, javascript, points, image_name):
    base=remove_owned(normalize(source))
    require(base.count('class="diagram-frame"')==1 and base.count('class="diagram-mobile"')==1, 'Estrutura oficial mudou')
    require(base.count('id="p1"')==1 and base.count('id="p2"')==1, 'Abas oficiais mudaram')
    for delimiter in ['</head>','</body>']:
        require(base.count(delimiter)==1,'Delimitador inesperado: '+delimiter)
    require('</style' not in css.lower() and '</script' not in javascript.lower(),'Fechamento inesperado em módulo')
    data=json.dumps(points,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    style=START+'\n<style id="jornada-interactive-style">\n'+css+'\n</style>\n'+END+'\n'
    script=START+'\n<script id="jornada-interactive-points" type="application/json" data-map-image="/jornada-tea/'+image_name+'">'+data+'</script>\n<script id="jornada-interactive-script">\n'+javascript+'\n</script>\n'+END+'\n'
    output=base.replace('</head>',style+'</head>').replace('</body>',script+'</body>')
    require(remove_owned(output)==base,'Conteúdo anterior alterado')
    require(extract_svg(output)==extract_svg(base),'SVG alterado')
    return base,output

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--input',type=Path,help='Captura de replay; omitir para baixar a página viva')
    args=parser.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    raw=args.input.read_bytes() if args.input else fetch(URL)[0]
    source=raw.decode('utf-8')
    base=remove_owned(normalize(source)); svg=extract_svg(base)
    (args.output/'source-live.html').write_bytes(raw)
    (args.output/'source-base.html').write_bytes(base.encode())
    export,records=export_svg(svg,args.output)
    subprocess.run(['node',str(HERE/'render-map.mjs'),str(export),str(args.output/'mapa.png')],check=True)
    png=(args.output/'mapa.png').read_bytes()
    require(png.startswith(b'\x89PNG\r\n\x1a\n'),'Exportação PNG inválida')
    image_name='mapa-jornada-'+sha(png)[:16]+'.png'
    (args.output/image_name).write_bytes(png)
    points=json.loads((HERE/'points.json').read_text(encoding='utf-8'))
    base,output=build(source,(HERE/'jornada-interativa.css').read_text(encoding='utf-8'),(HERE/'jornada-interativa.js').read_text(encoding='utf-8'),points,image_name)
    (args.output/'index.html').write_bytes(output.encode())
    manifest={'source_url':URL,'source_current_sha256':sha(normalize(source).encode()),'source_base_sha256':sha(base.encode()),'source_svg_sha256':sha(svg.encode()),'output_sha256':sha(output.encode()),'output_bytes':len(output.encode()),'image':{'name':image_name,'sha256':sha(png),'bytes':len(png)},'point_count':len(points),'assets':records}
    (args.output/'build-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(manifest,ensure_ascii=False,indent=2))

if __name__=='__main__': main()
