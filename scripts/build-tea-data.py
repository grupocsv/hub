#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pipeline auditável do Painel Terapias Especiais — Unimed Governador Valadares.

Entrada de produção (artefato privado, fora de qualquer Git):
  python scripts/build-tea-data.py <diretorio-com-19-fontes-xlsx>
    --matriz <Matriz_Analitica_Terapias_Especiais_2025.xlsx>
    --saida <diretorio-privado>/tea.json

Competências posteriores ao período-base (2025/01 a 2026/06) entram por blocos
complementares — planilhas consolidadas com vários códigos no mesmo arquivo:
  python scripts/build-tea-data.py <diretorio-com-19-fontes-xlsx>
    --matriz <Matriz_Analitica_Terapias_Especiais_2025.xlsx>
    --bloco <Terapias_Especiais_072026_092026.xlsx>
    --ate 2026/09
    --saida <diretorio-privado>/tea.json

O período-base é congelado: a cada build ele é refeito e conferido contra os
critérios de aceite e a Matriz 2025, e nenhum recorte fechado da base pode
mudar quando a janela é estendida. O conjunto de terapias é o da base.

O diretório, a Matriz, os blocos e a saída devem estar fora de qualquer
repositório Git. O pipeline emite agregados completos para a camada privada
autenticada, mantém os hashes de origem e reconcilia 2025 com a Matriz. Nome,
matrícula, data de nascimento e guia de beneficiário nunca integram o JSON nem
as mensagens de erro.

Comandos auxiliares:
  python scripts/build-tea-data.py --selftest
  python scripts/build-tea-data.py --emit-p
"""

import argparse
import calendar
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
import math
import os
import re
import statistics
import sys
import tempfile
import unicodedata
import zipfile
import zlib
from collections import Counter, defaultdict, deque
from datetime import date, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from xml.etree.ElementTree import ParseError as ErroXml


VERSAO = "5.1.0"

# Contrato v4 (PRD escopos comparáveis): parâmetros das referências por
# disciplina — mesmos limiares publicados em Método e Fontes.
MIN_SESSOES_REFERENCIA = Decimal(100)
MIN_PRESTADORES_REFERENCIA = 5
# O artefato cresce cerca de 0,3 MB por competência publicada (um recorte
# mensal a mais, além do crescimento de trimestre, semestre, ano e período
# completo). O teto protege contra inchaço acidental, não contra o calendário.
JSON_MAX_BYTES = 16 * 1024 * 1024

REPO_ROOT = Path(__file__).resolve().parents[1]
HTML_ALVO = REPO_ROOT / "unimed" / "tea.html"
P_DIR = REPO_ROOT / "p" / "painel-tea"

# Período-base auditado (congelado): as 19 fontes e a Matriz Analítica 2025
# definem o conjunto de terapias, os critérios de aceite e a conferência
# cruzada. Competências posteriores chegam por blocos complementares (--bloco)
# e apenas estendem a janela publicada (--ate).
INICIO_CANONICO = "2025/01"
FIM_BASE = "2026/06"
FIM_CANONICO = FIM_BASE


def sequencia_meses(inicio, fim):
    yi, mi = map(int, inicio.split("/"))
    yf, mf = map(int, fim.split("/"))
    meses = []
    y, m = yi, mi
    while (y, m) <= (yf, mf):
        meses.append(f"{y:04d}/{m:02d}")
        m += 1
        if m == 13:
            y, m = y + 1, 1
    return tuple(meses)


MESES_BASE = sequencia_meses(INICIO_CANONICO, FIM_BASE)
MESES_BASE_SET = frozenset(MESES_BASE)
# Janela publicada: nasce igual à base e só cresce por definir_janela().
MESES_CANONICOS = MESES_BASE
MESES_CANONICOS_SET = set(MESES_CANONICOS)


def ultimo_dia(anomes):
    ano, mes = map(int, anomes.split("/"))
    return date(ano, mes, calendar.monthrange(ano, mes)[1])


CORTE_PADRAO = ultimo_dia(FIM_BASE)


def definir_janela(fim):
    """Define a última competência publicada; nunca anterior ao fim da base."""
    global FIM_CANONICO, MESES_CANONICOS, MESES_CANONICOS_SET
    if not re.fullmatch(r"\d{4}/(0[1-9]|1[0-2])", str(fim)):
        raise ErroPipeline("--ate deve ter o formato AAAA/MM")
    if fim < FIM_BASE:
        raise ErroPipeline(
            f"--ate não pode ser anterior ao fim do período-base ({FIM_BASE})"
        )
    FIM_CANONICO = fim
    MESES_CANONICOS = sequencia_meses(INICIO_CANONICO, fim)
    MESES_CANONICOS_SET = set(MESES_CANONICOS)


def janela_estendida():
    return FIM_CANONICO != FIM_BASE
MESES_PECS_ESPERADOS = {
    "2025/01", "2025/02", "2025/03", "2025/05", "2025/08",
    "2025/09", "2025/11", "2025/12", "2026/01", "2026/02",
    "2026/03", "2026/05", "2026/06",
}

# O cabeçalho abaixo reproduz literalmente as 19 fontes oficiais recebidas.
# A grafia sem acento de "Matricula" pertence ao schema de origem.
CABECALHO_FONTE = [
    "Ano/Mês",
    "Matricula Beneficiário",
    "Nome Beneficiário",
    "Data Nascimento",
    "Gênero Beneficiário",
    "Numero Guia Principal",
    "Data Atendimento",
    "Código Solicitante",
    "Nome Solicitante",
    "CBOS Solicitante",
    "Tipo Guia",
    "Código Procedimento",
    "Nome Procedimento",
    "Tipo Procedimento GA",
    "Código Prestador",
    "Nome Prestador",
    "Tipo Prestador",
    "Quantidade Procedimento",
    "Pagamento/Despesa",
]

CHAVES_FONTE = [
    "anomes", "matricula", "nome", "nasc", "genero", "guia",
    "dt_atend", "cod_sol", "nome_sol", "cbos", "tipo_guia",
    "cod_proc", "nome_proc", "tipo_proc", "cod_prest",
    "nome_prest", "tipo_prest", "qtd", "valor",
]

# 19 códigos de origem -> 18 terapias clínicas. O código de AT integra ABA
# Psicologia e permanece identificável nos agregados de composição.
MAPA_CODIGOS = {
    "50005103": {
        "id": "aba-psicologia",
        "terapia": "Terapia ABA — Psicologia",
        "especialidade": "Psicologia",
        "metodo": "ABA",
    },
    "50000519": {
        "id": "aba-psicologia",
        "terapia": "Terapia ABA — Psicologia",
        "especialidade": "Psicologia",
        "metodo": "ABA",
        "at": True,
    },
    "50005189": {
        "id": "aba-fonoaudiologia",
        "terapia": "Terapia ABA — Fonoaudiologia",
        "especialidade": "Fonoaudiologia",
        "metodo": "ABA",
    },
    "50005170": {
        "id": "aba-terapia-ocupacional",
        "terapia": "Terapia ABA — Terapia Ocupacional",
        "especialidade": "Terapia Ocupacional",
        "metodo": "ABA",
    },
    "50005278": {
        "id": "psicopedagogia",
        "terapia": "Psicopedagogia",
        "especialidade": "Psicopedagogia",
        "metodo": "Psicopedagogia",
    },
    "50005375": {
        "id": "ans-centros-referencia",
        "terapia": "Terapias especiais (parecer ANS, centros de referência)",
        "especialidade": "Multidisciplinar",
        "metodo": "ANS — centros de referência",
    },
    "50005235": {
        "id": "denver-terapia-ocupacional",
        "terapia": "Método Denver — Terapia Ocupacional",
        "especialidade": "Terapia Ocupacional",
        "metodo": "Denver",
    },
    "50005227": {
        "id": "denver-psicologia",
        "terapia": "Método Denver — Psicologia",
        "especialidade": "Psicologia",
        "metodo": "Denver",
    },
    "50005243": {
        "id": "denver-fonoaudiologia",
        "terapia": "Método Denver — Fonoaudiologia",
        "especialidade": "Fonoaudiologia",
        "metodo": "Denver",
    },
    "50005138": {
        "id": "teacch-psicologia",
        "terapia": "Método TEACCH — Psicologia",
        "especialidade": "Psicologia",
        "metodo": "TEACCH",
    },
    "50005219": {
        "id": "teacch-fonoaudiologia",
        "terapia": "Método TEACCH — Fonoaudiologia",
        "especialidade": "Fonoaudiologia",
        "metodo": "TEACCH",
    },
    "50005200": {
        "id": "teacch-terapia-ocupacional",
        "terapia": "Método TEACCH — Terapia Ocupacional",
        "especialidade": "Terapia Ocupacional",
        "metodo": "TEACCH",
    },
    "50005197": {
        "id": "bobath-terapia-ocupacional",
        "terapia": "Método Bobath — Terapia Ocupacional Neurológica",
        "especialidade": "Terapia Ocupacional",
        "metodo": "Bobath",
    },
    "50005251": {
        "id": "bobath-fonoaudiologia",
        "terapia": "Método Bobath — Fonoaudiologia",
        "especialidade": "Fonoaudiologia",
        "metodo": "Bobath",
    },
    "50005260": {
        "id": "integracao-sensorial",
        "terapia": "Integração Sensorial",
        "especialidade": "Terapia Ocupacional",
        "metodo": "Integração Sensorial",
    },
    "50005340": {
        "id": "tgd-terapia-ocupacional",
        "terapia": "Terapeuta Ocupacional — TGD",
        "especialidade": "Terapia Ocupacional",
        "metodo": "TGD",
    },
    "50005286": {
        "id": "tgd-psicologia",
        "terapia": "Psicólogo — TGD",
        "especialidade": "Psicologia",
        "metodo": "TGD",
    },
    "50005308": {
        "id": "tgd-fonoaudiologia",
        "terapia": "Fonoaudiólogo — TGD",
        "especialidade": "Fonoaudiologia",
        "metodo": "TGD",
    },
    "50005146": {
        "id": "pecs-fonoaudiologia",
        "terapia": "Método PECS — Fonoaudiologia",
        "especialidade": "Fonoaudiologia",
        "metodo": "PECS",
    },
}

COD_AT = "50000519"
ID_PECS = "pecs-fonoaudiologia"
PEDIAKIDS = "PEDIAKIDS CURSOS E SERVICOS MEDICOS LTDA"

MERGE_CNPJ = {
    "ANA CAROLINA OLIVEIRA FARIA FALCAO LTDA",
    "CRIAR E CRESCER TEEN LTDA",
}
NOME_MERGE_CNPJ = "CRIAR E CRESCER TEEN LTDA"

MAPA_CANAL = {
    "ATENDIMENTO ESPECIALIZADO": "Casa Unimed",
    "ATENDIMENTOS FORNECEDORES": "Negociação Direta",
    "CLINICA ESPECIALIZADA": "Rede Credenciada",
    "OUTRAS ESPEC. EXCETO MEDICO": "Negociação Direta (P.F.)",
    "REEMBOLSO": "Reembolso",
    "UNIMED NACIONAL": "Intercâmbio",
    "UNIMED REGIONAL": "Intercâmbio",
}

CREDENCIADA_OVERRIDE = {
    "RESINTO ESPACO INTEGRADO LTDA",
    "CLINICA PSICONEURO GV LTDA",
    "ANIMA CENTRO DE TERAPIAS MULTIDISCIPLINAR LTDA",
    "CUIDARIM ESPACO DE DESENVOLVIMENTO INFANTIL LTDA",
    "CASA AURORA TERAPIAS LTDA",
}

# Contrato v5: todo registro com Tipo Prestador = ATENDIMENTO ESPECIALIZADO é
# atendimento da Casa Unimed e consolida na entidade única publicada. A regra
# vale por REGISTRO: o mesmo profissional permanece prestador individual nos
# registros dos demais canais.
CASA_UNIMED = "CASA UNIMED"
TIPO_CASA_UNIMED = "ATENDIMENTO ESPECIALIZADO"
CANAL_CASA_UNIMED = "Casa Unimed"

# Contrato v5: kits terapêuticos — mesma taxonomia do painel. Cada criança é
# classificada pelo CONJUNTO de disciplinas utilizadas no recorte; os kits são
# mutuamente exclusivos e exaustivos por construção. Célula com menos de
# K_MINIMO_KIT crianças não publica (k-anonimato).
K_MINIMO_KIT = 5
# Um bloco complementar pode trazer poucos registros sem data de nascimento
# (cadastro incompleto no momento da extração). Sem a data não existe chave de
# paciente: o registro só é agregado se a data puder ser recuperada de outro
# registro do mesmo beneficiário (mesma matrícula e mesmo nome, data única).
# O restante fica fora do painel, contado e declarado; acima da tolerância o
# build para, porque aí o problema é da planilha e não de um cadastro.
MAX_SEM_NASCIMENTO_FIXO = 5
MAX_SEM_NASCIMENTO_PROPORCAO = Decimal("0.002")
# Continuidade entre a base e as competências novas. A chave do paciente é o
# par Nome + Nascimento, sem aproximação de grafia: se a planilha nova vier
# com os nomes em outro formato (espaços, caixa, acentos), as mesmas crianças
# passam a contar como novas e o total de crianças únicas infla em silêncio.
# Em cada competência nova, ao menos metade das crianças tem de já ter
# aparecido antes; e as que só diferem de uma criança conhecida pela grafia
# são contadas à parte — poucas são informadas, muitas param o build.
MIN_CONTINUIDADE = Decimal("0.5")
# Competência nova com menos de um quarto do volume mensal recente da base é
# faturamento ainda entrando ou competência digitada errada: não se publica.
MIN_VOLUME = Decimal("0.25")
# Mês de borda de um bloco com menos de 5% das linhas do mês mais cheio da
# planilha não conta para o intervalo que decide qual bloco é o mais recente:
# é o que uma linha com o mês digitado errado produz. O mês recém-aberto da
# planilha seguinte (em geral 10% ou mais) continua contando.
MIN_BORDA = Decimal("0.05")
# O primeiro ou o último mês do intervalo firme de uma planilha (sem contar
# mês de borda com volume ínfimo), com menos de 25% das linhas do mês mais
# cheio dela, é mês parcial: começado no meio, ou ainda aberto quando ela foi
# extraída. Na disputa por uma competência, perde para a planilha que a traz
# cheia. Mês do meio nunca é parcial: pouco volume ali é dado.
MIN_MES_CHEIO = Decimal("0.25")
MAX_GRAFIA_FIXO = 5
MAX_GRAFIA_PROPORCAO = Decimal("0.01")
DISC_PSI = "Psicologia"
DISC_FONO = "Fonoaudiologia"
DISC_TO = "Terapia Ocupacional"
TRIPE_DISCIPLINAS = frozenset({DISC_PSI, DISC_FONO, DISC_TO})
KITS = (
    {
        "id": "tripe",
        "rotulo": "Psicologia + Fonoaudiologia + Terapia Ocupacional",
        "criterio": "exatamente as três disciplinas principais em conjunto",
    },
    {
        "id": "tripe-ampliado",
        "rotulo": "Psicologia + Fonoaudiologia + Terapia Ocupacional + outras",
        "criterio": "as três disciplinas principais mais uma ou mais complementares",
    },
    {
        "id": "duas",
        "rotulo": "Duas Terapias",
        "criterio": "exatamente duas disciplinas, em qualquer combinação",
    },
    {
        "id": "multiplas-sem-tripe",
        "rotulo": "Três ou Mais — Outras Combinações",
        "criterio": "três ou mais disciplinas sem conter as três principais",
    },
    {
        "id": "unica",
        "rotulo": "Terapia Única",
        "criterio": "uma única disciplina no recorte",
    },
)

FAIXAS_ETARIAS = ("0–2", "3–5", "6–8", "9–11", "12–14", "15–17", "18+")
BUCKETS_INTENSIDADE = ("<3", "3–4", "5–8", "9+")
CENTAVO = Decimal("0.01")

class ErroPipeline(RuntimeError):
    pass


def d_nome(valor):
    """Rótulo de prestador/solicitante: CAIXA ALTA sem acento."""
    texto = "" if valor is None else str(valor).strip()
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", texto).upper()


def chave_rotulo(valor):
    return re.sub(r"[^A-Z0-9]+", " ", d_nome(valor)).strip()


def texto_celula(valor):
    if valor is None:
        return ""
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    if isinstance(valor, float) and valor.is_integer():
        return str(int(valor))
    return str(valor).strip()


def forma_celula(valor):
    """Descreve o formato de uma célula sem reproduzir o conteúdo.

    Mensagens de erro circulam por terminais, logs e conversas, e a célula
    pode conter nome, data de nascimento ou matrícula. Dígitos viram 9 e
    letras viram A — o suficiente para diagnosticar o formato.
    """
    texto = texto_celula(valor)
    if texto == "":
        return "célula vazia"
    mascara = "".join(
        "9" if c.isdigit() else "A" if c.isalpha() else c for c in texto[:24]
    )
    if len(texto) > 24:
        mascara += "…"
    return f"formato {mascara}, {len(texto)} caracteres"


def codigo_procedimento(valor):
    if isinstance(valor, (int, float, Decimal)) and not isinstance(valor, bool):
        d = Decimal(str(valor))
        if d == d.to_integral_value():
            return str(int(d))
    texto = texto_celula(valor)
    if re.fullmatch(r"\d{8}(?:\.0+)?", texto):
        return texto.split(".")[0]
    raise ErroPipeline(
        f"código de procedimento inválido ({forma_celula(valor)})"
    )


def normalizar_anomes(valor):
    if isinstance(valor, (date, datetime)):
        return f"{valor.year:04d}/{valor.month:02d}"
    texto = texto_celula(valor)
    m = re.fullmatch(r"(\d{4})[/-](\d{1,2})(?:[/-]\d{1,2})?", texto)
    if m:
        ano, mes = int(m.group(1)), int(m.group(2))
    else:
        m = re.fullmatch(r"(\d{1,2})[/-](\d{4})", texto)
        if not m:
            raise ErroPipeline(f"competência inválida ({forma_celula(valor)})")
        mes, ano = int(m.group(1)), int(m.group(2))
    if not 1 <= mes <= 12:
        raise ErroPipeline(f"competência inválida ({forma_celula(valor)})")
    return f"{ano:04d}/{mes:02d}"


def normalizar_data(valor, campo):
    if isinstance(valor, datetime):
        return valor.date().isoformat()
    if isinstance(valor, date):
        return valor.isoformat()
    texto = texto_celula(valor)
    for formato in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(texto[:10], formato).date().isoformat()
        except ValueError:
            pass
    raise ErroPipeline(f"{campo} inválida ({forma_celula(valor)})")


def decimal_celula(valor, campo):
    if isinstance(valor, Decimal):
        return valor
    if isinstance(valor, (int, float)) and not isinstance(valor, bool):
        return Decimal(str(valor))
    texto = texto_celula(valor).replace("\u00a0", "").replace("R$", "").replace(" ", "")
    if "," in texto and "." in texto:
        if texto.rfind(",") > texto.rfind("."):
            texto = texto.replace(".", "").replace(",", ".")
        else:
            texto = texto.replace(",", "")
    elif "," in texto:
        texto = texto.replace(",", ".")
    try:
        return Decimal(texto)
    except InvalidOperation as exc:
        raise ErroPipeline(
            f"{campo} inválido ({forma_celula(valor)})"
        ) from exc


def dinheiro(valor):
    if valor is None:
        return None
    return float(Decimal(valor).quantize(CENTAVO, rounding=ROUND_HALF_UP))


def numero(valor):
    if valor is None:
        return None
    d = Decimal(valor)
    return int(d) if d == d.to_integral_value() else float(d)


def razao(numerador, denominador):
    if not denominador:
        return None
    return dinheiro(Decimal(numerador) / Decimal(denominador))


def sha256_arquivo(caminho):
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1024 * 1024), b""):
            h.update(bloco)
    return h.hexdigest()


def ancestral_git(caminho):
    p = Path(caminho).resolve(strict=True)
    if p.is_file():
        p = p.parent
    while True:
        if (p / ".git").exists():
            return p
        if p.parent == p:
            return None
        p = p.parent


def exigir_fora_de_git(caminho, rotulo):
    real = Path(caminho).resolve(strict=True)
    git = ancestral_git(real)
    if git is not None:
        raise ErroPipeline(
            f"{rotulo} está dentro do repositório Git {git}; "
            "dados brutos devem permanecer fora de qualquer Git"
        )
    return real


def exigir_saida_fora_de_git(caminho):
    """Valida um destino ainda inexistente sem criar nada no repositório."""
    destino = Path(caminho).expanduser().resolve(strict=False)
    if destino.exists() and destino.is_dir():
        raise ErroPipeline("--saida deve apontar para um arquivo JSON")
    if destino.suffix.lower() != ".json":
        raise ErroPipeline("--saida deve usar a extensão .json")
    pai = destino.parent
    if not pai.is_dir():
        raise ErroPipeline(
            f"diretório de --saida não existe: {pai}; crie-o fora de qualquer Git"
        )
    git = ancestral_git(pai)
    if git is not None:
        raise ErroPipeline(
            f"--saida está dentro do repositório Git {git}; "
            "o artefato completo deve permanecer na camada privada"
        )
    return destino


def catalogo_terapias():
    por_id = {}
    for codigo, regra in MAPA_CODIGOS.items():
        item = por_id.setdefault(
            regra["id"],
            {
                "id": regra["id"],
                "terapia": regra["terapia"],
                "especialidade": regra["especialidade"],
                "metodo": regra["metodo"],
                "codigos": [],
            },
        )
        item["codigos"].append(codigo)
    for item in por_id.values():
        item["codigos"].sort(key=lambda c: (c == COD_AT, c))
    return por_id


CATALOGO_TERAPIAS = catalogo_terapias()


def prestador_consolidado(nome_fonte):
    return NOME_MERGE_CNPJ if nome_fonte in MERGE_CNPJ else nome_fonte


def canal_do(tipo_prestador, nome_fonte):
    if nome_fonte in CREDENCIADA_OVERRIDE:
        return "Rede Credenciada"
    tipo = d_nome(tipo_prestador)
    if tipo not in MAPA_CANAL:
        raise ErroPipeline(
            f"Tipo Prestador desconhecido ({forma_celula(tipo_prestador)}); "
            "atualize o mapa auditável"
        )
    return MAPA_CANAL[tipo]


def chave_paciente(registro):
    # Regra oficial: valor de Nome + data de nascimento; sem matrícula e sem
    # normalização fonética, retirada de acento ou aproximação de grafia.
    return registro["nome"], registro["nasc"]


def localizar_aba_dados(wb, arquivo):
    candidatas = []
    for ws in wb.worksheets:
        # No modo somente leitura o openpyxl confia na dimensão declarada no
        # arquivo; se ela vier menor que a área usada, a leitura pararia cedo
        # sem erro. Zerar a dimensão obriga a percorrer a aba inteira.
        ws.reset_dimensions()
        for numero_linha, row in enumerate(
            ws.iter_rows(min_row=1, max_row=30, values_only=True), start=1
        ):
            valores = [texto_celula(v) for v in row]
            while valores and valores[-1] == "":
                valores.pop()
            if valores and valores[0] == "Ano/Mês":
                if valores != CABECALHO_FONTE:
                    raise ErroPipeline(
                        f"{arquivo.name}: schema divergente na aba {ws.title!r}, "
                        f"linha {numero_linha}; esperado exatamente 19 colunas"
                    )
                candidatas.append((ws, numero_linha))
                break
    if len(candidatas) != 1:
        raise ErroPipeline(
            f"{arquivo.name}: esperado um único cabeçalho 'Ano/Mês'; "
            f"encontrados {len(candidatas)}"
        )
    return candidatas[0]


def normalizar_registro(
    valores, arquivo, numero_linha, nascimento_opcional=False
):
    bruto = dict(zip(CHAVES_FONTE, valores))
    try:
        anomes = normalizar_anomes(bruto["anomes"])
        if nascimento_opcional and not re.search(
            r"\d", texto_celula(bruto["nasc"])
        ):
            # Ausente (vazio, traço, "não informado"): resolvido depois por
            # resolver_nascimentos(). Qualquer célula com dígitos precisa ser
            # uma data válida.
            nasc = ""
        else:
            nasc = normalizar_data(bruto["nasc"], "Data Nascimento")
        codigo = codigo_procedimento(bruto["cod_proc"])
        qtd = decimal_celula(bruto["qtd"], "Quantidade Procedimento")
        valor = decimal_celula(bruto["valor"], "Pagamento/Despesa")
    except ErroPipeline as exc:
        raise ErroPipeline(f"{arquivo.name}, linha {numero_linha}: {exc}") from exc

    if codigo not in MAPA_CODIGOS:
        raise ErroPipeline(
            f"{arquivo.name}, linha {numero_linha}: código fora do catálogo "
            f"({forma_celula(bruto['cod_proc'])})"
        )
    if qtd < 0:
        raise ErroPipeline(
            f"{arquivo.name}, linha {numero_linha}: Quantidade Procedimento negativa"
        )

    nome = texto_celula(bruto["nome"])
    nome_prestador_fonte = d_nome(bruto["nome_prest"])
    tipo_prestador = texto_celula(bruto["tipo_prest"])
    if (
        not nome
        or (not nasc and not nascimento_opcional)
        or not nome_prestador_fonte
        or not tipo_prestador
    ):
        raise ErroPipeline(
            f"{arquivo.name}, linha {numero_linha}: chave obrigatória ausente"
        )

    regra = MAPA_CODIGOS[codigo]
    if codigo == COD_AT and nome_prestador_fonte != PEDIAKIDS:
        raise ErroPipeline(
            f"{arquivo.name}, linha {numero_linha}: código {COD_AT} só pode ser "
            f"incorporado quando o prestador é {PEDIAKIDS}"
        )

    tipo_normalizado = d_nome(tipo_prestador)
    try:
        canal = canal_do(tipo_prestador, nome_prestador_fonte)
    except ErroPipeline as exc:
        raise ErroPipeline(
            f"{arquivo.name}, linha {numero_linha}: {exc}"
        ) from exc
    # Guarda de coerência do contrato v5: um registro da Casa jamais pode sair
    # em outro canal (colisão com CREDENCIADA_OVERRIDE). Hoje é impossível nos
    # dados; se um dia acontecer, o pipeline para em vez de decidir sozinho.
    if tipo_normalizado == TIPO_CASA_UNIMED and canal != CANAL_CASA_UNIMED:
        raise ErroPipeline(
            f"{arquivo.name}, linha {numero_linha}: tipo {TIPO_CASA_UNIMED} "
            f"com canal divergente ({canal})"
        )

    registro = {
        "anomes": anomes,
        "matricula": texto_celula(bruto["matricula"]),
        "nome": nome,
        "nasc": nasc,
        "genero": d_nome(bruto["genero"]),
        "guia": texto_celula(bruto["guia"]),
        "dt_atend": texto_celula(bruto["dt_atend"]),
        "cod_sol": texto_celula(bruto["cod_sol"]),
        "nome_sol": d_nome(bruto["nome_sol"]),
        "cbos": texto_celula(bruto["cbos"]),
        "cod_proc": codigo,
        "terapia_id": regra["id"],
        "nome_prest_fonte": nome_prestador_fonte,
        "nome_prest": prestador_consolidado(nome_prestador_fonte),
        "tipo_prest": tipo_normalizado,
        "canal": canal,
        # Entidade publicável, derivada por registro. tipo_prest, nome_prest e
        # nome_prest_fonte permanecem crus: a Matriz 2025 e os contadores
        # 161/160 dependem deles.
        "prest_entidade": (
            CASA_UNIMED
            if tipo_normalizado == TIPO_CASA_UNIMED
            else prestador_consolidado(nome_prestador_fonte)
        ),
        "qtd": qtd,
        "valor": valor,
        "arquivo": arquivo.name,
        "linha": numero_linha,
    }
    registro["paciente"] = chave_paciente(registro)
    return registro


def planilha_ilegivel(caminho):
    return ErroPipeline(
        f"{Path(caminho).name}: não é uma planilha .xlsx legível (arquivo "
        "incompleto, corrompido ou protegido por senha)"
    )


# O que a leitura levanta quando o pacote xlsx abre e se estraga no meio: zip
# danificado ou XML interno malformado. O openpyxl analisa a pasta de trabalho
# com a biblioteca padrão ou com o lxml, conforme o ambiente.
ERROS_DE_PACOTE = (zipfile.BadZipFile, zlib.error, EOFError, ErroXml)
try:
    from lxml.etree import XMLSyntaxError as _ErroXmlLxml
except ImportError:
    pass
else:
    ERROS_DE_PACOTE += (_ErroXmlLxml,)


def abrir_planilha(caminho):
    """Abre um .xlsx só para leitura; arquivo que não abre vira erro claro."""
    try:
        import openpyxl
        from openpyxl.utils.exceptions import InvalidFileException
    except ImportError as exc:
        raise ErroPipeline("openpyxl não instalado") from exc
    try:
        return openpyxl.load_workbook(caminho, data_only=True, read_only=True)
    except (FileNotFoundError, PermissionError):
        raise
    except (InvalidFileException, KeyError, OSError, *ERROS_DE_PACOTE) as exc:
        # OSError: pacote zip que não é uma pasta de trabalho (um .docx
        # renomeado, por exemplo).
        raise planilha_ilegivel(caminho) from exc


def pacote_integro(caminho):
    """Diz se o pacote do arquivo se lê até o fim (todos os membros conferem)."""
    try:
        with zipfile.ZipFile(caminho) as pacote:
            return pacote.testzip() is None
    except (zipfile.BadZipFile, zlib.error, EOFError, OSError):
        return False


def ler_registros_xlsx(caminho, origem):
    wb = abrir_planilha(caminho)
    try:
        ws, linha_cabecalho = localizar_aba_dados(wb, caminho)
        registros = []
        for numero_linha, row in enumerate(
            ws.iter_rows(min_row=linha_cabecalho + 1, values_only=True),
            start=linha_cabecalho + 1,
        ):
            valores = list(row)
            if not any(v is not None and texto_celula(v) != "" for v in valores):
                continue
            if len(valores) > len(CABECALHO_FONTE) and any(
                texto_celula(v) for v in valores[len(CABECALHO_FONTE):]
            ):
                raise ErroPipeline(
                    f"{caminho.name}, linha {numero_linha}: dados além das 19 colunas"
                )
            valores = (valores + [None] * len(CABECALHO_FONTE))[:len(CABECALHO_FONTE)]
            registro = normalizar_registro(
                valores,
                caminho,
                numero_linha,
                nascimento_opcional=(origem == "bloco"),
            )
            registro["origem"] = origem
            registros.append(registro)
    except ERROS_DE_PACOTE as exc:
        # Pacote que abre e se estraga no meio da aba.
        raise planilha_ilegivel(caminho) from exc
    finally:
        wb.close()

    if not registros:
        raise ErroPipeline(f"{caminho.name}: nenhuma linha de dados")
    return registros


def ler_fonte_xlsx(caminho):
    registros = ler_registros_xlsx(caminho, "base")
    codigos = {r["cod_proc"] for r in registros}
    if len(codigos) != 1:
        raise ErroPipeline(
            f"{caminho.name}: cada fonte deve conter um único código; encontrados {sorted(codigos)}"
        )
    return registros, next(iter(codigos))


def descobrir_fontes(diretorio, matriz=None, ignorar=()):
    raiz = exigir_fora_de_git(diretorio, "diretório de fontes")
    if not raiz.is_dir():
        raise ErroPipeline(f"entrada deve ser um diretório: {raiz}")
    # A Matriz e os blocos complementares podem estar na mesma pasta das 19
    # fontes; não contam como fonte. Também não contam o arquivo de trava do
    # Excel (~$…) nem o arquivo oculto que o zip feito no Mac acrescenta a
    # cada planilha (._…).
    fora = {Path(p).resolve(strict=True) for p in ignorar}
    if matriz:
        fora.add(Path(matriz).resolve(strict=True))
    fontes = sorted(
        (
            p.resolve(strict=True)
            for p in raiz.iterdir()
            if p.is_file()
            and p.suffix.lower() == ".xlsx"
            and not p.name.startswith(("~$", "._"))
            and p.resolve(strict=True) not in fora
        ),
        key=lambda p: p.name.casefold(),
    )
    if len(fontes) != 19:
        raise ErroPipeline(
            f"esperadas exatamente 19 fontes xlsx em {raiz}; encontradas {len(fontes)}"
        )
    return raiz, fontes


def ler_diretorio_fontes(diretorio, matriz=None, ignorar=()):
    _, fontes = descobrir_fontes(diretorio, matriz, ignorar)
    todos = []
    manifesto = []
    codigo_por_arquivo = {}
    for fonte in fontes:
        registros, codigo = ler_fonte_xlsx(fonte)
        if codigo in codigo_por_arquivo:
            raise ErroPipeline(
                f"código {codigo} aparece em duas fontes: "
                f"{codigo_por_arquivo[codigo]} e {fonte.name}"
            )
        codigo_por_arquivo[codigo] = fonte.name
        todos.extend(registros)
        meses = sorted({r["anomes"] for r in registros})
        # As fontes-base só contribuem com o período-base, qualquer que seja
        # a janela publicada: o manifesto das 19 fontes é o mesmo em todo build.
        dentro = [r for r in registros if r["anomes"] in MESES_BASE_SET]
        manifesto.append(
            {
                "arquivo": fonte.name,
                "sha256": sha256_arquivo(fonte),
                "codigo": codigo,
                "terapia_id": MAPA_CODIGOS[codigo]["id"],
                "registros": len(registros),
                "registros_periodo_canonico": len(dentro),
                "competencias": meses,
            }
        )

    recebidos = set(codigo_por_arquivo)
    esperados = set(MAPA_CODIGOS)
    if recebidos != esperados:
        raise ErroPipeline(
            "conjunto de códigos das 19 fontes divergente; "
            f"faltantes={sorted(esperados - recebidos)}, extras={sorted(recebidos - esperados)}"
        )
    return todos, manifesto


def conferir_caminhos_blocos(caminhos):
    """Valida os caminhos dos blocos antes de qualquer leitura demorada."""
    reais = []
    for caminho in caminhos:
        try:
            real = exigir_fora_de_git(caminho, "bloco complementar")
        except OSError as exc:
            raise ErroPipeline(
                f"bloco complementar não encontrado: {Path(caminho).name}"
            ) from exc
        if not real.is_file() or real.suffix.lower() != ".xlsx":
            raise ErroPipeline(
                f"bloco complementar deve ser um arquivo .xlsx: {real.name}"
            )
        if any(real.name == outro.name for outro in reais):
            raise ErroPipeline(
                f"dois blocos complementares com o mesmo nome: {real.name}"
            )
        # O pacote se lê até o fim e abre como pasta de trabalho.
        if not pacote_integro(real):
            raise planilha_ilegivel(real)
        abrir_planilha(real).close()
        reais.append(real)
    return reais


def ler_blocos(caminhos):
    """Lê os blocos complementares: planilhas consolidadas pós-base.

    Cada bloco traz vários códigos no mesmo arquivo e só pode conter
    competências posteriores ao período-base. Quando a mesma competência vem
    em mais de um bloco, vale a do bloco mais recente: o que começa no mesmo
    mês ou depois e termina depois — a planilha seguinte da série. Vale o
    intervalo inteiro do arquivo, inclusive além da janela publicada, para
    que o dono de um mês não mude quando a janela cresce. Os registros dessa
    competência nos demais blocos são cedidos: não são agregados nem servem
    de evidência; continuam apenas na varredura anti-vazamento. Quando o
    intervalo não permite dizer qual é o mais recente (mesmo mês final, ou um
    arquivo que começa antes e termina depois do outro), o build para.

    Uma linha com o mês digitado errado não pode decidir essa disputa. Longe
    do resto, ela deixa a planilha com competências não contíguas, e o build
    para. Vizinha do começo ou do fim, ela estica o intervalo em um mês com
    volume ínfimo; por isso o intervalo que conta é o firme — do primeiro ao
    último mês com pelo menos 5% das linhas do mês mais cheio da planilha: o
    mês recém-aberto da planilha seguinte conta, a linha avulsa não. O mês
    de borda abaixo disso continua sendo lido (pode ser faturamento mal
    começado), mas não faz a planilha passar por mais recente, perde o mês
    para quem o traz dentro do intervalo firme e sai apontado no relatório.

    Entre os que trazem a competência dentro do intervalo firme, quem a traz
    cheia tem precedência sobre quem a traz parcial. Parcial é só o primeiro
    ou o último mês do intervalo firme, com menos de 25% das linhas do mês
    mais cheio da própria planilha: o mês começado no meio, ou ainda aberto
    quando a planilha foi extraída — a seguinte, que o repete fechado, fica
    com ele, tenha o mês novo dela passado ou não dos 5%. Mês do meio com
    pouco volume não é parcial: é dado da planilha, e a mais recente fica
    com ele.

    Dois avisos acompanham o que foi cedido, para nada se perder calado: o
    mês parcial que o bloco mais recente cedeu a um mais antigo (se ele
    corrige o mês, a correção não entra) e o mês da janela que ficou com um
    bloco que traz menos registros dele do que o que cedeu (lançamento
    cancelado na origem, ou planilha incompleta nesse mês). Os erros que
    mandam retirar um bloco repetem esses avisos, porque o relatório não
    chega a sair: o do bloco sem nenhuma competência própria, que sai de
    vez, para todos os meses dele; o do bloco sem mês próprio na janela,
    que volta ao comando quando ela crescer, só para os meses da janela.

    Registros além da janela publicada não são agregados. A ordem dos blocos
    na linha de comando não altera o resultado.
    """
    brutos = []
    for real in conferir_caminhos_blocos(caminhos):
        registros = ler_registros_xlsx(real, "bloco")
        meses = sorted({r["anomes"] for r in registros})
        if meses[0] <= FIM_BASE:
            raise ErroPipeline(
                f"{real.name}: bloco complementar contém competência do "
                f"período-base ou anterior ({meses[0]}); a base auditada só "
                "muda com um novo conjunto completo de fontes"
            )
        # Uma planilha cobre meses seguidos. Competência isolada, antes ou
        # depois de uma lacuna, é linha com o mês digitado errado — e ela
        # mudaria o intervalo que decide qual planilha é a mais recente.
        seguidos = sequencia_meses(meses[0], meses[-1])
        if list(seguidos) != meses:
            antes, depois = next(
                (a, b) for a, b in zip(meses, meses[1:])
                if seguidos[seguidos.index(a) + 1] != b
            )
            raise ErroPipeline(
                f"{real.name}: competências não contíguas (depois de {antes} "
                f"vem {depois}); uma planilha cobre meses seguidos — a "
                "competência isolada parece digitada errada e se corrige na "
                "origem"
            )
        linhas_por_mes = Counter(r["anomes"] for r in registros)
        limiar = MIN_BORDA * max(linhas_por_mes.values())
        firmes = [m for m in meses if linhas_por_mes[m] >= limiar]
        brutos.append(
            (real, registros, meses, (firmes[0], firmes[-1]), linhas_por_mes)
        )
    brutos.sort(key=lambda item: (item[2][0], item[2][-1], item[0].name))
    candidatos = defaultdict(list)
    for posicao, item in enumerate(brutos):
        for mes in item[2]:
            candidatos[mes].append(posicao)

    def mais_recente(p, q):
        # Pelo intervalo firme: uma linha em mês vizinho não muda a ordem.
        (inicio_p, fim_p), (inicio_q, fim_q) = brutos[p][3], brutos[q][3]
        return fim_p > fim_q and inicio_p >= inicio_q

    def mes_cheio(p, mes):
        # Só a borda do intervalo firme pode ser mês parcial.
        linhas_por_mes = brutos[p][4]
        if mes not in brutos[p][3]:
            return True
        return linhas_por_mes[mes] >= MIN_MES_CHEIO * max(linhas_por_mes.values())

    def intervalo(p):
        return f"{brutos[p][0].name} ({brutos[p][2][0]} a {brutos[p][2][-1]})"

    def borda_fraca(p):
        real, _registros, meses, (inicio, fim), linhas_por_mes = brutos[p]
        return [
            {"m": m, "registros": linhas_por_mes[m]}
            for m in meses if m < inicio or m > fim
        ]

    def bordas_por_extenso(p):
        return [
            f"{borda['m']} tem {formatar_inteiro(borda['registros'])} "
            f"{'registro' if borda['registros'] == 1 else 'registros'} em "
            f"{brutos[p][0].name}"
            for borda in borda_fraca(p)
        ]

    def avisos_para_o_erro(parciais, menores):
        """Os avisos do relatório, na mensagem que manda retirar o bloco."""
        return (
            "; " + ", ".join(parciais) + ": mês parcial nesta planilha, mais "
            "nova do que a que ficou com ele — se esta planilha corrige o mês, "
            "a correção não entra: confirme com a origem antes de retirar o "
            "bloco"
            if parciais else ""
        ) + (
            "; quem ficou com o mês traz menos registros dele do que este "
            "bloco — "
            + "; ".join(
                f"{menor['m']}: {formatar_inteiro(menor['registros_no_dono'])} "
                f"em {menor['a']}, {formatar_inteiro(menor['registros'])} "
                "neste bloco"
                for menor in menores
            )
            + " — lançamento cancelado na origem, ou planilha incompleta: "
            "confirme com a origem antes de retirar o bloco"
            if menores else ""
        )

    dono_da_competencia = {}
    for mes in sorted(candidatos):
        concorrentes = candidatos[mes]
        # Quem traz o mês dentro do intervalo firme tem precedência sobre
        # quem só o traz como borda de volume ínfimo.
        de_verdade = [
            p for p in concorrentes if brutos[p][3][0] <= mes <= brutos[p][3][1]
        ]
        if de_verdade:
            concorrentes = de_verdade
        # Entre eles, quem traz o mês cheio tem precedência sobre quem o traz
        # parcial (ainda aberto na extração, ou começado no meio).
        cheios = [p for p in concorrentes if mes_cheio(p, mes)]
        if cheios:
            concorrentes = cheios
        donos = [
            p for p in concorrentes
            if all(p == q or mais_recente(p, q) for q in concorrentes)
        ]
        if not donos:
            a, b = next(
                (p, q)
                for i, p in enumerate(concorrentes)
                for q in concorrentes[i + 1:]
                if not mais_recente(p, q) and not mais_recente(q, p)
            )
            fracas = bordas_por_extenso(a) + bordas_por_extenso(b)
            raise ErroPipeline(
                f"{intervalo(a)} e {intervalo(b)} trazem a competência {mes} "
                "e não há como saber qual é a planilha mais recente (a mais "
                "recente começa no mesmo mês ou depois e termina depois"
                + (
                    "; mês de borda com volume ínfimo não conta: "
                    + ", ".join(fracas)
                    + " — competência digitada errada ou faturamento mal começado"
                    if fracas else ""
                )
                + "); fique com uma delas ou peça à origem uma planilha única"
            )
        dono_da_competencia[mes] = donos[0]
    lidos = []
    for posicao, (real, registros, meses, _firme, linhas_do_bloco) in enumerate(brutos):
        proprias = [m for m in meses if dono_da_competencia[m] == posicao]
        cedidas = [m for m in meses if dono_da_competencia[m] != posicao]
        # Mês parcial que este bloco, mais recente, cedeu a um mais antigo
        # que o traz cheio: se a planilha nova corrige o mês, a correção não
        # entra.
        parciais_cedidas = [
            {
                "m": m,
                "registros": linhas_do_bloco[m],
                "a": brutos[dono_da_competencia[m]][0].name,
            }
            for m in cedidas
            if not mes_cheio(posicao, m)
            and mais_recente(posicao, dono_da_competencia[m])
        ]
        # Mês que ficou com um bloco que traz menos registros dele do que
        # este: lançamento cancelado na origem, ou planilha incompleta nesse
        # mês. O manifesto e o relatório só falam dos meses da janela.
        com_menos_registros = [
            {
                "m": m,
                "registros": linhas_do_bloco[m],
                "a": brutos[dono_da_competencia[m]][0].name,
                "registros_no_dono": brutos[dono_da_competencia[m]][4][m],
            }
            for m in cedidas
            if brutos[dono_da_competencia[m]][4][m] < linhas_do_bloco[m]
        ]
        menos_na_janela = [
            menor for menor in com_menos_registros
            if menor["m"] in MESES_CANONICOS_SET
        ]
        if not proprias:
            donos_do_bloco = sorted({dono_da_competencia[m] for m in meses})
            vencedores = "; ".join(intervalo(p) for p in donos_do_bloco)
            varios = len(donos_do_bloco) > 1
            if all(mais_recente(p, posicao) for p in donos_do_bloco):
                quem = "blocos mais recentes" if varios else "um bloco mais recente"
                conferir = (
                    "esses são mesmo os arquivos novos" if varios
                    else "esse é mesmo o arquivo novo"
                )
            else:
                # Algum dono ficou com o mês por trazê-lo cheio, ou dentro do
                # intervalo firme, e não por ser mais recente.
                quem = (
                    "outros blocos, que ficam com elas" if varios
                    else "outro bloco, que fica com elas"
                )
                conferir = (
                    "esses são mesmo os arquivos a usar" if varios
                    else "esse é mesmo o arquivo a usar"
                )
            # Este bloco sai de vez do comando e do cofre, e leva junto o que
            # o relatório diria quando a janela crescesse: o erro repete os
            # avisos de todos os meses dele, publicados agora ou depois.
            raise ErroPipeline(
                f"{real.name}: todas as competências do bloco vêm também de "
                f"{quem} — {vencedores}; confira se {conferir} e retire este "
                "do comando"
                + avisos_para_o_erro(
                    [parcial["m"] for parcial in parciais_cedidas],
                    com_menos_registros,
                )
            )
        for r in registros:
            if dono_da_competencia[r["anomes"]] != posicao:
                r["cedido"] = True
        na_janela = [
            r for r in registros
            if not r.get("cedido") and r["anomes"] in MESES_CANONICOS_SET
        ]
        if not na_janela:
            # Nada do bloco entra na publicação: ele é todo posterior à
            # janela, ou os meses dele dentro dela ficaram com outro bloco —
            # e o erro diz com quem ficou cada um. O bloco volta ao comando
            # quando a janela crescer: aqui bastam os avisos dos meses dela.
            ficaram = [
                f"{m} ficou com {brutos[dono_da_competencia[m]][0].name} "
                "(registros do mês: "
                f"{formatar_inteiro(brutos[dono_da_competencia[m]][4][m])} "
                f"nele, {formatar_inteiro(linhas_do_bloco[m])} neste bloco)"
                for m in cedidas if m in MESES_CANONICOS_SET
            ]
            raise ErroPipeline(
                f"{real.name}: nenhuma competência do bloco entra na janela "
                f"publicada (até {FIM_CANONICO})"
                + (": " + "; ".join(ficaram) if ficaram else "")
                + "; retire o bloco ou ajuste --ate"
                + avisos_para_o_erro(
                    [
                        parcial["m"] for parcial in parciais_cedidas
                        if parcial["m"] in MESES_CANONICOS_SET
                    ],
                    menos_na_janela,
                )
            )
        por_mes = grupos(na_janela, lambda r: r["anomes"])
        lidos.append(
            (
                proprias[0],
                real.name,
                registros,
                {
                    "arquivo": real.name,
                    "sha256": sha256_arquivo(real),
                    "codigos": sorted({r["cod_proc"] for r in na_janela}),
                    "registros": len(registros),
                    "registros_na_janela": len(na_janela),
                    "registros_cedidos": sum(
                        1 for r in registros if r.get("cedido")
                    ),
                    "competencias": meses,
                    "competencias_na_janela": sorted(por_mes),
                    "competencias_cedidas": cedidas,
                    "cedidas_a": sorted(
                        {brutos[dono_da_competencia[m]][0].name for m in cedidas}
                    ),
                    # Meses de borda com volume ínfimo: lidos, mas fora do
                    # intervalo que decide qual planilha é a mais recente.
                    "borda_fraca": borda_fraca(posicao),
                    "parciais_cedidas": parciais_cedidas,
                    "cedidas_com_menos_registros": menos_na_janela,
                    # Totais como lidos da planilha, antes de qualquer
                    # exclusão: é o que se confere com o total da origem.
                    "totais_lidos": [
                        {
                            "m": mes,
                            "registros": len(por_mes[mes]),
                            "sessoes": numero(
                                sum((r["qtd"] for r in por_mes[mes]), Decimal(0))
                            ),
                            "pagamento": dinheiro(
                                sum((r["valor"] for r in por_mes[mes]), Decimal(0))
                            ),
                        }
                        for mes in sorted(por_mes)
                    ],
                },
            )
        )
    lidos.sort(key=lambda item: item[:2])
    todos = [r for item in lidos for r in item[2]]
    manifesto = [item[3] for item in lidos]
    faltantes = [
        m for m in MESES_CANONICOS
        if m not in MESES_BASE_SET and m not in dono_da_competencia
    ]
    if faltantes:
        raise ErroPipeline(
            "competências da janela publicada sem registros em nenhum bloco: "
            + ", ".join(faltantes)
        )
    return todos, manifesto


def resolver_nascimentos(registros_base, registros_blocos, manifesto_blocos):
    """Trata os registros de bloco sem data de nascimento.

    Recupera a data quando a mesma matrícula e o mesmo nome têm uma única
    data em outro registro da base ou de bloco em competência até a do
    próprio registro. Evidência de competência posterior não vale: o
    conteúdo de um mês não pode depender de meses seguintes, publicados ou
    não. O que não for recuperável sai da agregação e é contado no manifesto
    do bloco; acima da tolerância, para.
    """
    # (matrícula, nome) -> {data: primeira competência em que apareceu};
    # a base vem antes de qualquer competência de bloco.
    conhecidos = defaultdict(dict)
    for r in registros_base:
        conhecidos[(r["matricula"], r["nome"])][r["nasc"]] = ""
    for r in registros_blocos:
        if r["nasc"] and not r.get("cedido"):
            datas = conhecidos[(r["matricula"], r["nome"])]
            if r["anomes"] < datas.get(r["nasc"], "9999/99"):
                datas[r["nasc"]] = r["anomes"]
    resumo = {
        bloco["arquivo"]: {
            "registros": 0,
            "recuperados": 0,
            "fora_do_painel": 0,
            "sessoes_fora_do_painel": Decimal(0),
            "pagamento_fora_do_painel": Decimal(0),
            "competencias": set(),
        }
        for bloco in manifesto_blocos
    }
    for r in registros_blocos:
        if r["nasc"] or r.get("cedido"):
            continue
        datas = [
            data
            for data, primeira in conhecidos.get(
                (r["matricula"], r["nome"]), {}
            ).items()
            if primeira <= r["anomes"]
        ]
        recuperavel = bool(r["matricula"]) and len(datas) == 1
        if recuperavel:
            r["nasc"] = datas[0]
            r["paciente"] = chave_paciente(r)
        else:
            r["sem_nascimento"] = True
        if r["anomes"] not in MESES_CANONICOS_SET:
            continue
        item = resumo[r["arquivo"]]
        item["registros"] += 1
        item["competencias"].add(r["anomes"])
        if recuperavel:
            item["recuperados"] += 1
        else:
            item["fora_do_painel"] += 1
            item["sessoes_fora_do_painel"] += r["qtd"]
            item["pagamento_fora_do_painel"] += r["valor"]
    for bloco in manifesto_blocos:
        item = resumo[bloco["arquivo"]]
        limite = max(
            MAX_SEM_NASCIMENTO_FIXO,
            int(bloco["registros_na_janela"] * MAX_SEM_NASCIMENTO_PROPORCAO),
        )
        if item["fora_do_painel"] > limite:
            raise ErroPipeline(
                f"{bloco['arquivo']}: {item['fora_do_painel']} registros sem "
                "data de nascimento nas competências publicadas, acima da "
                f"tolerância de {limite}; a planilha precisa ser corrigida na "
                "origem"
            )
        bloco["sem_nascimento"] = {
            "registros": item["registros"],
            "recuperados": item["recuperados"],
            "fora_do_painel": item["fora_do_painel"],
            "sessoes_fora_do_painel": numero(item["sessoes_fora_do_painel"]),
            "pagamento_fora_do_painel": dinheiro(
                item["pagamento_fora_do_painel"]
            ),
            "competencias": sorted(item["competencias"]),
        }


def conferir_blocos(incluidos, registros_blocos, manifesto_blocos, descartadas, mantidas):
    """Amarra os blocos à base antes de agregar.

    1. Fechamento: em cada bloco, os registros lidos na janela publicada são
       exatamente os agregados mais os de terapia descartada mais os sem data
       de nascimento que ficaram fora do painel.
    2. Continuidade: em cada competência nova, ao menos metade das crianças
       tem de já ter aparecido em competência anterior.
    3. Grafia: criança nova que só difere de uma já vista por caixa, acento
       ou espaços no nome segue contada como nova (regra Nome + Nascimento),
       mas é informada; acima da tolerância o build para.
    4. Volume: competência nova com menos de um quarto das sessões de um mês
       recente da base (mediana dos seis últimos) não é publicada.

    Devolve, por competência nova, crianças, já vistas, grafia divergente e
    terapias mantidas sem lançamento — publicado em meta.competencias_novas.
    """
    ids_descartadas = {item["id"] for item in descartadas}
    agregados = Counter(
        r["arquivo"] for r in incluidos if r.get("origem") == "bloco"
    )
    for bloco in manifesto_blocos:
        descartados = sum(
            1
            for r in registros_blocos
            if r["arquivo"] == bloco["arquivo"]
            and r["anomes"] in MESES_CANONICOS_SET
            and not r.get("cedido")
            and not r.get("sem_nascimento")
            and r["terapia_id"] in ids_descartadas
        )
        bloco["registros_agregados"] = agregados.get(bloco["arquivo"], 0)
        bloco["registros_terapia_descartada"] = descartados
        if (
            bloco["registros_agregados"]
            + descartados
            + bloco["sem_nascimento"]["fora_do_painel"]
            != bloco["registros_na_janela"]
        ):
            raise ErroPipeline(
                f"{bloco['arquivo']}: os registros lidos na janela publicada "
                "não fecham com agregados + terapia descartada + sem data de "
                "nascimento"
            )

    def chave_frouxa(paciente):
        return d_nome(paciente[0]), paciente[1]

    por_mes = defaultdict(set)
    terapias_por_mes = defaultdict(set)
    sessoes_por_mes = defaultdict(Decimal)
    vistas = set()
    for r in incluidos:
        sessoes_por_mes[r["anomes"]] += r["qtd"]
        if r["anomes"] in MESES_BASE_SET:
            vistas.add(r["paciente"])
        else:
            por_mes[r["anomes"]].add(r["paciente"])
            terapias_por_mes[r["anomes"]].add(r["terapia_id"])
    recentes = sorted(sessoes_por_mes[m] for m in MESES_BASE[-6:])
    volume_de_referencia = (recentes[2] + recentes[3]) / 2
    frouxas = {chave_frouxa(p) for p in vistas}
    competencias_novas = []
    for mes in MESES_CANONICOS:
        if mes in MESES_BASE_SET:
            continue
        do_mes = por_mes.get(mes, set())
        if sessoes_por_mes[mes] < volume_de_referencia * MIN_VOLUME:
            raise ErroPipeline(
                f"competência {mes}: {formatar_numero(numero(sessoes_por_mes[mes]))} "
                f"{'sessão agregada' if sessoes_por_mes[mes] == 1 else 'sessões agregadas'}"
                f", menos de {int(MIN_VOLUME * 100)}% do volume "
                "mensal recente da base "
                f"({formatar_numero(numero(volume_de_referencia))}); faturamento "
                "ainda entrando ou competência digitada errada — publique até "
                "a competência anterior ou confira a planilha"
            )
        novas = do_mes - vistas
        ja_vistas = len(do_mes) - len(novas)
        grafia = sum(1 for p in novas if chave_frouxa(p) in frouxas)
        if do_mes and Decimal(ja_vistas) / Decimal(len(do_mes)) < MIN_CONTINUIDADE:
            raise ErroPipeline(
                f"competência {mes}: só {ja_vistas} de {len(do_mes)} crianças "
                "já apareciam em competências anteriores; nome ou data de "
                "nascimento parecem estar em formato diferente do da base — "
                "confira a planilha antes de publicar"
            )
        limite = max(
            MAX_GRAFIA_FIXO, int(len(do_mes) * MAX_GRAFIA_PROPORCAO)
        )
        if grafia > limite:
            raise ErroPipeline(
                f"competência {mes}: {grafia} crianças só diferem de crianças "
                "já vistas por caixa, acento ou espaços no nome, acima da "
                f"tolerância de {limite}; a grafia dos nomes mudou em relação "
                "às competências anteriores"
            )
        competencias_novas.append(
            {
                "m": mes,
                "criancas": len(do_mes),
                "ja_vistas": ja_vistas,
                "grafia_divergente": grafia,
                "terapias_sem_lancamento": sorted(
                    CATALOGO_TERAPIAS[terapia_id]["terapia"]
                    for terapia_id in mantidas
                    if terapia_id not in terapias_por_mes.get(mes, set())
                ),
            }
        )
        vistas |= do_mes
        frouxas |= {chave_frouxa(p) for p in do_mes}
    return competencias_novas


def na_janela_publicada(registro):
    """Fontes-base cobrem só o período-base; blocos, só o que vem depois."""
    if registro.get("sem_nascimento") or registro.get("cedido"):
        return False
    mes = registro["anomes"]
    if registro.get("origem") == "bloco":
        return mes in MESES_CANONICOS_SET and mes not in MESES_BASE_SET
    return mes in MESES_BASE_SET


def preparar_universo(registros):
    canonicos = [r for r in registros if na_janela_publicada(r)]
    # A regra de cobertura é avaliada somente no período-base: o conjunto de
    # terapias fica congelado e uma competência nova sem lançamentos aparece
    # como zero, em vez de retirar a terapia de toda a série histórica.
    cobertura = defaultdict(set)
    por_terapia = defaultdict(list)
    pos_base = defaultdict(list)
    for r in canonicos:
        if r["anomes"] in MESES_BASE_SET:
            cobertura[r["terapia_id"]].add(r["anomes"])
            por_terapia[r["terapia_id"]].append(r)
        else:
            pos_base[r["terapia_id"]].append(r)

    descartadas = []
    mantidas = []
    for terapia_id, definicao in sorted(CATALOGO_TERAPIAS.items()):
        meses = cobertura.get(terapia_id, set())
        faltantes = sorted(MESES_BASE_SET - meses)
        item = {
            "id": terapia_id,
            "terapia": definicao["terapia"],
            "codigos": list(definicao["codigos"]),
            "competencias_encontradas": len(meses),
            "competencias_esperadas": len(MESES_BASE),
            "competencias_faltantes": faltantes,
        }
        if faltantes:
            item["motivo"] = (
                f"cobertura incompleta ({len(meses)}/{len(MESES_BASE)} competências)"
            )
            if janela_estendida():
                posteriores = pos_base.get(terapia_id, [])
                item["motivo"] = (
                    f"cobertura incompleta no período-base de {INICIO_CANONICO} "
                    f"a {FIM_BASE} ({len(meses)}/{len(MESES_BASE)} competências)"
                    + (
                        "; os registros das competências posteriores também "
                        "ficam fora do painel"
                        if posteriores
                        else ""
                    )
                )
                item["registros_pos_base"] = len(posteriores)
                item["sessoes_pos_base"] = numero(
                    sum((r["qtd"] for r in posteriores), Decimal(0))
                )
                item["pagamento_pos_base"] = dinheiro(
                    sum((r["valor"] for r in posteriores), Decimal(0))
                )
                item["competencias_pos_base"] = sorted(
                    {r["anomes"] for r in posteriores}
                )
            item["pacientes"] = len(
                {r["paciente"] for r in por_terapia.get(terapia_id, [])}
            )
            descartadas.append(item)
        else:
            mantidas.append(terapia_id)

    if {x["id"] for x in descartadas} != {ID_PECS}:
        raise ErroPipeline(
            "normalização de cobertura deve descartar somente PECS — Fonoaudiologia; "
            f"descartadas={[x['id'] for x in descartadas]}"
        )
    if cobertura[ID_PECS] != MESES_PECS_ESPERADOS:
        raise ErroPipeline(
            "cobertura observada de PECS diverge das 13 competências auditadas"
        )
    if len(mantidas) != 17:
        raise ErroPipeline(f"esperadas 17 terapias mantidas; encontradas {len(mantidas)}")

    incluidos = [r for r in canonicos if r["terapia_id"] in set(mantidas)]
    return incluidos, mantidas, descartadas


def solicitante_valido(registro):
    nome = registro["nome_sol"]
    return bool(
        nome
        and nome != "-"
        and "NAO INFORMADO" not in nome
    )


# As seções seguintes agregam somente conjuntos de pacientes. A chave interna
# Nome + Nascimento existe apenas em memória e nunca é transferida para o JSON.


def gerar_periodos():
    periodos = [
        {
            "id": "tudo",
            "tipo": "tudo",
            "rotulo": "Período completo",
            "inicio": INICIO_CANONICO,
            "fim": FIM_CANONICO,
            "meses": list(MESES_CANONICOS),
        }
    ]
    anos = sorted({m[:4] for m in MESES_CANONICOS})
    for ano in anos:
        meses = [m for m in MESES_CANONICOS if m.startswith(ano)]
        periodos.append(
            {
                "id": f"ano-{ano}",
                "tipo": "ano",
                "rotulo": ano,
                "inicio": meses[0],
                "fim": meses[-1],
                "meses": meses,
            }
        )
    for ano in anos:
        for semestre in (1, 2):
            meses = [
                m for m in MESES_CANONICOS
                if m.startswith(ano)
                and ((int(m[5:7]) - 1) // 6 + 1) == semestre
            ]
            if meses:
                periodos.append(
                    {
                        "id": f"semestre-{ano}-S{semestre}",
                        "tipo": "semestre",
                        "rotulo": f"{semestre}º semestre de {ano}",
                        "inicio": meses[0],
                        "fim": meses[-1],
                        "meses": meses,
                    }
                )
    for ano in anos:
        for trimestre in (1, 2, 3, 4):
            meses = [
                m for m in MESES_CANONICOS
                if m.startswith(ano)
                and ((int(m[5:7]) - 1) // 3 + 1) == trimestre
            ]
            if meses:
                periodos.append(
                    {
                        "id": f"trimestre-{ano}-T{trimestre}",
                        "tipo": "trimestre",
                        "rotulo": f"{trimestre}º trimestre de {ano}",
                        "inicio": meses[0],
                        "fim": meses[-1],
                        "meses": meses,
                    }
                )
    for mes in MESES_CANONICOS:
        periodo_id = mes.replace("/", "-")
        periodos.append(
            {
                "id": f"mes-{periodo_id}",
                "tipo": "mes",
                "rotulo": mes,
                "inicio": mes,
                "fim": mes,
                "meses": [mes],
            }
        )
    return periodos


def metricas_exatas(registros):
    pacientes = {r["paciente"] for r in registros}
    sessoes = sum((r["qtd"] for r in registros), Decimal(0))
    # O PRD exclui somente lançamentos com pagamento igual a zero. Eventuais
    # estornos negativos permanecem no denominador por serem linhas pagas.
    sessoes_pagas = sum(
        (r["qtd"] for r in registros if r["valor"] != 0), Decimal(0)
    )
    pagamento = sum((r["valor"] for r in registros), Decimal(0))
    return {
        "n_pacientes": len(pacientes),
        "pacientes_set": pacientes,
        "registros": len(registros),
        "sessoes": sessoes,
        "sessoes_pagas": sessoes_pagas,
        "pagamento": pagamento,
    }


def publicar_metricas(exatas):
    n = exatas["n_pacientes"]
    if n == 0:
        return {
            "pacientes": 0,
            "registros": 0,
            "sessoes": 0,
            "sessoes_pagas": 0,
            "pagamento": 0.0,
            "custo_sessao": None,
            "custo_beneficiario": None,
            "sessoes_beneficiario": None,
        }
    return {
        "pacientes": n,
        "registros": exatas["registros"],
        "sessoes": numero(exatas["sessoes"]),
        "sessoes_pagas": numero(exatas["sessoes_pagas"]),
        "pagamento": dinheiro(exatas["pagamento"]),
        "custo_sessao": razao(exatas["pagamento"], exatas["sessoes_pagas"]),
        "custo_beneficiario": razao(exatas["pagamento"], n),
        "sessoes_beneficiario": razao(exatas["sessoes"], n),
    }


def grupos(registros, chave):
    saida = defaultdict(list)
    for registro in registros:
        saida[chave(registro)].append(registro)
    return saida


def pct(parte, total):
    if not total:
        return 0.0
    return dinheiro(Decimal(parte) * Decimal(100) / Decimal(total))


def faixa_etaria(idade):
    if idade < 3:
        return "0–2"
    if idade < 6:
        return "3–5"
    if idade < 9:
        return "6–8"
    if idade < 12:
        return "9–11"
    if idade < 15:
        return "12–14"
    if idade < 18:
        return "15–17"
    return "18+"


def idade_na_data(nascimento, corte):
    nasc = date.fromisoformat(nascimento)
    return corte.year - nasc.year - (
        (corte.month, corte.day) < (nasc.month, nasc.day)
    )


def serie_mensal(registros, meses):
    por_mes = grupos(registros, lambda r: r["anomes"])
    serie = []
    for mes in meses:
        item = {"m": mes}
        item.update(publicar_metricas(metricas_exatas(por_mes.get(mes, []))))
        serie.append(item)
    return serie


def agregar_terapias(
    registros,
    terapias_mantidas,
    pagamento_total,
):
    por_terapia = grupos(registros, lambda r: r["terapia_id"])
    itens = []
    for terapia_id in terapias_mantidas:
        linhas = por_terapia.get(terapia_id, [])
        exatas = metricas_exatas(linhas)
        definicao = CATALOGO_TERAPIAS[terapia_id]
        item = {
            "id": terapia_id,
            "terapia": definicao["terapia"],
            "codigos": list(definicao["codigos"]),
            "especialidade": definicao["especialidade"],
            "metodo": definicao["metodo"],
            "quantidade_entidades": 1,
        }
        item.update(publicar_metricas(exatas))
        item["exposicoes"] = len(
            {(r["paciente"], r["terapia_id"]) for r in linhas}
        )
        item["participacao_pct"] = pct(
            exatas["pagamento"], pagamento_total
        )
        at = metricas_exatas(
            [r for r in linhas if r["cod_proc"] == COD_AT]
        )
        item["at_sessoes"] = numero(at["sessoes"])
        item["at_pct"] = (
            pct(at["sessoes"], exatas["sessoes"])
            if exatas["sessoes"] else None
        )
        itens.append(item)
    itens.sort(key=lambda x: x["terapia"])
    return itens


def agregar_prestadores(registros, meses):
    # Contrato v5: ranking por entidade publicada. Os registros da Casa Unimed
    # consolidam num item único com a composição por profissional.
    por_prestador = grupos(registros, lambda r: r["prest_entidade"])
    itens = []
    series = {}
    for nome, linhas in por_prestador.items():
        exatas = metricas_exatas(linhas)
        item = {
            "nome": nome,
            "quantidade_entidades": 1,
        }
        item.update(publicar_metricas(exatas))
        paciente_meses = len(
            {(r["paciente"], r["anomes"]) for r in linhas}
        )
        item["paciente_meses"] = paciente_meses
        item["intensidade_mensal"] = (
            razao(exatas["sessoes"], paciente_meses)
            if paciente_meses else None
        )
        item["nomes_fonte"] = sorted(
            {r["nome_prest_fonte"] for r in linhas}
        )
        canal_pagamento = defaultdict(Decimal)
        canal_registros = Counter()
        for r in linhas:
            canal_pagamento[r["canal"]] += r["valor"]
            canal_registros[r["canal"]] += 1
        item["canais"] = sorted(canal_pagamento)
        item["canal"] = max(
            canal_pagamento,
            key=lambda c: (canal_pagamento[c], canal_registros[c], c),
        )
        terapia_ids = sorted({r["terapia_id"] for r in linhas})
        item["terapias"] = [
            CATALOGO_TERAPIAS[t]["terapia"] for t in terapia_ids
        ]
        item["especialidades"] = sorted(
            {CATALOGO_TERAPIAS[t]["especialidade"] for t in terapia_ids}
        )
        item["metodos"] = sorted(
            {CATALOGO_TERAPIAS[t]["metodo"] for t in terapia_ids}
        )
        at = metricas_exatas(
            [r for r in linhas if r["cod_proc"] == COD_AT]
        )
        item["at_sessoes"] = numero(at["sessoes"])
        item["at_pct"] = (
            pct(at["sessoes"], exatas["sessoes"])
            if exatas["sessoes"] else None
        )
        if nome == CASA_UNIMED:
            composicao = []
            for profissional, plinhas in grupos(
                linhas, lambda r: r["nome_prest"]
            ).items():
                pexatas = metricas_exatas(plinhas)
                composicao.append(
                    {
                        "nome": profissional,
                        "sessoes": numero(pexatas["sessoes"]),
                        "pagamento": dinheiro(pexatas["pagamento"]),
                        "pacientes": pexatas["n_pacientes"],
                    }
                )
            composicao.sort(key=lambda x: (-(x["pagamento"] or 0), x["nome"]))
            item["composicao"] = composicao
            item["quantidade_entidades"] = len(composicao)
        itens.append(item)
        series[nome] = serie_mensal(linhas, meses)

    itens.sort(key=lambda x: (-(x["pagamento"] or 0), x["nome"]))
    return itens, dict(sorted(series.items()))


def agregar_prestador_disciplina(registros, chave_nome=None):
    # Contrato v4: fatia exata prestador × disciplina. A soma das fatias de um
    # prestador reproduz o total dele no recorte (validado em validar_saida).
    # Contrato v5: a chave padrão é a entidade publicada (coerente com o
    # ranking); as referências continuam consumindo fatias por profissional
    # via chave_nome=lambda r: r["nome_prest"].
    if chave_nome is None:
        chave_nome = lambda r: r["prest_entidade"]
    por_fatia = grupos(
        registros,
        lambda r: (
            chave_nome(r),
            CATALOGO_TERAPIAS[r["terapia_id"]]["especialidade"],
        ),
    )
    itens = []
    for (nome, disciplina), linhas in por_fatia.items():
        exatas = metricas_exatas(linhas)
        item = {"nome": nome, "disciplina": disciplina}
        item.update(publicar_metricas(exatas))
        paciente_meses = len({(r["paciente"], r["anomes"]) for r in linhas})
        item["paciente_meses"] = paciente_meses
        item["intensidade_mensal"] = (
            razao(exatas["sessoes"], paciente_meses) if paciente_meses else None
        )
        canal_pagamento = defaultdict(Decimal)
        canal_registros = Counter()
        for r in linhas:
            canal_pagamento[r["canal"]] += r["valor"]
            canal_registros[r["canal"]] += 1
        item["canal"] = max(
            canal_pagamento,
            key=lambda c: (canal_pagamento[c], canal_registros[c], c),
        )
        at = metricas_exatas([r for r in linhas if r["cod_proc"] == COD_AT])
        item["at_sessoes"] = numero(at["sessoes"])
        item["at_pct"] = (
            pct(at["sessoes"], exatas["sessoes"]) if exatas["sessoes"] else None
        )
        itens.append(item)
    itens.sort(key=lambda x: (x["nome"], x["disciplina"]))
    return itens


def disciplina_do(registro):
    return CATALOGO_TERAPIAS[registro["terapia_id"]]["especialidade"]


def agregar_disciplina_serie(registros, meses):
    # Contrato v4: série mensal por disciplina. A soma das disciplinas em cada
    # competência reproduz a série mensal total (validado em validar_saida).
    por_disciplina = grupos(
        registros,
        lambda r: CATALOGO_TERAPIAS[r["terapia_id"]]["especialidade"],
    )
    return {
        disciplina: serie_mensal(linhas, meses)
        for disciplina, linhas in sorted(por_disciplina.items())
    }


def agregar_disciplina_canais(registros):
    # Contrato v5: leitura por canal dentro de cada disciplina, para a aba
    # Canais reagir ao escopo de disciplina. Cross-foot duplo validado em
    # validar_saida: contra prestador_disciplina e contra canais do recorte.
    por_disciplina = grupos(registros, disciplina_do)
    saida = {}
    for disciplina, linhas in sorted(por_disciplina.items()):
        itens = []
        for canal, linhas_canal in sorted(
            grupos(linhas, lambda r: r["canal"]).items()
        ):
            item = {"canal": canal}
            item.update(publicar_metricas(metricas_exatas(linhas_canal)))
            item["exposicoes"] = len(
                {(r["paciente"], r["terapia_id"]) for r in linhas_canal}
            )
            item["prestadores"] = len(
                {r["prest_entidade"] for r in linhas_canal}
            )
            item["profissionais"] = len(
                {r["nome_prest"] for r in linhas_canal}
            )
            itens.append(item)
        itens.sort(key=lambda x: (-(x["pagamento"] or 0), x["canal"]))
        saida[disciplina] = itens
    return saida


def agregar_resumo_disciplina(registros):
    # Contrato v5: resumo por disciplina com crianças únicas deduplicadas
    # DENTRO da disciplina. A soma de pacientes entre disciplinas excede o
    # total do recorte por construção; pagamento e sessões somam exatos.
    por_disciplina = grupos(registros, disciplina_do)
    saida = {}
    for disciplina, linhas in sorted(por_disciplina.items()):
        item = publicar_metricas(metricas_exatas(linhas))
        item["exposicoes"] = len(
            {(r["paciente"], r["terapia_id"]) for r in linhas}
        )
        saida[disciplina] = item
    return saida


def kit_da_crianca(disciplinas):
    # Taxonomia do painel: classificação exaustiva e mutuamente exclusiva da
    # criança pelo conjunto de disciplinas utilizadas no recorte.
    if len(disciplinas) == 1:
        return "unica"
    if len(disciplinas) == 2:
        return "duas"
    if disciplinas == TRIPE_DISCIPLINAS:
        return "tripe"
    if TRIPE_DISCIPLINAS <= disciplinas:
        return "tripe-ampliado"
    return "multiplas-sem-tripe"


def agregar_kits(registros):
    # Contrato v5: agregados por kit terapêutico. Kit ausente do JSON significa
    # suprimido pelo k-anonimato (menos de K_MINIMO_KIT crianças), nunca zero.
    disciplinas_paciente = defaultdict(set)
    for r in registros:
        disciplinas_paciente[r["paciente"]].add(disciplina_do(r))
    linhas_kit = grupos(
        registros, lambda r: kit_da_crianca(disciplinas_paciente[r["paciente"]])
    )
    saida = {}
    for kit in KITS:
        linhas = linhas_kit.get(kit["id"], [])
        criancas = {r["paciente"] for r in linhas}
        if len(criancas) < K_MINIMO_KIT:
            continue
        exatas = metricas_exatas(linhas)
        item = {
            "id": kit["id"],
            "rotulo": kit["rotulo"],
            "criterio": kit["criterio"],
            "criancas": len(criancas),
        }
        item.update(publicar_metricas(exatas))
        crianca_meses = len({(r["paciente"], r["anomes"]) for r in linhas})
        item["crianca_meses"] = crianca_meses
        item["custo_crianca_mes"] = razao(exatas["pagamento"], crianca_meses)
        canais = []
        for canal, linhas_canal in sorted(
            grupos(linhas, lambda r: r["canal"]).items()
        ):
            canal_exatas = metricas_exatas(linhas_canal)
            canais.append(
                {
                    "canal": canal,
                    "pagamento": dinheiro(canal_exatas["pagamento"]),
                    "sessoes": numero(canal_exatas["sessoes"]),
                    "pct_pagamento": pct(
                        canal_exatas["pagamento"], exatas["pagamento"]
                    ),
                }
            )
        canais.sort(key=lambda x: (-(x["pagamento"] or 0), x["canal"]))
        item["canais"] = canais
        saida[kit["id"]] = item
    return saida


def referencias_disciplina(fatias):
    # Contrato v4: mediana e quartis do R$/sessão e da intensidade por
    # disciplina (e por canal dentro dela), sobre fatias com volume mínimo.
    # Células com menos de MIN_PRESTADORES_REFERENCIA prestadores não publicam.
    preco = {}
    intensidade = {}
    por_disciplina = defaultdict(list)
    for item in fatias:
        if (
            item["sessoes"] is not None
            and Decimal(str(item["sessoes"])) >= MIN_SESSOES_REFERENCIA
            and item["custo_sessao"] is not None
        ):
            por_disciplina[item["disciplina"]].append(item)
    def quartis(valores):
        decimais = sorted(Decimal(str(v)) for v in valores)
        return {
            "mediana": dinheiro(percentil_linear(decimais, Decimal("0.5"))),
            "p25": dinheiro(percentil_linear(decimais, Decimal("0.25"))),
            "p75": dinheiro(percentil_linear(decimais, Decimal("0.75"))),
            "n": len(decimais),
        }

    for disciplina, itens in sorted(por_disciplina.items()):
        precos = [x["custo_sessao"] for x in itens]
        if len(precos) >= MIN_PRESTADORES_REFERENCIA:
            preco[disciplina] = quartis(precos)
            preco[disciplina]["por_canal"] = {}
            por_canal = defaultdict(list)
            for x in itens:
                por_canal[x["canal"]].append(x["custo_sessao"])
            for canal, valores in sorted(por_canal.items()):
                if len(valores) >= MIN_PRESTADORES_REFERENCIA:
                    preco[disciplina]["por_canal"][canal] = quartis(valores)
        intensidades = [
            x["intensidade_mensal"]
            for x in itens
            if x["intensidade_mensal"] is not None
        ]
        if len(intensidades) >= MIN_PRESTADORES_REFERENCIA:
            intensidade[disciplina] = quartis(intensidades)
    return {"preco_disciplina": preco, "intensidade_disciplina": intensidade}


def distribuir_linhas_cuidado(registros, total_pacientes, periodo_id):
    terapias_por_paciente = defaultdict(set)
    codigos_por_paciente = defaultdict(set)
    for r in registros:
        terapias_por_paciente[r["paciente"]].add(r["terapia_id"])
        codigos_por_paciente[r["paciente"]].add(r["cod_proc"])

    dist_clinica = Counter(len(v) for v in terapias_por_paciente.values())
    dist_componentes = Counter(len(v) for v in codigos_por_paciente.values())
    combinacoes = Counter(
        tuple(sorted(v)) for v in terapias_por_paciente.values()
    )

    distribuicao_exata = [
        {
            "faixa": (
                "1 terapia" if quantidade == 1 else f"{quantidade} terapias"
            ),
            "quantidade_terapias": quantidade,
            "pacientes": pacientes,
            "pct": pct(pacientes, total_pacientes),
        }
        for quantidade, pacientes in sorted(dist_clinica.items())
    ]

    combinacoes_exatas = [
        {
            "rotulo": " + ".join(
                CATALOGO_TERAPIAS[x]["terapia"] for x in ids
            ),
            "terapias": [
                CATALOGO_TERAPIAS[x]["terapia"] for x in ids
            ],
            "pacientes": n,
            "pct": pct(n, total_pacientes),
            "quantidade_combinacoes": 1,
        }
        for ids, n in sorted(
            combinacoes.items(), key=lambda item: (-item[1], item[0])
        )
    ]

    exposicoes_clinicas = sum(
        quantidade * pacientes
        for quantidade, pacientes in dist_clinica.items()
    )
    exposicoes_componentes = sum(
        quantidade * pacientes
        for quantidade, pacientes in dist_componentes.items()
    )
    dois_mais_clinico = sum(
        n for quantidade, n in dist_clinica.items() if quantidade >= 2
    )
    dois_mais_componentes = sum(
        n for quantidade, n in dist_componentes.items() if quantidade >= 2
    )
    quatro_mais_clinico = sum(
        n for quantidade, n in dist_clinica.items() if quantidade >= 4
    )
    quatro_mais_componentes = sum(
        n for quantidade, n in dist_componentes.items() if quantidade >= 4
    )
    reconciliacao_componentes = None
    if periodo_id == "tudo":
        reconciliacao_componentes = {
            "natureza": (
                "Reconciliação técnica por códigos assistenciais; o código de "
                "assistente terapêutica integra ABA — Psicologia e não constitui "
                "uma terapia clínica adicional."
            ),
            "distribuicao": [
                {
                    "faixa": (
                        "1 componente"
                        if quantidade == 1
                        else f"{quantidade} componentes"
                    ),
                    "quantidade_componentes": quantidade,
                    "pacientes": pacientes,
                    "pct": pct(pacientes, total_pacientes),
                }
                for quantidade, pacientes in sorted(dist_componentes.items())
            ],
            "exposicoes": exposicoes_componentes,
            "dois_ou_mais_pct": pct(
                dois_mais_componentes, total_pacientes
            ),
            "quatro_ou_mais_pct": pct(
                quatro_mais_componentes, total_pacientes
            ),
        }

    completo = {
        "distribuicao": distribuicao_exata,
        "exposicoes": exposicoes_clinicas,
        "dois_ou_mais_pct": pct(dois_mais_clinico, total_pacientes),
        "quatro_ou_mais_pct": pct(quatro_mais_clinico, total_pacientes),
        "combinacoes": combinacoes_exatas,
        "pacientes_em_combinacoes_agrupadas": 0,
        "reconciliacao_componentes_codigo": reconciliacao_componentes,
    }
    auditoria = {
        "distribuicao_clinica": dict(sorted(dist_clinica.items())),
        "distribuicao_componentes": dict(sorted(dist_componentes.items())),
        "exposicoes_clinicas": exposicoes_clinicas,
        "exposicoes_componentes": exposicoes_componentes,
        "dois_mais_clinico": dois_mais_clinico,
        "dois_mais_componentes": dois_mais_componentes,
        "quatro_mais_clinico": quatro_mais_clinico,
        "quatro_mais_componentes": quatro_mais_componentes,
        "combinacoes_exatas": dict(combinacoes),
        "combinacoes_publicadas": {
            item["rotulo"]: item["pacientes"]
            for item in combinacoes_exatas
        },
    }
    return completo, auditoria


def agregar_canais(registros):
    por_canal = grupos(registros, lambda r: r["canal"])
    itens = []
    for canal, linhas in por_canal.items():
        item = {"canal": canal}
        item.update(publicar_metricas(metricas_exatas(linhas)))
        # Contrato v5: prestadores conta entidades publicadas (a Casa Unimed
        # vale 1); profissionais conta pessoas físicas/CNPJs de origem.
        item["prestadores"] = len({r["prest_entidade"] for r in linhas})
        item["profissionais"] = len({r["nome_prest"] for r in linhas})
        itens.append(item)
    itens.sort(
        key=lambda x: (
            x["pagamento"] is None,
            -(x["pagamento"] or 0),
            x["canal"],
        )
    )
    return itens


def agregar_solicitantes(registros):
    elegiveis = [r for r in registros if solicitante_valido(r)]
    por_solicitante = grupos(elegiveis, lambda r: r["nome_sol"])
    itens = []
    for nome, linhas in por_solicitante.items():
        exatas = metricas_exatas(linhas)
        item = {"nome": nome}
        item.update(publicar_metricas(exatas))
        item["cbos"] = Counter(r["cbos"] for r in linhas).most_common(1)[0][0]
        executores = []
        # Contrato v5: na visão do solicitante o encaminhamento é para a
        # entidade publicada — os profissionais da Casa consolidam nela.
        for prestador, par in grupos(linhas, lambda r: r["prest_entidade"]).items():
            par_exato = metricas_exatas(par)
            executante = {"nome": prestador}
            executante.update(publicar_metricas(par_exato))
            executante["pct_pagamento"] = pct(
                par_exato["pagamento"], exatas["pagamento"]
            )
            executores.append(executante)
        executores.sort(
            key=lambda x: (-(x["pagamento"] or 0), x["nome"])
        )
        principal = executores[0] if executores else None
        item["principal"] = principal["nome"] if principal else None
        item["principal_pct"] = principal["pct_pagamento"] if principal else None
        item["executores"] = executores
        itens.append(item)
    itens.sort(key=lambda x: (-(x["pagamento"] or 0), x["nome"]))
    return {"itens": itens}


def agregar_pacientes(registros, corte):
    por_paciente = grupos(registros, lambda r: r["paciente"])
    faixa_pacientes = defaultdict(set)
    genero_pacientes = defaultdict(set)
    intensidade = {}
    custo_paciente = {}
    for paciente, linhas in por_paciente.items():
        idade = idade_na_data(paciente[1], corte)
        faixa_pacientes[faixa_etaria(idade)].add(paciente)
        genero_pacientes[linhas[0]["genero"] or "NAO INFORMADO"].add(paciente)
        intensidade[paciente] = sum((r["qtd"] for r in linhas), Decimal(0))
        custo_paciente[paciente] = sum((r["valor"] for r in linhas), Decimal(0))

    def metricas_conjunto(pacientes):
        return publicar_metricas(
            metricas_exatas(
                [r for r in registros if r["paciente"] in pacientes]
            )
        )

    faixas = []
    for faixa in FAIXAS_ETARIAS:
        item = {"faixa": faixa}
        item.update(metricas_conjunto(faixa_pacientes.get(faixa, set())))
        faixas.append(item)

    genero = []
    for rotulo, pacientes in sorted(genero_pacientes.items()):
        item = {"genero": rotulo}
        item.update(metricas_conjunto(pacientes))
        genero.append(item)

    bucket_pacientes = defaultdict(set)
    for paciente, sessoes in intensidade.items():
        if sessoes < 3:
            bucket = "<3"
        elif sessoes < 5:
            bucket = "3–4"
        elif sessoes < 9:
            bucket = "5–8"
        else:
            bucket = "9+"
        bucket_pacientes[bucket].add(paciente)
    buckets = [
        {
            "faixa": bucket,
            "pacientes": len(bucket_pacientes.get(bucket, set())),
            "pct": pct(
                len(bucket_pacientes.get(bucket, set())), len(por_paciente)
            ),
        }
        for bucket in BUCKETS_INTENSIDADE
    ]

    valores_intensidade = list(intensidade.values())
    valores_custo = list(custo_paciente.values())
    if por_paciente:
        media_intensidade = dinheiro(statistics.mean(valores_intensidade))
        mediana_intensidade = dinheiro(statistics.median(valores_intensidade))
        media_custo = dinheiro(statistics.mean(valores_custo))
        mediana_custo = dinheiro(statistics.median(valores_custo))
    else:
        media_intensidade = mediana_intensidade = None
        media_custo = mediana_custo = None
    return {
        "faixa_etaria": faixas,
        "intensidade": {
            "definicao": "Soma de sessões por beneficiário no período selecionado.",
            "buckets": buckets,
            "media": media_intensidade,
            "mediana": mediana_intensidade,
        },
        "genero": genero,
        "custo_por_paciente": {
            "media": media_custo,
            "mediana": mediana_custo,
        },
    }


def agregar_recorte(registros, periodo, terapias_mantidas, corte):
    meses = set(periodo["meses"])
    linhas = [r for r in registros if r["anomes"] in meses]
    exatas = metricas_exatas(linhas)
    resumo = publicar_metricas(exatas)
    resumo["exposicoes"] = len(
        {(r["paciente"], r["terapia_id"]) for r in linhas}
    )
    resumo["componentes_codigo"] = len(
        {(r["paciente"], r["cod_proc"]) for r in linhas}
    )
    resumo["prestadores_observados"] = len(
        {r["nome_prest_fonte"] for r in linhas}
    )
    resumo["prestadores_consolidados"] = len(
        {r["nome_prest"] for r in linhas}
    )
    # Contrato v5: contadores da camada de entidades publicadas. Os dois
    # campos acima permanecem intactos — ancoram a auditoria (161/160).
    profissionais_casa = {
        r["nome_prest"] for r in linhas if r["prest_entidade"] == CASA_UNIMED
    }
    profissionais_fora = {
        r["nome_prest"] for r in linhas if r["prest_entidade"] != CASA_UNIMED
    }
    resumo["prestadores_publicados"] = len(
        {r["prest_entidade"] for r in linhas}
    )
    resumo["profissionais_casa_unimed"] = len(profissionais_casa)
    linhas_cuidado, auditoria_linhas = distribuir_linhas_cuidado(
        linhas, exatas["n_pacientes"], periodo["id"]
    )
    prestadores, serie_prestador = agregar_prestadores(
        linhas, periodo["meses"]
    )
    fatias_disciplina = agregar_prestador_disciplina(linhas)
    # Referências permanecem na granularidade profissional (nome_prest):
    # colapsar dezenas de profissionais da Casa em uma observação distorceria
    # mediana, quartis e o piso k>=5. As fatias abaixo não são publicadas.
    fatias_profissional = agregar_prestador_disciplina(
        linhas, chave_nome=lambda r: r["nome_prest"]
    )
    por_disciplina = grupos(linhas, disciplina_do)
    publico = {
        "resumo": resumo,
        "serie_mensal": serie_mensal(linhas, periodo["meses"]),
        "terapias": agregar_terapias(
            linhas, terapias_mantidas, exatas["pagamento"]
        ),
        "prestadores": prestadores,
        "serie_prestador": serie_prestador,
        "prestador_disciplina": fatias_disciplina,
        "disciplina_serie": agregar_disciplina_serie(linhas, periodo["meses"]),
        "disciplina_canais": agregar_disciplina_canais(linhas),
        "resumo_disciplina": agregar_resumo_disciplina(linhas),
        "pacientes_disciplina": {
            disciplina: agregar_pacientes(linhas_disc, corte)
            for disciplina, linhas_disc in sorted(por_disciplina.items())
        },
        "kits": agregar_kits(linhas),
        "referencias": referencias_disciplina(fatias_profissional),
        "linhas_cuidado": linhas_cuidado,
        "canais": agregar_canais(linhas),
        "solicitantes": agregar_solicitantes(linhas),
        "pacientes": agregar_pacientes(linhas, corte),
    }
    auditoria = {
        "metricas": exatas,
        "linhas_cuidado": auditoria_linhas,
        "prestadores_observados": resumo["prestadores_observados"],
        "prestadores_consolidados": resumo["prestadores_consolidados"],
        "prestadores_publicados": resumo["prestadores_publicados"],
        "profissionais_exclusivos_casa": len(
            profissionais_casa - profissionais_fora
        ),
    }
    return publico, auditoria


def construir_dados(
    registros_todos,
    registros_incluidos,
    manifesto,
    terapias_mantidas,
    terapias_descartadas,
    corte,
    blocos=None,
    competencias_novas=None,
):
    periodos = gerar_periodos()
    recortes = {}
    auditorias = {}
    for periodo in periodos:
        recorte, auditoria = agregar_recorte(
            registros_incluidos, periodo, terapias_mantidas, corte
        )
        recortes[periodo["id"]] = recorte
        auditorias[periodo["id"]] = auditoria

    catalogo_publico = [
        CATALOGO_TERAPIAS[terapia_id]
        for terapia_id in sorted(
            terapias_mantidas,
            key=lambda x: CATALOGO_TERAPIAS[x]["terapia"],
        )
    ]
    at_exato = metricas_exatas(
        [r for r in registros_incluidos if r["cod_proc"] == COD_AT]
    )
    at_publico = publicar_metricas(at_exato)
    contagens = dict(recortes["tudo"]["resumo"])
    contagens.update(
        {
            "terapias": len(terapias_mantidas),
            "fontes": len(manifesto),
        }
    )
    dados = {
        "meta": {
            "painel": "Painel Terapias Especiais — Unimed Governador Valadares",
            "versao_script": VERSAO,
            "gerado_em": date.today().isoformat(),
            "data_corte_idade": corte.isoformat(),
            "classificacao": "agregados completos de uso interno",
            "identificadores_beneficiario": "não incluídos",
            "periodo_canonico": {
                "inicio": INICIO_CANONICO,
                "fim": FIM_CANONICO,
                "competencias": len(MESES_CANONICOS),
            },
            "periodo_base": {
                "inicio": INICIO_CANONICO,
                "fim": FIM_BASE,
                "competencias": len(MESES_BASE),
            },
            "periodos": periodos,
            "terapias": catalogo_publico,
            "terapias_descartadas": terapias_descartadas,
            "contagens": contagens,
            "manifesto_fontes": [dict(fonte) for fonte in manifesto],
            "blocos_fonte": [dict(bloco) for bloco in (blocos or [])],
            "competencias_novas": [
                dict(item) for item in (competencias_novas or [])
            ],
            "excecao_at": {
                "codigo": COD_AT,
                "prestador": PEDIAKIDS,
                "terapia_destino": "Terapia ABA — Psicologia",
                "origem_preservada": True,
                **at_publico,
            },
            "casa_unimed": {
                "entidade": CASA_UNIMED,
                "criterio": f"registro com Tipo Prestador = {TIPO_CASA_UNIMED}",
                "consolidacao": (
                    "por registro; o mesmo profissional pode figurar como "
                    "prestador individual nos demais canais"
                ),
                "profissionais": contagens["profissionais_casa_unimed"],
            },
            "kits_catalogo": {
                "regra": (
                    "classificação por criança pelo conjunto de disciplinas "
                    "utilizadas no recorte; kit ausente de um recorte foi "
                    f"suprimido pelo k-anonimato (menos de {K_MINIMO_KIT} "
                    "crianças), nunca é zero"
                ),
                "k_minimo": K_MINIMO_KIT,
                "kits": [dict(kit) for kit in KITS],
            },
            "referencias_granularidade": "profissional (nome_prest)",
            "matriz_2025": None,
        },
        "recortes": recortes,
    }
    auditoria = {
        "recortes": auditorias,
        "registros_todos": registros_todos,
        "registros_incluidos": registros_incluidos,
    }
    return dados, auditoria


# ---------------- reconciliação com a Matriz Analítica 2025 ----------------


def percentil_linear(valores, proporcao):
    ordenados = sorted(valores)
    if not ordenados:
        return None
    posicao = (len(ordenados) - 1) * Decimal(str(proporcao))
    inferior = int(math.floor(posicao))
    superior = int(math.ceil(posicao))
    if inferior == superior:
        return ordenados[inferior]
    fracao = posicao - inferior
    return ordenados[inferior] + (
        ordenados[superior] - ordenados[inferior]
    ) * fracao


def estatisticas_intensidade(registros):
    sessoes_paciente = defaultdict(Decimal)
    for r in registros:
        sessoes_paciente[r["paciente"]] += r["qtd"]
    valores = list(sessoes_paciente.values())
    if not valores:
        return {
            "beneficiarios": 0,
            "media": None,
            "mediana": None,
            "p25": None,
            "p75": None,
            "minimo": None,
            "maximo": None,
            "desvio_padrao": None,
        }
    media = statistics.mean(valores)
    return {
        "beneficiarios": len(valores),
        "media": media,
        "mediana": statistics.median(valores),
        "p25": percentil_linear(valores, Decimal("0.25")),
        "p75": percentil_linear(valores, Decimal("0.75")),
        "minimo": min(valores),
        "maximo": max(valores),
        # A Matriz 2025 registra dispersão zero quando há uma única criança no
        # estrato. Mantemos essa convenção para que a conferência seja literal;
        # estratos vazios continuam representados por nulo no retorno acima.
        "desvio_padrao": statistics.stdev(valores) if len(valores) > 1 else Decimal("0"),
    }


def rede_matriz(registro):
    return (
        "Rede própria"
        if registro["tipo_prest"] == "ATENDIMENTO ESPECIALIZADO"
        else "Rede externa"
    )


def agregados_matriz_esperados(registros):
    ano = [r for r in registros if r["anomes"].startswith("2025/")]
    por_terapia = grupos(ano, lambda r: r["terapia_id"])
    resumo = {}
    mensal = {}
    rede = {}

    for terapia_id, linhas in por_terapia.items():
        propria = [r for r in linhas if rede_matriz(r) == "Rede própria"]
        externa = [r for r in linhas if rede_matriz(r) == "Rede externa"]
        total = metricas_exatas(linhas)
        ep = metricas_exatas(propria)
        ee = metricas_exatas(externa)
        ip = estatisticas_intensidade(propria)
        ie = estatisticas_intensidade(externa)
        resumo[terapia_id] = {
            "Registros": total["registros"],
            "Beneficiários*": total["n_pacientes"],
            "Sessões": total["sessoes"],
            "Pagamento": total["pagamento"],
            "Ben. própria": ep["n_pacientes"],
            "Sessões própria": ep["sessoes"],
            "Média própria": ip["media"],
            "Mediana própria": ip["mediana"],
            "Ben. externa": ee["n_pacientes"],
            "Sessões externa": ee["sessoes"],
            "Média externa": ie["media"],
            "Mediana externa": ie["mediana"],
            "Custo/sessão própria": (
                ep["pagamento"] / ep["sessoes_pagas"]
                if ep["sessoes_pagas"] else None
            ),
            "Custo/sessão externa": (
                ee["pagamento"] / ee["sessoes_pagas"]
                if ee["sessoes_pagas"] else None
            ),
        }

        pacientes_propria = {r["paciente"] for r in propria}
        pacientes_externa = {r["paciente"] for r in externa}
        sobreposicao = len(pacientes_propria & pacientes_externa)
        for nome_rede, linhas_rede in grupos(linhas, rede_matriz).items():
            em = metricas_exatas(linhas_rede)
            intensidade = estatisticas_intensidade(linhas_rede)
            rede[(terapia_id, nome_rede)] = {
                "Beneficiários": em["n_pacientes"],
                "Sessões": em["sessoes"],
                "Pagamento": em["pagamento"],
                "Média": intensidade["media"],
                "Mediana": intensidade["mediana"],
                "P25": intensidade["p25"],
                "P75": intensidade["p75"],
                "Mínimo": intensidade["minimo"],
                "Máximo": intensidade["maximo"],
                "Desvio-padrão": intensidade["desvio_padrao"],
                "Custo/sessão": (
                    em["pagamento"] / em["sessoes_pagas"]
                    if em["sessoes_pagas"] else None
                ),
                "Custo/beneficiário": (
                    em["pagamento"] / em["n_pacientes"]
                    if em["n_pacientes"] else None
                ),
                "Sobreposição": sobreposicao,
            }

    for (terapia_id, mes), linhas in grupos(
        ano, lambda r: (r["terapia_id"], r["anomes"])
    ).items():
        propria = [r for r in linhas if rede_matriz(r) == "Rede própria"]
        externa = [r for r in linhas if rede_matriz(r) == "Rede externa"]
        total = metricas_exatas(linhas)
        ep = metricas_exatas(propria)
        ee = metricas_exatas(externa)
        mensal[(terapia_id, mes)] = {
            "Registros": total["registros"],
            "Beneficiários": total["n_pacientes"],
            "Sessões": total["sessoes"],
            "Pagamento": total["pagamento"],
            "Ben. própria": ep["n_pacientes"],
            "Sessões própria": ep["sessoes"],
            "Ben. externa": ee["n_pacientes"],
            "Sessões externa": ee["sessoes"],
        }
    return {
        "Resumo_Executivo": resumo,
        "Mensal": mensal,
        "Rede_por_Terapia": rede,
    }


def localizar_cabecalho_matriz(ws, primeira_coluna):
    for numero_linha, row in enumerate(
        ws.iter_rows(min_row=1, max_row=30, values_only=True), start=1
    ):
        valores = [texto_celula(v) for v in row]
        if valores and valores[0] == primeira_coluna:
            return numero_linha, valores
    raise ErroPipeline(
        f"Matriz, aba {ws.title}: cabeçalho {primeira_coluna!r} não encontrado"
    )


def indice_cabecalho(cabecalho, nome, aba):
    try:
        return cabecalho.index(nome)
    except ValueError as exc:
        raise ErroPipeline(
            f"Matriz, aba {aba}: coluna obrigatória ausente: {nome}"
        ) from exc


def id_terapia_por_codigo_matriz(valor):
    codigos = re.findall(r"\d{8}", texto_celula(valor))
    ids = {MAPA_CODIGOS[c]["id"] for c in codigos if c in MAPA_CODIGOS}
    if not ids:
        return None
    if len(ids) != 1:
        raise ErroPipeline(
            f"Matriz: códigos da mesma linha apontam para terapias distintas: {codigos}"
        )
    return next(iter(ids))


def mapa_nomes_matriz():
    mapa = {
        chave_rotulo(item["terapia"]): terapia_id
        for terapia_id, item in CATALOGO_TERAPIAS.items()
    }
    mapa[chave_rotulo("Terapias especiais cobertas conforme parecer ANS")] = (
        "ans-centros-referencia"
    )
    return mapa


MAPA_NOMES_MATRIZ = mapa_nomes_matriz()


def id_terapia_por_nome_matriz(valor):
    return MAPA_NOMES_MATRIZ.get(chave_rotulo(valor))


def decimal_matriz(valor):
    if valor is None or texto_celula(valor) == "":
        return None
    return decimal_celula(valor, "valor da Matriz")


def valores_equivalentes(observado, esperado, campo):
    if observado is None or esperado is None:
        return observado is None and esperado is None
    od = Decimal(str(observado))
    ed = Decimal(str(esperado))
    if campo in {
        "Registros", "Beneficiários*", "Beneficiários", "Sessões",
        "Ben. própria", "Sessões própria", "Ben. externa",
        "Sessões externa", "Sobreposição",
    }:
        return od == ed
    if "Pagamento" in campo or "Custo/" in campo:
        # Conferência monetária ±0 no centavo publicado. A quantização absorve
        # apenas a representação binária do Excel, nunca diferença de 1 centavo.
        centavo = Decimal("0.01")
        return (
            od.quantize(centavo, rounding=ROUND_HALF_UP)
            == ed.quantize(centavo, rounding=ROUND_HALF_UP)
        )
    return abs(od - ed) <= Decimal("0.000001")


def comparar_celula(controle, aba, chave, campo, observado, esperado):
    controle["campos_comparados"] += 1
    if not valores_equivalentes(observado, esperado, campo):
        controle["divergencias"].append(
            f"{aba} {chave} {campo}: Matriz={observado!r}, pipeline={esperado!r}"
        )


def reconciliar_matriz(caminho, registros):
    matriz = exigir_fora_de_git(caminho, "Matriz Analítica 2025")
    if not matriz.is_file() or matriz.suffix.lower() != ".xlsx":
        raise ErroPipeline("Matriz Analítica deve ser um arquivo xlsx")
    esperados = agregados_matriz_esperados(registros)
    controle = {"campos_comparados": 0, "divergencias": []}
    wb = abrir_planilha(matriz)
    try:
        obrigatorias = {"Resumo_Executivo", "Mensal", "Rede_por_Terapia"}
        faltantes = obrigatorias - set(wb.sheetnames)
        if faltantes:
            raise ErroPipeline(
                f"Matriz sem abas obrigatórias: {sorted(faltantes)}"
            )

        # Resumo_Executivo: 14 campos por terapia.
        ws = wb["Resumo_Executivo"]
        linha, cab = localizar_cabecalho_matriz(ws, "Terapia")
        campos_resumo = [
            "Registros", "Beneficiários*", "Sessões", "Pagamento",
            "Ben. própria", "Sessões própria", "Média própria",
            "Mediana própria", "Ben. externa", "Sessões externa",
            "Média externa", "Mediana externa", "Custo/sessão própria",
            "Custo/sessão externa",
        ]
        indices = {
            campo: indice_cabecalho(cab, campo, ws.title)
            for campo in campos_resumo
        }
        idx_codigo = indice_cabecalho(cab, "Código", ws.title)
        vistos = set()
        for row in ws.iter_rows(min_row=linha + 1, values_only=True):
            terapia_id = id_terapia_por_codigo_matriz(
                row[idx_codigo] if idx_codigo < len(row) else None
            )
            if not terapia_id:
                continue
            if terapia_id in vistos:
                raise ErroPipeline(
                    f"Matriz, Resumo_Executivo: terapia duplicada {terapia_id}"
                )
            vistos.add(terapia_id)
            esperado = esperados["Resumo_Executivo"].get(terapia_id)
            if esperado is None:
                raise ErroPipeline(
                    f"Matriz contém terapia sem agregado 2025: {terapia_id}"
                )
            for campo, idx in indices.items():
                observado = decimal_matriz(row[idx] if idx < len(row) else None)
                comparar_celula(
                    controle, ws.title, terapia_id, campo,
                    observado, esperado[campo],
                )
        if vistos != set(esperados["Resumo_Executivo"]):
            raise ErroPipeline(
                "Matriz, Resumo_Executivo: conjunto de terapias divergente"
            )

        # Mensal: oito campos por terapia e competência.
        ws = wb["Mensal"]
        linha, cab = localizar_cabecalho_matriz(ws, "Terapia")
        campos_mensal = [
            "Registros", "Beneficiários", "Sessões", "Pagamento",
            "Ben. própria", "Sessões própria", "Ben. externa",
            "Sessões externa",
        ]
        indices = {
            campo: indice_cabecalho(cab, campo, ws.title)
            for campo in campos_mensal
        }
        idx_terapia = indice_cabecalho(cab, "Terapia", ws.title)
        idx_mes = indice_cabecalho(cab, "Competência", ws.title)
        vistos = set()
        for row in ws.iter_rows(min_row=linha + 1, values_only=True):
            terapia_id = id_terapia_por_nome_matriz(
                row[idx_terapia] if idx_terapia < len(row) else None
            )
            if not terapia_id:
                continue
            mes = texto_celula(row[idx_mes] if idx_mes < len(row) else None)
            if not mes.startswith("2025/"):
                continue
            chave = (terapia_id, mes)
            if chave in vistos:
                raise ErroPipeline(f"Matriz, Mensal: linha duplicada {chave}")
            vistos.add(chave)
            esperado = esperados["Mensal"].get(chave)
            if esperado is None:
                raise ErroPipeline(
                    f"Matriz, Mensal: célula sem correspondente no pipeline: {chave}"
                )
            for campo, idx in indices.items():
                observado = decimal_matriz(row[idx] if idx < len(row) else None)
                comparar_celula(
                    controle, ws.title, chave, campo,
                    observado, esperado[campo],
                )
        if vistos != set(esperados["Mensal"]):
            raise ErroPipeline("Matriz, Mensal: conjunto de linhas divergente")

        # Rede_por_Terapia: 13 campos por linha da referência. Esta leitura
        # existe apenas para reconciliação; o JSON do produto mantém rede única.
        ws = wb["Rede_por_Terapia"]
        linha, cab = localizar_cabecalho_matriz(ws, "Terapia")
        campos_rede = [
            "Beneficiários", "Sessões", "Pagamento", "Média", "Mediana",
            "P25", "P75", "Mínimo", "Máximo", "Desvio-padrão",
            "Custo/sessão", "Custo/beneficiário", "Sobreposição",
        ]
        indices = {
            campo: indice_cabecalho(cab, campo, ws.title)
            for campo in campos_rede
        }
        idx_terapia = indice_cabecalho(cab, "Terapia", ws.title)
        idx_rede = indice_cabecalho(cab, "Rede", ws.title)
        vistos = set()
        for row in ws.iter_rows(min_row=linha + 1, values_only=True):
            terapia_id = id_terapia_por_nome_matriz(
                row[idx_terapia] if idx_terapia < len(row) else None
            )
            if not terapia_id:
                continue
            nome_rede = texto_celula(row[idx_rede] if idx_rede < len(row) else None)
            chave = (terapia_id, nome_rede)
            if chave in vistos:
                raise ErroPipeline(
                    f"Matriz, Rede_por_Terapia: linha duplicada {chave}"
                )
            vistos.add(chave)
            esperado = esperados["Rede_por_Terapia"].get(chave)
            if esperado is None:
                raise ErroPipeline(
                    f"Matriz, Rede_por_Terapia: linha sem correspondente: {chave}"
                )
            for campo, idx in indices.items():
                observado = decimal_matriz(row[idx] if idx < len(row) else None)
                comparar_celula(
                    controle, ws.title, chave, campo,
                    observado, esperado[campo],
                )
        if vistos != set(esperados["Rede_por_Terapia"]):
            raise ErroPipeline(
                "Matriz, Rede_por_Terapia: conjunto de linhas divergente"
            )
    except ERROS_DE_PACOTE as exc:
        raise planilha_ilegivel(matriz) from exc
    finally:
        wb.close()

    if controle["divergencias"]:
        amostra = "\n  - ".join(controle["divergencias"][:12])
        raise ErroPipeline(
            f"Matriz 2025 divergiu em {len(controle['divergencias'])} campos:\n"
            f"  - {amostra}"
        )
    return {
        "arquivo": matriz.name,
        "sha256": sha256_arquivo(matriz),
        "abas": [
            "Resumo_Executivo", "Mensal", "Rede_por_Terapia"
        ],
        "campos_comparados": controle["campos_comparados"],
        "status": "reconciliada",
        "escopo": (
            "2025, 18 terapias de origem; Método PECS — Fonoaudiologia "
            "validada na Matriz e descartada do painel por cobertura incompleta"
        ),
    }


# ---------------- validações bloqueantes ----------------


def primeiro_padrao_encontrado(texto, valores):
    """Busca linear Aho-Corasick sem devolver o dado sensível encontrado."""
    # A saída usa dNome em vários rótulos. Normalizar os dois lados impede que
    # a retirada de acentos transforme um identificador em falso negativo.
    unicos = {d_nome(v) for v in valores if len(v.strip()) >= 6}
    if not unicos:
        return False
    proximos = [{}]
    falhas = [0]
    finais = [False]
    for valor in unicos:
        estado = 0
        for caractere in valor:
            if caractere not in proximos[estado]:
                proximos[estado][caractere] = len(proximos)
                proximos.append({})
                falhas.append(0)
                finais.append(False)
            estado = proximos[estado][caractere]
        finais[estado] = True
    fila = deque()
    for estado in proximos[0].values():
        fila.append(estado)
    while fila:
        atual = fila.popleft()
        for caractere, destino in proximos[atual].items():
            fila.append(destino)
            retorno = falhas[atual]
            while retorno and caractere not in proximos[retorno]:
                retorno = falhas[retorno]
            falhas[destino] = proximos[retorno].get(caractere, 0)
            finais[destino] = finais[destino] or finais[falhas[destino]]
    estado = 0
    for caractere in d_nome(texto):
        while estado and caractere not in proximos[estado]:
            estado = falhas[estado]
        estado = proximos[estado].get(caractere, 0)
        if finais[estado]:
            return True
    return False


def validar_anti_vazamento(texto, registros):
    campos = {
        "nome de beneficiário": {r["nome"] for r in registros},
        "matrícula": {r["matricula"] for r in registros},
        "nascimento": {r["nasc"] for r in registros},
        "guia": {r["guia"] for r in registros},
    }
    for rotulo, valores in campos.items():
        if primeiro_padrao_encontrado(texto, valores):
            raise ErroPipeline(
                f"anti-vazamento bloqueou presença de {rotulo} no artefato"
            )


def validar_estrutura_sem_identificadores(dados):
    proibidas = {
        "nome_beneficiario", "nome_beneficiário", "matricula", "matrícula",
        "nascimento", "data_nascimento", "guia", "numero_guia",
        "número_guia", "paciente", "chave_paciente",
    }

    def percorrer(no, caminho="dados"):
        if isinstance(no, dict):
            for chave, valor in no.items():
                if chave.casefold() in proibidas:
                    raise ErroPipeline(
                        f"campo identificador proibido no artefato: {caminho}.{chave}"
                    )
                percorrer(valor, f"{caminho}.{chave}")
        elif isinstance(no, list):
            for indice, valor in enumerate(no):
                percorrer(valor, f"{caminho}[{indice}]")

    percorrer(dados)


def validar_saida(dados, auditoria, reconciliacao, exigir_referencias):
    erros = []
    meta = dados["meta"]
    if len(meta["terapias"]) != 17:
        erros.append("JSON não contém exatamente 17 terapias")
    if len(meta["manifesto_fontes"]) != 19:
        erros.append("manifesto não contém exatamente 19 fontes")
    periodos_esperados = [p["id"] for p in gerar_periodos()]
    if (
        [p["id"] for p in meta["periodos"]] != periodos_esperados
        or set(dados["recortes"]) != set(periodos_esperados)
    ):
        erros.append(
            "contrato de períodos diverge da janela publicada "
            f"({len(periodos_esperados)} recortes esperados)"
        )
    if (
        meta["periodo_canonico"]["fim"] != FIM_CANONICO
        or meta["periodo_canonico"]["competencias"] != len(MESES_CANONICOS)
        or meta["periodo_base"]["competencias"] != len(MESES_BASE)
    ):
        erros.append("período declarado diverge da janela publicada")
    blocos = meta.get("blocos_fonte")
    if not isinstance(blocos, list) or bool(blocos) != janela_estendida():
        erros.append("blocos complementares incoerentes com a janela publicada")
    else:
        cobertas = {
            mes for bloco in blocos for mes in bloco["competencias_na_janela"]
        }
        if cobertas != set(MESES_CANONICOS) - MESES_BASE_SET:
            erros.append(
                "blocos complementares não cobrem exatamente as competências "
                "posteriores ao período-base"
            )
    for ponto in dados["recortes"].get("tudo", {}).get("serie_mensal", []):
        if not ponto["registros"]:
            erros.append(f"competência {ponto['m']} publicada sem registros")
    if [item["m"] for item in meta.get("competencias_novas", [])] != [
        m for m in MESES_CANONICOS if m not in MESES_BASE_SET
    ]:
        erros.append(
            "competências novas declaradas divergem da janela publicada"
        )
    descartadas = meta["terapias_descartadas"]
    if len(descartadas) != 1 or descartadas[0]["id"] != ID_PECS:
        erros.append("descarte programático de PECS não está único")

    # Contrato v4: a soma das fatias prestador×disciplina reproduz o total do
    # prestador, e a soma das séries por disciplina reproduz a série mensal.
    for periodo_id, recorte in dados["recortes"].items():
        fatias = recorte.get("prestador_disciplina")
        if not isinstance(fatias, list):
            erros.append(f"{periodo_id}: prestador_disciplina ausente")
            continue
        soma_prest = defaultdict(lambda: [Decimal(0), Decimal(0)])
        for fatia in fatias:
            soma_prest[fatia["nome"]][0] += Decimal(str(fatia["pagamento"]))
            soma_prest[fatia["nome"]][1] += Decimal(str(fatia["sessoes"]))
        for prestador in recorte["prestadores"]:
            pago, sess = soma_prest.get(prestador["nome"], [Decimal(0), Decimal(0)])
            if abs(pago - Decimal(str(prestador["pagamento"]))) > Decimal("0.02"):
                erros.append(
                    f"{periodo_id}: fatias de {prestador['nome']} não somam o "
                    f"pagamento total ({pago} != {prestador['pagamento']})"
                )
            if sess != Decimal(str(prestador["sessoes"])):
                erros.append(
                    f"{periodo_id}: fatias de {prestador['nome']} não somam as sessões"
                )
        series_disc = recorte.get("disciplina_serie")
        if not isinstance(series_disc, dict) or not series_disc:
            erros.append(f"{periodo_id}: disciplina_serie ausente")
        else:
            for indice, ponto in enumerate(recorte["serie_mensal"]):
                soma_pag = sum(
                    (Decimal(str(serie[indice]["pagamento"] or 0)) for serie in series_disc.values()),
                    Decimal(0),
                )
                if abs(soma_pag - Decimal(str(ponto["pagamento"] or 0))) > Decimal("0.02"):
                    erros.append(
                        f"{periodo_id}: disciplina_serie não soma a série mensal em {ponto['m']}"
                    )
                    break
        if not isinstance(recorte.get("referencias"), dict):
            erros.append(f"{periodo_id}: referencias por disciplina ausentes")

        # Contrato v5: consolidação da Casa Unimed coerente com a composição.
        resumo = recorte["resumo"]
        casa = next(
            (x for x in recorte["prestadores"] if x["nome"] == CASA_UNIMED),
            None,
        )
        if casa is not None:
            composicao = casa.get("composicao") or []
            soma_pag = sum(
                (Decimal(str(p["pagamento"])) for p in composicao), Decimal(0)
            )
            soma_sess = sum(
                (Decimal(str(p["sessoes"])) for p in composicao), Decimal(0)
            )
            if abs(soma_pag - Decimal(str(casa["pagamento"]))) > Decimal("0.02"):
                erros.append(
                    f"{periodo_id}: composição da Casa Unimed não soma o "
                    f"pagamento da entidade ({soma_pag} != {casa['pagamento']})"
                )
            if soma_sess != Decimal(str(casa["sessoes"])):
                erros.append(
                    f"{periodo_id}: composição da Casa Unimed não soma as sessões"
                )
            if casa["canais"] != [CANAL_CASA_UNIMED]:
                erros.append(
                    f"{periodo_id}: entidade Casa Unimed com canal fora de "
                    f"{CANAL_CASA_UNIMED}"
                )
            if len(composicao) != casa["quantidade_entidades"]:
                erros.append(
                    f"{periodo_id}: quantidade_entidades diverge da composição"
                )
            if len(composicao) != resumo["profissionais_casa_unimed"]:
                erros.append(
                    f"{periodo_id}: profissionais_casa_unimed diverge da composição"
                )
            serie_casa = recorte["serie_prestador"].get(CASA_UNIMED)
            soma_serie = sum(
                (Decimal(str(p["pagamento"] or 0)) for p in serie_casa or []),
                Decimal(0),
            )
            if serie_casa is None or abs(
                soma_serie - Decimal(str(casa["pagamento"]))
            ) > Decimal("0.02"):
                erros.append(
                    f"{periodo_id}: serie_prestador da Casa Unimed não soma o pagamento"
                )
        elif resumo["profissionais_casa_unimed"]:
            erros.append(
                f"{periodo_id}: profissionais da Casa contados sem entidade publicada"
            )
        for item in recorte["prestadores"]:
            if item["nome"] != CASA_UNIMED and CANAL_CASA_UNIMED in item["canais"]:
                erros.append(
                    f"{periodo_id}: registro do canal Casa Unimed escapou da "
                    f"consolidação em {item['nome']}"
                )
        audit_recorte = auditoria["recortes"][periodo_id]
        esperado_publicados = (
            resumo["prestadores_consolidados"]
            - audit_recorte["profissionais_exclusivos_casa"]
            + (1 if casa is not None else 0)
        )
        if resumo["prestadores_publicados"] != esperado_publicados:
            erros.append(
                f"{periodo_id}: prestadores_publicados fora do invariante "
                "consolidados - exclusivos da Casa + 1"
            )
        if resumo["prestadores_publicados"] != len(recorte["prestadores"]):
            erros.append(
                f"{periodo_id}: prestadores_publicados diverge do ranking"
            )

        # Contrato v5: cross-foot de disciplina_canais e resumo_disciplina.
        disc_canais = recorte.get("disciplina_canais")
        resumo_disc = recorte.get("resumo_disciplina")
        if not isinstance(series_disc, dict):
            series_disc = {}
        if not isinstance(disc_canais, dict) or not isinstance(resumo_disc, dict):
            erros.append(
                f"{periodo_id}: disciplina_canais/resumo_disciplina ausentes"
            )
        else:
            if not (set(disc_canais) == set(resumo_disc) == set(series_disc)):
                erros.append(
                    f"{periodo_id}: conjuntos de disciplinas divergentes entre "
                    "disciplina_canais, resumo_disciplina e disciplina_serie"
                )
            soma_fatias = defaultdict(lambda: [Decimal(0), Decimal(0)])
            for fatia in fatias:
                soma_fatias[fatia["disciplina"]][0] += Decimal(str(fatia["pagamento"]))
                soma_fatias[fatia["disciplina"]][1] += Decimal(str(fatia["sessoes"]))
            soma_canal = defaultdict(lambda: [Decimal(0), Decimal(0)])
            for disciplina, itens_canal in disc_canais.items():
                pago = sum(
                    (Decimal(str(x["pagamento"] or 0)) for x in itens_canal),
                    Decimal(0),
                )
                sess = sum(
                    (Decimal(str(x["sessoes"] or 0)) for x in itens_canal),
                    Decimal(0),
                )
                pago_fatias, sess_fatias = soma_fatias.get(
                    disciplina, [Decimal(0), Decimal(0)]
                )
                if abs(pago - pago_fatias) > Decimal("0.02") or sess != sess_fatias:
                    erros.append(
                        f"{periodo_id}: disciplina_canais de {disciplina} não "
                        "soma as fatias prestador x disciplina"
                    )
                for x in itens_canal:
                    soma_canal[x["canal"]][0] += Decimal(str(x["pagamento"] or 0))
                    soma_canal[x["canal"]][1] += Decimal(str(x["sessoes"] or 0))
            for item in recorte["canais"]:
                pago, sess = soma_canal.get(
                    item["canal"], [Decimal(0), Decimal(0)]
                )
                if abs(pago - Decimal(str(item["pagamento"] or 0))) > Decimal(
                    "0.02"
                ) or sess != Decimal(str(item["sessoes"] or 0)):
                    erros.append(
                        f"{periodo_id}: disciplina_canais não cruza com o "
                        f"canal {item['canal']}"
                    )
            for disciplina, item in resumo_disc.items():
                serie = series_disc.get(disciplina) or []
                pago = sum(
                    (Decimal(str(p["pagamento"] or 0)) for p in serie),
                    Decimal(0),
                )
                sess = sum(
                    (Decimal(str(p["sessoes"] or 0)) for p in serie), Decimal(0)
                )
                if abs(pago - Decimal(str(item["pagamento"] or 0))) > Decimal(
                    "0.02"
                ) or sess != Decimal(str(item["sessoes"] or 0)):
                    erros.append(
                        f"{periodo_id}: resumo_disciplina de {disciplina} não "
                        "soma a série da disciplina"
                    )
        pacientes_disc = recorte.get("pacientes_disciplina")
        if not isinstance(pacientes_disc, dict) or (
            isinstance(resumo_disc, dict) and set(pacientes_disc) != set(resumo_disc)
        ):
            erros.append(f"{periodo_id}: pacientes_disciplina incompleto")

        # Contrato v5: kits publicados somente com k>=5 e somas coerentes.
        kits = recorte.get("kits")
        if not isinstance(kits, dict):
            erros.append(f"{periodo_id}: kits ausentes")
        else:
            ids_catalogo = {k["id"] for k in KITS}
            total_criancas = 0
            for kit_id, item in kits.items():
                if kit_id not in ids_catalogo or item["id"] != kit_id:
                    erros.append(f"{periodo_id}: kit fora do catálogo: {kit_id}")
                    continue
                if item["criancas"] < K_MINIMO_KIT:
                    erros.append(
                        f"{periodo_id}: kit {kit_id} publicado com menos de "
                        f"{K_MINIMO_KIT} crianças"
                    )
                if item["criancas"] != item["pacientes"]:
                    erros.append(
                        f"{periodo_id}: kit {kit_id} com criancas != pacientes"
                    )
                total_criancas += item["criancas"]
                pago = sum(
                    (Decimal(str(x["pagamento"] or 0)) for x in item["canais"]),
                    Decimal(0),
                )
                sess = sum(
                    (Decimal(str(x["sessoes"] or 0)) for x in item["canais"]),
                    Decimal(0),
                )
                if abs(pago - Decimal(str(item["pagamento"] or 0))) > Decimal(
                    "0.02"
                ) or sess != Decimal(str(item["sessoes"] or 0)):
                    erros.append(
                        f"{periodo_id}: canais do kit {kit_id} não somam o total"
                    )
                recomputado = razao(
                    Decimal(str(item["pagamento"] or 0)), item["crianca_meses"]
                )
                if recomputado is None or abs(
                    Decimal(str(recomputado))
                    - Decimal(str(item["custo_crianca_mes"]))
                ) > Decimal("0.01"):
                    erros.append(
                        f"{periodo_id}: custo_crianca_mes do kit {kit_id} não "
                        "reproduz pagamento/criança-mês"
                    )
            if total_criancas > resumo["pacientes"]:
                erros.append(
                    f"{periodo_id}: kits somam mais crianças que o recorte"
                )
    if reconciliacao.get("status") != "reconciliada":
        erros.append("Matriz 2025 não reconciliada")
    if "projecao" in json.dumps(dados, ensure_ascii=False).lower():
        erros.append("projeções não podem compor o produto")
    for recorte in dados["recortes"].values():
        for item in recorte["prestadores"]:
            if d_nome(item["nome"]) != item["nome"]:
                erros.append("rótulo de prestador fora da regra dNome")
                break
        for item in recorte["solicitantes"]["itens"]:
            if d_nome(item["nome"]) != item["nome"]:
                erros.append("rótulo de solicitante fora da regra dNome")
                break

    global_audit = auditoria["recortes"]["tudo"]
    metricas = global_audit["metricas"]
    linhas = global_audit["linhas_cuidado"]
    if exigir_referencias:
        referencias = [
            (
                metricas["n_pacientes"] == 1416,
                f"crianças únicas: {metricas['n_pacientes']} != 1416",
            ),
            (
                global_audit["prestadores_observados"] == 161,
                "prestadores observados devem ser 161",
            ),
            (
                global_audit["prestadores_consolidados"] == 160,
                "prestadores consolidados devem ser 160",
            ),
            # Contrato v5, fixado no primeiro build real após conferência
            # manual: 148 = 160 consolidados - 13 exclusivos da Casa + 1.
            (
                global_audit["prestadores_publicados"] == 148,
                "entidades publicadas devem ser 148",
            ),
            (
                dados["recortes"]["tudo"]["resumo"]["profissionais_casa_unimed"]
                == 14,
                "a Casa Unimed deve consolidar 14 profissionais",
            ),
            (
                metricas["sessoes"] == Decimal("81217"),
                f"sessões: {metricas['sessoes']} != 81217",
            ),
            (
                metricas["pagamento"].quantize(CENTAVO) == Decimal("13919882.74"),
                "pagamento total diverge de R$ 13.919.882,74",
            ),
            (
                linhas["distribuicao_clinica"]
                == {1: 730, 2: 330, 3: 248, 4: 71, 5: 22, 6: 13, 7: 2},
                "distribuição clínica de linhas de cuidado diverge",
            ),
            (
                linhas["exposicoes_clinicas"] == 2620,
                "exposições clínicas devem ser 2.620",
            ),
            (
                linhas["distribuicao_componentes"]
                == {1: 716, 2: 332, 3: 246, 4: 81, 5: 26, 6: 13, 7: 2},
                "reconciliação técnica por códigos diverge",
            ),
            (
                linhas["exposicoes_componentes"] == 2664,
                "exposições técnicas devem ser 2.664",
            ),
            (
                reconciliacao.get("campos_comparados") == 2247,
                "Matriz deve reconciliar exatamente 2.247 campos",
            ),
        ]
        erros.extend(mensagem for ok, mensagem in referencias if not ok)
    if erros:
        raise ErroPipeline("validações reprovadas:\n  - " + "\n  - ".join(erros))

    validar_estrutura_sem_identificadores(dados)
    texto = json.dumps(dados, ensure_ascii=False, sort_keys=True)
    if len(texto.encode("utf-8")) > JSON_MAX_BYTES:
        raise ErroPipeline(
            f"JSON excede o limite de {JSON_MAX_BYTES // (1024 * 1024)} MB"
        )
    validar_anti_vazamento(texto, auditoria["registros_todos"])
    return texto


def exigir_base_inalterada(dados_base, dados):
    """Estender a janela não pode alterar nenhum recorte fechado da base.

    Compara, chave a chave, todo recorte da base cujo conjunto de meses não
    recebeu competência nova (ficam de fora o período completo e o ano em
    curso, que crescem por definição). Devolve quantos recortes conferiu.
    """
    periodos = {p["id"]: p for p in dados["meta"]["periodos"]}
    meses_base = {m for p in dados_base["meta"]["periodos"] for m in p["meses"]}
    meses_novos = {m for p in periodos.values() for m in p["meses"]} - meses_base
    divergentes = []
    conferidos = 0
    for periodo_id, recorte_base in dados_base["recortes"].items():
        periodo = periodos.get(periodo_id)
        if periodo is None:
            divergentes.append(f"{periodo_id}: ausente na janela estendida")
            continue
        if set(periodo["meses"]) & meses_novos:
            continue
        conferidos += 1
        recorte = dados["recortes"][periodo_id]
        if recorte != recorte_base:
            chaves = sorted(
                chave
                for chave in set(recorte_base) | set(recorte)
                if recorte.get(chave) != recorte_base.get(chave)
            )
            divergentes.append(f"{periodo_id}: {', '.join(chaves)}")
    if divergentes:
        raise ErroPipeline(
            "a extensão da janela alterou recortes fechados da base:\n  - "
            + "\n  - ".join(divergentes)
        )
    if dados["meta"]["manifesto_fontes"] != dados_base["meta"]["manifesto_fontes"]:
        raise ErroPipeline("manifesto das 19 fontes mudou ao estender a janela")
    return conferidos


def montar_release(
    diretorio, matriz, corte=None, blocos=(), ate=None, exigir_referencias=True
):
    """Lê as fontes, agrega e valida; nada é gravado aqui.

    O período-base é sempre construído e validado primeiro, pelo mesmo caminho
    de um build sem blocos — é nele que valem os critérios de aceite e a
    Matriz 2025. Havendo blocos, a janela é estendida até ``ate`` e o resultado
    só é aceito se nenhum recorte fechado da base mudar.
    """
    blocos = list(blocos or [])
    fim = ate or FIM_BASE
    if blocos and not ate:
        raise ErroPipeline(
            "--bloco exige --ate AAAA/MM: a última competência fechada a publicar"
        )
    # Caminho errado de bloco aparece agora, não depois do build da base.
    blocos = conferir_caminhos_blocos(blocos)
    try:
        definir_janela(fim)
        if janela_estendida() and not blocos:
            raise ErroPipeline(
                "--ate posterior ao período-base exige ao menos um --bloco"
            )
        if blocos and not janela_estendida():
            raise ErroPipeline(
                f"--ate deve ser posterior ao período-base ({FIM_BASE}) "
                "quando há --bloco"
            )
        if corte is None:
            corte = ultimo_dia(fim)

        def construir(registros_todos, registros_blocos, manifesto_blocos):
            incluidos, mantidas, descartadas = preparar_universo(registros_todos)
            competencias_novas = (
                conferir_blocos(
                    incluidos,
                    registros_blocos,
                    manifesto_blocos,
                    descartadas,
                    mantidas,
                )
                if manifesto_blocos
                else []
            )
            dados, auditoria = construir_dados(
                registros_todos,
                incluidos,
                manifesto,
                mantidas,
                descartadas,
                corte,
                manifesto_blocos,
                competencias_novas,
            )
            dados["meta"]["matriz_2025"] = reconciliacao
            return dados, auditoria

        definir_janela(FIM_BASE)
        registros_base, manifesto = ler_diretorio_fontes(
            diretorio, matriz, ignorar=blocos
        )
        # A Matriz valida as 18 terapias de origem, inclusive PECS. A publicação
        # continua usando apenas as 17 terapias com 18/18 competências na base.
        reconciliacao = reconciliar_matriz(matriz, registros_base)
        dados, auditoria = construir(registros_base, [], [])
        texto_json = validar_saida(
            dados, auditoria, reconciliacao, exigir_referencias
        )
        extensao = None
        if fim != FIM_BASE:
            dados_base = dados
            definir_janela(fim)
            registros_blocos, manifesto_blocos = ler_blocos(blocos)
            resolver_nascimentos(
                registros_base, registros_blocos, manifesto_blocos
            )
            dados, auditoria = construir(
                registros_base + registros_blocos,
                registros_blocos,
                manifesto_blocos,
            )
            texto_json = validar_saida(
                dados, auditoria, reconciliacao, exigir_referencias=False
            )
            conferidos = exigir_base_inalterada(dados_base, dados)
            resumo_base = dados_base["recortes"]["tudo"]["resumo"]
            fora_da_janela = sum(
                b["registros"] - b["registros_na_janela"] - b["registros_cedidos"]
                for b in manifesto_blocos
            )
            extensao = {
                "recortes_base_conferidos": conferidos,
                "base": {
                    chave: resumo_base[chave]
                    for chave in ("pacientes", "sessoes", "pagamento")
                },
                "registros_fora_da_janela": fora_da_janela,
                "corte": corte.isoformat(),
            }
        return dados, auditoria, reconciliacao, texto_json, extensao
    finally:
        definir_janela(FIM_BASE)


# ---------------- saídas atômicas ----------------


def escrita_atomica(caminho, conteudo):
    destino = Path(caminho)
    destino.parent.mkdir(parents=True, exist_ok=True)
    descritor, temporario = tempfile.mkstemp(
        prefix=f".{destino.name}.", suffix=".tmp", dir=destino.parent
    )
    try:
        with os.fdopen(descritor, "w", encoding="utf-8", newline="\n") as f:
            f.write(conteudo)
            f.flush()
            os.fsync(f.fileno())
        os.replace(temporario, destino)
    finally:
        if os.path.exists(temporario):
            os.unlink(temporario)


def escrita_atomica_multipla(saidas):
    """Troca um conjunto de textos com rollback se qualquer troca falhar."""
    originais = {}
    for caminho, _ in saidas:
        destino = Path(caminho)
        originais[destino] = (
            destino.read_text(encoding="utf-8") if destino.exists() else None
        )

    alterados = []
    try:
        for caminho, conteudo in saidas:
            destino = Path(caminho)
            escrita_atomica(destino, conteudo)
            alterados.append(destino)
    except Exception as exc:
        falhas_rollback = []
        for destino in reversed(alterados):
            try:
                original = originais[destino]
                if original is None:
                    destino.unlink(missing_ok=True)
                else:
                    escrita_atomica(destino, original)
            except Exception as rollback_exc:  # pragma: no cover - falha de SO
                falhas_rollback.append(f"{destino}: {rollback_exc}")
        if falhas_rollback:
            raise ErroPipeline(
                "falha de escrita e rollback incompleto: "
                + "; ".join(falhas_rollback)
            ) from exc
        raise


# Gate visual preservado. O broker privado valida as mesmas credenciais no
# csv-open-auth e emite uma sessão opaca, restrita ao painel, por quatro horas.
GATE_P_HTML = """<div id="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title" style="position:fixed;inset:0;z-index:99999;background:#003c3a;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;font-family:'Source Sans 3','Segoe UI',Arial,sans-serif">
<form id="gate-form" style="background:#fff;border-radius:16px;max-width:400px;width:100%;padding:36px 32px;box-shadow:0 24px 64px rgba(0,0,0,.4);margin:auto">
<img src="https://assets.grupocsv.com/logos/unimed-gv/sem-box-pinheiro.png" alt="Unimed GV" style="height:44px;margin-bottom:18px">
<h1 id="gate-title" style="font-size:19px;color:#004e4c;margin:0 0 6px">Painel Terapias Especiais — acesso restrito</h1>
<p style="font-size:13px;color:#5c7f7d;margin:0 0 20px">Uso exclusivo Unimed Governador Valadares. Informe seu e-mail corporativo e a senha de acesso.</p>
<label for="gate-email" style="display:block;font-size:11px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;color:#5c7f7d;margin-bottom:5px">E-mail</label>
<input id="gate-email" type="email" required placeholder="nome@unimedgv.com.br" autocomplete="email" style="width:100%;box-sizing:border-box;font-size:16px;padding:10px 12px;border:1px solid #dfe3db;border-radius:10px;margin-bottom:14px">
<label for="gate-pass" style="display:block;font-size:11px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;color:#5c7f7d;margin-bottom:5px">Senha</label>
<div style="position:relative;margin-bottom:18px">
<input id="gate-pass" type="password" required autocomplete="current-password" style="width:100%;box-sizing:border-box;font-size:16px;padding:10px 52px 10px 12px;border:1px solid #dfe3db;border-radius:10px">
<button type="button" id="gate-eye" aria-label="Mostrar senha" aria-pressed="false" style="position:absolute;right:0;top:50%;transform:translateY(-50%);width:44px;height:44px;background:none;border:0;cursor:pointer;padding:12px;color:#5c7f7d;line-height:0">
<svg id="gate-eye-on" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
<svg id="gate-eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
</button>
</div>
<button type="submit" id="gate-btn" style="width:100%;background:#00995d;color:#fff;border:0;border-radius:9999px;padding:12px;font-size:14px;font-weight:700;cursor:pointer">Entrar</button>
<p id="gate-msg" role="status" aria-live="polite" style="font-size:12.5px;color:#c0392b;min-height:16px;margin:12px 0 0"></p>
<div style="margin-top:20px;padding-top:18px;border-top:1px solid #e7ece7;display:flex;align-items:center;gap:16px">
<img src="https://assets.grupocsv.com/logos/caminhos-brilhantes/01-trilha/horizontal-positivo.svg" alt="Caminhos Brilhantes" style="height:30px;width:auto;flex:0 0 auto">
<!-- o selo positivo do EVS só existe no bucket em 2048px e 577 KB, e aqui ele aparece
     com 34px de altura. O portão é a primeira tela de todo mundo, então entra uma cópia
     de 210px embutida: 8 KB, sem requisição que o formulário tenha de esperar -->
<img src="data:image/webp;base64,UklGRmwhAABXRUJQVlA4WAoAAAAgAAAA0QAAggAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfh8AAHBtAJ0BKtIAgwA+LRKHQqGhDCWr7gwBYloANV56Vx/Xrog8V+RP45/LbX37f+B/6h+1vKeVz5UnKX+Y/N7++fMr/Lf5D2efn3/p+4J+s3+y/u/927GH7g+ob+X/2L/r/4X3Z/9R/0f8x7tf1m/3H+A/3PyAfzj+zetn/ufZo/cz2BP6T/ov//66X7gfCZ/Xf+N+2/tM//HWQvE/9A/GL9Y/lX3W/PfyL/p3/m9jfxP5f+uf2L9lv6//2t+a1O/jv1W+v/1j/Af7X+qft58Qf2P+X+MPwf/qvyO+AX8U/j/9//ov7S/mJyJOq/6n/C/kr8AXvH9I/xX9q/c//F+h1/Vehf5J/Zv899t32Afxj+S/4T81f8H///eb/xXi++Z+wH/Lf6t/v/77/oP27+Ij/R/xP+T/8P/O9x/59/dv+n/iP8x+0f2J/zX+of7X+7/5z/x/5f////j7zvZB+8Hst/tAt4EcDRFsKvp8iC2FX0q/FwrW762zKU/t5UnqINlZchNBoFLXPF/ugA83/JNENIv1qxD87joHuS7MIkQXBsxeN7CsX9IJ/xBMYdADatfm+AvTlgDzmPvHWkVHgbrwq0MrrxvOfYV9MVIr3NV/OioslxnwPZmtTiPNI8Pg1uFBMqd7249uYj7ywd/ak9iO5qX54AZL9PPOrq4jraFjHZYPyDUpgppIdVlraewYaj10W9JxKlgG6swAMcUns0Qkn4x05f48/0Kt0GAR+KpJW+utK8384YFEjqrKzAUPeQhkfXHwzmu+cnx+pKA6FolO70tgjXHDsmam9J6S9iyLt1C2NRUtABeiHjoUWlXpB26Wmo/Fh+5lmh3WDMa664wQKWnumKNw0ka2kAIWWx9tinYh5HxLd2fbu2sVqkO15w5I9LpULv4Cv2R0xJxo7ekpDqU1TT7pRFJkrd2gzHyQYJ663gZu7prXOxMZV79ZC9wrUD5HF89k1zQfvCj/ul9MnZgVKPjAWmL0ErQoYRJM19Dp2kjJYYILRXxWe7ZfUA5sZgQ1tS1A08uV4D/H65vIHBHhy+VgJU3kURsS4lt4dIVjAIA6d5c5uEbMEqQPvQ9rPQvCrZZNM52pITw24t7ezaYTqt4ULzeOxrfLGhlF12pfaTGgXbKYBnYdW3S6p3kF2Y2M/T5H6/1CEr6df6g1ddSY9P9AAPuZIGLaxy6Eimwt3d74bXKZzgup3F/+jn33Uo7zzpGiMXEHfYnYkEsyv3cnxOdhQ7lgAAvz0v92oT4WHOiafYxLl6wbeEbIlCH20BU8ayw5iKhHTI5RqRZXiFhOcJ34JH8Eb50e+AcH+E59Ilvpygxj0BDoIe8FcQFPn7EfagBh1s/h+AYCTqj1SdCa7fru5Mleo/6FdhNOn9mq93aufOzOzJf/mg3XbQbIpx5o6n+OFPv4AzrR3vgx9om6s14Y55gHB5loAGdAvByXBtC9LTSNd3Fbu57sX96LR8L4cMLHhurUDHIaZEWJlgdzlVY+OoNU+HMJy7BAvEkxSWjsqp2VvO4JI3gOSHWiuXcLYGKuQo1v0kZZ5MeW53vrbFkWezSs4AbVwVvsLiKzdvJOubn1hpd3DTah14VRfmWUcbCXhq9l5fUZEagwPVeFPc/Qd1TJ6Wk0Yv4Jys6JXc5Etj+a4fWgZVG+Cz5gR6GvXpefesfxnv1/UkSh+C0uVzorYf39gSXHtUvI4VSSeXNWIhiEizkT3qcPsFD532l7surOhRrYw5dtOKVRuhQJP3YUMQLKvhbIWe7wgwzK/6LmkFf+zofdyuS14u9x10v9jk7W75W4RjGqQPdBJGVf+oLFO5+tmYg6eX1pF3kkj+S9zAgqqAxKvxW+4dc6TJ6e741lkB610iapZ8m4HCm1BdjptqpcVsDba1D5od/JaWgbSGsHu4fdvfO1sXfEHQCWNOJntTiyORsew7Hbth44lOfL/6mJtYB0Ku6QuHgTh+WA1Lx6FohKKaMB4kaG6Fsp7ghocv4LDwSrXZzxfu5O5G6NyQKzSCF9m4gpK1k4lbCPECOVecUZ64tLiXYa1M7sxGBh14sI/SXR5+tYI2srlrdtAi3qniux/hmLMsKDwTA4KwSh502siGKd+OvtHQk4wdJc2zFpEDAQ8SwxvDxZ4AqGcp3Lw2CeCcDgULXd/OHBfg2qLGTHaNWaeshz8jxxJF5EVMwqinRwAhROdFOVa1Vlac+3sT6LdyZWW/50jtf+Rw8bN0UGFWECpaqSVTcQSXopQlPjTpG1T5k8JjppVuyYeBtbYVT1cC9O6U5s0ivaE0o9zBAiEsX4+GHoL7s+LH8Hzq7Juit81ni3AodkTvADQ+Mfl3WfqFNkR0t3/pG3fsiCWr+5FqKwSLCu/SfdDJ+aqP05hD+YUoqzZgTGH9N8cE4uSJYvkqWZL+5ejvkG0ibY5E3t/nMPJAYRZiOomRL0OoiahJUhzO/y1ifmJyq9F9z9pwCF1E4VpO6G8kbDrJrkGk5l03DlJQDbOCECZ4bvwXNcBREiO8ZtWKvTek5ycOZJLmYBLOLQPUcgq/k2OVPZLrjQ0jiV6w2XTA+BhhUy7n3h6LdEOmqIXi25v+E+nsqMzXacT3YznWmmyD0+KBVEwaTNHh/ZJFnASWJ/XaPSdhE4CwvXZ8IAxxk++hyo98Dc5S7UobxnguQ0R5aQHK3joBcdtUHeAPpWT3qcPI9WWoiaEuV1MLCptXNSPGtVBwtu2Lcv2/ZUdGeuyWfiW+Pman+n5e1v/U8PzG5WLA6v1D2ToUiBMr7MRlZXtlPV0vZRO3gGMQ5+UKZ/sPYd1B1E7b28/0HnTfmCsHrfgxKqkKkOQ2IBFaR0Rvca2qx5Kceh2HIv7+auL6iT7py9h7cPDyCeBt4gOkr041C2cyZAPqtl2qwK3GvzpShKMLH/rt7O3qCs2pmH8BBN8h2U1bpc5tIAE11HJWt/GA2VTqxhSlcx8iqYM5yojnXBO5p7Yr+xdVKzV2IJrc4ez287k6dkUpjmJ2LfzjfVjhAiG7toDHGuF9VlhdpeztjnC3+9lRQgBUG0nnKkL88aJHMs4Y/dZYWlE7nIBa4K60w9sQxpE9VROoQpufpcctKD8XrzCE/7HyW6LoAYjmHVb7aDnTpZcTZD7HDQEb450dw/EAdsPJWmF+Bm2xrCUE7GRkFoyBZKuhTLgJJwnS+Kmo2dXefEUeFaGMSC/E5asx1dznkbvg4w9a8U+fTqQQ0fmmcWPCNswcz5TJs0dN3Bqu355BJCLThL0gbrUPz3i5cymJoReS3I8SdXh0r7H7iMjHwOPBalyj4Chf26/ZzCx2ulO/Kp4kdFRUKi3NoNO4PzvoUNV3HWem4Z+1PJIAEfAE3+rV844CaMCUOs1/+xZBgoOttdknpxpovGuquOeab3PPnj3RGFhHV4p+xq8ZCYY0RkIkaavEWHvtsbTXFt/CYf0WUXWJajKc5h0SiTrOYNx5zcuq7WJ3+UJFdTRYH+43fkLYGfnT4BFPBFEAEwWtImUwJXXBd8tx9E4ryZFdrGvzAWhlilr/v0XCv77ST78vs6v3ZYRmk2rHjBI8WG4bYUc/WP9zthq2mZ+JxhNlfWR2HvWil9vUst5hD08HSlZNRAdaM5XRgEL24/Sq/kJAEXVq36tvX+fD0IqyH0kSyE8BXWINcHP/IgXvD8aRjaa/NIap2/JYesqQWBHAUJlb6P9BybVCLLh/yKOodLJBDbPIGXH7G9tsbRA1d5lDP9RAk4i7ExELjxmaZF979KT1RqUY8WYgfkJFWxCZYNbThzYG7r66gYk6Mf8/F9Jye34FnZpcC6LwqO8gh9QNbwo2JZkjs4dKmlptudDLA7fpgDKAcYAcG+NAcezyNntQwyGxskAOYftwOT1fzFlKbLKb64pAxt3FnGA41T4sP+lCue8hdDSpkVhOFWVJCx+1P6o21WRinv/q1Dqm142FONIGlaP4tmG5t9Sor8f7O1IQYexbSH4XmwXQvPPE8HKelkgGXUfec3WGDkNnc8c9mbMOAm6xfpcKGQH7DutHgDcgffmh9cBihGrp0OqQw1W/xoxppmMvcWguYPeAHu0g+Fnvzxj1wA7RlZnYCd8qcz5EbkLuRAwxRnHLVoOlQdFR8nhFCmHrDszXXcGnLaoYMJyUN7GTxRcC2roDopZesSbBfeVr7o3p2pbE0QFv9yZfgA/6W01Wfn7jsEdYU3oyzKYf305NgASg0lNmXI7igL3rGNLJFAQ0CstNQeZP/RwGow2uQl66ue9I9UC6SBJx2k7aSxbzLnXNcQMYVwUmmNWqhGHSVgY3tWxomhFYfTxnT/WSDq4WV/sjEAqA8CRQNIKZWcoGuZCgVHy5W9MRhAhTsa2V0jdUiUgquWJkxergoDoPiy4Lzk3jMMEtSB4gLxxagd2q14qzknSksX8vI1Rtkz0x8L5FapBC3d7kWlOavYsUx8i6SCRiikM6SFkeNBHooyOhOPCIb9XFXVL5NsAPXD+CitjIXJ1DMA7I0qJ+5tJBXrp36dRqh7dukqhM+3kffq9/IfSw462W3C+iOCeZ/Ba5EuLqpVDhy9Ha/DIbCE10t/zwTVhzQZDfsQ+9k1thFHcWIZLcojJnKBoHufQ3nrh1AZHdAefKA3ennJdPG3P0ISaVwmtEJmZYV5f+vfmKG72KOUPDaH6BgZDCbPsY5igSdJHFF6qfb/jgrqTPwr4oGuOl/lxQMhCG2gX0I8lqtaaImdCY+QaTlTsKVgxn5VNuMubQ05AJRVNwLslDqFC3KKjuJwfEevyCFKmtMAdOrTQtKJvQbvkX0uuFQfgK2MmoqsiCPrXSE7XU1VQx0pHcSuCo90sTSDU4Ao43MIWV/4S3ySJOmlJa/Z3PdX03xQSAa6lWMYngSYOfuXWGCkJdYJ4IjfxxoFgng3sFG0j0sEqbnSTEOVcJkMcZD3kY41jydkYiA+0WF7yTYgCxH61Lwi1TXgdk4GT//hETu/jaJH/nHrlYsbu96g+8BA0JKN2KIUldhgLKEyAhLqqtDbSgHp5/SH9EDOv3IosFgKDhIwk0HtZOYRrFvXYZSsQgXeP6gVHRWjnmuGOjFt/fmS4k8nWSUHJRUojQkZ6aihZY7zl2HysvYUutLa8qGrBCvVRYaBN4mQHx9ekwArbNEwF/4WxQyN4glPG8Zb6sGt0FO97KuNIFg5OYgAgcAgVJ+aqSGXmzWj/tmVHiJGpHY5nq3lwP6+B+6nHEIyTkzyWQmF7OlRqAzyXcprQVS9BTKv+WH+prw9ulHughI7MWmqY0PKZ32H3BGRDSUf5U2KwL3ExFd5Vaf4hW/0ivGg5Na7lHBAbwolUZ7qdYdwTa/2llPOEzXxsXZH+AAjOoA/GMTP9gsC2FUg4FN8GLaijpBw/2P/iHZJ4xfJ/+LREnAOuaRFm1V5Al030OLFCM1OKqdX7l3aVNJ2HOrPnre4tzaI+T8AwLJXetDrZ9HQC9elYTP0VlnDqBJfDSsRwt3+DbTWoBhFUj3YvOyUW0eVMX3N+z457r5VddD6H7uWWcOl0/qnqgBhzGq4rreuVawt9Z+rgee35pDeJfPjHm3yFHcqi/O9+RBzW54CP4bav/lHOtT56A/a/uiMMQzBM0c3u3q7zK6V+9cQd4P0Qoc6YWrFb/LxvBO32yuP8F6BzQr3WKuOYaBYkUJ0SVR9nH6p06uDuP1ZzHR/9yps6t1loS8hvR39r7TZGw+3qoSFz3vEiNjufPcesD6ercdRGqzw3q4x4iq37wCDZZXXd0RLIwxZZuzxZHpeNxRScBliovShYt73O+zMpzBJBsLr3k7c6e22JK6OzIhAguV1EiwOrrnYIWdpxVm0tuSRTmASqAtha8m7qbpT39ny7pJxrUjUD5ihtb8X5/jcDWj+hOdiqkOtjrU/Vi6WiTjl+EXbhUQ45PsJf2bWOZKtSYh6b8jSa4GUFtYtUgTcpTAFiUQJmyVAMKLmrX4L5wvdSJc3CXZeip4v7imkMAlWYG6wr+mngo1k4baML0CsR9E7YC9Yz9Z6eiT+ET2WXguIjKh2QyY295xq/a8X/Gb82VhrrWl8aGyvhP3+x2R2Wrn6tX0OvV5u/Sdc380ZdEuUfXpqKR9dR86fHzI1TlNLatgBxA/SilswGyB6bq5mQeKGGbOnU3Vcm4PcvKKl3v7KhNtErt3ekfTrBvq70uCPJY8UHIgk0SFYVUY5oL+jTl0asm4J+eGBUXCDTwPbJCMlUh3v5UeDgmyScSOMON/YiiFAplikL3IyQDol8kn4nw8nJymMPtffk1c/4Btwvkp8EHwomyL/q9JEwWDTgIeUh0k0tbPot+73Bv3Ky9DzKlCnqCTwsmAoPjBSVGt/7LTnvOzA7FxUBpZ7+MpGALjCFcZHZHADRQgSJla6Llm56j1tH6lHwmZXlN02gQzcUJE4Da9uL7XPZEXYPcqpzlLDeSYHSPnHUV5QDGFVlNdix+AKrJFelVLOvBGLlLBLZK5MXO1xdZ4vkjYaGN4HDxPmvPb2X4/U1fST56neQZ35FcSHn+rbCT6J3bVsjts/iHly2St0crUdt0E1Isn8ux5H9ec3XUOmjn0hoGftbGq4mQKzdpBBPVQ/Y+mPEQCdxqF5NJwjtyXZj/9e15qBY0FfPXpYLcqEapHYAHOATWe0NLbUWWokP55IX93dWottZ87BmQf5TYbJWj8rLgtP4FRjwvrzy3ia9BANhkfI0lFe2YjrTvs6tRKCEb1Dd2gClnhxhx5FXn1wvMkS6dg6hUJIcvQU2lP5BVkL5z5EYGAVJLzKSQu/xcJpsVAFWV0zTDqvBdEp6typJqUI18ex+X9pE3bP/+dB/i6+wEckUp53lH6V7Vd3Kx6zjE85mnWxFMoWdG35eQZWVISMQUJ++DW1VWnwgs8VWv8U8wdmQVi4XSP7XEWnXWMBIvD4N5tXsEwhLk3q/AEZO6UT56hu+UctxA1D2akO7K1a7ZxesO12r0EVbP//XCgVvdvJlNwQeN2111QKnupVcc1r0Zv+FofeZo/jWM9JXK6UxwjNfyWknBX75r3SbDrOQ/8qj71ae8wz69M5EH6VcY3iMkoqi92k8OIU0H0+WgBGB6ESjzT0OIVDz1LrN5MDfWq0xopKiltOz67lnf/3vmIv9pb17PE7qWgnopboSE5t2P4dl7Lvv60VzkEX3Wp6gWIoCigqPDVQXqQOpokqDzaU4jRTUfxdZpdSWdn9XxitTPD7JoUJ2/BRDM8PLX6fTtDXxzxI0qCo7YsgxSKXVEbitLbzNXdvjrmWT/57XHyUgDtVgvtKy0fLkgW2MljxBjy/wIDk53KeXeSaqdOgVrrVPmuEuPy15uJy6VXAgGQzcLtE54Or+OTiNPytkejY4aXAVWAsfZHTirZHCK7WmJ0rKSBL3mX+UwCZcfqZHQ9Z32rF32uU0KcKk9bqPOQhcIoHg4fpO4v8pqRkzG0m07DQqFbwh3lKxtRwFKHvIKpjJLrzZy+DkhnZUmQ38tMTnSFWjFUmMpiNbkLC9a17WVkj2itL0TRkQf9sAi1oP51YdF1Rne0u5znGFz6Vc5ot6bn7uM18HNsXHBDwTZpA2jhsja2nAGve+NDjIGaq6CtbEDNVhlJEa73ZOjjhDPCEnj3KslJwz9nTQT2jWYUpJIoozw7NkB/vW34HUPc4nQtqHN50lteGdMTrFutXGQc+nekT627B9MnY7phl0DSnxdch5LQIGui19HaJx0zuf+nB2KVOU/WEyxuhmK3etqyJQXVJYA74LXO2h2Z2rEEXKGB81HJ1BD2CJY00Ci1A7MV53Snw4XoCZGBnA8s13Z7IUuV1YcNTZ4N+lJa+WvybQTjMOoPW54/5PZkYjQfsYAipeX0ODVR30U5BfGJ/78ZIa2YfxvvK4bMGsroQpkgAuv7YyhHhKIMtm9xQDw5h/aZPAZphU6N+f7DjITbsNDdd7Bo4KJcT86DMZJiLHepowd8vfmAo1N4Gm78nrfWQE7khiyJm2eGXfn4RUk+jF/081G9wmauGYr3+/TOv3QrJWx8u7bYlCjOXVq+kA9jpfTjOgjLYC1WGIPi4dUis9r3OySsUQd8zE8tBSXjV1FOayIz/ZhpMGxALn5LZyBRx8PLimnxF39jKWvlGqYvnyQA/WBF3qbyfITVoh7YsV0shoJHQQXA9fmACwP0t7JVfk/P9uwGEJa3ouX0k9OheYDLDJUY//KUF+3MYHIKQyRfZP6CxgRr1sv8DPfArcsXY1S64ceYs6ryXKNfELFZx/E81IuIcHlkfW1DTzZCFWWsvUn+lMqjBht3U01c703XbX+GKksdM4RAX3dBfPlTHBhlxnEOrw/6jbmzSedB9b6nHiaRskqezrKgr7rZ0MNm21CD7WWYHfdnqdHJRs7NsFv2zauyitFXYKr0wvZwvOedWWIhtyYuRzUHDki/WM8WCXBJ8bH1eDL03dsuZGHGgSfmduySk+qkCC11Bz/8GmXgopJKkyeN+xAYRBG2GtCFC6/EVyuHhudc4xHn7xe4u8MIPvv1Ngf34Q+NIsTH3HIQB4I8rvZcBMGz2rPC6Mc9pL980rNy57hcbHofHFwCrPWLqRocuGc/9KplvO1WA009ScQvjlrd1YL+ujRJ1LKYHZdRP34b6NcyFMgEIX+pwpw0wDfXZmNMfc4/es/MXCxGbVqFGVuZkrtjgts2tV+DboxIGyZr5OAplKmKNWn2eo88bc/vE6vpBfu4Qs6Tb9V5FFaHDiPwJsSfF6MPn+clhep6ezXqCEX2KhrcZX+KysNDx8kfuhu8ohNAhWNzgJgYdkakGKkIG2pIe4uZXuJlDGXUbhhasfoPiiZFJ+A8wwrRtwETV27tMcRO7GjaUMjMNXECU0iOG0W9M3JqxnhESwKXDPE8vXjWGLT5yZUfo8LihC8emMMGPI3+WVm7rYfkBcgVSf/1TgaJDXGgy/DlYi3BAV4FRLu2UDjNTW5/nMqacoN+rvSs3PCJQVywMa3BFDqRZqmVLFqgLINInn5Ct3Z2ZA6NNKqyc1QAHGZGlm9gdG69OjeBfOKpCIvZd74NkCO84fGV9rodf7NZ6n4yqP+bFS7YztO17S1nnrvw3jM4tLz4rLzaXjH68N99msa7w/SRd4cW5qSO1790uUavNCpWp5FfNKfmGtCZsDIxIJK+IPv6rPexiGNOBe8LcwM9boE79nlbkurqO0Ipix5M0wwoG/hYsMahnfO9A4youpco7WLSPN/gZz3O6xPRpLPkOonxpJWcQu+Ff1DmrQ+LEfyX5gsNjT3ziEgDdQrmwtNZl9gngrx37fsN7Uj0v+r7MGNo7Z2GGJ+5Avri1a/k51Ob7aRM9Q2AaRpz6GeYRF3h/zFGOscHz4IAFGejGmbetqMPodFfnKzEs6vbSxcD2+hdJI1bwyLIJfro33xNIadI0TXVpWTx+LJO3v//09p46/4v3zvyBhnXBBLska/2+83HTKqwhCRwgN7xjq7RfnTidIpPr84HD5DaDub/PS5Wj4UW10Xi7SlFocYRRK3KzI5Ftt24RA2CCqAWHYOUKYnX/SJG90nYue1OWZ+qjWqXmo0OhycehkWLcXh4prwI7H1Yh0RzX1+Ice6VScVv8JC3vRUuTRm9B/8MwP+x66KVsE2gbXloVkZa7L4qPeuthRay2rlu5Xz/v99fFYBuroryUpwa8Myov1d0BpSEz0wYR/EZWAsfXfgzztkTbl1YkCY5Z2XYDJwdQ5iw+JpfN5aGj2qB/Ek9t6WEQPr2PWUaj87vLRVbO+VJM8l4/FFpszfQduGj4EZTa8SQuRXlwTVEHLkiKmrNemkNjyqDRhtC4KPRIndOsQOvJmpYGlok777rDeDGSCDmEDNFIweQ6Di++G0Bhhp4o6TZxsByAr/lTQ1lBvO9o5/o44i5O0BQvu8aNGukPxaRfppFMMP3jYVgVOKOECGKptGvDduWLS1TFYSAmxwGiVV2m27kO/zG31CU+Ak6tsduflZ/BcsTkuHMwxIUz32i04ptW31dGWLrKas49I8ff250hz36f+zQxxaiIgT+uHvk78Jd+55TBnKyWf4sgOaiJh0ypwT2Bgn7LUXChLPQvjai5mKipVOdvzpFPHQJYgzgb7105FhLjNnL78anPWduN6JHrBDV+MMmT+w9+6x4EvCTw0d/vALUEXFgC+MiGA0eyZtr+vIL/m56/rWZ/btQ1lpnK5kBwTvLBXdniwFuCWJB0C8oZXRGTtxkPVMkItQytNtHHNJ4lo9sCmAuFUKrsK1xMDT0KF3QBJpWAaH+DmLFveLQCYzPJIWOi5QR7rf+OrlqyvZEkciRokHmPI843hV6qoHHGkwF9r2Sx1JokF+v1i0GNoztMquFznUbeFKh+9t+aNXQWKdKmsYZQ0iIKzG/EQPzS6yT9rCca2YwXd5EgtHLnKWHumOug8hQURPTZmA7rv875BXUC8iDf2bU/Dk8uwqKd5xSjOvMUDAv/DMRARSeZpY4ZRJqieHx6ijaEL36I1oc1HM9ro3r2hvnkbIaYwCc5kTUhzbX7elJZI6wIqot/yNCLLPZJYggyupU20li8JvHLkJadabhCrYIBEeLeuHQfTOTtcj0eSEcPENOaVHkr+seWw6OJecrQhfSgefi8m294eMH8LdJ16WKD/29Lr00JHzi1Fr4Hp3WpjzUuZ4x+c8VaWndQwk2Knki9VKAAAAAA10OH2T+Q62VqdK/7F4HrpwADP9vUcpB7+eHSPCD6Y86H9ug8eq+PVCwLOkAAAAA=" alt="Escritório de Valor em Saúde" width="210" height="131" style="height:34px;width:auto;flex:0 0 auto;margin-left:auto">
</div>
</form></div>
<script>(function(){'use strict';var PAGE='painel-tea',KEY='oa_sess_'+PAGE,AUTH='https://unimed-te-data.guilherme-thom.workers.dev/v1/session/open';
function ok(){var g=document.getElementById('gate');if(g)g.remove();document.body.style.overflow='';}
function ler(){try{return localStorage.getItem(KEY)||sessionStorage.getItem(KEY)||'';}catch(e){try{return sessionStorage.getItem(KEY)||'';}catch(_e){return '';}}}
function salvar(value){try{localStorage.setItem(KEY,value);return true;}catch(e){try{sessionStorage.setItem(KEY,value);return true;}catch(_e){return false;}}}
try{var s=JSON.parse(ler()||'null');if(s&&s.token&&s.exp>Date.now()){ok();return;}}catch(e){}
document.body.style.overflow='hidden';
var eye=document.getElementById('gate-eye');
eye.addEventListener('click',function(){var inp=document.getElementById('gate-pass'),m=inp.type==='password';inp.type=m?'text':'password';eye.setAttribute('aria-pressed',String(m));eye.setAttribute('aria-label',m?'Ocultar senha':'Mostrar senha');document.getElementById('gate-eye-on').style.display=m?'none':'';document.getElementById('gate-eye-off').style.display=m?'':'none';inp.focus();});
document.getElementById('gate-form').addEventListener('submit',function(ev){ev.preventDefault();
var btn=document.getElementById('gate-btn'),msg=document.getElementById('gate-msg');btn.disabled=true;btn.textContent='Verificando\\u2026';msg.textContent='';
fetch(AUTH,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page:PAGE,email:document.getElementById('gate-email').value.trim(),senha:document.getElementById('gate-pass').value}),signal:AbortSignal.timeout(20000)})
.then(function(r){return r.json().catch(function(){return{};});})
.then(function(j){if(j&&j.ok&&j.token){var exp=Date.parse(j.expires_at);if(!Number.isFinite(exp))exp=Date.now()+4*3600*1000;if(!salvar(JSON.stringify({token:j.token,exp:exp}))){msg.textContent='O navegador bloqueou o armazenamento da sessão. Ajuste as permissões e tente novamente.';btn.disabled=false;btn.textContent='Entrar';return;}document.getElementById('gate-pass').value='';ok();}
else{msg.textContent=(j&&(j.msg||j.error))||'Acesso negado. Confira e-mail e senha.';btn.disabled=false;btn.textContent='Entrar';}})
.catch(function(){msg.textContent='Falha de rede. Tente novamente.';btn.disabled=false;btn.textContent='Entrar';});});document.getElementById('gate-email').focus();})();</script>"""


def emitir_p():
    if not HTML_ALVO.is_file():
        raise ErroPipeline(f"HTML interno não encontrado: {HTML_ALVO}")
    html = HTML_ALVO.read_text(encoding="utf-8")
    if re.search(r'id=["\']tea-data["\']', html, flags=re.I):
        raise ErroPipeline(
            "HTML interno ainda contém tea-data; remova o payload antes de gerar /p/"
        )
    html = re.sub(r'<span id="hub-auth-slot"[^>]*></span>\s*', "", html)
    html = re.sub(
        r'<script[^>]*src="[^"]*hub-auth\.js"[^>]*></script>\s*', "", html
    )
    html = re.sub(
        r'<a [^>]*class="[^"]*voltar-hub[^"]*"[^>]*>.*?</a>\s*',
        "",
        html,
        flags=re.S,
    )
    html = html.replace(
        'content="https://hub.grupocsv.com/unimed/tea.html"',
        'content="https://hub.grupocsv.com/p/painel-tea/"',
    )
    if 'id="gate"' not in html:
        html = html.replace("</body>", GATE_P_HTML + "\n</body>")
    if '<meta name="robots" content="noindex, nofollow">' not in html:
        raise ErroPipeline("cópia /p/ perderia meta robots noindex, nofollow")
    if 'id="gate"' not in html:
        raise ErroPipeline("gate embutido não foi preservado na cópia /p/")
    if re.search(r'<script[^>]*hub-auth\.js', html):
        raise ErroPipeline("cópia /p/ não pode carregar hub-auth.js")
    contratos_gate = {
        "slug": "var PAGE='painel-tea'",
        "sessão de 4 horas": "4*3600*1000",
        "e-mail corporativo": "@unimedgv.com.br",
        "controle de senha": 'id="gate-eye"',
        "endpoint de autenticação": "unimed-te-data.guilherme-thom.workers.dev/v1/session/open",
        "token opaco": "JSON.stringify({token:j.token,exp:exp})",
    }
    ausentes = [rotulo for rotulo, trecho in contratos_gate.items() if trecho not in html]
    if ausentes:
        raise ErroPipeline(
            "cópia /p/ perdeu contrato do gate: " + ", ".join(ausentes)
        )
    destino = P_DIR / "index.html"
    escrita_atomica(destino, html)
    print(f"cópia /p/: {destino} ({len(html.encode('utf-8')) // 1024} KB)")
    return destino


def formatar_inteiro(valor):
    return f"{int(valor):,}".replace(",", ".")


def formatar_numero(valor):
    """Quantidade que pode ser fracionada (sessões): inteiro quando inteiro."""
    d = Decimal(str(valor))
    if d == d.to_integral_value():
        return formatar_inteiro(d)
    return f"{d:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def formatar_brl(valor):
    quantizado = Decimal(valor).quantize(CENTAVO, rounding=ROUND_HALF_UP)
    base = f"{quantizado:,.2f}"
    base = base.replace(",", "#").replace(".", ",").replace("#", ".")
    return f"R$ {base}"


def formatar_pct(valor):
    return f"{Decimal(str(valor)).quantize(Decimal('0.1'))}%".replace(".", ",")


def formatar_distribuicao(distribuicao):
    return " / ".join(
        f"{quantidade}={formatar_inteiro(distribuicao.get(quantidade, 0))}"
        for quantidade in sorted(distribuicao)
    )


def imprimir_relatorio(dados, auditoria, reconciliacao, saida, extensao=None):
    global_audit = auditoria["recortes"]["tudo"]
    m = global_audit["metricas"]
    l = global_audit["linhas_cuidado"]
    meta = dados["meta"]
    publicado = meta["periodo_canonico"]
    base = meta["periodo_base"]
    print("=" * 78)
    print("RELATÓRIO DO BUILD — PAINEL TERAPIAS ESPECIAIS")
    print(
        f"Período publicado      : {publicado['inicio']} a {publicado['fim']} "
        f"({publicado['competencias']} competências)"
    )
    print(
        f"Período-base auditado  : {base['inicio']} a {base['fim']} "
        f"({base['competencias']} competências)"
    )
    print(f"Corte etário           : {meta['data_corte_idade']}")
    print(f"Fontes                 : {len(meta['manifesto_fontes'])}")
    intervalos = {
        b["arquivo"]: f"{b['competencias'][0]} a {b['competencias'][-1]}"
        for b in meta["blocos_fonte"]
    }
    for bloco in meta["blocos_fonte"]:
        print(
            "Bloco complementar     : "
            f"{bloco['arquivo']} — {formatar_inteiro(bloco['registros_na_janela'])} "
            f"registros em {', '.join(bloco['competencias_na_janela'])}"
        )
        if bloco["registros_cedidos"]:
            um = bloco["registros_cedidos"] == 1
            print(
                "                         "
                f"{formatar_inteiro(bloco['registros_cedidos'])} "
                f"{'registro' if um else 'registros'} de "
                f"{', '.join(bloco['competencias_cedidas'])} "
                f"{'cedido' if um else 'cedidos'} a "
                + "; ".join(
                    f"{nome} ({intervalos[nome]})" for nome in bloco["cedidas_a"]
                )
            )
        for borda in bloco["borda_fraca"]:
            print(
                "                         "
                f"{borda['m']}: só {formatar_inteiro(borda['registros'])} "
                f"{'registro' if borda['registros'] == 1 else 'registros'} — "
                "mês de borda com volume ínfimo (competência digitada errada "
                "ou faturamento mal começado); não conta para decidir a "
                "planilha mais recente"
            )
        for parcial in bloco["parciais_cedidas"]:
            print(
                "                         "
                f"{parcial['m']}: mês parcial nesta planilha "
                f"({formatar_inteiro(parcial['registros'])} "
                f"{'registro' if parcial['registros'] == 1 else 'registros'}) — "
                f"ficou com {parcial['a']}, mais antiga, que o traz cheio; se "
                "esta planilha corrige o mês, a correção não entrou: confirme "
                "com a origem"
            )
        for menor in bloco["cedidas_com_menos_registros"]:
            print(
                "                         "
                f"{menor['m']}: {menor['a']}, que ficou com o mês, traz menos "
                f"registros dele ({formatar_inteiro(menor['registros_no_dono'])}) "
                f"do que esta planilha ({formatar_inteiro(menor['registros'])}) — "
                "lançamento cancelado na origem, ou planilha incompleta nesse "
                "mês: confirme com a origem"
            )
        for total in bloco["totais_lidos"]:
            print(
                f"  lido da planilha {total['m']}: "
                f"{formatar_inteiro(total['registros'])} registros, "
                f"{formatar_numero(total['sessoes'])} sessões, "
                f"{formatar_brl(total['pagamento'])}"
            )
        print(
            "                         "
            f"{formatar_inteiro(bloco['registros_agregados'])} agregados + "
            f"{formatar_inteiro(bloco['registros_terapia_descartada'])} de "
            "terapia descartada + "
            f"{formatar_inteiro(bloco['sem_nascimento']['fora_do_painel'])} sem "
            "data de nascimento"
        )
        sem = bloco["sem_nascimento"]
        if sem["registros"]:
            print(
                "Sem data de nascimento : "
                f"{formatar_inteiro(sem['registros'])} registros em "
                f"{', '.join(sem['competencias'])} — "
                f"{formatar_inteiro(sem['recuperados'])} com data recuperada "
                "do mesmo beneficiário, "
                f"{formatar_inteiro(sem['fora_do_painel'])} fora do painel "
                f"({formatar_numero(sem['sessoes_fora_do_painel'])} "
                f"{'sessão' if sem['sessoes_fora_do_painel'] == 1 else 'sessões'}, "
                f"{formatar_brl(sem['pagamento_fora_do_painel'])})"
            )
    print(f"Terapias mantidas      : {len(meta['terapias'])}")
    for descarte in meta["terapias_descartadas"]:
        print(
            "Terapia descartada     : "
            f"{descarte['terapia']} — {descarte['motivo']}"
        )
        if descarte.get("registros_pos_base"):
            print(
                "                         "
                f"{formatar_inteiro(descarte['registros_pos_base'])} registros "
                "pós-base fora do painel em "
                f"{', '.join(descarte['competencias_pos_base'])} "
                f"({formatar_numero(descarte['sessoes_pos_base'])} sessões, "
                f"{formatar_brl(descarte['pagamento_pos_base'])})"
            )
    if extensao:
        b = extensao["base"]
        print(
            "Base conferida         : "
            f"{formatar_inteiro(b['pacientes'])} crianças, "
            f"{formatar_numero(b['sessoes'])} sessões, "
            f"{formatar_brl(b['pagamento'])} — critérios de aceite e Matriz 2025"
        )
        print(
            "Recortes fechados      : "
            f"{extensao['recortes_base_conferidos']} recortes da base idênticos "
            "ao build só-base com o mesmo corte etário "
            f"({extensao['corte']}); a faixa etária acompanha o corte"
        )
        if extensao["registros_fora_da_janela"]:
            print(
                "Além da janela         : "
                f"{formatar_inteiro(extensao['registros_fora_da_janela'])} "
                f"{'registro' if extensao['registros_fora_da_janela'] == 1 else 'registros'} "
                "de blocos em competências não publicadas"
            )
        print(
            "Competências novas     : mês | crianças (já vistas antes) | "
            "sessões | pagamento"
        )
        novas = {item["m"]: item for item in meta["competencias_novas"]}
        for ponto in dados["recortes"]["tudo"]["serie_mensal"]:
            if ponto["m"] > base["fim"]:
                item = novas[ponto["m"]]
                print(
                    f"                         {ponto['m']} | "
                    f"{formatar_inteiro(ponto['pacientes'])} "
                    f"({formatar_pct(pct(item['ja_vistas'], item['criancas']))}) | "
                    f"{formatar_numero(ponto['sessoes'])} | "
                    f"{formatar_brl(ponto['pagamento'])}"
                )
        serie_mensal = dados["recortes"]["tudo"]["serie_mensal"]
        referencia = statistics.median(
            [p["sessoes"] for p in serie_mensal if p["m"] <= base["fim"]][-6:]
        )
        for ponto in serie_mensal:
            if ponto["m"] > base["fim"] and ponto["sessoes"] < 0.75 * referencia:
                print(
                    f"Volume {ponto['m']}         : "
                    f"{formatar_numero(ponto['sessoes'])} sessões, "
                    f"{formatar_pct(pct(ponto['sessoes'], referencia))} do "
                    "volume mensal recente da base "
                    f"({formatar_numero(referencia)}) — pode ser faturamento "
                    "ainda entrando; confirme se a competência está fechada"
                )
        for item in meta["competencias_novas"]:
            if item["terapias_sem_lancamento"]:
                print(
                    f"Sem lançamento {item['m']} : "
                    + "; ".join(item["terapias_sem_lancamento"])
                )
            if item["grafia_divergente"]:
                print(
                    f"Grafia {item['m']}         : "
                    f"{formatar_inteiro(item['grafia_divergente'])} crianças só "
                    "diferem de crianças já vistas por caixa, acento ou "
                    "espaços no nome — contadas como novas"
                )
    print(f"Crianças únicas        : {formatar_inteiro(m['n_pacientes'])}")
    print(
        "Prestadores            : "
        f"{formatar_inteiro(global_audit['prestadores_observados'])} "
        "nomes-fonte / "
        f"{formatar_inteiro(global_audit['prestadores_consolidados'])} "
        "entidades após consolidar o par de CNPJ"
    )
    recorte_tudo = dados["recortes"]["tudo"]
    resumo_tudo = recorte_tudo["resumo"]
    print(
        "Entidades publicadas   : "
        f"{formatar_inteiro(resumo_tudo['prestadores_publicados'])} "
        f"(Casa Unimed consolida "
        f"{formatar_inteiro(resumo_tudo['profissionais_casa_unimed'])} "
        "profissionais)"
    )
    casa = next(
        (x for x in recorte_tudo["prestadores"] if x["nome"] == CASA_UNIMED),
        None,
    )
    if casa is not None:
        print(
            "Casa Unimed            : "
            f"{formatar_brl(casa['pagamento'])} / "
            f"{formatar_numero(casa['sessoes'])} sessões na entidade"
        )
    print("Disciplina x canal     : ok (cross-foot canais/disciplinas)")
    kits = recorte_tudo["kits"]
    print(
        "Kits publicados        : "
        + (
            "; ".join(
                f"{item['id']}={formatar_inteiro(item['criancas'])} crianças"
                for item in kits.values()
            )
            or "nenhum"
        )
        + f" | suprimidos por k<{K_MINIMO_KIT}: {len(KITS) - len(kits)}"
    )
    print(f"Sessões                : {formatar_numero(m['sessoes'])}")
    print(f"Pagamento              : {formatar_brl(m['pagamento'])}")
    print(f"Sessões no denominador : {formatar_numero(m['sessoes_pagas'])}")
    print(
        "Linhas clínicas (17)   : "
        f"{formatar_distribuicao(l['distribuicao_clinica'])} "
        f"| exposições={formatar_inteiro(l['exposicoes_clinicas'])} "
        f"| 2+={formatar_pct(pct(l['dois_mais_clinico'], m['n_pacientes']))}"
    )
    print(
        "Componentes por código : "
        f"{formatar_distribuicao(l['distribuicao_componentes'])} "
        f"| exposições={formatar_inteiro(l['exposicoes_componentes'])} "
        f"| 2+={formatar_pct(pct(l['dois_mais_componentes'], m['n_pacientes']))}"
    )
    print(
        "Nota de reconciliação  : componentes por código são um rastro técnico; "
        "AT integra ABA — Psicologia e não é terapia clínica adicional"
    )
    print(
        "Matriz Analítica 2025  : "
        f"{reconciliacao['status']} em "
        f"{formatar_inteiro(reconciliacao['campos_comparados'])} campos"
    )
    print("Hashes SHA-256:")
    for item in dados["meta"]["manifesto_fontes"]:
        print(f"  {item['sha256']}  {item['arquivo']}")
    for item in dados["meta"]["blocos_fonte"]:
        print(f"  {item['sha256']}  {item['arquivo']}")
    print(f"  {reconciliacao['sha256']}  {reconciliacao['arquivo']}")
    print(f"JSON privado           : {saida}")
    print("HTML/repositório       : nenhum dado gravado")
    print("Validações             : todas aprovadas")
    print("=" * 78)


# ---------------- fixture sintética multi-fonte ----------------


def exigir_teste(condicao, mensagem):
    if not condicao:
        raise ErroPipeline(f"selftest: {mensagem}")


def valor_excel(valor):
    if isinstance(valor, Decimal):
        return float(valor)
    return valor


def pacientes_sinteticos(quantidade):
    return [
        {
            "nome": f"CRIANCA SINTETICA {i + 1}",
            "nasc": date(1990, 1, 1) if i == 5 else date(2014, i % 12 + 1, 1),
            "genero": "FEMININO" if i % 2 else "MASCULINO",
        }
        for i in range(quantidade)
    ]


CODIGO_SEM_MOVIMENTO = "50005197"  # terapia mantida que deixa de ter lançamentos
# Psicopedagogia é a única terapia da sua disciplina: sem lançamentos, a
# disciplina inteira some do recorte — o painel precisa mostrar o escopo vazio.
CODIGO_DISCIPLINA_SEM_MOVIMENTO = "50005278"


def criar_bloco_sintetico(
    caminho, meses, sem_nascimento=1, renomear=None, escassas=(), rarefeitas=None
):
    """Planilha complementar consolidada: vários códigos em uma única aba.

    Exercita o que a planilha real traz: paciente novo, prestador novo,
    nascimento digitado como texto, terapia mantida que deixa de ter
    lançamentos, PECS com poucos registros (continua descartada) e registros
    sem data de nascimento — um recuperável pela matrícula e pelo nome do
    mesmo beneficiário na base e ``sem_nascimento`` irrecuperáveis.
    ``escassas`` são competências em que a planilha traz uma única linha;
    ``rarefeitas`` (competência → N) grava só uma a cada N linhas do mês.
    """
    try:
        from openpyxl import Workbook
    except ImportError as exc:
        raise ErroPipeline("openpyxl não instalado") from exc

    caminho.parent.mkdir(parents=True, exist_ok=True)
    pacientes = pacientes_sinteticos(15)
    # ``renomear`` troca a grafia do nome de crianças no bloco (índice → nome).
    for indice, nome in (renomear or {}).items():
        pacientes[indice]["nome"] = nome
    fontes_tripe = {"50005103", "50005189", "50005170"}
    rarefeitas = rarefeitas or {}
    linhas_do_mes = Counter()
    wb = Workbook()
    ws = wb.active
    ws.title = "Desembolso"
    ws.append(CABECALHO_FONTE)
    for mes in meses:
        ano, numero_mes = map(int, mes.split("/"))
        for indice_codigo, codigo in enumerate(MAPA_CODIGOS):
            # A partir da terceira competência do bloco as duas param.
            if (
                codigo in (CODIGO_SEM_MOVIMENTO, CODIGO_DISCIPLINA_SEM_MOVIMENTO)
                and meses.index(mes) >= 2
            ):
                continue
            if codigo == "50005146" and mes != meses[0]:
                continue
            for i, paciente in enumerate(pacientes):
                if 6 <= i <= 10 and codigo not in fontes_tripe:
                    continue
                if i >= 11 and codigo != "50005103":
                    continue
                # A criança 15 só existe na competência além da janela.
                if i == 14 and mes != "2026/10":
                    continue
                if mes in escassas and (indice_codigo or i):
                    continue
                if mes in rarefeitas:
                    linhas_do_mes[mes] += 1
                    if (linhas_do_mes[mes] - 1) % rarefeitas[mes]:
                        continue
                if codigo == COD_AT:
                    prestador = PEDIAKIDS
                elif codigo == "50005170" and i == 1:
                    prestador = "PRESTADOR NOVO DO BLOCO LTDA"
                else:
                    prestador = f"PRESTADOR {codigo} LTDA"
                tipo_prestador = (
                    "ATENDIMENTO ESPECIALIZADO"
                    if i == 0 and codigo not in (COD_AT, "50005189")
                    else "CLINICA ESPECIALIZADA"
                )
                nascimento = (
                    paciente["nasc"].strftime("%d/%m/%Y")
                    if i == 2
                    else paciente["nasc"]
                )
                ws.append(
                    [
                        mes,
                        f"MAT-{i + 1}-{codigo}",
                        paciente["nome"],
                        nascimento,
                        paciente["genero"],
                        f"GUIA-{codigo}-{mes.replace('/', '')}-{i + 1}",
                        date(ano, numero_mes, 15),
                        f"SOL-{i + 1}",
                        "SOLICITANTE RARO" if i == 0 else "SOLICITANTE COMUM",
                        "Psicologo clinico",
                        "SPSADT",
                        int(codigo),
                        f"PROCEDIMENTO {codigo}",
                        "SESSAO",
                        f"PREST-{codigo}-{i + 1}",
                        prestador,
                        tipo_prestador,
                        1,
                        120 + indice_codigo,
                    ]
                )

    def linha_sem_nascimento(mes, matricula, nome, guia, valor):
        ano, numero_mes = map(int, mes.split("/"))
        ws.append(
            [
                mes, matricula, nome, "-", "FEMININO", guia,
                date(ano, numero_mes, 20), "SOL-2", "SOLICITANTE COMUM",
                "Psicologo clinico", "SPSADT", 50005103,
                "PROCEDIMENTO 50005103", "SESSAO", "PREST-50005103-2",
                "CRIAR E CRESCER TEEN LTDA", "CLINICA ESPECIALIZADA", 1, valor,
            ]
        )

    # Mesma matrícula e mesmo nome da criança 4 na fonte-base: recuperável.
    linha_sem_nascimento(
        meses[0], "MAT-4-50005103", pacientes[3]["nome"], "GUIA-REC-1", 55
    )
    for indice in range(sem_nascimento):
        linha_sem_nascimento(
            meses[1],
            f"MAT-SEM-NASCIMENTO-{indice + 1}",
            f"CRIANCA SEM NASCIMENTO {indice + 1}",
            f"GUIA-SEM-NASCIMENTO-{indice + 1}",
            77,
        )
    if "2026/10" in meses:
        # A data da primeira criança sem nascimento só aparece em 2026/10:
        # não pode alterar o que foi lançado antes.
        ws.append(
            [
                "2026/10", "MAT-SEM-NASCIMENTO-1", "CRIANCA SEM NASCIMENTO 1",
                date(2016, 5, 5), "FEMININO", "GUIA-COM-NASCIMENTO-1",
                date(2026, 10, 20), "SOL-2", "SOLICITANTE COMUM",
                "Psicologo clinico", "SPSADT", 50005103,
                "PROCEDIMENTO 50005103", "SESSAO", "PREST-50005103-2",
                "CRIAR E CRESCER TEEN LTDA", "CLINICA ESPECIALIZADA", 1, 88,
            ]
        )
    wb.save(caminho)


def criar_fontes_sinteticas(diretorio):
    try:
        from openpyxl import Workbook
    except ImportError as exc:
        raise ErroPipeline("openpyxl não instalado") from exc

    diretorio.mkdir(parents=True, exist_ok=True)
    # Pacientes 1–6 frequentam todas as fontes (kit tripé ampliado); 7–11
    # existem só nas três fontes das disciplinas principais (kit tripé, k==5);
    # 12–13 existem só em Psicologia (kit "unica", k<5 — não publica).
    pacientes = pacientes_sinteticos(13)
    fontes_tripe = {"50005103", "50005189", "50005170"}
    for indice_codigo, codigo in enumerate(MAPA_CODIGOS):
        wb = Workbook()
        ws = wb.active
        if indice_codigo == 0:
            ws.title = "LEIA-ME"
            ws["A1"] = "Instruções sintéticas"
            ws = wb.create_sheet("Dados")
            ws.append(["Fixture sintética; cabeçalho abaixo"])
            ws.append([])
        ws.append(CABECALHO_FONTE)
        meses = (
            sorted(MESES_PECS_ESPERADOS)
            if codigo == "50005146"
            else list(MESES_CANONICOS)
        )
        for mes in meses:
            ano, numero_mes = map(int, mes.split("/"))
            for i, paciente in enumerate(pacientes):
                if 6 <= i <= 10 and codigo not in fontes_tripe:
                    continue
                if i >= 11 and codigo != "50005103":
                    continue
                if codigo == COD_AT:
                    prestador = PEDIAKIDS
                elif codigo == "50005103" and i < 3:
                    prestador = "ANA CAROLINA OLIVEIRA FARIA FALCAO LTDA"
                elif codigo == "50005103":
                    prestador = "CRIAR E CRESCER TEEN LTDA"
                elif codigo == "50005189" and i == 0:
                    prestador = "PRESTADOR RARO LTDA"
                else:
                    prestador = f"PRESTADOR {codigo} LTDA"
                # O raro (50005189, i==0) fica em CLINICA para permanecer um
                # item individual exato; os demais i==0 exercem a Casa Unimed.
                tipo_prestador = (
                    "ATENDIMENTO ESPECIALIZADO"
                    if i == 0 and codigo not in (COD_AT, "50005189")
                    else "CLINICA ESPECIALIZADA"
                )
                qtd = (
                    2
                    if codigo == "50005103" and mes == "2025/01" and i == 0
                    else 1
                )
                pagamento = (
                    0
                    if codigo == "50005103" and mes == "2025/01" and i == 0
                    else 100 + indice_codigo
                )
                ws.append(
                    [
                        mes,
                        f"MAT-{i + 1}-{codigo}",
                        paciente["nome"],
                        paciente["nasc"],
                        paciente["genero"],
                        f"GUIA-{codigo}-{mes.replace('/', '')}-{i + 1}",
                        date(ano, numero_mes, 15),
                        f"SOL-{i + 1}",
                        "SOLICITANTE RARO" if i == 0 else "SOLICITANTE COMUM",
                        "Psicologo clinico",
                        "SPSADT",
                        int(codigo),
                        f"PROCEDIMENTO {codigo}",
                        "SESSAO",
                        f"PREST-{codigo}-{i + 1}",
                        prestador,
                        tipo_prestador,
                        qtd,
                        pagamento,
                    ]
                )
        wb.save(diretorio / f"fonte-{codigo}.xlsx")


def criar_matriz_sintetica(caminho, registros):
    try:
        from openpyxl import Workbook
    except ImportError as exc:
        raise ErroPipeline("openpyxl não instalado") from exc

    esperados = agregados_matriz_esperados(registros)
    wb = Workbook()
    wb.remove(wb.active)

    ws = wb.create_sheet("Resumo_Executivo")
    ws.append(["MATRIZ SINTÉTICA"])
    ws.append([])
    cab = [
        "Terapia", "Código",
        "Registros", "Beneficiários*", "Sessões", "Pagamento",
        "Ben. própria", "Sessões própria", "Média própria",
        "Mediana própria", "Ben. externa", "Sessões externa",
        "Média externa", "Mediana externa", "Custo/sessão própria",
        "Custo/sessão externa",
    ]
    ws.append(cab)
    for terapia_id, valores in sorted(esperados["Resumo_Executivo"].items()):
        definicao = CATALOGO_TERAPIAS[terapia_id]
        ws.append(
            [
                definicao["terapia"],
                " + ".join(definicao["codigos"]),
                *[valor_excel(valores[c]) for c in cab[2:]],
            ]
        )

    ws = wb.create_sheet("Mensal")
    ws.append(["MATRIZ SINTÉTICA"])
    ws.append([])
    cab = [
        "Terapia", "Competência", "Registros", "Beneficiários",
        "Sessões", "Pagamento", "Ben. própria", "Sessões própria",
        "Ben. externa", "Sessões externa",
    ]
    ws.append(cab)
    for (terapia_id, mes), valores in sorted(esperados["Mensal"].items()):
        ws.append(
            [
                CATALOGO_TERAPIAS[terapia_id]["terapia"],
                mes,
                *[valor_excel(valores[c]) for c in cab[2:]],
            ]
        )

    ws = wb.create_sheet("Rede_por_Terapia")
    ws.append(["MATRIZ SINTÉTICA"])
    ws.append([])
    cab = [
        "Terapia", "Rede", "Beneficiários", "Sessões", "Pagamento",
        "Média", "Mediana", "P25", "P75", "Mínimo", "Máximo",
        "Desvio-padrão", "Custo/sessão", "Custo/beneficiário",
        "Sobreposição",
    ]
    ws.append(cab)
    for (terapia_id, rede), valores in sorted(
        esperados["Rede_por_Terapia"].items()
    ):
        ws.append(
            [
                CATALOGO_TERAPIAS[terapia_id]["terapia"],
                rede,
                *[valor_excel(valores[c]) for c in cab[2:]],
            ]
        )
    wb.save(caminho)


def selftest():
    with tempfile.TemporaryDirectory(prefix="tea-f0-selftest-") as tmp:
        raiz = Path(tmp)
        fontes = raiz / "fontes"
        criar_fontes_sinteticas(fontes)
        registros_todos, manifesto = ler_diretorio_fontes(fontes)
        incluidos, mantidas, descartadas = preparar_universo(registros_todos)
        dados, auditoria = construir_dados(
            registros_todos,
            incluidos,
            manifesto,
            mantidas,
            descartadas,
            CORTE_PADRAO,
        )
        matriz = raiz / "Matriz_Analitica_2025_sintetica.xlsx"
        criar_matriz_sintetica(matriz, registros_todos)
        reconciliacao = reconciliar_matriz(matriz, registros_todos)
        dados["meta"]["matriz_2025"] = reconciliacao
        texto = validar_saida(
            dados, auditoria, reconciliacao, exigir_referencias=False
        )

        global_audit = auditoria["recortes"]["tudo"]
        exigir_teste(len(manifesto) == 19, "não leu 19 fontes")
        exigir_teste(len(mantidas) == 17, "não manteve 17 terapias")
        exigir_teste(
            len(descartadas) == 1
            and descartadas[0]["id"] == ID_PECS
            and descartadas[0]["competencias_encontradas"] == 13,
            "cobertura/descarte de PECS incorreto",
        )
        exigir_teste(
            global_audit["metricas"]["n_pacientes"] == 13,
            "deduplicação Nome+Nascimento incorreta ou adulto excluído",
        )
        exigir_teste(
            global_audit["prestadores_observados"]
            == global_audit["prestadores_consolidados"] + 1,
            "merge do par de CNPJ não foi aplicado uma única vez",
        )
        at = dados["meta"]["excecao_at"]
        exigir_teste(
            at["prestador"] == PEDIAKIDS
            and at["terapia_destino"] == "Terapia ABA — Psicologia"
            and at["sessoes"] is not None,
            "exceção AT não ficou rastreável",
        )
        exigir_teste(
            global_audit["metricas"]["sessoes_pagas"]
            < global_audit["metricas"]["sessoes"],
            "sessões com pagamento zero não saíram do denominador",
        )
        denominador_teste = metricas_exatas(
            [
                {"paciente": ("A", "2020-01-01"), "qtd": Decimal("2"),
                 "valor": Decimal("-10")},
                {"paciente": ("B", "2020-01-01"), "qtd": Decimal("3"),
                 "valor": Decimal("0")},
            ]
        )
        exigir_teste(
            denominador_teste["sessoes_pagas"] == Decimal("2"),
            "denominador deve excluir somente pagamento zero",
        )
        exigir_teste(
            len(dados["meta"]["periodos"]) == 30
            and {
                p["tipo"] for p in dados["meta"]["periodos"]
            } == {"tudo", "ano", "semestre", "trimestre", "mes"},
            "períodos permitidos incompletos",
        )
        raro = next(
            x for x in dados["recortes"]["tudo"]["prestadores"]
            if x["nome"] == "PRESTADOR RARO LTDA"
        )
        exigir_teste(
            raro["pacientes"] == 1
            and raro["pagamento"] is not None
            and raro["sessoes"] is not None,
            "prestador raro não permaneceu exato no artefato privado",
        )
        exigir_teste(
            reconciliacao["campos_comparados"] > 0
            and reconciliacao["status"] == "reconciliada",
            "Matriz sintética não reconciliou",
        )

        # Contrato v5: consolidação da Casa Unimed, disciplina × canal e kits.
        recorte_tudo = dados["recortes"]["tudo"]
        resumo_tudo = recorte_tudo["resumo"]
        casa = next(
            (x for x in recorte_tudo["prestadores"] if x["nome"] == CASA_UNIMED),
            None,
        )
        exigir_teste(
            casa is not None and casa.get("composicao"),
            "entidade CASA UNIMED ausente ou sem composição",
        )
        exigir_teste(
            casa["canais"] == [CANAL_CASA_UNIMED]
            and casa["quantidade_entidades"] == len(casa["composicao"]) == 16
            and resumo_tudo["profissionais_casa_unimed"] == 16,
            "composição da Casa Unimed deve consolidar 16 profissionais",
        )
        exigir_teste(
            sum(
                (Decimal(str(p["sessoes"])) for p in casa["composicao"]),
                Decimal(0),
            )
            == Decimal(str(casa["sessoes"])),
            "composição da Casa Unimed não soma as sessões da entidade",
        )
        item_misto = next(
            x for x in recorte_tudo["prestadores"]
            if x["nome"] == NOME_MERGE_CNPJ
        )
        exigir_teste(
            NOME_MERGE_CNPJ in {p["nome"] for p in casa["composicao"]}
            and CANAL_CASA_UNIMED not in item_misto["canais"],
            "caso misto: profissional deve estar na composição da Casa e "
            "permanecer individual sem o canal Casa Unimed",
        )
        exigir_teste(
            CASA_UNIMED in recorte_tudo["serie_prestador"],
            "serie_prestador deve conter CASA UNIMED",
        )
        exigir_teste(
            resumo_tudo["prestadores_publicados"]
            == resumo_tudo["prestadores_consolidados"] + 1
            == len(recorte_tudo["prestadores"]),
            "entidades publicadas devem ser consolidados + 1 na fixture",
        )
        registro_casa = next(
            r for r in incluidos if r["tipo_prest"] == TIPO_CASA_UNIMED
        )
        exigir_teste(
            rede_matriz(registro_casa) == "Rede própria"
            and registro_casa["prest_entidade"] == CASA_UNIMED,
            "rede_matriz e prest_entidade devem coexistir sem derivar um do outro",
        )
        solicitante_raro = next(
            x for x in recorte_tudo["solicitantes"]["itens"]
            if x["nome"] == "SOLICITANTE RARO"
        )
        exigir_teste(
            {e["nome"] for e in solicitante_raro["executores"]}
            == {CASA_UNIMED, PEDIAKIDS, "PRESTADOR RARO LTDA"},
            "executores do solicitante raro devem consolidar a Casa Unimed",
        )
        exigir_teste(
            any(
                fatia["nome"] == CASA_UNIMED
                for fatia in recorte_tudo["prestador_disciplina"]
            ),
            "prestador_disciplina deve conter fatias da entidade CASA UNIMED",
        )
        exigir_teste(
            recorte_tudo["referencias"]["preco_disciplina"][DISC_TO]["n"] == 6,
            "referências devem permanecer na granularidade profissional",
        )
        canal_casa = next(
            x for x in recorte_tudo["canais"] if x["canal"] == CANAL_CASA_UNIMED
        )
        exigir_teste(
            canal_casa["prestadores"] == 1 and canal_casa["profissionais"] == 16,
            "canal Casa Unimed deve contar 1 entidade e 16 profissionais",
        )
        exigir_teste(
            set(recorte_tudo["disciplina_canais"])
            == set(recorte_tudo["resumo_disciplina"])
            == set(recorte_tudo["disciplina_serie"])
            == set(recorte_tudo["pacientes_disciplina"]),
            "disciplinas divergentes entre os agregados por disciplina",
        )
        exigir_teste(
            all(
                {CANAL_CASA_UNIMED, "Rede Credenciada"}
                <= {x["canal"] for x in itens}
                for itens in recorte_tudo["disciplina_canais"].values()
            ),
            "disciplina_canais deve cobrir Casa Unimed e Rede Credenciada",
        )
        exigir_teste(
            recorte_tudo["resumo_disciplina"][DISC_PSI]["pacientes"] == 13
            and recorte_tudo["resumo_disciplina"][DISC_FONO]["pacientes"] == 11,
            "crianças únicas por disciplina divergem da fixture",
        )
        kits = recorte_tudo["kits"]
        exigir_teste(
            set(kits) == {"tripe", "tripe-ampliado"},
            "kits publicados devem ser tripé (k==5) e tripé ampliado (k==6)",
        )
        tripe = kits["tripe"]
        exigir_teste(
            tripe["criancas"] == 5
            and kits["tripe-ampliado"]["criancas"] == 6
            and tripe["crianca_meses"] == 90
            and tripe["sessoes"] == 270,
            "coorte do kit tripé diverge da fixture",
        )
        exigir_teste(
            tripe["custo_crianca_mes"]
            == dinheiro(Decimal(str(tripe["pagamento"])) / Decimal(90))
            and [x["canal"] for x in tripe["canais"]] == ["Rede Credenciada"]
            and tripe["canais"][0]["pagamento"] == tripe["pagamento"],
            "métricas do kit tripé incoerentes",
        )
        valores_guarda = [
            "2025/01", "MAT-GUARDA", "CRIANCA GUARDA", date(2015, 1, 1),
            "FEMININO", "GUIA-GUARDA", date(2025, 1, 15), "SOL-GUARDA",
            "SOLICITANTE GUARDA", "Psicologo clinico", "SPSADT",
            50005103, "PROCEDIMENTO GUARDA", "SESSAO", "PREST-GUARDA",
            "RESINTO ESPACO INTEGRADO LTDA", "ATENDIMENTO ESPECIALIZADO",
            1, 100,
        ]
        try:
            normalizar_registro(valores_guarda, Path("fixture-guarda.xlsx"), 2)
        except ErroPipeline:
            pass
        else:
            raise ErroPipeline(
                "selftest: guarda de coerência da Casa Unimed não bloqueou"
            )
        exigir_teste(
            "CRIANCA SINTETICA" not in texto,
            "nome sintético vazou no JSON",
        )
        exigir_teste(
            primeiro_padrao_encontrado("JOAO DA SILVA", {"JOÃO DA SILVA"}),
            "anti-vazamento não normalizou acentos",
        )
        exigir_teste('"<5"' not in texto, "artefato privado contém máscara <5")
        exigir_teste(
            "OUTROS PRESTADORES" not in texto
            and "OUTRAS TERAPIAS" not in texto
            and "OUTROS SOLICITANTES" not in texto
            and "OUTRAS COMBINACOES" not in texto,
            "artefato privado contém agrupamento OUTROS",
        )
        exigir_teste(
            not valores_equivalentes(
                Decimal("100.01"), Decimal("100.00"), "Pagamento"
            ),
            "reconciliação monetária aceitou diferença de um centavo",
        )
        try:
            validar_anti_vazamento(
                "CRIANCA SINTETICA 1", registros_todos
            )
        except ErroPipeline:
            pass
        else:
            raise ErroPipeline("selftest: mutação anti-vazamento não foi bloqueada")

        falso_git = raiz / "falso-git"
        falso_git.mkdir()
        (falso_git / ".git").mkdir()
        arquivo_interno = falso_git / "fonte.xlsx"
        arquivo_interno.write_bytes(b"fixture")
        try:
            exigir_fora_de_git(arquivo_interno, "fixture")
        except ErroPipeline:
            pass
        else:
            raise ErroPipeline("selftest: insumo dentro de Git não foi bloqueado")

        try:
            exigir_saida_fora_de_git(falso_git / "saida.json")
        except ErroPipeline:
            pass
        else:
            raise ErroPipeline("selftest: saída dentro de Git não foi bloqueada")

        try:
            exigir_saida_fora_de_git(REPO_ROOT / "saida-privada-teste.json")
        except ErroPipeline:
            pass
        else:
            raise ErroPipeline("selftest: saída dentro do repo não foi bloqueada")

        saida_privada = exigir_saida_fora_de_git(raiz / "saida-privada.json")
        escrita_atomica(saida_privada, texto + "\n")
        exigir_teste(
            json.loads(saida_privada.read_text(encoding="utf-8")) == dados,
            "artefato privado gravado diverge do objeto validado",
        )

        # Uma falha na segunda troca deve restaurar a primeira saída.
        saida_a, saida_b = raiz / "saida-a.txt", raiz / "saida-b.txt"
        saida_a.write_text("anterior-a", encoding="utf-8")
        saida_b.write_text("anterior-b", encoding="utf-8")
        escrita_real = globals()["escrita_atomica"]

        def escrita_com_falha(caminho, conteudo):
            if Path(caminho) == saida_b:
                raise OSError("falha sintética na segunda troca")
            return escrita_real(caminho, conteudo)

        globals()["escrita_atomica"] = escrita_com_falha
        try:
            try:
                escrita_atomica_multipla(
                    [(saida_a, "nova-a"), (saida_b, "nova-b")]
                )
            except OSError:
                pass
            else:
                raise ErroPipeline("selftest: falha sintética de escrita não ocorreu")
        finally:
            globals()["escrita_atomica"] = escrita_real
        exigir_teste(
            saida_a.read_text(encoding="utf-8") == "anterior-a"
            and saida_b.read_text(encoding="utf-8") == "anterior-b",
            "rollback não restaurou o par de saídas",
        )

        # ---- Janela estendida: base congelada + bloco complementar ----
        def exigir_erro(funcao, trecho, mensagem):
            try:
                funcao()
            except ErroPipeline as exc:
                exigir_teste(
                    trecho in str(exc), f"{mensagem} (mensagem inesperada)"
                )
            else:
                raise ErroPipeline(f"selftest: {mensagem}")
            exigir_teste(
                FIM_CANONICO == FIM_BASE and len(MESES_CANONICOS) == 18,
                "janela não voltou ao período-base após erro",
            )

        corte_ext = ultimo_dia("2026/09")
        bloco = raiz / "blocos" / "bloco-sintetico-072026-102026.xlsx"
        criar_bloco_sintetico(
            bloco, ("2026/07", "2026/08", "2026/09", "2026/10")
        )
        dados_base, _a, _r, texto_base, extensao_base = montar_release(
            fontes, matriz, corte_ext, exigir_referencias=False
        )
        exigir_teste(
            extensao_base is None
            and len(dados_base["meta"]["periodos"]) == 30
            and dados_base["meta"]["blocos_fonte"] == []
            and dados_base["meta"]["periodo_canonico"]
            == dados_base["meta"]["periodo_base"],
            "build sem blocos deve publicar exatamente o período-base",
        )
        dados_ext, auditoria_ext, _r, texto_ext, extensao = montar_release(
            fontes, matriz, None, [bloco], "2026/09", exigir_referencias=False
        )
        meta_ext = dados_ext["meta"]
        ids_ext = [p["id"] for p in meta_ext["periodos"]]
        exigir_teste(
            FIM_CANONICO == FIM_BASE and len(MESES_CANONICOS) == 18,
            "janela não voltou ao período-base após o build estendido",
        )
        exigir_teste(
            len(ids_ext) == 35
            and set(ids_ext) == set(dados_ext["recortes"])
            and {
                "mes-2026-07", "mes-2026-08", "mes-2026-09",
                "trimestre-2026-T3", "semestre-2026-S2",
            } <= set(ids_ext)
            and "mes-2026-10" not in ids_ext,
            "janela estendida deve gerar 35 recortes até 2026/09",
        )
        exigir_teste(
            meta_ext["periodo_canonico"]
            == {"inicio": "2025/01", "fim": "2026/09", "competencias": 21}
            and meta_ext["periodo_base"]
            == {"inicio": "2025/01", "fim": "2026/06", "competencias": 18}
            and meta_ext["data_corte_idade"] == "2026-09-30",
            "período publicado, período-base ou corte etário incorretos",
        )
        exigir_teste(
            extensao["recortes_base_conferidos"] == 28
            and meta_ext["manifesto_fontes"]
            == dados_base["meta"]["manifesto_fontes"],
            "extensão deve conferir 28 recortes fechados e manter o manifesto",
        )
        semestre_parcial = next(
            p for p in meta_ext["periodos"] if p["id"] == "semestre-2026-S2"
        )
        ano_corrente = next(
            p for p in meta_ext["periodos"] if p["id"] == "ano-2026"
        )
        exigir_teste(
            len(semestre_parcial["meses"]) == 3
            and len(ano_corrente["meses"]) == 9
            and len(dados_ext["recortes"]["tudo"]["serie_mensal"]) == 21,
            "períodos parciais ou série completa com meses incorretos",
        )
        descarte_ext = meta_ext["terapias_descartadas"]
        exigir_teste(
            len(meta_ext["terapias"]) == 17
            and len(descarte_ext) == 1
            and descarte_ext[0]["id"] == ID_PECS
            and descarte_ext[0]["competencias_encontradas"] == 13
            and descarte_ext[0]["competencias_esperadas"] == 18
            and descarte_ext[0]["registros_pos_base"] == 6
            and descarte_ext[0]["sessoes_pos_base"] == 6
            and descarte_ext[0]["pagamento_pos_base"]
            == 6.0 * (120 + list(MAPA_CODIGOS).index("50005146"))
            and descarte_ext[0]["competencias_pos_base"] == ["2026/07"]
            and "período-base" in descarte_ext[0]["motivo"],
            "conjunto de terapias deve permanecer o da base, com PECS fora",
        )
        exigir_teste(
            auditoria_ext["recortes"]["tudo"]["metricas"]["n_pacientes"] == 14
            and dados_ext["recortes"]["mes-2026-09"]["resumo"]["pacientes"] == 14
            and dados_ext["recortes"]["ano-2025"]["resumo"]["pacientes"] == 13,
            "criança nova do bloco, nascimento em texto ou competência além "
            "da janela contados de forma incorreta",
        )
        sem_movimento = next(
            t for t in dados_ext["recortes"]["mes-2026-09"]["terapias"]
            if CODIGO_SEM_MOVIMENTO in t["codigos"]
        )
        exigir_teste(
            sem_movimento["pacientes"] == 0
            and sem_movimento["sessoes"] == 0
            and sem_movimento["pagamento"] == 0.0
            and sem_movimento["custo_sessao"] is None
            and len(dados_ext["recortes"]["mes-2026-09"]["terapias"]) == 17,
            "terapia mantida sem lançamentos no mês deve aparecer zerada",
        )
        bloco_meta = meta_ext["blocos_fonte"]
        exigir_teste(
            len(bloco_meta) == 1
            and bloco_meta[0]["arquivo"] == bloco.name
            and bloco_meta[0]["competencias_na_janela"]
            == ["2026/07", "2026/08", "2026/09"]
            and bloco_meta[0]["registros"] > bloco_meta[0]["registros_na_janela"]
            and extensao["registros_fora_da_janela"]
            == bloco_meta[0]["registros"] - bloco_meta[0]["registros_na_janela"],
            "manifesto do bloco complementar incorreto",
        )
        exigir_teste(
            bloco_meta[0]["sem_nascimento"]
            == {
                "registros": 2,
                "recuperados": 1,
                "fora_do_painel": 1,
                "sessoes_fora_do_painel": 1,
                "pagamento_fora_do_painel": 77.0,
                "competencias": ["2026/07", "2026/08"],
            },
            "registros sem data de nascimento tratados de forma incorreta",
        )
        sem_lancamento = sorted(
            CATALOGO_TERAPIAS[MAPA_CODIGOS[codigo]["id"]]["terapia"]
            for codigo in (CODIGO_SEM_MOVIMENTO, CODIGO_DISCIPLINA_SEM_MOVIMENTO)
        )
        exigir_teste(
            meta_ext["competencias_novas"]
            == [
                {
                    "m": "2026/07", "criancas": 14, "ja_vistas": 13,
                    "grafia_divergente": 0, "terapias_sem_lancamento": [],
                },
                {
                    "m": "2026/08", "criancas": 14, "ja_vistas": 14,
                    "grafia_divergente": 0, "terapias_sem_lancamento": [],
                },
                {
                    "m": "2026/09", "criancas": 14, "ja_vistas": 14,
                    "grafia_divergente": 0,
                    "terapias_sem_lancamento": sem_lancamento,
                },
            ]
            and extensao["corte"] == "2026-09-30",
            "continuidade ou terapias sem lançamento das competências novas "
            "incorretas",
        )
        exigir_teste(
            bloco_meta[0]["registros_na_janela"] == 374
            and bloco_meta[0]["registros_agregados"] == 367
            and bloco_meta[0]["registros_terapia_descartada"] == 6
            and len(bloco_meta[0]["codigos"]) == 19,
            "fechamento do bloco (agregados + terapia descartada + sem data "
            "de nascimento) incorreto",
        )
        disciplina_parada = MAPA_CODIGOS[CODIGO_DISCIPLINA_SEM_MOVIMENTO][
            "especialidade"
        ]
        recorte_agosto = dados_ext["recortes"]["mes-2026-08"]
        recorte_setembro = dados_ext["recortes"]["mes-2026-09"]
        exigir_teste(
            all(
                disciplina_parada in recorte_agosto[chave]
                and disciplina_parada not in recorte_setembro[chave]
                for chave in (
                    "resumo_disciplina", "disciplina_canais",
                    "disciplina_serie", "pacientes_disciplina",
                )
            )
            and not any(
                fatia["disciplina"] == disciplina_parada
                for fatia in recorte_setembro["prestador_disciplina"]
            ),
            "disciplina sem lançamento deve sair dos cortes por disciplina "
            "do recorte, sem levar junto as demais",
        )

        # Nomes em outro formato: as mesmas crianças contariam como novas.
        nomes = [p["nome"] for p in pacientes_sinteticos(15)]
        bloco_formato = raiz / "blocos" / "bloco-nomes-em-outro-formato.xlsx"
        criar_bloco_sintetico(
            bloco_formato,
            ("2026/07", "2026/08", "2026/09"),
            renomear={i: nome.replace(" ", "  ") for i, nome in enumerate(nomes)},
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_formato], "2026/09",
                exigir_referencias=False,
            ),
            "competência 2026/07: só 0 de 14 crianças já apareciam",
            "nomes em formato diferente do da base não foram bloqueados",
        )
        bloco_acentos = raiz / "blocos" / "bloco-grafia-em-volume.xlsx"
        criar_bloco_sintetico(
            bloco_acentos,
            ("2026/07", "2026/08", "2026/09"),
            renomear={
                i: nomes[i].replace("CRIANCA", "CRIANÇA") for i in range(6, 12)
            },
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_acentos], "2026/09",
                exigir_referencias=False,
            ),
            "competência 2026/07: 6 crianças só diferem de crianças já vistas",
            "grafia divergente em volume não foi bloqueada",
        )
        bloco_grafia = raiz / "blocos" / "bloco-grafia.xlsx"
        criar_bloco_sintetico(
            bloco_grafia,
            ("2026/07", "2026/08", "2026/09"),
            renomear={4: nomes[4].replace("CRIANCA", "CRIANÇA")},
        )
        dados_grafia, _ag, _rg, _tg, _eg = montar_release(
            fontes, matriz, None, [bloco_grafia], "2026/09",
            exigir_referencias=False,
        )
        exigir_teste(
            [
                (c["ja_vistas"], c["grafia_divergente"])
                for c in dados_grafia["meta"]["competencias_novas"]
            ]
            == [(12, 1), (14, 0), (14, 0)]
            and dados_grafia["recortes"]["tudo"]["resumo"]["pacientes"] == 15,
            "criança com grafia divergente deve ser contada como nova e "
            "informada",
        )

        # Dois blocos, informados fora de ordem: 2026 completo.
        bloco_q3 = raiz / "blocos" / "bloco-q3.xlsx"
        bloco_q4 = raiz / "blocos" / "bloco-q4.xlsx"
        criar_bloco_sintetico(bloco_q3, ("2026/07", "2026/08", "2026/09"))
        criar_bloco_sintetico(bloco_q4, ("2026/10", "2026/11", "2026/12"))
        dados_ano, _aa, _ra, _ta, extensao_ano = montar_release(
            fontes, matriz, None, [bloco_q4, bloco_q3], "2026/12",
            exigir_referencias=False,
        )
        ano_2026 = next(
            p for p in dados_ano["meta"]["periodos"] if p["id"] == "ano-2026"
        )
        exigir_teste(
            len(dados_ano["meta"]["periodos"]) == 39
            and len(ano_2026["meses"]) == 12
            and [b["arquivo"] for b in dados_ano["meta"]["blocos_fonte"]]
            == [bloco_q3.name, bloco_q4.name]
            and dados_ano["meta"]["data_corte_idade"] == "2026-12-31"
            and extensao_ano["recortes_base_conferidos"] == 28
            and dados_ano["meta"]["terapias_descartadas"][0]["registros_pos_base"]
            == 12
            and [c["m"] for c in dados_ano["meta"]["competencias_novas"]]
            == list(sequencia_meses("2026/07", "2026/12")),
            "dois blocos devem compor 2026 completo em ordem de competência",
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_q3, bloco_q4], "2026/09",
                exigir_referencias=False,
            ),
            f"{bloco_q4.name}: nenhuma competência do bloco entra na janela "
            "publicada (até 2026/09); retire o bloco ou ajuste --ate",
            "bloco inteiro além da janela não foi bloqueado",
        )
        # Competência repetida: vale a do bloco mais recente (começa no mesmo
        # mês ou depois e termina depois).
        # O bloco 07–10 foi publicado até 2026/09; a planilha seguinte começa
        # em 2026/10 e fica com esse mês, em qualquer ordem de comando.
        dados_sobre, _as, _rs, texto_sobre, extensao_sobre = montar_release(
            fontes, matriz, None, [bloco, bloco_q4], "2026/12",
            exigir_referencias=False,
        )
        _di, _ai, _ri, texto_inverso, _ei = montar_release(
            fontes, matriz, None, [bloco_q4, bloco], "2026/12",
            exigir_referencias=False,
        )
        exigir_teste(
            texto_sobre == texto_inverso,
            "a ordem dos blocos na linha de comando alterou o release",
        )
        cedente = dados_sobre["meta"]["blocos_fonte"][0]
        exigir_teste(
            dados_sobre["recortes"] == dados_ano["recortes"]
            and cedente["arquivo"] == bloco.name
            and cedente["competencias_cedidas"] == ["2026/10"]
            and cedente["cedidas_a"] == [bloco_q4.name]
            and cedente["competencias_na_janela"]
            == ["2026/07", "2026/08", "2026/09"]
            and cedente["registros_cedidos"]
            == cedente["registros"] - cedente["registros_na_janela"]
            and dados_sobre["meta"]["blocos_fonte"][1]["registros_cedidos"] == 0
            and extensao_sobre["registros_fora_da_janela"] == 0,
            "competência repetida deve ficar com o bloco mais recente",
        )
        relatorio_sobre = io.StringIO()
        with contextlib.redirect_stdout(relatorio_sobre):
            imprimir_relatorio(
                dados_sobre, _as, _rs, raiz / "nao-gravado.json", extensao_sobre
            )
        exigir_teste(
            f"registros de 2026/10 cedidos a {bloco_q4.name} "
            "(2026/10 a 2026/12)" in relatorio_sobre.getvalue(),
            "relatório não nomeou o bloco que ficou com a competência cedida",
        )
        # Registros além da janela, inclusive uma data de nascimento que só
        # aparece em 2026/10, não alteram os meses publicados.
        dados_q3, _aq, _rq, _tq, _eq = montar_release(
            fontes, matriz, None, [bloco_q3], "2026/09",
            exigir_referencias=False,
        )
        exigir_teste(
            dados_q3["recortes"] == dados_ext["recortes"]
            and dados_q3["meta"]["blocos_fonte"][0]["sem_nascimento"]
            == bloco_meta[0]["sem_nascimento"],
            "registro além da janela alterou competência publicada",
        )
        exigir_teste(
            dados_ano["meta"]["blocos_fonte"][1]["sem_nascimento"]["recuperados"]
            == 2
            and dados_ano["meta"]["blocos_fonte"][0]["sem_nascimento"][
                "fora_do_painel"
            ] == 1,
            "data de nascimento deve valer da competência em que aparece em "
            "diante, nunca para trás",
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [raiz / "blocos" / "nao-existe.xlsx"],
                "2026/09", exigir_referencias=False,
            ),
            "bloco complementar não encontrado: nao-existe.xlsx",
            "bloco inexistente não foi barrado antes do build da base",
        )
        # Planilha baixada pela metade ou protegida por senha (contêiner que
        # não é zip): erro claro, sem traceback, antes do build da base.
        bloco_truncado = raiz / "blocos" / "bloco-baixado-pela-metade.xlsx"
        bloco_truncado.write_bytes(bloco.read_bytes()[:3000])
        bloco_com_senha = raiz / "blocos" / "bloco-com-senha.xlsx"
        bloco_com_senha.write_bytes(bytes.fromhex("d0cf11e0a1b11ae1") + b"\0" * 4096)
        # Pacote que abre e se estraga no meio da aba (diretório intacto), e
        # pacote zip que não é pasta de trabalho (um .docx renomeado).
        def maior_aba(arquivo):
            with zipfile.ZipFile(arquivo) as pacote:
                return max(
                    (
                        i for i in pacote.infolist()
                        if i.filename.startswith("xl/worksheets/")
                    ),
                    key=lambda i: i.compress_size,
                )

        def estragar_por_dentro(arquivo, destino):
            # Inverte 64 bytes no meio do fluxo comprimido da maior aba; o
            # diretório do zip fica intacto.
            bruto = bytearray(arquivo.read_bytes())
            aba = maior_aba(arquivo)
            inicio = (
                aba.header_offset + 30 + len(aba.filename.encode())
                + len(aba.extra)
            )
            meio = inicio + aba.compress_size // 2
            bruto[meio:meio + 64] = bytes(b ^ 0xFF for b in bruto[meio:meio + 64])
            destino.write_bytes(bytes(bruto))

        def regravar_cortando(arquivo, destino, membro):
            # Mesmo pacote, com um membro cortado pela metade: zip íntegro,
            # XML malformado.
            with zipfile.ZipFile(arquivo) as origem, zipfile.ZipFile(
                destino, "w", zipfile.ZIP_DEFLATED
            ) as saida:
                for item in origem.infolist():
                    conteudo = origem.read(item.filename)
                    if item.filename == membro:
                        conteudo = conteudo[: len(conteudo) // 2]
                    saida.writestr(item.filename, conteudo)

        def estragar_fluxo(arquivo, destino, membro):
            # Primeiro byte do fluxo comprimido do membro vira 0xFF: tipo de
            # bloco inválido, erro de descompressão já na primeira leitura.
            bruto = bytearray(arquivo.read_bytes())
            with zipfile.ZipFile(arquivo) as pacote:
                item = pacote.getinfo(membro)
            inicio = (
                item.header_offset + 30 + len(item.filename.encode())
                + len(item.extra)
            )
            bruto[inicio] = 0xFF
            destino.write_bytes(bytes(bruto))

        def levanta_erro_de_descompressao(arquivo, membro):
            try:
                with zipfile.ZipFile(arquivo) as pacote:
                    pacote.read(membro)
            except zlib.error:
                return True
            except zipfile.BadZipFile:
                return False
            return False

        bloco_estragado = raiz / "blocos" / "bloco-estragado-por-dentro.xlsx"
        estragar_por_dentro(bloco, bloco_estragado)
        bloco_fluxo = raiz / "blocos" / "bloco-com-fluxo-invalido.xlsx"
        estragar_fluxo(bloco, bloco_fluxo, "docProps/core.xml")
        exigir_teste(
            levanta_erro_de_descompressao(bloco_fluxo, "docProps/core.xml"),
            "a planilha de teste devia levantar erro de descompressão",
        )
        bloco_docx = raiz / "blocos" / "documento-renomeado.xlsx"
        with zipfile.ZipFile(bloco_docx, "w") as pacote:
            pacote.writestr("[Content_Types].xml", "<Types/>")
            pacote.writestr("word/document.xml", "<document/>")
        sem_fontes = raiz / "pasta-sem-fontes"
        sem_fontes.mkdir()
        for ilegivel in (
            bloco_truncado, bloco_com_senha, bloco_estragado, bloco_fluxo,
            bloco_docx,
        ):
            exigir_erro(
                lambda ilegivel=ilegivel: montar_release(
                    fontes, matriz, None, [ilegivel], "2026/09",
                    exigir_referencias=False,
                ),
                f"{ilegivel.name}: não é uma planilha .xlsx legível",
                "bloco ilegível não foi barrado com mensagem clara",
            )
            # antes da leitura da base: a pasta de fontes vazia nem é olhada
            exigir_erro(
                lambda ilegivel=ilegivel: montar_release(
                    sem_fontes, matriz, None, [ilegivel], "2026/09",
                    exigir_referencias=False,
                ),
                f"{ilegivel.name}: não é uma planilha .xlsx legível",
                "bloco ilegível só foi barrado depois da leitura da base",
            )
            # como fonte da base, o mesmo arquivo dá a mesma mensagem
            exigir_erro(
                lambda ilegivel=ilegivel: ler_registros_xlsx(ilegivel, "base"),
                f"{ilegivel.name}: não é uma planilha .xlsx legível",
                "fonte ilegível não virou erro claro",
            )
        # Pacote íntegro como zip, com XML interno malformado (planilha gravada
        # com defeito): a conferência do zip não vê; a leitura para com a
        # mesma mensagem, como fonte da base e como bloco.
        for nome, membro in (
            ("bloco-com-aba-malformada.xlsx", maior_aba(bloco).filename),
            ("bloco-com-pasta-malformada.xlsx", "xl/workbook.xml"),
        ):
            malformado = raiz / "blocos" / nome
            regravar_cortando(bloco, malformado, membro)
            exigir_teste(
                pacote_integro(malformado),
                "o pacote com XML malformado deveria estar íntegro como zip",
            )
            for origem_dos_dados in ("base", "bloco"):
                exigir_erro(
                    lambda malformado=malformado, origem_dos_dados=origem_dos_dados: (
                        ler_registros_xlsx(malformado, origem_dos_dados)
                    ),
                    f"{nome}: não é uma planilha .xlsx legível",
                    "planilha com XML interno malformado não virou erro claro",
                )
        # Pasta de trabalho malformada é barrada antes da leitura da base.
        exigir_erro(
            lambda: montar_release(
                sem_fontes, matriz, None,
                [raiz / "blocos" / "bloco-com-pasta-malformada.xlsx"],
                "2026/09", exigir_referencias=False,
            ),
            "bloco-com-pasta-malformada.xlsx: não é uma planilha .xlsx legível",
            "bloco com a pasta de trabalho malformada só foi barrado depois "
            "da leitura da base",
        )
        # Planilha válida cuja pasta de trabalho tem outro nome interno não é
        # recusada: quem decide é a abertura, não o nome do membro.
        bloco_outro_nome = raiz / "blocos" / "bloco-com-outro-nome-interno.xlsx"
        with zipfile.ZipFile(bloco) as origem, zipfile.ZipFile(
            bloco_outro_nome, "w", zipfile.ZIP_DEFLATED
        ) as saida:
            for item in origem.infolist():
                conteudo = origem.read(item.filename)
                nome_interno = {
                    "xl/workbook.xml": "xl/pasta.xml",
                    "xl/_rels/workbook.xml.rels": "xl/_rels/pasta.xml.rels",
                }.get(item.filename, item.filename)
                if item.filename in ("_rels/.rels", "[Content_Types].xml"):
                    conteudo = conteudo.replace(b"xl/workbook.xml", b"xl/pasta.xml")
                saida.writestr(nome_interno, conteudo)

        def sem_arquivo(registros):
            return [
                {k: v for k, v in r.items() if k != "arquivo"} for r in registros
            ]

        exigir_teste(
            conferir_caminhos_blocos([bloco_outro_nome]) == [bloco_outro_nome]
            and sem_arquivo(ler_registros_xlsx(bloco_outro_nome, "bloco"))
            == sem_arquivo(ler_registros_xlsx(bloco, "bloco")),
            "planilha válida com outro nome interno da pasta de trabalho foi "
            "recusada ou lida diferente",
        )
        # Matriz ilegível: a mesma mensagem, com o nome dela.
        matriz_pela_metade = raiz / "matriz-baixada-pela-metade.xlsx"
        conteudo_matriz = matriz.read_bytes()
        matriz_pela_metade.write_bytes(conteudo_matriz[: len(conteudo_matriz) // 2])
        matriz_estragada = raiz / "matriz-estragada-por-dentro.xlsx"
        estragar_por_dentro(matriz, matriz_estragada)
        matriz_malformada = raiz / "matriz-com-aba-malformada.xlsx"
        regravar_cortando(matriz, matriz_malformada, maior_aba(matriz).filename)
        matriz_fluxo = raiz / "matriz-com-fluxo-invalido.xlsx"
        estragar_fluxo(matriz, matriz_fluxo, "docProps/core.xml")
        exigir_teste(
            levanta_erro_de_descompressao(matriz_fluxo, "docProps/core.xml"),
            "a Matriz de teste devia levantar erro de descompressão",
        )
        for ilegivel in (
            matriz_pela_metade, matriz_estragada, matriz_malformada, matriz_fluxo
        ):
            exigir_erro(
                lambda ilegivel=ilegivel: reconciliar_matriz(
                    ilegivel, registros_todos
                ),
                f"{ilegivel.name}: não é uma planilha .xlsx legível",
                "Matriz ilegível não virou erro claro",
            )
        fonte_truncada = raiz / "fonte-truncada" / "fonte-50005103.xlsx"
        fonte_truncada.parent.mkdir()
        fonte_truncada.write_bytes(
            (fontes / "fonte-50005103.xlsx").read_bytes()[:3000]
        )
        exigir_erro(
            lambda: ler_registros_xlsx(fonte_truncada, "base"),
            "fonte-50005103.xlsx: não é uma planilha .xlsx legível",
            "fonte ilegível não virou erro claro",
        )
        # Arquivo de trava do Excel e arquivo oculto de zip feito no Mac não
        # são fontes.
        fontes_com_ocultos = raiz / "fontes-com-ocultos"
        fontes_com_ocultos.mkdir()
        for fonte in fontes.iterdir():
            (fontes_com_ocultos / fonte.name).write_bytes(fonte.read_bytes())
        (fontes_com_ocultos / "._fonte-50005103.xlsx").write_bytes(b"\0\5\x16\7")
        (fontes_com_ocultos / "~$fonte-50005103.xlsx").write_bytes(b"trava")
        exigir_teste(
            [p.name for p in descobrir_fontes(fontes_com_ocultos)[1]]
            == [p.name for p in descobrir_fontes(fontes)[1]],
            "arquivo oculto na pasta das fontes foi contado como fonte",
        )
        exigir_teste(
            bloco_meta[0]["totais_lidos"]
            == [
                {"m": "2026/07", "registros": 133, "sessoes": 133,
                 "pagamento": 16946.0},
                {"m": "2026/08", "registros": 127, "sessoes": 127,
                 "pagamento": 16140.0},
                {"m": "2026/09", "registros": 114, "sessoes": 114,
                 "pagamento": 14527.0},
            ]
            and sum(t["registros"] for t in bloco_meta[0]["totais_lidos"])
            == bloco_meta[0]["registros_na_janela"],
            "totais lidos da planilha por competência incorretos",
        )
        # Dimensão declarada menor que a área usada: a leitura não pode parar.
        bloco_truncado = raiz / "blocos" / "bloco-dimensao-truncada.xlsx"
        with zipfile.ZipFile(bloco) as origem, zipfile.ZipFile(
            bloco_truncado, "w", zipfile.ZIP_DEFLATED
        ) as destino_zip:
            trocas = 0
            for item in origem.infolist():
                dados_item = origem.read(item.filename)
                if item.filename.startswith("xl/worksheets/"):
                    texto_xml = dados_item.decode("utf-8")
                    novo_xml = re.sub(
                        r'<dimension ref="[^"]*"', '<dimension ref="A1:S40"',
                        texto_xml,
                    )
                    trocas += novo_xml != texto_xml
                    dados_item = novo_xml.encode("utf-8")
                destino_zip.writestr(item, dados_item)
        exigir_teste(trocas == 1, "fixture de dimensão truncada não foi gerada")
        exigir_teste(
            len(ler_registros_xlsx(bloco_truncado, "bloco"))
            == bloco_meta[0]["registros"],
            "planilha com dimensão declarada menor foi lida pela metade",
        )
        # Bloco guardado na pasta das 19 fontes não conta como fonte.
        pasta_mista = raiz / "fontes-com-bloco"
        pasta_mista.mkdir()
        for fonte in fontes.iterdir():
            (pasta_mista / fonte.name).write_bytes(fonte.read_bytes())
        bloco_na_pasta = pasta_mista / bloco.name
        bloco_na_pasta.write_bytes(bloco.read_bytes())
        exigir_teste(
            len(descobrir_fontes(pasta_mista, None, [bloco_na_pasta])[1]) == 19,
            "bloco na pasta das fontes deveria ser ignorado na contagem",
        )
        exigir_erro(
            lambda: descobrir_fontes(pasta_mista),
            "encontradas 20",
            "arquivo estranho na pasta das fontes não foi bloqueado",
        )

        registros_julho = [
            r for r in auditoria_ext["registros_incluidos"]
            if r["anomes"] == "2026/07" and r["cod_proc"] == "50005103"
        ]
        exigir_teste(
            sum(1 for r in registros_julho if r["valor"] == Decimal("55")) == 1
            and all(r["nasc"] for r in auditoria_ext["registros_incluidos"])
            and "CRIANCA SEM NASCIMENTO" not in texto_ext,
            "data recuperada deve entrar na agregação; a irrecuperável, não",
        )
        bloco_ruim = raiz / "blocos" / "bloco-sem-nascimento.xlsx"
        criar_bloco_sintetico(
            bloco_ruim, ("2026/07", "2026/08", "2026/09"), sem_nascimento=6
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_ruim], "2026/09",
                exigir_referencias=False,
            ),
            "acima da tolerância de 5",
            "excesso de registros sem data de nascimento não foi bloqueado",
        )
        exigir_teste(
            any(
                x["nome"] == "PRESTADOR NOVO DO BLOCO LTDA"
                for x in dados_ext["recortes"]["tudo"]["prestadores"]
            )
            and not any(
                x["nome"] == "PRESTADOR NOVO DO BLOCO LTDA"
                for x in dados_ext["recortes"]["ano-2025"]["prestadores"]
            ),
            "prestador novo do bloco deve existir só nos recortes novos",
        )
        exigir_teste(
            "CRIANCA SINTETICA" not in texto_ext
            and "CRIANCA SINTETICA" not in texto_base,
            "nome sintético vazou no JSON da janela estendida",
        )
        mutado = copy.deepcopy(dados_ext)
        mutado["recortes"]["mes-2025-01"]["resumo"]["sessoes"] += 1
        exigir_erro(
            lambda: exigir_base_inalterada(dados_base, mutado),
            "mes-2025-01: resumo",
            "alteração em recorte fechado da base não foi bloqueada",
        )
        bloco_base = raiz / "blocos" / "bloco-com-base.xlsx"
        criar_bloco_sintetico(bloco_base, ("2026/06", "2026/07"))
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_base], "2026/07",
                exigir_referencias=False,
            ),
            "período-base",
            "bloco com competência do período-base não foi bloqueado",
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco, bloco], "2026/09",
                exigir_referencias=False,
            ),
            "mesmo nome",
            "bloco informado duas vezes não foi bloqueado",
        )
        bloco_copia = raiz / "blocos" / "bloco-sintetico-copia.xlsx"
        bloco_copia.write_bytes(bloco.read_bytes())
        for ordem in ([bloco, bloco_copia], [bloco_copia, bloco]):
            exigir_erro(
                lambda ordem=ordem: montar_release(
                    fontes, matriz, None, ordem, "2026/09",
                    exigir_referencias=False,
                ),
                "bloco-sintetico-072026-102026.xlsx (2026/07 a 2026/10) e "
                "bloco-sintetico-copia.xlsx (2026/07 a 2026/10) trazem a "
                "competência 2026/07 e não há como saber qual é a planilha "
                "mais recente",
                "blocos sem desempate não foram apontados, ou a mensagem "
                "depende da ordem de comando",
            )
        # Uma linha com a competência digitada errada estica o intervalo da
        # planilha antiga; ela não pode passar por mais recente que a nova —
        # nem contra a seguinte (09–12), nem contra a acumulada (07–12), que
        # começa no mesmo mês.
        bloco_esticado = raiz / "blocos" / "bloco-q3-com-mes-futuro.xlsx"
        criar_bloco_sintetico(
            bloco_esticado, ("2026/07", "2026/08", "2026/09", "2027/06"),
            escassas=("2027/06",),
        )
        bloco_seguinte = raiz / "blocos" / "bloco-092026-122026.xlsx"
        criar_bloco_sintetico(
            bloco_seguinte, ("2026/09", "2026/10", "2026/11", "2026/12")
        )
        bloco_acumulado = raiz / "blocos" / "bloco-072026-122026.xlsx"
        criar_bloco_sintetico(
            bloco_acumulado, tuple(sequencia_meses("2026/07", "2026/12"))
        )
        for ordem in (
            [bloco_esticado, bloco_seguinte], [bloco_seguinte, bloco_esticado],
            [bloco_esticado, bloco_acumulado], [bloco_esticado],
        ):
            exigir_erro(
                lambda ordem=ordem: montar_release(
                    fontes, matriz, None, ordem, "2026/12",
                    exigir_referencias=False,
                ),
                "bloco-q3-com-mes-futuro.xlsx: competências não contíguas "
                "(depois de 2026/09 vem 2027/06)",
                "planilha com competência isolada depois de uma lacuna foi aceita",
            )
        # Um arquivo que começa antes e termina depois do outro: o intervalo
        # não diz qual é o mais recente.
        bloco_meio = raiz / "blocos" / "bloco-082026-092026.xlsx"
        criar_bloco_sintetico(bloco_meio, ("2026/08", "2026/09"))
        for ordem in ([bloco_meio, bloco_acumulado], [bloco_acumulado, bloco_meio]):
            exigir_erro(
                lambda ordem=ordem: montar_release(
                    fontes, matriz, None, ordem, "2026/12",
                    exigir_referencias=False,
                ),
                "bloco-072026-122026.xlsx (2026/07 a 2026/12) e "
                "bloco-082026-092026.xlsx (2026/08 a 2026/09) trazem a "
                "competência 2026/08 e não há como saber qual é a planilha "
                "mais recente",
                "bloco contido em outro passou sem pedir decisão",
            )
        # Linha com o mês digitado errado VIZINHO do fim estica o intervalo em
        # um mês com volume ínfimo. Esse mês não conta: a planilha antiga não
        # passa por mais recente que a acumulada que a corrige, nem que a
        # reextração do mesmo período.
        bloco_q4_vizinho = raiz / "blocos" / "bloco-q4-com-linha-em-janeiro.xlsx"
        criar_bloco_sintetico(
            bloco_q4_vizinho, ("2026/10", "2026/11", "2026/12", "2027/01"),
            escassas=("2027/01",),
        )
        for ordem in (
            [bloco_q4_vizinho, bloco_acumulado],
            [bloco_acumulado, bloco_q4_vizinho],
        ):
            exigir_erro(
                lambda ordem=ordem: montar_release(
                    fontes, matriz, None, ordem, "2026/12",
                    exigir_referencias=False,
                ),
                "bloco-072026-122026.xlsx (2026/07 a 2026/12) e "
                "bloco-q4-com-linha-em-janeiro.xlsx (2026/10 a 2027/01) trazem "
                "a competência 2026/10 e não há como saber qual é a planilha "
                "mais recente (a mais recente começa no mesmo mês ou depois e "
                "termina depois; mês de borda com volume ínfimo não conta: "
                "2027/01 tem 1 registro em bloco-q4-com-linha-em-janeiro.xlsx",
                "linha avulsa em mês vizinho fez a planilha antiga passar por "
                "mais recente que a acumulada",
            )
        bloco_q3_vizinho = raiz / "blocos" / "bloco-q3-com-linha-em-outubro.xlsx"
        criar_bloco_sintetico(
            bloco_q3_vizinho, ("2026/07", "2026/08", "2026/09", "2026/10"),
            escassas=("2026/10",),
        )
        for ordem in ([bloco_q3_vizinho, bloco_q3], [bloco_q3, bloco_q3_vizinho]):
            exigir_erro(
                lambda ordem=ordem: montar_release(
                    fontes, matriz, None, ordem, "2026/09",
                    exigir_referencias=False,
                ),
                "bloco-q3.xlsx (2026/07 a 2026/09) e "
                "bloco-q3-com-linha-em-outubro.xlsx (2026/07 a 2026/10) trazem "
                "a competência 2026/07 e não há como saber qual é a planilha "
                "mais recente",
                "planilha com linha avulsa venceu a reextração do mesmo período",
            )
        # A acumulada de verdade (outubro inteiro) vence a planilha com a
        # linha avulsa, e a mensagem diz qual arquivo ficou com os meses.
        for ordem in ([bloco_q3_vizinho, bloco], [bloco, bloco_q3_vizinho]):
            exigir_erro(
                lambda ordem=ordem: montar_release(
                    fontes, matriz, None, ordem, "2026/09",
                    exigir_referencias=False,
                ),
                "bloco-q3-com-linha-em-outubro.xlsx: todas as competências do "
                "bloco vêm também de um bloco mais recente — "
                "bloco-sintetico-072026-102026.xlsx (2026/07 a 2026/10); "
                "confira se esse é mesmo o arquivo novo",
                "acumulada com o mês inteiro não venceu a planilha com linha "
                "avulsa, ou a mensagem não diz quem ficou com os meses",
            )
        # Contra a planilha seguinte (10–12), as linhas avulsas (a fixture
        # grava duas em outubro) são cedidas e apontadas no relatório.
        for ordem in ([bloco_q3_vizinho, bloco_q4], [bloco_q4, bloco_q3_vizinho]):
            dados_viz, auditoria_viz, reconc_viz, _tviz, extensao_viz = (
                montar_release(
                    fontes, matriz, None, ordem, "2026/12",
                    exigir_referencias=False,
                )
            )
            cedente_viz, dono_viz = dados_viz["meta"]["blocos_fonte"]
            relatorio_viz = io.StringIO()
            with contextlib.redirect_stdout(relatorio_viz):
                imprimir_relatorio(
                    dados_viz, auditoria_viz, reconc_viz,
                    raiz / "nao-gravado.json", extensao_viz,
                )
            exigir_teste(
                cedente_viz["arquivo"] == bloco_q3_vizinho.name
                and cedente_viz["competencias_cedidas"] == ["2026/10"]
                and cedente_viz["registros_cedidos"] == 2
                and cedente_viz["borda_fraca"] == [{"m": "2026/10", "registros": 2}]
                and dono_viz["borda_fraca"] == []
                and f"2 registros de 2026/10 cedidos a {bloco_q4.name} "
                "(2026/10 a 2026/12)" in relatorio_viz.getvalue()
                and "2026/10: só 2 registros — mês de borda com volume ínfimo"
                in relatorio_viz.getvalue(),
                "linhas avulsas em mês vizinho não foram cedidas e apontadas",
            )
        # Uma linha só, além da janela e depois cedida: o relatório concorda
        # no singular.
        bloco_2027 = raiz / "blocos" / "bloco-012027-032027.xlsx"
        criar_bloco_sintetico(bloco_2027, ("2027/01", "2027/02", "2027/03"))
        for blocos_do_caso, ate, esperados in (
            (
                [bloco_q3, bloco_q4_vizinho], "2026/12",
                (
                    "Além da janela         : 1 registro de blocos em "
                    "competências não publicadas",
                    "2027/01: só 1 registro — mês de borda com volume ínfimo",
                ),
            ),
            (
                [bloco_q3, bloco_q4_vizinho, bloco_2027], "2027/03",
                (
                    f"1 registro de 2027/01 cedido a {bloco_2027.name} "
                    "(2027/01 a 2027/03)",
                    "2027/01: só 1 registro — mês de borda com volume ínfimo",
                ),
            ),
        ):
            dados_um, auditoria_um, reconc_um, _tum, extensao_um = montar_release(
                fontes, matriz, None, blocos_do_caso, ate,
                exigir_referencias=False,
            )
            relatorio_um = io.StringIO()
            with contextlib.redirect_stdout(relatorio_um):
                imprimir_relatorio(
                    dados_um, auditoria_um, reconc_um,
                    raiz / "nao-gravado.json", extensao_um,
                )
            exigir_teste(
                all(trecho in relatorio_um.getvalue() for trecho in esperados),
                "relatório não apontou a linha avulsa no singular",
            )
        # Linhas avulsas no mês ANTERIOR ao começo (a fixture grava duas): o
        # mês fica com quem o traz de verdade, e elas são cedidas.
        bloco_inicio = raiz / "blocos" / "bloco-082026-102026-com-linha-em-julho.xlsx"
        criar_bloco_sintetico(
            bloco_inicio, ("2026/07", "2026/08", "2026/09", "2026/10"),
            escassas=("2026/07",),
        )
        for ordem in ([bloco_q3, bloco_inicio], [bloco_inicio, bloco_q3]):
            dados_ini = montar_release(
                fontes, matriz, None, ordem, "2026/10", exigir_referencias=False
            )[0]
            por_arquivo = {
                b["arquivo"]: b for b in dados_ini["meta"]["blocos_fonte"]
            }
            exigir_teste(
                por_arquivo[bloco_q3.name]["competencias_na_janela"] == ["2026/07"]
                and por_arquivo[bloco_q3.name]["competencias_cedidas"]
                == ["2026/08", "2026/09"]
                and por_arquivo[bloco_inicio.name]["competencias_na_janela"]
                == ["2026/08", "2026/09", "2026/10"]
                and por_arquivo[bloco_inicio.name]["competencias_cedidas"]
                == ["2026/07"]
                and por_arquivo[bloco_inicio.name]["registros_cedidos"] == 2
                and por_arquivo[bloco_inicio.name]["borda_fraca"]
                == [{"m": "2026/07", "registros": 2}]
                and por_arquivo[bloco_inicio.name]["parciais_cedidas"] == [],
                "linha avulsa no mês anterior ao começo tirou o mês de quem o "
                "traz inteiro",
            )
        # Fronteira dos 5%: último mês com 7 das 133 linhas do mês mais cheio
        # ainda conta, e a acumulada recém-aberta vence a anterior; com 6, não
        # conta, e o build pede decisão.
        bloco_sete = raiz / "blocos" / "bloco-072026-102026-outubro-com-7-linhas.xlsx"
        criar_bloco_sintetico(
            bloco_sete, ("2026/07", "2026/08", "2026/09", "2026/10"),
            rarefeitas={"2026/10": 20},
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_q3, bloco_sete], "2026/09",
                exigir_referencias=False,
            ),
            "bloco-q3.xlsx: todas as competências do bloco vêm também de um "
            "bloco mais recente — "
            "bloco-072026-102026-outubro-com-7-linhas.xlsx (2026/07 a 2026/10)",
            "último mês recém-aberto deixou de contar para o intervalo",
        )
        bloco_seis = raiz / "blocos" / "bloco-072026-102026-outubro-com-6-linhas.xlsx"
        criar_bloco_sintetico(
            bloco_seis, ("2026/07", "2026/08", "2026/09", "2026/10"),
            rarefeitas={"2026/10": 23},
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_q3, bloco_seis], "2026/09",
                exigir_referencias=False,
            ),
            "mês de borda com volume ínfimo não conta: 2026/10 tem 6 "
            "registros em bloco-072026-102026-outubro-com-6-linhas.xlsx",
            "último mês com menos de 5% das linhas do mês mais cheio contou "
            "para o intervalo",
        )
        from openpyxl import load_workbook as abrir_para_editar

        def aparar(caminho, linhas_por_competencia):
            """Deixa em cada competência só as primeiras N linhas."""
            planilha = abrir_para_editar(caminho)
            por_competencia = defaultdict(list)
            for indice, linha in enumerate(
                planilha.active.iter_rows(min_row=2), start=2
            ):
                por_competencia[linha[0].value].append(indice)
            sobram = sorted(
                (
                    indice
                    for competencia, manter in linhas_por_competencia.items()
                    for indice in por_competencia[competencia][manter:]
                ),
                reverse=True,
            )
            for indice in sobram:
                planilha.active.delete_rows(indice)
            planilha.save(caminho)

        # O limiar conta linhas, não sessões: as mesmas 6 linhas de outubro,
        # com dez sessões cada, continuam sendo mês de borda.
        bloco_seis_sessoes = (
            raiz / "blocos" / "bloco-072026-102026-outubro-com-6-linhas-de-10-sessoes.xlsx"
        )
        criar_bloco_sintetico(
            bloco_seis_sessoes, ("2026/07", "2026/08", "2026/09", "2026/10"),
            rarefeitas={"2026/10": 23},
        )
        planilha_sessoes = abrir_para_editar(bloco_seis_sessoes)
        coluna_quantidade = CABECALHO_FONTE.index("Quantidade Procedimento")
        for linha in planilha_sessoes.active.iter_rows(min_row=2):
            if linha[0].value == "2026/10":
                linha[coluna_quantidade].value = linha[coluna_quantidade].value * 10
        planilha_sessoes.save(bloco_seis_sessoes)
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_q3, bloco_seis_sessoes], "2026/09",
                exigir_referencias=False,
            ),
            "mês de borda com volume ínfimo não conta: 2026/10 tem 6 "
            "registros em " + bloco_seis_sessoes.name,
            "o limiar do intervalo firme usou sessões em vez de linhas",
        )

        def donos_dos_blocos(caminhos, ate_):
            """Só a leitura dos blocos: quem fica com cada competência."""
            definir_janela(ate_)
            try:
                return {b["arquivo"]: b for b in ler_blocos(caminhos)[1]}
            finally:
                definir_janela(FIM_BASE)

        def exigir_erro_exato(funcao, texto, mensagem):
            """A mensagem inteira: nada a mais pode entrar nela."""
            try:
                funcao()
            except ErroPipeline as exc:
                exigir_teste(
                    str(exc) == texto, f"{mensagem} (mensagem inesperada)"
                )
            else:
                raise ErroPipeline(f"selftest: {mensagem}")

        # Série encadeada em que o mês recém-aberto de uma planilha passa dos
        # 5% e o da seguinte não: agosto fica com a planilha que o traz
        # cheio, nas duas ordens, e o build completo passa.
        bloco_e1 = raiz / "blocos" / "encadeada-072026-082026.xlsx"
        bloco_e2 = raiz / "blocos" / "encadeada-082026-092026.xlsx"
        criar_bloco_sintetico(bloco_e1, ("2026/07", "2026/08"))
        aparar(bloco_e1, {"2026/08": 10})
        criar_bloco_sintetico(bloco_e2, ("2026/08", "2026/09"))
        aparar(bloco_e2, {"2026/09": 4})
        for ordem in ([bloco_e1, bloco_e2], [bloco_e2, bloco_e1]):
            dados_enc = montar_release(
                fontes, matriz, None, ordem, "2026/08", exigir_referencias=False
            )[0]
            por_arquivo = {
                b["arquivo"]: b for b in dados_enc["meta"]["blocos_fonte"]
            }
            exigir_teste(
                por_arquivo[bloco_e1.name]["competencias_na_janela"] == ["2026/07"]
                and por_arquivo[bloco_e1.name]["competencias_cedidas"] == ["2026/08"]
                and por_arquivo[bloco_e1.name]["cedidas_a"] == [bloco_e2.name]
                and por_arquivo[bloco_e1.name]["borda_fraca"] == []
                and por_arquivo[bloco_e1.name]["parciais_cedidas"] == []
                and por_arquivo[bloco_e2.name]["competencias_na_janela"]
                == ["2026/08"]
                and por_arquivo[bloco_e2.name]["borda_fraca"]
                == [{"m": "2026/09", "registros": 4}],
                "mês ainda aberto em uma planilha não ficou com a seguinte, "
                "que o traz cheio",
            )
        # Três planilhas, alternando acima e abaixo dos 5%, em todas as ordens.
        bloco_s1 = raiz / "blocos" / "mista-072026-092026.xlsx"
        bloco_s2 = raiz / "blocos" / "mista-092026-102026.xlsx"
        bloco_s3 = raiz / "blocos" / "mista-102026-112026.xlsx"
        criar_bloco_sintetico(bloco_s1, ("2026/07", "2026/08", "2026/09"))
        aparar(bloco_s1, {"2026/09": 10})
        criar_bloco_sintetico(bloco_s2, ("2026/09", "2026/10"))
        aparar(bloco_s2, {"2026/10": 4})
        criar_bloco_sintetico(bloco_s3, ("2026/10", "2026/11"))
        aparar(bloco_s3, {"2026/11": 10})
        for a, b, c in (
            (bloco_s1, bloco_s2, bloco_s3), (bloco_s1, bloco_s3, bloco_s2),
            (bloco_s2, bloco_s1, bloco_s3), (bloco_s2, bloco_s3, bloco_s1),
            (bloco_s3, bloco_s1, bloco_s2), (bloco_s3, bloco_s2, bloco_s1),
        ):
            por_arquivo = donos_dos_blocos([a, b, c], "2026/10")
            exigir_teste(
                por_arquivo[bloco_s1.name]["competencias_na_janela"]
                == ["2026/07", "2026/08"]
                and por_arquivo[bloco_s2.name]["competencias_na_janela"]
                == ["2026/09"]
                and por_arquivo[bloco_s2.name]["borda_fraca"]
                == [{"m": "2026/10", "registros": 4}]
                and por_arquivo[bloco_s3.name]["competencias_na_janela"]
                == ["2026/10"],
                "série que alterna mês recém-aberto acima e abaixo de 5% não "
                "ficou com cada mês na planilha que o traz cheio",
            )
        # Planilha mais nova que começa no meio de setembro: setembro fica com
        # a anterior, que o traz inteiro, e o build completo passa.
        bloco_meio = raiz / "blocos" / "comeca-no-meio-092026-102026.xlsx"
        criar_bloco_sintetico(bloco_meio, ("2026/09", "2026/10"))
        aparar(bloco_meio, {"2026/09": 13})
        for ordem in ([bloco_q3, bloco_meio], [bloco_meio, bloco_q3]):
            dados_meio, _am, _rm, _tm, extensao_meio = montar_release(
                fontes, matriz, None, ordem, "2026/10", exigir_referencias=False
            )
            por_arquivo = {
                b["arquivo"]: b for b in dados_meio["meta"]["blocos_fonte"]
            }
            exigir_teste(
                por_arquivo[bloco_q3.name]["competencias_na_janela"]
                == ["2026/07", "2026/08", "2026/09"]
                and por_arquivo[bloco_meio.name]["competencias_na_janela"]
                == ["2026/10"]
                and por_arquivo[bloco_meio.name]["competencias_cedidas"]
                == ["2026/09"]
                and por_arquivo[bloco_meio.name]["cedidas_a"] == [bloco_q3.name],
                "mês começado no meio em uma planilha não ficou com a que o "
                "traz inteiro",
            )
            # A planilha mais nova cedeu um mês a uma mais antiga: o manifesto
            # e o relatório avisam, para a correção nunca se perder calada.
            relatorio_meio = io.StringIO()
            with contextlib.redirect_stdout(relatorio_meio):
                imprimir_relatorio(
                    dados_meio, _am, _rm, raiz / "nao-gravado.json", extensao_meio
                )
            exigir_teste(
                por_arquivo[bloco_meio.name]["parciais_cedidas"]
                == [{"m": "2026/09", "registros": 13, "a": bloco_q3.name}]
                and por_arquivo[bloco_q3.name]["parciais_cedidas"] == []
                and "2026/09: mês parcial nesta planilha (13 registros) — ficou "
                f"com {bloco_q3.name}, mais antiga, que o traz cheio; se esta "
                "planilha corrige o mês, a correção não entrou: confirme com a "
                "origem" in relatorio_meio.getvalue(),
                "mês parcial cedido por uma planilha mais nova a uma mais "
                "antiga não foi avisado no manifesto e no relatório",
            )
            exigir_teste(
                por_arquivo[bloco_meio.name]["cedidas_com_menos_registros"] == []
                and por_arquivo[bloco_q3.name]["cedidas_com_menos_registros"]
                == [],
                "mês cedido a quem traz mais registros dele foi apontado como "
                "cedido a quem traz menos",
            )
            # Publicando só até setembro, a planilha mais nova fica sem mês
            # próprio na janela e o relatório não sai: o erro diz com quem
            # ficou o mês e repete o aviso do mês parcial.
            exigir_erro_exato(
                lambda: donos_dos_blocos(ordem, "2026/09"),
                f"{bloco_meio.name}: nenhuma competência do bloco entra na "
                f"janela publicada (até 2026/09): 2026/09 ficou com "
                f"{bloco_q3.name} (registros do mês: 114 nele, 13 neste bloco); "
                "retire o bloco ou ajuste --ate; 2026/09: mês parcial nesta "
                "planilha, mais nova do que a que ficou com ele — se esta "
                "planilha corrige o mês, a correção não entra: confirme com a "
                "origem antes de retirar o bloco",
                "bloco só com mês parcial cedido na janela não disse com quem "
                "o mês ficou nem repetiu o aviso",
            )
        # Mês parcial na borda do intervalo firme, e não da planilha: a linha
        # avulsa de julho não faz de agosto um mês do meio. Agosto, com 10
        # linhas, vai para a planilha que o traz cheio, com a própria contagem
        # no aviso.
        bloco_y = raiz / "blocos" / "y-072026-082026.xlsx"
        bloco_x = (
            raiz / "blocos" / "x-072026-102026-linha-em-julho-agosto-parcial.xlsx"
        )
        criar_bloco_sintetico(bloco_y, ("2026/07", "2026/08"))
        criar_bloco_sintetico(
            bloco_x, ("2026/07", "2026/08", "2026/09", "2026/10"),
            escassas=("2026/07",),
        )
        aparar(bloco_x, {"2026/08": 10})
        for ordem in ([bloco_y, bloco_x], [bloco_x, bloco_y]):
            por_arquivo = donos_dos_blocos(ordem, "2026/10")
            exigir_teste(
                por_arquivo[bloco_x.name]["competencias_na_janela"]
                == ["2026/09", "2026/10"]
                and por_arquivo[bloco_x.name]["parciais_cedidas"]
                == [{"m": "2026/08", "registros": 10, "a": bloco_y.name}]
                and por_arquivo[bloco_x.name]["borda_fraca"]
                == [{"m": "2026/07", "registros": 2}]
                and por_arquivo[bloco_x.name]["cedidas_com_menos_registros"]
                == [],
                "mês parcial na borda do intervalo firme (não da planilha) não "
                "foi cedido e avisado com a própria contagem",
            )
            # Só até agosto, nada do bloco entra: o erro lista os dois meses,
            # cada um com quem ficou com ele, e avisa só do parcial. Outubro,
            # cedido a um bloco mais novo, está além da janela e não aparece.
            ate_agosto = (
                f"{bloco_x.name}: nenhuma competência do bloco entra na janela "
                f"publicada (até 2026/08): 2026/07 ficou com {bloco_y.name} "
                "(registros do mês: 133 nele, 2 neste bloco); 2026/08 ficou "
                f"com {bloco_y.name} (registros do mês: 127 nele, 10 neste "
                "bloco); retire o bloco ou ajuste --ate; 2026/08: mês parcial "
                "nesta planilha, mais nova do que a que ficou com ele — se "
                "esta planilha corrige o mês, a correção não entra: confirme "
                "com a origem antes de retirar o bloco"
            )
            exigir_erro_exato(
                lambda: donos_dos_blocos(ordem, "2026/08"),
                ate_agosto,
                "bloco sem mês próprio na janela não listou os meses cedidos "
                "com quem ficou com cada um",
            )
            exigir_erro_exato(
                lambda: donos_dos_blocos([*ordem, bloco_q4], "2026/08"),
                ate_agosto,
                "mês cedido além da janela entrou na mensagem do bloco sem "
                "mês próprio na janela",
            )
            # Só até julho, o mês parcial está além da janela: o erro fala da
            # linha de julho e não repete o aviso.
            exigir_erro_exato(
                lambda: donos_dos_blocos(ordem, "2026/07"),
                f"{bloco_x.name}: nenhuma competência do bloco entra na janela "
                f"publicada (até 2026/07): 2026/07 ficou com {bloco_y.name} "
                "(registros do mês: 133 nele, 2 neste bloco); retire o bloco "
                "ou ajuste --ate",
                "aviso de mês parcial além da janela entrou na mensagem do "
                "bloco sem mês próprio na janela",
            )
        # A planilha mais nova fica com o mês repetido mesmo trazendo menos
        # registros dele: o manifesto e o relatório dizem os dois números, só
        # para os meses da janela; com o mesmo número, não há aviso.
        bloco_a4 = raiz / "blocos" / "menos-072026-102026.xlsx"
        bloco_b3 = raiz / "blocos" / "menos-092026-112026-um-registro-a-menos.xlsx"
        bloco_b3_igual = (
            raiz / "blocos" / "menos-092026-112026-mesmos-registros.xlsx"
        )
        criar_bloco_sintetico(
            bloco_a4, ("2026/07", "2026/08", "2026/09", "2026/10")
        )
        criar_bloco_sintetico(bloco_b3, ("2026/09", "2026/10", "2026/11"))
        aparar(bloco_b3, {"2026/09": 113, "2026/10": 115})
        criar_bloco_sintetico(bloco_b3_igual, ("2026/09", "2026/10", "2026/11"))
        aparar(bloco_b3_igual, {"2026/09": 114, "2026/10": 116})
        menos_em_setembro = {
            "m": "2026/09", "registros": 114, "a": bloco_b3.name,
            "registros_no_dono": 113,
        }
        menos_em_outubro = {
            "m": "2026/10", "registros": 116, "a": bloco_b3.name,
            "registros_no_dono": 115,
        }
        for ordem in ([bloco_a4, bloco_b3], [bloco_b3, bloco_a4]):
            ate_setembro = donos_dos_blocos(ordem, "2026/09")
            ate_outubro = donos_dos_blocos(ordem, "2026/10")
            exigir_teste(
                ate_setembro[bloco_a4.name]["competencias_cedidas"]
                == ["2026/09", "2026/10"]
                and ate_setembro[bloco_a4.name]["cedidas_com_menos_registros"]
                == [menos_em_setembro]
                and ate_outubro[bloco_a4.name]["cedidas_com_menos_registros"]
                == [menos_em_setembro, menos_em_outubro]
                and ate_outubro[bloco_b3.name]["cedidas_com_menos_registros"]
                == []
                and ate_outubro[bloco_a4.name]["parciais_cedidas"] == [],
                "mês que ficou com a planilha que traz menos registros dele "
                "não foi apontado no manifesto, só para os meses da janela",
            )
        exigir_teste(
            donos_dos_blocos([bloco_a4, bloco_b3_igual], "2026/10")[
                bloco_a4.name
            ]["cedidas_com_menos_registros"]
            == [],
            "mês cedido a uma planilha com o mesmo número de registros foi "
            "apontado como cedido a quem traz menos",
        )
        # Bloco inteiramente substituído por uma planilha acumulada que traz
        # um registro a menos em agosto e em setembro: o erro que manda
        # retirá-lo diz os dois números de cada mês, estejam eles na janela ou
        # não — o bloco sai de vez, e a diferença não apareceria depois. Com
        # os mesmos registros, não diz nada.
        bloco_acumulada_menos = (
            raiz / "blocos" / "acumulada-072026-102026-um-registro-a-menos.xlsx"
        )
        criar_bloco_sintetico(
            bloco_acumulada_menos, ("2026/07", "2026/08", "2026/09", "2026/10")
        )
        aparar(bloco_acumulada_menos, {"2026/08": 126, "2026/09": 113})
        substituido = (
            f"{bloco_q3.name}: todas as competências do bloco vêm também de um "
            f"bloco mais recente — {bloco_acumulada_menos.name} (2026/07 a "
            "2026/10); confira se esse é mesmo o arquivo novo e retire este do "
            "comando"
        )
        for ordem in (
            [bloco_q3, bloco_acumulada_menos], [bloco_acumulada_menos, bloco_q3]
        ):
            for ate_ in ("2026/10", "2026/08"):
                exigir_erro_exato(
                    lambda: donos_dos_blocos(ordem, ate_),
                    substituido
                    + "; quem ficou com o mês traz menos registros dele do que "
                    f"este bloco — 2026/08: 126 em {bloco_acumulada_menos.name}, "
                    f"127 neste bloco; 2026/09: 113 em {bloco_acumulada_menos.name}, "
                    "114 neste bloco — lançamento cancelado na origem, ou "
                    "planilha incompleta: confirme com a origem antes de "
                    "retirar o bloco",
                    "bloco substituído por uma planilha com menos registros em "
                    f"dois meses não disse os dois números de cada um (até {ate_})",
                )
        exigir_erro_exato(
            lambda: donos_dos_blocos([bloco_q3, bloco_a4], "2026/10"),
            f"{bloco_q3.name}: todas as competências do bloco vêm também de um "
            f"bloco mais recente — {bloco_a4.name} (2026/07 a 2026/10); confira "
            "se esse é mesmo o arquivo novo e retire este do comando",
            "bloco substituído por uma planilha com os mesmos registros ganhou "
            "aviso de menos registros",
        )
        # Os dois avisos no mesmo erro, nesta ordem: a planilha que começa no
        # meio de setembro cede setembro à anterior e outubro a uma mais nova,
        # que traz um registro a menos. O bloco sai de vez: os avisos valem
        # para todos os meses dele, onde quer que a janela termine.
        bloco_q4_menos = (
            raiz / "blocos" / "q4-102026-122026-outubro-com-128-linhas.xlsx"
        )
        criar_bloco_sintetico(bloco_q4_menos, ("2026/10", "2026/11", "2026/12"))
        aparar(bloco_q4_menos, {"2026/10": 128})
        sem_proprias = (
            f"{bloco_meio.name}: todas as competências do bloco vêm também de "
            f"outros blocos, que ficam com elas — {bloco_q3.name} (2026/07 a "
            f"2026/09); {bloco_q4_menos.name} (2026/10 a 2026/12); confira se "
            "esses são mesmo os arquivos a usar e retire este do comando"
        )
        do_parcial = (
            "; 2026/09: mês parcial nesta planilha, mais nova do que a que "
            "ficou com ele — se esta planilha corrige o mês, a correção não "
            "entra: confirme com a origem antes de retirar o bloco"
        )
        de_menos = (
            "; quem ficou com o mês traz menos registros dele do que este "
            f"bloco — 2026/10: 128 em {bloco_q4_menos.name}, 129 neste bloco — "
            "lançamento cancelado na origem, ou planilha incompleta: confirme "
            "com a origem antes de retirar o bloco"
        )
        for ate_ in ("2026/12", "2026/09", "2026/08"):
            for ordem in (
                [bloco_q3, bloco_meio, bloco_q4_menos],
                [bloco_q4_menos, bloco_meio, bloco_q3],
            ):
                exigir_erro_exato(
                    lambda: donos_dos_blocos(ordem, ate_),
                    sem_proprias + do_parcial + de_menos,
                    "bloco sem competência própria não repetiu, na ordem, os "
                    f"avisos de todos os meses dele (até {ate_})",
                )
        # Dono mais antigo e com menos registros: a planilha nova começa no
        # meio de setembro (30 linhas) e a anterior traz setembro com 20, no
        # meio dela. Setembro fica com a anterior, e os dois avisos saem no
        # manifesto e, nesta ordem, no erro de quem publica só até setembro —
        # ali só para o mês da janela: novembro, cedido a uma terceira
        # planilha com um registro a menos, fica para quando a janela crescer.
        bloco_s1y = raiz / "blocos" / "s1-072026-102026-setembro-com-20-linhas.xlsx"
        bloco_s1x = raiz / "blocos" / "s1-092026-112026-setembro-com-30-linhas.xlsx"
        bloco_s1z = (
            raiz / "blocos" / "s1-112026-122026-novembro-com-113-linhas.xlsx"
        )
        criar_bloco_sintetico(
            bloco_s1y, ("2026/07", "2026/08", "2026/09", "2026/10")
        )
        aparar(bloco_s1y, {"2026/09": 20})
        criar_bloco_sintetico(bloco_s1x, ("2026/09", "2026/10", "2026/11"))
        aparar(bloco_s1x, {"2026/09": 30})
        criar_bloco_sintetico(bloco_s1z, ("2026/11", "2026/12"))
        aparar(bloco_s1z, {"2026/11": 113})
        so_ate_setembro = (
            f"{bloco_s1x.name}: nenhuma competência do bloco entra na janela "
            f"publicada (até 2026/09): 2026/09 ficou com {bloco_s1y.name} "
            "(registros do mês: 20 nele, 30 neste bloco); retire o bloco ou "
            "ajuste --ate; 2026/09: mês parcial nesta planilha, mais nova do "
            "que a que ficou com ele — se esta planilha corrige o mês, a "
            "correção não entra: confirme com a origem antes de retirar o "
            "bloco; quem ficou com o mês traz menos registros dele do que este "
            f"bloco — 2026/09: 20 em {bloco_s1y.name}, 30 neste bloco — "
            "lançamento cancelado na origem, ou planilha incompleta: confirme "
            "com a origem antes de retirar o bloco"
        )
        for ordem in ([bloco_s1y, bloco_s1x], [bloco_s1x, bloco_s1y]):
            exigir_erro_exato(
                lambda: donos_dos_blocos(ordem, "2026/09"),
                so_ate_setembro,
                "bloco sem mês próprio na janela não trouxe os dois avisos, "
                "nesta ordem",
            )
            exigir_erro_exato(
                lambda: donos_dos_blocos([*ordem, bloco_s1z], "2026/09"),
                so_ate_setembro,
                "mês além da janela entrou no aviso de menos registros do "
                "bloco sem mês próprio na janela",
            )
            por_arquivo = donos_dos_blocos([*ordem, bloco_s1z], "2026/11")
            exigir_teste(
                por_arquivo[bloco_s1x.name]["competencias_na_janela"]
                == ["2026/10"]
                and por_arquivo[bloco_s1x.name]["parciais_cedidas"]
                == [{"m": "2026/09", "registros": 30, "a": bloco_s1y.name}]
                and por_arquivo[bloco_s1x.name]["cedidas_com_menos_registros"]
                == [
                    {
                        "m": "2026/09", "registros": 30, "a": bloco_s1y.name,
                        "registros_no_dono": 20,
                    },
                    {
                        "m": "2026/11", "registros": 114, "a": bloco_s1z.name,
                        "registros_no_dono": 113,
                    },
                ],
                "meses cedidos a blocos com menos registros — um mais antigo, "
                "outro mais novo — não apontaram cada um o próprio dono",
            )
        # Três blocos: os meses do bloco sem mês próprio na janela ficaram com
        # arquivos diferentes, e o erro diz cada um com o seu.
        bloco_s2a = raiz / "blocos" / "s2-072026-082026-agosto-com-1-linha.xlsx"
        bloco_s2b = raiz / "blocos" / "s2-082026-092026-agosto-com-21-linhas.xlsx"
        bloco_s2x = (
            raiz / "blocos" / "s2-072026-102026-linha-em-julho-agosto-com-25.xlsx"
        )
        criar_bloco_sintetico(bloco_s2a, ("2026/07", "2026/08"))
        aparar(bloco_s2a, {"2026/08": 1})
        criar_bloco_sintetico(bloco_s2b, ("2026/08", "2026/09"))
        aparar(bloco_s2b, {"2026/08": 21, "2026/09": 1})
        criar_bloco_sintetico(
            bloco_s2x, ("2026/07", "2026/08", "2026/09", "2026/10"),
            escassas=("2026/07",),
        )
        aparar(bloco_s2x, {"2026/08": 25})
        for ordem in (
            [bloco_s2a, bloco_s2b, bloco_s2x], [bloco_s2x, bloco_s2b, bloco_s2a]
        ):
            exigir_erro_exato(
                lambda: donos_dos_blocos(ordem, "2026/08"),
                f"{bloco_s2x.name}: nenhuma competência do bloco entra na "
                f"janela publicada (até 2026/08): 2026/07 ficou com "
                f"{bloco_s2a.name} (registros do mês: 133 nele, 2 neste bloco); "
                f"2026/08 ficou com {bloco_s2b.name} (registros do mês: 21 "
                "nele, 25 neste bloco); retire o bloco ou ajuste --ate; "
                "2026/08: mês parcial nesta planilha, mais nova do que a que "
                "ficou com ele — se esta planilha corrige o mês, a correção "
                "não entra: confirme com a origem antes de retirar o bloco; "
                "quem ficou com o mês traz menos registros dele do que este "
                f"bloco — 2026/08: 21 em {bloco_s2b.name}, 25 neste bloco — "
                "lançamento cancelado na origem, ou planilha incompleta: "
                "confirme com a origem antes de retirar o bloco",
                "bloco sem mês próprio na janela não disse cada mês com o "
                "arquivo que ficou com ele",
            )
        # Números com milhar saem formatados no erro, como no relatório.
        def inflar(caminho, vezes):
            """Repete as linhas da planilha, com matrícula e guia próprias."""
            planilha = abrir_para_editar(caminho)
            aba = planilha.active
            linhas = [[c.value for c in linha] for linha in aba.iter_rows(min_row=2)]
            for copia in range(1, vezes):
                for linha in linhas:
                    nova = list(linha)
                    nova[1] = f"{nova[1]}-{copia}"
                    nova[5] = f"{nova[5]}-{copia}"
                    aba.append(nova)
            planilha.save(caminho)

        bloco_s3a = raiz / "blocos" / "s3-072026-092026-grande.xlsx"
        bloco_s3b = (
            raiz / "blocos" / "s3-072026-102026-grande-agosto-com-1142-linhas.xlsx"
        )
        criar_bloco_sintetico(bloco_s3a, ("2026/07", "2026/08", "2026/09"))
        inflar(bloco_s3a, 9)
        criar_bloco_sintetico(
            bloco_s3b, ("2026/07", "2026/08", "2026/09", "2026/10")
        )
        inflar(bloco_s3b, 9)
        aparar(bloco_s3b, {"2026/08": 1142})
        exigir_erro_exato(
            lambda: donos_dos_blocos([bloco_s3a, bloco_s3b], "2026/10"),
            f"{bloco_s3a.name}: todas as competências do bloco vêm também de um "
            f"bloco mais recente — {bloco_s3b.name} (2026/07 a 2026/10); "
            "confira se esse é mesmo o arquivo novo e retire este do comando; "
            "quem ficou com o mês traz menos registros dele do que este bloco "
            f"— 2026/08: 1.142 em {bloco_s3b.name}, 1.143 neste bloco — "
            "lançamento cancelado na origem, ou planilha incompleta: confirme "
            "com a origem antes de retirar o bloco",
            "aviso de menos registros no erro saiu sem o milhar formatado",
        )
        dados_menos, _amn, _rmn, _tmn, extensao_menos = montar_release(
            fontes, matriz, None, [bloco_a4, bloco_b3], "2026/10",
            exigir_referencias=False,
        )
        relatorio_menos = io.StringIO()
        with contextlib.redirect_stdout(relatorio_menos):
            imprimir_relatorio(
                dados_menos, _amn, _rmn, raiz / "nao-gravado.json", extensao_menos
            )
        exigir_teste(
            all(
                f"{mes}: {bloco_b3.name}, que ficou com o mês, traz menos "
                f"registros dele ({no_dono}) do que esta planilha ({aqui}) — "
                "lançamento cancelado na origem, ou planilha incompleta nesse "
                "mês: confirme com a origem" in relatorio_menos.getvalue()
                for mes, no_dono, aqui in (
                    ("2026/09", 113, 114), ("2026/10", 115, 116),
                )
            ),
            "mês que ficou com a planilha que traz menos registros dele não "
            "foi avisado no relatório",
        )
        dados_milhar = copy.deepcopy(dados_menos)
        dados_milhar["meta"]["blocos_fonte"][0]["cedidas_com_menos_registros"] = [
            {
                "m": "2026/09", "registros": 1026, "a": bloco_b3.name,
                "registros_no_dono": 1025,
            }
        ]
        relatorio_milhar = io.StringIO()
        with contextlib.redirect_stdout(relatorio_milhar):
            imprimir_relatorio(
                dados_milhar, _amn, _rmn, raiz / "nao-gravado.json", extensao_menos
            )
        exigir_teste(
            "traz menos registros dele (1.025) do que esta planilha (1.026)"
            in relatorio_milhar.getvalue(),
            "aviso de menos registros no relatório saiu sem o milhar formatado",
        )
        # Fronteira dos 25%: agosto com 30 linhas em 120 é mês cheio, e as
        # duas planilhas que terminam em agosto pedem decisão; com 29, é
        # parcial e perde para a que o traz cheio.
        bloco_25 = raiz / "blocos" / "encadeada-072026-082026-agosto-a-25-por-cento.xlsx"
        criar_bloco_sintetico(bloco_25, ("2026/07", "2026/08"))
        aparar(bloco_25, {"2026/07": 120, "2026/08": 30})
        exigir_erro(
            lambda: donos_dos_blocos([bloco_25, bloco_e2], "2026/08"),
            "trazem a competência 2026/08 e não há como saber qual é a "
            "planilha mais recente",
            "mês com exatamente 25% das linhas do mês mais cheio não contou "
            "como mês cheio",
        )
        bloco_24 = raiz / "blocos" / "encadeada-072026-082026-agosto-a-24-por-cento.xlsx"
        criar_bloco_sintetico(bloco_24, ("2026/07", "2026/08"))
        aparar(bloco_24, {"2026/07": 120, "2026/08": 29})
        por_arquivo = donos_dos_blocos([bloco_24, bloco_e2], "2026/08")
        exigir_teste(
            por_arquivo[bloco_24.name]["competencias_na_janela"] == ["2026/07"]
            and por_arquivo[bloco_e2.name]["competencias_na_janela"] == ["2026/08"],
            "mês com menos de 25% das linhas do mês mais cheio contou como "
            "mês cheio",
        )
        # Só a borda pode ser parcial. Mês do meio de uma planilha mais nova,
        # com pouco volume, é dado dela (uma correção na origem, por exemplo):
        # não volta para a planilha antiga, que continua substituída.
        bloco_meio_baixo = raiz / "blocos" / "acumulada-072026-122026-setembro-baixo.xlsx"
        criar_bloco_sintetico(
            bloco_meio_baixo,
            ("2026/07", "2026/08", "2026/09", "2026/10", "2026/11", "2026/12"),
        )
        aparar(bloco_meio_baixo, {"2026/09": 30})
        exigir_erro(
            lambda: donos_dos_blocos([bloco_q3, bloco_meio_baixo], "2026/12"),
            "bloco-q3.xlsx: todas as competências do bloco vêm também de um "
            "bloco mais recente — "
            "acumulada-072026-122026-setembro-baixo.xlsx (2026/07 a 2026/12)",
            "mês do meio com pouco volume em planilha mais nova voltou para a "
            "planilha antiga",
        )
        # Dois blocos com o mês cheio e um mais novo que o traz parcial: o mês
        # fica com o mais recente entre os que o trazem cheio.
        bloco_t1 = raiz / "blocos" / "tres-072026-082026.xlsx"
        bloco_t2 = raiz / "blocos" / "tres-082026-092026.xlsx"
        bloco_t3 = raiz / "blocos" / "tres-082026-102026-agosto-parcial.xlsx"
        criar_bloco_sintetico(bloco_t1, ("2026/07", "2026/08"))
        criar_bloco_sintetico(bloco_t2, ("2026/08", "2026/09"))
        criar_bloco_sintetico(bloco_t3, ("2026/08", "2026/09", "2026/10"))
        aparar(bloco_t3, {"2026/08": 30})
        por_arquivo = donos_dos_blocos([bloco_t1, bloco_t2, bloco_t3], "2026/10")
        exigir_teste(
            por_arquivo[bloco_t1.name]["competencias_na_janela"] == ["2026/07"]
            and por_arquivo[bloco_t2.name]["competencias_na_janela"] == ["2026/08"]
            and por_arquivo[bloco_t3.name]["competencias_na_janela"]
            == ["2026/09", "2026/10"]
            and por_arquivo[bloco_t3.name]["competencias_cedidas"] == ["2026/08"]
            and por_arquivo[bloco_t3.name]["cedidas_a"] == [bloco_t2.name],
            "com dois blocos trazendo o mês cheio, ele não ficou com o mais "
            "recente deles",
        )
        # O mês cheio conta linhas, não sessões: setembro com 24 linhas de dez
        # sessões cada continua parcial e fica com quem o traz inteiro.
        bloco_parcial_sessoes = (
            raiz / "blocos" / "comeca-no-meio-092026-102026-24-linhas-de-10-sessoes.xlsx"
        )
        criar_bloco_sintetico(bloco_parcial_sessoes, ("2026/09", "2026/10"))
        aparar(bloco_parcial_sessoes, {"2026/09": 24})
        planilha_sessoes = abrir_para_editar(bloco_parcial_sessoes)
        for linha in planilha_sessoes.active.iter_rows(min_row=2):
            if linha[0].value == "2026/09":
                linha[coluna_quantidade].value = linha[coluna_quantidade].value * 10
        planilha_sessoes.save(bloco_parcial_sessoes)
        por_arquivo = donos_dos_blocos([bloco_q3, bloco_parcial_sessoes], "2026/10")
        exigir_teste(
            por_arquivo[bloco_q3.name]["competencias_na_janela"]
            == ["2026/07", "2026/08", "2026/09"]
            and por_arquivo[bloco_parcial_sessoes.name]["competencias_cedidas"]
            == ["2026/09"],
            "o limiar do mês cheio usou sessões em vez de linhas",
        )
        # Bloco que perde um mês para um mais antigo (que o traz cheio) e o
        # outro para um mais novo: a mensagem não chama os dois de mais
        # recentes.
        bloco_v1 = raiz / "blocos" / "vizinhos-082026-092026-agosto-parcial.xlsx"
        bloco_v2 = raiz / "blocos" / "vizinhos-092026-102026.xlsx"
        criar_bloco_sintetico(bloco_v1, ("2026/08", "2026/09"))
        aparar(bloco_v1, {"2026/08": 30})
        criar_bloco_sintetico(bloco_v2, ("2026/09", "2026/10"))
        vizinhos_sem_aviso = (
            "vizinhos-082026-092026-agosto-parcial.xlsx: todas as competências "
            "do bloco vêm também de outros blocos, que ficam com elas — "
            "tres-072026-082026.xlsx (2026/07 a 2026/08); "
            "vizinhos-092026-102026.xlsx (2026/09 a 2026/10); confira se esses "
            "são mesmo os arquivos a usar e retire este do comando"
        )
        # Agosto, parcial neste bloco, ficou com um mais antigo: o erro repete
        # o aviso do relatório, que não chega a sair.
        exigir_erro_exato(
            lambda: donos_dos_blocos([bloco_t1, bloco_v1, bloco_v2], "2026/10"),
            vizinhos_sem_aviso
            + "; 2026/08: mês parcial nesta planilha, mais nova do que a que "
            "ficou com ele — se esta planilha corrige o mês, a correção não "
            "entra: confirme com a origem antes de retirar o bloco",
            "bloco que perdeu um mês para um mais antigo foi descrito como "
            "substituído só por blocos mais recentes, ou sem o aviso do mês "
            "parcial",
        )
        # Só até julho, agosto está além da janela, mas o bloco sai de vez:
        # o aviso vale do mesmo jeito.
        exigir_erro_exato(
            lambda: donos_dos_blocos([bloco_t1, bloco_v1, bloco_v2], "2026/07"),
            vizinhos_sem_aviso
            + "; 2026/08: mês parcial nesta planilha, mais nova do que a que "
            "ficou com ele — se esta planilha corrige o mês, a correção não "
            "entra: confirme com a origem antes de retirar o bloco",
            "bloco sem competência própria deixou de avisar do mês parcial "
            "que está além da janela",
        )
        # Exatamente 5% (6 linhas em 120): conta.
        bloco_exato = raiz / "blocos" / "bloco-072026-102026-outubro-a-5-por-cento.xlsx"
        criar_bloco_sintetico(
            bloco_exato, ("2026/07", "2026/08", "2026/09", "2026/10")
        )
        aparar(bloco_exato, {"2026/07": 120, "2026/08": 120, "2026/10": 6})
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_q3, bloco_exato], "2026/09",
                exigir_referencias=False,
            ),
            "bloco-q3.xlsx: todas as competências do bloco vêm também de um "
            "bloco mais recente — "
            "bloco-072026-102026-outubro-a-5-por-cento.xlsx (2026/07 a 2026/10)",
            "mês de borda com exatamente 5% das linhas do mês mais cheio não contou",
        )
        # A referência é o mês mais cheio da planilha, não a mediana.
        bloco_queda = raiz / "blocos" / "bloco-072026-102026-queda-depois-de-julho.xlsx"
        criar_bloco_sintetico(
            bloco_queda, ("2026/07", "2026/08", "2026/09", "2026/10"),
            rarefeitas={"2026/08": 4, "2026/09": 4, "2026/10": 23},
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_q3, bloco_queda], "2026/09",
                exigir_referencias=False,
            ),
            "mês de borda com volume ínfimo não conta: 2026/10 tem 6 "
            "registros em bloco-072026-102026-queda-depois-de-julho.xlsx",
            "o limiar do intervalo firme não usou o mês mais cheio da planilha",
        )
        # Série em que cada planilha repete o último mês da anterior, ainda
        # aberto quando ela foi extraída: 07–09 (setembro aberto), 09–10
        # (outubro aberto) e 10–11 (novembro recém-aberto, 14%). Cada mês fica
        # com a planilha que o traz fechado, em qualquer ordem.
        bloco_r1 = raiz / "blocos" / "serie-072026-092026.xlsx"
        bloco_r2 = raiz / "blocos" / "serie-092026-102026.xlsx"
        bloco_r3 = raiz / "blocos" / "serie-102026-112026.xlsx"
        criar_bloco_sintetico(
            bloco_r1, ("2026/07", "2026/08", "2026/09"), rarefeitas={"2026/09": 2}
        )
        criar_bloco_sintetico(
            bloco_r2, ("2026/09", "2026/10"), rarefeitas={"2026/10": 2}
        )
        criar_bloco_sintetico(
            bloco_r3, ("2026/10", "2026/11"), rarefeitas={"2026/11": 7}
        )
        for ordem in (
            [bloco_r1, bloco_r2, bloco_r3], [bloco_r3, bloco_r2, bloco_r1],
            [bloco_r2, bloco_r3, bloco_r1],
        ):
            dados_serie = montar_release(
                fontes, matriz, None, ordem, "2026/10", exigir_referencias=False
            )[0]
            por_arquivo = {
                b["arquivo"]: b for b in dados_serie["meta"]["blocos_fonte"]
            }
            exigir_teste(
                por_arquivo[bloco_r1.name]["competencias_na_janela"]
                == ["2026/07", "2026/08"]
                and por_arquivo[bloco_r1.name]["cedidas_a"] == [bloco_r2.name]
                and por_arquivo[bloco_r2.name]["competencias_na_janela"]
                == ["2026/09"]
                and por_arquivo[bloco_r2.name]["cedidas_a"] == [bloco_r3.name]
                and por_arquivo[bloco_r3.name]["competencias_na_janela"]
                == ["2026/10"]
                and all(b["borda_fraca"] == [] for b in por_arquivo.values()),
                "série que repete o último mês com o mês novo recém-aberto não "
                "ficou com cada mês na planilha que o traz fechado",
            )
        # Bloco substituído por dois outros: a mensagem concorda no plural.
        bloco_x = raiz / "blocos" / "bloco-x-092026-102026.xlsx"
        bloco_p1 = raiz / "blocos" / "bloco-p1-092026-112026.xlsx"
        criar_bloco_sintetico(bloco_x, ("2026/09", "2026/10"))
        criar_bloco_sintetico(bloco_p1, ("2026/09", "2026/10", "2026/11"))
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_q3, bloco_x, bloco_p1, bloco_q4],
                "2026/12", exigir_referencias=False,
            ),
            "bloco-x-092026-102026.xlsx: todas as competências do bloco vêm "
            "também de blocos mais recentes — "
            "bloco-p1-092026-112026.xlsx (2026/09 a 2026/11); "
            "bloco-q4.xlsx (2026/10 a 2026/12); confira se esses são mesmo os "
            "arquivos novos",
            "bloco substituído por dois outros não foi apontado no plural",
        )
        # A planilha seguinte repete setembro e fica com ele, nas duas ordens.
        dados_seg, _a2, _r2, _t2, _e2 = montar_release(
            fontes, matriz, None, [bloco_seguinte, bloco_q3], "2026/12",
            exigir_referencias=False,
        )
        cedente_q3 = dados_seg["meta"]["blocos_fonte"][0]
        exigir_teste(
            cedente_q3["arquivo"] == bloco_q3.name
            and cedente_q3["competencias_cedidas"] == ["2026/09"]
            and cedente_q3["cedidas_a"] == [bloco_seguinte.name]
            and dados_seg["meta"]["blocos_fonte"][1]["cedidas_a"] == [],
            "planilha seguinte que repete o último mês deve ficar com ele",
        )
        # Três blocos encadeados: o mês repetido fica com o que vence todos.
        bloco_ponte = raiz / "blocos" / "bloco-082026-102026.xlsx"
        criar_bloco_sintetico(bloco_ponte, ("2026/08", "2026/09", "2026/10"))
        for ordem in (
            [bloco_q3, bloco_ponte, bloco_seguinte],
            [bloco_seguinte, bloco_ponte, bloco_q3],
        ):
            dados_tres, _a3, _r3, _t3, _e3 = montar_release(
                fontes, matriz, None, ordem, "2026/12", exigir_referencias=False
            )
            por_arquivo = {
                b["arquivo"]: b for b in dados_tres["meta"]["blocos_fonte"]
            }
            exigir_teste(
                por_arquivo[bloco_q3.name]["competencias_na_janela"] == ["2026/07"]
                and por_arquivo[bloco_ponte.name]["competencias_na_janela"]
                == ["2026/08"]
                and por_arquivo[bloco_ponte.name]["cedidas_a"]
                == [bloco_seguinte.name]
                and por_arquivo[bloco_seguinte.name]["competencias_na_janela"]
                == ["2026/09", "2026/10", "2026/11", "2026/12"]
                and por_arquivo[bloco_q3.name]["cedidas_a"]
                == sorted([bloco_ponte.name, bloco_seguinte.name]),
                "competência repetida em três blocos deve ficar com o que "
                "vence todos",
            )
        # Competência nova com volume ínfimo não é publicada.
        bloco_escasso = raiz / "blocos" / "bloco-com-mes-escasso.xlsx"
        criar_bloco_sintetico(
            bloco_escasso, ("2026/07", "2026/08", "2026/09"),
            escassas=("2026/09",),
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_escasso], "2026/09",
                exigir_referencias=False,
            ),
            "competência 2026/09: 1 sessão agregada, menos de 25% do volume "
            "mensal recente da base (125)",
            "competência nova com volume ínfimo foi publicada",
        )
        montar_release(
            fontes, matriz, None, [bloco_escasso], "2026/08",
            exigir_referencias=False,
        )
        # A trava mede sessões, não linhas: mês com registros e sem sessões
        # não é publicado; mês com metade do volume passa, com aviso.
        from openpyxl import load_workbook

        def bloco_com_setembro_reduzido(nome, manter_uma_a_cada):
            caminho = raiz / "blocos" / nome
            criar_bloco_sintetico(caminho, ("2026/07", "2026/08", "2026/09"))
            planilha = load_workbook(caminho)
            ordem_linha = 0
            for linha in planilha.active.iter_rows(min_row=2):
                if linha[0].value == "2026/09":
                    ordem_linha += 1
                    if not manter_uma_a_cada or ordem_linha % manter_uma_a_cada:
                        linha[17].value = 0
            planilha.save(caminho)
            return caminho

        bloco_sem_sessoes = bloco_com_setembro_reduzido(
            "bloco-com-mes-sem-sessoes.xlsx", 0
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_sem_sessoes], "2026/09",
                exigir_referencias=False,
            ),
            "competência 2026/09: 0 sessões agregadas, menos de 25% do volume "
            "mensal recente da base (125)",
            "competência com registros e sem sessões foi publicada",
        )
        bloco_meio_volume = bloco_com_setembro_reduzido(
            "bloco-com-mes-pela-metade.xlsx", 2
        )
        dados_mv, auditoria_mv, reconc_mv, _tmv, extensao_mv = montar_release(
            fontes, matriz, None, [bloco_meio_volume], "2026/09",
            exigir_referencias=False,
        )
        relatorio_mv = io.StringIO()
        with contextlib.redirect_stdout(relatorio_mv):
            imprimir_relatorio(
                dados_mv, auditoria_mv, reconc_mv, raiz / "nao-gravado.json",
                extensao_mv,
            )
        exigir_teste(
            "Volume 2026/09         : 57 sessões, 45,6% do volume mensal "
            "recente da base (125)" in relatorio_mv.getvalue()
            and "Volume 2026/08" not in relatorio_mv.getvalue(),
            "relatório não avisou a competência com volume abaixo do habitual",
        )
        # Dois terços do volume (entre 50% e 75% da referência): avisa também.
        bloco_dois_tercos = raiz / "blocos" / "bloco-com-mes-a-dois-tercos.xlsx"
        criar_bloco_sintetico(bloco_dois_tercos, ("2026/07", "2026/08", "2026/09"))
        planilha = load_workbook(bloco_dois_tercos)
        ordem_linha = 0
        for linha in planilha.active.iter_rows(min_row=2):
            if linha[0].value == "2026/09":
                ordem_linha += 1
                if ordem_linha % 3 == 0:
                    linha[17].value = 0
        planilha.save(bloco_dois_tercos)
        dados_dt, auditoria_dt, reconc_dt, _tdt, extensao_dt = montar_release(
            fontes, matriz, None, [bloco_dois_tercos], "2026/09",
            exigir_referencias=False,
        )
        relatorio_dt = io.StringIO()
        with contextlib.redirect_stdout(relatorio_dt):
            imprimir_relatorio(
                dados_dt, auditoria_dt, reconc_dt, raiz / "nao-gravado.json",
                extensao_dt,
            )
        exigir_teste(
            "Volume 2026/09         : 76 sessões, 60,8% do volume mensal "
            "recente da base (125)" in relatorio_dt.getvalue(),
            "relatório não avisou a competência entre 50% e 75% do volume",
        )
        # Registro sem data de nascimento em competência cedida não conta no
        # bloco que a cedeu.
        bloco_y = raiz / "blocos" / "bloco-y-072026-082026.xlsx"
        bloco_z = raiz / "blocos" / "bloco-z-082026-092026.xlsx"
        criar_bloco_sintetico(bloco_y, ("2026/07", "2026/08"))
        criar_bloco_sintetico(bloco_z, ("2026/08", "2026/09"))
        dados_yz, _ayz, _ryz, _tyz, _eyz = montar_release(
            fontes, matriz, None, [bloco_y, bloco_z], "2026/09",
            exigir_referencias=False,
        )
        cedente_yz, dono_yz = dados_yz["meta"]["blocos_fonte"]
        exigir_teste(
            cedente_yz["arquivo"] == bloco_y.name
            and cedente_yz["competencias_cedidas"] == ["2026/08"]
            and cedente_yz["sem_nascimento"]["registros"] == 1
            and cedente_yz["sem_nascimento"]["fora_do_painel"] == 0
            and dono_yz["sem_nascimento"]["registros"] == 2
            and dono_yz["sem_nascimento"]["fora_do_painel"] == 1,
            "registro cedido sem data de nascimento foi contado no bloco que "
            "cedeu a competência",
        )
        for ordem in ([bloco_q3, bloco], [bloco, bloco_q3]):
            exigir_erro(
                lambda ordem=ordem: montar_release(
                    fontes, matriz, None, ordem, "2026/09",
                    exigir_referencias=False,
                ),
                "bloco-q3.xlsx: todas as competências do bloco vêm também de "
                "um bloco mais recente",
                "bloco inteiramente substituído por outro não foi apontado",
            )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco], "2026/11",
                exigir_referencias=False,
            ),
            "sem registros em nenhum bloco: 2026/11",
            "competência sem dados na janela não foi bloqueada",
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco], exigir_referencias=False
            ),
            "--bloco exige --ate",
            "bloco sem --ate não foi bloqueado",
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [], "2026/09", exigir_referencias=False
            ),
            "exige ao menos um --bloco",
            "janela estendida sem bloco não foi bloqueada",
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco], "2026/06",
                exigir_referencias=False,
            ),
            "deve ser posterior ao período-base",
            "bloco com janela igual à base não foi bloqueado",
        )
        for celula, campo, funcao in (
            ("31/02/2015", "Data Nascimento", normalizar_data),
            ("MARIA 12,5O", "Pagamento/Despesa", decimal_celula),
        ):
            try:
                funcao(celula, campo)
            except ErroPipeline as exc:
                exigir_teste(
                    celula not in str(exc) and "formato" in str(exc),
                    "mensagem de erro reproduziu o conteúdo da célula",
                )
            else:
                raise ErroPipeline("selftest: célula inválida foi aceita")
        try:
            normalizar_anomes("13/2026")
        except ErroPipeline as exc:
            exigir_teste(
                "13/2026" not in str(exc) and "99/9999" in str(exc),
                "mensagem de competência inválida reproduziu a célula",
            )
        else:
            raise ErroPipeline("selftest: competência inválida foi aceita")

        # ---- Nenhuma mensagem de erro de linha reproduz a célula ----
        linha_valida = [
            "2026/07", "MAT-SENT", "CRIANCA SENTINELA", date(2015, 1, 1),
            "FEMININO", "GUIA-SENT", date(2026, 7, 15), "SOL-SENT",
            "SOLICITANTE COMUM", "Psicologo clinico", "SPSADT", 50005103,
            "PROCEDIMENTO 50005103", "SESSAO", "PREST-SENT",
            "PRESTADOR 50005103 LTDA", "CLINICA ESPECIALIZADA", 1, 100,
        ]
        normalizar_registro(
            linha_valida, Path("bloco.xlsx"), 2, nascimento_opcional=True
        )
        for sentinela, marcas in (
            ("ZZSENTINELA QQ7391", ("ZZSENTINELA", "7391")),
            (7391739173, ("7391739173",)),
        ):
            for coluna, titulo in enumerate(CABECALHO_FONTE):
                linha = list(linha_valida)
                linha[coluna] = sentinela
                try:
                    normalizar_registro(
                        linha, Path("bloco.xlsx"), 2, nascimento_opcional=True
                    )
                except ErroPipeline as exc:
                    exigir_teste(
                        not any(marca in str(exc) for marca in marcas)
                        and "bloco.xlsx, linha 2" in str(exc),
                        f"erro na coluna {titulo} reproduziu a célula ou "
                        "não indicou arquivo e linha",
                    )

        # ---- Reforço: asserções que matam os mutantes sobreviventes ----
        # --- R01: tabela-verdade de na_janela_publicada (origem × competência)
        definir_janela("2026/09")
        try:
            tabela = [
                na_janela_publicada({"anomes": mes, "origem": origem})
                for mes, origem in (
                    ("2026/06", "base"), ("2026/07", "base"),
                    ("2026/06", "bloco"), ("2026/07", "bloco"),
                    ("2026/09", "bloco"), ("2026/10", "bloco"),
                )
            ]
            bloco_sem_nascimento = na_janela_publicada(
                {"anomes": "2026/07", "origem": "bloco",
                 "sem_nascimento": True}
            )
        finally:
            definir_janela(FIM_BASE)
        exigir_teste(
            tabela == [True, False, False, True, True, False]
            and bloco_sem_nascimento is False,
            "na_janela_publicada fora da regra origem × competência",
        )

        # --- R02: fonte-base que traz competência pós-base não soma ao bloco
        fontes_longas = raiz / "fontes-longas"

        definir_janela("2026/07")
        try:
            criar_fontes_sinteticas(fontes_longas)  # 19 fontes com 2026/07
        finally:
            definir_janela(FIM_BASE)
        dados_longos, _a2, _r2, _t2, _e2 = montar_release(
            fontes_longas, matriz, None, [bloco], "2026/09",
            exigir_referencias=False,
        )
        exigir_teste(
            dados_longos["recortes"] == dados_ext["recortes"],
            "competência pós-base presente nas fontes-base alterou o painel",
        )

        # --- R03: manifesto das 19 fontes não depende da janela publicada
        definir_janela("2026/09")
        try:
            _, manifesto_longo = ler_diretorio_fontes(fontes_longas)
        finally:
            definir_janela(FIM_BASE)
        exigir_teste(
            [f["registros_periodo_canonico"] for f in manifesto_longo]
            == [f["registros_periodo_canonico"] for f in manifesto],
            "registros_periodo_canonico variou com a janela publicada",
        )

        # --- R04a: nada além da janela publicada entra na agregação
        exigir_teste(
            {r["anomes"] for r in auditoria_ext["registros_incluidos"]}
            == set(sequencia_meses("2025/01", "2026/09")),
            "registro fora da janela publicada entrou na agregação",
        )

        # --- R04b: exceção AT do meta fecha com as sessões AT do recorte completo
        exigir_teste(
            meta_ext["excecao_at"]["sessoes"]
            == sum(
                t["at_sessoes"]
                for t in dados_ext["recortes"]["tudo"]["terapias"]
            ),
            "exceção AT soma sessões de competência não publicada",
        )

        # --- R05a: competências novas fecham com o bloco menos o declarado fora
        novos = [
            p for p in dados_ext["recortes"]["tudo"]["serie_mensal"]
            if p["m"] > FIM_BASE
        ]
        exigir_teste(
            sum(p["registros"] for p in novos)
            == bloco_meta[0]["registros_na_janela"]
            - descarte_ext[0]["registros_pos_base"]
            - bloco_meta[0]["sem_nascimento"]["fora_do_painel"],
            "competências novas não fecham com o bloco menos o que foi "
            "declarado fora (PECS e sem data de nascimento)",
        )

        # --- R05b: em todo recorte, as 17 terapias somam as sessões do resumo
        for periodo_id, recorte in dados_ext["recortes"].items():
            exigir_teste(
                sum(t["sessoes"] for t in recorte["terapias"])
                == recorte["resumo"]["sessoes"],
                f"{periodo_id}: as 17 terapias não somam as sessões do resumo",
            )

        # --- R05c: números exatos das competências novas na fixture
        exigir_teste(
            [
                (p["m"], p["pacientes"], p["registros"], p["sessoes"],
                 p["pagamento"])
                for p in dados_ext["recortes"]["tudo"]["serie_mensal"][-3:]
            ]
            == [
                ("2026/07", 14, 127, 127, 16118.0),
                ("2026/08", 14, 126, 126, 16063.0),
                ("2026/09", 14, 114, 114, 14527.0),
            ],
            "sessões ou pagamento das competências novas divergem da fixture",
        )

        # --- R06: montar_release confere a base contra a janela estendida
        conferencias = []
        conferir_real = globals()["exigir_base_inalterada"]

        def conferir_espiao(base, estendido):
            conferencias.append(
                (
                    base["meta"]["periodo_canonico"]["fim"],
                    estendido["meta"]["periodo_canonico"]["fim"],
                )
            )
            return conferir_real(base, estendido)

        globals()["exigir_base_inalterada"] = conferir_espiao
        try:
            montar_release(
                fontes, matriz, None, [bloco], "2026/09",
                exigir_referencias=False,
            )
        finally:
            globals()["exigir_base_inalterada"] = conferir_real
        exigir_teste(
            conferencias == [("2026/06", "2026/09")],
            "montar_release não conferiu a base contra a janela estendida",
        )

        # --- R07: exigir_base_inalterada enxerga qualquer chave e o manifesto
        outro = copy.deepcopy(dados_ext)
        outro["recortes"]["trimestre-2025-T4"]["prestadores"][0]["pagamento"] += 1
        exigir_erro(
            lambda: exigir_base_inalterada(dados_base, outro),
            "trimestre-2025-T4: prestadores",
            "alteração fora do resumo em recorte fechado não foi bloqueada",
        )

        outro = copy.deepcopy(dados_ext)
        outro["meta"]["manifesto_fontes"][0]["sha256"] = "0" * 64
        exigir_erro(
            lambda: exigir_base_inalterada(dados_base, outro),
            "manifesto das 19 fontes mudou",
            "mudança no manifesto das 19 fontes não foi bloqueada",
        )

        # --- R09: regra de recuperação da data (matrícula + nome + data única)
        def sem_data(matricula, nome):
            return {
                "matricula": matricula, "nome": nome, "nasc": "",
                "anomes": "2026/07", "arquivo": "bloco-unitario.xlsx",
                "qtd": Decimal(1), "valor": Decimal(10),
            }

        base_unitaria = [
            {"matricula": "MAT-A", "nome": "CRIANCA A", "nasc": "2015-01-01"},
            {"matricula": "MAT-A", "nome": "CRIANCA A", "nasc": "2015-01-02"},
            {"matricula": "MAT-B", "nome": "CRIANCA B", "nasc": "2016-01-01"},
            {"matricula": "", "nome": "CRIANCA C", "nasc": "2017-01-01"},
        ]
        casos = [
            sem_data("MAT-A", "CRIANCA A"),      # duas datas: ambígua
            sem_data("MAT-OUTRA", "CRIANCA B"),  # homônimo, outra matrícula
            sem_data("", "CRIANCA C"),           # sem matrícula
            sem_data("MAT-B", "CRIANCA B"),      # recuperável pela base
        ]
        manifesto_unitario = [
            {"arquivo": "bloco-unitario.xlsx", "registros_na_janela": 4}
        ]
        definir_janela("2026/07")
        try:
            resolver_nascimentos(base_unitaria, casos, manifesto_unitario)
        finally:
            definir_janela(FIM_BASE)
        exigir_teste(
            [c["nasc"] for c in casos] == ["", "", "", "2016-01-01"]
            and [bool(c.get("sem_nascimento")) for c in casos]
            == [True, True, True, False]
            and manifesto_unitario[0]["sem_nascimento"]["recuperados"] == 1
            and manifesto_unitario[0]["sem_nascimento"]["fora_do_painel"] == 3,
            "data recuperada fora da regra matrícula + nome + data única",
        )

        # --- R10: a data também é recuperada de outro registro do próprio bloco
        vizinho = sem_data("MAT-N", "CRIANCA NOVA DO BLOCO")
        vizinho["nasc"] = "2018-03-01"
        caso = sem_data("MAT-N", "CRIANCA NOVA DO BLOCO")
        manifesto_unitario = [
            {"arquivo": "bloco-unitario.xlsx", "registros_na_janela": 2}
        ]
        definir_janela("2026/07")
        try:
            resolver_nascimentos([], [vizinho, caso], manifesto_unitario)
        finally:
            definir_janela(FIM_BASE)
        exigir_teste(
            caso["nasc"] == "2018-03-01"
            and caso["paciente"] == ("CRIANCA NOVA DO BLOCO", "2018-03-01")
            and manifesto_unitario[0]["sem_nascimento"]["recuperados"] == 1,
            "data não recuperada de outro registro do mesmo bloco",
        )

        # --- R10b: evidência de competência posterior não vale para trás
        depois = sem_data("MAT-T", "CRIANCA DO TEMPO")
        depois["anomes"], depois["nasc"] = "2026/08", "2019-01-01"
        antes = sem_data("MAT-T", "CRIANCA DO TEMPO")
        mesmo_mes = sem_data("MAT-T", "CRIANCA DO TEMPO")
        mesmo_mes["anomes"] = "2026/08"
        cedido = sem_data("MAT-U", "CRIANCA CEDIDA")
        cedido["nasc"], cedido["cedido"] = "2019-02-02", True
        orfao = sem_data("MAT-U", "CRIANCA CEDIDA")
        manifesto_unitario = [
            {"arquivo": "bloco-unitario.xlsx", "registros_na_janela": 5}
        ]
        definir_janela("2026/08")
        try:
            resolver_nascimentos(
                [], [depois, antes, mesmo_mes, cedido, orfao], manifesto_unitario
            )
        finally:
            definir_janela(FIM_BASE)
        exigir_teste(
            antes["nasc"] == "" and antes.get("sem_nascimento") is True
            and mesmo_mes["nasc"] == "2019-01-01"
            and orfao["nasc"] == "" and orfao.get("sem_nascimento") is True
            and manifesto_unitario[0]["sem_nascimento"]["recuperados"] == 1
            and manifesto_unitario[0]["sem_nascimento"]["fora_do_painel"] == 2,
            "data de competência posterior ou de registro cedido foi usada "
            "como evidência",
        )

        # --- R11: tolerância proporcional (0,2% do bloco, o que for maior)
        manifesto_grande = [
            {"arquivo": "bloco-unitario.xlsx", "registros_na_janela": 5000}
        ]
        definir_janela("2026/07")
        try:
            oito = [sem_data(f"MAT-X{i}", f"CRIANCA X{i}") for i in range(8)]
            resolver_nascimentos([], oito, manifesto_grande)
            exigir_teste(
                manifesto_grande[0]["sem_nascimento"]["fora_do_painel"] == 8,
                "8 registros sem data em bloco de 5.000 devem ser tolerados",
            )
            onze = [sem_data(f"MAT-Y{i}", f"CRIANCA Y{i}") for i in range(11)]
            try:
                resolver_nascimentos([], onze, manifesto_grande)
            except ErroPipeline as exc:
                exigir_teste(
                    "acima da tolerância de 10" in str(exc),
                    "tolerância proporcional com limite inesperado",
                )
            else:
                raise ErroPipeline(
                    "selftest: 11 registros sem data em bloco de 5.000 "
                    "não foram bloqueados"
                )
        finally:
            definir_janela(FIM_BASE)

        # --- R12: linha sem nascimento além da janela não é contada
        dados_jul, _a2, _r2, _t2, _e2 = montar_release(
            fontes, matriz, None, [bloco], "2026/07",
            exigir_referencias=False,
        )
        exigir_teste(
            dados_jul["meta"]["blocos_fonte"][0]["sem_nascimento"]
            == {
                "registros": 1,
                "recuperados": 1,
                "fora_do_painel": 0,
                "sessoes_fora_do_painel": 0,
                "pagamento_fora_do_painel": 0.0,
                "competencias": ["2026/07"],
            },
            "linha sem nascimento além da janela publicada foi contada",
        )

        # --- R13: bloco com competência da base é barrado já na leitura
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_base], "2026/07",
                exigir_referencias=False,
            ),
            "bloco complementar contém competência do período-base ou "
            "anterior (2026/06)",
            "bloco com competência do período-base não foi barrado na leitura",
        )

        # --- R14..R17: validar_saida reprova contrato de períodos e de blocos
        def validar_na_janela(dados_json, fim):
            definir_janela(fim)
            try:
                return validar_saida(
                    dados_json, auditoria_ext, _r, exigir_referencias=False
                )
            finally:
                definir_janela(FIM_BASE)

        exigir_teste(
            validar_na_janela(dados_ext, "2026/09") == texto_ext,
            "JSON estendido íntegro deve revalidar na própria janela",
        )
        sem_recorte = copy.deepcopy(dados_ext)
        del sem_recorte["recortes"]["mes-2026-09"]
        exigir_erro(
            lambda: validar_na_janela(sem_recorte, "2026/09"),
            "contrato de períodos diverge da janela publicada",
            "recorte ausente não foi reprovado",
        )

        sem_blocos = copy.deepcopy(dados_ext)
        sem_blocos["meta"]["blocos_fonte"] = []
        exigir_erro(
            lambda: validar_na_janela(sem_blocos, "2026/09"),
            "blocos complementares incoerentes com a janela publicada",
            "janela estendida sem blocos declarados não foi reprovada",
        )

        incompleto = copy.deepcopy(dados_ext)
        incompleto["meta"]["blocos_fonte"][0]["competencias_na_janela"] = [
            "2026/07", "2026/08",
        ]
        exigir_erro(
            lambda: validar_na_janela(incompleto, "2026/09"),
            "blocos complementares não cobrem exatamente",
            "cobertura incompleta dos blocos não foi reprovada",
        )

        vazio = copy.deepcopy(dados_ext)
        vazio["recortes"]["tudo"]["serie_mensal"][-1]["registros"] = 0
        exigir_erro(
            lambda: validar_na_janela(vazio, "2026/09"),
            "competência 2026/09 publicada sem registros",
            "competência publicada sem registros não foi reprovada",
        )

        # --- R18: máscara de forma_celula cobre letras e dígitos
        exigir_teste(
            forma_celula("Maria José 01/02/2015")
            == "formato AAAAA AAAA 99/99/9999, 21 caracteres",
            "forma_celula deixou letra ou dígito da célula passar",
        )

        # --- R19: em bloco, data ilegível não é "ausente"
        valores_bloco = [
            "2026/07", "MAT-DATA", "CRIANCA DATA ILEGIVEL", "31/02/2015",
            "FEMININO", "GUIA-DATA", date(2026, 7, 15), "SOL-DATA",
            "SOLICITANTE COMUM", "Psicologo clinico", "SPSADT",
            50005103, "PROCEDIMENTO 50005103", "SESSAO", "PREST-DATA",
            "PRESTADOR 50005103 LTDA", "CLINICA ESPECIALIZADA", 1, 100,
        ]

        try:
            normalizar_registro(
                valores_bloco, Path("bloco.xlsx"), 2,
                nascimento_opcional=True,
            )
        except ErroPipeline as exc:
            exigir_teste(
                "Data Nascimento inválida (formato 99/99/9999" in str(exc),
                "data ilegível em bloco com mensagem inesperada",
            )
        else:
            raise ErroPipeline(
                "selftest: data de nascimento ilegível em bloco foi "
                "tratada como ausente"
            )
        ausente = list(valores_bloco)
        ausente[3] = "não informado"
        exigir_teste(
            normalizar_registro(
                ausente, Path("bloco.xlsx"), 2, nascimento_opcional=True
            )["nasc"] == "",
            "nascimento ausente em bloco deveria ser aceito",
        )

        # --- R20: fonte-base continua exigindo data de nascimento
        from openpyxl import load_workbook

        fonte_sem_data = raiz / "fonte-sem-nascimento.xlsx"
        wb = load_workbook(fontes / "fonte-50005189.xlsx")
        wb.active.cell(row=2, column=4).value = None
        wb.save(fonte_sem_data)
        exigir_erro(
            lambda: ler_fonte_xlsx(fonte_sem_data),
            "Data Nascimento inválida (célula vazia)",
            "fonte-base sem data de nascimento foi aceita",
        )

        # --- R21: o texto devolvido é o JSON da janela estendida
        exigir_teste(
            json.loads(texto_ext) == dados_ext
            and json.loads(texto_base) == dados_base,
            "texto JSON devolvido por montar_release diverge do objeto",
        )

        # --- R22: anti-vazamento roda sobre a janela estendida e cobre
        #          também os registros de bloco que ficaram fora da agregação
        bloco_vazado = raiz / "blocos" / "bloco-vazado.xlsx"
        wb = load_workbook(bloco)
        ws = wb.active
        alvo = next(
            linha for linha in range(2, ws.max_row + 1)
            if ws.cell(row=linha, column=1).value == "2026/07"
            and str(ws.cell(row=linha, column=16).value).startswith("PRESTADOR ")
            and ws.cell(row=linha, column=17).value == "CLINICA ESPECIALIZADA"
        )
        ws.cell(row=alvo, column=16).value = "CRIANCA SEM NASCIMENTO 1"
        wb.save(bloco_vazado)
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_vazado], "2026/09",
                exigir_referencias=False,
            ),
            "anti-vazamento bloqueou presença de nome de beneficiário",
            "nome de beneficiário publicado como prestador do bloco não "
            "foi bloqueado",
        )

        # --- R23: executar_build repassa --bloco/--ate e imprime o relatório
        chamadas = []
        montar_real = globals()["montar_release"]

        def montar_espiao(
            diretorio, matriz_, corte=None, blocos=(), ate=None,
            exigir_referencias=True,
        ):
            chamadas.append((list(blocos), ate, exigir_referencias))
            return montar_real(
                diretorio, matriz_, corte, blocos, ate,
                exigir_referencias=False,
            )

        saida_cli = raiz / "saida-cli.json"
        relatorio = io.StringIO()
        globals()["montar_release"] = montar_espiao
        try:
            with contextlib.redirect_stdout(relatorio):
                executar_build(
                    fontes, matriz, None, saida_cli, [bloco], "2026/09"
                )
        finally:
            globals()["montar_release"] = montar_real
        publicado = json.loads(saida_cli.read_text(encoding="utf-8"))
        exigir_teste(
            chamadas == [([bloco], "2026/09", True)]
            and publicado["recortes"] == dados_ext["recortes"]
            and publicado["meta"]["periodo_canonico"]["fim"] == "2026/09",
            "executar_build não repassou --bloco/--ate ou gravou outro JSON",
        )
        exigir_teste(
            "28 recortes da base idênticos" in relatorio.getvalue()
            and "2026/09 | 14 (100,0%) | 114 | " in relatorio.getvalue()
            and "367 agregados + 6 de terapia descartada + 1 sem data de "
            "nascimento" in relatorio.getvalue()
            and "Sem lançamento 2026/09 : " in relatorio.getvalue()
            and "(1 sessão, " in relatorio.getvalue()
            and "CRIANCA" not in relatorio.getvalue(),
            "relatório do build estendido incompleto ou com nome de "
            "beneficiário",
        )
        pagamento_pecs = 6 * (120 + list(MAPA_CODIGOS).index("50005146"))
        exigir_teste(
            "6 registros pós-base fora do painel em 2026/07 "
            f"(6 sessões, {formatar_brl(pagamento_pecs)})" in relatorio.getvalue(),
            "relatório não declarou sessões e pagamento de PECS pós-base",
        )
        exigir_teste(
            formatar_numero(Decimal("1234.5")) == "1.234,50"
            and formatar_numero(Decimal("2")) == "2"
            and formatar_numero(0.25) == "0,25",
            "formatar_numero não preservou a fração de sessões",
        )

        # --- R23b: falha ao montar o relatório não deixa JSON gravado
        saida_falha = raiz / "saida-relatorio-falho.json"
        imprimir_real = globals()["imprimir_relatorio"]

        def relatorio_quebrado(*_args, **_kwargs):
            raise RuntimeError("falha sintética no relatório")

        globals()["montar_release"] = lambda *_a, **_k: (
            dados_ext, auditoria_ext, _r, texto_ext, extensao
        )
        globals()["imprimir_relatorio"] = relatorio_quebrado
        try:
            try:
                executar_build(
                    fontes, matriz, None, saida_falha, [bloco], "2026/09"
                )
            except RuntimeError:
                pass
            else:
                raise ErroPipeline(
                    "selftest: falha sintética do relatório não ocorreu"
                )
        finally:
            globals()["montar_release"] = montar_real
            globals()["imprimir_relatorio"] = imprimir_real
        exigir_teste(
            not saida_falha.exists(),
            "JSON gravado apesar de o relatório ter falhado",
        )

        # --- R24: bloco dentro de repositório Git é recusado
        bloco_em_git = falso_git / bloco.name
        bloco_em_git.write_bytes(bloco.read_bytes())
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco_em_git], "2026/09",
                exigir_referencias=False,
            ),
            "bloco complementar está dentro do repositório Git",
            "bloco dentro de repositório Git não foi bloqueado",
        )

        # --- R25: --ate anterior à base ou malformado
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco], "2026/05",
                exigir_referencias=False,
            ),
            "--ate não pode ser anterior ao fim do período-base",
            "--ate anterior ao período-base não foi bloqueado",
        )
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco], "2026-09",
                exigir_referencias=False,
            ),
            "--ate deve ter o formato AAAA/MM",
            "--ate malformado não foi bloqueado",
        )

        # --- R26: critérios de aceite da base valem também no build com bloco
        exigir_erro(
            lambda: montar_release(
                fontes, matriz, None, [bloco], "2026/09",
                exigir_referencias=True,
            ),
            "crianças únicas: 13 != 1416",
            "critérios de aceite da base não foram exigidos no build com bloco",
        )

        # --- R27: main repassa --bloco/--ate a executar_build
        recebidos = []
        executar_real = globals()["executar_build"]
        argv_real = sys.argv
        globals()["executar_build"] = (
            lambda *args, **kwargs: recebidos.append((args, kwargs))
        )
        sys.argv = [
            "build-tea-data.py", "DIRETORIO", "--matriz", "MATRIZ.xlsx",
            "--saida", "SAIDA.json", "--bloco", "B1.xlsx",
            "--bloco", "B2.xlsx", "--ate", "2026/09",
        ]
        try:
            main()
        finally:
            sys.argv = argv_real
            globals()["executar_build"] = executar_real
        exigir_teste(
            recebidos
            == [
                (
                    ("DIRETORIO", "MATRIZ.xlsx", None, "SAIDA.json",
                     ["B1.xlsx", "B2.xlsx"], "2026/09"),
                    {},
                )
            ],
            "main não repassou --bloco/--ate a executar_build",
        )

        # --- R29: faixas etárias usam o corte da janela publicada
        faixas = {
            f["faixa"]: f["pacientes"]
            for f in dados_ext["recortes"]["tudo"]["pacientes"]["faixa_etaria"]
        }
        exigir_teste(
            faixas["9–11"] == 3 and faixas["12–14"] == 10
            and faixas["18+"] == 1,
            "faixas etárias não foram calculadas com o corte 2026-09-30",
        )

    # A ferramenta de release tem autoteste próprio, com a rede simulada; ele
    # roda aqui para que o CI cubra as duas ferramentas com um só comando.
    especificacao = importlib.util.spec_from_file_location(
        "tea_release", Path(__file__).resolve().with_name("tea-release.py")
    )
    tea_release = importlib.util.module_from_spec(especificacao)
    especificacao.loader.exec_module(tea_release)
    tea_release.selftest()

    print(
        "selftest OK — 19 fontes xlsx, schema/aba, cobertura e descarte, "
        "AT, deduplicação, merge, métricas exatas, anti-vazamento, períodos, "
        "destino privado, pagamento zero, Matriz 2025, Casa Unimed "
        "(consolidação por registro, composição, caso misto, guarda), "
        "disciplina × canal, resumo/pacientes por disciplina e kits (k>=5); "
        "janela estendida (base congelada + blocos complementares, 35 e 39 "
        "recortes, 28 recortes fechados idênticos, terapia e disciplina sem "
        "movimento, PECS fora, nascimento ausente recuperado ou declarado, "
        "fechamento por bloco, continuidade e grafia das crianças, guardas "
        "de bloco, critérios de aceite da base, linha de comando, relatório "
        "antes da gravação e mensagens de erro sem conteúdo de célula)"
    )


def executar_build(diretorio, matriz, corte, saida, blocos=(), ate=None):
    destino = exigir_saida_fora_de_git(saida)
    exigir_fora_de_git(matriz, "Matriz Analítica 2025")
    dados, auditoria, reconciliacao, texto_json, extensao = montar_release(
        diretorio, matriz, corte, blocos, ate, exigir_referencias=True
    )
    # O relatório é montado antes da gravação: se ele falhar, nada é escrito.
    relatorio = io.StringIO()
    with contextlib.redirect_stdout(relatorio):
        imprimir_relatorio(dados, auditoria, reconciliacao, destino, extensao)
    escrita_atomica(destino, texto_json + "\n")
    print(relatorio.getvalue(), end="")


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument(
        "diretorio",
        nargs="?",
        help="diretório externo com exatamente 19 planilhas-fonte xlsx",
    )
    ap.add_argument(
        "--matriz",
        help="Matriz Analítica 2025 externa, obrigatória no build real",
    )
    ap.add_argument(
        "--saida",
        help="arquivo JSON privado, obrigatoriamente fora de qualquer Git",
    )
    ap.add_argument(
        "--bloco",
        action="append",
        default=[],
        metavar="XLSX",
        help=(
            "planilha complementar consolidada (vários códigos) com "
            "competências posteriores ao período-base; repita a opção para "
            "mais de um bloco"
        ),
    )
    ap.add_argument(
        "--ate",
        metavar="AAAA/MM",
        help=(
            "última competência fechada a publicar; obrigatória com --bloco "
            f"(sem blocos, a janela termina em {FIM_BASE})"
        ),
    )
    ap.add_argument(
        "--corte",
        help=(
            "data de corte etário AAAA-MM-DD (padrão: último dia da última "
            "competência publicada)"
        ),
    )
    ap.add_argument(
        "--emit-p",
        action="store_true",
        help="regenera p/painel-tea/index.html a partir do HTML interno atual",
    )
    ap.add_argument(
        "--selftest",
        action="store_true",
        help="roda a fixture sintética multi-fonte fora do repositório",
    )
    args = ap.parse_args()

    try:
        if args.selftest:
            selftest()
            return
        if args.emit_p and not args.diretorio:
            emitir_p()
            return
        if not args.diretorio:
            ap.error("informe o diretório externo com as 19 fontes")
        if not args.matriz:
            ap.error("--matriz é obrigatória no build real")
        if not args.saida:
            ap.error("--saida é obrigatória no build real e deve ficar fora de Git")
        corte = date.fromisoformat(args.corte) if args.corte else None
        executar_build(
            args.diretorio, args.matriz, corte, args.saida, args.bloco, args.ate
        )
        if args.emit_p:
            emitir_p()
    except (ErroPipeline, ValueError, OSError) as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
