# -*- coding: utf-8 -*-
"""Prepara as duas assinaturas que a pagina passa a usar como arquivo da slug.

marca-cb.svg  — a logomarca horizontal do Caminhos Brilhantes, tirada do bucket
                e limpa do bloco de metadados C2PA, que responde por 42% do
                arquivo e nao serve para nada dentro de uma pagina. Vetor: a
                qualidade e a mesma em qualquer tamanho e em qualquer tela.
marca-evs.webp — o selo do Escritorio de Valor em Saude. So existe em bitmap no
                bucket; o original tem 2048px de largura, e aqui ele vira uma
                copia de 420px, larga o bastante para 3x a altura que o
                cabecalho usa.
"""
import os
import re
import subprocess

ORIGEM = 'ativos/cb-horizontal-positivo.svg'
s = open(ORIGEM, encoding='utf-8').read()
antes = len(s)
s = re.sub(r'<metadata>.*?</metadata>', '', s, flags=re.S)
s = re.sub(r'\s+xmlns:c2pa="[^"]*"', '', s)
assert '<metadata' not in s and 'c2pa' not in s, 'sobrou metadado no vetor'
assert s.count('<circle') == 6, 'os seis pontos da trilha'
open('publicar/marca-cb.svg', 'w', encoding='utf-8').write(s)
print('marca-cb.svg   %d -> %d bytes' % (antes, len(s)))

subprocess.run(['node', 'imagem.js', 'ativos/logos-evs-selo-hd-contorno.png',
                'publicar/marca-evs.webp', '420', '0', '0', '2048', '1274', '0.9'],
               check=True, env=dict(os.environ, NODE_PATH='/opt/node22/lib/node_modules'))
