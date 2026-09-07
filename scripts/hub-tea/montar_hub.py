# -*- coding: utf-8 -*-
"""Hub TEA — identidade do Caminhos Brilhantes, pecas reais e trilha que acende.

Parte da pagina publicada (hub.unimedgv.com/tea/) sem o bloco de <head> que o
Worker injeta, e reconstroi os cartoes.

O que muda nesta versao, depois da leitura do gestor:

  1. Sai o mockup, entra o objeto. Cada cartao mostra a peca de verdade, e
     fotografada como ela existe no mundo: a Jornada e a prancha impressa, com
     a marca de ampliar; o Painel esta na tela de um tablet; o Relatorio e um
     livro, so a capa. Nada de desfoque.
  2. O objeto nunca cruza com o texto. No cartao 02, largo, a prancha fica na
     coluna ao lado da explicacao — que foi o desenho pedido. Nos cartoes 03 e
     04, estreitos, ele ocupa a faixa do pe e o texto recebe recuo igual.
  3. As tres imagens sobem como arquivos da propria slug, com caminho relativo.
     A publicacao troca o conjunto inteiro de uma vez, entao nao ha instante em
     que o HTML novo conviva com imagem faltando, e nao ha endereco de fora que
     possa quebrar.

Segue valendo das versoes anteriores: a identidade oficial entra em tres lugares
e so tres — a trilha no lugar do risco do herói, a estrela caminhando no cartao
01 e a logomarca no rodape; e a trilha do cartao 01 acende cada ponto por onde a
estrela passa, e o ponto aceso fica aceso. O cabecalho continua sendo o lockup
da Unimed.

Uso:  python3 montar_hub.py    # grava hub-novo.html
"""
import base64
import hashlib
import os

FONTE = 'tea-fonte.html'
s = open(FONTE, encoding='utf-8').read()
print('entrada  %s  %d bytes' % (hashlib.sha256(s.encode()).hexdigest()[:16], len(s.encode())))


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('ocorrencias inesperadas', c, n, old[:90])
    s = s.replace(old, new)


def datauri(caminho, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(caminho, 'rb').read()).decode())


# ---------------------------------------------------------------------------
# geometria oficial da marca
# ---------------------------------------------------------------------------
ESTRELA = ('M46.87 8.68Q47.44 6.71 48.86 8.19L51.23 10.64Q52.17 11.62 53.54 11.57L56.94 11.45'
           'Q58.99 11.38 58.03 13.19L56.43 16.2Q55.79 17.4 56.25 18.69L57.42 21.89Q58.12 23.81 56.1 23.46'
           'L52.75 22.86Q51.4 22.63 50.33 23.47L47.64 25.57Q46.03 26.83 45.74 24.8L45.27 21.42'
           'Q45.08 20.07 43.95 19.31L41.12 17.4Q39.43 16.26 41.27 15.36L44.33 13.87Q45.56 13.27 45.93 11.96Z')
EST_CX, EST_CY = 49.21, 16.77          # centro do desenho original da estrela

# ---------------------------------------------------------------------------
# 1a. herói: o risco vira a trilha da marca
# ---------------------------------------------------------------------------
PONTOS_HERO = [(7, 41, 3.4, '#004e4c'), (44, 39, 4.3, '#004e4c'), (85, 35.2, 5.2, '#00995d'),
               (130, 29.8, 6.3, '#00995d'), (178, 22.8, 7.4, '#00995d'), (229, 15, 8.8, '#8baf1f')]
trilha_hero = ''.join(
    '<circle cx="%s" cy="%s" r="%s" fill="%s" style="--i:%d"/>' % (x, y, r, c, i)
    for i, (x, y, r, c) in enumerate(PONTOS_HERO)
) + ('<g class="astro" style="--i:6" transform="translate(%.2f %.2f) scale(%.3f)">'
     '<path class="estrela" d="%s" fill="#f47920"/></g>'
     % (279 - EST_CX * 1.75, 14 - EST_CY * 1.75, 1.75, ESTRELA))

rep('<svg class="risco" viewBox="0 0 300 22" aria-hidden="true"><path d="M6 14 C 58 20, 118 6, 168 12 S 268 17, 294 8"/></svg>',
    '<svg class="risco" viewBox="0 0 300 52" aria-hidden="true">%s</svg>' % trilha_hero)

