"""
Caminhos Brilhantes — arquitetura integrada dos três eixos.

Parte da página pública aprovada, remove o bloco de head injetado pelo Worker,
substitui as duas dobras redundantes por uma única representação conectada dos
três eixos e amplia as parcerias estratégicas com a 2iM.

Uso:
    python3 scripts/open-pages/caminhos-brilhantes-arquitetura-integrada.py

O script aborta se a página pública, os trechos esperados ou os assets mudarem.
"""
import base64
import hashlib
import re
import urllib.request

URL = "https://open.grupocsv.com/caminhos-brilhantes/"
HASH_BASE = "aee7c05079d7c2027a145e035b7ca748775abce5e8687b7c0944b23f73d3e45d"
LOGO_2IM_ORIGEM = "https://assets.grupocsv.com/logos/2im/horizontal-positivo.svg"


def baixar_bytes(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resposta:
        return resposta.read()


def baixar_texto(url):
    return baixar_bytes(url).decode("utf-8")


def sha(texto):
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()


src = baixar_texto(URL)
print("entrada  %s  %d bytes" % (sha(src), len(src.encode("utf-8"))))

linhas = src.split("\n")
assert "_assets/favicons/favicon.ico" in linhas[3], "bloco injetado não encontrado"
assert linhas[20].strip() == "" and linhas[21].startswith("<meta charset"), "limite do bloco injetado mudou"
s = "\n".join(linhas[:3] + linhas[21:])
assert sha(s) == HASH_BASE, ("a página-base mudou; reconciliar antes de publicar", sha(s), HASH_BASE)
assert s.count("og:title") == 1, "sobrou bloco OG duplicado"


def rep(antigo, novo, quantidade=1):
    global s
    encontradas = s.count(antigo)
    assert encontradas == quantidade, ("ocorrências inesperadas", encontradas, quantidade, antigo[:120])
    s = s.replace(antigo, novo)


def sub(padrao, novo, quantidade=1):
    global s
    s, encontradas = re.subn(padrao, novo, s, count=quantidade, flags=re.S)
    assert encontradas == quantidade, ("substituições inesperadas", encontradas, quantidade, padrao[:120])


def imagem_incorporada(alt):
    padrao = r'<img src="(data:image/[^;]+;base64,[^"]+)" alt="' + re.escape(alt) + r'">'
    resultado = re.search(padrao, s)
    assert resultado, ("asset incorporado não encontrado", alt)
    return resultado.group(1)


# Preserva os assets oficiais já incorporados e adiciona a variante vetorial
# positiva da 2iM, validada para fundos claros no csv-assets-bucket.
logo_ibravs = imagem_incorporada("IBRAVS")
logo_femg = imagem_incorporada("Unimed Federação Minas")
logo_qualix = imagem_incorporada("Programa Quálix")
logo_neurosteps = imagem_incorporada("Neurosteps")
logo_2im_bytes = baixar_bytes(LOGO_2IM_ORIGEM)
assert hashlib.sha256(logo_2im_bytes).hexdigest() == "d240295d5897d2631c428b26c7cd25f6064120bb2a056cb00fd95e3e342fe6d7", "o asset oficial da 2iM mudou"
assert logo_2im_bytes.lstrip().startswith(b"<svg"), "o asset 2iM deixou de ser SVG"
assert b'viewBox="0 0 189.338 80"' in logo_2im_bytes and logo_2im_bytes.count(b"<path") == 6, "estrutura do SVG 2iM mudou"
logo_2im = "data:image/svg+xml;base64," + base64.b64encode(logo_2im_bytes).decode("ascii")


arquitetura = '''<!-- ARQUITETURA INTEGRADA -->
<section class="section section-sistema" style="padding-top:24px" aria-labelledby="titulo-sistema">
  <div class="section-eyebrow">Arquitetura da estratégia</div>
  <h2 class="section-title" id="titulo-sistema">Três eixos, um sistema integrado</h2>
  <p class="section-lead">Cada eixo resolve uma parte da jornada. Juntos, organizam como a criança entra no cuidado, como o acompanhamento permanece conectado e como os resultados orientam a melhoria da rede.</p>

  <div class="strategy-system">
    <div class="system-ribbon"><span>Criança e família no centro da jornada</span></div>

    <div class="axis-flow">
      <article class="axis-frame axis-access">
        <div class="axis-head">
          <span class="axis-number">01</span>
          <div><span class="axis-kicker">Acesso e rede</span><h3>A porta certa, com uma rede preparada</h3></div>
        </div>
        <div class="axis-stage">
          <span class="axis-stage-label">Chega com</span>
          <p>Suspeição diagnóstica ou necessidade de reavaliação.</p>
        </div>
        <div class="axis-core">
          <span class="axis-stage-label">O eixo organiza</span>
          <p>A atenção primária identifica sinais e direciona ao Ambulatório de Avaliação Diagnóstica. A avaliação estrutura o caso e conecta a criança ao recurso próprio ou à rede credenciada qualificada.</p>
        </div>
        <div class="axis-delivery"><span>Entrega</span><strong>Diagnóstico estruturado e acesso ao cuidado adequado.</strong></div>
      </article>

      <div class="axis-connector" aria-hidden="true"><span>continuidade</span></div>

      <article class="axis-frame axis-care">
        <div class="axis-head">
          <span class="axis-number">02</span>
          <div><span class="axis-kicker">Cuidado coordenado</span><h3>Da avaliação ao cuidado, sem perder a continuidade</h3></div>
        </div>
        <div class="axis-stage">
          <span class="axis-stage-label">Recebe</span>
          <p>O caso avaliado, com complexidade e necessidade assistencial definidas.</p>
        </div>
        <div class="axis-core">
          <span class="axis-stage-label">O eixo conecta</span>
          <p>A estratificação por complexidade orienta o plano terapêutico. A Central de Coordenação do Cuidado apoia a família e articula avaliação, direcionamento e acompanhamento entre os serviços.</p>
        </div>
        <div class="axis-delivery"><span>Entrega</span><strong>Jornada conectada e plano terapêutico coerente com cada criança.</strong></div>
      </article>

      <div class="axis-connector" aria-hidden="true"><span>aprendizado</span></div>

      <article class="axis-frame axis-value">
        <div class="axis-head">
          <span class="axis-number">03</span>
          <div><span class="axis-kicker">Desfechos e valor</span><h3>Resultados que retornam ao cuidado como melhoria</h3></div>
        </div>
        <div class="axis-stage">
          <span class="axis-stage-label">Recebe</span>
          <p>Dados clínicos, assistenciais, de experiência e utilização.</p>
        </div>
        <div class="axis-core">
          <span class="axis-stage-label">O eixo transforma</span>
          <p>O Escritório de Valor em Saúde acompanha a carteira, a utilização, os desfechos e a experiência. A Auditoria em Saúde atua de forma especializada, enquanto indicadores e incentivos orientam qualidade e sustentabilidade.</p>
        </div>
        <div class="axis-delivery"><span>Entrega</span><strong>Decisões que aprimoram o acesso, a rede e o cuidado coordenado.</strong></div>
      </article>
    </div>

    <div class="feedback-loop"><span>Melhoria contínua</span><p>O que se aprende com os resultados retorna aos Eixos 01 e 02 para ajustar fluxos, rede e cuidado.</p></div>

    <div class="governance-band">
      <div class="governance-intro"><span>Base de governança</span><strong>Responsabilidades distintas, conectadas pelo mesmo propósito.</strong></div>
      <div class="governance-grid">
        <div><strong>CTNI</strong><span>Governança técnica da estratégia</span></div>
        <div><strong>EVS</strong><span>Gerenciamento populacional e mensuração de valor</span></div>
        <div><strong>Central de Coordenação do Cuidado</strong><span>Apoio à família e articulação da jornada</span></div>
        <div><strong>Auditoria em Saúde</strong><span>Autorização e auditoria especializada</span></div>
      </div>
    </div>
  </div>
</section>

<!-- PARCEIROS -->'''

sub(
    r'<!-- TRÊS EIXOS -->\s*<section class="section" style="padding-top:24px">.*?</section>\s*<!-- FRENTES ESTRUTURANTES -->\s*<section class="section section-estruturas" style="padding-top:8px">.*?</section>\s*<!-- PARCEIROS -->',
    arquitetura,
)


parceiros = f'''<!-- PARCEIROS -->
<section class="parc-section">
  <div class="section" style="padding-top:60px;padding-bottom:60px">
    <div class="section-eyebrow">Competências complementares</div>
    <h2 class="section-title" style="margin-bottom:12px">Especialistas conectados ao mesmo modelo de cuidado</h2>
    <p class="section-lead" style="margin-bottom:0">Caminhos Brilhantes combina competências assistenciais, de qualidade e tecnologia para transformar o desenho da estratégia em uma jornada coordenada e mensurável.</p>
    <div class="parc-grid">
      <article class="parc">
        <div class="parc-logo"><img src="{logo_ibravs}" alt="IBRAVS"></div>
        <div class="parc-capability">Modelo assistencial e valor</div>
        <div class="parc-name">IBRAVS</div>
        <p class="parc-role">Estrutura a estratificação por complexidade, a matriz de recursos terapêuticos, os indicadores e o desenho de incentivos orientados por valor.</p>
      </article>
      <article class="parc">
        <div class="parc-logo two"><img src="{logo_femg}" alt="Unimed Federação Minas"><img src="{logo_qualix}" alt="Programa Quálix"></div>
        <div class="parc-capability">Qualificação independente da rede</div>
        <div class="parc-name">Unimed Federação Minas · Programa Qualix</div>
        <p class="parc-role">Avalia e certifica os serviços próprios e credenciados de Terapias Especiais com critérios técnicos, assistenciais e de gestão.</p>
      </article>
      <article class="parc">
        <div class="parc-logo"><img src="{logo_neurosteps}" alt="Neurosteps"></div>
        <div class="parc-capability">Gestão da terapia e evolução</div>
        <div class="parc-name">Neurosteps</div>
        <p class="parc-role">Integra equipe, plano terapêutico, protocolos, acompanhamento da evolução e devolutiva à família no recurso próprio e na rede.</p>
      </article>
      <article class="parc parc-2im">
        <div class="parc-logo"><img src="{logo_2im}" alt="2iM"></div>
        <div class="parc-capability">Orquestração da linha de cuidado</div>
        <div class="parc-name">2iM</div>
        <p class="parc-role">Reúne a jornada em uma visão clínica integrada, mostrando onde cada criança está, por que entrou e qual etapa precisa ser coordenada.</p>
      </article>
    </div>
  </div>
</section>
<!-- DOWNLOADS -->'''

sub(r'<!-- PARCEIROS -->\s*<section class="parc-section">.*?</section>\s*<!-- DOWNLOADS -->', parceiros)


css = '''
/* ===== ARQUITETURA INTEGRADA ===== */
.section-sistema{padding-bottom:82px}
.strategy-system{margin-top:38px;position:relative}
.system-ribbon{display:flex;align-items:center;justify-content:center;margin-bottom:22px;position:relative}
.system-ribbon::before,.system-ribbon::after{content:"";height:1px;flex:1;background:linear-gradient(90deg,transparent,rgba(0,153,93,.34))}
.system-ribbon::after{background:linear-gradient(90deg,rgba(0,153,93,.34),transparent)}
.system-ribbon span{display:inline-flex;align-items:center;gap:9px;padding:10px 18px;border:1px solid rgba(0,153,93,.22);border-radius:999px;background:rgba(255,255,255,.82);color:var(--teal);font-size:12px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;white-space:nowrap;box-shadow:0 10px 28px rgba(3,79,75,.06)}
.system-ribbon span::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--lima);box-shadow:0 0 0 5px rgba(177,211,74,.16)}
.axis-flow{display:grid;grid-template-columns:minmax(0,1fr) 54px minmax(0,1fr) 54px minmax(0,1fr);align-items:stretch}
.axis-frame{--axis-color:var(--verde);background:rgba(255,255,255,.86);border:1px solid var(--borda);border-radius:24px;padding:26px 24px 22px;position:relative;overflow:hidden;box-shadow:0 14px 38px rgba(3,79,75,.06);transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease,border-color .35s ease}
.axis-frame::before{content:"";position:absolute;inset:0 0 auto;height:5px;background:var(--axis-color)}
.axis-frame::after{content:"";position:absolute;right:-42px;top:-48px;width:140px;height:140px;border-radius:50%;background:color-mix(in srgb,var(--axis-color) 10%,transparent);pointer-events:none}
.axis-care{--axis-color:var(--teal)}
.axis-value{--axis-color:var(--laranja)}
.axis-frame:hover{transform:translateY(-6px);box-shadow:0 24px 52px rgba(3,79,75,.12);border-color:color-mix(in srgb,var(--axis-color) 30%,var(--borda))}
.axis-head{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;margin-bottom:23px;position:relative;z-index:1}
.axis-number{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:var(--axis-color);color:#fff;font-size:19px;font-weight:900;letter-spacing:-.5px;box-shadow:0 10px 24px color-mix(in srgb,var(--axis-color) 24%,transparent)}
.axis-kicker,.axis-stage-label{display:block;color:var(--axis-color);font-size:10px;font-weight:800;letter-spacing:1.45px;text-transform:uppercase}
.axis-head h3{font-size:18px;line-height:1.24;color:var(--teal);margin-top:6px;text-wrap:balance}
.axis-stage,.axis-core{position:relative;padding-left:18px}
.axis-stage::before,.axis-core::before{content:"";position:absolute;left:0;top:4px;width:7px;height:7px;border-radius:50%;background:var(--axis-color);box-shadow:0 0 0 5px color-mix(in srgb,var(--axis-color) 10%,transparent)}
.axis-stage::after{content:"";position:absolute;left:3px;top:20px;bottom:-10px;width:1px;background:color-mix(in srgb,var(--axis-color) 24%,transparent)}
.axis-stage p{font-size:13px;line-height:1.5;color:var(--txt-3);margin-top:5px}
.axis-core{margin-top:16px;padding-top:1px}
.axis-core p{font-size:14px;line-height:1.58;color:var(--txt-2);margin-top:6px;text-wrap:pretty}
.axis-delivery{margin-top:22px;padding:15px 16px;border-radius:16px;background:color-mix(in srgb,var(--axis-color) 8%,#fff);border:1px solid color-mix(in srgb,var(--axis-color) 17%,transparent);display:flex;flex-direction:column;gap:4px}
.axis-delivery span{font-size:10px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;color:var(--axis-color)}
.axis-delivery strong{font-size:13px;line-height:1.45;color:var(--teal)}
.axis-connector{display:flex;align-items:center;justify-content:center;position:relative;min-width:0}
.axis-connector::before{content:"";width:100%;height:1px;background:linear-gradient(90deg,rgba(0,153,93,.2),rgba(0,78,76,.55))}
.axis-connector::after{content:"";position:absolute;right:2px;width:8px;height:8px;border-top:2px solid var(--teal);border-right:2px solid var(--teal);transform:rotate(45deg)}
.axis-connector span{position:absolute;top:calc(50% - 25px);font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--txt-3);background:var(--bg);padding:3px 5px;white-space:nowrap}
.feedback-loop{margin:25px 54px 0;padding:16px 22px;border:1px dashed rgba(244,122,31,.38);border-radius:18px;display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;background:linear-gradient(90deg,rgba(244,122,31,.055),rgba(177,211,74,.055));position:relative}
.feedback-loop::before{content:"↺";position:absolute;right:18px;color:rgba(244,122,31,.25);font-size:34px;font-weight:700}
.feedback-loop span{font-size:11px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:var(--laranja);white-space:nowrap}
.feedback-loop p{font-size:13px;line-height:1.5;color:var(--txt-2);padding-right:34px}
.governance-band{margin-top:18px;padding:23px 24px;border-radius:22px;background:linear-gradient(135deg,var(--teal) 0%,var(--teal-esc) 100%);color:#fff;box-shadow:0 18px 44px rgba(3,79,75,.13)}
.governance-intro{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;padding-bottom:17px;margin-bottom:17px;border-bottom:1px solid rgba(255,255,255,.12)}
.governance-intro span{font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:var(--lima)}
.governance-intro strong{font-size:14px;line-height:1.4;font-weight:600;color:rgba(255,255,255,.92)}
.governance-grid{display:grid;grid-template-columns:.65fr 1fr 1.35fr 1fr;gap:0}
.governance-grid>div{padding:2px 18px;border-left:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column;gap:4px}
.governance-grid>div:first-child{border-left:0;padding-left:0}
.governance-grid strong{font-size:12px;color:#fff}
.governance-grid span{font-size:11px;line-height:1.45;color:rgba(255,255,255,.7)}
.parc-grid{align-items:stretch}
.parc{display:flex;flex-direction:column;min-height:100%;padding:28px 23px;text-align:left}
.parc-logo{justify-content:flex-start;height:54px;margin-bottom:19px}
.parc-logo img{max-height:52px;max-width:78%}
.parc-logo.two{justify-content:flex-start}
.parc-capability{font-size:10px;font-weight:900;letter-spacing:1.35px;text-transform:uppercase;color:var(--verde);margin-bottom:8px;min-height:28px}
.parc-name{font-size:15px;margin-bottom:8px;line-height:1.35}
.parc-role{font-size:13px;line-height:1.55;color:var(--txt-2)}
.parc-2im .parc-logo img{max-width:63%}
@media(min-width:760px) and (max-width:1059px){
  .axis-flow{grid-template-columns:1fr;gap:0}
  .axis-connector{height:46px}
  .axis-connector::before{width:1px;height:100%;background:linear-gradient(rgba(0,153,93,.2),rgba(0,78,76,.55))}
  .axis-connector::after{right:auto;bottom:4px;transform:rotate(135deg)}
  .axis-connector span{top:50%;left:calc(50% + 12px);transform:translateY(-50%);background:var(--bg)}
  .feedback-loop{margin:22px 0 0}
  .governance-grid{grid-template-columns:repeat(2,1fr);gap:18px}
  .governance-grid>div{border-left:0;padding:0}
  .parc-grid{grid-template-columns:repeat(2,1fr)}
}
@media(min-width:1060px){.parc-grid{grid-template-columns:repeat(4,1fr)}}
@media(max-width:759px){
  .section-sistema{padding-bottom:62px}
  .strategy-system{margin-top:28px}
  .system-ribbon span{font-size:10px;letter-spacing:.55px;padding:9px 12px;white-space:normal;text-align:center}
  .axis-flow{grid-template-columns:1fr;gap:0}
  .axis-frame{padding:24px 20px 20px;border-radius:20px}
  .axis-connector{height:44px}
  .axis-connector::before{width:1px;height:100%;background:linear-gradient(rgba(0,153,93,.2),rgba(0,78,76,.55))}
  .axis-connector::after{right:auto;bottom:4px;transform:rotate(135deg)}
  .axis-connector span{top:50%;left:calc(50% + 12px);transform:translateY(-50%);background:var(--bg)}
  .feedback-loop{margin:22px 0 0;grid-template-columns:1fr;gap:6px;padding:16px 18px}
  .feedback-loop p{padding-right:30px}
  .governance-band{padding:22px 19px}
  .governance-intro{grid-template-columns:1fr;gap:7px}
  .governance-grid{grid-template-columns:1fr;gap:15px}
  .governance-grid>div,.governance-grid>div:first-child{border-left:0;padding:0 0 15px;border-bottom:1px solid rgba(255,255,255,.1)}
  .governance-grid>div:last-child{border-bottom:0;padding-bottom:0}
  .parc{padding:25px 21px}
  .parc-capability{min-height:0}
}
'''
rep("</style>", css + "\n</style>")

# O observador acompanha as novas unidades visuais e deixa de referenciar os
# componentes removidos da dobra anterior.
rep(
    "var elementos = document.querySelectorAll('.why,.eixo,.marco,.parc,.dl,.autor-inner');",
    "var elementos = document.querySelectorAll('.why,.axis-frame,.feedback-loop,.governance-band,.parc,.dl,.autor-inner');",
)

# Verificações editoriais, funcionais, visuais e de acessibilidade.
for termo in [
    "Frentes estruturantes",
    "Estruturas que sustentam o cuidado",
    "Três eixos articulados",
    "Da estratégia à execução",
    "concepção da estratégia",
]:
    assert termo not in s, ("resíduo removido: " + termo)

for termo in [
    "Três eixos, um sistema integrado",
    "Criança e família no centro da jornada",
    "A porta certa, com uma rede preparada",
    "Da avaliação ao cuidado, sem perder a continuidade",
    "Resultados que retornam ao cuidado como melhoria",
    "Base de governança",
    "Competências complementares",
    "Modelo assistencial e valor",
    "Qualificação independente da rede",
    "Gestão da terapia e evolução",
    "Orquestração da linha de cuidado",
    "Unimed Federação Minas · Programa Qualix",
    "Neurosteps",
    "2iM",
    "data:image/svg+xml;base64,",
    "prefers-reduced-motion",
    "IntersectionObserver",
    "https://hub.unimedgv.com/tea/",
]:
    assert termo in s, ("conteúdo esperado ausente: " + termo)

assert s.count("<!-- ARQUITETURA INTEGRADA -->") == 1
assert s.count("class=\"axis-frame") == 3
assert s.count("<article class=\"parc") == 4, "os quatro cards de parceiros devem permanecer"
assert s.count("apresentacao.pdf") == 1
assert s.count("relatorio.pdf") == 1
assert s.count("data:image/") == 6, "somente o logo 2iM deve ser acrescentado aos assets incorporados"
assert s.count("footer-selo") == 3, "o selo EVS e suas regras devem permanecer"

with open("index-arquitetura.html", "w", encoding="utf-8") as arquivo:
    arquivo.write(s)

print("saida    %s  %d bytes  -> index-arquitetura.html" % (sha(s), len(s.encode("utf-8"))))
