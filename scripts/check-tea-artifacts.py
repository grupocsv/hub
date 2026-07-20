#!/usr/bin/env python3
"""Validação bloqueante da camada pública do Painel Terapias Especiais."""

import argparse
import re
import sys
import unicodedata
from pathlib import Path


def d_nome(valor):
    texto = unicodedata.normalize("NFKD", str(valor).strip())
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", texto).upper()


def exigir(condicao, mensagem, erros):
    if not condicao:
        erros.append(mensagem)


def verificar_ausencia_de_dados(html, rotulo, erros):
    exigir(
        re.search(r'id\s*=\s*["\']tea-data["\']', html, flags=re.I) is None,
        f"{rotulo}: bloco tea-data não pode existir na camada pública",
        erros,
    )
    inicios = html.count("<!-- TEA-DATA:BEGIN -->")
    fins = html.count("<!-- TEA-DATA:END -->")
    exigir(
        (inicios, fins) in {(0, 0), (1, 1)},
        f"{rotulo}: par de marcadores TEA-DATA inválido",
        erros,
    )
    if (inicios, fins) == (1, 1):
        miolo = html.split("<!-- TEA-DATA:BEGIN -->", 1)[1].split(
            "<!-- TEA-DATA:END -->", 1
        )[0]
        miolo_sem_comentarios = re.sub(r"<!--.*?-->", "", miolo, flags=re.S)
        exigir(
            not miolo_sem_comentarios.strip(),
            f"{rotulo}: marcadores TEA-DATA ainda encapsulam payload",
            erros,
        )
    exigir(
        re.search(r'["\']recortes["\']\s*:', html, flags=re.I) is None,
        f"{rotulo}: payload agregado com recortes foi embutido no HTML",
        erros,
    )
    for bloco in re.findall(
        r'<script\b[^>]*type\s*=\s*["\']application/json["\'][^>]*>(.*?)</script>',
        html,
        flags=re.I | re.S,
    ):
        exigir(
            not (
                re.search(r'["\']recortes["\']\s*:', bloco, flags=re.I)
                or re.search(r'["\']prestadores["\']\s*:', bloco, flags=re.I)
            ),
            f"{rotulo}: script application/json contém dados do painel",
            erros,
        )


def validar(raiz):
    erros = []
    interno_path = raiz / "unimed" / "tea.html"
    publico_path = raiz / "p" / "painel-tea" / "index.html"
    json_privado = raiz / "unimed" / "data" / "tea-2025-2026.json"

    for caminho in (interno_path, publico_path):
        exigir(caminho.is_file(), f"arquivo ausente: {caminho}", erros)
    exigir(
        not json_privado.exists(),
        "artefato privado não pode existir no repositório: "
        "unimed/data/tea-2025-2026.json",
        erros,
    )
    ignorar_partes = {".git", "node_modules", ".vitepress", "dist"}
    for caminho in raiz.rglob("*.json"):
        if any(parte in ignorar_partes for parte in caminho.parts):
            continue
        try:
            texto = caminho.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            erros.append(f"não foi possível inspecionar {caminho}: {exc}")
            continue
        if (
            re.search(r'["\']periodo_canonico["\']\s*:', texto, flags=re.I)
            and re.search(r'["\']recortes["\']\s*:', texto, flags=re.I)
        ):
            erros.append(
                "payload privado encontrado em arquivo JSON do repositório: "
                f"{caminho.relative_to(raiz)}"
            )
    if erros and not (interno_path.is_file() and publico_path.is_file()):
        return erros

    interno = interno_path.read_text(encoding="utf-8")
    publico = publico_path.read_text(encoding="utf-8")
    verificar_ausencia_de_dados(interno, "painel interno", erros)
    verificar_ausencia_de_dados(publico, "cópia /p/", erros)

    noindex = '<meta name="robots" content="noindex, nofollow">'
    exigir(noindex in interno, "painel interno sem noindex, nofollow", erros)
    exigir(noindex in publico, "cópia /p/ sem noindex, nofollow", erros)
    exigir(
        re.search(
            r'<script[^>]*src="/scripts/hub-auth\.js"[^>]*data-portal="unimed"',
            interno,
        )
        is not None,
        "painel interno sem contrato hub-auth",
        erros,
    )
    exigir(
        re.search(r'<script[^>]*hub-auth\.js', publico) is None,
        "cópia /p/ carrega hub-auth.js",
        erros,
    )
    for trecho, rotulo in (
        ('id="gate"', "gate"),
        ("var PAGE='painel-tea'", "slug do gate"),
        ("4*3600*1000", "sessão de quatro horas"),
        ("@unimedgv.com.br", "e-mail corporativo"),
        ('id="gate-eye"', "controle de senha"),
        (
            "https://unimed-te-data.guilherme-thom.workers.dev/v1/session/open",
            "endpoint de autenticação",
        ),
        ("JSON.stringify({token:j.token,exp:exp})", "sessão opaca do gate"),
    ):
        exigir(trecho in publico, f"cópia /p/ sem {rotulo}", erros)

    for html, rotulo in ((interno, "painel interno"), (publico, "cópia /p/")):
        exigir(
            "https://unimed-te-data.guilherme-thom.workers.dev" in html,
            f"{rotulo}: endpoint privado de dados ausente",
            erros,
        )
        exigir(
            "'X-Auth-Token': token" in html,
            f"{rotulo}: loader não envia a sessão ao endpoint privado",
            erros,
        )

    for html, rotulo in ((interno, "painel interno"), (publico, "cópia /p/")):
        normalizado = d_nome(html)
        exigir("CTE-DATA" not in normalizado, f"{rotulo}: CTE legado presente", erros)
        exigir(
            "RECURSO PROPRIO" not in normalizado,
            f"{rotulo}: corte legado presente",
            erros,
        )
        exigir(
            "REDE PROPRIA" not in normalizado,
            f"{rotulo}: corte legado presente",
            erros,
        )
        exigir("PROJECAO" not in normalizado, f"{rotulo}: projeção presente", erros)
        exigir("SIMULADOR" not in normalizado, f"{rotulo}: simulador presente", erros)
        exigir(
            "GERADO AUTOMATICAMENTE" not in normalizado,
            f"{rotulo}: metalinguagem presente",
            erros,
        )
    return erros


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--root",
        default=".",
        help="raiz contendo unimed/ e p/",
    )
    args = ap.parse_args()
    erros = validar(Path(args.root).resolve())
    if erros:
        print("Validação pública do Painel Terapias Especiais FALHOU:", file=sys.stderr)
        for erro in erros:
            print(f"  - {erro}", file=sys.stderr)
        raise SystemExit(1)
    print(
        "Painel Terapias Especiais OK — sem dados no Git/HTML, "
        "acessos preservados e noindex presente"
    )


if __name__ == "__main__":
    main()