rep('''h1 em .risco{position:absolute;left:2%;bottom:-14px;width:96%;height:22px;overflow:visible}
h1 em .risco path{fill:none;stroke:var(--laranja);stroke-width:6.5;stroke-linecap:round;
  stroke-dasharray:330;stroke-dashoffset:330;animation:risca 1s cubic-bezier(.6,0,.3,1) .7s forwards}
@keyframes risca{to{stroke-dashoffset:0}}''',
    '''h1 em .risco{position:absolute;left:1%;bottom:-30px;width:99%;height:46px;overflow:visible}
h1 em .risco circle,h1 em .risco .astro .estrela{opacity:0;transform-box:fill-box;transform-origin:center;
  animation:brota .5s cubic-bezier(.2,1.3,.4,1) forwards;animation-delay:calc(.45s + var(--i) * .085s)}
h1 em .risco .astro .estrela{animation-delay:calc(.45s + 6 * .085s)}
@keyframes brota{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:none}}''')

rep('''  h1 em .risco path{animation:none;stroke-dashoffset:0}''',
    '''  h1 em .risco circle,h1 em .risco .astro .estrela{animation:none;opacity:1}''')

# ---------------------------------------------------------------------------
# 1b. cartão 01: a estrela caminha e a trilha vai acendendo atrás dela
# ---------------------------------------------------------------------------
CURVA = 'M14 194 C 110 168, 60 108, 158 92 S 340 118, 462 24'
COMPRIMENTO = 502.7                    # medido no navegador com getTotalLength
CICLO = 11                             # segundos
ANDAR = 84                             # % do ciclo gastos percorrendo a trilha

# x, y, raio, fração do percurso, cor. Os dois últimos são as bolinhas amarelas
# da marca: acendem mais forte e é nelas que a trilha termina antes da estrela.
PONTOS_P1 = [(23.6, 191.1, 4.2, 0.02, '#BFE8D2'),
             (86.5, 137.1, 5.0, 0.19, '#A8E6C6'),
             (155.3, 92.5, 5.9, 0.36, '#7BE8B0'),
             (240.5, 88.0, 6.9, 0.53, '#63E9A4'),
             (325.8, 84.7, 8.1, 0.70, '#D7EA6A'),
             (402.5, 61.3, 9.4, 0.86, '#E8F386')]

marcos = ''.join(
    '<circle class="marco m%d" cx="%s" cy="%s" r="%s" fill="%s" style="color:%s"/>'
    % (i, x, y, r, cor, cor)
    for i, (x, y, r, f, cor) in enumerate(PONTOS_P1))

andarilho = ('<circle class="halo" r="13" fill="#f47920" opacity=".16"/>'
             '<g transform="translate(%.2f %.2f) scale(1.6)">'
             '<path class="estrela" d="%s" fill="#f47920"/></g>'
             % (-EST_CX * 1.6, -EST_CY * 1.6, ESTRELA))

rep('''      <svg class="caminho" viewBox="0 0 480 210" preserveAspectRatio="none" aria-hidden="true">
        <path class="base" d="M14 194 C 110 168, 60 108, 158 92 S 340 118, 462 24"/>
        <path class="luz" d="M14 194 C 110 168, 60 108, 158 92 S 340 118, 462 24"/>
        <circle cx="14" cy="194" r="4"/><circle cx="158" cy="92" r="3.4"/><circle cx="462" cy="24" r="4"/>
      </svg>''',
    '''      <svg class="caminho" viewBox="0 0 480 210" aria-hidden="true">
        <path class="base" d="@CURVA@"/>
        <path class="feito" d="@CURVA@"/>
        <g class="marcos">@MARCOS@</g>
        <g class="andarilho">@ANDARILHO@</g>
      </svg>'''.replace('@CURVA@', CURVA).replace('@MARCOS@', marcos).replace('@ANDARILHO@', andarilho))

