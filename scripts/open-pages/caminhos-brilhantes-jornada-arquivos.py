#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Caminhos Brilhantes — acesso ao desenho original e ao relatório da Jornada TEA.

Parte da versão visual publicada em 7 de setembro de 2026. O script baixa a
página viva, remove o bloco de <head> injetado pelo Worker, confirma o hash-base
e aplica somente as alterações da seção Materiais.

O que muda:
  1. O card da Jornada mantém a página interativa e passa a oferecer o desenho
     em imagem de alta resolução e o PDF A3 original.
  2. A página incorpora o Relatório Técnico da Jornada em PDF, com alternativas
     para abrir em nova aba e baixar o arquivo.
  3. Em telas estreitas, o visualizador incorporado é substituído por ações
     diretas, evitando uma experiência ruim com leitores de PDF móveis.

Uso:
    python3 scripts/open-pages/caminhos-brilhantes-jornada-arquivos.py

Saída:
    index-novo.html
"""

import hashlib
import urllib.request


URL = "https://open.grupocsv.com/caminhos-brilhantes/"
HASH_BASE = "db8df0e741ecfe975c82208c311238f5e9fd1c22f752938ba2a321e60eb36e6d"
HASH_SAIDA = "e4f0265aa1e6e2222c460e5f972846573c26d6c89743ea3ab29c6c4f4e8c09a1"


def baixar_texto(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resposta:
        return resposta.read().decode("utf-8")


def sha(texto):
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()


def rep(texto, antigo, novo, quantidade=1):
    encontradas = texto.count(antigo)
    assert encontradas == quantidade, (
        "ocorrências inesperadas",
        encontradas,
        quantidade,
        antigo[:120],
    )
    return texto.replace(antigo, novo)


src = baixar_texto(URL)
print("entrada  %s  %d bytes" % (sha(src), len(src.encode("utf-8"))))

linhas = src.split("\n")
assert "_assets/favicons/favicon.ico" in linhas[3], "bloco injetado não encontrado"
assert linhas[20].strip() == "" and linhas[21].startswith("<meta charset"), (
    "limite do bloco injetado mudou"
)
s = "\n".join(linhas[:3] + linhas[21:])
assert sha(s) == HASH_BASE, (
    "a página-base mudou; reconciliar antes de publicar",
    sha(s),
    HASH_BASE,
)
assert s.count("og:title") == 1, "sobrou bloco OG duplicado"

css_atual = ".dl-jornada .dl-btn{background:#fff;color:var(--teal);flex-shrink:0}"
css_novo = """.dl-jornada .dl-btn{background:#fff;color:var(--teal);flex-shrink:0}
.dl-jornada .dl-actions{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap;flex-shrink:0}
.dl-jornada .dl-btn{border:1px solid rgba(255,255,255,.32);text-decoration:none}
.dl-jornada .dl-btn-secondary{background:rgba(255,255,255,.10);color:#fff}
.jornada-files-note{font-size:12px;color:rgba(255,255,255,.78);margin-top:10px;line-height:1.5}
.report-viewer{margin-top:28px;padding:28px;border:1px solid rgba(0,153,93,.18);border-radius:22px;background:rgba(255,255,255,.78);box-shadow:0 12px 36px rgba(3,79,75,.06)}
.report-viewer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:20px}
.report-viewer-copy{flex:1;min-width:min(300px,100%)}
.report-viewer-kicker{font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--verde);margin-bottom:8px}
.report-viewer-title{font-size:24px;font-weight:750;letter-spacing:-.45px;color:var(--txt);margin-bottom:8px}
.report-viewer-desc{font-size:14px;line-height:1.6;color:var(--txt-2);max-width:720px}
.report-viewer-actions,.pdf-mobile-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.report-action{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border-radius:999px;font-size:13px;font-weight:750;text-decoration:none;border:1px solid rgba(0,78,76,.16);color:var(--teal);background:#fff}
.report-action-primary{background:var(--verde);border-color:var(--verde);color:#fff}
.pdf-viewer-shell{width:100%;height:min(78vh,860px);min-height:620px;border:1px solid rgba(0,78,76,.16);border-radius:16px;background:#eef5f1}
.pdf-mobile-actions{display:none}
@media(max-width:767px){
  .dl-jornada .dl-actions{width:100%;justify-content:flex-start}
  .dl-jornada .dl-btn{flex:1 1 190px;justify-content:center;text-align:center}
  .report-viewer{padding:22px 18px}
  .report-viewer-title{font-size:21px}
  .report-viewer-actions{display:none}
  .pdf-viewer-shell{display:none}
  .pdf-mobile-actions{display:flex}
  .pdf-mobile-actions .report-action{flex:1 1 210px;text-align:center}
}"""
s = rep(s, css_atual, css_novo)

bloco_jornada_atual = """  <a href="https://open.grupocsv.com/jornada-tea/" class="dl dl-jornada" target="_blank" rel="noopener">
    <div class="dl-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
    </div>
    <div class="dl-body">
      <span class="dl-tag">Jornada do paciente</span>
      <div class="dl-title">Jornada TEA — Painel Ilustrado</div>
      <div class="dl-desc">O redesenho da jornada do paciente, da suspeição ao seguimento: coordenação do cuidado, avaliação diagnóstica no AAD, estratificação em clusters com <span class="nowrap">M-CHAT-R</span>, CARS e CBDF, e destinos na rede.</div>
      <div class="dl-meta"><span>Página interativa</span><span>·</span><span>Diagrama e apoio textual</span></div>
    </div>
    <span class="dl-btn">Abrir a jornada →</span>
  </a>"""

bloco_jornada_novo = """  <article class="dl dl-jornada" aria-labelledby="jornada-materiais-titulo">
    <div class="dl-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
    </div>
    <div class="dl-body">
      <span class="dl-tag">Jornada do paciente</span>
      <div class="dl-title" id="jornada-materiais-titulo">Jornada TEA — Painel Ilustrado</div>
      <div class="dl-desc">Explore a jornada em três formatos: página interativa, desenho original em alta resolução e PDF A3 para leitura, apresentação ou impressão.</div>
      <div class="dl-meta"><span>Versão interativa</span><span>·</span><span>Imagem em alta</span><span>·</span><span>PDF A3 · 2 páginas</span></div>
      <div class="jornada-files-note">No celular, a versão interativa reorganiza o conteúdo em cards. Para ver o desenho integral, use a imagem em alta ou o PDF A3.</div>
    </div>
    <div class="dl-actions" aria-label="Formatos da Jornada TEA">
      <a href="https://open.grupocsv.com/jornada-tea/" class="dl-btn" target="_blank" rel="noopener">Abrir versão interativa →</a>
      <a href="/caminhos-brilhantes/jornada-tea-diagrama-alta.png" class="dl-btn dl-btn-secondary" target="_blank" rel="noopener">Ver desenho em alta ↗</a>
      <a href="/caminhos-brilhantes/jornada-tea-a3.pdf" class="dl-btn dl-btn-secondary" download>Baixar PDF A3 ↓</a>
    </div>
  </article>"""
s = rep(s, bloco_jornada_atual, bloco_jornada_novo)

ancora_relatorio = """  </div>
  <p class="mat-nota">O painel de dados e o relatório consolidado das terapias especiais, de acesso restrito mediante login, estão reunidos no <a href="https://hub.unimedgv.com/tea/" target="_blank" rel="noopener">Hub TEA da Unimed Governador Valadares</a>.</p>"""

bloco_relatorio = """  </div>

  <div class="report-viewer" aria-labelledby="relatorio-jornada-titulo">
    <div class="report-viewer-head">
      <div class="report-viewer-copy">
        <div class="report-viewer-kicker">Leitura técnica · setembro de 2026</div>
        <h3 class="report-viewer-title" id="relatorio-jornada-titulo">Relatório Técnico da Jornada</h3>
        <p class="report-viewer-desc">Documento de 16 páginas sobre a arquitetura do cuidado coordenado, os fluxos assistenciais, a estratificação, a governança e a medição de resultados no neurodesenvolvimento infantil.</p>
      </div>
      <div class="report-viewer-actions" aria-label="Ações do relatório técnico">
        <a class="report-action report-action-primary" href="/caminhos-brilhantes/relatorio-tecnico-jornada-tea.pdf" target="_blank" rel="noopener">Abrir relatório em nova aba ↗</a>
        <a class="report-action" href="/caminhos-brilhantes/relatorio-tecnico-jornada-tea.pdf" download>Baixar relatório técnico ↓</a>
      </div>
    </div>
    <iframe class="pdf-viewer-shell" src="/caminhos-brilhantes/relatorio-tecnico-jornada-tea.pdf#view=FitH" title="Relatório Técnico da Jornada em PDF" loading="lazy"></iframe>
    <div class="pdf-mobile-actions" aria-label="Ações do relatório técnico para celular">
      <a class="report-action report-action-primary" href="/caminhos-brilhantes/relatorio-tecnico-jornada-tea.pdf" target="_blank" rel="noopener">Abrir relatório em nova aba ↗</a>
      <a class="report-action" href="/caminhos-brilhantes/relatorio-tecnico-jornada-tea.pdf" download>Baixar relatório técnico ↓</a>
    </div>
  </div>

  <p class="mat-nota">O painel de dados e o relatório consolidado das terapias especiais, de acesso restrito mediante login, estão reunidos no <a href="https://hub.unimedgv.com/tea/" target="_blank" rel="noopener">Hub TEA da Unimed Governador Valadares</a>.</p>"""
s = rep(s, ancora_relatorio, bloco_relatorio)

esperados = [
    "Abrir versão interativa",
    "Ver desenho em alta",
    "Baixar PDF A3",
    "Relatório Técnico da Jornada",
    "Abrir relatório em nova aba",
    "Baixar relatório técnico",
    "/caminhos-brilhantes/jornada-tea-diagrama-alta.png",
    "/caminhos-brilhantes/jornada-tea-a3.pdf",
    "/caminhos-brilhantes/relatorio-tecnico-jornada-tea.pdf#view=FitH",
]
for termo in esperados:
    assert termo in s, "conteúdo esperado ausente: " + termo

assert "dossi" not in s.lower(), "termo editorial proibido presente na interface"
assert s.count('href="https://open.grupocsv.com/jornada-tea/"') == 1
assert s.count('src="/caminhos-brilhantes/relatorio-tecnico-jornada-tea.pdf#view=FitH"') == 1
assert s.count('href="/caminhos-brilhantes/relatorio-tecnico-jornada-tea.pdf"') == 4

if HASH_SAIDA is not None:
    assert sha(s) == HASH_SAIDA, ("hash de saída divergente", sha(s), HASH_SAIDA)

with open("index-novo.html", "w", encoding="utf-8") as arquivo:
    arquivo.write(s)

print("saida    %s  %d bytes  -> index-novo.html" % (sha(s), len(s.encode("utf-8"))))
