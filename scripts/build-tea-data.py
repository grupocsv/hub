#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-tea-data.py — Pipeline de dados do Painel TEA v2 (Unimed GV).

Lê a planilha oficial de micro-dados (xlsx ou csv, SEMPRE fora do repositório),
aplica as regras do LEIA-ME e gera exclusivamente agregados k-anonimizados:

  a) unimed/data/tea-2025-2026.json  (artefato canônico auditável)
  b) o mesmo JSON injetado em unimed/tea.html entre os marcadores
     <!-- TEA-DATA:BEGIN --> / <!-- TEA-DATA:END -->
  c) --emit-public DIR : deriva a variante pública (Open Pages; o gate de senha é
                         EXCLUSIVO do Worker — auth_gate=true no slug, nunca embutido)
  d) --auditoria       : grava a fila nominal de auditoria AO LADO DO INSUMO
                         (fora do repo) — uso interno da operadora, jamais commitada

Referência normativa: docs/_infra/prd-2026-07-painel-tea-v2.md (§6).

Regras invioláveis (LGPD — o repositório é público):
  - Nome, matrícula, nascimento e nº de guia de beneficiário NUNCA saem deste script
    em (a), (b) ou (c). Varredura anti-vazamento bloqueante antes de escrever.
  - Contagens de pacientes < 5 são publicadas como "<5" (k-anonimato, k=5).
  - Evento extremo único (registro >= R$ 10 mil ou paciente-mês > p99) de prestador
    com < 5 pacientes não sai com nome do prestador + competência juntos.

Uso:
  python3 scripts/build-tea-data.py ~/dados/tea-2026-06.xlsx --corte 2026-06-30
  python3 scripts/build-tea-data.py --csv insumo.csv --corte 2026-06-30
  python3 scripts/build-tea-data.py --selftest       (usa a fixture sintética)
