# -*- coding: utf-8 -*-
"""Monta um mockup do Painel Terapias Especiais a partir da interface real.

Usa o HTML e o CSS verdadeiros do painel (p/painel-tea/index.html) para que o
cromo — barra lateral, topo, tipografia, componentes — seja o do produto. O que
NAO entra sao os dados: os numeros aparecem desfocados e os graficos nao trazem
escala. O painel e de acesso restrito e seus agregados nao podem ir para uma
pagina publica; o desfoque tambem evita inventar numero que alguem leia como
verdadeiro.
"""
import os
import re
from html.parser import HTMLParser


class Scripts(HTMLParser):
    """Localiza os elementos <script> pelo analisador de HTML da biblioteca padrao.

    Expressao regular nao serve para isto. HTML aceita <SCRIPT>, aceita
    </script > com espaco antes do fecha, e cada variante escapa de um padrao
    simples; a checagem de codigo do repositorio reprova o padrao por isso, com
    razao. Aqui o script que sobrevivesse nao seria um detalhe: ele tentaria
    buscar dados autenticados e traria de volta o portao de login por cima do
    mockup. O analisador devolve as posicoes, e o corte e feito por indice, sem
    reescrever o resto do documento.
    """

    def __init__(self, texto):
        super().__init__(convert_charrefs=False)
        self.texto = texto
        self.inicios_de_linha = [0]
        for linha in texto.splitlines(keepends=True):
            self.inicios_de_linha.append(self.inicios_de_linha[-1] + len(linha))
        self.intervalos = []
        self.abertura = None

    def _offset(self, posicao):
        linha, coluna = posicao
        return self.inicios_de_linha[linha - 1] + coluna

    def handle_starttag(self, tag, attrs):
        if tag == 'script' and self.abertura is None:
            self.abertura = self._offset(self.getpos())

    def handle_endtag(self, tag):
        if tag == 'script' and self.abertura is not None:
            fim = self.texto.index('>', self._offset(self.getpos())) + 1
            self.intervalos.append((self.abertura, fim))
            self.abertura = None


def sem_scripts(texto):
    leitor = Scripts(texto)
    leitor.feed(texto)
    leitor.close()
    for inicio, fim in reversed(leitor.intervalos):
        texto = texto[:inicio] + texto[fim:]
    return texto

RAIZ = os.path.abspath('.')
FONTE = '/home/user/hub/p/painel-tea/index.html'

s = open(FONTE, encoding='utf-8').read()

# 1. fora todo o JavaScript: o painel so monta com dados autenticados
s = sem_scripts(s)

# 2. fontes locais, para o render sair fiel sem rede
fontes = open('fontes/painel-local.css', encoding='utf-8').read()
s = s.replace('<style>', '<style>\n' + fontes + '\n', 1)
s = re.sub(r'<link[^>]*fonts\.(googleapis|gstatic)[^>]*>', '', s, flags=re.I)

# 3. imagens do bucket -> copias locais
mapa = {
    'https://assets.grupocsv.com/logos/unimed-gv/box-pinheiro.png': 'ativos/logos-unimed-gv-box-pinheiro.png',
    'https://assets.grupocsv.com/logos/unimed-gv/sem-box-pinheiro.png': 'ativos/logos-unimed-gv-sem-box-pinheiro.png',
    'https://assets.grupocsv.com/logos/evs/selo-white-web-360.png': 'ativos/logos-evs-selo-white-web-360.png',
    'https://assets.grupocsv.com/logos/evs/icon-1x1-sem-fundo.png': 'ativos/logos-evs-icon-1x1-sem-fundo.png',
    'https://assets.grupocsv.com/logos/axiacare/horizontal-positivo.svg': 'ativos/logos-axiacare-horizontal-positivo.svg',
    'https://assets.grupocsv.com/logos/grupo-csv/horizontal-positivo-transparente.png': 'ativos/logos-grupo-csv-horizontal-positivo-transparente.png',
}
for remoto, local in mapa.items():
    s = s.replace(remoto, 'file://' + os.path.join(RAIZ, local))

# 3b. fora o portao de login: o mockup mostra a interface, nao a porta
i = s.find('<div id="gate"')
if i != -1:
    j = s.find('</body>', i)
    s = s[:i] + s[j:]

# 4. estado da interface: aba Visão Geral ativa
s = s.replace('<button class="nav-item" data-view="visao">',
              '<button class="nav-item active" data-view="visao">', 1)
s = s.replace('<section class="view" id="view-visao"',
              '<section class="view active" id="view-visao"', 1)
s = s.replace('<span class="pc-datas" id="tb_datas" title="Início e fim do período selecionado">–</span>',
              '<span class="pc-datas" id="tb_datas">jan/2024 — dez/2025</span>')
s = s.replace('<button class="chip escopo" id="tb_escopo" type="button" aria-label="Escopo assistencial ativo; toque para alterar no Início">–</button>',
              '<button class="chip escopo" id="tb_escopo" type="button">Terapias Especiais</button>')