# cada ponto tem o seu próprio quadro-chave: acende quando a estrela chega e
# permanece aceso até o fim do ciclo. Fração do percurso vira porcentagem de tempo
# porque o movimento é linear.
quadros = []
for i, (x, y, r, f, cor) in enumerate(PONTOS_P1):
    p = ANDAR * f
    forte = i >= 4                      # as bolinhas amarelas brilham mais
    quadros.append(
        '@keyframes acende%d{0%%,%.1f%%{opacity:.2;transform:scale(.62);filter:none}'
        '%.1f%%{opacity:1;transform:scale(%s);filter:drop-shadow(0 0 %spx currentColor)}'
        '%.1f%%{opacity:1;transform:scale(1.12);filter:drop-shadow(0 0 %spx currentColor)}'
        '90%%{opacity:1;transform:scale(1.12);filter:drop-shadow(0 0 %spx currentColor)}'
        '100%%{opacity:.2;transform:scale(.62);filter:none}}'
        % (i, p, p + 1.6, '2.3' if forte else '1.9', 22 if forte else 13,
           p + 5.5, 16 if forte else 9, 16 if forte else 9))

css_marcos = ''.join(
    '.caminho .m%d{animation-name:acende%d}' % (i, i) for i in range(len(PONTOS_P1)))

rep('''.caminho{position:absolute;left:0;right:0;bottom:0;height:46%;pointer-events:none}
.caminho path.base{fill:none;stroke:rgba(255,255,255,.2);stroke-width:2.6;stroke-linecap:round;stroke-dasharray:.5 9}
.caminho path.luz{fill:none;stroke:#FFB26E;stroke-width:3;stroke-linecap:round;
  stroke-dasharray:34 640;stroke-dashoffset:674;animation:percorre 7.5s linear infinite;
  filter:drop-shadow(0 0 6px rgba(255,178,110,.8))}
@keyframes percorre{to{stroke-dashoffset:0}}
.caminho circle{fill:rgba(255,255,255,.5)}''',
    '''/* largura explicita: sem ela o SVG usa a proporcao intrinseca, fica mais largo
   que o cartao e o fim da trilha some no corte. E o pe fica acima do botao,
   para que nenhum ponto acenda por tras de palavra. */
.caminho{position:absolute;left:0;right:0;bottom:78px;width:100%;height:44%;pointer-events:none}
.caminho path.base{fill:none;stroke:rgba(255,255,255,.15);stroke-width:2.6;stroke-linecap:round;stroke-dasharray:.5 9}
.caminho path.feito{fill:none;stroke:#8BAF1F;stroke-width:2.1;stroke-linecap:round;opacity:.3;
  stroke-dasharray:@L@;stroke-dashoffset:@L@;animation:preenche @CICLO@s linear infinite}
.caminho .marco{transform-box:fill-box;transform-origin:center;opacity:.2;
  animation-duration:@CICLO@s;animation-timing-function:linear;animation-iteration-count:infinite}
@MARCOS@
@QUADROS@
.caminho .andarilho{offset-path:path("@CURVA@");offset-rotate:0deg;
  animation:caminha @CICLO@s linear infinite;filter:drop-shadow(0 0 9px rgba(244,121,32,.8))}
.caminho .andarilho .estrela{animation:gira @CICLO@s ease-in-out infinite;
  transform-box:fill-box;transform-origin:center}
@keyframes caminha{0%{offset-distance:0%;opacity:0}
  3%{opacity:1}@ANDAR@%{offset-distance:100%;opacity:1}
  90%{offset-distance:100%;opacity:0}100%{offset-distance:100%;opacity:0}}
@keyframes preenche{0%{stroke-dashoffset:@L@;opacity:.3}
  @ANDAR@%{stroke-dashoffset:0;opacity:.3}90%{stroke-dashoffset:0;opacity:.3}
  100%{stroke-dashoffset:0;opacity:0}}
@keyframes gira{0%{transform:rotate(-10deg)}25%{transform:rotate(10deg)}
  50%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}100%{transform:rotate(-10deg)}}'''
    .replace('@L@', str(COMPRIMENTO)).replace('@CICLO@', str(CICLO))
    .replace('@ANDAR@', str(ANDAR)).replace('@CURVA@', CURVA).replace('@MARCOS@', css_marcos)
    .replace('@QUADROS@', '\n'.join(quadros)))

rep('''  .caminho path.luz{animation:none}''',
    '''  .caminho path.feito{animation:none;stroke-dashoffset:0}
  .caminho .marco{animation:none;opacity:1;filter:drop-shadow(0 0 6px currentColor)}
  .caminho .andarilho{animation:none;offset-distance:100%;opacity:1}
  .caminho .andarilho .estrela{animation:none}''')

