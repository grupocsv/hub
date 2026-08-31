# QA do Marco M6 — Migração da edição 007

**Escopo:** migração piloto da edição 007/2026 para o Compass™ v2

**Estado:** aprovado localmente, sem publicação

**Data:** 31 de agosto de 2026

> **Hierarquia canônica:** Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®.

A edição 007 foi migrada do formato legado para o schema v2 e para o componente global `CompassEdition`, em modo `flow`. A fonte semântica passou a ser `Compass007Content.vue`, enquanto `compass.md` funciona como invólucro VitePress. O PDF A4 foi regenerado pelo runtime Playwright/Chromium isolado. Nenhuma URL histórica, migration remota, binding, Worker, gateway, RLS, Queue, n8n ou ambiente de produção foi alterado.

## 1. Critérios do Marco M6

| Critério | Resultado | Evidência |
|---|---|---|
| M6.1 — schema e componentes v2 | Aprovado | `schemaVersion: 2`, `mode: flow`, componente `Compass007Content.vue` e CSS específico namespaceado. |
| M6.2 — web e PDF contra o original | Aprovado | Testes estruturais, hashes de proveniência, paridade textual, inspeção desktop/mobile e PDF página a página. |
| M6.3 — URL e download históricos | Aprovado | `/compass/edicoes/2026/007/compass` e `/compass/edicoes/2026/007/compass_007_2026.pdf` foram preservados. |
| M6.4 — aprendizados no migrador | Aprovado | O migrador agora incorpora isolamento CSS, acessibilidade, overflow mobile, contraste de impressão e paginação de tabelas. |

## 2. Preservação editorial e proveniência

O teste de integração valida a presença de oito seções, oito títulos de seção, 30 parágrafos, cinco itens de lista, 44 referências e 44 links externos. O conteúdo migrado mantém o título, a data, as tags, o resumo, a navegação histórica e a nota de escopo da edição original.

| Controle | Valor verificado |
|---|---|
| SHA-256 da fonte legada | `a2764829806b0c673b2e9bae3674153c50fd9b8f74230ae0ca21746216c6602f` |
| SHA-256 do PDF legado | `ed5b7b5e90d39e60c744c72188617c94234460f376af991f360718221b5ec90d` |
| Tamanho do PDF legado | 471.124 bytes |
| SHA-256 do PDF v2 aprovado | `d6237b86540aae0c702550534bd3597b6b4991e188228aa4e46c9684876fa6c4` |
| Tamanho do PDF v2 aprovado | 394.457 bytes |
| Páginas do PDF v2 aprovado | 12 |
| Limite operacional | 4.000.000 bytes |

O SHA-256 e o tamanho do PDF legado permanecem registrados nos metadados de migração. O PDF v2 tem checksum próprio no manifesto `release.json`; portanto, a rastreabilidade do artefato histórico não depende de inferência ou memória externa.

## 3. Gates automatizados

A suíte Compass™ concluiu 64 testes, com 64 aprovações e nenhuma falha. O build VitePress completo também concluiu com sucesso. Permaneceram apenas os avisos preexistentes de comentário `#__PURE__` e tamanho de chunk do Rollup, sem relação causal com a edição 007.

| Gate final da edição 007 | Resultado |
|---|---|
| Paridade entre web e PDF | Aprovada; nenhum texto obrigatório ausente |
| PDF | 394.457 bytes; 12 páginas; nenhuma violação |
| Acessibilidade | 19 grupos de verificações aprovados; nenhuma violação; nenhum bloqueio |
| Contraste do corpo no PDF | 15,97:1 |
| Contraste das tabelas no PDF | 15,97:1 |
| Contraste da nota de escopo | 9,81:1 |
| Viewport mobile | 375 px de documento para 375 px de viewport; overflow de 0 px |
| Catálogo e publicação derivada | Idempotentes e sem deriva após regeneração |

## 4. Revisão visual adversarial

A revisão visual foi executada por dois métodos independentes: capturas integrais do navegador em desktop e mobile, com a imagem mobile inspecionada em segmentos; e inspeção do PDF A4 página a página, posteriormente confirmada por rasterização independente com Poppler quando houve dúvida sobre o primeiro leitor.

Durante a revisão, foram encontrados e corrigidos problemas reais que os primeiros testes não capturavam. O título longo da capa ultrapassava a área interna em aproximadamente 26 px; a tabela de referências ampliava o documento mobile em 67 px; os links primários e o crédito principal tinham contraste inadequado no tema escuro; e um atributo ARIA proibido era aplicado ao contêiner da marca. Foram adicionadas regressões específicas para cada caso.

No PDF, estilos globais das edições legadas contaminavam as seções v2 porque seletores não namespaceados eram agregados pelo VitePress. Isso produzia fundo escuro com texto escuro, linhas alternadas ilegíveis nas tabelas e nota de escopo com baixo contraste. O migrador passou a neutralizar esses estilos no modo `flow` e a definir superfícies de impressão explícitas. A tabela comparativa também passou a quebrar apenas entre linhas, aproveitando a página 3 e reduzindo o documento de 13 para 12 páginas sem perda de conteúdo.

A inspeção final aprovou a capa, o conteúdo completo, as tabelas, as referências de `[1]` a `[44]`, a nota de escopo, os créditos editoriais, o download e a navegação histórica. Não foram observados cortes, sobreposições, páginas vazias, perda textual ou overflow horizontal.

## 5. Aprendizados incorporados ao motor

O piloto demonstrou que a coexistência temporária entre edições v1 e v2 exige isolamento explícito contra CSS global legado. O migrador `import-legacy.mjs` agora gera resets namespaceados para seções `flow`, superfícies claras de impressão para tabelas e nota de escopo, regras de paginação por linha e dimensões mobile que evitam compressão ou overflow. O gate de qualidade passou a medir overflow documental, contraste do corpo, contraste das tabelas e contraste da nota de escopo, além das verificações já existentes de contracapa.

Essas proteções serão reutilizadas nos lotes 005/006 e 001–004. O comportamento do n8n permanece fora do caminho crítico do Compass™ e não foi modificado.

## 6. Limites operacionais

A edição 007 e as melhorias do motor estão apenas na branch local `feat/compass-v2-transicao`. Nenhum push, merge, deploy, upload ao R2, ativação no D1 ou mudança de produção foi realizado. A publicação continuará condicionada ao Marco M9 e à autorização explícita para ações potencialmente impactantes.

## 7. Regressão cruzada da edição 008

A ampliação do gate de overflow foi aplicada também à edição 008, pois o piloto 007 alterou regras globais do tema. Essa revisão encontrou um problema preexistente que o gate anterior não media: uma tabela da edição paginada ampliava o documento mobile de 375 para 1.661 px, totalizando 1.286 px de overflow horizontal.

Foi adicionada uma regressão automatizada e uma regra global específica para tabelas de edições `paged`, mantendo o conteúdo largo dentro de uma área rolável sem ampliar o documento. Após a correção, as edições 007 e 008 foram auditadas novamente no mesmo build.

| Edição | PDF | Páginas | Bloqueios de acessibilidade | Overflow mobile | Resultado |
|---|---:|---:|---:|---:|---|
| 007 | 394.457 bytes | 12 | 0 | 0 px | Aprovada |
| 008 | 1.179.294 bytes | 23 | 0 | 0 px | Aprovada |

A edição 008 manteve a paridade textual e os contrastes de 17,96:1 na contracapa, tanto em tela quanto no PDF. Seu artefato PDF não foi regenerado, pois a correção está restrita ao comportamento web em viewport de até 768 px.
