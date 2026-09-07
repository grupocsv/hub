# -*- coding: utf-8 -*-
"""
Caminhos Brilhantes — curadoria de setembro de 2026.

Gera o index.html revisado da Open Page `caminhos-brilhantes` a partir da propria
pagina viva, sem depender de nenhum arquivo local. Determinístico: a mesma entrada
produz sempre a mesma saida, verificada por SHA-256.

Uso:
    python3 build_publish.py            # grava index-novo.html e imprime os hashes

Criterio de aceite (unico que vale):
  - SHA-256 do index-novo.html gerado (140.664 bytes):
    f91244926bd8565256ea1fec9c0c9d19a225e82e6ef8584de4715ae0b42fc838
  Se esse hash nao bater, NAO publicar e reportar.

O hash da entrada NAO e criterio de aceite: o Worker injeta no <head> os metadados
guardados no KV (titulo, descricao, og_image), entao a pagina viva muda de tamanho
sempre que esses metadados mudam. O script remove esse bloco antes de editar, e por
isso a saida se mantem estavel. Hashes de entrada ja observados:
  ad44fe8f691da1f1c1c310c94bdee6c0379148fa46d4aa1c38f52f9418b94cf0  124.055 bytes
  5b718fae2453fa9aa7c3adf5f50f2a2bd226d94ddbeb8daea82b7a0813d4c681  124.093 bytes
O script aborta sozinho se qualquer trecho esperado nao for encontrado.
"""
import hashlib
import re
import urllib.request

LP_URL = 'https://open.grupocsv.com/caminhos-brilhantes/'
SVG_BASE = 'https://assets.grupocsv.com/logos/caminhos-brilhantes/01-trilha/'


