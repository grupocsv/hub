# QA do Marco M8 | Edições 001–004 do Compass™

**Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®**

**Estado:** Aprovado localmente para preparação do Marco M9. Nenhuma alteração foi publicada em produção.

## Escopo Validado

O Marco M8 migrou as edições 001–004 para o schema, os componentes e o renderizador do Compass™ v2. A fonte canônica permanece em `compass/edicoes/2026/<número>/`; a publicação em `docs/compass/` é derivada. Os caminhos web e PDF históricos foram mantidos sem alteração.

| Critério do PRD | Evidência | Resultado |
|---|---|---|
| M8.1 — Edições 001–004 no novo padrão | `schemaVersion: 2`, componentes Vue, CSS namespaceado, PDF e `release.json` em cada edição | Aprovado |
| M8.2 — Slugs e downloads históricos preservados | Rotas `/compass/edicoes/2026/<número>/compass` e `compass_<número>_2026.pdf`; hashes dos PDFs originais registrados em `migration.originalPdfSha256` | Aprovado |
| M8.3 — Catálogo 001–008 sem duplicação manual | `docs/compass/catalog.json` com `total: 8` e slugs `008, 007, 006, 005, 004, 003, 002, 001` | Aprovado |

## Preservação e Proveniência

| Edição | Estado | PDF Histórico | Bytes Históricos | PDF v2 | Páginas v2 | Bytes v2 |
|---|---|---|---:|---|---:|---:|
| 001/2026 | `adapted-legacy` | `499602c385e8b1ecb6c578fb14c35bdc13eb782a2bdf2c144da97a3dd2ad49c9` | 465.461 | `324e6363d24a92fbe04837996bac05179126ed878a14f092373ac203f166f120` | 11 | 379.631 |
| 002/2026 | `adapted-legacy` | `69fcd62e2decfdea10123a9cc0a9c3b77b1de5b6306f46eaa88e4de37c84c52c` | 476.815 | `199d8272482e025461f2d8d0ec129840ad05526165212985b6be99057b35e1a0` | 15 | 490.063 |
| 003/2026 | `adapted-legacy` | `7a9ea11beb371dcbcfc4201bc8594c25ca99750fd08d30b1a6d744c3b0e78b42` | 1.412.287 | `9f52d20ddaf220f8eefdb220349719431e090c809986f842fe3bca6e40e03cbd` | 18 | 1.361.584 |
| 004/2026 | `adapted-legacy` | `d2c53ce09aa8b265a93f2310af5addaa20066afe45bebfdcd2901f798828d7ed` | 504.599 | `9f921579fb7ce32131559ca8b8f0420201a26adcd95ebab2dd8b16ecacf980a9` | 24 | 648.960 |

Os hashes históricos pertencem aos PDFs congelados antes da transformação. Os PDFs v2 foram renderizados a partir das páginas locais validadas e possuem manifestos próprios. Não houve substituição silenciosa do artefato de origem.

## Aprendizados Incorporados ao Motor

A edição 001 exigiu suporte determinístico a uma fonte predominantemente Markdown. O migrador passou a converter títulos, parágrafos, listas, tabelas e blocos técnicos sem parser ad hoc de conteúdo. Blocos roláveis receberam foco por teclado para eliminar a violação `scrollable-region-focusable`.

A edição 003 revelou que o extrator anterior não preservava `div` aninhadas. A leitura foi substituída por um parser balanceado de blocos, mantendo as três figuras históricas. Na web, cada figura pode ser aberta em tamanho original por um link acessível; a indicação interativa é removida no PDF.

As referências indexadas de duas colunas das edições 002–004 receberam classe semântica própria. No mobile, a coluna numérica permanece compacta e o conteúdo bibliográfico recebe largura útil em área rolável. O gate de qualidade agora reprova tanto compressão excessiva quanto distribuição incorreta das colunas. Títulos longos também deixaram de usar quebra arbitrária de palavras.

## Gates Automatizados

| Gate | Resultado Verificado |
|---|---|
| Suíte Compass™ | 78 testes aprovados; 0 falhas |
| Catálogo | 8 edições; ordenação decrescente e slugs únicos |
| Build VitePress | Aprovado; warnings preexistentes de chunks e anotação `#__PURE__`, não bloqueantes |
| Paridade web/PDF | Sem textos obrigatórios ausentes nas quatro edições |
| Limite PDF | Todos os PDFs abaixo de 4.000.000 bytes |
| Acessibilidade | 0 violações bloqueantes nas edições 001–004 |
| Overflow mobile | 0 px nas quatro edições |
| Legibilidade de tabelas | 0 ofensores nas quatro edições |
| Contraste do corpo e tabelas no PDF | 15,97:1 nas quatro edições |
| Contraste da nota de escopo | 9,81:1 nas edições com o elemento |

## Revisão Visual

A revisão web cobriu desktop e mobile. A edição 001 foi inspecionada em seis segmentos mobile; as edições 002–004 foram inspecionadas integralmente em 28 segmentos e tiveram os achados críticos confirmados manualmente. As correções de título, referências e figuras foram reavaliadas nas capturas reconstruídas.

Os quatro PDFs foram revisados página a página, totalizando **68 páginas**. O total foi confirmado por duas operações independentes: `11 + 15 + 18 + 24 = 68` e soma tabular das quatro contagens. Não foram encontrados cortes, sobreposição, páginas vazias, fundos escuros indevidos, tabelas truncadas ou folhas residuais.

As páginas finais das edições 002 e 004 contêm conteúdo: nota de escopo na 002; referências 45–46 e nota de escopo na 004. A subutilização parcial foi aceita porque as linhas das tabelas permanecem indivisíveis entre páginas. Compactação adicional reduziria a legibilidade e elevaria o risco de fragmentação de células.

A edição 003 conserva descrições incorporadas aos PNGs históricos e um `figcaption` editorial. Extração independente por Poppler confirmou uma única ocorrência de cada legenda na camada textual; não há duplicação produzida pelo motor v2.

## Documentação e Operação

O README canônico, a ficha `_infra`, o README raiz, o template de metadados, o template de edição e o guia operacional foram atualizados para o acervo 001–008 no motor v2. O gerador FPDF v1 permanece congelado apenas para reprodutibilidade histórica e rollback documental; não integra o caminho ativo de novas edições.

O backend Compass™ permanece apenas em código local e commit próprio no `csv-documents`. A migration 0021 não foi aplicada. Não houve push, merge, deploy, upload remoto, mudança de binding, gateway, D1, R2, Queue, RLS, autenticação, link público ou ponteiro de release. O n8n permanece fora do caminho crítico e não foi alterado.

## Decisão do Marco

Os critérios M8.1–M8.3 estão atendidos. As edições 001–008 encontram-se no contrato Compass™ v2, com release controlado ainda pendente. O próximo passo é o Marco M9: revisão determinística cruzada do acervo completo, revisão visual independente, ensaio de rollback e preparação da autorização para mudanças de produção.