# ---------------------------------------------------------------------------
# 2. peças reais: a jornada impressa, o painel num tablet e o relatório em livro
# ---------------------------------------------------------------------------
# Os arquivos sobem junto com o HTML na mesma slug, entao o caminho e relativo e
# a publicacao e atomica: nao existe instante em que a pagina nova conviva com
# imagem faltando, e nao ha endereco externo que possa quebrar.

rep('''      <span class="fantasma" aria-hidden="true">02</span>
      <span class="num">Nº 02</span>
      <h2>Jornada do Paciente</h2>
      <p class="desc">O caminho da criança, da porta de entrada às Terapias Especiais.</p>
      <span class="cta">Ver a jornada <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
    </a>''',
    '''      <span class="lado">
        <span class="num">Nº 02</span>
        <h2>Jornada do Paciente</h2>
        <p class="desc">O caminho da criança, da porta de entrada às Terapias Especiais.</p>
        <span class="cta">Ver a jornada <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </span>
      <span class="peca peca-f">
        <span class="folha">
          <img src="peca-jornada.webp" width="1600" height="1130" alt="Prancha da Jornada do Paciente no Neurodesenvolvimento Infantil" loading="lazy" decoding="async">
          <span class="ampliar"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="M15.8 15.8 21 21M11 8.4v5.2M8.4 11h5.2"/></svg>Ampliar</span>
        </span>
      </span>
    </a>''')

rep('''      <span class="fantasma" aria-hidden="true">03</span>
      <span class="restr">''', '''      <span class="restr">''')
rep('''      <span class="cta">Entrar no painel <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
    </a>''',
    '''      <span class="cta">Entrar no painel <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      <span class="peca peca-t" aria-hidden="true">
        <span class="tablet"><img src="peca-painel.webp" width="1240" height="866" alt="" loading="lazy" decoding="async"></span>
      </span>
    </a>''')

rep('''      <span class="fantasma" aria-hidden="true">04</span>
      <span class="restr">''', '''      <span class="restr">''')
rep('''      <span class="cta">Baixar o relatório <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 11l6 6 6-6"/><path d="M5 21h14"/></svg></span>
    </a>''',
    '''      <span class="cta">Baixar o relatório <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 11l6 6 6-6"/><path d="M5 21h14"/></svg></span>
      <span class="peca peca-l" aria-hidden="true">
        <span class="livro"><img src="peca-relatorio.webp" width="760" height="1075" alt="" loading="lazy" decoding="async"><i class="lombada"></i><i class="brilho"></i></span>
      </span>
    </a>''')

