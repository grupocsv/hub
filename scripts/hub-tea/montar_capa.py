# -*- coding: utf-8 -*-
"""Monta a capa do Relatorio Consolidado, que vira o livro impresso do cartao 04.

A capa segue o desenho do documento verdadeiro: banda branca com as duas
assinaturas, campo #003b3b, faixa #0d4545, a mesma hierarquia de sobretitulo,
titulo, subtitulo, grade de quatro marcadores e sumario.

O que NAO entra sao os numeros de carteira da capa real — pagamento total,
sessoes faturadas, criancas unicas, concentracao de prestadores e custo por
crianca. O documento e carimbado "USO RESTRITO", o cartao que o oferece fica
atras de login e a pagina do Hub e aberta e indexada. No lugar deles entram
contagens de catalogo, que ja sao publicas na Jornada: terapias, disciplinas,
competencias do periodo e capitulos. Nada e inventado.
"""
import base64
import os

RAIZ = os.path.abspath('.')


def uri(caminho, tipo):
    with open(caminho, 'rb') as f:
        return 'data:%s;base64,%s' % (tipo, base64.b64encode(f.read()).decode())


MARCADORES = [
    ('#f47920', 'Terapias clínicas', '17', 'catálogo com cobertura completa'),
    ('#00995d', 'Disciplinas', '5', 'psicologia, fono, T.O. e mais'),
    ('#4a90d9', 'Competências', '18', 'janeiro/2025 a junho/2026'),
    ('#6fcf9f', 'Capítulos', '13', 'do sumário ao método e fontes'),
]

CAPITULOS = [
    'Sumário Executivo', 'Evolução Mensal e Decomposição da Variação',
    'Disciplinas Assistenciais', 'As 17 Terapias Clínicas',
    'Rede Prestadora e Concentração', 'Casa Unimed — Serviço Próprio',
    'Canais de Pagamento e Reembolso', 'Perfil da População Atendida',
    'Combinações de Terapias', 'Perfis de Tratamento e Carteira Multidisciplinar',
    'Referências Internas e Solicitantes', 'Interface com a Neuropediatria',
    'Método, Fontes e Limitações',
]

grade = '\n'.join(
    '      <div class="m"><span class="risco" style="background:%s"></span>'
    '<span class="rot">%s</span><span class="val">%s</span>'
    '<span class="nota">%s</span></div>' % m for m in MARCADORES)

itens = '\n'.join('        <li><span class="n">%d</span>%s</li>' % (i + 1, c)
                  for i, c in enumerate(CAPITULOS))

HTML = '''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Capa — Relatório Consolidado</title>
<link rel="stylesheet" href="file://@RAIZ@/fontes/painel-local.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:636px;height:900px}
  body{font-family:'Source Sans 3',system-ui,sans-serif;background:#003b3b;color:#fff;
    display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}

  .assinaturas{flex:0 0 62px;background:#fff;display:flex;align-items:center;
    justify-content:space-between;padding:0 42px}
  .assinaturas img.evs{height:40px;width:auto}
  .assinaturas img.uni{height:34px;width:auto}

  .campo{flex:1;min-height:0;padding:44px 42px 0;display:flex;flex-direction:column}

  .sobre{font-size:10.5px;font-weight:600;letter-spacing:.36em;
    color:rgba(255,255,255,.46);text-transform:uppercase}
  h1{font-size:40px;font-weight:700;letter-spacing:-.022em;line-height:1.06;margin-top:24px}
  .sub{font-size:16px;color:rgba(255,255,255,.66);margin-top:16px}
  .regua{height:1px;background:rgba(255,255,255,.16);margin-top:28px}

  .grade{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:30px}
  .m{display:flex;flex-direction:column}
  .risco{width:26px;height:3px;border-radius:2px}
  .rot{font-size:8px;font-weight:600;letter-spacing:.19em;text-transform:uppercase;
    color:rgba(255,255,255,.5);margin-top:12px;line-height:1.4}
  .val{font-size:26px;font-weight:700;letter-spacing:-.01em;margin-top:7px}
  .nota{font-size:9px;line-height:1.42;color:rgba(255,255,255,.4);margin-top:6px}

  .faixa{margin-top:34px;background:#0d4545;border-left:4px solid #00995d;
    padding:22px 26px 24px;border-radius:0 8px 8px 0}
  .faixa .escopo{font-size:9px;font-weight:600;letter-spacing:.24em;white-space:nowrap;
    color:rgba(255,255,255,.5);text-transform:uppercase}
  .faixa p.frase{font-size:16px;line-height:1.45;margin-top:12px;color:rgba(255,255,255,.94)}

  .sumario{margin-top:38px}
  .sumario h2{font-size:10px;font-weight:700;letter-spacing:.3em;color:#3fbf8c;
    text-transform:uppercase}
  ul{list-style:none;margin-top:18px;columns:2;column-gap:30px}
  li{font-size:12px;line-height:1.34;color:rgba(255,255,255,.86);margin-bottom:12px;
    break-inside:avoid;padding-left:20px;position:relative}
  li .n{position:absolute;left:0;top:1px;font-size:9.5px;font-weight:700;color:#3fbf8c}

  .pe{flex:0 0 auto;padding:24px 42px 26px;text-align:center}
  .pe .selo{font-size:10px;font-weight:600;letter-spacing:.34em;
    color:rgba(255,255,255,.34);text-transform:uppercase}
  .pe .casa{font-size:10.5px;color:rgba(255,255,255,.26);margin-top:10px}
</style></head><body>
  <div class="assinaturas">
    <img class="evs" src="@EVS@" alt="Escritório de Valor em Saúde">
    <img class="uni" src="@UNI@" alt="Unimed Governador Valadares">
  </div>
  <div class="campo">
    <p class="sobre">Unimed Governador Valadares · Terapias Especiais</p>
    <h1>Painel Terapias Especiais</h1>
    <p class="sub">Relatório Consolidado — Janeiro de 2025 a Junho de 2026 (18 meses)</p>
    <div class="regua"></div>
    <div class="grade">
@GRADE@
    </div>
    <div class="faixa">
      <p class="escopo">Escritório de Valor em Saúde · Documento de gestão</p>
      <p class="frase">A consolidação assistencial das Terapias Especiais no período,
        para quem acompanha a estratégia e para quem decide.</p>
    </div>
    <div class="sumario">
      <h2>Sumário</h2>
      <ul>
@ITENS@
      </ul>
    </div>
  </div>
  <div class="pe">
    <p class="selo">Documento interno · Uso restrito</p>
    <p class="casa">Escritório de Valor em Saúde · Unimed Governador Valadares</p>
  </div>
</body></html>'''

saida = (HTML.replace('@RAIZ@', RAIZ)
         .replace('@EVS@', uri('ativos/logos-evs-selo-hd-contorno.png', 'image/png'))
         .replace('@UNI@', uri('ativos/logos-unimed-gv-box-pinheiro.png', 'image/png'))
         .replace('@GRADE@', grade).replace('@ITENS@', itens))
open('capa-rel.html', 'w', encoding='utf-8').write(saida)
print('capa-rel.html', len(saida), 'bytes')
