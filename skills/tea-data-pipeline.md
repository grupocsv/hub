# Skill: Atualização de dados do Painel TEA (rito oficial)

**Painel:** `unimed/tea.html` (interno, portal/hub-auth) + `https://hub.grupocsv.com/p/painel-tea/` (cópia compartilhável, gate embutido, publica no deploy do git)
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
8. Gerar a cópia compartilhável `/p/` (mesmo domínio do hub, publica no deploy do git — SEM republicação manual):
   `python3 scripts/build-tea-data.py --emit-p` → grava `p/painel-tea/index.html`
   (hub-auth e link de volta removidos, gate EMBUTIDO com id="gate" — no `/p/` não há
   worker, então o gate embutido é o mecanismo correto; campo `senha`, POST ao
   csv-open-auth, e-mails @unimedgv, sessão 4h, botão "olhinho"). `git add p/painel-tea/index.html`.
9. **Confirmar o gate**: abrir `https://hub.grupocsv.com/p/painel-tea/` em aba anônima —
   o formulário "Painel TEA — acesso restrito" tem que aparecer antes de qualquer dado.
   (A antiga cópia em `open.grupocsv.com/painel-tea/` foi APOSENTADA em 11/07/2026: o
   painel é ferramenta do ambiente Unimed, então mora no domínio do hub via `/p/`.)
10. A data de corte/versão já ficam no bloco `meta` (visíveis na topbar e na view Método).

## Extras

- `--auditoria` grava a fila nominal de auditoria **ao lado do insumo** (fora do repo) —
  artefato privado da operadora; nunca commitá-la nem publicá-la.
- **Envio da fila ao EVS (passo 11 do rito):** canal ÚNICO autorizado = **csv-mail**
  (skill `csv-mail`; endpoint `https://mail-api.grupocsv.com/send-template`, com os
  headers obrigatórios `User-Agent: csv-mail-client/1.0` e `Authorization: Bearer
  <CSV_MAIL_API_KEY>` — a chave fica na skill privada/VPS, **jamais** neste repo público).
  Anexar o CSV completo (base64), remetente institucional `guilherme@mail.grupocsv.com`
  (from_name "Painel TEA · EVS"), destinatários da operadora (teste vigente:
  guilherme.thome@unimedgv.com.br + cc naline.rocha@unimedgv.com.br) e conferir
  `GET /status/:id` até `delivered`. **PROIBIDO** enviar por Gmail/Zapier/Criale —
  os e-mails da Unimed são só destinatários, nunca remetentes (regra do responsável,
  10/07/2026; a rota `mail_send` do Extensio MCP estava com defeito 522 nesta data —
  use o endpoint direto).
- `--selftest` roda a fixture sintética `scripts/tests/tea-fixture-sintetica.csv`
  (cobre multi-carteirinha, fusão Casa Unimed, merge de CNPJ, k-anonimato, evento extremo).
  Rode após qualquer mudança no script.
- Regras do LEIA-ME hard-coded no script: chave de paciente = NOME+NASCIMENTO;
  registros "ATENDIMENTO ESPECIALIZADO" → Casa Unimed (por registro); Ana Carolina Falcão +
  Criar e Crescer Teen = mesmo prestador; mapa Tipo Prestador → canal de pagamento.
  **Proibido** calcular indicadores TEA fora deste pipeline.

## Camada Coorte CTE (segundo pipeline)

`scripts/build-cte-data.py <censo-cte.xlsx> --corte AAAA-MM-DD` gera
`unimed/data/cte-agregados.json` (coorte fixa de 300, consumo multidisciplinar
integral, série 2024+) e injeta em `unimed/tea.html` entre `<!-- CTE-DATA:BEGIN/END -->`.
Mesmas regras LGPD (xlsx fora do repo, k=5, anti-vazamento). `--selftest` roda
`scripts/tests/cte-fixture-sintetica.csv`. O censo bruto (nomes, CID de menores)
NUNCA entra no repo. Universo distinto do painel principal — todo número carrega
o selo "Coorte CTE · 300".
