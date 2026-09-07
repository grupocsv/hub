# -*- coding: utf-8 -*-
"""Hub TEA — adequacao a identidade visual do Caminhos Brilhantes.

Parte da pagina publicada (hub.unimedgv.com/tea/), sem o bloco de <head> que o
Worker injeta, e aplica quatro mudancas pedidas pelo gestor:

  1. A identidade oficial do Caminhos Brilhantes entra em tres lugares, e so:
     o risco do herói vira a trilha da marca (pontos crescentes ate a estrela),
     o cartao da Estrategia ganha a estrela caminhando pela trilha, e o rodape
     recebe a logomarca horizontal como assinatura. O cabecalho continua sendo
     o lockup institucional da Unimed: a marca da estrategia nao disputa com ele.
  2. Os cartoes 02 e 03 passam a exibir mockups reais. O da Jornada e uma
     captura do proprio diagrama publico; o do Painel usa a interface verdadeira
     do produto, com os numeros desfocados — o painel e restrito e seus
     agregados nao podem aparecer numa pagina aberta.
  3. O cartao 04 recebe um icone de relatorio, sem mockup.
  4. "uma construcao com" passa a "Uma construcao com" e a logomarca da 2iM
     passa a ser aplicada direto sobre o papel, sem o cartao branco.

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
# geometria oficial da marca: seis pontos crescentes e a estrela de cinco pontas
# ---------------------------------------------------------------------------
ESTRELA = ('M46.87 8.68Q47.44 6.71 48.86 8.19L51.23 10.64Q52.17 11.62 53.54 11.57L56.94 11.45'
           'Q58.99 11.38 58.03 13.19L56.43 16.2Q55.79 17.4 56.25 18.69L57.42 21.89Q58.12 23.81 56.1 23.46'
           'L52.75 22.86Q51.4 22.63 50.33 23.47L47.64 25.57Q46.03 26.83 45.74 24.8L45.27 21.42'
           'Q45.08 20.07 43.95 19.31L41.12 17.4Q39.43 16.26 41.27 15.36L44.33 13.87Q45.56 13.27 45.93 11.96Z')
EST_CX, EST_CY = 49.21, 16.77          # centro do desenho original da estrela


def estrela(cx, cy, escala, cor='#f47920', extra=''):
    return ('<path class="estrela" d="%s" fill="%s" transform="translate(%.2f %.2f) scale(%.3f)"%s/>'
            % (ESTRELA, cor, cx - EST_CX * escala, cy - EST_CY * escala, escala, extra))


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
# 1b. cartão 01: a estrela caminha pela trilha
# ---------------------------------------------------------------------------
CURVA = 'M14 194 C 110 168, 60 108, 158 92 S 340 118, 462 24'
PONTOS_P1 = [(23.6, 191.1, 3.2, .26), (86.5, 137.1, 4.0, .34), (155.3, 92.5, 4.8, .43),
             (240.5, 88.0, 5.7, .53), (325.8, 84.7, 6.7, .64), (402.5, 61.3, 7.8, .78)]
trilha_p1 = ''.join('<circle cx="%s" cy="%s" r="%s" fill="#fff" opacity="%s"/>' % p for p in PONTOS_P1)

rep('''      <svg class="caminho" viewBox="0 0 480 210" preserveAspectRatio="none" aria-hidden="true">
        <path class="base" d="M14 194 C 110 168, 60 108, 158 92 S 340 118, 462 24"/>
        <path class="luz" d="M14 194 C 110 168, 60 108, 158 92 S 340 118, 462 24"/>
        <circle cx="14" cy="194" r="4"/><circle cx="158" cy="92" r="3.4"/><circle cx="462" cy="24" r="4"/>
      </svg>''',
    '''      <svg class="caminho" viewBox="0 0 480 210" aria-hidden="true">
        <path class="base" d="%s"/>
        <g class="marcos">%s</g>
        <g class="andarilho">%s</g>
      </svg>''' % (CURVA, trilha_p1,
                   '<circle class="halo" r="13" fill="#f47920" opacity=".16"/>'
                   + '<g transform="translate(%.2f %.2f) scale(1.6)"><path class="estrela" d="%s" fill="#f47920"/></g>'
                   % (-EST_CX * 1.6, -EST_CY * 1.6, ESTRELA)))

rep('''.caminho{position:absolute;left:0;right:0;bottom:0;height:46%;pointer-events:none}
.caminho path.base{fill:none;stroke:rgba(255,255,255,.2);stroke-width:2.6;stroke-linecap:round;stroke-dasharray:.5 9}
.caminho path.luz{fill:none;stroke:#FFB26E;stroke-width:3;stroke-linecap:round;
  stroke-dasharray:34 640;stroke-dashoffset:674;animation:percorre 7.5s linear infinite;
  filter:drop-shadow(0 0 6px rgba(255,178,110,.8))}
@keyframes percorre{to{stroke-dashoffset:0}}
.caminho circle{fill:rgba(255,255,255,.5)}''',
    """  .caminho{position:absolute;left:0;right:0;bottom:0;height:52%;pointer-events:none}
  .caminho path.base{fill:none;stroke:rgba(255,255,255,.17);stroke-width:2.6;stroke-linecap:round;stroke-dasharray:.5 9}
  .caminho .andarilho{offset-path:path("@CURVA@");offset-rotate:0deg;
    animation:caminha 9s cubic-bezier(.45,0,.55,1) infinite;
    filter:drop-shadow(0 0 9px rgba(244,121,32,.75))}
  .caminho .andarilho .estrela{animation:gira 9s linear infinite;transform-box:fill-box;transform-origin:center}
  @keyframes caminha{0%{offset-distance:0%;opacity:0}
    7%{opacity:1}90%{opacity:1}100%{offset-distance:100%;opacity:0}}
  @keyframes gira{from{transform:rotate(-9deg)}50%{transform:rotate(9deg)}to{transform:rotate(-9deg)}}
  .p1:hover .caminho .andarilho{animation-duration:5.5s}""".replace('@CURVA@', CURVA))

rep('''  .caminho path.luz{animation:none}''',
    '''  .caminho .andarilho{animation:none;offset-distance:88%;opacity:1}
    .caminho .andarilho .estrela{animation:none}''')

# ---------------------------------------------------------------------------
# 2. mockups reais nos cartões 02 e 03
# ---------------------------------------------------------------------------
rep('''      <span class="fantasma" aria-hidden="true">02</span>
      <span class="num">Nº 02</span>
      <h2>Jornada do Paciente</h2>
      <p class="desc">O caminho da criança, da porta de entrada às Terapias Especiais.</p>''',
    '''      <span class="num">Nº 02</span>
      <h2>Jornada do Paciente</h2>
      <p class="desc">O caminho da criança, da porta de entrada às Terapias Especiais.</p>
      <span class="mock mock-j" aria-hidden="true"><img src="%s" alt="" loading="lazy" decoding="async"></span>'''
    % datauri('mock-jornada.webp', 'image/webp'))

rep('''      <span class="fantasma" aria-hidden="true">03</span>
      <span class="restr">''',
    '''      <span class="restr">''')

rep('''      <h2>Painel de Dados</h2>
      <p class="desc">Os dados vivos da carteira, para quem gere e decide.</p>''',
    '''      <h2>Painel de Dados</h2>
      <p class="desc">Os dados vivos da carteira, para quem gere e decide.</p>
      <span class="mock mock-p" aria-hidden="true"><img src="%s" alt="" loading="lazy" decoding="async"></span>'''
    % datauri('mock-painel.webp', 'image/webp'))

# ---------------------------------------------------------------------------
# 3. cartão 04: ícone de relatório no lugar do número fantasma
# ---------------------------------------------------------------------------
ICONE_REL = ('<svg class="icone-rel" viewBox="0 0 96 108" fill="none" aria-hidden="true">'
             '<path d="M20 6h38l22 22v74a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z"/>'
             '<path d="M58 6v18a4 4 0 0 0 4 4h18"/>'
             '<path class="linhas" d="M30 46h26M30 58h36"/>'
             '<path class="grafico" d="M31 88v-12M45 88V64M59 88V74M73 88V56"/>'
             '</svg>')
rep('''      <span class="fantasma" aria-hidden="true">04</span>
      <span class="restr">''', '''      %s
      <span class="restr">''' % ICONE_REL)

# ---------------------------------------------------------------------------
# CSS novo: mockups, ícone do relatório e altura dos cartões
# ---------------------------------------------------------------------------
rep('''.fantasma{position:absolute;right:14px;bottom:-24px;font-family:var(--fd);font-style:italic;font-weight:700;
  font-size:130px;line-height:1;pointer-events:none;user-select:none}''',
    '''.fantasma{position:absolute;right:14px;bottom:-24px;font-family:var(--fd);font-style:italic;font-weight:700;
  font-size:130px;line-height:1;pointer-events:none;user-select:none}

  /* mockups: a peça real, encostada na borda do cartão */
  .mock{position:absolute;pointer-events:none;border-radius:13px 0 0 0;overflow:hidden;
    border:1px solid rgba(11,58,44,.13);border-right:0;border-bottom:0;
    background:#fff;box-shadow:-14px -10px 34px rgba(84,66,28,.14);
    transition:transform .55s cubic-bezier(.2,.8,.2,1),box-shadow .55s}
  .mock img{display:block;width:100%;height:100%;object-fit:cover;object-position:left top}
  .mock::after{content:"";position:absolute;inset:0;
    background:linear-gradient(108deg,rgba(255,253,248,.97) 0%,rgba(255,253,248,.72) 22%,rgba(255,253,248,0) 58%)}
  .mock-j{right:0;bottom:0;width:57%;height:82%}
  .mock-j img{object-position:left top}
  .mock-p{right:0;bottom:0;width:50%;height:70%}
  .mock-p img{object-position:left top;transform:scale(1.12);transform-origin:left top}
  .p2:hover .mock,.p3:hover .mock{transform:translate(-7px,-7px);box-shadow:-20px -14px 46px rgba(84,66,28,.2)}

  /* cartão 04: um ícone, sem mockup */
  .icone-rel{position:absolute;right:24px;bottom:16px;width:112px;height:auto;pointer-events:none;
    stroke:var(--laranja);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;opacity:.15;
    transition:opacity .45s,transform .45s cubic-bezier(.2,.8,.2,1)}
  .icone-rel .linhas{stroke-width:3.4}
  .icone-rel .grafico{stroke-width:5.2;stroke:var(--bronze)}
  .p4:hover .icone-rel{opacity:.24;transform:translateY(-5px)}''')

rep('''.p2,.p3,.p4{min-height:204px;color:var(--tinta);background:var(--carta);''',
    '''.p2,.p3,.p4{min-height:252px;color:var(--tinta);background:var(--carta);''')
rep('''.p1{grid-column:1/6;grid-row:1/3;min-height:432px;color:#fff;''',
    '''.p1{grid-column:1/6;grid-row:1/3;min-height:520px;color:#fff;''')
rep('''.porta .desc{font-size:13.6px;margin-top:9px;max-width:340px}''',
    '''.porta .desc{font-size:13.6px;margin-top:9px;max-width:340px}
  .p2 .desc,.p3 .desc{max-width:212px}
  .p3 .desc{max-width:176px}
  .p4 .desc{max-width:186px}
  .p2 h2,.p3 h2,.p2 .num,.p3 .num,.p2 .cta,.p3 .cta,.p2 .desc,.p3 .desc,.restr{position:relative;z-index:3}
  .mock{z-index:1}''')

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
antigo = s[ini:fim]
assert 'base64' in antigo, 'tag da 2iM nao localizada'
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
              'path.luz', 'M6 14 C 58 20']:
    assert termo not in s, ('residuo: ' + termo)
for termo in ['Uma construção com', 'mock-j', 'mock-p', 'icone-rel', 'andarilho', 'f-marca', 'img class="im2"']:
    assert termo in s, ('ausente: ' + termo)

open('hub-novo.html', 'w', encoding='utf-8').write(s)
print('saida    %s  %d bytes  -> hub-novo.html'
      % (hashlib.sha256(s.encode()).hexdigest()[:16], len(s.encode())))
