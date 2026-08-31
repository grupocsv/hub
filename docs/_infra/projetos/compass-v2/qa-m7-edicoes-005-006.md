# QA do Marco M7 — Migração das Edições 005 e 006

**Escopo:** migração conjunta das edições 005/2026 e 006/2026 para o Compass™ v2

**Estado:** aprovado localmente, sem publicação

**Data:** 31 de agosto de 2026

> **Hierarquia canônica:** Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®.

As edições 005 e 006 foram migradas do formato legado para o schema v2 e para o componente global `CompassEdition`, em modo `flow`. Cada edição passou a ter fonte semântica em componente Vue, invólucro VitePress, CSS namespaceado, metadados v2 e manifesto de release. Os PDFs A4 foram regenerados pelo runtime Playwright/Chromium isolado. As URLs históricas foram preservadas. Nenhuma migration remota, binding, Worker, gateway, RLS, Queue, n8n ou produção foi alterado.

## 1. Critérios do Marco M7

| Critério | Resultado | Evidência |
|---|---|---|
| M7.1 — Edições 005 e 006 migradas sem perda de conteúdo | Aprovado | Testes estruturais, hashes de proveniência, paridade web/PDF e inspeção visual integral. |
| M7.2 — Numeração cruzada e metadados divergentes corrigidos explicitamente | Aprovado | PDF histórico da 005 exibia `006/2026`; PDF histórico da 006 exibia `005/2026`. A divergência foi detectada pelo próprio PDF, registrada em `metadata.yml` e corrigida nos PDFs v2. |
| M7.3 — Web, PDF, links e downloads validados individualmente | Aprovado | Gates independentes das duas edições, URLs preservadas, links externos mantidos e destinos de download coerentes com os slugs canônicos. |

## 2. Preservação Editorial e Proveniência

O teste de integração valida a estrutura de cada fonte migrada. A edição 005 mantém nove seções, nove títulos de seção, 56 parágrafos, 11 itens de lista e 89 linhas de tabela. A edição 006 mantém seis seções, seis títulos de seção, 18 parágrafos, oito itens de lista e sete linhas de tabela.

| Controle | Edição 005 | Edição 006 |
|---|---|---|
| SHA-256 da fonte legada | `eb57e43cd3fb997884924032e84dcb6c6895f54fe7d68d73aef65e4f97a27615` | `19fd67a59cf44bc7b4d87e69d58f94aaef1906302a93d726cbe80aa33a6d18a1` |
| SHA-256 do PDF histórico | `a8fff1b3118ad34ebd32a6bb8f2200aa79d733c4c4f6bff3abceb058644e08da` | `81cb3495c751ebe9ff98f33d4a807f0f805568d6abd4f259cd7974ec9605264a` |
| Tamanho do PDF histórico | 483.057 bytes | 445.956 bytes |
| Páginas do PDF histórico | 12 | 4 |
| Rótulo exibido no PDF histórico | `006/2026` | `005/2026` |
| Rótulo canônico corrigido | `005/2026` | `006/2026` |
| SHA-256 do PDF v2 aprovado | `319b4940a76e8a2d4fdf8f4c5125c7fe887579ac2e0692bddebd209e95188845` | `5c40d6173e553b3ae00b6dfd2e7df8a1169e47cb44cf4a8ad7ade64fbed25d79` |
| Tamanho do PDF v2 aprovado | 529.546 bytes | 337.944 bytes |
| Páginas do PDF v2 aprovado | 18 | 6 |
| Limite operacional | 4.000.000 bytes | 4.000.000 bytes |

Os hashes e tamanhos dos PDFs históricos permanecem registrados em `migration.originalPdfSha256` e `migration.originalPdfBytes`. A correção cruzada permanece registrada em `migration.numberingCorrection`, incluindo o rótulo histórico efetivamente extraído do PDF e o rótulo canônico. Os artefatos v2 têm checksums próprios em `release.json`.

## 3. URLs, Links e Downloads

| Artefato | Edição 005 | Edição 006 |
|---|---|---|
| Página histórica preservada | `/compass/edicoes/2026/005/compass` | `/compass/edicoes/2026/006/compass` |
| PDF histórico preservado | `/compass/edicoes/2026/005/compass_005_2026.pdf` | `/compass/edicoes/2026/006/compass_006_2026.pdf` |
| Componente semântico | `Compass005Content.vue` | `Compass006Content.vue` |
| Manifesto | `release.json` | `release.json` |

