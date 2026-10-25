#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Substitui dois rótulos editoriais do relatório da Jornada TEA."""

from pathlib import Path

import pymupdf


BASE = Path(__file__).resolve().parent
FONTE_PDF = BASE / "source" / "caminhos-brilhantes" / "relatorio-tecnico-jornada-tea-fonte.pdf"
PDF = BASE / "assets" / "caminhos-brilhantes" / "relatorio-tecnico-jornada-tea.pdf"
TEMP = PDF.with_suffix(".tmp.pdf")
FONTE = BASE / "source" / "fonts" / "UnimedSans2020-Bd.otf"


def cor_do_pixel(pagina, x, y, escala=2):
    pix = pagina.get_pixmap(matrix=pymupdf.Matrix(escala, escala), alpha=False)
    px = pix.pixel(round(x * escala), round(y * escala))
    return tuple(c / 255 for c in px[:3])


doc = pymupdf.open(FONTE_PDF)

# Capa: o rótulo original é composto por curvas, não por texto pesquisável.
capa = doc[0]
retangulo_capa = pymupdf.Rect(48, 405, 198, 422)
fundo_capa = cor_do_pixel(capa, 45, 414)
capa.add_redact_annot(retangulo_capa, fill=fundo_capa)
capa.apply_redactions()
capa.insert_text(
    (51, 418.5),
    "RELATÓRIO TÉCNICO",
    fontname="UnimedSansBold",
    fontfile=str(FONTE),
    fontsize=8.5,
    color=(177 / 255, 211 / 255, 74 / 255),
)

# Página final: o rótulo é texto pesquisável e tem cor institucional laranja.
final = doc[15]
ocorrencias = final.search_for("O QUE ESTE DOSSIÊ NÃO RESPONDE")
assert len(ocorrencias) == 1, ("rótulo da página final não encontrado", ocorrencias)
retangulo_final = pymupdf.Rect(62, 589, 255, 605)
fundo_final = cor_do_pixel(final, 250, 596)
final.add_redact_annot(retangulo_final, fill=fundo_final)
final.apply_redactions()
final.insert_text(
    (64, 601.5),
    "O QUE ESTE RELATÓRIO NÃO RESPONDE",
    fontname="UnimedSansBold",
    fontfile=str(FONTE),
    fontsize=7.5,
    color=(244 / 255, 121 / 255, 32 / 255),
)

doc.save(TEMP, garbage=4, deflate=True)
doc.close()
TEMP.replace(PDF)
print(PDF)
