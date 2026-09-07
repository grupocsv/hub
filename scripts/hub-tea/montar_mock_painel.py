# -*- coding: utf-8 -*-
"""Monta a tela do Painel Terapias Especiais que vai dentro do tablet do cartao 03.

O cromo e o do produto: HTML, CSS, barra lateral, topo, tipografia e componentes
sao lidos de p/painel-tea/index.html. Só o conteudo e injetado, porque o painel
so monta com dados autenticados.

Nada aqui e desfocado e nada aqui e inventado. A tela mostra a aba Terapias com
o catalogo clinico — as 17 terapias, as 5 disciplinas, os 4 metodos
estruturados —, que e informacao de catalogo e ja circula na Jornada publica.
Numero de carteira nao entra: pagamento, sessoes, criancas, concentracao e
custo ficam no documento restrito, atras do login que este mesmo cartao anuncia.
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
    'https://assets.grupocsv.com/logos/caminhos-brilhantes/01-trilha/horizontal-negativo.svg': 'ativos/cb-horizontal-negativo.svg',
    'https://assets.grupocsv.com/logos/caminhos-brilhantes/01-trilha/horizontal-positivo.svg': 'ativos/cb-horizontal-positivo.svg',
    'https://assets.grupocsv.com/logos/evs/selo-hd-contorno.png': 'ativos/logos-evs-selo-hd-contorno.png',
}
for remoto, local in mapa.items():
    s = s.replace(remoto, 'file://' + os.path.join(RAIZ, local))
assert 'assets.grupocsv.com' not in s, 'sobrou imagem do bucket sem cópia local'

# 3b. fora o portao de login: o mockup mostra a interface, nao a porta
i = s.find('<div id="gate"')
if i != -1:
    j = s.find('</body>', i)
    s = s[:i] + s[j:]

# 4. estado da interface: aba Terapias ativa
s = s.replace('<button class="nav-item" data-view="especialidades">',
              '<button class="nav-item active" data-view="especialidades">', 1)
s = s.replace('<h1 class="tb-title" id="tb_title">Visão Geral</h1>',
              '<h1 class="tb-title" id="tb_title">Terapias</h1>', 1)
s = s.replace('<div class="tb-sub" id="tb_sub">Síntese do período</div>',
              '<div class="tb-sub" id="tb_sub">Desdobramento por tipo de terapia</div>', 1)
s = s.replace('<span class="pc-datas" id="tb_datas" title="Início e fim do período selecionado">–</span>',
              '<span class="pc-datas" id="tb_datas">jan/2025 — jun/2026</span>')
s = s.replace('<button class="chip escopo" id="tb_escopo" type="button" aria-label="Escopo assistencial ativo; toque para alterar no Início">–</button>',
              '<button class="chip escopo" id="tb_escopo" type="button">Terapias Especiais</button>')
s = s.replace('<span class="chip" id="tb_periodo">–</span>',
              '<span class="chip" id="tb_periodo">18 competências</span>')
s = s.replace('<span class="chip soft hide-m" id="tb_atualizado">–</span>',
              '<span class="chip soft hide-m" id="tb_atualizado">Catálogo clínico</span>')

# 5. seletores de periodo, que o script preencheria
s = s.replace('<select id="period_type" aria-label="Granularidade do período"></select>',
              '<select id="period_type"><option>Tudo</option></select>')
s = s.replace('<select id="period_value" aria-label="Recorte do período"></select>',
              '<select id="period_value"><option>Período completo</option></select>')

# ---------------------------------------------------------------- conteudo
# As 17 terapias do catalogo, com a disciplina e o metodo de cada uma.
TERAPIAS = [
    ('Terapia ABA — Psicologia', 'Psicologia', 'ABA'),
    ('Terapia ABA — Fonoaudiologia', 'Fonoaudiologia', 'ABA'),
    ('Terapia ABA — Terapia Ocupacional', 'Terapia Ocupacional', 'ABA'),
    ('Psicopedagogia', 'Psicopedagogia', '—'),
    ('Método Denver — Terapia Ocupacional', 'Terapia Ocupacional', 'Denver'),
    ('Terapias especiais — centros de referência', 'Multidisciplinar', '—'),
    ('Método Denver — Psicologia', 'Psicologia', 'Denver'),
    ('Método Bobath — T.O. Neurológica', 'Terapia Ocupacional', 'Bobath'),
    ('Método TEACCH — Psicologia', 'Psicologia', 'TEACCH'),
    ('Integração Sensorial', 'Terapia Ocupacional', '—'),
    ('Método TEACCH — Terapia Ocupacional', 'Terapia Ocupacional', 'TEACCH'),
    ('Método TEACCH — Fonoaudiologia', 'Fonoaudiologia', 'TEACCH'),
    ('Método Bobath — Fonoaudiologia', 'Fonoaudiologia', 'Bobath'),
    ('Método Denver — Fonoaudiologia', 'Fonoaudiologia', 'Denver'),
    ('Terapeuta Ocupacional — TGD', 'Terapia Ocupacional', '—'),
    ('Psicólogo — TGD', 'Psicologia', '—'),
    ('Fonoaudiólogo — TGD', 'Fonoaudiologia', '—'),
]

DISCIPLINAS = ['Terapia Ocupacional', 'Fonoaudiologia', 'Psicologia',
               'Psicopedagogia', 'Multidisciplinar']
contagem = [(d, sum(1 for t in TERAPIAS if t[1] == d)) for d in DISCIPLINAS]
assert sum(n for _, n in contagem) == len(TERAPIAS) == 17, 'catálogo fora de 17'

KPIS = [
    ('Terapias clínicas', '17', 'catálogo com cobertura completa'),
    ('Disciplinas assistenciais', '5', 'psicologia, fono, T.O. e mais'),
    ('Métodos estruturados', '4', 'ABA, Denver, Bobath e TEACCH'),
    ('Competências no período', '18', 'janeiro/2025 a junho/2026'),
    ('Fases de clusterização', '3', 'M-CHAT-R, CARS e CBDF'),
    ('Faixa do rastreio', '0–9<span class="unit"> anos</span>', 'protocolo na atenção primária'),
]

ESTILO = """
<style>
  .mk-linha{display:grid;grid-template-columns:172px 1fr 30px;align-items:center;
    gap:14px;margin-bottom:13px}
  .mk-linha span.nome{font-size:12.5px;color:var(--ink-2)}
  .mk-linha span.qtd{font-size:12.5px;font-weight:650;color:var(--u-dark);text-align:right;
    font-variant-numeric:tabular-nums}
  .mk-bar{height:12px;border-radius:6px;background:var(--u-green)}
  .mk-nota{margin-top:16px;padding-top:12px;border-top:1px solid var(--line-soft);
    font-size:11.5px;color:var(--ink-4);font-family:var(--font-serif);font-style:italic}
  td.met{color:var(--ink-3)}