rep('''.fantasma{position:absolute;right:14px;bottom:-24px;font-family:var(--fd);font-style:italic;font-weight:700;
  font-size:130px;line-height:1;pointer-events:none;user-select:none}''',
    '''.fantasma{position:absolute;right:14px;bottom:-24px;font-family:var(--fd);font-style:italic;font-weight:700;
  font-size:130px;line-height:1;pointer-events:none;user-select:none}

/* ---------- peças reais ----------
   Cada cartao mostra o objeto de verdade: a prancha impressa da jornada, o
   painel na tela de um tablet e o relatorio como livro. O objeto nunca cruza
   com o texto: no cartao 02 ele fica na coluna ao lado, e nos cartoes 03 e 04
   ocupa a faixa do pe, com recuo equivalente no texto. O corte pela borda
   arredondada do cartao e proposital — diz que ha mais peca do que cabe. */
.peca{pointer-events:none;user-select:none}
.peca img{display:block;width:100%;height:auto}

/* 02 — a prancha, ao lado do texto */
.p2{flex-direction:row;align-items:center;gap:clamp(18px,2.4vw,30px);padding-right:22px}
.p2 .lado{display:flex;flex-direction:column;justify-content:center;flex:1 1 42%;min-width:0}
.p2 .cta{margin-top:22px;padding-top:0}
.p2 .peca-f{flex:1 1 58%;min-width:0}
.p2 .folha{display:block;position:relative;background:#fff;padding:6px;border-radius:7px;
  border:1px solid var(--borda);box-shadow:0 18px 36px rgba(84,66,28,.17);
  transform:rotate(-1.1deg);transition:transform .6s cubic-bezier(.2,.8,.2,1),box-shadow .6s}
.p2 .folha img{border-radius:3px}
.p2:hover .folha{transform:rotate(0deg) scale(1.025);box-shadow:0 26px 52px rgba(84,66,28,.22)}
.ampliar{position:absolute;right:11px;bottom:11px;display:inline-flex;align-items:center;gap:5px;
  padding:5px 10px;border-radius:9999px;background:rgba(255,253,248,.94);
  border:1px solid var(--borda);color:var(--verde2);
  font-size:10.5px;font-weight:700;letter-spacing:.6px;
  box-shadow:0 4px 12px rgba(84,66,28,.12)}
.ampliar svg{width:12px;height:12px;stroke:currentColor}

/* 03 e 04 — o objeto fecha o cartao.
   Ele fica no fluxo, como ultimo item da coluna, com margin-top:auto: assim
   encosta no pe do cartao seja qual for a altura da linha, e nunca sobe por
   cima da chamada. A margem negativa e que faz o objeto passar da borda e ser
   cortado pelo arredondamento — e ela e percentual, entao o corte e o mesmo em
   qualquer largura de tela. */
.p3 .cta,.p4 .cta{margin-top:18px;padding-top:0}
.p3 .peca-t,.p4 .peca-l{display:block;margin:auto -26px -26px}

.p3 .peca-t{perspective:1200px}
.p3 .tablet{display:block;width:78%;margin:0 auto -13%;border-radius:15px;padding:7px;
  background:linear-gradient(160deg,#3a4744,#212c2a 62%,#161f1d);
  box-shadow:0 -1px 0 rgba(255,255,255,.16) inset,0 18px 34px rgba(6,61,49,.26);
  transform:rotateX(9deg) rotateZ(-1.4deg);transform-origin:50% 100%;
  transition:transform .65s cubic-bezier(.2,.8,.2,1)}
.p3 .tablet img{border-radius:8px}
.p3:hover .tablet{transform:rotateX(5deg) rotateZ(-1.4deg) translateY(-3%)}

.p4 .livro{display:block;position:relative;width:54%;margin:0 auto -16%;
  transform:perspective(1000px) rotateY(-15deg) rotateZ(-1.2deg);
  transform-origin:14% 62%;
  box-shadow:16px 22px 38px rgba(84,66,28,.26);
  transition:transform .65s cubic-bezier(.2,.8,.2,1),box-shadow .65s}
.p4 .livro img{border-radius:2px 7px 7px 2px}
.p4 .livro .lombada{position:absolute;left:0;top:0;bottom:0;width:11px;border-radius:2px 0 0 2px;
  background:linear-gradient(90deg,rgba(0,0,0,.45),rgba(0,0,0,.16) 55%,rgba(0,0,0,0))}
.p4 .livro .brilho{position:absolute;inset:0;border-radius:2px 7px 7px 2px;
  background:linear-gradient(104deg,rgba(255,255,255,.16),rgba(255,255,255,0) 38%)}
.p4 .livro::after{content:"";position:absolute;right:-7px;top:6px;bottom:2px;width:7px;
  border-radius:0 2px 2px 0;transform:skewY(-3.2deg);
  background:linear-gradient(90deg,#f3f0e6,#d9d4c4)}
.p4:hover .livro{transform:perspective(1000px) rotateY(-9deg) rotateZ(-1.2deg) translateY(-3%);
  box-shadow:20px 28px 48px rgba(84,66,28,.3)}

@media(max-width:1020px){
  .p2 .lado{flex-basis:40%}
  .p2 .peca-f{flex-basis:60%}
}
@media(max-width:600px){
  /* no telefone o cartao 02 empilha: primeiro a palavra, depois a prancha */
  .p2{flex-direction:column;align-items:stretch;gap:20px;padding-right:26px}
  .p2 .lado,.p2 .peca-f{flex:0 0 auto}
  .p2 .cta{margin-top:20px}
  .p2 .folha{transform:rotate(-.7deg)}
  /* cartao inteiro no telefone: o objeto pode ser menor e continuar legivel */
  .p3 .tablet{width:68%;margin-bottom:-11%}
  .p4 .livro{width:42%;margin-bottom:-13%}
}''')

rep('''.p2,.p3,.p4{min-height:204px;color:var(--tinta);background:var(--carta);''',
    '''.p2,.p3,.p4{min-height:@MIN@px;color:var(--tinta);background:var(--carta);''')
