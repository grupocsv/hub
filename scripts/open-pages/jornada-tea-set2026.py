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

So os rotulos do DIAGRAMA sao curtos, porque o SVG tem largura fixa e o texto nao
quebra linha. A versao para telas estreitas usa as formas plenas: sao divs de fluxo
normal, que quebram linha, e quem abre no telefone nunca ve o SVG. Larguras medidas
no navegador com a fonte Inter real:
  - caixa do AAD (x 1035-1305, texto centrado em 1170, 11.5 px):
      "Validacao do Cluster · Inclusao e Exclusao" ....... 232.8 px (linha irma)
      "Plano Terapeutico · Direcionamento a Rede" ........ 236.4 px  ADOTADO
      "Plano Terapeutico Inicial · Direcionamento a Rede"  272.1 px  estoura por 2
  - cabecalho da rede (ancorado em 1575, conteudo termina em 1770, 10.5 px):
      "Plano Terapeutico Pactuado · QoLA" ................ 178.1 px  ADOTADO
      "Plano Terapeutico Pactuado · Baseline QoLA" ....... 223.9 px  estoura por 29
As duas linhas adotadas ficam com folga de 16.8 px de cada lado, praticamente igual
a folga da linha irma. "Inicial" e "Baseline" saem so do diagrama: o apoio textual
mantem "proposta inicial do plano terapeutico" e "colhe o baseline do QoLA".

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


# ---------- 1. diagrama (SVG), onde a largura manda ----------
rep('>PTM Inicial · Direcionamento à Rede</text>',
    '>Plano Terapêutico · Direcionamento à Rede</text>')
rep('>PTM-PF · Baseline QoLA</text>',
    '>Plano Terapêutico Pactuado · QoLA</text>')

# ---------- 2. versao para telas estreitas, que quebra linha e nao precisa encurtar ----------
# os rotulos espelham o diagrama, sem encurtar nada: "Inicial" e "com a Família" ficam
# de fora porque, em Title Case, grafariam por extenso as nomenclaturas em disputa
rep('Validação do Cluster · Inclusão e Exclusão · PTM Inicial · Direcionamento à Rede',
    'Validação do Cluster · Inclusão e Exclusão · Plano Terapêutico · Direcionamento à Rede')
rep('<b style="color:#f47920">PTM-PF · Baseline QoLA</b>',
    '<b style="color:#f47920">Plano Terapêutico Pactuado · Baseline QoLA</b>')

# ---------- 3. apoio textual ----------
# a lista de quatro entregas passa a usar ponto e virgula: com o sintagma de duas
# palavras, o "e" admitia leitura interna e a contagem so se sustentava pelo negrito
rep('São quatro entregas: <strong>validação da clusterização</strong> (cluster 0 a 3), '
    '<strong>critérios de inclusão e exclusão</strong>, <strong>proposta inicial do PTM</strong> '
    'e <strong>direcionamento para a rede</strong>.',
    'São quatro entregas: <strong>validação da clusterização</strong> (cluster 0 a 3); '
    '<strong>critérios de inclusão e exclusão</strong>; <strong>proposta inicial do plano terapêutico</strong>; '
    'e <strong>direcionamento para a rede</strong>.')
# o titulo passa a nomear o ato, e nao o documento: batizar o artefato em Title Case
# reinstalaria a nomenclatura que esta em disputa
rep('<h2>PTM-PF · Pactuado com a Família</h2>',
    '<h2>Pactuação do Plano com a Família</h2>')
rep('conforme o <strong>Plano Terapêutico Multidisciplinar Pactuado com a Família</strong>',
    'conforme o <strong>plano terapêutico pactuado com a família</strong>')
rep('a pactuação com a família define o que é executável',
    'a pactuação define o que é executável')
# esta e a primeira mencao ao plano na ordem de leitura: sem a sigla, precisa de antecedente
rep('Alça fechada com quem executa o Plano Terapêutico Multidisciplinar.',
    'Alça fechada com quem executa o plano terapêutico pactuado com a família.')

# ---------- 4. rodape das duas paginas ----------
rep('Unimed Governador Valadares — Maio · 2026 · Página 1 de 2',
    'Unimed Governador Valadares — Setembro · 2026 · Página 1 de 2')
rep('Unimed Governador Valadares — Maio · 2026 · Página 2 de 2',
    'Unimed Governador Valadares — Setembro · 2026 · Página 2 de 2')

# ---------- verificacoes finais ----------
for termo in ['PTM', 'Multidisciplinar', 'Maio · 2026']:
    assert termo not in s, ('residuo: ' + termo)
assert s.count('Setembro · 2026') == 2, 'rodape das duas paginas'
assert 'Plano Terapêutico Inicial' not in s, 'Title Case grafaria a nomenclatura em disputa'
assert s.count('Plano Terapêutico · Direcionamento à Rede') == 2, 'diagrama e versao estreita'
for termo in ['Plano Terapêutico Pactuado · QoLA', 'Plano Terapêutico Pactuado · Baseline QoLA',
              'Pactuação do Plano com a Família', 'plano terapêutico pactuado com a família']:
    assert termo in s, ('conteudo esperado ausente: ' + termo)

open('jornada-novo.html', 'w', encoding='utf-8').write(s)
print('saida    %s  %d bytes  -> jornada-novo.html' % (sha(s), len(s.encode('utf-8'))))
