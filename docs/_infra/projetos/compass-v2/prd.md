# Product Requirements Document — Compass™ v2

**Data:** agosto de 2026  
**Status:** aprovado para execução  
**Responsável:** Grupo CSV

## 1. Visão geral

O Compass™ v2 moderniza integralmente a linha editorial Compass, unificando publicação web responsiva e geração de PDF A4 a partir de uma única fonte semântica. A edição 008 será a referência visual e funcional do novo motor; as edições 001 a 007 serão migradas progressivamente, preservando conteúdo, URLs públicas, downloads e rastreabilidade.

> **Hierarquia canônica:** Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®.

A AxiaCare® permanece identificada nos pontos de elaboração e aplicação prática, pois o Compass é utilizado nas consultorias e assessorias da empresa e essa marca é reconhecida pelos leitores finais.

## 2. Objetivos

O projeto deve integrar integralmente a edição 008, substituir o gerador PDF baseado em desenho manual por um renderizador HTML/CSS determinístico, eliminar duplicações manuais do catálogo, preservar compatibilidade dos downloads históricos e elevar todas as edições anteriores ao novo padrão visual e editorial.

A execução também deve atualizar a Central Compass, o painel Admin, a página `_infra`, os workflows e os READMEs relacionados. Ao final, decisões, arquivos e resultados serão registrados no Vectorize e no Agent Context Bridge, e um e-mail técnico detalhado será enviado para `guilherme@grupocsv.com`.

## 3. Princípios invioláveis

| Princípio | Regra operacional |
|---|---|
| Fonte única | Conteúdo e metadados versionados no Git; web e PDF derivados da mesma fonte. |
| Segurança | Não ativar RLS nem executar mudança potencialmente impactante sem validação e autorização explícitas. |
| Compatibilidade | URLs e downloads históricos devem continuar funcionando durante e depois da migração. |
| Imutabilidade | Edições publicadas recebem versão e checksum; mudanças posteriores geram nova versão. |
| Qualidade | Cada marco exige testes automatizados, inspeção visual e critérios concluídos antes do próximo. |
| Identidade | Grupo CSV como marca principal; MedValor® como responsável editorial; AxiaCare® conforme o modelo 008. |
| Linguagem | Textos visíveis e documentação em Português do Brasil, com nomenclatura canônica. |
| Infraestrutura | Reutilizar `csv-documents`, D1, R2, Queue e autenticação existentes; não criar Worker redundante. |
| Automação | n8n permanece fora do caminho crítico e não será alterado sem necessidade técnica comprovada e autorização. |

## 4. Arquitetura-alvo

O repositório `grupocsv/hub` permanecerá como fonte editorial e de apresentação. Um catálogo gerado a partir dos metadados das edições alimentará a Central Compass, o Admin, a navegação e os workflows. O VitePress renderizará a experiência web responsiva. O Playwright/Chromium renderizará o mesmo HTML/CSS em PDF A4 com fundos, margens, paginação e fontes controlados.

O backend `grupocsv/backend`, por meio do `csv-documents` e do `csv-gateway`, será preparado para catalogar versões, checksums, status, links públicos e artefatos no R2. A publicação seguirá duas fases: primeiro o registro e upload em estado não público; depois a ativação atômica do release somente após a validação integral.

## 5. Modelo editorial v2

Cada edição terá metadados validados por schema, conteúdo semântico, assets versionados, artefatos gerados e manifesto de release. O contrato mínimo inclui: identificador, slug imutável, número, ano, título, subtítulo, temas, tags, status editorial, produto, responsabilidade editorial, elaboração, versão do motor, versão do template, fonte web, PDF, checksum, tamanho, contagem de páginas, data de publicação, versão ativa e estado de migração.

As edições 001–007 serão preservadas em snapshot antes da migração. A edição 008 ingressará como primeira edição nativa do v2.

## 6. Acompanhamento por Milestones

O estado operacional vive na tabela `public.prd_milestones` do projeto Supabase `csv-brain`. Nenhum Milestone pode avançar enquanto os critérios do anterior não estiverem integralmente concluídos. A tabela contém apenas dados técnicos não sensíveis. A condição preexistente de RLS desabilitado foi registrada e não será modificada automaticamente.

### M0 — Governança, baseline e rastreabilidade

| ID | Critério de aceite |
|---|---|
| M0.1 | PRD operacional e arquivo `comentarios-do-usuario.md` versionados. |
| M0.2 | Milestones registrados no Supabase e M0 marcado como `in_progress`. |
| M0.3 | Branch de implementação criada a partir de `main` limpa e atualizada. |
| M0.4 | Checksums, tamanhos, URLs e renders das edições 001–008 congelados. |
| M0.5 | Notificação inicial enviada e atividade registrada no ACB. |

### M1 — Contratos e testes antes do motor

| ID | Critério de aceite |
|---|---|
| M1.1 | Schema v2 e adaptador legado definidos por testes. |
| M1.2 | Catálogo derivado, regras de slugs e validação de marcas cobertos por testes. |
| M1.3 | Testes inicialmente falham contra a ausência do motor e depois passam com a implementação. |
| M1.4 | Fixtures das edições 001, 007 e 008 criadas sem alterar os originais. |

### M2 — Núcleo web do Compass™ v2

