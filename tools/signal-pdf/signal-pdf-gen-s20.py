#!/usr/bin/env python3
"""
Signal™ PDF Generator — S20/2026
Resumo Semanal Estratégico | Grupo CSV
REGRA INVIOLÁVEL: exatamente 1 página A4.
"""
import os
from fpdf import FPDF
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(SCRIPT_DIR, "_fonts")
LOGO_PATH = os.path.join(SCRIPT_DIR, "grupo_csv_logo_negative.png")
CSV_BLUE   = (25, 99, 150)
CSV_GREEN  = (45, 191, 127)
CSV_DARK   = (27, 30, 36)
DARK_TEXT  = (55, 55, 55)
MID_TEXT   = (100, 110, 120)
LIGHT_LINE = (210, 218, 226)
CARD_BG    = (249, 250, 252)
WHITE      = (255, 255, 255)
TAG_COLORS = {
    "GOVERNANÇA":                CSV_BLUE,
    "VBHC":                      CSV_GREEN,
    "ACREDITAÇÃO":               CSV_BLUE,
    "OPERACIONAL":               CSV_GREEN,
    "ESTRATÉGIA":                CSV_BLUE,
    "ASSISTENCIAL":              CSV_GREEN,
}
SEMANA = "19"
PERIODO = "11 a 17 de maio de 2026"
DATA_GERACAO = "18/05/2026"
EXECUTIVO = "Guilherme Thomé, MD, MBA"
CARGO = "Superintendente Médico | Fundador Grupo CSV"
METRICAS = [
    ("16", "Páginas Notion"),
    ("11", "Threads Gmail"),
    ("3", "Novos projetos"),
    ("6", "Novas siglas"),
    ("7", "Registros atualizados"),
]
FATOS = [
    {
        "tag": "VBHC",
        "titulo": "Linha de Cuidado TEA — 1o Encontro Operacional IBRAVS e Aprovação Ambulatório",
        "resumo": "EVS e IBRAVS realizaram encontro inaugural (08/05) para estruturação da Linha de Cuidado do Neurodesenvolvimento. Definidas governança quinzenal, verticalização da neuropediatria via ICDES e ampliação da rede de 3 para 6 prestadores. Direx aprovou Ambulatório de Avaliação Diagnóstica TEA em 12/05.",
    },
    {
        "tag": "ASSISTENCIAL",
        "titulo": "Oncologia HI! — Piloto Retrospectivo Avança para Coleta junto a Pacientes",
        "resumo": "Na 2a reunião de alinhamento (S20), EVS e HI! validaram documento metodológico do piloto em Câncer Ginecológico e de Mama. População ampliada para 168 pacientes. Coleta via questionário prevista para 20/05. Judicialização em avaliação como variável.",
    },
    {
        "tag": "OPERACIONAL",
        "titulo": "Ymunity — Renovação Contratual Aprovada com Resultados Expressivos",
        "resumo": "Direx aprovou renovação (ciclo 2026-2027, R$ 21.934/mês). Resultados: -21,6% no custo/paciente/mês (queda de R$ 2.151), 82,1% melhora/estabilização, 87,5% CSAT, zero reações graves. Biossimilares: 37,5% para 45,5%.",
    },
    {
        "tag": "GOVERNANÇA",
        "titulo": "Governança Geriátrica — Plano de Contingência e Reestruturação da CCC",
        "resumo": "Reunião institucional (08/05) consolidou contingência para 10 semanas críticas (jul-set/2026) por licenças-maternidade. Unificação das carteiras de idosos na CCC com IVCF-20. Nova estrutura Provimento de Saúde formalizada (Daniel, horizonte 12-18 meses).",
    },
    {
        "tag": "OPERACIONAL",
        "titulo": "Axys Teller — Canais Institucionais e Integração BPM Definidos",
        "resumo": "EVS e Axys Teller consolidaram integração BPM-Cardio (4h), Unimed Atende como canal oficial ao paciente e encaminhamentos institucionais (Laboratório, Cardiologia CAI, Anestesiologia). Repositório centralizado em estruturação.",
    },
    {
        "tag": "ESTRATÉGIA",
        "titulo": "Caminhos Brilhantes — Comunicação Estratégica ao Ecossistema",
        "resumo": "Guilherme Thomé enviou comunicação institucional (16-17/05) à Diretoria, EVS e NeuroSteps com visão sistêmica do programa. Open Page publicada (open.grupocsv.com/caminhos-brilhantes) com apresentação executiva e relatório técnico.",
    },
    {
        "tag": "ASSISTENCIAL",
        "titulo": "SCG-100 — Resultados Preliminares na Coordenação de Acesso Geriátrica",
        "resumo": "Desde 13/04, SCG-100 aplicado no fluxo RCC. Resultados: 71,4% de adesão (25/35), 72% média complexidade. Canal digital (WhatsApp) consolidado. Instrumento classificado como CFSS (case-finding), não HRA.",
    },
]
OBSERVACOES = [
    "Perfil de Auditoria Ortopedia (CI SM 004-26) assinado digitalmente via D4Sign.",
    "Direx aprovou remuneração para cooperados que conduzam palestras no Espaço Viver Bem.",
    "Integração Navia (AxiaCare) x Auditare concluída; EVS inicia uso de tags assistenciais na Linha Oncológica.",
    "Olga Kenã inicia atividades conjuntas com EVS a partir de 18/05 (governança técnica Ymunity).",
    "SA BPM — Linha de Cuidado do Idoso em operação no Hospital Unihealth.",
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
        self.set_fill_color(*CSV_BLUE)
        self.rect(0, 0, w, 34, "F")
        if os.path.exists(LOGO_PATH):
            self.image(LOGO_PATH, x=12, y=5, h=7)
        self.set_font("Inter", "B", 14)
        self.set_text_color(*WHITE)
        self.set_xy(12, 14)
        self.cell(0, 6, f"Signal\u2122 S{SEMANA}/2026")
        self.set_font("InterLight", "", 7)
        self.set_xy(12, 21)
        self.cell(0, 4, f"Resumo Semanal Estrat\u00e9gico  |  {PERIODO}")
        self.set_font("InterLight", "", 5.5)
        self.set_xy(12, 26)
        self.cell(0, 4, f"{EXECUTIVO}  \u2014  {CARGO}")
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
    out = os.path.join(SCRIPT_DIR, "Signal_S20_2026.pdf")
    build_signal_pdf(out)
