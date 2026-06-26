#!/usr/bin/env python3
"""
Signal™ PDF Generator — S13/2026
Resumo Semanal Estratégico | Grupo CSV
REGRA INVIOLÁVEL: exatamente 1 página A4.
"""

import os
from fpdf import FPDF

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(SCRIPT_DIR, "_fonts")
LOGO_PATH = os.path.join(SCRIPT_DIR, "grupo_csv_logo.png")

CSV_BLUE   = (25, 99, 150)
CSV_GREEN  = (45, 191, 127)
CSV_DARK   = (27, 30, 36)
DARK_TEXT  = (55, 55, 55)
MID_TEXT   = (100, 110, 120)
LIGHT_LINE = (210, 218, 226)
CARD_BG    = (249, 250, 252)
WHITE      = (255, 255, 255)

TAG_COLORS = {
    "GESTÃO DE PROJETOS":  CSV_BLUE,
    "FINANCEIRO":          CSV_GREEN,
    "OPERAÇÕES EVS":       CSV_BLUE,
    "MODELOS ASSISTENCIAIS": CSV_GREEN,
    "GESTÃO DE TERAPIAS":  CSV_BLUE,
}

SEMANA = "12"
PERIODO = "23 a 27 de março de 2026"
DATA_GERACAO = "30/03/2026"
EXECUTIVO = "Guilherme Thomé, MD, MBA"
CARGO = "Superintendente Médico | Fundador Grupo CSV"

METRICAS = [
    ("8", "Páginas Notion"),
    ("30", "Threads Gmail"),
    ("120+", "Msgs analisadas"),
    ("2", "Termos incorporados"),
    ("3", "Registros atualizados"),
]

FATOS = [
    {
        "tag": "GESTÃO DE PROJETOS",
        "titulo": "Encerramento Projeto Axys Teller",
        "resumo": "Projeto de jornada cirúrgica com a Teller Saúde encerrado por descumprimento do SLA de 60 dias. Nenhum dos 3 entregáveis obrigatórios cumprido no prazo. Estudo de caso de insucesso será realizado para aprendizados institucionais.",
    },
    {
        "tag": "FINANCEIRO",
        "titulo": "Orçamento Médico Hospitalar 2026",
        "resumo": "Direx formalizou o orçamento médico da Unihealth GV para 2026. Modelo sem variáveis vinculadas à produção (fluxo apartado). Reforçada comunicação de que PJ não integra base de cálculo para divisão de sobras.",
    },
    {
        "tag": "OPERAÇÕES EVS",
        "titulo": "Macroprocesso Técnico-Científico",
        "resumo": "EVS concluiu documentação do macroprocesso de desenvolvimento técnico-científico: ciclo completo, POP de produção científica, SLA, formulário estruturado e checklist de validação. Modelo replicável.",
    },
    {
        "tag": "MODELOS ASSISTENCIAIS",
        "titulo": "Ambulatório Cardiologia no CAI",
        "resumo": "Projeto de ambulatório de egressos de Hemodinâmica e pré-op de Cardiologia no CAI avançou. Dr. Waisman Toledo Bastos confirmado. Tratativas com Dr. Márcio Avelar em andamento.",
    },
    {
        "tag": "GESTÃO DE TERAPIAS",
        "titulo": "Alinhamento Operacional Ymunity",
        "resumo": "Reunião entre Autorização, Auditoria, EVS e Ymunity para revisão de fluxos de intercâmbio e gestão de pendências. Foco em estoque domiciliar de medicamentos e pacientes oncológicos.",
    },
]

OBSERVACOES = [
    "Pesquisa de Satisfação Interna: reformulação das perguntas do EVS para dimensões mais amplas (acessibilidade, clareza, colaboração, impacto).",
    "LCI: fluxo BPM ativo no Hospital Unihealth GV, registrando atendimentos regulares no Interact Suite SA.",
    "Contratos: Direx iniciou avaliação do contrato Unimetrics, com pauta para alinhamento com a Federação.",
]


class SignalPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=False, margin=10)
        self.add_font("Inter", "", os.path.join(FONT_DIR, "Inter-Regular.ttf"))
        self.add_font("Inter", "B", os.path.join(FONT_DIR, "Inter-Bold.ttf"))
        self.add_font("InterLight", "", os.path.join(FONT_DIR, "Inter-Light.ttf"))
        self.add_font("InterMedium", "", os.path.join(FONT_DIR, "Inter-Medium.ttf"))

    def header(self):
        w = self.w
        # Top accent bar
        self.set_fill_color(*CSV_BLUE)
        self.rect(0, 0, w, 2.5, "F")
        self.set_fill_color(*CSV_GREEN)
        self.rect(w * 0.7, 0, w * 0.3, 2.5, "F")

        # Logo
        self.image(LOGO_PATH, 12, 6, 38)

        # Signal™ title
        self.set_font("Inter", "B", 24)
        self.set_text_color(*CSV_BLUE)
        title_text = "Signal"
        title_w = self.get_string_width(title_text)
        signal_x = w - 12 - title_w - 10
        self.set_xy(signal_x, 7)
        self.cell(title_w, 10, title_text, align="L")
        self.set_font("InterLight", "", 8)
        self.set_xy(signal_x + title_w + 1, 6)
        self.cell(8, 5, "\u2122", align="L")

        # Subtitle
        self.set_font("InterLight", "", 7)
        self.set_text_color(*MID_TEXT)
        self.set_xy(w - 12 - 75, 17)
        self.cell(75, 4, "Resumo Semanal Estratégico", align="R")

        # Separator
        self.set_draw_color(*LIGHT_LINE)
        self.set_line_width(0.25)
        self.line(12, 25, w - 12, 25)

        # Info row
        badge_w = 18
        badge_h = 5.5
        info_y = 27.5

        self.set_fill_color(*CSV_BLUE)
        self.rect(12, info_y, badge_w, badge_h, "F")
        self.set_font("Inter", "B", 7)
        self.set_text_color(*WHITE)
        self.set_xy(12, info_y)
        self.cell(badge_w, badge_h, f"S{SEMANA}", align="C")

        self.set_font("Inter", "", 7)
        self.set_text_color(*DARK_TEXT)
        self.set_xy(12 + badge_w + 3, info_y)
        self.cell(70, badge_h, PERIODO, align="L")

        self.set_font("InterMedium", "", 6.5)
        self.set_text_color(*CSV_BLUE)
        self.set_xy(w - 12 - 75, info_y)
        self.cell(75, 3, EXECUTIVO, align="R")
        self.set_font("InterLight", "", 5.5)
        self.set_text_color(*MID_TEXT)
        self.set_xy(w - 12 - 75, info_y + 3)
        self.cell(75, 3, CARGO, align="R")

        self.set_y(36)

    def footer(self):
        self.set_y(-10)
        w = self.w
        self.set_draw_color(*LIGHT_LINE)
        self.set_line_width(0.15)
        self.line(12, self.get_y(), w - 12, self.get_y())
        self.set_font("InterLight", "", 5)
        self.set_text_color(*MID_TEXT)
        self.set_y(-8)
        self.cell(0, 3,
                  f"Grupo CSV  |  Signal\u2122  |  Gerado em {DATA_GERACAO}  |  Documento de uso interno",
                  align="L")
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

        # Tag pill
        tag_text = fato["tag"]
        self.set_font("Inter", "B", 4)
        tag_tw = self.get_string_width(tag_text) + 3
        self.set_fill_color(*tag_color)
        self.rect(inner_x, y + 1.5, tag_tw, 3, "F")
        self.set_text_color(*WHITE)
        self.set_xy(inner_x + 1.5, y + 1.5)
        self.cell(tag_tw - 3, 3, tag_text, align="L")

        # Title
        self.set_font("Inter", "B", 6)
        self.set_text_color(*CSV_DARK)
        self.set_xy(inner_x, y + 5.5)
        self.multi_cell(inner_w, 3, fato["titulo"])

        # Body
        body_y = self.get_y() + 0.3
        self.set_font("Inter", "", 5.2)
        self.set_text_color(*DARK_TEXT)
        self.set_xy(inner_x, body_y)
        self.multi_cell(inner_w, 2.5, fato["resumo"])

    def draw_facts_grid(self):
        avail_w = self.w - 24
        gap = 3
        card_w = (avail_w - gap) / 2
        card_h = 28
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
        self.set_font("Inter", "", 5.2)
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

    # Verify page count
    import subprocess
    result = subprocess.run(['pdfinfo', output_path], capture_output=True, text=True)
    for line in result.stdout.split('\n'):
        if 'Pages' in line:
            print(line.strip())
            break


if __name__ == "__main__":
    out = "/home/ubuntu/hub/docs/signal/edicoes/2026/S13/assets/Signal_S13_2026.pdf"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    build_signal_pdf(out)
