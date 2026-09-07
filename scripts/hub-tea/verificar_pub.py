import hashlib
import re
import urllib.request

BASE = 'https://hub.unimedgv.com/tea/'


def pegar(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as r:
        return r.status, r.read()


st, bruto = pegar(BASE)
live = bruto.decode('utf-8')
L = live.split('\n')
assert '_assets/favicons/favicon.ico' in L[3]
corte = next(i for i, l in enumerate(L) if l.startswith('<meta charset'))
# a plataforma ainda acrescenta o beacon de analytics no fim do corpo
L = [l for l in L if 'cloudflareinsights.com' not in l]
corpo = '\n'.join(L[:3] + L[corte:])
alvo = open('hub-novo.html', encoding='utf-8').read()
h1 = hashlib.sha256(corpo.encode()).hexdigest()
h2 = hashlib.sha256(alvo.encode()).hexdigest()
print('publicado %s' % h1)
print('aprovado  %s' % h2)
print('IDENTICO' if h1 == h2 else '*** DIVERGENTE ***')

print('\n-- metadados servidos --')
for m in re.finditer(r'<meta property="og:(title|description|image)" content="([^"]*)"', live):
    print('  og:%-11s %s' % (m.group(1), m.group(2)[:88]))

print('\n-- conteúdo --')
# a contagem esperada vem do proprio arquivo aprovado, nao de um numero fixo:
# assim a conferencia nao envelhece quando o desenho muda
AUSENTES = ['uma construção com', 'class="fantasma"', 'class="janela"', 'class="mock', 'velado']
PRESENTES = ['Uma construção com', 'class="peca peca-f"', 'class="peca peca-t"',
             'class="peca peca-l"', 'class="ampliar"', 'src="peca-jornada.webp"',
             'src="peca-painel.webp"', 'src="peca-relatorio.webp"', 'andarilho',
             'path class="feito"', 'f-marca', 'img class="im2"']
for t in AUSENTES + PRESENTES:
    c, e = live.count(t), alvo.count(t)
    print('  %-26s %d (aprovado %d) %s' % (t, c, e, 'ok' if c == e else '*** DIFERE ***'))

print('\n-- arquivos da slug --')
import hashlib as _h
import os
for f in ['og.jpg', 'og.png', 'favicon.ico', 'apple-touch.png', 'email-hub.jpg', 'parceiro-evs.png',
          'parceiro-2im.png', 'parceiro-ibravs.webp', 'parceiro-unimed-femg.webp',
          'parceiro-qualix.webp', 'parceiro-neurosteps.webp',
          'peca-jornada.webp', 'peca-painel.webp', 'peca-relatorio.webp']:
    st, b = pegar(BASE + f)
    nota = ''
    local = os.path.join('publicar', f)
    if os.path.exists(local):
        igual = _h.sha256(b).hexdigest() == _h.sha256(open(local, 'rb').read()).hexdigest()
        nota = 'idêntico ao aprovado' if igual else '*** BYTES DIFEREM ***'
    print('  %-24s %s  %8d bytes  %s' % (f, st, len(b), nota))