Os `href` externos foram preservados. URLs longas que eram exibidas integralmente nas tabelas de referências passaram a usar o rótulo curto `Link`, sem alteração do destino. A navegação própria do Compass™ foi mantida; os pares automáticos `Anterior` e `Próximo` do VitePress foram desativados porque seguiam a ordem descendente da sidebar e contradiziam a sequência cronológica editorial.

## 4. Gates Automatizados

A suíte Compass™ concluiu 72 testes, com 72 aprovações e nenhuma falha. O build VitePress completo também concluiu com sucesso. Permaneceram apenas avisos preexistentes do Rollup sobre comentário `#__PURE__` e tamanho de chunk, sem relação causal com o lote M7.

| Gate Final | Edição 005 | Edição 006 |
|---|---:|---:|
| Paridade web/PDF | Aprovada | Aprovada |
| PDF | 529.546 bytes; 18 páginas | 337.944 bytes; 6 páginas |
| Bloqueios de acessibilidade | 0 | 0 |
| Grupos de verificações aprovados | 19 | 19 |
| Contraste do corpo no PDF | 15,97:1 | 15,97:1 |
| Contraste das tabelas no PDF | 15,97:1 | 15,97:1 |
| Contraste da nota de escopo | 9,81:1 | 9,81:1 |
| Viewport mobile | 375 px de documento para 375 px de viewport | 375 px de documento para 375 px de viewport |
| Overflow mobile | 0 px | 0 px |
| Larguras das colunas de referências | 288 px, 256 px e 80 px | 288 px, 256 px e 80 px |
| Mínimo exigido por coluna | 72 px | 72 px |

## 5. Revisão Visual Adversarial

A revisão foi executada por dois métodos independentes. O método determinístico verificou schema, contagens estruturais, hashes, numeração extraída dos PDFs históricos, paridade web/PDF, acessibilidade, contraste, largura documental e largura das colunas. O método visual inspecionou as capturas desktop, as capturas mobile em segmentos top-to-bottom e os PDFs página a página.

A revisão encontrou e corrigiu quatro problemas que os primeiros testes não cobriam. Primeiro, as URLs longas das referências prejudicavam a leitura; o texto visível passou a ser `Link`, com `href` intacto. Segundo, a navegação automática do VitePress mostrava relações cronológicas invertidas; o frontmatter passou a usar `prev: false` e `next: false`, conforme o contrato do VitePress instalado. Terceiro, a tabela de referências da edição 005 cabia na viewport, porém comprimia a primeira coluna a poucos pixels e quebrava o texto caractere por caractere. A tabela passou a usar área horizontal rolável, larguras mínimas úteis e um novo gate de legibilidade de 72 px. Quarto, o PDF 005 gerava uma página 19 quase vazia contendo apenas os créditos já presentes na capa. O rodapé redundante foi ocultado na mídia de impressão do modo `flow`, reduzindo o artefato para 18 páginas sem perda editorial.

A inspeção final aprovou capa, miolo, tabelas, referências, nota de escopo, download, navegação e créditos das duas edições. Não foram observados cortes, sobreposições, páginas vazias, perda textual ou overflow horizontal.

## 6. Regressão Cruzada

As mudanças do motor atingem todas as edições `flow`; por isso, as edições 007 e 008 foram auditadas novamente no mesmo build. A edição 007 manteve paridade, 12 páginas, 393.367 bytes, zero bloqueio de acessibilidade, zero overflow e colunas de referências de 288 px, 256 px e 80 px. Seu PDF foi regenerado após a remoção do rodapé redundante e passou a usar o SHA-256 `849c519049c533c933e1d686f2b2ed0960faf304b819181999ec625a31dd9a5a`.

A edição 008 permaneceu com 23 páginas, 1.179.294 bytes, zero bloqueio de acessibilidade, zero overflow mobile e contraste de 17,96:1 na contracapa, tanto em tela quanto no PDF. Seu PDF não foi regenerado porque a correção de rodapé é restrita ao modo `flow`.

## 7. Limites Operacionais

O lote M7 e as melhorias do motor estão apenas na branch local `feat/compass-v2-transicao`. Nenhum push, merge, deploy, upload ao R2, ativação no D1 ou mudança de produção foi realizado. A publicação permanece condicionada ao Marco M9 e à autorização explícita para ações potencialmente impactantes. O n8n não integra o caminho crítico do Compass™ e não foi modificado.
