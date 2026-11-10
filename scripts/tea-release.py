#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Release e cofre do Painel Terapias Especiais — Unimed Governador Valadares.

Complementa scripts/build-tea-data.py: o pipeline gera o JSON privado; esta
ferramenta guarda os insumos brutos no cofre, compara o JSON novo com o release
anterior, envia o release imutável e prepara a troca do ponteiro.

  comparar <anterior.json> <novo.json>     o que mudou entre dois releases
  enviar <novo.json>                       grava releases/<SHA-256>.json e relê
  sql <novo.json> --anterior-sha <SHA>     SQL da troca condicional do ponteiro
  registrar <novo.json> --anterior-sha <SHA>   anota a ativação no histórico
  verificar <SHA> [--sessao <token>]       objeto, saúde do serviço e resposta
  baixar <SHA> <destino.json>              recupera um release (ex.: rollback)
  cofre-listar                             insumos brutos guardados
  cofre-enviar <arquivo> --papel base|bloco|matriz   guarda um insumo bruto
  cofre-baixar <chave> <diretorio>         restaura um insumo bruto

Credenciais vêm do ambiente e nunca são impressas:
  CLOUDFLARE_ACCOUNT_ID   conta Cloudflare
  CLOUDFLARE_API_TOKEN    token com R2 de leitura e escrita
                          (ou --token-file <arquivo fora de qualquer Git>)

