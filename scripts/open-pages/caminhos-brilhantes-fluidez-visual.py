# -*- coding: utf-8 -*-
"""
Caminhos Brilhantes — revisão editorial e visual.

Parte da página pública aprovada, remove o bloco de head injetado pelo Worker e
aplica somente as mudanças solicitadas: linguagem fluida e atemporal, retirada
de inferências sobre a origem e a execução da estratégia, descrição da Unimed
Federação Minas sem datas, logo negativo oficial do Escritório de Valor em Saúde
e efeitos visuais discretos com respeito a prefers-reduced-motion.

Uso:
    python3 scripts/open-pages/caminhos-brilhantes-fluidez-visual.py

O script aborta se a página pública mudar antes da execução ou se qualquer trecho
esperado deixar de existir.
"""
import hashlib
import re
import urllib.request

URL = 'https://open.grupocsv.com/caminhos-brilhantes/'
HASH_BASE = 'f2e6ced342b349144157ff5f8ba65cf479c72b3d8b906129885ba15e438b0edb'
EVS_LOGO = 'https://assets.grupocsv.com/logos/evs/selo-white-footer-240.png'


def baixar(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resposta:
        return resposta.read().decode('utf-8')


def sha(texto):
    return hashlib.sha256(texto.encode('utf-8')).hexdigest()


src = baixar(URL)
print('entrada  %s  %d bytes' % (sha(src), len(src.encode('utf-8'))))

linhas = src.split('\n')
assert '_assets/favicons/favicon.ico' in linhas[3], 'bloco injetado não encontrado'
assert linhas[20].strip() == '' and linhas[21].startswith('<meta charset'), 'limite do bloco injetado mudou'
s = '\n'.join(linhas[:3] + linhas[21:])
assert sha(s) == HASH_BASE, ('a página-base mudou; reconciliar antes de publicar', sha(s), HASH_BASE)
assert s.count('og:title') == 1, 'sobrou bloco OG duplicado'


def rep(antigo, novo, quantidade=1):
    global s
    encontradas = s.count(antigo)
    assert encontradas == quantidade, ('ocorrências inesperadas', encontradas, quantidade, antigo[:100])
    s = s.replace(antigo, novo)


def sub(padrao, novo, quantidade=1):
    global s
    s, encontradas = re.subn(padrao, novo, s, count=quantidade, flags=re.S)
    assert encontradas == quantidade, ('substituições inesperadas', encontradas, quantidade, padrao[:100])


# Paleta alinhada ao sistema visual Unimed: fundo off-white e texto verde escuro.
rep(
    '  --txt:#1A1A1A; --txt-2:#4A5563; --txt-3:#6E7A78;\n  --bg:#F7F8FA; --branco:#fff; --borda:#E5E8EB;',
    '  --txt:#004E4C; --txt-2:#365F5D; --txt-3:#6E7A78;\n  --bg:#FAFAF7; --branco:#fff; --borda:#DEE7E3;'
)

# Hero e eixo diagnóstico sem marcação editorial ou data usada como contexto.
rep(
    '<div class="hero-meta">Provimento de Saúde · Setembro&nbsp;·&nbsp;2026</div>',
    '<div class="hero-meta">Provimento de Saúde</div>'
)
rep(
    '<li>Ambulatório de Avaliação Diagnóstica (AAD) no CAI — em operação desde 2 de setembro de 2026 · capacidade de 60 crianças/mês</li>',
    '<li>Ambulatório de Avaliação Diagnóstica (AAD) no CAI — capacidade instalada de 60 crianças/mês</li>'
)

# Substitui a cronologia presumida por uma apresentação estável das estruturas.
frentes = '''<!-- FRENTES ESTRUTURANTES -->
<section class="section section-estruturas" style="padding-top:8px">
  <div class="section-eyebrow">Frentes estruturantes</div>
  <h2 class="section-title">Estruturas que sustentam o cuidado</h2>
  <p class="section-lead">Componentes complementares para qualificar a rede, orientar o modelo assistencial e organizar a avaliação diagnóstica.</p>

  <div class="marcos">
    <div class="marco marco-destaque">
      <div class="marco-data">Qualificação da rede</div>
      <h3 class="marco-title">Certificação Quálix em Terapias Especiais</h3>
      <p class="marco-text">A Casa Unimed possui Selo Ouro, e as clínicas credenciadas submetidas à auditoria foram certificadas pelo Programa Quálix.</p>
    </div>
    <div class="marco">
      <div class="marco-data">Modelo assistencial</div>
      <h3 class="marco-title">Estratificação de Complexidade com o IBRAVS</h3>
      <p class="marco-text">Quatro clusters de complexidade e uma Matriz de Alocação de Recursos Terapêuticos orientam o plano terapêutico de cada criança.</p>
    </div>
    <div class="marco">
      <div class="marco-data">Avaliação diagnóstica</div>
      <h3 class="marco-title">Ambulatório de Avaliação Diagnóstica</h3>
      <p class="marco-text">O AAD integra o Centro de Atendimento Integrado (CAI), com capacidade instalada de 60 crianças por mês em dois turnos semanais. A avaliação apoia a confirmação do cluster e o direcionamento na rede.</p>
    </div>
  </div>
</section>

<!-- PARCEIROS -->'''
sub(r'<!-- MARCOS -->\s*<section class="section" style="padding-top:8px">.*?</section>\s*<!-- PARCEIROS -->', frentes)

# Parcerias descritas pelas competências, sem cronologia ou metalinguagem de execução.
rep(
    'Caminhos Brilhantes só é viável pela articulação de parceiros nacionais — cada qual com competência específica para o desenho e a execução da estratégia.',
    'Caminhos Brilhantes reúne instituições com competências complementares para o modelo assistencial, a qualificação da rede e a jornada terapêutica.'
)
rep(
    'Instituto Brasileiro de Valor em Saúde — framework desenvolvido no âmbito do acordo de cooperação técnica com a ANS, cadência quinzenal, modelo de quatro camadas de incentivo',
    'Instituto Brasileiro de Valor em Saúde — modelo assistencial, estratificação por complexidade e desenho de incentivos'
)
rep('FEMG · Programa Quálix', 'Unimed Federação Minas · Programa Quálix')
rep(
    'Unimed Federação Minas — auditoria externa dos Centros de Terapias Especiais (15–17 de junho de 2026) e certificação da Casa Unimed e das clínicas credenciadas auditadas (14 de agosto de 2026)',
    'Auditoria externa e certificação da Casa Unimed e das clínicas credenciadas avaliadas no Programa Quálix'
)
rep(
    'Plataforma parceira da Unimed do Brasil, já em operação — jornada terapêutica, engajamento familiar, PROMs e PREMs',
    'Plataforma parceira da Unimed do Brasil — jornada terapêutica, engajamento familiar, PROMs e PREMs'
)

# Materiais apresentados pelo conteúdo, sem hierarquia temporal artificial.
rep(
    'O painel da jornada do paciente é o material mais recente da estratégia. A apresentação e o relatório técnico registram a concepção da estratégia, em maio de 2026; os marcos posteriores estão refletidos nesta página.',
    'A jornada do paciente, a apresentação executiva e o relatório técnico reúnem perspectivas complementares da estratégia.'
)
rep('<span class="dl-tag">Mais recente · setembro de 2026</span>', '<span class="dl-tag">Jornada do paciente</span>')
rep('<span class="dl-tag principal">Visão estratégica · maio de 2026</span>', '<span class="dl-tag principal">Visão estratégica</span>')
rep('<span class="dl-tag tecnico">Aprofundamento · maio de 2026</span>', '<span class="dl-tag tecnico">Aprofundamento técnico</span>')

# Rodapé: selo EVS negativo oficial e retirada da data editorial.
sub(
    r'<img class="footer-selo" src="data:image/[^;]+;base64,[^"]+" alt="Escritório de Valor em Saúde">',
    '<img class="footer-selo" src="%s" alt="Escritório de Valor em Saúde" width="383" height="240" loading="lazy" decoding="async">' % EVS_LOGO
)
rep(
    '<div class="footer-right"><a href="https://grupocsv.com" target="_blank" rel="noopener">grupocsv.com</a> · Setembro · 2026</div>',
    '<div class="footer-right"><a href="https://grupocsv.com" target="_blank" rel="noopener">grupocsv.com</a></div>'
)
rep('Quálix (FEMG) e Neurosteps.', 'Programa Quálix da Unimed Federação Minas e Neurosteps.')

# Refinamento visual preservativo: profundidade, foco e movimento discreto.
css_extra = '''
/* ===== REFINAMENTO VISUAL ===== */
body{background:
  radial-gradient(circle at 8% 20%,rgba(177,211,74,.07),transparent 22rem),
  radial-gradient(circle at 92% 72%,rgba(0,153,93,.06),transparent 26rem),
  var(--bg);color:var(--txt)}
.hero{background:
  radial-gradient(circle at 78% 16%,rgba(177,211,74,.13),transparent 22rem),
  linear-gradient(135deg,var(--teal) 0%,var(--teal-esc) 100%);isolation:isolate}
.hero::before{animation:hero-orbit 18s ease-in-out infinite alternate}
.hero::after{animation:hero-orbit 22s ease-in-out infinite alternate-reverse}
.hero-inner::after{content:"";position:absolute;inset:-24px -32px auto auto;width:160px;height:160px;border:1px solid rgba(255,255,255,.09);border-radius:50%;pointer-events:none}
.hero-mark{filter:drop-shadow(0 12px 24px rgba(0,0,0,.14));animation:hero-float 6s ease-in-out infinite}
.hero-tag,.dl-tag{backdrop-filter:blur(10px)}
.color-bar{height:4px;background:linear-gradient(90deg,var(--verde) 0 38%,var(--lima) 38% 56%,var(--laranja) 56% 68%,var(--teal) 68% 100%)}
.section{position:relative}
.section-title{text-wrap:balance}
.section-lead,.hero-lead,.why-text,.eixo-list li,.marco-text,.parc-role,.dl-desc,.mat-nota{text-wrap:pretty}
.why{border:1px solid rgba(244,122,31,.2);border-radius:22px;padding:32px 34px;box-shadow:0 14px 40px rgba(3,79,75,.06);position:relative;overflow:hidden}
.why::before{content:"";position:absolute;inset:0 auto 0 0;width:5px;background:var(--laranja)}
.eixo,.marco,.parc,.dl{border-radius:20px;box-shadow:0 10px 32px rgba(3,79,75,.045);transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s cubic-bezier(.2,.8,.2,1),border-color .35s ease}
.eixo:hover,.marco:hover,.parc:hover,.dl:hover{transform:translateY(-6px);box-shadow:0 22px 48px rgba(3,79,75,.11);border-color:rgba(0,153,93,.28)}
.eixo-top{height:5px;border-radius:20px 20px 0 0}
.marco{min-height:100%}
.marco-destaque{background:
  radial-gradient(circle at 88% 10%,rgba(177,211,74,.18),transparent 11rem),
  linear-gradient(145deg,var(--teal) 0%,var(--teal-esc) 100%)}
.marco-destaque::after{content:"";position:absolute;right:-42px;bottom:-54px;width:150px;height:150px;border:1px solid rgba(255,255,255,.08);border-radius:50%}
.parc{background:rgba(255,255,255,.72);backdrop-filter:blur(8px)}
.dl{position:relative;overflow:hidden}
.dl::after{content:"";position:absolute;inset:auto -30% -80% auto;width:220px;height:220px;border-radius:50%;background:rgba(0,153,93,.055);transition:transform .45s ease;pointer-events:none}
.dl:hover::after{transform:translate(-18px,-18px) scale(1.08)}
.dl-jornada{background:
  radial-gradient(circle at 88% 20%,rgba(177,211,74,.18),transparent 16rem),
  linear-gradient(135deg,var(--verde-esc) 0%,var(--teal-esc) 100%)}
.dl-btn{border-radius:999px;transition:transform .2s ease,box-shadow .2s ease}
.dl:hover .dl-btn{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.12)}
a:focus-visible{outline:3px solid var(--lima);outline-offset:4px;border-radius:8px}
.footer{background:linear-gradient(135deg,#0A1D1C 0%,var(--teal-esc) 100%)}
.footer-selo{height:54px;width:auto;opacity:1;object-fit:contain}
.footer-right a{color:#DDE8E5;text-decoration:none;border-bottom:1px solid rgba(221,232,229,.35)}
.footer-brand svg{filter:drop-shadow(0 7px 18px rgba(0,0,0,.16))}
html.motion-ready .reveal{opacity:0;transform:translateY(24px);transition:opacity .72s cubic-bezier(.2,.8,.2,1),transform .72s cubic-bezier(.2,.8,.2,1)}
html.motion-ready .reveal.is-visible{opacity:1;transform:none}
html.motion-ready .reveal[data-delay="1"]{transition-delay:.08s}
html.motion-ready .reveal[data-delay="2"]{transition-delay:.16s}
@keyframes hero-orbit{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(20px,-14px,0) scale(1.06)}}
@keyframes hero-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@media(max-width:759px){
  .section{padding-top:58px;padding-bottom:58px}
  .hero{padding-bottom:68px}
  .dl-jornada{align-items:flex-start}
  .footer-inner,.footer-left{justify-content:center}
  .footer-brand{width:100%;display:flex;justify-content:center}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation:none!important;transition-duration:.01ms!important;transition-delay:0ms!important}
  html.motion-ready .reveal{opacity:1;transform:none}
}
'''
rep('</style>', css_extra + '\n</style>')

js_extra = '''
<script>
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var elementos = document.querySelectorAll('.why,.eixo,.marco,.parc,.dl,.autor-inner');
  document.documentElement.classList.add('motion-ready');
  elementos.forEach(function(elemento, indice){
    elemento.classList.add('reveal');
    elemento.setAttribute('data-delay', String(indice % 3));
  });
  var observador = new IntersectionObserver(function(entradas){
    entradas.forEach(function(entrada){
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('is-visible');
      observador.unobserve(entrada.target);
    });
  }, {threshold:0.14, rootMargin:'0px 0px -6% 0px'});
  elementos.forEach(function(elemento){observador.observe(elemento);});
})();
</script>
'''
rep('</body>', js_extra + '\n</body>')

# Verificações editoriais, funcionais, visuais e de acessibilidade.
for termo in [
    'Mais recente', 'maio de 2026', 'Maio · 2026', 'setembro de 2026',
    'Setembro · 2026', 'Marcos de 2026', 'Da estratégia à execução',
    'concepção da estratégia', 'FEMG · Programa Quálix', '15–17 de junho',
    '14 de agosto', '20 de agosto', '2 de setembro'
]:
    assert termo not in s, ('resíduo editorial ou cronológico: ' + termo)

for termo in [
    'Frentes estruturantes', 'Estruturas que sustentam o cuidado',
    'Unimed Federação Minas · Programa Quálix', 'Jornada do paciente',
    'Aprofundamento técnico', EVS_LOGO, 'prefers-reduced-motion',
    'IntersectionObserver', 'capacidade instalada de 60 crianças/mês',
    'https://hub.unimedgv.com/tea/'
]:
    assert termo in s, ('conteúdo esperado ausente: ' + termo)

assert s.count('apresentacao.pdf') == 1
assert s.count('relatorio.pdf') == 1
assert s.count('data:image/') == 5, 'apenas o selo EVS deve deixar de usar base64'
assert s.count('footer-selo') == 3, 'as duas regras CSS e o elemento do selo EVS devem permanecer'

with open('index-fluido.html', 'w', encoding='utf-8') as arquivo:
    arquivo.write(s)

print('saida    %s  %d bytes  -> index-fluido.html' % (sha(s), len(s.encode('utf-8'))))
