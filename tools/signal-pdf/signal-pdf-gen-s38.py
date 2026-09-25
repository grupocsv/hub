#!/usr/bin/env python3
"""
Signal™ PDF Generator — S38/2026
Resumo Semanal Estratégico | Grupo CSV
REGRA INVIOLÁVEL: exatamente 1 página A4.
"""
import os
import shutil
import subprocess
from fpdf import FPDF

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(SCRIPT_DIR, "_fonts")
LOGO_PATH = os.path.join(SCRIPT_DIR, "grupo_csv_logo_negative.png")

CSV_BLUE = (25, 99, 150)
CSV_GREEN = (45, 191, 127)
CSV_DARK = (27, 30, 36)
DARK_TEXT = (55, 55, 55)
MID_TEXT = (100, 110, 120)
LIGHT_LINE = (210, 218, 226)
CARD_BG = (249, 250, 252)
WHITE = (255, 255, 255)

TAG_COLORS = {
    "PARCERIAS": CSV_GREEN,
    "GOVERNANÇA": CSV_BLUE,
    "VBHC": CSV_GREEN,
    "LINHAS DE CUIDADO": CSV_GREEN,
    "OPERACIONAL": CSV_GREEN,
    "OPERAÇÕES": CSV_GREEN,
    "ESTRATÉGIA": CSV_BLUE,
    "ASSISTENCIAL": CSV_GREEN,
    "RELAÇÕES INSTITUCIONAIS": CSV_BLUE,
    "ONCOLOGIA": CSV_GREEN,
    "NAVEGAÇÃO": CSV_GREEN,
    "QUALIDADE": CSV_GREEN,
    "NORMATIVO": CSV_BLUE,
    "TECNOLOGIA": CSV_BLUE,
    "FINANCEIRO": CSV_BLUE,
    "IMUNOBIOLÓGICOS": CSV_GREEN,
    "DADOS": CSV_BLUE,
}

SEMANA = "38"
PERIODO = "14 a 18 de setembro de 2026"
DATA_GERACAO = "25/09/2026"
EXECUTIVO = "Guilherme Thomé, MD, MBA"
CARGO = "Superintendente Médico | Fundador Grupo CSV"

METRICAS = [
    ("4", "Páginas Notion"),
    ("48", "E-mails Unimed"),
    ("6", "Fatos estratégicos"),
    ("14", "Movimentos no Dicionário"),
    ("v4.14", "Dicionário Oficial"),
]

FATOS = [
    {
        "tag": "FINANCEIRO",
        "titulo": "DRG fecha o quadrimestre na faixa máxima de bonificação",
        "resumo": "O Hospital Unihealth GV alcançou 20% de bonificação. O período fechou com IQIC médio de 185%, eficiência operacional de 81,18%, readmissões de 2,04% e nenhum óbito entre pacientes de muito baixo risco.",
    },
    {
        "tag": "ASSISTENCIAL",
        "titulo": "GCE valida a ficha multidimensional em versão final",
        "resumo": "O EVS e o GCE formalizaram a versão 2.0 da Ficha de Admissão Multidimensional — Atenção Domiciliar. O instrumento integra KPS, Score GCE, Índice de Charlson e PPSv2; a parametrização no Navia é o próximo passo.",
    },
    {
        "tag": "DADOS",
        "titulo": "Tabela Matriz EVS passa a apoiar terapias especiais",
        "resumo": "A ferramenta foi conectada ao Cardio por VBA no Excel, com consulta somente leitura. Ela substitui o BPM no acompanhamento das Solicitações de Terapias Especiais e permite consultar a situação atual e o histórico por período.",
    },
    {
        "tag": "LINHAS DE CUIDADO",
        "titulo": "Ymunity inicia alertas preventivos de vencimento",
        "resumo": "A rotina diária entrou em operação em 17 de setembro para sinalizar relatórios vencidos ou próximos do vencimento. O fluxo exclui pacientes inativos e apoia a renovação oportuna, a continuidade do cuidado e a rastreabilidade.",
    },
    {
        "tag": "LINHAS DE CUIDADO",
        "titulo": "Piloto Caminhos Brilhantes estrutura seguimento clínico",
        "resumo": "O AAD manteve os atendimentos piloto, e o EVS organizou a pasta documental para acompanhamento longitudinal. A pré-clusterização ainda não opera e o Navia segue em avaliação como visualizador clínico.",
    },
    {
        "tag": "ESTRATÉGIA",
        "titulo": "Planejamento mobiliza revisão de indicadores e metas",
        "resumo": "Gestores e gerentes da Unimed GV foram orientados a reavaliar KPIs, metas não atingidas e ajustes já identificados. A Gestão da Qualidade apoiará as correções para manter os indicadores aderentes ao Mapa Estratégico.",
    },
]

