# Checklist de Completude de Conhecimento - Hub CSV

**Instrução para o Agente:** Copie este arquivo para `session_checklist.md`. Marque cada caixa (`[ ]` -> `[x]`) imediatamente após processar o ativo correspondente. Isso garante a persistência e a prova de leitura.

## Fase 1: Fundamentos (Obrigatório)

- [ ] **Manifesto:** Ler e processar completamente o `/manifest.json`.
- [ ] **Definição Canônica:** Ler `/docs/_infra/csv-core/definition.md`.
- [ ] **Sistema de Identidade:** Ler `/docs/_infra/csv-core/identity-system.md`.
- [ ] **Guia de Logos:** Ler `/docs/_infra/assets/logo-usage-guide.md`.
- [ ] **Taxonomia de Produtos:** Ler `/_infra/csv-core/taxonomia-produtos.md`.

## Fase 2: Mandatos das Empresas

- [ ] **AxiaCare:** Ler `/docs/_infra/axiacare/mandate.md`.
- [ ] **MedValor:** Ler `/docs/_infra/medvalor/mandate.md`.
- [ ] **TheraTech:** Ler `/docs/_infra/thera/mandate.md`.

## Fase 3: Assets Visuais

- [ ] **Catálogo de Assets:** Revisar `/docs/_infra/csv-core/assets.md`.
- [ ] **Diretório de Logos:** Listar o conteúdo de `/assets/visual-identity/` para entender a estrutura de arquivos de logo.

## Fase 4: Taxonomia de Produtos Digitais

- [ ] **Mapeamento de Produtos:** Revisar a seção `productAssets` do `/manifest.json` para entender a classificação de cada ativo HTML.
- [ ] **WebApps:** Identificar os ativos com `category: "webapp"` (ex: Data Set TEA, Gerador de Propostas).
- [ ] **Ferramentas:** Identificar os ativos com `category: "tool"` (ex: Nota Fiscal, Reembolso, Calculadora de Plantão).
- [ ] **Painéis BI:** Identificar os ativos com `category: "dashboard"` (ex: Oncologia, Especialidades, FIOS).
- [ ] **Páginas Estáticas:** Identificar os ativos com `category: "static"` (ex: Compliance, Founder, landings).

## Fase 5: Paginas Publicas

- [ ] **Documentacao (LEITURA OBRIGATORIA):** Ler `/docs/_infra/public-pages.md` — referencia do fluxo VIGENTE (Open Pages em `open.grupocsv.com`: aba Links Publicos do admin, painel `_admin/` ou tools MCP `open_page_publish`/`open_page_list`), alem da sincronizacao de menus dos portais (tools.json/extras.json).
- [ ] **Skill (LEGADO):** `/skills/public-pages.md` documenta o fluxo LEGADO `/p/` — vale SOMENTE para manutencao de paginas que ja existem em `/p/`; nao usar para novas publicacoes.
- [ ] **Registry (LEGADO):** `/p/registry.json` cataloga apenas as paginas legadas em `/p/`; as paginas Open Pages sao listadas via `open_page_list`/painel admin.

## Fase 6: Parceiros e Ferramentas (Se Relevante)

- [ ] **Unimed:** Revisar `/docs/unimed/index.md` e as ferramentas HTML vinculadas.
- [ ] **Unihealth:** Revisar `/docs/unihealth/index.md` e as ferramentas HTML vinculadas.

---

**Status de Completude:** 0/20
*Última atualização do checklist: 2026-03-06*
