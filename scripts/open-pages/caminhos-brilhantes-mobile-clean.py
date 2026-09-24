"""
Caminhos Brilhantes — refinamento dos conectores e da experiência mobile.

Parte da arquitetura integrada publicada, remove os rótulos textuais dos
conectores, elimina o bloco explicativo de melhoria contínua e compacta a
composição em telas estreitas.

Uso:
    python3 scripts/open-pages/caminhos-brilhantes-mobile-clean.py

O script aborta se a página pública ou qualquer trecho esperado mudar.
"""
import hashlib
import urllib.request

URL = "https://open.grupocsv.com/caminhos-brilhantes/"
HASH_BASE = "a84bf02558324bdd0faaa15ed4d1940fa955520b4b3b9027eeee6ad420c87949"


def baixar_texto(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resposta:
        return resposta.read().decode("utf-8")


def sha(texto):
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()


def rep(texto, antigo, novo, quantidade=1):
    encontradas = texto.count(antigo)
    assert encontradas == quantidade, ("ocorrências inesperadas", encontradas, quantidade, antigo[:120])
    return texto.replace(antigo, novo)


src = baixar_texto(URL)
print("entrada  %s  %d bytes" % (sha(src), len(src.encode("utf-8"))))

linhas = src.split("\n")
assert "_assets/favicons/favicon.ico" in linhas[3], "bloco injetado não encontrado"
assert linhas[20].strip() == "" and linhas[21].startswith("<meta charset"), "limite do bloco injetado mudou"
s = "\n".join(linhas[:3] + linhas[21:])
assert sha(s) == HASH_BASE, ("a página-base mudou; reconciliar antes de publicar", sha(s), HASH_BASE)
assert s.count("og:title") == 1, "sobrou bloco OG duplicado"

s = rep(
    s,
    '<div class="axis-connector" aria-hidden="true"><span>continuidade</span></div>',
    '<div class="axis-connector" aria-hidden="true"></div>',
)
s = rep(
    s,
    '<div class="axis-connector" aria-hidden="true"><span>aprendizado</span></div>',
    '<div class="axis-connector" aria-hidden="true"></div>',
)
s = rep(
    s,
    '    <div class="feedback-loop"><span>Melhoria contínua</span><p>O que se aprende com os resultados retorna aos Eixos 01 e 02 para ajustar fluxos, rede e cuidado.</p></div>\n\n',
    '',
)

# Conectores mais claros no desktop e mais compactos no mobile.
s = rep(
    s,
    '.axis-flow{display:grid;grid-template-columns:minmax(0,1fr) 54px minmax(0,1fr) 54px minmax(0,1fr);align-items:stretch}',
    '.axis-flow{display:grid;grid-template-columns:minmax(0,1fr) 44px minmax(0,1fr) 44px minmax(0,1fr);align-items:stretch}',
)
s = rep(
    s,
    '.axis-connector span{position:absolute;top:calc(50% - 25px);font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--txt-3);background:var(--bg);padding:3px 5px;white-space:nowrap}\n',
    '',
)
for linha in [
    '.feedback-loop{margin:25px 54px 0;padding:16px 22px;border:1px dashed rgba(244,122,31,.38);border-radius:18px;display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;background:linear-gradient(90deg,rgba(244,122,31,.055),rgba(177,211,74,.055));position:relative}\n',
    '.feedback-loop::before{content:"↺";position:absolute;right:18px;color:rgba(244,122,31,.25);font-size:34px;font-weight:700}\n',
    '.feedback-loop span{font-size:11px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:var(--laranja);white-space:nowrap}\n',
    '.feedback-loop p{font-size:13px;line-height:1.5;color:var(--txt-2);padding-right:34px}\n',
    '  .feedback-loop{margin:22px 0 0}\n',
    '  .feedback-loop{margin:22px 0 0;grid-template-columns:1fr;gap:6px;padding:16px 18px}\n',
    '  .feedback-loop p{padding-right:30px}\n',
]:
    s = rep(s, linha, '')

s = rep(s, '  .axis-connector span{top:50%;left:calc(50% + 12px);transform:translateY(-50%);background:var(--bg)}\n', '', quantidade=2)
s = rep(s, '  .axis-connector{height:46px}', '  .axis-connector{height:34px}')
s = rep(s, '  .axis-connector{height:44px}', '  .axis-connector{height:32px}')
s = rep(s, '  .axis-frame{padding:24px 20px 20px;border-radius:20px}', '  .axis-frame{padding:22px 18px 19px;border-radius:20px}')
s = rep(s, '  .strategy-system{margin-top:28px}', '  .strategy-system{margin-top:24px}')
s = rep(s, '  .governance-band{padding:22px 19px}', '  .governance-band{margin-top:20px;padding:22px 19px}')

# Ajustes tipográficos restritos ao mobile para reduzir altura sem perder leitura.
mobile_css = '''
  .axis-head{gap:12px;margin-bottom:20px}
  .axis-number{width:44px;height:44px;border-radius:14px;font-size:18px}
  .axis-head h3{font-size:17px}
  .axis-stage p{font-size:12.5px;line-height:1.46}
  .axis-core{margin-top:14px}
  .axis-core p{font-size:13.2px;line-height:1.54}
  .axis-delivery{margin-top:18px;padding:13px 14px}
'''
s = rep(s, '@media(max-width:759px){\n', '@media(max-width:759px){\n' + mobile_css, quantidade=2)

s = rep(
    s,
    "var elementos = document.querySelectorAll('.why,.axis-frame,.feedback-loop,.governance-band,.parc,.dl,.autor-inner');",
    "var elementos = document.querySelectorAll('.why,.axis-frame,.governance-band,.parc,.dl,.autor-inner');",
)

for termo in [
    '>continuidade<',
    '>aprendizado<',
    'class="feedback-loop"',
    'Melhoria contínua',
    'O que se aprende com os resultados retorna',
]:
    assert termo not in s, ("metalinguagem residual", termo)

for termo in [
    'Três eixos, um sistema integrado',
    'class="axis-connector"',
    'class="governance-band"',
    'Orquestração da linha de cuidado',
    'prefers-reduced-motion',
    'IntersectionObserver',
]:
    assert termo in s, ("conteúdo esperado ausente", termo)

assert s.count('class="axis-frame') == 3
assert s.count('class="axis-connector"') == 2
assert s.count('<article class="parc') == 4
assert s.count('apresentacao.pdf') == 1
assert s.count('relatorio.pdf') == 1
assert s.count('data:image/') == 6
assert s.count('footer-selo') == 3

with open("index-mobile-clean.html", "w", encoding="utf-8") as arquivo:
    arquivo.write(s)

print("saida    %s  %d bytes  -> index-mobile-clean.html" % (sha(s), len(s.encode("utf-8"))))