"""

import argparse
import csv
import hashlib
import io
import json
import math
import os
import re
import statistics
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import date, datetime

VERSAO = "2.0.0"
K_ANON = 5
LIMIAR_EVENTO_EXTREMO = 10_000.0
JSON_MAX_BYTES = 120 * 1024
HTML_MAX_BYTES = 300 * 1024

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_OUT = os.path.join(REPO_ROOT, "unimed", "data", "tea-2025-2026.json")
HTML_ALVO = os.path.join(REPO_ROOT, "unimed", "tea.html")
MARC_INI = "<!-- TEA-DATA:BEGIN -->"
MARC_FIM = "<!-- TEA-DATA:END -->"

# ---- Regras do LEIA-ME (PRD §2.3) — completas; nenhuma regra implícita ----
CASA_UNIMED = "CASA UNIMED"
TIPO_CASA = "ATENDIMENTO ESPECIALIZADO"
MERGE_CNPJ = {
    "ANA CAROLINA OLIVEIRA FARIA FALCAO LTDA",
    "CRIAR E CRESCER TEEN LTDA",
}
NOME_MERGE_CNPJ = "CRIAR E CRESCER TEEN (ex-Ana Carolina O. F. Falcão)"
CANAL = {
    "ATENDIMENTO ESPECIALIZADO": "Casa Unimed",
    "ATENDIMENTOS FORNECEDORES": "Negociação Direta",
    "CLINICA ESPECIALIZADA": "Rede Credenciada",
    "OUTRAS ESPEC. EXCETO MEDICO": "Negociação Direta (P.F)",
    "REEMBOLSO": "Reembolso",
    "UNIMED NACIONAL": "Intercâmbio",
    "UNIMED REGIONAL": "Intercâmbio",
}
FAIXAS = ["0-2", "3-5", "6-8", "9-11", "12-14", "15-17", "18+"]
BUCKETS_INTENSIDADE = ["<3", "3-4,9", "5-8,9", "9+"]  # esquema ÚNICO do contrato (§6.4)

COLS = ["anomes", "matricula", "nome", "nasc", "genero", "guia", "dt_atend",
        "cod_sol", "nome_sol", "cbos", "tipo_guia", "cod_proc", "nome_proc",
        "tipo_proc", "cod_prest", "nome_prest", "tipo_prest", "qtd", "valor"]


def falha(msg):
    print(f"ERRO: {msg}", file=sys.stderr)
    sys.exit(1)


def dentro_de_repo_git(caminho):
    d = os.path.dirname(os.path.abspath(caminho))
    while True:
        if os.path.isdir(os.path.join(d, ".git")):
            return True
        pai = os.path.dirname(d)
        if pai == d:
            return False
        d = pai


def ler_insumo(args):
    caminho = args.csv or args.xlsx
    if not caminho:
        falha("informe o insumo (xlsx posicional ou --csv)")
    if not os.path.isfile(caminho):
        falha(f"insumo não encontrado: {caminho}")
    if not args.permitir_insumo_no_repo and dentro_de_repo_git(caminho):
        falha("o insumo está dentro de um repositório git — o dado bruto JAMAIS "
              "pode viver no repo (PRD §6.1). Mova-o para fora e rode de novo.")
    bruto = open(caminho, "rb").read()
    sha = hashlib.sha256(bruto).hexdigest()
    linhas = []
    if args.csv:
        r = csv.reader(io.StringIO(bruto.decode("utf-8")))
        cab = next(r)
        for row in r:
            if any(c.strip() for c in row):
                linhas.append(row)
    else:
        try:
            import openpyxl
        except ImportError:
            falha("openpyxl não instalado (pip install openpyxl) — ou use --csv")
        wb = openpyxl.load_workbook(caminho, data_only=True, read_only=True)
        aba = next((n for n in wb.sheetnames if n.upper().startswith("DB")), None)
        if not aba:
            falha(f"nenhuma aba DB_* encontrada (abas: {wb.sheetnames})")
        it = wb[aba].iter_rows(values_only=True)
        next(it)  # cabeçalho
        for row in it:
            if row is None or all(c is None for c in row):
                continue
            out = []
            for c in row:
                if isinstance(c, datetime):
                    out.append(c.strftime("%Y-%m-%d"))
                else:
                    out.append("" if c is None else str(c))
            linhas.append(out)
    regs = []
    for row in linhas:
        if len(row) < len(COLS):
            falha(f"linha com {len(row)} colunas (esperado {len(COLS)}): {row[:3]}...")
        regs.append(dict(zip(COLS, [str(c).strip() for c in row[:len(COLS)]])))
    return regs, sha


# ---------------- chaves e derivações ----------------

def chave_paciente(r):
    # Regra 1 do LEIA-ME: NOME + DATA DE NASCIMENTO (nunca matrícula)
    return (r["nome"].upper(), r["nasc"][:10])


def prestador_agrupado(r):
    # Regra 2 (por REGISTRO) e 3 do LEIA-ME
    if r["tipo_prest"] == TIPO_CASA:
        return CASA_UNIMED
    if r["nome_prest"] in MERGE_CNPJ:
        return NOME_MERGE_CNPJ
    return r["nome_prest"]


def canal_do(r):
    t = r["tipo_prest"]
    if t not in CANAL:
        falha(f"Tipo Prestador desconhecido: '{t}' — atualizar o mapa do LEIA-ME")
    return CANAL[t]


def idade_em(nasc_iso, corte):
    # Método fixado (PRD §6.2): anos COMPLETOS (aniversário) na data de corte.
    y, m, d = int(nasc_iso[:4]), int(nasc_iso[5:7]), int(nasc_iso[8:10])
    return corte.year - y - ((corte.month, corte.day) < (m, d))


def faixa_de(idade):
    if idade < 3: return "0-2"
    if idade < 6: return "3-5"
    if idade < 9: return "6-8"
    if idade < 12: return "9-11"
    if idade < 15: return "12-14"
    if idade < 18: return "15-17"
    return "18+"


def ym_int(anomes):  # "2025/01" -> 24301
    return int(anomes[:4]) * 12 + int(anomes[5:7])


def k5(n):
    return n if n >= K_ANON else "<5"


def pctl(valores, p):
    v = sorted(valores)
    k = (len(v) - 1) * p
    f, c = math.floor(k), math.ceil(k)
    return v[f] + (v[c] - v[f]) * (k - f)


def r2(x):
    return round(x + 1e-9, 2)


# ---------------- agregação ----------------

def agregar(regs, corte):
    for r in regs:
        r["_qtd"] = float(r["qtd"])
        r["_val"] = float(r["valor"])
        r["_pac"] = chave_paciente(r)
        r["_prest"] = prestador_agrupado(r)
        r["_canal"] = canal_do(r)

    meses = sorted({r["anomes"] for r in regs})
    pacientes = sorted({r["_pac"] for r in regs})
    custo_total = sum(r["_val"] for r in regs)
    sessoes_total = sum(r["_qtd"] for r in regs)

    d = {}
    d["meta"] = {
        "painel": "Painel Estratégico TEA — Terapia ABA · Psicologia (50005103)",
        "data_corte": corte.isoformat(),
        "gerado_em": date.today().isoformat(),
        "versao_script": VERSAO,
        "politica_k": K_ANON,
        "periodo": {"inicio": meses[0], "fim": meses[-1], "competencias": len(meses)},
        "contagens": {
            "registros": len(regs),
            "sessoes": int(round(sessoes_total)),
            "custo_total": r2(custo_total),
            "custo_por_sessao": r2(custo_total / sessoes_total),
            "pacientes": len(pacientes),
            "matriculas": len({r["matricula"] for r in regs}),
            "prestadores": len({r["_prest"] for r in regs}),
        },
    }

    # ---- série mensal ----
    sm = []
    por_mes = defaultdict(lambda: {"c": 0.0, "s": 0.0, "p": set(), "n": 0, "pr": set()})
    for r in regs:
        e = por_mes[r["anomes"]]
        e["c"] += r["_val"]; e["s"] += r["_qtd"]; e["p"].add(r["_pac"])
        e["n"] += 1; e["pr"].add(r["_prest"])
    for m in meses:
        e = por_mes[m]
        sm.append({"m": m, "custo": r2(e["c"]), "sessoes": int(round(e["s"])),
                   "pacientes": len(e["p"]), "registros": e["n"],
                   "custo_sessao": r2(e["c"] / e["s"]),
                   "sessoes_por_paciente": r2(e["s"] / len(e["p"])),
                   "prestadores_ativos": len(e["pr"])})
    d["serie_mensal"] = sm

    # ---- comparativos ----
    anos = sorted({m[:4] for m in meses})
    def soma(pred):
        cs = [(x["custo"], x["sessoes"]) for x in sm if pred(x["m"])]
        return r2(sum(c for c, _ in cs)), sum(s for _, s in cs)
    ano_cheio = {}
    for a in anos:
        ms_do_ano = [m for m in meses if m.startswith(a)]
        if len(ms_do_ano) == 12:
            c, s = soma(lambda m, a=a: m.startswith(a))
            ano_cheio[a] = {"custo": c, "sessoes": s}
    ultimo_ano = meses[-1][:4]
    s1_atual = [m for m in meses if m.startswith(ultimo_ano) and int(m[5:7]) <= 6]
    s1_prev = [m.replace(ultimo_ano, str(int(ultimo_ano) - 1)) for m in s1_atual]
    s1_prev = [m for m in s1_prev if m in meses]
    comp = {"anos_fechados": ano_cheio}
    if s1_atual and len(s1_prev) == len(s1_atual):
        ca, sa = soma(lambda m: m in s1_atual)
        cp, sp = soma(lambda m: m in s1_prev)
        comp["s1_atual"] = {"ano": ultimo_ano, "custo": ca, "sessoes": sa,
                            "media_mensal": r2(ca / len(s1_atual)),
                            "run_rate_anual": r2(ca * 12 / len(s1_atual))}
        comp["s1_anterior"] = {"custo": cp, "sessoes": sp}
        comp["yoy_s1"] = {"custo_pct": r2((ca / cp - 1) * 100),
                          "sessoes_pct": r2((sa / sp - 1) * 100)}
    picos = max(sm, key=lambda x: x["custo"]); vales = min(sm, key=lambda x: x["custo"])
    comp["pico"] = {"m": picos["m"], "custo": picos["custo"]}
    comp["vale"] = {"m": vales["m"], "custo": vales["custo"]}
    d["comparativos"] = comp

    # ---- prestadores ----
    pr = defaultdict(lambda: {"c": 0.0, "s": 0.0, "p": set(), "meses": set(),
                              "canais": Counter()})
    for r in regs:
        e = pr[r["_prest"]]
        e["c"] += r["_val"]; e["s"] += r["_qtd"]; e["p"].add(r["_pac"])
        e["meses"].add(r["anomes"]); e["canais"][r["_canal"]] += r["_val"]
    rank = sorted(pr.items(), key=lambda kv: -kv[1]["c"])
    d["ranking_prestadores"] = [{
        "nome": nome, "canal": e["canais"].most_common(1)[0][0],
        "custo": r2(e["c"]), "participacao_pct": r2(e["c"] / custo_total * 100),
        "sessoes": int(round(e["s"])), "custo_sessao": r2(e["c"] / e["s"]) if e["s"] else 0,
        "pacientes": k5(len(e["p"])), "meses_ativos": len(e["meses"]),
    } for nome, e in rank]

    shares = [e["c"] / custo_total * 100 for _, e in rank]
    def hhi(sub):
        t = sum(r["_val"] for r in sub)
        pp = defaultdict(float)
        for r in sub: pp[r["_prest"]] += r["_val"]
        return r2(sum((v / t * 100) ** 2 for v in pp.values()))
    conc = {"top5_pct": r2(sum(shares[:5])), "top10_pct": r2(sum(shares[:10])),
            "top15_pct": r2(sum(shares[:15])), "hhi_periodo": hhi(regs)}
    if ano_cheio:
        a0 = sorted(ano_cheio)[0]
        conc[f"hhi_{a0}"] = hhi([r for r in regs if r["anomes"].startswith(a0)])
    if "s1_atual" in comp:
        conc[f"hhi_s1_{ultimo_ano}"] = hhi([r for r in regs if r["anomes"] in s1_atual])
    d["concentracao"] = conc

    # série mensal dos top 15 (controle de peso do JSON)
    top15 = [nome for nome, _ in rank[:15]]
    sp = {}
    for nome in top15:
        serie = {"custo": [], "sessoes": [], "preco": []}
        for m in meses:
            rs = [r for r in regs if r["_prest"] == nome and r["anomes"] == m]
            c = sum(r["_val"] for r in rs); s = sum(r["_qtd"] for r in rs)
            serie["custo"].append(r2(c)); serie["sessoes"].append(int(round(s)))
            serie["preco"].append(r2(c / s) if s else None)
        sp[nome] = serie
    d["serie_prestador"] = {"meses": meses, "prestadores": sp}

    # dispersão de preço (>=100 sessões) e economia potencial
    eleg = [(nome, e) for nome, e in rank if e["s"] >= 100]
    media_carteira = custo_total / sessoes_total
    disp = [{"nome": n, "preco": r2(e["c"] / e["s"]), "sessoes": int(round(e["s"]))}
            for n, e in eleg]
    disp.sort(key=lambda x: -x["preco"])
    d["dispersao_preco"] = {
        "prestadores": disp,
        "referencias": {"casa_unimed": r2(pr[CASA_UNIMED]["c"] / pr[CASA_UNIMED]["s"]) if CASA_UNIMED in pr and pr[CASA_UNIMED]["s"] else None,
                        "media_carteira": r2(media_carteira),
                        "mediana_grupo": r2(statistics.median([x["preco"] for x in disp])) if disp else None},
        "precos_unitarios_distintos": len({r2(r["_val"] / r["_qtd"]) for r in regs if r["_qtd"] > 0}),
    }
    econ = [{"nome": x["nome"], "preco": x["preco"], "sessoes": x["sessoes"],
             "gap_total": r2(x["sessoes"] * (x["preco"] - media_carteira))}
            for x in disp if x["preco"] > media_carteira]
    d["economia_potencial"] = {"referencia": r2(media_carteira), "prestadores": econ,
                               "gap_total": r2(sum(e["gap_total"] for e in econ))}

    # quadrante (elegíveis >=100 sessões): x = sessões/paciente-mês; y = R$/sessão
    quad = []
    pm_prest = defaultdict(set)
    for r in regs:
        pm_prest[r["_prest"]].add((r["_pac"], r["anomes"]))
    for nome, e in eleg:
        quad.append({"nome": nome, "x": r2(e["s"] / len(pm_prest[nome])),
                     "y": r2(e["c"] / e["s"]), "custo": r2(e["c"]),
                     "canal": pr[nome]["canais"].most_common(1)[0][0]})
    d["quadrante_prestadores"] = {
        "prestadores": quad,
        "cortes": {"y": r2(media_carteira),
                   "x": r2(statistics.median([q["x"] for q in quad])) if quad else None}}

    # ---- canais ----
    tp = defaultdict(lambda: {"c": 0.0, "s": 0.0, "p": set(), "pr": set()})
    for r in regs:
        e = tp[r["_canal"]]
        e["c"] += r["_val"]; e["s"] += r["_qtd"]; e["p"].add(r["_pac"]); e["pr"].add(r["_prest"])
    d["tipo_pagamento"] = [{
        "canal": c, "custo": r2(e["c"]), "pct": r2(e["c"] / custo_total * 100),
        "sessoes": int(round(e["s"])), "custo_sessao": r2(e["c"] / e["s"]),
        "pacientes": k5(len(e["p"])), "prestadores": len(e["pr"]),
    } for c, e in sorted(tp.items(), key=lambda kv: -kv[1]["c"])]
    canais_ord = [x["canal"] for x in d["tipo_pagamento"]]
    tpm = {c: [] for c in canais_ord}
    for m in meses:
        por_c = defaultdict(float)
        for r in regs:
            if r["anomes"] == m: por_c[r["_canal"]] += r["_val"]
        for c in canais_ord: tpm[c].append(r2(por_c.get(c, 0.0)))
    d["tipo_pagamento_mensal"] = {"meses": meses, "canais": tpm}

    inter = [r for r in regs if r["_canal"] == "Intercâmbio"]
    if inter:
        si = defaultdict(float)
        for r in inter: si[r["anomes"]] += r["_val"]
        pico_m = max(si, key=si.get)
        d["intercambio"] = {"custo": r2(sum(r["_val"] for r in inter)),
                            "sessoes": int(round(sum(r["_qtd"] for r in inter))),
                            "pacientes": k5(len({r["_pac"] for r in inter})),
                            "cooperativas": sorted({r["nome_prest"] for r in inter}),
                            "pico": {"m": pico_m, "custo": r2(si[pico_m])}}
    else:
        d["intercambio"] = None

    # ---- pacientes ----
    nasc = {}; gen = {}
    for r in regs:
        nasc.setdefault(r["_pac"], r["nasc"][:10]); gen[r["_pac"]] = r["genero"]
    idade = {p: idade_em(n, corte) for p, n in nasc.items()}
    fx_p = defaultdict(list)
    for p, i in idade.items(): fx_p[faixa_de(i)].append(p)
    custo_p = defaultdict(float)
    for r in regs: custo_p[r["_pac"]] += r["_val"]
    d["faixa_etaria"] = [{"faixa": f, "pacientes": k5(len(fx_p.get(f, []))),
                          "custo": r2(sum(custo_p[p] for p in fx_p.get(f, []))),
                          "pct_custo": r2(sum(custo_p[p] for p in fx_p.get(f, [])) / custo_total * 100)}
                         for f in FAIXAS]
    fxg = []
    for f in FAIXAS:
        M = sum(1 for p in fx_p.get(f, []) if gen[p] == "MASCULINO")
        F = sum(1 for p in fx_p.get(f, []) if gen[p] == "FEMININO")
        fxg.append({"faixa": f, "M": k5(M), "F": k5(F)})
    d["faixa_etaria_x_genero"] = fxg
    tot_g = Counter(gen.values())
    d["genero"] = {"M": tot_g.get("MASCULINO", 0), "F": tot_g.get("FEMININO", 0),
                   "razao": r2(tot_g.get("MASCULINO", 0) / tot_g.get("FEMININO", 1))}

    # intensidade — esquema único do contrato: média de sessões/mês-ativo por paciente
    spm = defaultdict(float)
    for r in regs: spm[(r["_pac"], r["anomes"])] += r["_qtd"]
    medias = defaultdict(list)
    for (p, _), s in spm.items(): medias[p].append(s)
    media_pac = {p: statistics.mean(v) for p, v in medias.items()}
    bkt = Counter()
    for m in media_pac.values():
        bkt["<3" if m < 3 else "3-4,9" if m < 5 else "5-8,9" if m < 9 else "9+"] += 1
    todos_pm = list(spm.values())
    d["intensidade"] = {
        "buckets": [{"faixa": b, "pacientes": k5(bkt.get(b, 0))} for b in BUCKETS_INTENSIDADE],
        "mediana_media_por_paciente": r2(statistics.median(sorted(media_pac.values()))),
        "paciente_mes": {"n": len(todos_pm), "mediana": r2(statistics.median(todos_pm)),
                         "p90": r2(pctl(todos_pm, 0.90)), "p99": r2(pctl(todos_pm, 0.99)),
                         "max": r2(max(todos_pm))}}

    vals = sorted(custo_p.values(), reverse=True)
    n10 = max(1, len(vals) // 10)
    d["custo_paciente"] = {"mediana": r2(statistics.median(vals)),
                           "p90": r2(pctl(vals, 0.90)), "p99": r2(pctl(vals, 0.99)),
                           "max": r2(vals[0]),
                           "top10pct": {"pacientes": k5(n10), "pct_custo": r2(sum(vals[:n10]) / custo_total * 100)},
                           "top10abs_pct_custo": r2(sum(vals[:10]) / custo_total * 100)}

    # permanência / entradas / saídas
    meses_pac = defaultdict(set)
    for r in regs: meses_pac[r["_pac"]].add(r["anomes"])
    perm = [len(v) for v in meses_pac.values()]
    dist_perm = Counter()
    for x in perm:
        dist_perm["1-3" if x <= 3 else "4-6" if x <= 6 else "7-9" if x <= 9
                  else "10-12" if x <= 12 else "13-17" if x <= 17 else str(len(meses))] += 1
    d["permanencia"] = {"media": r2(statistics.mean(perm)), "mediana": r2(statistics.median(perm)),
                        "presentes_todo_periodo": sum(1 for x in perm if x == len(meses)),
                        "dist": [{"faixa": f, "pacientes": k5(dist_perm.get(f, 0))}
                                 for f in ["1-3", "4-6", "7-9", "10-12", "13-17", str(len(meses))]]}
    prim = {p: min(v) for p, v in meses_pac.items()}
    ult = {p: max(v) for p, v in meses_pac.items()}
    corte_churn = meses[-1]
    es = []
    for m in meses:
        ent = sum(1 for v in prim.values() if v == m)
        sai = sum(1 for v in ult.values() if v == m)
        es.append({"m": m, "entradas": ent, "saidas": sai,
                   "estoque_inicial": m == meses[0],
                   "provisorio": ym_int(corte_churn) - ym_int(m) < 2})
    d["entradas_saidas"] = es

    # ---- qualidade / auditoria (agregados; regra de evento extremo aplicada) ----
    sem_sol = [r for r in regs if "NÃO INFORMADO" in r["nome_sol"].upper() or r["nome_sol"] == "-"]
    c_sem = sum(r["_val"] for r in sem_sol)
    psi = sum(1 for r in regs if r["cbos"] == "Psicologo clinico")
    med = sum(1 for r in regs if r["cbos"].startswith("Médico") or r["cbos"].startswith("MÉdico"))
    lags = Counter()
    for r in regs:
        at = r["dt_atend"][:7]
        lags[ym_int(r["anomes"]) - (int(at[:4]) * 12 + int(at[5:7]))] += 1
    nlag = sum(lags.values())
    retro = [r for r in regs if r["dt_atend"] and
             (date(int(r["anomes"][:4]), int(r["anomes"][5:7]), 1)
              - date(int(r["dt_atend"][:4]), int(r["dt_atend"][5:7]), int(r["dt_atend"][8:10]))).days > 90]
    p99_pm = pctl(todos_pm, 0.99)
    pac_por_prest = {n: len(e["p"]) for n, e in pr.items()}
    extremos = []
    for r in regs:
        if r["_val"] >= LIMIAR_EVENTO_EXTREMO:
            pequeno = pac_por_prest[r["_prest"]] < K_ANON
            extremos.append({
                "competencia": r["anomes"],
                "sessoes": int(round(r["_qtd"])), "valor": r2(r["_val"]),
                "canal": r["_canal"],
                # regra §6.3: nome + competência juntos só se o prestador tem >=5 pacientes
                "prestador": None if pequeno else r["_prest"],
                "nota": "prestador com <5 pacientes — identificação na fila privada de auditoria"
                        if pequeno else None})
    multi_pm = sum(1 for v in {k: {r["_prest"] for r in regs if (r["_pac"], r["anomes"]) == k}
                               for k in spm}.values() if len(v) > 1)
    pr_por_pac = defaultdict(set)
    for r in regs: pr_por_pac[r["_pac"]].add(r["_prest"])
    multi_p = sum(1 for v in pr_por_pac.values() if len(v) > 1)
    ad = [p for p, i in idade.items() if i >= 18]
    d["qualidade"] = {
        "sem_solicitante": {"registros": len(sem_sol), "pct_registros": r2(len(sem_sol) / len(regs) * 100),
                            "custo": r2(c_sem), "pct_custo": r2(c_sem / custo_total * 100)},
        "cbos": {"psicologo_pct": r2(psi / len(regs) * 100), "medicos_pct": r2(med / len(regs) * 100)},
        "lag": {"pct_mesma_competencia": r2(lags.get(0, 0) / nlag * 100),
                "pct_1_mes": r2(lags.get(1, 0) / nlag * 100), "max_meses": max(lags)},
        "valor_zero": sum(1 for r in regs if r["_val"] == 0),
        "retroativos_90d": {"registros": len(retro), "custo": r2(sum(r["_val"] for r in retro)),
                            "pct_custo": r2(sum(r["_val"] for r in retro) / custo_total * 100)},
        "eventos_extremos": extremos,
        "multi_prestador": {"paciente_mes": multi_pm, "pacientes": k5(multi_p),
                            "pct_pacientes": r2(multi_p / len(pacientes) * 100)},
        "maiores_18": {"pacientes": k5(len(ad)),
                       "custo": r2(sum(custo_p[p] for p in ad)),
                       "sessoes": int(round(sum(spm[(p, m)] for (p, m) in spm if p in ad)))},
    }

    # ---- matriz solicitante × executante (decisão do responsável, 09/07/2026) ----
    # Nomes de solicitantes são profissionais remunerados (mesma classe dos prestadores).
    # Nenhuma contagem de pacientes por par — só custo/sessões/registros (sem risco k).
    com_sol = [r for r in regs if "NÃO INFORMADO" not in r["nome_sol"].upper()
               and r["nome_sol"].strip() not in ("-", "")]
    sol = defaultdict(lambda: {"c": 0.0, "s": 0.0, "n": 0, "cbos": Counter(),
                               "exec": defaultdict(float)})
    for r in com_sol:
        e = sol[r["nome_sol"].strip()]
        e["c"] += r["_val"]; e["s"] += r["_qtd"]; e["n"] += 1
        e["cbos"][r["cbos"]] += 1
        e["exec"][r["_prest"]] += r["_val"]
    top_sol = sorted(sol.items(), key=lambda kv: -kv[1]["c"])[:12]
    lista_sol = []
    for nome, e in top_sol:
        exs = sorted(e["exec"].items(), key=lambda kv: -kv[1])
        top3 = [{"nome": n2, "custo": r2(v), "pct": r2(v / e["c"] * 100)} for n2, v in exs[:3]]
        outros = sum(v for _, v in exs[3:])
        if outros > 0:
            top3.append({"nome": "Outros", "custo": r2(outros), "pct": r2(outros / e["c"] * 100)})
        lista_sol.append({
            "nome": nome, "cbos": e["cbos"].most_common(1)[0][0],
            "custo": r2(e["c"]), "sessoes": int(round(e["s"])),
            "n_executantes": len(exs),
            "principal": exs[0][0], "principal_pct": r2(exs[0][1] / e["c"] * 100)})
    c_com_sol = sum(r["_val"] for r in com_sol)
    d["solicitante_executante"] = {
        "cobertura": {"registros_pct": r2(len(com_sol) / len(regs) * 100),
                      "custo_pct": r2(c_com_sol / custo_total * 100)},
        "solicitantes_distintos": len(sol),
        "solicitantes": lista_sol}

    # ---- projeção (3 cenários; premissas explícitas) ----
    d["projecao"] = projetar(sm, meses)

    return d, regs


def projetar(sm, meses):
    """Projeção de custo 12m: base / contido / expansão. Cenários, não compromissos."""
    n = len(sm)
    # índice sazonal por mês-calendário (sessões/paciente), normalizado
    por_cal = defaultdict(list)
    for x in sm: por_cal[int(x["m"][5:7])].append(x["sessoes_por_paciente"])
    med_geral = statistics.mean([x["sessoes_por_paciente"] for x in sm])
    idx = {mm: statistics.mean(v) / med_geral for mm, v in por_cal.items()}
    for mm in range(1, 13): idx.setdefault(mm, 1.0)
    # tendência linear de pacientes ativos (últimos 12 pontos ou todos)
    pts = [x["pacientes"] for x in sm][-12:]
    xs = list(range(len(pts)))
    mx, my = statistics.mean(xs), statistics.mean(pts)
    beta = (sum((a - mx) * (b - my) for a, b in zip(xs, pts))
            / max(1e-9, sum((a - mx) ** 2 for a in xs)))
    preco_ref = statistics.mean([x["custo_sessao"] for x in sm[-6:]])
    ent_liq_exp = max(0.0, beta) + 2.0  # expansão: tendência + folga de 2 pacientes/mês
    ult_pac = sm[-1]["pacientes"]
    y0, m0 = int(meses[-1][:4]), int(meses[-1][5:7])
    prox, cen = [], {"base": [], "contido": [], "expansao": []}
    for i in range(1, 13):
        mm = m0 + i
        yy = y0 + (mm - 1) // 12
        mm = (mm - 1) % 12 + 1
        prox.append(f"{yy}/{mm:02d}")
        for nome, pac_i in (("base", ult_pac + beta * i),
                            ("contido", ult_pac),
                            ("expansao", ult_pac + ent_liq_exp * i)):
            custo = pac_i * med_geral * idx[mm] * preco_ref
            cen[nome].append(r2(custo))
    return {"meses": prox, "cenarios": cen,
            "indice_sazonal": {f"{mm:02d}": r2(idx[mm]) for mm in range(1, 13)},
            "premissas": ("Cenários calculados no build, não compromissos. Base: tendência linear de "
                          "pacientes ativos (últimos 12 meses) × sessões/paciente sazonalizada × preço médio "
                          "dos últimos 6 meses. Contido: pacientes ativos estabilizados no último valor. "
                          "Expansão: tendência acrescida de 2 pacientes/mês. Competência, não caixa.")}


# ---------------- validações bloqueantes ----------------

def validar(d, regs):
    erros = []
    cont = d["meta"]["contagens"]
    tot = cont["custo_total"]

    def aprox(a, b, tol=0.02):
        return abs(a - b) <= tol

    if not aprox(sum(x["custo"] for x in d["serie_mensal"]), tot):
        erros.append("soma da série mensal != custo total")
    if not aprox(sum(x["custo"] for x in d["ranking_prestadores"]), tot):
        erros.append("soma do ranking != custo total")
    if not aprox(sum(x["custo"] for x in d["tipo_pagamento"]), tot):
        erros.append("soma dos canais != custo total")
    if sum(x["sessoes"] for x in d["serie_mensal"]) != cont["sessoes"]:
        erros.append("soma de sessões mensais != total")

    def soma_k(itens, campo):
        s = 0
        for x in itens:
            v = x[campo]
            s += 0 if v == "<5" else v
        return s
    npac = cont["pacientes"]
    fx = soma_k(d["faixa_etaria"], "pacientes")
    if not (npac - (K_ANON - 1) * len(FAIXAS) <= fx <= npac):
        erros.append("buckets etários não fecham com o total de pacientes")
    itn = soma_k(d["intensidade"]["buckets"], "pacientes")
    if not (npac - (K_ANON - 1) * len(BUCKETS_INTENSIDADE) <= itn <= npac):
        erros.append("buckets de intensidade não fecham com o total")
    if d["genero"]["M"] + d["genero"]["F"] != npac:
        erros.append("gênero não fecha com o total de pacientes")

    blob = json.dumps(d, ensure_ascii=False)
    # anti-vazamento: nenhum nome/matrícula/nascimento/guia de beneficiário no JSON
    for r in regs:
        for campo in ("nome", "matricula", "guia"):
            v = r[campo].strip()
            if len(v) >= 6 and v.upper() in blob.upper():
                erros.append(f"VAZAMENTO: valor da coluna '{campo}' presente no JSON")
                break
        else:
            continue
        break
    # verificação k: nenhum inteiro 1-4 em campos de contagem de pacientes
    for m in re.finditer(r'"pacientes":\s*(\d+)', blob):
        if int(m.group(1)) < K_ANON:
            erros.append(f"k-anonimato violado: contagem de pacientes {m.group(1)} em claro")
    # evento extremo de prestador pequeno não pode sair nomeado
    pac_por_prest = {x["nome"]: x["pacientes"] for x in d["ranking_prestadores"]}
    for ev in d["qualidade"]["eventos_extremos"]:
        if ev["prestador"] is not None and pac_por_prest.get(ev["prestador"]) == "<5":
            erros.append("evento extremo nomeado de prestador com <5 pacientes")
    if len(blob.encode("utf-8")) > JSON_MAX_BYTES:
        erros.append(f"JSON excede {JSON_MAX_BYTES // 1024} KB")
    return erros


# ---------------- saídas ----------------

def escrever_json(d):
    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")


def injetar_html(d, caminho=HTML_ALVO):
    if not os.path.isfile(caminho):
        print(f"AVISO: {caminho} não existe ainda — pulando injeção no HTML")
        return False
    html = open(caminho, encoding="utf-8").read()
    if MARC_INI not in html or MARC_FIM not in html:
        falha(f"marcadores TEA-DATA não encontrados em {caminho}")
    bloco = (f"{MARC_INI}\n<script type=\"application/json\" id=\"tea-data\">"
             f"{json.dumps(d, ensure_ascii=False, sort_keys=True)}</script>\n{MARC_FIM}")
    novo = re.sub(re.escape(MARC_INI) + r".*?" + re.escape(MARC_FIM), lambda _: bloco,
                  html, flags=re.S)
    if len(novo.encode("utf-8")) > HTML_MAX_BYTES:
        falha(f"HTML final excede {HTML_MAX_BYTES // 1024} KB (orçamento do PRD §7.2)")
    open(caminho, "w", encoding="utf-8").write(novo)
    return True


def emitir_publica(dir_saida):
    """Deriva a variante pública (Open Pages) a partir da interna. PRD §6.6."""
    html = open(HTML_ALVO, encoding="utf-8").read()
    # remove hub-auth (slot + script) e o link de volta ao hub
    html = re.sub(r'<span id="hub-auth-slot"[^>]*></span>\s*', "", html)
    html = re.sub(r'<script[^>]*src="[^"]*hub-auth\.js"[^>]*></script>\s*', "", html)
    html = re.sub(r'<a [^>]*class="[^"]*voltar-hub[^"]*"[^>]*>.*?</a>\s*', "", html, flags=re.S)
    # absolutiza assets do hub
    html = html.replace('href="/favicons/', 'href="https://hub.grupocsv.com/favicons/')
    html = html.replace('content="https://hub.grupocsv.com/unimed/tea.html"',
                        'content="https://open.grupocsv.com/painel-tea/"')
    # GATE: NÃO embutir. O gate é responsabilidade EXCLUSIVA do Worker csv-open-pages
    # (padrão do ecossistema, decisão do responsável em 10/07/2026): o slug deve ter
    # auth_gate=true nos metadados ANTES de qualquer upload de conteúdo. Um marcador
    # id="gate" no HTML suprimiria o gate padrão — por isso é proibido aqui.
    if 'id="gate"' in html:
        falha('variante pública contém id="gate" — gates customizados são proibidos (padrão = Worker)')
    os.makedirs(dir_saida, exist_ok=True)
    destino = os.path.join(dir_saida, "painel-tea.html")
    open(destino, "w", encoding="utf-8").write(html)
    print(f"variante pública: {destino} ({len(html.encode('utf-8')) // 1024} KB)")
    return destino


def gravar_auditoria(regs, d, caminho_insumo):
    """Fila nominal de auditoria — SEMPRE ao lado do insumo, fora do repo."""
    destino = os.path.join(os.path.dirname(os.path.abspath(caminho_insumo)),
                           "tea-fila-auditoria.csv")
    if dentro_de_repo_git(destino):
        falha("a fila de auditoria cairia dentro do repo — abortado")
    spm = defaultdict(float)
    for r in regs: spm[(r["_pac"], r["anomes"])] += r["_qtd"]
    p99 = pctl(list(spm.values()), 0.99)
    with open(destino, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["tipo", "competencia", "beneficiario", "nascimento", "prestador",
                    "sessoes", "valor", "detalhe"])
        for r in regs:
            if r["_val"] >= LIMIAR_EVENTO_EXTREMO:
                w.writerow(["registro>=10k", r["anomes"], r["nome"], r["nasc"][:10],
                            r["nome_prest"], r["_qtd"], r["_val"], ""])
            if r["_val"] == 0:
                w.writerow(["valor_zero", r["anomes"], r["nome"], r["nasc"][:10],
                            r["nome_prest"], r["_qtd"], 0, ""])
        for (p, m), s in sorted(spm.items(), key=lambda kv: -kv[1]):
            if s > p99:
                w.writerow(["paciente_mes>p99", m, p[0], p[1], "", s, "",
                            f"acima do p99 ({p99:.0f} sessões/mês)"])
    print(f"fila de auditoria (PRIVADA, fora do repo): {destino}")


# ---------------- selftest (fixture sintética) ----------------

def selftest():
    fixture = os.path.join(REPO_ROOT, "scripts", "tests", "tea-fixture-sintetica.csv")
    linhas = list(csv.reader(open(fixture, encoding="utf-8")))[1:]
    regs = [dict(zip(COLS, [c.strip() for c in row])) for row in linhas]
    d, regs = agregar(regs, date(2026, 6, 30))
    erros = validar(d, regs)
    assert not erros, f"fixture reprovou nas validações: {erros}"
    c = d["meta"]["contagens"]
    assert c["pacientes"] == 9, f"fixture: esperado 9 pacientes, veio {c['pacientes']}"
    assert c["matriculas"] == 10, f"fixture: esperado 10 matrículas (multi-carteirinha), veio {c['matriculas']}"
    assert c["prestadores"] == 5, f"fixture: esperado 5 prestadores agrupados, veio {c['prestadores']}"
    nomes = {x["nome"] for x in d["ranking_prestadores"]}
    assert CASA_UNIMED in nomes and NOME_MERGE_CNPJ in nomes, "fusões do LEIA-ME não aplicadas"
    assert "FICTICIO NEILSON SINTETICO" in nomes, "caso Neilson (registro próprio de reembolso) perdido"
    assert any(x["pacientes"] == "<5" for x in d["ranking_prestadores"]), "k-anonimato não aplicado"
    ev = d["qualidade"]["eventos_extremos"]
    assert ev and ev[0]["prestador"] is None, "evento extremo de prestador pequeno saiu nomeado"
    blob = json.dumps(d, ensure_ascii=False).upper()
    assert "CRIANCA" not in blob and "MENINO" not in blob, "nome de beneficiário vazou no JSON"
    # teste de mutação: remover 1 paciente → revalida com totais novos
    regs2 = [dict(zip(COLS, [c.strip() for c in row])) for row in linhas
             if row[2].strip() != "CRIANCA SINTETICA UM"]
    d2, regs2 = agregar(regs2, date(2026, 6, 30))
    assert not validar(d2, regs2), "mutação: validações estruturais reprovaram"
    assert d2["meta"]["contagens"]["pacientes"] == 8, "mutação: contagem não caiu para 8"
    print("selftest OK — fixture sintética passou em todas as validações "
          "(regras do LEIA-ME, k-anonimato, evento extremo, anti-vazamento, mutação)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("xlsx", nargs="?", help="planilha oficial (fora do repo)")
    ap.add_argument("--csv", help="insumo em CSV (alternativa ao xlsx)")
    ap.add_argument("--corte", help="data de corte AAAA-MM-DD (default: fim do último mês)")
    ap.add_argument("--emit-public", metavar="DIR", help="deriva a variante pública no diretório")
    ap.add_argument("--auditoria", action="store_true", help="grava a fila nominal ao lado do insumo")
    ap.add_argument("--selftest", action="store_true", help="roda a fixture sintética")
    ap.add_argument("--permitir-insumo-no-repo", action="store_true", help=argparse.SUPPRESS)
    args = ap.parse_args()

    if args.selftest:
        selftest()
        return

    regs, sha = ler_insumo(args)
    if args.corte:
        corte = date.fromisoformat(args.corte)
    else:
        ultimo = max(r["anomes"] for r in regs)
        y, m = int(ultimo[:4]), int(ultimo[5:7])
        corte = date(y, 12, 31) if m == 12 else date(y, m + 1, 1)
        corte = date(y, m, (corte - date(y, m, 1)).days) if m != 12 else corte

    d, regs = agregar(regs, corte)
    d["meta"]["sha256_insumo"] = sha
    erros = validar(d, regs)
    if erros:
        for e in erros:
            print(f"VALIDAÇÃO FALHOU: {e}", file=sys.stderr)
        sys.exit(1)

    escrever_json(d)
    injetou = injetar_html(d)
    c = d["meta"]["contagens"]
    print("=" * 64)
    print("RELATÓRIO DO BUILD — Painel TEA v2")
    print(f"  Insumo SHA-256 : {sha[:16]}…")
    print(f"  Período        : {d['meta']['periodo']['inicio']} a {d['meta']['periodo']['fim']} "
          f"({d['meta']['periodo']['competencias']} competências)")
    print(f"  Registros      : {c['registros']:,}".replace(",", "."))
    print(f"  Sessões        : {c['sessoes']:,}".replace(",", "."))
    print(f"  Custo total    : R$ {c['custo_total']:,.2f}")
    print(f"  Pacientes      : {c['pacientes']} (matrículas: {c['matriculas']})")
    print(f"  Prestadores    : {c['prestadores']} (agrupados)")
    blob = json.dumps(d, ensure_ascii=False)
    supr = blob.count('"<5"')
    print(f"  Células '<5'   : {supr} (k={K_ANON})")
    print(f"  JSON           : {len(blob.encode('utf-8')) // 1024} KB → {JSON_OUT}")
    print(f"  HTML injetado  : {'sim' if injetou else 'NÃO (arquivo ausente)'}")
    print("  Validações     : todas OK (somas, anti-vazamento, k, evento extremo)")
    print("=" * 64)

    if args.emit_public:
        emitir_publica(args.emit_public)
    if args.auditoria:
        gravar_auditoria(regs, d, args.csv or args.xlsx)


if __name__ == "__main__":
    main()
