# Skill: Atualização de dados do Painel TEA (rito oficial)

**Painel:** `unimed/tea.html` (interno) + `https://open.grupocsv.com/painel-tea/` (público, com gate)
**Pipeline:** `scripts/build-tea-data.py` · **PRD:** `docs/_infra/prd-2026-07-painel-tea-v2.md` (§6)

## Regra de ouro (LGPD)

O repositório `grupocsv/hub` é **público**. A planilha bruta contém nomes de crianças +
condição de saúde (dado sensível de menores) e **JAMAIS** pode ser commitada, publicada
ou copiada para dentro da árvore do repo (o script aborta se o insumo estiver dentro de
um repo git). Só agregados k-anonimizados (k=5) são versionáveis. O `.gitignore` bloqueia
`*.xlsx`, mas não confie só nele.

## Rito de atualização (10 passos)

1. Salvar a planilha nova em pasta local **fora do repo** (ex.: `~/GrupoCSV/dados-sensiveis/unimed-tea/tea-AAAA-MM.xlsx`).
2. Backup no bucket R2 privado `csv-dados-sensiveis` (criado em 09/07/2026), da sua máquina:
   `wrangler r2 object put csv-dados-sensiveis/unimed-tea/raw/tea-AAAA-MM.xlsx --file <arquivo>`.
3. `git pull` no hub.
4. Rodar o build e conferir o relatório (totais, células "<5", SHA-256):
   `python3 scripts/build-tea-data.py <caminho>/tea-AAAA-MM.xlsx --corte AAAA-MM-DD`
   — regenera `unimed/data/tea-2025-2026.json` e injeta o JSON no `unimed/tea.html`
   (marcadores `TEA-DATA:BEGIN/END`). Qualquer validação reprovada → exit ≠ 0 e nada é escrito.
5. Abrir `unimed/tea.html` no navegador e conferir as 6 seções.
6. **Revisão humana do `git diff`** — só agregados; nenhum nome/matrícula de beneficiário.
7. Commit com paths explícitos (`git add unimed/tea.html unimed/data/tea-2025-2026.json`) e push → deploy do hub.
8. Republicar a cópia pública com o mesmo slug (preserva a URL):
   `python3 scripts/build-tea-data.py <xlsx> --corte AAAA-MM-DD --emit-public /tmp/build-tea`
   e publicar `/tmp/build-tea/painel-tea.html` via tool MCP `open_page_publish` (slug `painel-tea`).
   O `og:image` aponta para `hub.grupocsv.com/assets/og/og_tea.png` — não precisa subir arquivo irmão.
9. **Confirmar o gate ativo**: abrir `https://open.grupocsv.com/painel-tea/` em aba anônima —
   o formulário de senha tem que aparecer antes de qualquer dado. Pré-condição, não opcional.
10. A data de corte/versão já ficam no bloco `meta` (visíveis na topbar e na view Método).

## Extras

- `--auditoria` grava a fila nominal de auditoria **ao lado do insumo** (fora do repo) —
  artefato privado da operadora; nunca commitá-la nem publicá-la.
- `--selftest` roda a fixture sintética `scripts/tests/tea-fixture-sintetica.csv`
  (cobre multi-carteirinha, fusão Casa Unimed, merge de CNPJ, k-anonimato, evento extremo).
  Rode após qualquer mudança no script.
- Regras do LEIA-ME hard-coded no script: chave de paciente = NOME+NASCIMENTO;
  registros "ATENDIMENTO ESPECIALIZADO" → Casa Unimed (por registro); Ana Carolina Falcão +
  Criar e Crescer Teen = mesmo prestador; mapa Tipo Prestador → canal de pagamento.
  **Proibido** calcular indicadores TEA fora deste pipeline.
