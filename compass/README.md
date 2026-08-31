# Central Compass™ | Publicações Estratégicas do Grupo CSV

**Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®**

AxiaCare® permanece identificada na elaboração e na aplicação prática das edições utilizadas em consultorias e assessorias.

## Finalidade

O Compass™ consolida análises técnico-estratégicas para apoiar decisões em organizações de saúde. Cada edição preserva o conteúdo e as referências verificáveis, com publicação web responsiva e PDF A4 derivado da mesma fonte versionada.

## Fonte Única do Motor v2

Cada edição nativa v2 fica em `compass/edicoes/<ano>/<número>/`. A publicação em `docs/compass/` é derivada; não deve ser editada manualmente.

| Arquivo | Responsabilidade |
|---|---|
| `metadata.yml` | Identidade editorial, número, ano, marcas, status e artefatos |
| `compass.md` | Entrada semântica da edição |
| Componente Vue opcional | Layout editorial completo quando o Markdown não é suficiente |
| `edition.css` | Estilos exclusivos e namespaceados da edição |
| `compass_<número>_<ano>.pdf` | PDF A4 determinístico |
| `release.json` | Checksums e versões do motor, do template e da fonte |

O script `scripts/compass-v2/publish-editions.mjs` sincroniza somente edições reconhecidas como nativas v2. O script `catalog.mjs` gera `docs/compass/catalog.json`, que alimenta a navegação do Hub. A sidebar não mantém uma lista paralela de edições.

## Numeração

As edições seguem o formato **NNN/AAAA**. O número possui três dígitos e é imutável dentro do ano de publicação. URLs históricas devem permanecer válidas durante e depois da migração.

## Edições de 2026

| Edição | Título | Estado de Transição |
|---|---|---|
| [001/2026](edicoes/2026/001/compass.md) | Metas quantitativas de produção em contratos ACO com orçamento global | Publicada no modelo legado; migração prevista no M8 |
| [002/2026](edicoes/2026/002/compass.md) | O impacto da prostatectomia radical assistida por robô na saúde suplementar brasileira | Publicada no modelo legado; migração prevista no M8 |
| [003/2026](edicoes/2026/003/compass.md) | Incidência e fatores determinantes da necessidade de fototerapia neonatal no Brasil | Publicada no modelo legado; migração prevista no M8 |
| [004/2026](edicoes/2026/004/compass.md) | Implantação Estratégica e Operacional de NATS na Saúde Suplementar Brasileira | Publicada no modelo legado; migração prevista no M8 |
| [005/2026](edicoes/2026/005/compass.md) | Precificação Estruturada da Jornada Cirúrgica | Publicada no modelo legado; migração e correção de numeração previstas no M7 |
| [006/2026](edicoes/2026/006/compass.md) | Transição Demográfica e Oftalmologia na Saúde Suplementar | Publicada no modelo legado; migração e correção de numeração previstas no M7 |
| [007/2026](edicoes/2026/007/compass.md) | Crise de Sustentabilidade e Eficiência na Saúde Suplementar Brasileira | Publicada no modelo legado; piloto de migração previsto no M6 |
| [008/2026](edicoes/2026/008/compass.md) | Modelo editorial completo da edição 008 | Nativa v2; release controlado pendente |

## Comandos Oficiais

| Objetivo | Comando |
|---|---|
| Publicar fontes v2 na árvore VitePress | `npm run compass:publish` |
| Gerar o catálogo determinístico | `npm run compass:catalog` |
| Executar contratos do motor e do Admin | `npm run compass:test` |
| Renderizar PDF no runtime isolado | `npm run compass:pdf:runtime -- <comando>` |
| Executar a integração PDF | `npm run compass:test:pdf` |
| Executar publicação, catálogo e build do Hub | `npm run docs:build` |

## PDF e Qualidade

O renderizador `render-pdf.mjs` usa Playwright e Chromium em container efêmero fixado por digest. O host não recebe bibliotecas do navegador. O gate `quality-gates.mjs` verifica paridade de conteúdo, marcas obrigatórias, PDF.js, acessibilidade, contraste, screenshots, quantidade de páginas, tamanho máximo de 4 MB e checksums.

O gerador FPDF permanece como fallback temporário para as edições ainda não migradas. Ele não é a fonte do PDF da edição 008.

## Backend e Downloads

O catálogo administrativo e o ciclo de release são extensões do Worker `csv-documents`. Cada edição referencia um documento PDF existente; cada release referencia uma versão imutável desse documento. Os bytes permanecem no R2 privado existente e os downloads reutilizam `document_public_links` e `/s/{slug}`.

A preparação de release não altera o ponteiro público. A ativação move de forma atômica o release ativo e a versão documental corrente, com precondição, idempotência, auditoria e histórico append-only. O rollback reativa um release anterior pelo mesmo mecanismo.

A migration D1 `0021_create_compass_catalog.sql` e as rotas `/v1/compass/*` estão preparadas e testadas em código. Não aplicar migration, publicar o Worker ou habilitar mutações no Admin sem autorização explícita e execução do workflow protegido.

## Admin e Sistemas Relacionados

A aba Compass™ do Admin do Hub oferece consulta de edições, releases, checksums e links públicos usando exclusivamente a sessão humana existente. Credenciais de serviço não são enviadas ao navegador. Operações de publicação permanecem indisponíveis até o release autorizado do backend.

O workflow pós-deploy já sincroniza PDFs de até 4 MB para o repositório de conhecimento e dispara a reindexação. Open Pages não integra o fluxo de documentos Compass™. A Queue e a DLQ do `csv-documents` permanecem dedicadas ao processamento documental existente. O n8n não participa do caminho crítico e não foi alterado.

## Documentação Editorial e Técnica

| Documento | Escopo |
|---|---|
| [Padrão Editorial](policies/padrao-editorial.md) | Princípios, linguagem e checklist editorial |
| [Guia Operacional](skills/gerar-compass.md) | Produção e publicação de edições |
| [Template de Edição](templates/compass_template.md) | Estrutura editorial de referência |
| [Ficha `_infra`](../docs/_infra/ferramentas/compass.md) | Arquitetura, backend, Admin, release e rollback |
| [PRD da Transição](../docs/_infra/projetos/compass-v2/prd.md) | Milestones M0–M10 e critérios de aceite |

## Nota de Escopo

Cada edição do Compass™ é um documento técnico-estratégico destinado à educação continuada e ao apoio à tomada de decisão. Temas jurídicos, regulatórios ou contratuais exigem avaliação complementar por profissional habilitado.

**Grupo CSV — Cuidados em Saúde com Valor**