s = s.replace('<span class="chip" id="tb_periodo">–</span>',
              '<span class="chip" id="tb_periodo">24 competências</span>')
s = s.replace('<span class="chip soft hide-m" id="tb_atualizado">–</span>',
              '<span class="chip soft hide-m" id="tb_atualizado">Dados agregados</span>')

# 5. seletores de periodo, que o script preencheria
s = s.replace('<select id="period_type" aria-label="Granularidade do período"></select>',
              '<select id="period_type"><option>Tudo</option></select>')
s = s.replace('<select id="period_value" aria-label="Recorte do período"></select>',
              '<select id="period_value"><option>Período completo</option></select>')

# ---------------------------------------------------------------- conteudo
# numeros com .velado ficam desfocados: existe dado ali, mas ele nao e legivel
VELADO = """
<style>
  .velado{filter:blur(5.5px);-webkit-filter:blur(5.5px);user-select:none}
  .kpi-card .num.velado{letter-spacing:.5px}
  .mk-bar{height:11px;border-radius:6px;background:var(--u-green)}
  .mk-linha{display:grid;grid-template-columns:150px 1fr;align-items:center;gap:12px;margin-bottom:11px}
  .mk-linha span{font-size:12px;color:var(--ink-2)}
  .mk-eixo{display:flex;justify-content:space-between;margin-top:14px;padding-top:9px;border-top:1px solid var(--line-soft);font-size:10.5px;color:var(--ink-4)}
</style>
"""


def kpi(rot, num, sub):
    return ('<div class="kpi-card"><div class="label">%s</div>'
            '<div class="num velado">%s</div><div class="sub">%s</div></div>' % (rot, num, sub))


def barra(nome, pct):
    return ('<div class="mk-linha"><span>%s</span>'
            '<div class="mk-bar" style="width:%s%%"></div></div>' % (nome, pct))


# serie mensal desenhada como forma, sem escala nem rotulo de valor
pontos = [58, 44, 66, 52, 74, 61, 83, 70, 92, 78, 96, 88]
larg, alt = 520, 190
passo = larg / (len(pontos) - 1)
coords = [(i * passo, alt - (v / 100) * (alt - 26) - 13) for i, v in enumerate(pontos)]
linha = ' '.join('%.1f,%.1f' % c for c in coords)
area = 'M0,%d ' % alt + ' '.join('L%.1f,%.1f' % c for c in coords) + ' L%d,%d Z' % (larg, alt)

CONTEUDO = VELADO + """
<div class="kpi-grid">
  %s%s%s%s%s%s
</div>
<div class="grid-2">
  <div class="card">
    <div class="card-hd"><div class="card-title">Evolução mensal</div>
      <div class="card-sub">Sessões por competência</div></div>
    <div class="chart-box short" style="height:auto">
      <svg viewBox="0 0 %d %d" style="width:100%%;height:auto;display:block">
        <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#00995d" stop-opacity=".26"/>
          <stop offset="1" stop-color="#00995d" stop-opacity="0"/></linearGradient></defs>
        <path d="%s" fill="url(#g1)"/>
        <polyline points="%s" fill="none" stroke="#00995d" stroke-width="2.6"
          stroke-linecap="round" stroke-linejoin="round"/>
        %s
      </svg>
      <div class="mk-eixo"><span>jan/2024</span><span>dez/2025</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-hd"><div class="card-title">Distribuição por terapia</div>
      <div class="card-sub">Participação no período</div></div>
    %s
  </div>
</div>
""" % (
    kpi('Crianças em terapia', '1.234', 'no período completo'),
    kpi('Sessões realizadas', '123.456', 'todas as terapias'),
    kpi('Terapias ativas', '17', 'catálogo consolidado'),
    kpi('Prestadores', '123', 'rede e recurso próprio'),
    kpi('Casa Unimed', '12.345', 'sessões em recurso próprio'),
    kpi('Competências', '24', 'jan/2024 a dez/2025'),
    larg, alt, area, linha,
    ''.join('<circle cx="%.1f" cy="%.1f" r="3.1" fill="#fff" stroke="#00995d" stroke-width="2.2"/>' % c
            for c in coords[::3]),
    ''.join(barra(n, p) for n, p in [
        ('Psicologia', 92), ('Fonoaudiologia', 78), ('Terapia Ocupacional', 66),
        ('Fisioterapia', 41), ('Nutrição', 27), ('Musicoterapia', 18)]),
)

s = s.replace('<section class="view active" id="view-visao" data-title="Visão Geral" data-sub="Síntese do período"></section>',
              '<section class="view active" id="view-visao" data-title="Visão Geral" data-sub="Síntese do período">'
              + CONTEUDO + '</section>')

open('mock-painel.html', 'w', encoding='utf-8').write(s)
print('mock-painel.html', len(s), 'bytes')
