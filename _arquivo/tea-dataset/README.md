# Data Set TEA (arquivado)

Memória técnica do Data Set TEA, guardada para reconstrução. A ferramenta saiu de uso em novembro de 2026, por decisão do Guilherme. Esta pasta não é publicada: o GitHub Pages só copia pastas listadas no deploy, e `scripts/generate-manifest.py` ignora `_arquivo/`.

## O que era

Questionário do ICDS para coletar dados sobre o cuidado do Transtorno do Espectro Autista (TEA) em operadoras Unimed. Cada unidade preenchia oito seções e enviava o formulário; o ICDS consolidava e comparava as respostas.

Unidades cadastradas:

| Unidade | Código | Estado | Portal de login |
| --- | --- | --- | --- |
| Unimed Rio Verde | 110 | GO | `tea-110` |
| Unimed Ourinhos | 094 | SP | `tea-094` |
| Unimed Governador Valadares | 236 | MG | `tea-236` |

As oito seções: Profissionais, Pacientes, Tratamento, Prestadores, Pagamento, Judicialização, Fluxo assistencial, Governança e dados.

## Onde estava

- `hub.grupocsv.com/p/tea-dataset/` (GitHub Pages, desde 15/02/2026). É a versão guardada em `frontend/`.
- `open.grupocsv.com/tea-dataset/` (Open Pages, cópia de março de 2026, mesmo login).
- `hub.grupocsv.com/icds/tea-dataset.html` só redirecionava para `/p/tea-dataset/`. O card do portal do ICDS (`icds/extras.json`, `icds/tools.json`) apontava para `/p/tea-dataset/`.

## Como funcionava

Página única (`frontend/index.html`, HTML, CSS e JavaScript sem build), com três serviços na Cloudflare:

| Serviço | Uso pela página | Rotas |
| --- | --- | --- |
| `csv-auth` | Login por unidade: escolha da unidade e senha da unidade (sem e-mail individual). Devolve um token de sessão guardado em `sessionStorage` (`tea_auth_token`). | `POST /login` |
| `csv-email` | Gravação do envio no D1 e e-mail de cópia; notificação interna para guilherme@grupocsv.com com o link "Visualizar formulário". | `POST /submit` (exige token), `GET /view/{hash}` (sem login, pelo hash de 12 caracteres), `GET /submissions` (só tokens dos portais `icds`, `axiacare`, `thera` e `tea-*`) |
| `csv-ai` | Assistente de preenchimento (prompt próprio do Data Set, com exemplos por seção). | `POST /tea-chat` |

Outros detalhes:
- Rascunho salvo no navegador (`localStorage`) a cada alteração.
- Exportação do formulário em Excel (SheetJS) e PDF (jsPDF com AutoTable).
- Senhas das unidades: tabela `portal_passwords` do D1 `csv-hub`, lidas pelo `csv-auth` (lista `COMPANY_TENANTS`); aparecem na aba Senhas do admin do Hub, em "Data Sets".

## Dados

D1 `csv-hub`:

```sql
CREATE TABLE tea_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT UNIQUE NOT NULL,
  unit_code TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  progress_pct INTEGER DEFAULT 0,
  form_data TEXT NOT NULL,      -- JSON com as oito seções
  submitted_at TEXT NOT NULL,
  submitted_by TEXT DEFAULT ""
);
```

Situação em 27/11/2026: um envio no total (Unimed Rio Verde, versão 1, 06/03/2026). Logins por unidade registrados em `access_logs` (tenants `tea-*`): último login com sucesso em 30/06/2026; uma tentativa sem sucesso em 07/10/2026.

## Primeira versão (março de 2026)

Antes desta versão houve outra, com login por usuário e organização, no serviço `tea-dataset-api` (Hono, JWT). Ela foi usada só em 02 e 03/03/2026 (13 logins, 3 formulários criados, 221 respostas gravadas) e deu lugar à versão por unidade em 06/03. Tabelas no D1 `csv-hub`: `tea_organizations`, `tea_users`, `tea_answers`, `tea_audit_logs`. O mesmo serviço ainda atende o leitor de comprovantes (OCR) da página de reembolso da AxiaCare (`axia/reembolso.html`, rota `POST /api/ocr/extract`), que não faz parte do Data Set.

## Para reconstruir

1. Publicar `frontend/` num endereço novo e ajustar os três endereços de serviço no início do script (`AUTH_API`, `EMAIL_API`, `AI_ENDPOINT`).
2. Recriar as unidades (`UNITS` no script e `COMPANY_TENANTS`/`PORTAL_NAMES` no `csv-auth`) e as senhas em `portal_passwords`.
3. Trocar o link "Visualizar formulário" do `csv-email` para o endereço novo.
4. Os dados enviados até a desativação ficam no arquivo privado indicado na seção abaixo.

## Desativação

Feita em etapas, cada uma com volta atrás:
1. Exportar `tea_submissions` e as tabelas da primeira versão (sem `password_hash`) para o bucket privado de arquivo da conta.
2. `open.grupocsv.com/tea-dataset/`: desligar a página nas Open Pages (o conteúdo fica guardado; religar é um clique).
3. `hub.grupocsv.com/p/tea-dataset/`: trocar a página por `desativada.html`, que avisa que a ferramenta saiu de uso.
4. Depois de 01/12/2026: tirar os portais `tea-*` do `csv-auth` e a rota `/submit` do `csv-email`, se nada mais depender deles.
