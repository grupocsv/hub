# -*- coding: utf-8 -*-
"""
Caminhos Brilhantes — data no card da Jornada TEA.

Complemento de `caminhos-brilhantes-set2026.py`, para rodar DEPOIS que a Jornada
TEA (open.grupocsv.com/jornada-tea) tiver sido republicada com o rodape de
setembro de 2026.

Na curadoria de setembro o card da Jornada ficou sem mes, com o rotulo apenas
"Mais recente". O motivo era concreto: a pagina de destino ainda se declarava
"Maio · 2026" no rodape, e datar o card em setembro criaria uma contradicao
visivel a um clique. Republicada a Jornada, a contradicao deixou de existir e o
card volta a ter data, no mesmo padrao dos dois cards vizinhos
("Visao estrategica · maio de 2026" e "Aprofundamento · maio de 2026").

Uso:
    python3 caminhos-brilhantes-card-jornada.py   # grava index-novo.html

Criterio de aceite (unico que vale): o SHA-256 do index-novo.html gerado,
conferido contra o valor aprovado antes de publicar. O hash da entrada NAO e
criterio, porque o Worker injeta no <head> os metadados guardados no KV.
O script aborta sozinho se a pagina de destino ainda estiver datada em maio.
"""
import hashlib
import urllib.request

LP = 'https://open.grupocsv.com/caminhos-brilhantes/'
JORNADA = 'https://open.grupocsv.com/jornada-tea/'


def baixar(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as r:
        return r.read().decode('utf-8')


def sha(txt):
    return hashlib.sha256(txt.encode('utf-8')).hexdigest()


# pre-condicao: a peca de destino precisa estar datada de setembro
jornada = baixar(JORNADA)
assert 'Maio · 2026' not in jornada, 'a Jornada TEA ainda se declara Maio · 2026; publique-a antes'
assert jornada.count('Setembro · 2026') == 2, 'rodape da Jornada TEA nao confere'

src = baixar(LP)
print('entrada  %s  %d bytes' % (sha(src), len(src.encode('utf-8'))))

linhas = src.split('\n')
assert '_assets/favicons/favicon.ico' in linhas[3], 'bloco injetado nao encontrado'
assert linhas[20].strip() == '' and linhas[21].startswith('<meta charset'), 'limite do bloco injetado mudou'
s = '\n'.join(linhas[:3] + linhas[21:])          # remove o bloco de head injetado pela plataforma
assert s.count('og:title') == 1, 'sobrou bloco OG duplicado'
assert 'Marcos de 2026' in s, 'a pagina nao esta na versao de setembro'

velho = '<span class="dl-tag">Mais recente</span>'
novo = '<span class="dl-tag">Mais recente · setembro de 2026</span>'
assert s.count(velho) == 1, 'rotulo do card da Jornada nao encontrado'
s = s.replace(velho, novo)

# antes havia uma so ocorrencia, no marco do Ambulatorio ("em operacao desde 2 de
# setembro de 2026"); a segunda e a que este script acrescenta ao card da Jornada
assert s.count('setembro de 2026') == 2
# as quatro mencoes a maio (lead dos Marcos, lead de Materiais e as duas tags dos
# PDFs) continuam intactas: elas datam a concepcao da estrategia
assert s.count('maio de 2026') == 4

open('index-novo.html', 'w', encoding='utf-8').write(s)
print('saida    %s  %d bytes  -> index-novo.html' % (sha(s), len(s.encode('utf-8'))))
