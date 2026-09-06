# -*- coding: utf-8 -*-
"""
Jornada TEA — revisao de setembro de 2026.

Gera o index.html revisado da Open Page `jornada-tea` a partir da propria pagina
viva, sem depender de nenhum arquivo local. Deterministico: a mesma entrada
produz sempre a mesma saida, verificada por SHA-256.

O que muda:
  1. Sai a sigla do plano terapeutico (PTM e PTM-PF), que segue indefinida entre
     PTM e PTI. Fica a descricao da funcao, sem comprometer nenhuma das duas
     nomenclaturas — mesma decisao aplicada na landing page Caminhos Brilhantes.
  2. O rodape das duas paginas do painel passa de maio para setembro de 2026.

Os rotulos do diagrama sao curtos porque o SVG tem largura fixa. Larguras medidas
no navegador com a fonte Inter real, para as duas caixas afetadas:
  - caixa do AAD (x 1035-1305, 270 px, texto centrado em 1170, 11.5 px):
      "Validacao do Cluster · Inclusao e Exclusao" ....... 232.8 px (linha irma)
      "Plano Terapeutico Inicial · Direcionamento" ....... 231.3 px  ADOTADO
      "Plano Terapeutico Inicial · Direcionamento a Rede"  272.1 px  estoura
  - cabecalho da rede (texto ancorado em 1575, conteudo termina em 1770, 10.5 px):
      "Plano Pactuado · Baseline QoLA" .................... 162.4 px  ADOTADO
      "Plano Terapeutico Pactuado · Baseline QoLA" ....... 223.9 px  estoura

Uso:
    python3 jornada-tea-set2026.py    # grava jornada-novo.html e imprime os hashes

Criterio de aceite (unico que vale):
  - SHA-256 do jornada-novo.html gerado, conferido contra o valor aprovado antes
    de publicar. O hash da entrada NAO e criterio: o Worker injeta no <head> os
    metadados guardados no KV, entao a pagina viva muda de tamanho sempre que
    esses metadados mudam. O script remove esse bloco antes de editar.
O script aborta sozinho se qualquer trecho esperado nao for encontrado.
"""
import hashlib
import urllib.request

URL = 'https://open.grupocsv.com/jornada-tea/'


def baixar(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as r:
        return r.read().decode('utf-8')


def sha(txt):
    return hashlib.sha256(txt.encode('utf-8')).hexdigest()


src = baixar(URL)
print('entrada  %s  %d bytes' % (sha(src), len(src.encode('utf-8'))))

linhas = src.split('\n')
assert '_assets/favicons/favicon.ico' in linhas[3], 'bloco injetado nao encontrado'
assert linhas[20].strip() == '' and linhas[21].startswith('<meta charset'), 'limite do bloco injetado mudou'
s = '\n'.join(linhas[:3] + linhas[21:])          # remove o bloco de head injetado pela plataforma
# Esta pagina nao traz OpenGraph proprio: quem serve os metadados e o KV
# (page:jornada-tea, com og_image ja apontando para jornada-tea/og.png). Nao
# adicionar tags aqui, sob pena de duplicar o bloco e fazer os agregadores
# lerem a primeira ocorrencia em vez da correta.
assert s.count('og:title') == 0, 'a pagina passou a ter OpenGraph proprio; revisar'


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('ocorrencias inesperadas', c, n, old[:80])
    s = s.replace(old, new)


# ---------- 1. diagrama (SVG) ----------
rep('>PTM Inicial · Direcionamento à Rede</text>',
    '>Plano Terapêutico Inicial · Direcionamento</text>')
rep('>PTM-PF · Baseline QoLA</text>',
    '>Plano Pactuado · Baseline QoLA</text>')

# ---------- 2. versao para telas estreitas ----------
rep('Validação do Cluster · Inclusão e Exclusão · PTM Inicial · Direcionamento à Rede',
    'Validação do Cluster · Inclusão e Exclusão · Plano Terapêutico Inicial · Direcionamento')
rep('<b style="color:#f47920">PTM-PF · Baseline QoLA</b>',
    '<b style="color:#f47920">Plano Pactuado · Baseline QoLA</b>')

# ---------- 3. apoio textual ----------
rep('<strong>proposta inicial do PTM</strong>',
    '<strong>proposta inicial do plano terapêutico</strong>')
rep('<h2>PTM-PF · Pactuado com a Família</h2>',
    '<h2>Plano Terapêutico Pactuado com a Família</h2>')
rep('conforme o <strong>Plano Terapêutico Multidisciplinar Pactuado com a Família</strong>',
    'conforme o <strong>plano terapêutico pactuado com a família</strong>')
rep('Alça fechada com quem executa o Plano Terapêutico Multidisciplinar.',
    'Alça fechada com quem executa o plano terapêutico.')

# ---------- 4. rodape das duas paginas ----------
rep('Unimed Governador Valadares — Maio · 2026 · Página 1 de 2',
    'Unimed Governador Valadares — Setembro · 2026 · Página 1 de 2')
rep('Unimed Governador Valadares — Maio · 2026 · Página 2 de 2',
    'Unimed Governador Valadares — Setembro · 2026 · Página 2 de 2')

# ---------- verificacoes finais ----------
for termo in ['PTM', 'Multidisciplinar', 'Maio · 2026']:
    assert termo not in s, ('residuo: ' + termo)
assert s.count('Setembro · 2026') == 2, 'rodape das duas paginas'
for termo in ['Plano Terapêutico Inicial · Direcionamento', 'Plano Pactuado · Baseline QoLA',
              'Plano Terapêutico Pactuado com a Família', 'plano terapêutico pactuado com a família']:
    assert termo in s, ('conteudo esperado ausente: ' + termo)

open('jornada-novo.html', 'w', encoding='utf-8').write(s)
print('saida    %s  %d bytes  -> jornada-novo.html' % (sha(s), len(s.encode('utf-8'))))