</style>
"""

kpis = ''.join(
    '<div class="kpi-card"><div class="label">%s</div><div class="num">%s</div>'
    '<div class="sub">%s</div></div>' % k for k in KPIS)

maior = max(n for _, n in contagem)
barras = ''.join(
    '<div class="mk-linha"><span class="nome">%s</span>'
    '<div class="mk-bar" style="width:%.1f%%"></div>'
    '<span class="qtd">%d</span></div>' % (d, 100.0 * n / maior, n)
    for d, n in contagem)

linhas = ''.join(
    '<tr><td class="prest">%s</td><td>%s</td><td class="met">%s</td></tr>' % t
    for t in TERAPIAS)

CONTEUDO = ESTILO + """
<div class="kpi-grid">%s</div>
<div class="card">
  <div class="card-hd"><div class="card-title">Terapias clínicas por disciplina</div>
    <div class="card-sub">Composição do catálogo — 17 terapias</div></div>
  %s
  <p class="mk-nota">Contagem de terapias do catálogo, não de atendimentos.</p>
</div>
<div class="sec-label">Catálogo clínico</div>
<div class="t-wrap">
  <table class="rank" aria-label="Terapias clínicas do catálogo">
    <thead><tr><th>Terapia clínica</th><th>Disciplina</th><th>Método</th></tr></thead>
    <tbody>%s</tbody>
  </table>
</div>
""" % (kpis, barras, linhas)

ALVO = ('<section class="view" id="view-especialidades" data-title="Terapias" '
        'data-sub="Desdobramento por tipo de terapia e combinações de cuidado"></section>')
assert ALVO in s, 'seção Terapias não localizada no painel'
s = s.replace(ALVO, ALVO[:-len('</section>')].replace('class="view"', 'class="view active"')
              + CONTEUDO + '</section>')

assert 'velado' not in s, 'sobrou desfoque no mockup'
open('mock-painel.html', 'w', encoding='utf-8').write(s)
print('mock-painel.html', len(s), 'bytes ·', len(TERAPIAS), 'terapias')
