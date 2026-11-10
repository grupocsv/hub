#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Release e cofre do Painel Terapias Especiais — Unimed Governador Valadares.

Complementa scripts/build-tea-data.py: o pipeline gera o JSON privado; esta
ferramenta guarda os insumos brutos no cofre, compara o JSON novo com o release
anterior, envia o release imutável e prepara a troca do ponteiro.

  cofre-listar                             insumos brutos guardados
  cofre-enviar <arquivo> --papel base|bloco|matriz   guarda um insumo bruto
  cofre-restaurar <diretorio>              base, Matriz e blocos vigentes, prontos para o build
  cofre-baixar <chave> <diretorio>         um objeto, ou um prefixo terminado em /
  ponteiro                                 SELECT que mostra o release no ar
  baixar <SHA> <destino.json>              recupera um release (comparação, rollback)
  comparar <anterior.json> <novo.json>     o que mudou entre dois releases
  enviar <novo.json>                       grava releases/<SHA-256>.json e relê
  sql <novo.json> --anterior-sha <SHA>     SQL da troca condicional do ponteiro
  verificar <SHA> --ponteiro <sha do SELECT>   objeto, serviço e ponteiro
  registrar <novo.json> --anterior-sha <SHA>   anota a ativação no histórico
  historico                                sequência de ativações anotadas
  selftest                                 autoteste com a rede simulada

Credenciais vêm do ambiente ou de arquivo fora de qualquer Git, nunca da linha
de comando, e nunca são impressas:
  CLOUDFLARE_ACCOUNT_ID   conta Cloudflare
  CLOUDFLARE_API_TOKEN    token com R2 de leitura e escrita (ou --token-file)
  HUB_SESSAO              sessão do Hub, só para o teste autenticado de
                          verificar (ou --sessao-file)