def baixar(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as r:
        return r.read().decode('utf-8')


def sha(txt):
    return hashlib.sha256(txt.encode('utf-8')).hexdigest()


def limpar_svg(txt):
    txt = re.sub(r'<metadata>.*?</metadata>', '', txt, flags=re.S)
    txt = re.sub(r'\s+xmlns:c2pa="[^"]*"', '', txt)
    return txt.strip()


src = baixar(LP_URL)
print('entrada  %s  %d bytes' % (sha(src), len(src.encode('utf-8'))))

linhas = src.split('\n')
assert '_assets/favicons/favicon.ico' in linhas[3], 'bloco injetado nao encontrado'
assert linhas[20].strip() == '' and linhas[21].startswith('<meta charset'), 'limite do bloco injetado mudou'
s = '\n'.join(linhas[:3] + linhas[21:])          # remove o bloco de head injetado pela plataforma
assert s.count('og:title') == 1, 'sobrou bloco OG duplicado'

simb = limpar_svg(baixar(SVG_BASE + 'simbolo-negativo.svg'))
horiz = limpar_svg(baixar(SVG_BASE + 'horizontal-negativo.svg'))
simb_deco = simb.replace('role="img" aria-label="Caminhos Brilhantes — Trilha"',
                         'aria-hidden="true" focusable="false"')
horiz_marca = horiz.replace('aria-label="Caminhos Brilhantes — Trilha"',
                            'aria-label="Caminhos Brilhantes"')
assert 'aria-hidden' in simb_deco and 'aria-label="Caminhos Brilhantes"' in horiz_marca


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, ('ocorrencias inesperadas', c, n, old[:80])
    s = s.replace(old, new)


# ============================== CSS ==============================
rep('.hero-lead{font-size:clamp(15px,1.6vw,17px);max-width:720px;color:rgba(255,255,255,.92);line-height:1.6}',
    '.hero-lead{font-size:clamp(15px,1.6vw,17px);max-width:720px;color:rgba(255,255,255,.92);line-height:1.6}\n'
    '.hero-mark{width:64px;height:64px;margin-bottom:18px}\n'
    '.hero-mark svg{width:100%;height:100%;display:block}\n'
    '@media(max-width:480px){.hero-meta{letter-spacing:1.5px}}')

rep('/* ===== PARCEIROS ===== */',
    '''/* ===== MARCOS ===== */
.marcos{display:grid;grid-template-columns:1fr;gap:20px}
@media(min-width:760px){.marcos{grid-template-columns:repeat(3,1fr)}}
.marco{background:#fff;border:1px solid var(--borda);border-radius:14px;padding:30px 26px;position:relative;overflow:hidden}
.marco-data{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--verde);margin-bottom:12px}
.marco-title{font-size:18px;font-weight:700;color:var(--teal);margin-bottom:10px;line-height:1.25}
.marco-text{font-size:14px;color:var(--txt-2);line-height:1.55}
.marco-destaque{background:linear-gradient(135deg,var(--teal) 0%,var(--teal-esc) 100%);border:none;color:#fff}
.marco-destaque .marco-data{color:var(--lima)}
.marco-destaque .marco-title{color:#fff}
.marco-destaque .marco-text{color:rgba(255,255,255,.9)}
.marco-mark{position:absolute;right:16px;top:14px;width:44px;height:44px;opacity:.9}
.marco-mark svg{width:100%;height:100%;display:block}

/* ===== PARCEIROS ===== */''')

rep('.dl-principal .dl-btn{background:var(--verde)}\n.dl-tecnico .dl-btn{background:var(--teal)}',
    '''.dl-principal .dl-btn{background:var(--verde)}
.dl-tecnico .dl-btn{background:var(--teal)}
.dl-jornada{background:linear-gradient(135deg,var(--verde-esc) 0%,var(--teal-esc) 100%);border:none;color:#fff;margin-bottom:18px;display:flex;gap:26px;align-items:center;flex-wrap:wrap}
.dl-jornada .dl-icon{background:rgba(255,255,255,.16);margin-bottom:0;flex-shrink:0}
.dl-jornada .dl-body{flex:1;min-width:min(240px,100%)}
.dl-jornada .dl-tag{background:rgba(0,0,0,.18);color:#fff;margin-bottom:10px}
.dl-jornada .dl-title{color:#fff}
.dl-jornada .dl-desc{color:rgba(255,255,255,.92);margin-bottom:10px}
.dl-jornada .dl-meta{color:rgba(255,255,255,.9);margin-bottom:0}
.dl-jornada .dl-btn{background:#fff;color:var(--teal);flex-shrink:0}
.nowrap{white-space:nowrap}
.mat-nota{font-size:13px;color:var(--txt-2);margin-top:24px;line-height:1.6;max-width:760px}
.mat-nota a{color:var(--teal);font-weight:600;text-decoration:underline;text-underline-offset:3px}''')

rep('.footer-right{font-size:11px;color:#6e7a78;letter-spacing:.5px}',
    '.footer-brand svg{width:150px;height:auto;display:block;opacity:.95}\n'
    '.footer-right{font-size:11px;color:#6e7a78;letter-spacing:.5px}')

# ============================== HERO ==============================
rep('<div class="hero-meta">Provimento de Saúde · Maio · 2026</div>',
    '<div class="hero-meta">Provimento de Saúde · Setembro&nbsp;·&nbsp;2026</div>')
rep('    <span class="hero-tag">Estratégia Institucional</span>\n    <h1>Caminhos Brilhantes</h1>',
    '    <div class="hero-mark">' + simb_deco + '</div>\n'
    '    <span class="hero-tag">Estratégia Institucional</span>\n    <h1>Caminhos Brilhantes</h1>')

# ============================== EIXOS ==============================
rep('operando de forma sinérgica, com framework chancelado pela ANS.',
    'operando de forma sinérgica, com o framework do IBRAVS.')
rep('<li>Ambulatório de Avaliação Diagnóstica (AAD) no CAI — 60 crianças/mês</li>',
    '<li>Ambulatório de Avaliação Diagnóstica (AAD) no CAI — em operação desde 2 de setembro de 2026 · 60 crianças/mês</li>')
rep('<li>Acreditação Quálix em 15–17 de junho de 2026</li>',
    '<li>Casa Unimed e clínicas credenciadas certificadas pelo Programa Quálix</li>')
rep('<li>Linha de cuidado TEA vinculada ao PTM da Casa Unimed</li>',
    '<li>Linha de cuidado TEA vinculada ao plano terapêutico da Casa Unimed</li>')
rep('<li>Framework IBRAVS chancelado pela ANS</li>',
    '<li>Framework IBRAVS desenvolvido no âmbito do acordo de cooperação técnica com a ANS</li>')

# ============================== MARCOS ==============================
marcos = '''
<!-- MARCOS -->
<section class="section" style="padding-top:8px">
  <div class="section-eyebrow">Da estratégia à execução</div>
  <h2 class="section-title">Marcos de 2026</h2>
  <p class="section-lead">O que já foi executado desde a concepção da estratégia, em maio de 2026.</p>

  <div class="marcos">
    <div class="marco marco-destaque">
      <div class="marco-mark">''' + simb_deco + '''</div>
      <div class="marco-data">14 de agosto</div>
      <h3 class="marco-title">Certificação Quálix em Terapias Especiais</h3>
      <p class="marco-text">A Casa Unimed recebeu o Selo Ouro, e todas as clínicas credenciadas submetidas à auditoria foram certificadas pela Unimed Federação Minas, após avaliação de 96 requisitos — são as primeiras clínicas credenciadas do Brasil certificadas pelo Programa Quálix em terapias especiais.</p>
    </div>
    <div class="marco">
      <div class="marco-data">20 de agosto</div>
      <h3 class="marco-title">Modelo Assistencial Pactuado com o IBRAVS</h3>
      <p class="marco-text">Estratificação em quatro clusters de complexidade e Matriz de Alocação de Recursos Terapêuticos, que orientam o plano terapêutico de cada criança.</p>
    </div>
    <div class="marco">
      <div class="marco-data">2 de setembro</div>
      <h3 class="marco-title">Ambulatório de Avaliação Diagnóstica em Operação</h3>
      <p class="marco-text">O AAD funciona no Centro de Atendimento Integrado (CAI), com capacidade para 60 crianças por mês em dois turnos por semana, e realiza a avaliação que confirma o cluster de cada criança e define o seu encaminhamento na rede.</p>
    </div>
  </div>
</section>
'''
rep('</section>\n\n<!-- PARCEIROS -->', '</section>\n' + marcos + '\n<!-- PARCEIROS -->')

# ============================== PARCEIROS ==============================
rep('Instituto Brasileiro de Valor em Saúde — framework chancelado pela ANS, cadência quinzenal, modelo de 4 camadas de incentivo',
    'Instituto Brasileiro de Valor em Saúde — framework desenvolvido no âmbito do acordo de cooperação técnica com a ANS, cadência quinzenal, modelo de quatro camadas de incentivo')
rep('Unimed Federação Minas — auditoria externa dos Centros de Terapias Especiais (15–17 de junho de 2026)',
    'Unimed Federação Minas — auditoria externa dos Centros de Terapias Especiais (15–17 de junho de 2026) e certificação da Casa Unimed e das clínicas credenciadas auditadas (14 de agosto de 2026)')
rep('Plataforma parceira da Unimed do Brasil — jornada terapêutica, engajamento familiar, PROMs e PREMs',
    'Plataforma parceira da Unimed do Brasil, já em operação — jornada terapêutica, engajamento familiar, PROMs e PREMs')

# ============================== MATERIAIS ==============================
rep('<p class="section-lead">Comece pela apresentação executiva para a visão estratégica. O relatório técnico aprofunda os detalhes assistenciais, operacionais e financeiros.</p>',
    '<p class="section-lead">O painel da jornada do paciente é o material mais recente da estratégia. A apresentação e o relatório técnico registram a concepção da estratégia, em maio de 2026; os marcos posteriores estão refletidos nesta página.</p>')

jornada = '''  <a href="https://open.grupocsv.com/jornada-tea/" class="dl dl-jornada" target="_blank" rel="noopener">
    <div class="dl-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
    </div>
    <div class="dl-body">
      <span class="dl-tag">Mais recente</span>
      <div class="dl-title">Jornada TEA — Painel Ilustrado</div>
      <div class="dl-desc">O redesenho da jornada do paciente, da suspeição ao seguimento: coordenação do cuidado, avaliação diagnóstica no AAD, estratificação em clusters com <span class="nowrap">M-CHAT-R</span>, CARS e CBDF, e destinos na rede.</div>
      <div class="dl-meta"><span>Página interativa</span><span>·</span><span>Diagrama e apoio textual</span></div>
    </div>
    <span class="dl-btn">Abrir a jornada →</span>
  </a>

  <div class="dl-wrap">'''
rep('  <div class="dl-wrap">\n    <a href="./apresentacao.pdf"', jornada + '\n    <a href="/caminhos-brilhantes/apresentacao.pdf"')
rep('<a href="./relatorio.pdf"', '<a href="/caminhos-brilhantes/relatorio.pdf"')
rep('<span class="dl-tag principal">Ponto de entrada</span>',
    '<span class="dl-tag principal">Visão estratégica · maio de 2026</span>')
rep('<span class="dl-tag tecnico">Aprofundamento</span>',
    '<span class="dl-tag tecnico">Aprofundamento · maio de 2026</span>')
rep('''      <span class="dl-btn">Baixar relatório ↓</span>
    </a>
  </div>
</section>''', '''      <span class="dl-btn">Baixar relatório ↓</span>
    </a>
  </div>
  <p class="mat-nota">O painel de dados e o relatório consolidado das terapias especiais, de acesso restrito mediante login, estão reunidos no <a href="https://hub.unimedgv.com/tea/" target="_blank" rel="noopener">Hub TEA da Unimed Governador Valadares</a>.</p>
</section>''')

# ============================== RODAPÉ ==============================
rep('    <div class="footer-right"><a href="https://grupocsv.com">grupocsv.com</a> · Maio · 2026</div>',
    '    <div class="footer-brand">' + horiz_marca + '</div>\n'
    '    <div class="footer-right"><a href="https://grupocsv.com" target="_blank" rel="noopener">grupocsv.com</a> · Setembro · 2026</div>')

# ============================== VERIFICAÇÕES FINAIS ==============================
for termo in ['chancelad', 'Maio · 2026', 'PTM', './apresentacao.pdf', './relatorio.pdf',
              'Ponto de entrada', '_assets/og/default.png']:
    assert termo not in s, ('residuo desatualizado: ' + termo)
for termo in ['Marcos de 2026', 'Certificação Quálix em Terapias Especiais', 'jornada-tea',
              'Setembro&nbsp;·&nbsp;2026', 'Selo Ouro', 'caminhos-brilhantes/og.png']:
    assert termo in s, ('conteudo esperado ausente: ' + termo)

open('index-novo.html', 'w', encoding='utf-8').write(s)
print('saida    %s  %d bytes  -> index-novo.html' % (sha(s), len(s.encode('utf-8'))))
