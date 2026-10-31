#!/usr/bin/env python3
"""
Signal™ PDF Generator — S44/2026
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
CARD_HEIGHT = 54

TAG_COLORS = {
    "PARCERIAS": CSV_GREEN,
    "GOVERNANÇA": CSV_BLUE,
    "REGULATÓRIO": CSV_BLUE,
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

SEMANA = '44'
PERIODO = '23 a 30 de outubro de 2026'
DATA_GERACAO = '31/10/2026'
EXECUTIVO = "Guilherme Thomé, MD, MBA"
CARGO = "Superintendente Médico | Fundador Grupo CSV"

METRICAS = [('23–30/10', 'Período'), ('6', 'Fatos Estratégicos'), ('32', 'Movimentos no Dicionário'), ('v4.23', 'Dicionário Oficial'), ('Unimed', 'Escopo Editorial')]

FATOS = [{'tag': 'LINHAS DE CUIDADO', 'titulo': 'Programa Cuidar Passa à Operação Assistida', 'resumo': 'A Unimed Governador Valadares encerrou, em 30 de outubro, a etapa presencial do piloto do Programa Cuidar, com diretriz adaptada, capacitação prática e visitas domiciliares acompanhadas. O piloto passou à operação assistida, com acompanhamento remoto. Ajustes de agendas e registros, além da consolidação dos indicadores, permanecem em andamento.'}, {'tag': 'ASSISTENCIAL', 'titulo': 'Score GCE v1.1 Validado como Referência de Elegibilidade', 'resumo': 'A validação comunicada em 26 de outubro adotou a versão 1.1 do Score GCE como referência para a lista mensal de elegíveis do Gerenciamento de Casos Especiais (GCE), com corte de 40 pontos ou mais no recorte avaliado. A conclusão é de validade convergente; casos discordantes e avaliações ausentes seguem em conferência.'}, {'tag': 'LINHAS DE CUIDADO', 'titulo': 'Jornada TEA Distingue Diagnóstico e Reavaliação Terapêutica', 'resumo': 'Na reunião de 28 de outubro, a Unimed Governador Valadares e o EVS discutiram o Núcleo de Acesso ao Cuidado (NAC) e distinguiram as funções do Ambulatório de Avaliação Diagnóstica TEA (AAD) e do Ambulatório de Reavaliação Terapêutica (ART). O desenho prevê navegação pela Central de Coordenação do Cuidado; pactuação dos fluxos e abertura da agenda do ART permaneciam como próximos passos.'}, {'tag': 'GOVERNANÇA', 'titulo': 'Contratos de Ressonância Magnética Encaminhados para Assinatura', 'resumo': 'A aprovação dos contratos vinculados à Ressonância Magnética do Hospital Unihealth GV foi comunicada em 26 de outubro, seguida do encaminhamento para assinaturas eletrônicas. Em 30 de outubro, o processo ainda tinha assinaturas pendentes. O avanço é documental, sem comprovação de conclusão contratual, entrega, instalação ou início de atendimento.'}, {'tag': 'OPERAÇÕES', 'titulo': 'Abastecimento da Hemodinâmica Mantém Pendências de OPME', 'resumo': 'A contagem de 28 de outubro e a comunicação de 29 de outubro registraram grade incompleta de Órteses, Próteses e Materiais Especiais (OPME) na Hemodinâmica do Hospital Unihealth GV, apesar de reposição parcial. Foi solicitado o acionamento do fornecedor e o início da prospecção de alternativas conforme indicação técnica. A regularização final não foi comprovada.'}, {'tag': 'DADOS', 'titulo': 'Relatório GCE Aponta Oportunidade na Comunicação de Altas', 'resumo': 'O relatório GCE comunicado em 27 de outubro registrou que 88% dos e-mails hospitalares enviados no dia da alta saíram depois do horário da alta médica: 36 de 41 solicitações com ambos os horários disponíveis, de julho a 25 de outubro. O achado sinaliza uma oportunidade de antecipação na transição do cuidado do Hospital Unihealth GV, sem demonstrar causa ou impacto assistencial.'}]

OBSERVACOES = ['Medicamentos: O EVS comunicou, em 29 de outubro, a conclusão e a disponibilidade do painel de tickets de solicitação de medicamentos no WeKnow, sem indicadores de uso ou resultados apresentados.', 'Indicadores Hospitalares: O Resumo Executivo DRG do Hospital Unihealth GV foi atualizado em 29 de outubro, com séries clínicas e cirúrgicas referentes a janeiro de 2024 a junho de 2026 e limites metodológicos preservados.']


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
            self.image(LOGO_PATH, x=12, y=4, h=10)
        self.set_font("Inter", "B", 14)
        self.set_text_color(*WHITE)
        self.set_xy(12, 14)
        self.cell(0, 6, f"Signal™ S{SEMANA}/2026")
        self.set_font("InterLight", "", 7)
        self.set_xy(12, 21)
        self.cell(0, 4, f"Resumo Semanal Estratégico  |  {PERIODO}")
        self.set_font("InterLight", "", 7)
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
        self.set_font("InterLight", "", 6.5)
        self.set_text_color(*MID_TEXT)
        self.set_y(-8)
        self.cell(0, 3, f"Grupo CSV  |  Signal™  |  Gerado em {DATA_GERACAO}  |  Documento de uso interno", align="L")
        self.cell(0, 3, f"Página {self.page_no()}", align="R")

    def section_title(self, text, y_offset=0):
        y = self.get_y() + y_offset
        self.set_fill_color(*CSV_GREEN)
        self.rect(12, y + 0.5, 2, 4, "F")
        self.set_font("Inter", "B", 9)
        self.set_text_color(*CSV_DARK)
        self.set_xy(16, y)
        self.cell(0, 6, text)
        self.ln(8)

    def draw_metrics_bar(self):
        avail_w = self.w - 24
        col_w = avail_w / len(METRICAS)
        sx = 12
        y = self.get_y()
        self.set_fill_color(*CARD_BG)
        self.rect(sx, y, avail_w, 16, "F")
        self.set_fill_color(*CSV_GREEN)
        self.rect(sx, y, avail_w, 0.5, "F")
        for i, (valor, label) in enumerate(METRICAS):
            cx = sx + i * col_w
            self.set_font("Inter", "B", 12)
            self.set_text_color(*CSV_BLUE)
            self.set_xy(cx, y + 1)
            self.cell(col_w, 5, valor, align="C")
            self.set_font("InterLight", "", 6.5)
            self.set_text_color(*MID_TEXT)
            self.set_xy(cx, y + 8)
            self.cell(col_w, 5, label, align="C")
            if i < len(METRICAS) - 1:
                self.set_draw_color(*LIGHT_LINE)
                self.set_line_width(0.1)
                self.line(cx + col_w, y + 2, cx + col_w, y + 14)
        self.set_y(y + 18)

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
        self.set_font("Inter", "B", 6)
        tag_tw = self.get_string_width(tag_text) + 3
        self.set_fill_color(*tag_color)
        self.rect(inner_x, y + 1.5, tag_tw, 4.2, "F")
        self.set_text_color(*WHITE)
        self.set_xy(inner_x + 1.5, y + 1.5)
        self.cell(tag_tw - 3, 4.2, tag_text, align="L")
        self.set_font("Inter", "B", 9.5)
        self.set_text_color(*CSV_DARK)
        self.set_xy(inner_x, y + 7.5)
        self.multi_cell(inner_w, 4.5, fato["titulo"], align="L")
        body_y = self.get_y() + 0.6
        self.set_font("Inter", "", 9.0)
        self.set_text_color(*DARK_TEXT)
        self.set_xy(inner_x, body_y)
        self.multi_cell(inner_w, 3.95, fato["resumo"], align="L")
        if self.get_y() > y + card_h - 1:
            raise ValueError(f"Texto ultrapassou o card: {fato['titulo']}")

    def draw_facts_grid(self):
        avail_w = self.w - 24
        gap = 3
        card_w = (avail_w - gap) / 2
        card_h = CARD_HEIGHT
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
        item_h = 13
        box_h = 5 + len(OBSERVACOES) * item_h
        self.set_fill_color(*CARD_BG)
        self.rect(12, y, avail_w, box_h, "F")
        self.set_fill_color(*CSV_BLUE)
        self.rect(12, y, 1.2, box_h, "F")
        self.set_font("Inter", "", 7.5)
        self.set_text_color(*DARK_TEXT)
        for i, obs in enumerate(OBSERVACOES):
            iy = y + 2.5 + i * item_h
            self.set_fill_color(*CSV_GREEN)
            self.ellipse(16, iy + 0.8, 1, 1, "F")
            self.set_xy(18.5, iy)
            self.multi_cell(avail_w - 12, 3.7, obs, align="L")
            if self.get_y() > iy + item_h - 1:
                raise ValueError(f"Texto ultrapassou a observação: {obs}")
        self.set_y(y + box_h + 2)


def build_signal_pdf(output_path):
    pdf = SignalPDF()
    pdf.add_page()
    pdf.section_title("VISÃO DA EDIÇÃO")
    pdf.draw_metrics_bar()
    pdf.section_title("FATOS ESTRATÉGICOS DA SEMANA", y_offset=1)
    pdf.draw_facts_grid()
    pdf.section_title("DEMAIS MOVIMENTAÇÕES", y_offset=1)
    pdf.draw_observations()
    if pdf.get_y() >= pdf.h - 12:
        raise ValueError("Conteúdo ultrapassou a área útil da página A4")
    pdf.output(output_path)
    print(f"PDF gerado: {output_path}")
    if shutil.which("pdfinfo"):
        result = subprocess.run(["pdfinfo", output_path], capture_output=True, text=True, check=False)
        for line in result.stdout.splitlines():
            if line.startswith(("Pages:", "Page size:")):
                print(line.strip())


if __name__ == "__main__":
    out = os.path.join(SCRIPT_DIR, "Signal_S44_2026.pdf")
    build_signal_pdf(out)