rep('''.p1{grid-column:1/6;grid-row:1/3;min-height:432px;color:#fff;''',
    '''.p1{grid-column:1/6;grid-row:1/3;min-height:@MIN1@px;color:#fff;''')
rep('''@media(max-width:600px){.p3{grid-column:1/3}.p4{grid-column:1/3}.p2,.p3,.p4{min-height:172px}}''',
    '''@media(max-width:600px){.p3{grid-column:1/3}.p4{grid-column:1/3}.p2{min-height:0}.p3,.p4{min-height:@MINM@px}}''')

# medidas num lugar so: a faixa da peca e o recuo do texto sao o mesmo numero
for chave, valor in [('@MIN@', 336), ('@MIN1@', 690), ('@MINM@', 300)]:
    s = s.replace(chave, str(valor))
assert '@MIN@' not in s, 'sobrou marcador de medida'
# ---------------------------------------------------------------------------
# 4a. "Uma construção com"
# ---------------------------------------------------------------------------
rep('<small>uma construção com</small>', '<small>Uma construção com</small>')

# ---------------------------------------------------------------------------
# 4b. 2iM aplicada direto sobre o papel, sem o cartão branco
# ---------------------------------------------------------------------------
i = s.find('alt="2iM Inteligência Médica"')
ini = s.rfind('<img', 0, i)
fim = s.find('>', i) + 1
assert 'base64' in s[ini:fim], 'tag da 2iM nao localizada'
s = s[:ini] + '<img class="im2" src="%s" alt="2iM Inteligência Médica">' % datauri('ativos/2im-limpo.svg', 'image/svg+xml') + s[fim:]

rep('''.parceiros img.alta{height:clamp(34px,4.4vw,46px)}''',
    '''.parceiros img.alta{height:clamp(34px,4.4vw,46px)}
.parceiros img.im2{height:clamp(26px,3.3vw,36px)}''')

# ---------------------------------------------------------------------------
# 1c. rodapé: assinatura da marca
# ---------------------------------------------------------------------------
rep('''  <div class="wrap f-linha">
    <p>Caminhos Brilhantes · Escritório de Valor em Saúde · Unimed Governador Valadares</p>''',
    '''  <div class="wrap f-linha">
    <p class="f-marca"><img src="%s" alt="Caminhos Brilhantes"><span>Escritório de Valor em Saúde · Unimed Governador Valadares</span></p>'''
    % datauri('ativos/cb-horizontal-positivo.svg', 'image/svg+xml'))

rep('''footer{margin-top:auto;border-top:1px solid var(--borda);padding:18px 0;background:rgba(255,253,248,.72)}''',
    '''footer{margin-top:auto;border-top:1px solid var(--borda);padding:18px 0;background:rgba(255,253,248,.72)}
.f-marca{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.f-marca img{height:34px;width:auto;opacity:.95}''')

# ---------------------------------------------------------------------------
for termo in ['uma construção com', 'class="fantasma" aria-hidden="true">02',
              'class="fantasma" aria-hidden="true">03', 'class="fantasma" aria-hidden="true">04',
              'path.luz', 'M6 14 C 58 20', 'class="mock', 'class="janela"', 'velado']:
    assert termo not in s, ('residuo: ' + termo)
assert s.count('@keyframes acende') == len(PONTOS_P1), 'quadros-chave dos pontos ausentes'
for termo in ['Uma construção com', 'class="peca peca-f"', 'class="peca peca-t"',
              'class="peca peca-l"', 'class="folha"', 'class="tablet"', 'class="livro"',
              'class="ampliar"', 'andarilho', 'acende0', 'acende5',
              'path class="feito"', 'f-marca', 'img class="im2"']:
    assert termo in s, ('ausente: ' + termo)
# as tres pecas entram como arquivo da slug, nunca como data URI nem link de fora
for arquivo in ['peca-jornada.webp', 'peca-painel.webp', 'peca-relatorio.webp']:
    assert s.count('src="%s"' % arquivo) == 1, ('peça fora do lugar: ' + arquivo)
    assert os.path.exists(arquivo), ('peça não gerada: ' + arquivo)

open('hub-novo.html', 'w', encoding='utf-8').write(s)
print('saida    %s  %d bytes  -> hub-novo.html'
      % (hashlib.sha256(s.encode()).hexdigest()[:16], len(s.encode())))
