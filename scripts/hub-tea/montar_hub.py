# -*- coding: utf-8 -*-
"""Hub TEA — identidade do Caminhos Brilhantes, janelas e trilha que acende.

Parte da pagina publicada (hub.unimedgv.com/tea/) sem o bloco de <head> que o
Worker injeta, e reconstroi os cartoes.

O que muda nesta versao, depois da leitura do gestor:

  1. A peca real deixa de dividir espaco com o texto. Cada mockup passa a ocupar
     uma faixa propria no pe do cartao, encostada nas bordas, e o texto ganha
     recuo equivalente. Nada de imagem por tras de palavra, nada de degrade
     tapando frase. O cartao do Relatorio segue o mesmo ritmo: a faixa existe,
     e nela mora so o icone.
  2. A trilha do cartao da Estrategia passa a acender. A estrela caminha, e cada
     ponto por onde ela passa se acende e FICA aceso; os dois ultimos, em amarelo,
     acendem mais forte. E a leitura da estrategia: o ganho da crianca se acumula
     ao longo do percurso, nao pisca e some. O traco tambem se preenche atras da
     estrela, marcando o caminho ja andado.

Segue valendo da versao anterior: a identidade oficial entra em tres lugares e
so tres — a trilha no lugar do risco do herói, a estrela caminhando no cartao 01
e a logomarca no rodape. O cabecalho continua sendo o lockup da Unimed.

Uso:  python3 montar_hub.py    # grava hub-novo.html
"""
import base64
import hashlib

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
# 2. janelas: a peça real ganha faixa própria, sem dividir espaço com o texto
# ---------------------------------------------------------------------------
rep('''      <span class="fantasma" aria-hidden="true">02</span>
      <span class="num">Nº 02</span>''', '''      <span class="num">Nº 02</span>''')
rep('''      <span class="cta">Ver a jornada <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
    </a>''',
    '''      <span class="cta">Ver a jornada <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      <span class="janela" aria-hidden="true"><img src="%s" alt="" loading="lazy" decoding="async"></span>
    </a>''' % datauri('mock-jornada.webp', 'image/webp'))

rep('''      <span class="fantasma" aria-hidden="true">03</span>
      <span class="restr">''', '''      <span class="restr">''')
rep('''      <span class="cta">Entrar no painel <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
    </a>''',
    '''      <span class="cta">Entrar no painel <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      <span class="janela" aria-hidden="true"><img src="%s" alt="" loading="lazy" decoding="async"></span>
    </a>''' % datauri('mock-painel.webp', 'image/webp'))

# ---------------------------------------------------------------------------
# 3. cartão 04: na mesma faixa, só o ícone do relatório
# ---------------------------------------------------------------------------
ICONE_REL = ('<span class="janela selo" aria-hidden="true">'
             '<svg viewBox="0 0 64 74" fill="none">'
             '<path d="M12 4h28l16 16v50a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"/>'
             '<path d="M40 4v12a4 4 0 0 0 4 4h12"/>'
             '<path class="linhas" d="M19 32h18M19 41h26"/>'
             '<path class="grafico" d="M20 60V51M30 60V43M40 60V47M50 60V38"/>'
             '</svg></span>')
rep('''      <span class="fantasma" aria-hidden="true">04</span>
      <span class="restr">''', '''      <span class="restr">''')
rep('''      <span class="cta">Baixar o relatório <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 11l6 6 6-6"/><path d="M5 21h14"/></svg></span>
    </a>''',
    '''      <span class="cta">Baixar o relatório <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 11l6 6 6-6"/><path d="M5 21h14"/></svg></span>
      %s
    </a>''' % ICONE_REL)

rep('''.fantasma{position:absolute;right:14px;bottom:-24px;font-family:var(--fd);font-style:italic;font-weight:700;
  font-size:130px;line-height:1;pointer-events:none;user-select:none}''',
    '''.fantasma{position:absolute;right:14px;bottom:-24px;font-family:var(--fd);font-style:italic;font-weight:700;
  font-size:130px;line-height:1;pointer-events:none;user-select:none}

/* janela: faixa propria da peca real, encostada nas bordas do cartao.
   O texto tem recuo equivalente, entao imagem e palavra nunca se cruzam. */
.janela{position:absolute;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;
  border-top:1px solid var(--borda);border-radius:0 0 26px 26px;background:#FFFDF8}
.janela img{display:block;width:100%;height:100%;object-fit:cover;object-position:left top;
  transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.p2 .janela{height:122px}
.p3 .janela{height:116px}
.p2:hover .janela img{transform:scale(1.05)}
.p3:hover .janela img{transform:scale(1.06)}
.p2{padding-bottom:140px}
.p3{padding-bottom:134px}

/* o cartao do relatorio segue o mesmo ritmo, com o icone no lugar da peca */
.p4 .janela.selo{height:116px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,rgba(232,128,26,.02),rgba(232,128,26,.05))}
.p4{padding-bottom:134px}
.janela.selo svg{width:54px;height:auto;stroke:var(--laranja);stroke-width:3;fill:none;
  stroke-linecap:round;stroke-linejoin:round;opacity:.5;
  transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .5s}
.janela.selo .grafico{stroke:var(--bronze);stroke-width:4.6}
.p4:hover .janela.selo svg{transform:translateY(-4px) scale(1.04);opacity:.72}''')

rep('''.p2,.p3,.p4{min-height:204px;color:var(--tinta);background:var(--carta);''',
    '''.p2,.p3,.p4{min-height:306px;color:var(--tinta);background:var(--carta);''')
rep('''.p1{grid-column:1/6;grid-row:1/3;min-height:432px;color:#fff;''',
    '''.p1{grid-column:1/6;grid-row:1/3;min-height:628px;color:#fff;''')

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
              'path.luz', 'M6 14 C 58 20', 'class="mock']:
    assert termo not in s, ('residuo: ' + termo)
assert s.count('@keyframes acende') == len(PONTOS_P1), 'quadros-chave dos pontos ausentes'
for termo in ['Uma construção com', 'class="janela"', 'janela selo', 'andarilho', 'acende0', 'acende5',
              'path class="feito"', 'f-marca', 'img class="im2"']:
    assert termo in s, ('ausente: ' + termo)
assert s.count('class="janela"') == 2, 'as duas janelas com peça real'

open('hub-novo.html', 'w', encoding='utf-8').write(s)
print('saida    %s  %d bytes  -> hub-novo.html'
      % (hashlib.sha256(s.encode()).hexdigest()[:16], len(s.encode())))
