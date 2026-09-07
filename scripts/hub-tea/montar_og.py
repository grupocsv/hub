# -*- coding: utf-8 -*-
"""Monta a imagem de compartilhamento do Hub TEA — 1200x630, do zero.

O que a peça diz, e só isso: de quem é (Unimed GV), o que é (a logomarca
oficial do Caminhos Brilhantes), por que abrir (uma linha) e quem assina
(o selo do Escritório). Nada de entregáveis: o hub precisa continuar
valendo quando receber outras coisas, e uma OG que lista os quatro cartões
envelhece no dia em que entrar o quinto.

Três coisas que a versão anterior tinha e que saíram de propósito:

  1. O badge "HUB TEA" com bolinha laranja, reprovado pelo gestor por ter
     cara de peça gerada por IA. O título do link já diz Hub TEA; a imagem
     não precisa repetir num selo.
  2. O nome desenhado em fonte sans, no lugar da logomarca. Agora entra o
     vetor oficial, que é a marca de verdade.
  3. O grafismo de órbitas concêntricas à direita, decoração genérica que
     não vem de lugar nenhum. O fundo é o mesmo da página — os mesmos três
     brilhos radiais sobre o mesmo papel —, então a peça parece a página.

O tamanho da logomarca é o que decide a leitura no WhatsApp, onde a
miniatura chega perto de 300px de largura: com 724px aqui, ela ainda ocupa
mais da metade da largura da miniatura e continua reconhecível.
"""
import base64
import hashlib
import os

RAIZ = os.path.abspath('.')


def uri(caminho, tipo):
    with open(caminho, 'rb') as f:
        return 'data:%s;base64,%s' % (tipo, base64.b64encode(f.read()).decode())


HTML = '''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>OG — Hub TEA</title>
<link rel="stylesheet" href="file://@RAIZ@/../fonts/inter-local.css">
<link rel="stylesheet" href="file://@RAIZ@/fontes/fraunces-local.css">
<style>
  :root{
    --papel:#FAF6EE; --tinta:#0B3A2C; --verde:#0B5B47; --verde2:#00995d;
    --dim:#5C7265; --borda:#E9E2D2;
    --fd:"Fraunces",Georgia,serif;
    --fb:Inter,system-ui,sans-serif;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px}
  body{font-family:var(--fb);color:var(--tinta);-webkit-font-smoothing:antialiased;
    /* o mesmo fundo da página: três brilhos radiais sobre o mesmo papel */
    background:
      radial-gradient(46% 38% at 88% -6%,rgba(232,128,26,.1),transparent 60%),
      radial-gradient(42% 36% at -4% 14%,rgba(0,153,93,.09),transparent 60%),
      radial-gradient(52% 42% at 70% 112%,rgba(11,91,71,.08),transparent 64%),
      linear-gradient(174deg,#FBF8F1 0%,#FAF6EE 55%,#F8F3E8 100%);
    display:flex;flex-direction:column;padding:64px 68px 58px}

  .assinaturas{display:flex;align-items:center;justify-content:space-between}
  .assinaturas img.uni{height:52px;width:auto}
  .assinaturas img.evs{height:64px;width:auto}

  .centro{flex:1;display:flex;flex-direction:column;justify-content:center}
  .lockup{display:block;width:724px;height:auto;margin-left:-8px}
  /* a quebra é explícita: solta no travessão, e não no meio do trecho em
     destaque, que era onde a medida de linha estava cortando */
  .frase{margin-top:36px;font-size:32px;line-height:1.4;color:var(--dim);
    letter-spacing:-.15px}
  .frase b{color:var(--verde);font-weight:600}

  .pe{display:flex;align-items:baseline;justify-content:space-between;
    padding-top:22px;border-top:1px solid var(--borda)}
  .pe .url{font-family:var(--fd);font-weight:600;font-size:26px;color:var(--verde2);
    letter-spacing:-.2px;font-variation-settings:"opsz" 40}
  .pe .casa{font-size:16px;color:var(--dim);letter-spacing:.2px}
</style></head><body>
  <div class="assinaturas">
    <img class="uni" src="@UNI@" alt="Unimed Governador Valadares">
    <img class="evs" src="@EVS@" alt="Escritório de Valor em Saúde">
  </div>
  <div class="centro">
    <img class="lockup" src="@CB@" alt="Caminhos Brilhantes">
    <p class="frase">Tudo o que a estratégia produz —<br>
      <b>a um clique de quem cuida e de quem decide.</b></p>
  </div>
  <div class="pe">
    <span class="url">hub.unimedgv.com/tea</span>
    <span class="casa">Estratégia de Atenção à Saúde para o Neurodesenvolvimento Infantil</span>
  </div>
</body></html>'''

saida = (HTML.replace('@RAIZ@', RAIZ)
         .replace('@UNI@', uri('ativos/logos-unimed-gv-sem-box-pinheiro.png', 'image/png'))
         .replace('@EVS@', uri('publicar/marca-evs.webp', 'image/webp'))
         .replace('@CB@', uri('publicar/marca-cb.svg', 'image/svg+xml')))
open('og.html', 'w', encoding='utf-8').write(saida)
print('og.html  %s  %d bytes' % (hashlib.sha256(saida.encode()).hexdigest()[:16], len(saida.encode())))
