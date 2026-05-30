#!/usr/bin/env python3
"""
Signal™ PDF Generator — S21/2026
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
    "LINHAS DE CUIDADO":         CSV_GREEN,
    "OPERACIONAL":               CSV_GREEN,
    "ESTRATÉGIA":                CSV_BLUE,
    "ASSISTENCIAL":              CSV_GREEN,
    "RELAÇÕES INSTITUCIONAIS":   CSV_BLUE,
    "JORNADA CIRÚRGICA":         CSV_BLUE,
    "PARCERIAS":                 CSV_GREEN,
    "TECNOLOGIA":                CSV_BLUE,
    "GOVERNANÇA ASSISTENCIAL":   CSV_BLUE,
}
SEMANA = "21"
PERIODO = "25 a 29 de maio de 2026"
DATA_GERACAO = "29/05/2026"
EXECUTIVO = "Guilherme Thomé, MD, MBA"
CARGO = "Superintendente Médico | Fundador Grupo CSV"
METRICAS = [
    ("4", "Páginas Notion"),
    ("8", "E-mails Gmail"),
    ("5", "Fatos estratégicos"),
    ("0", "Novos termos"),
    ("0", "Atualizações Dicionário"),
]
FATOS = [
    {
        "tag": "TECNOLOGIA",
        "titulo": "Módulo GRP Contratado (2iM)",
        "resumo": "Proposta formalizada e aceita pela Diretoria. Opção 2: implantação de R$ 29.900 diluída em 12 prestações de R$ 2.491,67. Manutenção de R$ 5.980/mês a partir do 2º mês. Autorização do Dr. Marcus Miguel em 25/05. Próximo passo: contratualização via jurídico.",
    },
    {
        "tag": "JORNADA CIRÚRGICA",
        "titulo": "Orquestrador Axys Teller — Demonstração Completa (27/05)",
        "resumo": "Treinamento ao vivo do sistema de gestão pré-operatória com simulação da jornada completa (cadastro, medicações, exames, documentos faseados, pré-anestésica rotativa, WhatsApp). Participaram Rodrigo Rana, Felipe Moreno (Teller) e equipe EVS. Pendente: validação institucional assinatura eletrônica vs. presencial.",
    },
    {
        "tag": "LINHAS DE CUIDADO",
        "titulo": "LC Oncológica — Alinhamento HI! Healthcare Intelligence (26/05)",
        "resumo": "Piloto retrospectivo câncer ginecológico com base de 160 pacientes no SharePoint. Campanha de sensibilização estruturada com Comunicação Unimed GV. Extração de dados de consumo assistencial com prazo até 02/06 (Matheus).",
    },
    {
        "tag": "GOVERNANÇA ASSISTENCIAL",
        "titulo": "Levantamento Estratégico EVS para CAD e ENTEC",
        "resumo": "Consolidação de dados 2025 + 1º quadrimestre 2026 dos projetos: Caminhos Brilhantes/TEA, Paciente Hospitalizado (DRG), LCFF, Ymunity e CAI. Entregas previstas para início de junho: apresentação ao Conselho de Administração e apresentação do Dr. Guilherme no ENTEC.",
    },
    {
        "tag": "LINHAS DE CUIDADO",
        "titulo": "Projeto Piloto LC Atenção Domiciliar Formalizado",
        "resumo": "Convite oficial da Unihealth GV para projeto piloto de Linha de Cuidado de Atenção Domiciliar, com formalização contratual entre Teller e Unihealth.",
    },
]
OBSERVACOES = [
    "BPM Teller operacional: notificações diárias de solicitações cirúrgicas ativas.",
    "BPM LC do Idoso (Hospital UniHealth): fluxo automatizado gerando alertas de atendimento.",
    "Boletim Intercâmbio Especial (29/05): edição especial distribuída.",
]

class SignalPDF(FPDF):
    def __init__(self):
        super().__init__("P", "mm", "A4")
        self.set_auto_page_break(auto=False)
        self.add_font("Inter", "", os.path.join(FONT_DIR, "Inter-Regular.ttf"))
        self.add_font("Inter", "B", os.path.join(FONT_DIR, "Inter-Bold.ttf"))
        self.add_font("InterLight", "", os.path.join(FONT_DIR, "Inter-Light.ttf"))
        self.add_font("InterMedium", "", os.path.join(FONT_DIR, "Inter-Medium.ttf"))
    def header(self):
        w = self.w
        self.set_fill_color(*CSV_BLUE)
        self.rect(0, 0, w, 34, "F")
        self.image(LOGO_PATH, 12, 6, 38)
        self.set_font("Inter", "B", 14)
        self.set_text_color(*WHITE)
        self.set_xy(12, 18)
        self.cell(0, 6, f"Signal\u2122  S{SEMANA}")
        self.set_font("InterLight", "", 7)
        self.set_xy(12, 25)
        self.cell(0, 4, f"Resumo Semanal Estrat\u00e9gico  |  {PERIODO}")
        self.set_font("InterLight", "", 6)
        self.set_text_color(200, 215, 230)
        self.set_xy(w - 80, 7)
        self.cell(68, 4, EXECUTIVO, align="R")
        self.set_xy(w - 80, 11)
        self.cell(68, 4, CARGO, align="R")
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
        self.cell(0, 3, f"P\u00e1gina {self.page_no()}", align="R")
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
    out = os.path.join(SCRIPT_DIR, "Signal_S21_2026.pdf")
    build_signal_pdf(out)