| ID | Critério de aceite |
|---|---|
| M2.1 | Componentes editoriais reutilizáveis implementados. |
| M2.2 | Estilos web responsivos e estilos de impressão separados por media query. |
| M2.3 | Catálogo, sidebar e Central Compass gerados automaticamente. |
| M2.4 | Navegação, links e acessibilidade validados em desktop e mobile. |

### M3 — Motor PDF e controles de qualidade

| ID | Critério de aceite |
|---|---|
| M3.1 | CLI de PDF determinístico implementada com Playwright/Chromium. |
| M3.2 | Paridade de conteúdo web/PDF validada automaticamente. |
| M3.3 | Regressão visual, overflow, páginas vazias, órfãs e links quebrados cobertos. |
| M3.4 | Gerador FPDF v1 preservado somente como fallback durante a transição. |

### M4 — Edição 008 integral

| ID | Critério de aceite |
|---|---|
| M4.1 | Conteúdo completo do HTML/PDF recebido integrado sem perda editorial. |
| M4.2 | Hierarquia Grupo CSV/MedValor®/AxiaCare® aplicada em todas as superfícies. |
| M4.3 | Versão web responsiva aprovada em desktop, tablet e mobile. |
| M4.4 | PDF v2 comparado ao documento de referência página a página. |
| M4.5 | Central Compass e downloads preparados para a edição 008. |

### M5 — Backend, downloads, Admin e documentação

| ID | Critério de aceite |
|---|---|
| M5.1 | Migrations e endpoints de catálogo/versionamento preparados no backend sem ativação não autorizada. |
| M5.2 | Integração D1/R2/Queue e release em duas fases testada em ambiente controlado. |
| M5.3 | Aba Compass no Admin com catálogo, status, versões, checksums e downloads. |
| M5.4 | `_infra`, Central Compass, workflows e READMEs atualizados. |
| M5.5 | Autenticação e autorização administrativa testadas, inclusive cenários negativos. |

### M6 — Migração da edição 007

| ID | Critério de aceite |
|---|---|
| M6.1 | Edição 007 migrada para o schema e os componentes v2. |
| M6.2 | Web e PDF validados contra o conteúdo original. |
| M6.3 | URL e download históricos preservados. |
| M6.4 | Aprendizados incorporados ao migrador antes do lote seguinte. |

### M7 — Migração das edições 005 e 006

| ID | Critério de aceite |
|---|---|
| M7.1 | Edições 005 e 006 migradas sem perda de conteúdo. |
| M7.2 | Numeração cruzada e metadados divergentes corrigidos de forma explícita. |
| M7.3 | Web, PDF, links e downloads validados individualmente. |

### M8 — Migração das edições 001 a 004

| ID | Critério de aceite |
|---|---|
| M8.1 | Edições 001–004 migradas para o novo padrão. |
| M8.2 | Todos os slugs e downloads históricos preservados. |
| M8.3 | Catálogo completo 001–008 gerado sem duplicações manuais. |

### M9 — Revisão dupla e release controlado

| ID | Critério de aceite |
|---|---|
| M9.1 | Revisão determinística de contratos, paridade e integridade aprovada. |
| M9.2 | Revisão visual independente em web e PDF aprovada. |
| M9.3 | Rollback ensaiado sem alteração das URLs públicas. |
| M9.4 | Mudanças impactantes autorizadas antes de ativação. |
| M9.5 | Produção, downloads e AI Search validados após o deploy. |

### M10 — Encerramento e memória operacional

| ID | Critério de aceite |
|---|---|
| M10.1 | Vectorize atualizado com arquitetura, decisões e operação do Compass™ v2. |
| M10.2 | ACB atualizado com atividades, decisões, arquivos, PRs, commits e resultados. |
| M10.3 | E-mail técnico final enviado para `guilherme@grupocsv.com`. |
| M10.4 | Notificação final do tracker enviada e recursos temporários de gestão documentados. |
| M10.5 | Relatório final entregue com evidências e pendências explícitas. |

## 7. Estratégia de publicação e rollback

O release deve ser construído de forma idempotente. Os artefatos recebem checksums antes do upload. O backend prepara a nova versão sem alterar o ponteiro público; a ativação ocorre somente depois que web, PDF, links, autenticação e catálogo forem aprovados. O rollback reverte o ponteiro para a versão anterior sem remover artefatos nem alterar slugs.

Nenhuma migration, binding, rota, fila, bucket, política de acesso ou mudança de produção será aplicada sem validação técnica e autorização explícita quando houver possibilidade de impacto no ecossistema.

## 8. Comunicação

O acompanhamento por Milestones enviará notificações de início, conclusão e bloqueio para `guilherme@grupocsv.com`. O e-mail técnico final detalhará arquitetura, arquivos, banco, Workers, Admin, `_infra`, downloads, testes, migrações, PRs, commits, rollback e operação futura.

## 9. Referências

[1]: https://hub.grupocsv.com/compass/ "Central Compass™"
[2]: https://github.com/grupocsv/hub "Repositório do Hub CSV"
[3]: https://developers.cloudflare.com/d1/platform/limits/ "Cloudflare D1 — Limits"
[4]: https://developers.cloudflare.com/r2/platform/limits/ "Cloudflare R2 — Limits"
