# -*- coding: utf-8 -*-
"""
Caminhos Brilhantes — o numero do AAD passa a ser capacidade.

Complemento de `caminhos-brilhantes-set2026.py`. O eixo 01 anuncia "em operacao
desde 2 de setembro de 2026 · 60 criancas/mes", o que se le como volume corrente.
O ambulatorio atende hoje uma media de 7 por semana: a segunda medica esta
atuando na Central de Coordenacao do Cuidado, preparando a chegada do paciente,
de modo que os 60 por mes descrevem a capacidade instalada.

O marco de 2 de setembro ja dizia "com capacidade para 60 criancas por mes", e
por isso nao muda. Este script alinha o bullet do eixo a essa mesma leitura.

Uso:
    python3 caminhos-brilhantes-capacidade-aad.py   # grava index-novo.html

Criterio de aceite (unico que vale): o SHA-256 do arquivo gerado, conferido
contra o valor aprovado antes de publicar. O hash da entrada NAO e criterio,
porque o Worker injeta no <head> os metadados guardados no KV.
"""
import hashlib
import urllib.request

URL = 'https://open.grupocsv.com/caminhos-brilhantes/'


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
assert s.count('og:title') == 1, 'sobrou bloco OG duplicado'
assert 'Marcos de 2026' in s, 'a pagina nao esta na versao de setembro'

velho = ('<li>Ambulatório de Avaliação Diagnóstica (AAD) no CAI — em operação desde '
         '2 de setembro de 2026 · 60 crianças/mês</li>')
novo = ('<li>Ambulatório de Avaliação Diagnóstica (AAD) no CAI — em operação desde '
        '2 de setembro de 2026 · capacidade de 60 crianças/mês</li>')
assert s.count(velho) == 1, 'bullet do eixo 01 nao encontrado'
s = s.replace(velho, novo)

assert 'capacidade de 60 crianças/mês' in s
assert 'com capacidade para 60 crianças por mês em dois turnos por semana' in s

open('index-novo.html', 'w', encoding='utf-8').write(s)
print('saida    %s  %d bytes  -> index-novo.html' % (sha(s), len(s.encode('utf-8'))))