OBSERVACOES = [
    "Ymunity e Hospital Unihealth: orientação de agendamento de medicações externas entrou em uso.",
    "Ciclo de Aprendizagem: proposta e datas potenciais seguiram condicionadas ao orçamento.",
]


class SignalPDF(FPDF):
    def __init__(self):
        super().__init__(format="A4")
        self.set_auto_page_break(auto=False, margin=10)
        self.add_font("Inter", "", os.path.join(FONT_DIR, "Inter-Regular.ttf"))
        self.add_font("Inter", "B", os.path.join(FONT_DIR, "Inter-Bold.ttf"))
        self.add_font("InterLight", "", os.path.join(FONT_DIR, "Inter-Light.ttf"))
        self.add_font("InterMedium", "", os.path.join(FONT_DIR, "Inter-Medium.ttf"))

    def header(self):
        w = self.w
        self.set_fill_color(*CSV_BLUE)
        self.rect(0, 0, w, 34, "F")
        if os.path.exists(LOGO_PATH):
            self.image(LOGO_PATH, x=12, y=5, h=7)
        self.set_font("Inter", "B", 14)
        self.set_text_color(*WHITE)
        self.set_xy(12, 14)
        self.cell(0, 6, f"Signal™ S{SEMANA}/2026")
        self.set_font("InterLight", "", 7)
        self.set_xy(12, 21)
        self.cell(0, 4, f"Resumo Semanal Estratégico  |  {PERIODO}")
        self.set_font("InterLight", "", 5.5)
        self.set_xy(12, 26)
        self.cell(0, 4, f"{EXECUTIVO}  —  {CARGO}")
        self.set_fill_color(*CSV_GREEN)
        self.rect(0, 34, w, 1.2, "F")
        self.set_font("InterLight", "", 5)
        self.set_text_color(*MID_TEXT)
        self.set_xy(w - 50, 5)
        self.cell(38, 4, f"Gerado em {DATA_GERACAO}", align="R")
        self.set_y(36)

    def footer(self):
        w = self.w
        self.set_draw_color(*LIGHT_LINE)
        self.set_line_width(0.15)
        self.line(12, self.get_y(), w - 12, self.get_y())
        self.set_font("InterLight", "", 5)
        self.set_text_color(*MID_TEXT)
        self.set_y(-8)
        self.cell(0, 3, f"Grupo CSV  |  Signal™  |  Gerado em {DATA_GERACAO}  |  Documento de uso interno", align="L")
        self.cell(0, 3, f"Página {self.page_no()}", align="R")

    def section_title(self, text, y_offset=0):
        y = self.get_y() + y_offset
        self.set_fill_color(*CSV_GREEN)
        self.rect(12, y + 0.5, 2, 4, "F")
        self.set_font("Inter", "B", 7.5)
        self.set_text_color(*CSV_DARK)
        self.set_xy(16, y)
        self.cell(0, 5, text)
        self.ln(6.5)

    def draw_metrics_bar(self):
        avail_w = self.w - 24
        col_w = avail_w / len(METRICAS)
        sx = 12
        y = self.get_y()
        self.set_fill_color(*CARD_BG)
        self.rect(sx, y, avail_w, 13, "F")
        self.set_fill_color(*CSV_GREEN)
        self.rect(sx, y, avail_w, 0.5, "F")
        for i, (valor, label) in enumerate(METRICAS):
            cx = sx + i * col_w
            self.set_font("Inter", "B", 12)
            self.set_text_color(*CSV_BLUE)
            self.set_xy(cx, y + 1)
            self.cell(col_w, 5, valor, align="C")
            self.set_font("InterLight", "", 4.5)
            self.set_text_color(*MID_TEXT)
            self.set_xy(cx, y + 7)
            self.cell(col_w, 3, label, align="C")
            if i < len(METRICAS) - 1:
                self.set_draw_color(*LIGHT_LINE)
                self.set_line_width(0.1)
                self.line(cx + col_w, y + 2, cx + col_w, y + 11)
        self.set_y(y + 15)

    def draw_fact_card(self, fato, x, y, card_w, card_h):
        self.set_fill_color(*WHITE)
        self.rect(x, y, card_w, card_h, "F")
        tag_color = TAG_COLORS.get(fato["tag"], CSV_BLUE)
        self.set_fill_color(*tag_color)
        self.rect(x, y, 1.5, card_h, "F")
        self.set_draw_color(*LIGHT_LINE)
        self.set_line_width(0.1)
        self.rect(x, y, card_w, card_h, "D")
        inner_x = x + 4
        inner_w = card_w - 7
        tag_text = fato["tag"]
        self.set_font("Inter", "B", 4)
        tag_tw = self.get_string_width(tag_text) + 3
        self.set_fill_color(*tag_color)
        self.rect(inner_x, y + 1.5, tag_tw, 3, "F")
        self.set_text_color(*WHITE)
        self.set_xy(inner_x + 1.5, y + 1.5)
        self.cell(tag_tw - 3, 3, tag_text, align="L")
        self.set_font("Inter", "B", 5.8)
        self.set_text_color(*CSV_DARK)
        self.set_xy(inner_x, y + 5.5)
        self.multi_cell(inner_w, 3, fato["titulo"])
        body_y = self.get_y() + 0.3
        self.set_font("Inter", "", 5.0)
        self.set_text_color(*DARK_TEXT)
        self.set_xy(inner_x, body_y)
        self.multi_cell(inner_w, 2.5, fato["resumo"])

    def draw_facts_grid(self):
        avail_w = self.w - 24
        gap = 3
        card_w = (avail_w - gap) / 2
        card_h = 30
        sx = 12
        y = self.get_y()
        for i in range(0, len(FATOS), 2):
            for j in range(2):
                if i + j < len(FATOS):
                    cx = sx + j * (card_w + gap)
                    self.draw_fact_card(FATOS[i + j], cx, y, card_w, card_h)
            y += card_h + 2
            self.set_y(y)

    def draw_observations(self):
        y = self.get_y()
        avail_w = self.w - 24
        item_h = 3.8
        box_h = 4 + len(OBSERVACOES) * item_h
        self.set_fill_color(*CARD_BG)
        self.rect(12, y, avail_w, box_h, "F")
        self.set_fill_color(*CSV_BLUE)
        self.rect(12, y, 1.2, box_h, "F")
        self.set_font("Inter", "", 5.0)
        self.set_text_color(*DARK_TEXT)
        for i, obs in enumerate(OBSERVACOES):
            iy = y + 3 + i * item_h
            self.set_fill_color(*CSV_GREEN)
            self.ellipse(16, iy + 0.8, 1, 1, "F")
            self.set_xy(18.5, iy)
            self.cell(avail_w - 10, item_h, obs)
        self.set_y(y + box_h + 2)


def build_signal_pdf(output_path):
    pdf = SignalPDF()
    pdf.add_page()
    pdf.section_title("MÉTRICAS DA VARREDURA")
    pdf.draw_metrics_bar()
    pdf.section_title("FATOS ESTRATÉGICOS DA SEMANA", y_offset=1)
    pdf.draw_facts_grid()
    pdf.section_title("DEMAIS MOVIMENTAÇÕES", y_offset=1)
    pdf.draw_observations()
    pdf.output(output_path)
    print(f"PDF gerado: {output_path}")
    if shutil.which("pdfinfo"):
        result = subprocess.run(["pdfinfo", output_path], capture_output=True, text=True, check=False)
        for line in result.stdout.splitlines():
            if line.startswith(("Pages:", "Page size:")):
                print(line.strip())


if __name__ == "__main__":
    out = os.path.join(SCRIPT_DIR, "Signal_S38_2026.pdf")
    build_signal_pdf(out)