Todo arquivo lido ou gravado aqui (JSON privado, planilhas, destino de
download) deve estar fora de qualquer repositório Git. A ferramenta só imprime
agregados, chaves de objeto e hashes.
"""

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

PAINEL_ID = "painel-tea"
BUCKET_RELEASES = "unimed-te-data-private"
BUCKET_COFRE = "csv-dados-sensiveis"
PREFIXO_COFRE = "unimed-tea/raw/"
MANIFESTO_COFRE = PREFIXO_COFRE + "manifesto.json"
HISTORICO_RELEASES = "releases/historico.json"
SERVICO = "https://unimed-te-data.guilherme-thom.workers.dev"
AGENTE = "tea-release/1.0"
API = "https://api.cloudflare.com/client/v4"


class Erro(RuntimeError):
    pass


# ---------------- arquivos locais ----------------


def ancestral_git(caminho):
    p = Path(caminho).resolve(strict=False)
    if not p.is_dir():
        p = p.parent
    while True:
        if (p / ".git").exists():
            return p
        if p.parent == p:
            return None
        p = p.parent


def fora_de_git(caminho, rotulo):
    real = Path(caminho).expanduser().resolve(strict=False)
    git = ancestral_git(real)
    if git is not None:
        raise Erro(
            f"{rotulo} está dentro do repositório Git {git}; dados privados "
            "devem permanecer fora de qualquer Git"
        )
    return real


def sha256_bytes(conteudo):
    return hashlib.sha256(conteudo).hexdigest().upper()


def ler_release(caminho):
    real = fora_de_git(caminho, "JSON do release")
    conteudo = real.read_bytes()
    dados = json.loads(conteudo.decode("utf-8"))
    meta = dados.get("meta") if isinstance(dados, dict) else None
    if (
        not isinstance(meta, dict)
        or not isinstance(dados.get("recortes"), dict)
        or "tudo" not in dados["recortes"]
        or len(meta.get("periodos", [])) != len(dados["recortes"])
    ):
        raise Erro(f"{real.name}: não é um artefato do painel")
    return real, conteudo, dados


# ---------------- Cloudflare R2 pela API ----------------


class R2:
    def __init__(self, arquivo_token=None):
        self.conta = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
        if not self.conta:
            raise Erro("defina CLOUDFLARE_ACCOUNT_ID")
        token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
        if arquivo_token:
            token = fora_de_git(arquivo_token, "arquivo do token").read_text(
                encoding="utf-8"
            ).strip()
        if not token:
            raise Erro("defina CLOUDFLARE_API_TOKEN ou informe --token-file")
        self._cabecalhos = {
            "Authorization": "Bearer " + token,
            "User-Agent": AGENTE,
        }

    def _url(self, bucket, chave=None, consulta=None):
        url = f"{API}/accounts/{self.conta}/r2/buckets/{bucket}/objects"
        if chave is not None:
            url += "/" + urllib.parse.quote(chave, safe="/")
        if consulta:
            url += "?" + urllib.parse.urlencode(consulta)
        return url

    def _pedir(self, metodo, url, corpo=None, tipo=None):
        cabecalhos = dict(self._cabecalhos)
        if tipo:
            cabecalhos["Content-Type"] = tipo
        pedido = urllib.request.Request(
            url, data=corpo, method=metodo, headers=cabecalhos
        )
        try:
            with urllib.request.urlopen(pedido, timeout=300) as resposta:
                return resposta.status, resposta.read()
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return 404, b""
            raise Erro(
                f"Cloudflare respondeu {exc.code} em {metodo} "
                f"{url.split('/r2/', 1)[-1]}"
            ) from exc

    def baixar(self, bucket, chave):
        status, corpo = self._pedir("GET", self._url(bucket, chave))
        return None if status == 404 else corpo

    def gravar(self, bucket, chave, conteudo, tipo):
        self._pedir("PUT", self._url(bucket, chave), conteudo, tipo)
        relido = self.baixar(bucket, chave)
        if relido is None or sha256_bytes(relido) != sha256_bytes(conteudo):
            raise Erro(f"releitura de {chave} não confere com o enviado")

    def listar(self, bucket, prefixo):
        itens, cursor = [], None
        while True:
            consulta = {"prefix": prefixo, "per_page": 1000}
            if cursor:
                consulta["cursor"] = cursor
            _status, corpo = self._pedir("GET", self._url(bucket, None, consulta))
            dados = json.loads(corpo.decode("utf-8"))
            itens.extend(dados.get("result") or [])
            info = dados.get("result_info") or {}
            cursor = info.get("cursor") if info.get("is_truncated") else None
            if not cursor:
                return itens

    def ler_json(self, bucket, chave, padrao):
        corpo = self.baixar(bucket, chave)
        return padrao if corpo is None else json.loads(corpo.decode("utf-8"))

    def gravar_json(self, bucket, chave, valor):
        texto = json.dumps(valor, ensure_ascii=False, indent=2) + "\n"
        self.gravar(bucket, chave, texto.encode("utf-8"), "application/json")


# ---------------- comparar ----------------


def brl(valor):
    texto = f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return "R$ " + texto


def sem_faixa_etaria(recorte):
    """Cópia do recorte sem os blocos que dependem do corte etário."""
    copia = dict(recorte)
    pacientes = dict(copia.get("pacientes") or {})
    pacientes.pop("faixa_etaria", None)
    copia["pacientes"] = pacientes
    copia["pacientes_disciplina"] = {
        nome: {k: v for k, v in bloco.items() if k != "faixa_etaria"}
        for nome, bloco in (copia.get("pacientes_disciplina") or {}).items()
    }
    return copia


def comparar(anterior, novo, exigir_fechados=False):
    ma, mn = anterior["meta"], novo["meta"]
    pa, pn = ma["periodo_canonico"], mn["periodo_canonico"]
    print("=" * 78)
    print("COMPARAÇÃO DE RELEASES — PAINEL TERAPIAS ESPECIAIS")
    print(
        f"Anterior : pipeline {ma.get('versao_script')} · {pa['inicio']} a "
        f"{pa['fim']} · {len(anterior['recortes'])} recortes · corte etário "
        f"{ma.get('data_corte_idade')}"
    )
    print(
        f"Novo     : pipeline {mn.get('versao_script')} · {pn['inicio']} a "
        f"{pn['fim']} · {len(novo['recortes'])} recortes · corte etário "
        f"{mn.get('data_corte_idade')}"
    )
    meses_novos = {
        m for p in mn["periodos"] for m in p["meses"]
    } - {m for p in ma["periodos"] for m in p["meses"]}
    periodos_novo = {p["id"]: p for p in mn["periodos"]}
    identicos, so_idade, ampliados, alterados, ausentes = [], [], [], [], []
    for periodo_id, recorte in anterior["recortes"].items():
        if periodo_id not in novo["recortes"]:
            ausentes.append(periodo_id)
        elif set(periodos_novo[periodo_id]["meses"]) & meses_novos:
            ampliados.append(periodo_id)
        elif novo["recortes"][periodo_id] == recorte:
            identicos.append(periodo_id)
        elif sem_faixa_etaria(novo["recortes"][periodo_id]) == sem_faixa_etaria(
            recorte
        ):
            so_idade.append(periodo_id)
        else:
            chaves = sorted(
                c for c in set(recorte) | set(novo["recortes"][periodo_id])
                if novo["recortes"][periodo_id].get(c) != recorte.get(c)
            )
            alterados.append((periodo_id, chaves))
    criados = [p for p in novo["recortes"] if p not in anterior["recortes"]]
    print(f"Recortes fechados idênticos           : {len(identicos)}")
    print(
        "Idênticos exceto faixa etária          : "
        f"{len(so_idade)} (efeito da mudança do corte etário)"
    )
    print(
        "Ampliados por competências novas       : "
        f"{', '.join(ampliados) or 'nenhum'}"
    )
    print(f"Recortes novos                         : {', '.join(criados) or 'nenhum'}")
    if ausentes:
        print(f"Recortes que deixaram de existir       : {', '.join(ausentes)}")
    if alterados:
        print("RECORTES FECHADOS ALTERADOS (reapresentação de dados):")
        for periodo_id, chaves in alterados:
            print(f"  - {periodo_id}: {', '.join(chaves)}")
    serie_a = {p["m"]: p for p in anterior["recortes"]["tudo"]["serie_mensal"]}
    print("Série mensal (crianças | sessões | pagamento):")
    for ponto in novo["recortes"]["tudo"]["serie_mensal"]:
        antes = serie_a.get(ponto["m"])
        linha = (
            f"  {ponto['m']}  {ponto['pacientes']:>6} | {ponto['sessoes']:>7} | "
            f"{brl(ponto['pagamento']):>16}"
        )
        if antes is None:
            print(linha + "   nova")
        elif any(antes[c] != ponto[c] for c in ("pacientes", "sessoes", "pagamento")):
            print(
                linha + "   ALTERADA — antes: "
                f"{antes['pacientes']} | {antes['sessoes']} | {brl(antes['pagamento'])}"
            )
    ra, rn = anterior["recortes"]["tudo"]["resumo"], novo["recortes"]["tudo"]["resumo"]
    print(
        "Período completo : "
        f"{ra['pacientes']} → {rn['pacientes']} crianças · "
        f"{ra['sessoes']} → {rn['sessoes']} sessões · "
        f"{brl(ra['pagamento'])} → {brl(rn['pagamento'])}"
    )
    print("=" * 78)
    if exigir_fechados and (alterados or ausentes):
        raise Erro("há recortes fechados alterados em relação ao release anterior")


# ---------------- release ----------------


def identidade_release(conteudo, dados):
    sha = sha256_bytes(conteudo)
    gerado = str(dados["meta"].get("gerado_em") or date.today().isoformat())
    return sha, f"releases/{sha}.json", f"{gerado}-{sha[:8]}"


def sql_ponteiro(sha, chave, release_id, anterior_sha):
    anterior_sha = anterior_sha.strip().upper()
    if len(anterior_sha) != 64 or any(c not in "0123456789ABCDEF" for c in anterior_sha):
        raise Erro("--anterior-sha deve ser o SHA-256 completo do release vigente")
    if anterior_sha == sha:
        raise Erro("o release novo é idêntico ao vigente; nada a ativar")
    troca = (
        "UPDATE tea_panel_releases SET "
        f"release_id='{release_id}', object_key='{chave}', sha256='{sha}', "
        "activated_at=strftime('%s','now') "
        f"WHERE panel_id='{PAINEL_ID}' AND upper(sha256)='{anterior_sha}';"
    )
    conferencia = (
        "SELECT panel_id, release_id, object_key, sha256, activated_at "
        f"FROM tea_panel_releases WHERE panel_id='{PAINEL_ID}';"
    )
    return troca, conferencia


def comando_enviar(args):
    _real, conteudo, dados = ler_release(args.json)
    sha, chave, release_id = identidade_release(conteudo, dados)
    r2 = R2(args.token_file)
    existente = r2.baixar(BUCKET_RELEASES, chave)
    if existente is not None and sha256_bytes(existente) == sha:
        print(f"já presente e íntegro: {chave}")
    else:
        r2.gravar(BUCKET_RELEASES, chave, conteudo, "application/json")
        print(f"enviado e conferido por releitura: {chave}")
    print(f"release_id: {release_id}")
    print(f"sha256    : {sha}")
    print(f"bytes     : {len(conteudo)}")
    print("O painel só muda quando o ponteiro for trocado (comando sql).")


def comando_sql(args):
    _real, conteudo, dados = ler_release(args.json)
    sha, chave, release_id = identidade_release(conteudo, dados)
    troca, conferencia = sql_ponteiro(sha, chave, release_id, args.anterior_sha)
    print("-- 1) troca condicional: precisa alterar exatamente 1 linha")
    print(troca)
    print("-- 2) conferência")
    print(conferencia)
    print("-- rollback: o mesmo UPDATE com os valores do release anterior,")
    print(f"-- condicionado a upper(sha256)='{sha}'")


def comando_registrar(args):
    _real, conteudo, dados = ler_release(args.json)
    sha, chave, release_id = identidade_release(conteudo, dados)
    r2 = R2(args.token_file)
    historico = r2.ler_json(
        BUCKET_RELEASES, HISTORICO_RELEASES, {"painel": PAINEL_ID, "ativacoes": []}
    )
    meta = dados["meta"]
    historico["ativacoes"].append(
        {
            "release_id": release_id,
            "sha256": sha,
            "object_key": chave,
            "anterior_sha256": args.anterior_sha.strip().upper(),
            "registrado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "pipeline": meta.get("versao_script"),
            "periodo": meta["periodo_canonico"],
            "corte_etario": meta.get("data_corte_idade"),
            "blocos": [b.get("arquivo") for b in meta.get("blocos_fonte", [])],
            "nota": args.nota or "",
        }
    )
    r2.gravar_json(BUCKET_RELEASES, HISTORICO_RELEASES, historico)
    print(f"ativação anotada em {HISTORICO_RELEASES}: {release_id}")


def comando_verificar(args):
    sha = args.sha.strip().upper()
    r2 = R2(args.token_file)
    objeto = r2.baixar(BUCKET_RELEASES, f"releases/{sha}.json")
    if objeto is None or sha256_bytes(objeto) != sha:
        raise Erro("objeto do release ausente ou com hash divergente")
    print(f"objeto íntegro: releases/{sha}.json ({len(objeto)} bytes)")

    def pedir(caminho, metodo, sessao=None):
        cabecalhos = {"User-Agent": AGENTE}
        if sessao:
            cabecalhos["X-Auth-Token"] = sessao
        pedido = urllib.request.Request(
            SERVICO + caminho, method=metodo, headers=cabecalhos
        )
        try:
            with urllib.request.urlopen(pedido, timeout=60) as resposta:
                return resposta.status, resposta.headers
        except urllib.error.HTTPError as exc:
            return exc.code, exc.headers

    status, _ = pedir("/health", "GET")
    print(f"serviço /health: {status}")
    status, _ = pedir("/v1/data", "HEAD")
    print(f"/v1/data sem sessão: {status} (esperado 401)")
    if args.sessao:
        status, cabecalhos = pedir("/v1/data", "HEAD", args.sessao)
        servido = (cabecalhos.get("X-Data-SHA256") or "").upper()
        print(
            f"/v1/data com sessão: {status} · release "
            f"{cabecalhos.get('X-Data-Release')} · sha "
            f"{'confere' if servido == sha else 'DIVERGE'}"
        )
        if status != 200 or servido != sha:
            raise Erro("o serviço não está entregando o release informado")
    else:
        print(
            "sem --sessao a resposta autenticada não foi testada; confira o "
            "ponteiro com o SELECT do comando sql"
        )


def comando_baixar(args):
    sha = args.sha.strip().upper()
    destino = fora_de_git(args.destino, "destino")
    r2 = R2(args.token_file)
    objeto = r2.baixar(BUCKET_RELEASES, f"releases/{sha}.json")
    if objeto is None or sha256_bytes(objeto) != sha:
        raise Erro("objeto do release ausente ou com hash divergente")
    destino.write_bytes(objeto)
    print(f"release gravado em {destino} ({len(objeto)} bytes)")


# ---------------- cofre de insumos brutos ----------------


def comando_cofre_listar(args):
    r2 = R2(args.token_file)
    for item in sorted(
        r2.listar(BUCKET_COFRE, PREFIXO_COFRE), key=lambda x: x["key"]
    ):
        print(f"{item['size']:>10}  {item.get('last_modified', '')[:10]}  {item['key']}")


def comando_cofre_enviar(args):
    real = fora_de_git(args.arquivo, "insumo bruto")
    conteudo = real.read_bytes()
    sha = hashlib.sha256(conteudo).hexdigest()
    hoje = date.today().isoformat()
    if args.papel == "bloco":
        chave = f"{PREFIXO_COFRE}blocos/{hoje}_{sha[:8]}_{real.name}"
    else:
        chave = f"{PREFIXO_COFRE}base/2025-01_2026-06/{real.name}"
    r2 = R2(args.token_file)
    r2.gravar(
        BUCKET_COFRE,
        chave,
        conteudo,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    manifesto = r2.ler_json(
        BUCKET_COFRE,
        MANIFESTO_COFRE,
        {"painel": PAINEL_ID, "base": {"itens": []}, "blocos": []},
    )
    entrada = {
        "chave": chave,
        "arquivo_original": real.name,
        "sha256": sha,
        "bytes": len(conteudo),
        "recebido_em": hoje,
    }
    if args.papel == "bloco":
        if args.substitui:
            for bloco in manifesto["blocos"]:
                if bloco["chave"] == args.substitui:
                    bloco["vigente"] = False
        entrada["vigente"] = True
        manifesto["blocos"] = [
            b for b in manifesto["blocos"] if b["chave"] != chave
        ] + [entrada]
    else:
        entrada["papel"] = args.papel
        itens = [i for i in manifesto["base"].get("itens", []) if i["chave"] != chave]
        manifesto["base"]["itens"] = itens + [entrada]
        manifesto["base"]["estado"] = (
            "completa"
            if sum(1 for i in manifesto["base"]["itens"] if i.get("papel") == "base") == 19
            and any(i.get("papel") == "matriz" for i in manifesto["base"]["itens"])
            else "parcial"
        )
    manifesto["atualizado_em"] = hoje
    r2.gravar_json(BUCKET_COFRE, MANIFESTO_COFRE, manifesto)
    print(f"guardado e conferido por releitura: {chave}")


def comando_cofre_baixar(args):
    diretorio = fora_de_git(args.diretorio, "diretório de destino")
    if not diretorio.is_dir():
        raise Erro(f"diretório inexistente: {diretorio}")
    if not args.chave.startswith(PREFIXO_COFRE):
        raise Erro(f"a chave deve começar por {PREFIXO_COFRE}")
    r2 = R2(args.token_file)
    chaves = (
        [i["key"] for i in r2.listar(BUCKET_COFRE, args.chave)]
        if args.chave.endswith("/")
        else [args.chave]
    )
    for chave in chaves:
        conteudo = r2.baixar(BUCKET_COFRE, chave)
        if conteudo is None:
            raise Erro(f"objeto ausente no cofre: {chave}")
        nome = chave.rsplit("/", 1)[-1]
        (diretorio / nome).write_bytes(conteudo)
        print(f"restaurado: {nome} ({len(conteudo)} bytes)")


# ---------------- linha de comando ----------------


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--token-file", help="arquivo com o token, fora de qualquer Git")
    sub = ap.add_subparsers(dest="comando", required=True)

    p = sub.add_parser("comparar")
    p.add_argument("anterior")
    p.add_argument("novo")
    p.add_argument(
        "--exigir-fechados-inalterados",
        action="store_true",
        help="falha se algum recorte fechado mudou além da faixa etária",
    )
    p = sub.add_parser("enviar")
    p.add_argument("json")
    p = sub.add_parser("sql")
    p.add_argument("json")
    p.add_argument("--anterior-sha", required=True)
    p = sub.add_parser("registrar")
    p.add_argument("json")
    p.add_argument("--anterior-sha", required=True)
    p.add_argument("--nota")
    p = sub.add_parser("verificar")
    p.add_argument("sha")
    p.add_argument("--sessao", help="token de sessão do Hub para o teste autenticado")
    p = sub.add_parser("baixar")
    p.add_argument("sha")
    p.add_argument("destino")
    sub.add_parser("cofre-listar")
    p = sub.add_parser("cofre-enviar")
    p.add_argument("arquivo")
    p.add_argument("--papel", required=True, choices=("base", "bloco", "matriz"))
    p.add_argument("--substitui", help="chave do bloco que deixa de ser vigente")
    p = sub.add_parser("cofre-baixar")
    p.add_argument("chave", help="chave de um objeto ou prefixo terminado em /")
    p.add_argument("diretorio")
    args = ap.parse_args()

    try:
        if args.comando == "comparar":
            _r, _c, anterior = ler_release(args.anterior)
            _r, _c, novo = ler_release(args.novo)
            comparar(anterior, novo, args.exigir_fechados_inalterados)
        else:
            {
                "enviar": comando_enviar,
                "sql": comando_sql,
                "registrar": comando_registrar,
                "verificar": comando_verificar,
                "baixar": comando_baixar,
                "cofre-listar": comando_cofre_listar,
                "cofre-enviar": comando_cofre_enviar,
                "cofre-baixar": comando_cofre_baixar,
            }[args.comando](args)
    except (Erro, OSError, ValueError, KeyError) as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