Todo arquivo lido ou gravado aqui (JSON privado, planilhas, destino de
download) deve estar fora de qualquer repositório Git. A ferramenta só imprime
agregados, chaves de objeto e hashes.
"""

import argparse
import hashlib
import json
import os
import re
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
PREFIXO_BASE = PREFIXO_COFRE + "base/2025-01_2026-06/"
PREFIXO_BLOCOS = PREFIXO_COFRE + "blocos/"
MANIFESTO_COFRE = PREFIXO_COFRE + "manifesto.json"
HISTORICO_RELEASES = "releases/historico.json"
SERVICO = "https://unimed-te-data.guilherme-thom.workers.dev"
AGENTE = "tea-release/1.1"
API = "https://api.cloudflare.com/client/v4"
FONTES_BASE = 19
TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
SELECT_PONTEIRO = (
    "SELECT panel_id, release_id, object_key, sha256, activated_at "
    f"FROM tea_panel_releases WHERE panel_id='{PAINEL_ID}';"
)


class Erro(RuntimeError):
    pass


# ---------------- arquivos locais e segredos ----------------


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


def normalizar_sha(valor, rotulo):
    sha = str(valor or "").strip().upper()
    if len(sha) != 64 or any(c not in "0123456789ABCDEF" for c in sha):
        raise Erro(f"{rotulo} deve ser um SHA-256 completo (64 hexadecimais)")
    return sha


def ler_segredo(arquivo, variavel, rotulo):
    """Lê um segredo de arquivo ou do ambiente sem jamais ecoar o valor.

    Um valor com quebra de linha ou espaço interno (arquivo com rótulo e
    token, linha CHAVE=valor) é recusado aqui: a camada HTTP o rejeitaria com
    uma mensagem que reproduz o próprio segredo.
    """
    if arquivo:
        bruto = fora_de_git(arquivo, f"arquivo de {rotulo}").read_text(
            encoding="utf-8-sig"
        )
    else:
        bruto = os.environ.get(variavel, "")
    valor = bruto.strip()
    if not valor:
        return ""
    if not re.fullmatch(r"[\x21-\x7e]{16,4096}", valor):
        raise Erro(
            f"{rotulo} em formato inesperado ({len(valor.splitlines())} "
            f"linha(s), {len(valor)} caracteres); esperado um único valor, "
            "sem espaços nem rótulo"
        )
    return valor


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
        if not re.fullmatch(r"[0-9a-fA-F]{32}", self.conta):
            raise Erro("defina CLOUDFLARE_ACCOUNT_ID (32 hexadecimais)")
        token = ler_segredo(arquivo_token, "CLOUDFLARE_API_TOKEN", "token")
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

    def _pedir(self, metodo, url, corpo=None, tipo=None, aceitar_404=False):
        cabecalhos = dict(self._cabecalhos)
        if tipo:
            cabecalhos["Content-Type"] = tipo
        alvo = url.split("/r2/", 1)[-1].split("?", 1)[0]
        pedido = urllib.request.Request(
            url, data=corpo, method=metodo, headers=cabecalhos
        )
        # Nenhuma mensagem abaixo repassa o texto da exceção original: a
        # camada HTTP pode citar o cabeçalho de autorização.
        try:
            with urllib.request.urlopen(pedido, timeout=300) as resposta:
                return resposta.status, resposta.read()
        except urllib.error.HTTPError as exc:
            if exc.code == 404 and aceitar_404:
                return 404, b""
            if exc.code == 404:
                raise Erro(
                    f"Cloudflare respondeu 404 em {metodo} {alvo}: bucket não "
                    "encontrado na conta informada"
                ) from None
            raise Erro(f"Cloudflare respondeu {exc.code} em {metodo} {alvo}") from None
        except urllib.error.URLError as exc:
            raise Erro(
                f"falha de rede em {metodo} {alvo} "
                f"({type(exc.reason).__name__})"
            ) from None
        except ValueError:
            raise Erro(
                f"pedido inválido em {metodo} {alvo}; confira conta e token"
            ) from None

    def baixar(self, bucket, chave):
        status, corpo = self._pedir(
            "GET", self._url(bucket, chave), aceitar_404=True
        )
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
    corte_mudou = ma.get("data_corte_idade") != mn.get("data_corte_idade")
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
        elif corte_mudou and sem_faixa_etaria(
            novo["recortes"][periodo_id]
        ) == sem_faixa_etaria(recorte):
            # Só vale como efeito do corte quando o corte de fato mudou; com o
            # mesmo corte, faixa etária diferente é dado reapresentado.
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
    serie_n = {p["m"]: p for p in novo["recortes"]["tudo"]["serie_mensal"]}
    print("Série mensal (crianças | sessões | pagamento):")
    for mes in sorted(set(serie_a) | set(serie_n)):
        antes, ponto = serie_a.get(mes), serie_n.get(mes)
        if ponto is None:
            print(f"  {mes}  REMOVIDA — antes: {antes['pacientes']} | "
                  f"{antes['sessoes']} | {brl(antes['pagamento'])}")
            continue
        linha = (
            f"  {mes}  {ponto['pacientes']:>6} | {ponto['sessoes']:>7} | "
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
        f"{ra['pacientes']} para {rn['pacientes']} crianças · "
        f"{ra['sessoes']} para {rn['sessoes']} sessões · "
        f"{brl(ra['pagamento'])} para {brl(rn['pagamento'])}"
    )
    print("=" * 78)
    if exigir_fechados and (alterados or ausentes):
        raise Erro("há recortes fechados alterados em relação ao release anterior")


# ---------------- release ----------------


def identidade_release(conteudo, dados):
    sha = sha256_bytes(conteudo)
    gerado = dados["meta"].get("gerado_em")
    # O release_id entra no SQL do ponteiro: só aceita a data no formato que o
    # pipeline grava, nunca texto livre vindo do arquivo.
    if not isinstance(gerado, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", gerado):
        raise Erro("meta.gerado_em do JSON não está no formato AAAA-MM-DD")
    return sha, f"releases/{sha}.json", f"{gerado}-{sha[:8]}"


def sql_ponteiro(sha, chave, release_id, anterior_sha):
    anterior_sha = normalizar_sha(anterior_sha, "--anterior-sha")
    if anterior_sha == sha:
        raise Erro("o release novo é idêntico ao vigente; nada a ativar")
    return (
        "UPDATE tea_panel_releases SET "
        f"release_id='{release_id}', object_key='{chave}', sha256='{sha}', "
        "activated_at=strftime('%s','now') "
        f"WHERE panel_id='{PAINEL_ID}' AND upper(sha256)='{anterior_sha}';"
    )


def comando_ponteiro(_args):
    print("-- execute no D1 csv-hub; a coluna sha256 é o release no ar")
    print(SELECT_PONTEIRO)


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
    troca = sql_ponteiro(sha, chave, release_id, args.anterior_sha)
    print("-- 1) troca condicional: precisa alterar exatamente 1 linha")
    print(troca)
    print("-- 2) conferência: o sha256 devolvido vai em `verificar --ponteiro`")
    print(SELECT_PONTEIRO)
    print("-- para desfazer: `sql <json do release anterior> --anterior-sha "
          f"{sha}`")


def comando_registrar(args):
    _real, conteudo, dados = ler_release(args.json)
    sha, chave, release_id = identidade_release(conteudo, dados)
    anterior = normalizar_sha(args.anterior_sha, "--anterior-sha")
    if anterior == sha:
        raise Erro("--anterior-sha é o próprio release; nada a anotar")
    r2 = R2(args.token_file)
    objeto = r2.baixar(BUCKET_RELEASES, chave)
    if objeto is None or sha256_bytes(objeto) != sha:
        raise Erro("o release ainda não está no bucket; rode enviar antes")
    historico = r2.ler_json(
        BUCKET_RELEASES, HISTORICO_RELEASES, {"painel": PAINEL_ID, "ativacoes": []}
    )
    ativacoes = historico.get("ativacoes") if isinstance(historico, dict) else None
    if not isinstance(ativacoes, list):
        raise Erro(f"{HISTORICO_RELEASES} em formato inesperado; nada foi gravado")
    if ativacoes and ativacoes[-1].get("sha256") == sha:
        raise Erro("esta ativação já é a última anotada no histórico")
    meta = dados["meta"]
    ativacoes.append(
        {
            "release_id": release_id,
            "sha256": sha,
            "object_key": chave,
            "anterior_sha256": anterior,
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


def comando_historico(args):
    r2 = R2(args.token_file)
    historico = r2.ler_json(BUCKET_RELEASES, HISTORICO_RELEASES, None)
    ativacoes = historico.get("ativacoes") if isinstance(historico, dict) else None
    if not ativacoes:
        print("nenhuma ativação anotada; o release no ar está no D1 (comando ponteiro)")
        return
    for item in ativacoes:
        periodo = item.get("periodo") or {}
        print(
            f"{item.get('registrado_em')}  {item.get('release_id')}  "
            f"{periodo.get('inicio')} a {periodo.get('fim')}"
        )
        print(f"    sha256   {item.get('sha256')}")
        print(f"    anterior {item.get('anterior_sha256')}")
        if item.get("nota"):
            print(f"    nota     {item['nota']}")


def comando_verificar(args):
    sha = normalizar_sha(args.sha, "o SHA do release")
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
        except (urllib.error.URLError, ValueError):
            raise Erro(f"falha de rede ao consultar o serviço em {caminho}") from None

    falhas = []
    status, _ = pedir("/health", "GET")
    print(f"serviço /health: {status}")
    if status != 200:
        falhas.append("serviço fora do ar")
    status, _ = pedir("/v1/data", "HEAD")
    print(f"/v1/data sem sessão: {status} (esperado 401)")
    if status != 401:
        falhas.append("o serviço respondeu sem exigir sessão ou com erro")
    conferido = False
    if args.ponteiro:
        apontado = normalizar_sha(args.ponteiro, "--ponteiro")
        print(f"ponteiro informado: {'confere' if apontado == sha else 'DIVERGE'}")
        if apontado != sha:
            falhas.append("o ponteiro no D1 não aponta para este release")
        conferido = True
    sessao = ler_segredo(args.sessao_file, "HUB_SESSAO", "sessão do Hub")
    if sessao:
        status, cabecalhos = pedir("/v1/data", "HEAD", sessao)
        servido = (cabecalhos.get("X-Data-SHA256") or "").upper()
        print(
            f"/v1/data com sessão: {status} · release "
            f"{cabecalhos.get('X-Data-Release')} · sha "
            f"{'confere' if servido == sha else 'DIVERGE'}"
        )
        if status != 200 or servido != sha:
            falhas.append("o serviço não está entregando este release")
        conferido = True
    if falhas:
        raise Erro("verificação reprovada: " + "; ".join(falhas))
    if not conferido:
        raise Erro(
            "verificação incompleta: o ponteiro não foi conferido. Rode o "
            "SELECT do comando ponteiro e informe o sha256 devolvido em "
            "--ponteiro (ou use --sessao-file para o teste autenticado)"
        )
    print("verificação aprovada")


def comando_baixar(args):
    sha = normalizar_sha(args.sha, "o SHA do release")
    destino = fora_de_git(args.destino, "destino")
    r2 = R2(args.token_file)
    objeto = r2.baixar(BUCKET_RELEASES, f"releases/{sha}.json")
    if objeto is None or sha256_bytes(objeto) != sha:
        raise Erro("objeto do release ausente ou com hash divergente")
    destino.write_bytes(objeto)
    print(f"release gravado em {destino} ({len(objeto)} bytes)")


# ---------------- cofre de insumos brutos ----------------


def ler_manifesto(r2):
    manifesto = r2.ler_json(BUCKET_COFRE, MANIFESTO_COFRE, {})
    if not isinstance(manifesto, dict):
        raise Erro(f"{MANIFESTO_COFRE} em formato inesperado")
    manifesto.setdefault("painel", PAINEL_ID)
    base = manifesto.setdefault("base", {})
    if not isinstance(base, dict) or not isinstance(base.setdefault("itens", []), list):
        raise Erro(f"{MANIFESTO_COFRE}: seção base em formato inesperado")
    if not isinstance(manifesto.setdefault("blocos", []), list):
        raise Erro(f"{MANIFESTO_COFRE}: seção blocos em formato inesperado")
    return manifesto


def estado_da_base(itens):
    fontes = {i.get("sha256") for i in itens if i.get("papel") == "base"}
    matriz = any(i.get("papel") == "matriz" for i in itens)
    return "completa" if len(fontes) == FONTES_BASE and matriz else (
        "parcial" if itens else "ausente"
    )


def nome_seguro(chave):
    nome = chave.rsplit("/", 1)[-1]
    if nome in ("", ".", "..") or "\\" in nome or "/" in nome:
        raise Erro(f"nome de objeto inseguro para gravar em disco: {chave!r}")
    return nome


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
    if args.substitui and args.papel != "bloco":
        raise Erro("--substitui só vale com --papel bloco")
    r2 = R2(args.token_file)
    manifesto = ler_manifesto(r2)

    if args.papel == "bloco":
        blocos = manifesto["blocos"]
        substituido = None
        if args.substitui:
            candidatos = [
                b for b in blocos
                if b.get("vigente")
                and args.substitui in (b.get("chave"), b.get("arquivo_original"))
            ]
            if len(candidatos) != 1:
                raise Erro(
                    "--substitui deve indicar exatamente um bloco vigente "
                    f"(pela chave ou pelo nome original); encontrados "
                    f"{len(candidatos)}"
                )
            substituido = candidatos[0]
        existente = next((b for b in blocos if b.get("sha256") == sha), None)
        if existente is not None:
            # Mesmo conteúdo já guardado: reaproveita a entrada, sem duplicar.
            chave = existente["chave"]
            guardado = r2.baixar(BUCKET_COFRE, chave)
            if guardado is None or hashlib.sha256(guardado).hexdigest() != sha:
                r2.gravar(BUCKET_COFRE, chave, conteudo, TIPO_XLSX)
            existente["vigente"] = True
            entrada = existente
            print(f"conteúdo já guardado; entrada reaproveitada: {chave}")
        else:
            chave = f"{PREFIXO_BLOCOS}{hoje}_{sha[:8]}_{real.name}"
            r2.gravar(BUCKET_COFRE, chave, conteudo, TIPO_XLSX)
            entrada = {
                "chave": chave,
                "arquivo_original": real.name,
                "sha256": sha,
                "bytes": len(conteudo),
                "recebido_em": hoje,
                "vigente": True,
            }
            blocos.append(entrada)
            print(f"guardado e conferido por releitura: {chave}")
        if substituido is not None and substituido is not entrada:
            substituido["vigente"] = False
            substituido["substituido_em"] = hoje
            print(f"deixou de ser vigente: {substituido['chave']}")
    else:
        chave = PREFIXO_BASE + real.name
        guardado = r2.baixar(BUCKET_COFRE, chave)
        if guardado is not None and hashlib.sha256(guardado).hexdigest() != sha:
            # A base auditada não é sobrescrita: quem reproduz os critérios de
            # aceite é exatamente o conteúdo que já está guardado.
            raise Erro(
                f"{chave} já existe no cofre com outro conteúdo; a base "
                "auditada não é sobrescrita"
            )
        if guardado is None:
            r2.gravar(BUCKET_COFRE, chave, conteudo, TIPO_XLSX)
            print(f"guardado e conferido por releitura: {chave}")
        else:
            print(f"já presente e íntegro: {chave}")
        itens = [i for i in manifesto["base"]["itens"] if i.get("chave") != chave]
        itens.append(
            {
                "chave": chave,
                "arquivo_original": real.name,
                "sha256": sha,
                "bytes": len(conteudo),
                "recebido_em": hoje,
                "papel": args.papel,
            }
        )
        manifesto["base"]["itens"] = itens
        manifesto["base"]["estado"] = estado_da_base(itens)
        print(f"base no cofre: {manifesto['base']['estado']} "
              f"({sum(1 for i in itens if i.get('papel') == 'base')} de "
              f"{FONTES_BASE} fontes, Matriz "
              f"{'presente' if any(i.get('papel') == 'matriz' for i in itens) else 'ausente'})")
    manifesto["atualizado_em"] = hoje
    r2.gravar_json(BUCKET_COFRE, MANIFESTO_COFRE, manifesto)


def restaurar_item(r2, item, destino):
    conteudo = r2.baixar(BUCKET_COFRE, item["chave"])
    if conteudo is None:
        raise Erro(f"objeto ausente no cofre: {item['chave']}")
    if item.get("sha256") and hashlib.sha256(conteudo).hexdigest() != item["sha256"]:
        raise Erro(f"{item['chave']}: conteúdo diverge do SHA-256 do manifesto")
    nome = nome_seguro(item.get("arquivo_original") or item["chave"])
    alvo = destino / nome
    if alvo.exists():
        raise Erro(f"já existe em {destino.name}/: {nome}")
    alvo.write_bytes(conteudo)
    return nome


def comando_cofre_restaurar(args):
    raiz = fora_de_git(args.diretorio, "diretório de destino")
    if not raiz.is_dir():
        raise Erro(f"diretório inexistente: {raiz}")
    r2 = R2(args.token_file)
    manifesto = ler_manifesto(r2)
    itens = manifesto["base"]["itens"]
    if estado_da_base(itens) != "completa":
        raise Erro(
            "a base ainda não está completa no cofre "
            f"({sum(1 for i in itens if i.get('papel') == 'base')} de "
            f"{FONTES_BASE} fontes, Matriz "
            f"{'presente' if any(i.get('papel') == 'matriz' for i in itens) else 'ausente'}); "
            "envie as 19 planilhas com --papel base e a Matriz com --papel matriz"
        )
    pasta_base, pasta_blocos = raiz / "base", raiz / "blocos"
    for pasta in (pasta_base, pasta_blocos):
        pasta.mkdir(exist_ok=True)
        if any(pasta.iterdir()):
            raise Erro(f"a pasta {pasta} precisa estar vazia")
    matriz = None
    for item in itens:
        nome = restaurar_item(r2, item, pasta_base)
        if item.get("papel") == "matriz":
            matriz = nome
    vigentes = [b for b in manifesto["blocos"] if b.get("vigente")]
    nomes_blocos = [restaurar_item(r2, bloco, pasta_blocos) for bloco in vigentes]
    print(f"base restaurada em {pasta_base}: {FONTES_BASE} fontes + Matriz")
    print(f"blocos vigentes em {pasta_blocos}: {len(nomes_blocos)}")
    print("comando do build (ajuste --ate para a última competência fechada):")
    print(
        f"  python3 -I scripts/build-tea-data.py '{pasta_base}' "
        f"--matriz '{pasta_base / matriz}' "
        + "".join(f"--bloco '{pasta_blocos / nome}' " for nome in nomes_blocos)
        + ("--ate AAAA/MM " if nomes_blocos else "")
        + f"--saida '{raiz / 'tea.json'}'"
    )


def comando_cofre_baixar(args):
    diretorio = fora_de_git(args.diretorio, "diretório de destino")
    if not diretorio.is_dir():
        raise Erro(f"diretório inexistente: {diretorio}")
    if not args.chave.startswith(PREFIXO_COFRE):
        raise Erro(f"a chave deve começar por {PREFIXO_COFRE}")
    r2 = R2(args.token_file)
    if args.chave.endswith("/"):
        chaves = [
            i["key"] for i in r2.listar(BUCKET_COFRE, args.chave)
            if not i["key"].endswith("/")
        ]
        if not chaves:
            raise Erro(f"nenhum objeto no cofre com o prefixo {args.chave}")
    else:
        chaves = [args.chave]
    nomes = [nome_seguro(chave) for chave in chaves]
    repetidos = sorted({n for n in nomes if nomes.count(n) > 1})
    if repetidos:
        raise Erro("o prefixo tem objetos com o mesmo nome: " + ", ".join(repetidos))
    for chave, nome in zip(chaves, nomes):
        conteudo = r2.baixar(BUCKET_COFRE, chave)
        if conteudo is None:
            raise Erro(f"objeto ausente no cofre: {chave}")
        (diretorio / nome).write_bytes(conteudo)
        print(f"restaurado: {nome} ({len(conteudo)} bytes)")
    print(f"{len(chaves)} objeto(s) restaurado(s) em {diretorio}")


# ---------------- autoteste (rede simulada) ----------------


def release_sintetico(meses, corte, criancas_ultimo_mes=10):
    """Artefato mínimo, com a forma que o pipeline grava, para o autoteste."""
    periodos = [{"id": "tudo", "tipo": "tudo", "meses": list(meses)}] + [
        {"id": "mes-" + m.replace("/", "-"), "tipo": "mes", "meses": [m]}
        for m in meses
    ]

    def recorte(ms):
        serie = [
            {
                "m": m,
                "pacientes": criancas_ultimo_mes if m == meses[-1] else 10,
                "sessoes": 20,
                "pagamento": 1000.0,
            }
            for m in ms
        ]
        return {
            "resumo": {
                "pacientes": 10,
                "sessoes": 20 * len(ms),
                "pagamento": 1000.0 * len(ms),
            },
            "serie_mensal": serie,
            "pacientes": {
                "faixa_etaria": [{"faixa": "6–8", "pacientes": int(corte[5:7])}],
                "genero": {"FEMININO": 5, "MASCULINO": 5},
            },
            "pacientes_disciplina": {
                "Psicologia": {
                    "faixa_etaria": [{"faixa": "6–8", "pacientes": int(corte[5:7])}]
                }
            },
        }

    return {
        "meta": {
            "painel": "Painel Terapias Especiais",
            "versao_script": "0.0.0-autoteste",
            "gerado_em": "2026-01-01",
            "data_corte_idade": corte,
            "periodo_canonico": {
                "inicio": meses[0], "fim": meses[-1], "competencias": len(meses),
            },
            "periodos": periodos,
            "blocos_fonte": [],
        },
        "recortes": {p["id"]: recorte(p["meses"]) for p in periodos},
    }


def selftest():
    import contextlib
    import email.message
    import io
    import tempfile

    token = "TOKEN-FALSO-DE-AUTOTESTE-0123456789"
    sessao_hub = "SESSAO-FALSA-DE-AUTOTESTE-0123456789"
    objetos = {}
    buckets = {BUCKET_RELEASES, BUCKET_COFRE}
    servico = {"health": 200, "anonimo": 401, "sha": ""}

    class Resposta:
        def __init__(self, status, corpo=b"", cabecalhos=None):
            self.status, self._corpo = status, corpo
            self.headers = email.message.Message()
            for chave, valor in (cabecalhos or {}).items():
                self.headers[chave] = valor

        def read(self):
            return self._corpo

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

    def recusar(url, status):
        return urllib.error.HTTPError(
            url, status, "simulado", email.message.Message(), io.BytesIO(b"")
        )

    def urlopen_falso(pedido, timeout=None):
        url, metodo = pedido.full_url, pedido.get_method()
        if url.startswith(SERVICO):
            if url.endswith("/health"):
                if servico["health"] != 200:
                    raise recusar(url, servico["health"])
                return Resposta(200)
            if not pedido.get_header("X-auth-token"):
                if servico["anonimo"] >= 400:
                    raise recusar(url, servico["anonimo"])
                return Resposta(servico["anonimo"])
            return Resposta(
                200, b"",
                {"X-Data-SHA256": servico["sha"], "X-Data-Release": "simulado"},
            )
        if pedido.get_header("Authorization") != "Bearer " + token:
            raise recusar(url, 403)
        partes = urllib.parse.urlparse(url)
        bucket, _, resto = partes.path.split("/r2/buckets/", 1)[1].partition("/objects")
        chave = urllib.parse.unquote(resto.lstrip("/"))
        if bucket not in buckets:
            raise recusar(url, 404)
        if not chave:
            prefixo = urllib.parse.parse_qs(partes.query).get("prefix", [""])[0]
            itens = [
                {"key": k, "size": len(v), "last_modified": "2026-01-01T00:00:00Z"}
                for (b, k), v in sorted(objetos.items())
                if b == bucket and k.startswith(prefixo)
            ]
            corpo = json.dumps(
                {"result": itens, "result_info": {"is_truncated": False}}
            )
            return Resposta(200, corpo.encode("utf-8"))
        if metodo == "PUT":
            objetos[(bucket, chave)] = pedido.data
            return Resposta(200, b"{}")
        if (bucket, chave) not in objetos:
            raise recusar(url, 404)
        return Resposta(200, objetos[(bucket, chave)])

    saidas = []

    def rodar(*argumentos, codigo=0, contem=()):
        argv_real = sys.argv
        sys.argv = ["tea-release.py", *[str(a) for a in argumentos]]
        saida, erro, obtido = io.StringIO(), io.StringIO(), 0
        try:
            with contextlib.redirect_stdout(saida), contextlib.redirect_stderr(erro):
                main()
        except SystemExit as exc:
            obtido = exc.code if isinstance(exc.code, int) else 1
        finally:
            sys.argv = argv_real
        texto = saida.getvalue() + erro.getvalue()
        saidas.append(texto)
        trechos = (contem,) if isinstance(contem, str) else contem
        if obtido != codigo or any(t not in texto for t in trechos):
            raise Erro(
                f"autoteste: `{' '.join(str(a) for a in argumentos[:3])} …` "
                f"saiu com {obtido} (esperado {codigo}) ou sem o trecho esperado"
            )
        return texto

    ambiente = {
        nome: os.environ.get(nome)
        for nome in ("CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "HUB_SESSAO")
    }
    urlopen_real = urllib.request.urlopen
    try:
        os.environ["CLOUDFLARE_ACCOUNT_ID"] = "0123456789abcdef0123456789abcdef"
        os.environ["CLOUDFLARE_API_TOKEN"] = token
        os.environ.pop("HUB_SESSAO", None)
        urllib.request.urlopen = urlopen_falso
        with tempfile.TemporaryDirectory(prefix="tea-release-selftest-") as tmp:
            raiz = Path(tmp)
            if ancestral_git(raiz) is not None:
                raise Erro("autoteste: diretório temporário dentro de um Git")

            # segredo com rótulo não chega à camada HTTP nem à tela
            rotulado = raiz / "token-com-rotulo"
            rotulado.write_text("Token do painel\n" + token + "\n", encoding="utf-8")
            rodar("--token-file", rotulado, "cofre-listar", codigo=1,
                  contem="formato inesperado (2 linha(s)")

            # cofre: base não é sobrescrita; completa = 19 conteúdos + Matriz
            origem = raiz / "origem"
            origem.mkdir()
            for i in range(FONTES_BASE):
                (origem / f"Fonte {i:02d} - çã.xlsx").write_bytes(f"fonte-{i}".encode())
            matriz = origem / "Matriz 2025.xlsx"
            matriz.write_bytes(b"matriz")
            for i in range(FONTES_BASE - 1):
                rodar("cofre-enviar", origem / f"Fonte {i:02d} - çã.xlsx", "--papel", "base")
            rodar("cofre-enviar", matriz, "--papel", "matriz",
                  contem="base no cofre: parcial (18 de 19 fontes, Matriz presente)")
            destino = raiz / "restaurado"
            destino.mkdir()
            rodar("cofre-restaurar", destino, codigo=1, contem="ainda não está completa")
            ultima = origem / f"Fonte {FONTES_BASE - 1:02d} - çã.xlsx"
            rodar("cofre-enviar", ultima, "--papel", "base", contem="base no cofre: completa")
            rodar("cofre-enviar", ultima, "--papel", "base", contem="já presente e íntegro")
            (origem / "Fonte 05 - çã.xlsx").write_bytes(b"reexportada")
            rodar("cofre-enviar", origem / "Fonte 05 - çã.xlsx", "--papel", "base",
                  codigo=1, contem="não é sobrescrita")
            if objetos[(BUCKET_COFRE, PREFIXO_BASE + "Fonte 05 - çã.xlsx")] != b"fonte-5":
                raise Erro("autoteste: a base guardada foi alterada")

            # cofre: blocos sem duplicata e substituição explícita
            bloco_a = raiz / "Bloco 072026_092026.xlsx"
            bloco_a.write_bytes(b"bloco-a")
            rodar("cofre-enviar", bloco_a, "--papel", "bloco", contem="guardado e conferido")
            rodar("cofre-enviar", bloco_a, "--papel", "bloco", contem="entrada reaproveitada")
            bloco_b = raiz / "Bloco 072026_102026.xlsx"
            bloco_b.write_bytes(b"bloco-b")
            rodar("cofre-enviar", bloco_b, "--papel", "bloco", "--substitui", "outro.xlsx",
                  codigo=1, contem="exatamente um bloco vigente")
            rodar("cofre-enviar", bloco_b, "--papel", "base", "--substitui", bloco_a.name,
                  codigo=1, contem="só vale com --papel bloco")
            rodar("cofre-enviar", bloco_b, "--papel", "bloco", "--substitui", bloco_a.name,
                  contem="deixou de ser vigente")
            manifesto = json.loads(objetos[(BUCKET_COFRE, MANIFESTO_COFRE)])
            if [b["vigente"] for b in manifesto["blocos"]] != [False, True]:
                raise Erro("autoteste: vigência dos blocos incorreta no manifesto")

            # cofre: restauração com nomes originais e hash conferido
            texto = rodar("cofre-restaurar", destino, contem=("--matriz", "--ate AAAA/MM"))
            if (
                sorted(p.name for p in (destino / "base").iterdir())
                != sorted(p.name for p in origem.iterdir())
                or [p.name for p in (destino / "blocos").iterdir()] != [bloco_b.name]
                or f"{destino / 'blocos' / bloco_b.name}" not in texto
            ):
                raise Erro("autoteste: restauração do cofre incompleta")
            rodar("cofre-restaurar", destino, codigo=1, contem="precisa estar vazia")
            outro = raiz / "restaurado-2"
            outro.mkdir()
            chave_05 = (BUCKET_COFRE, PREFIXO_BASE + "Fonte 05 - çã.xlsx")
            objetos[chave_05] = b"adulterado"
            rodar("cofre-restaurar", outro, codigo=1, contem="diverge do SHA-256 do manifesto")
            objetos[chave_05] = b"fonte-5"
            avulso = raiz / "avulso"
            avulso.mkdir()
            rodar("cofre-baixar", PREFIXO_COFRE + "inexistente/", avulso, codigo=1,
                  contem="nenhum objeto no cofre com o prefixo")
            objetos[(BUCKET_COFRE, PREFIXO_BASE)] = b""
            rodar("cofre-baixar", PREFIXO_BASE, avulso, contem="20 objeto(s) restaurado(s)")
            del objetos[(BUCKET_COFRE, PREFIXO_BASE)]
            objetos[(BUCKET_COFRE, PREFIXO_COFRE + "x/a/igual.xlsx")] = b"1"
            objetos[(BUCKET_COFRE, PREFIXO_COFRE + "x/b/igual.xlsx")] = b"2"
            rodar("cofre-baixar", PREFIXO_COFRE + "x/", avulso, codigo=1,
                  contem="objetos com o mesmo nome")

            # releases: comparação
            privado = raiz / "privado"
            privado.mkdir()

            def gravar(nome, dados):
                caminho = privado / nome
                caminho.write_text(
                    json.dumps(dados, ensure_ascii=False, sort_keys=True) + "\n",
                    encoding="utf-8",
                )
                return caminho, sha256_bytes(caminho.read_bytes())

            base_json, sha_base = gravar(
                "base.json", release_sintetico(["2026/05", "2026/06"], "2026-06-30")
            )
            novo_json, sha_novo = gravar(
                "novo.json",
                release_sintetico(["2026/05", "2026/06", "2026/07"], "2026-07-31"),
            )
            texto = rodar(
                "comparar", base_json, novo_json, "--exigir-fechados-inalterados",
                contem=(
                    "Idênticos exceto faixa etária          : 2",
                    "Ampliados por competências novas       : tudo",
                    "2026/07",
                ),
            )
            try:
                # Console legado do Windows com saída redirecionada.
                texto.encode("cp1252")
            except UnicodeEncodeError:
                raise Erro(
                    "autoteste: comparar imprime caractere fora de cp1252"
                ) from None
            mesmo_corte, _sha = gravar(
                "mesmo-corte.json",
                release_sintetico(["2026/05", "2026/06", "2026/07"], "2026-06-30"),
            )
            rodar("comparar", base_json, mesmo_corte, "--exigir-fechados-inalterados",
                  contem="Recortes fechados idênticos           : 2")
            reapresentado = release_sintetico(["2026/05", "2026/06"], "2026-06-30")
            reapresentado["recortes"]["mes-2026-05"]["pacientes"]["faixa_etaria"][0][
                "pacientes"
            ] += 1
            outro_json, _sha = gravar("reapresentado.json", reapresentado)
            rodar("comparar", base_json, outro_json, "--exigir-fechados-inalterados",
                  codigo=1, contem=("mes-2026-05: pacientes",
                                    "Idênticos exceto faixa etária          : 0"))
            alterado, _sha = gravar(
                "alterado.json",
                release_sintetico(["2026/05", "2026/06"], "2026-06-30", 11),
            )
            rodar("comparar", base_json, alterado, contem="ALTERADA")

            # releases: ponteiro, SQL, envio, histórico e verificação
            rodar("ponteiro", contem="SELECT panel_id, release_id, object_key, sha256")
            rodar("sql", novo_json, "--anterior-sha", sha_base.lower(),
                  contem=(f"upper(sha256)='{sha_base}'", f"releases/{sha_novo}.json"))
            rodar("sql", novo_json, "--anterior-sha", sha_novo, codigo=1,
                  contem="nada a ativar")
            injetado = release_sintetico(["2026/05", "2026/06"], "2026-06-30")
            injetado["meta"]["gerado_em"] = "2026-01-01', sha256='X'; --"
            ruim_json, _sha = gravar("injetado.json", injetado)
            texto = rodar("sql", ruim_json, "--anterior-sha", sha_base, codigo=1,
                          contem="gerado_em")
            if "UPDATE" in texto:
                raise Erro("autoteste: SQL emitido com gerado_em fora do formato")
            rodar("registrar", novo_json, "--anterior-sha", sha_base, codigo=1,
                  contem="ainda não está no bucket")
            rodar("enviar", novo_json, contem="enviado e conferido por releitura")
            rodar("enviar", novo_json, contem="já presente e íntegro")
            rodar("registrar", novo_json, "--anterior-sha", "<SHA-vigente>", codigo=1,
                  contem="SHA-256 completo")
            rodar("registrar", novo_json, "--anterior-sha", sha_base, "--nota", "teste")
            rodar("registrar", novo_json, "--anterior-sha", sha_base, codigo=1,
                  contem="já é a última anotada")
            rodar("historico", contem=(sha_novo, sha_base, "teste"))
            rodar("verificar", sha_novo, codigo=1, contem="verificação incompleta")
            rodar("verificar", sha_novo, "--ponteiro", sha_base, codigo=1,
                  contem="não aponta para este release")
            rodar("verificar", sha_novo, "--ponteiro", sha_novo,
                  contem="verificação aprovada")
            servico["health"] = 503
            rodar("verificar", sha_novo, "--ponteiro", sha_novo, codigo=1,
                  contem="serviço fora do ar")
            servico["health"], servico["anonimo"] = 200, 200
            rodar("verificar", sha_novo, "--ponteiro", sha_novo, codigo=1,
                  contem="sem exigir sessão")
            servico["anonimo"], servico["sha"] = 401, sha_novo
            arquivo_sessao = raiz / "sessao"
            arquivo_sessao.write_text(sessao_hub + "\n", encoding="utf-8")
            rodar("verificar", sha_novo, "--sessao-file", arquivo_sessao,
                  contem=("com sessão: 200", "verificação aprovada"))
            servico["sha"] = sha_base
            rodar("verificar", sha_novo, "--sessao-file", arquivo_sessao, codigo=1,
                  contem="não está entregando este release")
            volta = privado / "volta.json"
            rodar("baixar", sha_novo, volta)
            if volta.read_bytes() != novo_json.read_bytes():
                raise Erro("autoteste: release baixado diverge do enviado")

            # guardas: arquivo dentro de Git e bucket inexistente
            falso_git = raiz / "repo"
            (falso_git / ".git").mkdir(parents=True)
            dentro = falso_git / "tea.json"
            dentro.write_bytes(novo_json.read_bytes())
            rodar("enviar", dentro, codigo=1, contem="dentro do repositório Git")
            buckets.discard(BUCKET_COFRE)
            rodar("cofre-listar", codigo=1,
                  contem="bucket não encontrado na conta informada")
        if any(token in texto or sessao_hub in texto for texto in saidas):
            raise Erro("autoteste: um segredo apareceu em alguma saída")
    finally:
        urllib.request.urlopen = urlopen_real
        for nome, valor in ambiente.items():
            if valor is None:
                os.environ.pop(nome, None)
            else:
                os.environ[nome] = valor
    print(
        "tea-release selftest OK — cofre (base preservada, blocos sem "
        "duplicata, restauração conferida), comparação, SQL do ponteiro, "
        "histórico, verificação e segredos fora das saídas"
    )


# ---------------- linha de comando ----------------


def main():
    for fluxo in (sys.stdout, sys.stderr):
        # Saída redirecionada em console legado não pode derrubar o comando.
        if hasattr(fluxo, "reconfigure"):
            fluxo.reconfigure(errors="replace")
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--token-file", help="arquivo com o token, fora de qualquer Git")
    sub = ap.add_subparsers(dest="comando", required=True)

    sub.add_parser("ponteiro")
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
    sub.add_parser("historico")
    p = sub.add_parser("verificar")
    p.add_argument("sha")
    p.add_argument(
        "--ponteiro",
        help="sha256 devolvido pelo SELECT de conferência no D1",
    )
    p.add_argument(
        "--sessao-file",
        help="arquivo, fora de Git, com a sessão do Hub para o teste autenticado",
    )
    p = sub.add_parser("baixar")
    p.add_argument("sha")
    p.add_argument("destino")
    sub.add_parser("cofre-listar")
    p = sub.add_parser("cofre-enviar")
    p.add_argument("arquivo")
    p.add_argument("--papel", required=True, choices=("base", "bloco", "matriz"))
    p.add_argument(
        "--substitui",
        help="chave ou nome original do bloco vigente que este substitui",
    )
    p = sub.add_parser("cofre-restaurar")
    p.add_argument("diretorio", help="pasta privada; recebe base/ e blocos/")
    p = sub.add_parser("cofre-baixar")
    p.add_argument("chave", help="chave de um objeto ou prefixo terminado em /")
    p.add_argument("diretorio")
    sub.add_parser("selftest")
    args = ap.parse_args()

    try:
        if args.comando == "comparar":
            _r, _c, anterior = ler_release(args.anterior)
            _r, _c, novo = ler_release(args.novo)
            comparar(anterior, novo, args.exigir_fechados_inalterados)
        else:
            {
                "ponteiro": comando_ponteiro,
                "enviar": comando_enviar,
                "sql": comando_sql,
                "registrar": comando_registrar,
                "historico": comando_historico,
                "verificar": comando_verificar,
                "baixar": comando_baixar,
                "cofre-listar": comando_cofre_listar,
                "cofre-enviar": comando_cofre_enviar,
                "cofre-restaurar": comando_cofre_restaurar,
                "cofre-baixar": comando_cofre_baixar,
                "selftest": lambda _args: selftest(),
            }[args.comando](args)
    except (Erro, OSError, ValueError, KeyError) as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
