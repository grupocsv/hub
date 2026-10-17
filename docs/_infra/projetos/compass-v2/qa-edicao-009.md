# QA — Compass™ 009/2026 (edição de referência do padrão paginado)

**Edição:** 009/2026 — Rumo à organização por condição
**Fonte primária:** Westerink HJ, van Staalduinen DJ, et al. Moving toward a Condition-Based Organization — Lessons from the Value Catalyst Hospitals. NEJM Catalyst Innovations in Care Delivery 2026;7(10). DOI 10.1056/CAT.26.0046.
**Natureza:** adaptação em português, com as 25 referências do artigo preservadas na numeração original.
**Estado:** nativa v2, release inativo (sem selo de estado editorial na capa ou na Central).

## 1. Resultado

| Verificação | Resultado |
|---|---|
| `npm run compass:test` | 107 testes aprovados |
| Páginas do PDF | 21 (capa, sumário, síntese, 6 capítulos, referências, contracapa) |
| Tamanho do PDF | 938.829 bytes |
| Paridade web/PDF (`quality-gates.mjs`) | Aprovada, inclusive título, Value Catalyst, Westerink e síntese da contracapa |
| Acessibilidade (axe) | 0 violações bloqueantes |
| Contraste do título da contracapa | 17,96:1 em tela e no PDF |
| Overflow horizontal em 375 px | 0 px |
| Camada de texto do PDF | 0 hifens suaves (U+00AD) |
| Inspeção visual | 21 páginas do PDF, desktop claro e escuro, celular (390 px) |

## 2. O que a edição 009 fixa como referência

A 009 é a primeira edição composta diretamente no contrato v2, sem HTML recebido de terceiros. Ela consolida o padrão paginado do motor e corrige três fragilidades observadas na integração da 008:

1. **Escopo por edição.** O VitePress concatena o CSS de todas as edições em um único bundle, de modo que regras `.compass-v2--paged …` de uma edição paginada alcançam as demais. Na 009, todas as seções ficam dentro de `<div class="compass-ed-009">` e todo seletor começa por `.compass-v2--paged .compass-v2__content .compass-ed-009 …`. Isso isola a edição e dá a ela precedência sobre `.vp-doc` e sobre o tema genérico `compass-v2.css`, que impunham margens e corpo de texto do VitePress ao miolo paginado.
2. **Cores na impressão.** O tema força cores escuras em `p`, `td`, `strong`, `h2` e `h3` com `!important` na mídia de impressão, o que escurecia subtítulo da capa e texto da contracapa. A 009 devolve as suas cores no bloco `@media print` com a mesma força.
3. **Página em branco na impressão.** O alvo de foco do VitePress (`<span tabindex="-1">`, primeiro filho de `.Layout`) é uma caixa vazia no fluxo de impressão. Em Chromium recente, ela abre uma página padrão em branco antes da primeira página nomeada das edições paginadas. A regra `.Layout > span[tabindex="-1"] { display:none !important }` entrou no bloco de impressão de `docs/.vitepress/theme/compass-v2.css`, com teste em `tests/compass-v2/theme.test.mjs`. Com ela, a 009 renderiza 21 páginas e a 008 volta a renderizar 23 no mesmo Chromium.

A edição fixa também a fórmula de créditos definida em 17/10/2026: "Compass™ — elaboração do Grupo CSV" e "Responsabilidade editorial: MedValor®", sem selo de estado editorial na capa (o campo `status` dos metadados é operacional). Outras decisões incorporadas ao padrão: leitura fluida em qualquer largura de tela (sem fac-símile A4 na web), figuras SVG inline com rolagem horizontal no celular, tabelas com `colgroup` e coluna de texto corrido mais larga, fichas de prática (`.verbete`), linhas de dados e abertura de capítulo em faixa escura. A Grifter Bold não possui `õ`, `Õ`, travessões e setas, o que condiciona a redação dos títulos em fonte display.

## 3. Contratos de teste adicionados ou generalizados

| Arquivo | Conteúdo |
|---|---|
| `tests/compass-v2/paged-css-isolation.test.mjs` | Generalizado para as edições paginadas 008 e 009; exige escopo próprio de edição a partir da 009 |
| `tests/compass-v2/edition-009.test.mjs` | Metadados válidos, componente nativo com 21 páginas e ação de download, manifesto de release coerente com o PDF |
| `tests/compass-v2/theme.test.mjs` | Regra de impressão que evita a página em branco |
| `tests/compass-v2/admin.test.mjs`, `config-integration.test.mjs`, `central-catalog-sync.test.mjs` | Acervo 001–009 no workflow, na documentação e no catálogo |

## 4. Pendências de release

O release segue o [runbook](./runbook-release-rollback.md): aprovação editorial, `npm run compass:test:pdf` no runtime isolado, plano offline com `npm run compass:release-plan` (nove edições), ingestão do PDF no `csv-documents` e ativação pelo workflow protegido. Nenhuma dessas etapas foi executada.
