# -*- coding: utf-8 -*-
"""
Jornada TEA — reaplicacao da retirada da sigla e ajustes de fato.

Contexto. Em 6 de setembro de 2026 a pagina foi republicada por
`jornada-tea-set2026.py`, sem a sigla do plano terapeutico. Horas depois, outra
frente publicou por cima uma revisao de conteudo bem maior — Auditoria em Saude
como area distinta da Central de Coordenacao do Cuidado, a Central como
referencia de apoio da familia, CARS graduando intensidade de sintomas, novas
atribuicoes do Escritorio de Valor em Saude — e nessa gravacao a sigla voltou.
O rodape de setembro permaneceu.

Este script NAO desfaz aquela revisao. Ele parte da pagina como esta no ar e
reaplica por cima o que o gestor decidiu, mais quatro ajustes de fato que ele
respondeu depois:

  1. Sai de novo a sigla do plano terapeutico (PTM e PTM-PF), indefinida entre
     PTM e PTI. Fica a descricao da funcao.
  2. Sai a contagem "duas clinicas credenciadas". O numero e de maio, mudou com a
     auditoria de certificacao de 14 de agosto e envelheceria de novo a cada
     credenciamento.
  3. Sai o numero de versao do Framework IBRAVS. A pactuacao de 20 de agosto pode
     ter trazido versao nova e nao ha confirmacao; a referencia de secao continua.
  4. Sai "No primeiro momento o suporte pode ser uma planilha". Era voz de
     planejamento para uma etapa que ja opera.
  5. Os numeros do AAD passam a ser rotulados como CAPACIDADE. O ambulatorio
     atende hoje uma media de 7 por semana, porque a segunda medica esta atuando
     na Central de Coordenacao do Cuidado, preparando a chegada do paciente. Os
     60 por mes e 14 por semana descrevem a capacidade instalada, nao o volume
     corrente.

O que NAO muda, por decisao do gestor: a Casa Unimed segue sem mencao ao Qualix
no diagrama, ainda que esteja certificada com Selo Ouro desde agosto.

Rotulos do diagrama medidos no navegador com a fonte Inter real, na caixa do AAD
(x 1035 a 1305, texto centrado em 1170):
    "Plano Terapeutico · Direcionamento a Rede" ......... 236.4 px  (11.5 px)
    "Capacidade · 60 Criancas/Mes · 14 por Semana" ...... 214.7 px  (10 px)
e no cabecalho da rede (ancorado em 1575, conteudo ate 1770, 10.5 px):
    "Plano Terapeutico Pactuado · QoLA" ................. 178.1 px

Uso:
    python3 jornada-tea-fatos-set2026.py   # grava jornada-novo.html

Criterio de aceite (unico que vale): o SHA-256 do arquivo gerado, conferido
contra o valor aprovado antes de publicar. O hash da entrada NAO e criterio,
porque o Worker injeta no <head> os metadados guardados no KV.
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
assert s.count('og:title') == 0, 'a pagina passou a ter OpenGraph proprio; revisar'
assert 'Setembro · 2026' in s, 'a pagina nao esta datada de setembro'


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('ocorrencias inesperadas', c, n, old[:80])
    s = s.replace(old, new)


# ---------- 1. sigla do plano terapeutico, no diagrama ----------
rep('>PTM Inicial · Direcionamento à Rede</text>',
    '>Plano Terapêutico · Direcionamento à Rede</text>')
rep('>PTM-PF · Baseline QoLA</text>',
    '>Plano Terapêutico Pactuado · QoLA</text>')

# ---------- 2. sigla, na versao para telas estreitas ----------
rep('Validação do Cluster · Inclusão e Exclusão · PTM Inicial · Direcionamento à Rede',
    'Validação do Cluster · Inclusão e Exclusão · Plano Terapêutico · Direcionamento à Rede')
rep('<b style="color:#f47920">PTM-PF · Baseline QoLA</b>',
    '<b style="color:#f47920">Plano Terapêutico Pactuado · Baseline QoLA</b>')

# ---------- 3. sigla, no apoio textual ----------
rep('<strong>proposta inicial do PTM</strong>',
    '<strong>proposta inicial do plano terapêutico</strong>')
# o titulo nomeia o ato, e nao o documento: batizar o artefato em Title Case
# reinstalaria a designacao em disputa
rep('<h2>PTM-PF · Pactuado com a Família</h2>',
    '<h2>Pactuação do Plano com a Família</h2>')
rep('conforme o <strong>Plano Terapêutico Multidisciplinar Pactuado com a Família</strong>',
    'conforme o <strong>plano terapêutico pactuado com a família</strong>')
rep('a pactuação com a família define o que é executável',
    'a pactuação define o que é executável')
# primeira mencao ao plano na ordem de leitura da tela 2: precisa de antecedente
rep('Alça fechada com quem executa o Plano Terapêutico Multidisciplinar.',
    'Alça fechada com quem executa o plano terapêutico pactuado com a família.')

# ---------- 4. contagem de clinicas credenciadas ----------
rep('Rede atual: recurso próprio na Casa Unimed e duas clínicas credenciadas certificadas pelo Programa Quálix.',
    'Rede atual: recurso próprio na Casa Unimed e clínicas credenciadas certificadas pelo Programa Quálix.')

# ---------- 5. versao do framework ----------
rep('<h2>Framework IBRAVS 1.7</h2>', '<h2>Framework IBRAVS</h2>')
rep('seguem o Framework IBRAVS versão 1.7 — seção 1.2.7',
    'seguem o Framework IBRAVS — seção 1.2.7')

# ---------- 6. voz de planejamento no visualizador clinico ----------
rep('qual pediatra encaminhou. No primeiro momento o suporte pode ser uma planilha. A função define o instrumento.',
    'qual pediatra encaminhou. A função define o instrumento.')

# ---------- 7. capacidade do AAD ----------
rep('opacity="0.72">60 Crianças/Mês · 14 por Semana</text>',
    'opacity="0.72">Capacidade · 60 Crianças/Mês · 14 por Semana</text>')
rep('Confirma o Cluster e Conclui a Etapa · 60 Crianças/Mês · 14 por Semana',
    'Confirma o Cluster e Conclui a Etapa · Capacidade · 60 Crianças/Mês · 14 por Semana')

# ---------- verificacoes finais ----------
for termo in ['PTM', 'Multidisciplinar', 'Maio · 2026', 'duas clínicas',
              'IBRAVS 1.7', 'versão 1.7', 'pode ser uma planilha']:
    assert termo not in s, ('residuo: ' + termo)
assert s.count('Setembro · 2026') == 2, 'rodape das duas telas'
assert s.count('Plano Terapêutico · Direcionamento à Rede') == 2, 'diagrama e versao estreita'
assert s.count('Capacidade · 60 Crianças/Mês · 14 por Semana') == 2, 'diagrama e versao estreita'
for termo in ['Plano Terapêutico Pactuado · QoLA', 'Plano Terapêutico Pactuado · Baseline QoLA',
              'Pactuação do Plano com a Família', 'plano terapêutico pactuado com a família',
              'A função define o instrumento.', 'Dimensionamento: 60 crianças/mês']:
    assert termo in s, ('conteudo esperado ausente: ' + termo)
# a revisao publicada pela outra frente tem de sobreviver intacta
for termo in ['Auditoria em Saúde · Área Distinta', 'Referência de Apoio e Navegação',
              'A Central é a Referência', 'Gravidade dos Sintomas', 'Leitura Assistencial da Demanda']:
    assert termo in s, ('a revisao da outra frente sumiu: ' + termo)

open('jornada-novo.html', 'w', encoding='utf-8').write(s)
print('saida    %s  %d bytes  -> jornada-novo.html' % (sha(s), len(s.encode('utf-8'))))
