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
for t, esperado in [('Uma construção com', 1), ('uma construção com', 0), ('class="mock mock-j"', 1),
                    ('class="mock mock-p"', 1), ('icone-rel', 5), ('andarilho', 5),
                    ('class="fantasma"', 0), ('f-marca', 2)]:
    c = live.count(t)
    print('  %-24s %d (esperado %s) %s' % (t, c, esperado, 'ok' if c == esperado else '*** DIFERE ***'))

print('\n-- arquivos da slug --')
for f in ['og.jpg', 'og.png', 'favicon.ico', 'apple-touch.png', 'email-hub.jpg', 'parceiro-evs.png',
          'parceiro-2im.png', 'parceiro-ibravs.webp', 'parceiro-unimed-femg.webp',
          'parceiro-qualix.webp', 'parceiro-neurosteps.webp']:
    s, b = pegar(BASE + f)
    print('  %-28s %s  %d bytes' % (f, s, len(b)))
