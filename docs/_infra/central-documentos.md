---
title: Central de Documentos — Arquitetura e Operação
description: Arquitetura, tenancy, segurança, ciclo documental e integrações da Central de Documentos do Hub Grupo CSV.
---

# Central de Documentos

**Atualizada em 16 de setembro de 2026.** Esta versão do Hub habilita a busca nas cinco Centrais após a validação produtiva pela API da Central e pelo Extensio. A sessão humana no navegador permanece não aferida.

A Central de Documentos é a aplicação privada e multi-tenant do Hub Grupo CSV para catálogo, upload, versionamento, visualização e gestão de documentos. Existe uma única implementação compartilhada. O portal informado na entrada seleciona o tenant autorizado; ele não cria uma cópia independente da aplicação.

Para instruções de uso, consulte o [manual ilustrado da Central](/_infra/manuais/central-documentos) e o [manual do Panta v2](/_infra/manuais/panta-v2). Esta página mantém o contrato técnico e o estado operacional.

Esta página distingue a operação documental já existente da ativação da nova busca:

| Estado | Significado |
|---|---|
| Produção verificada | Componente publicado e confirmado na verificação de 24/08/2026 |
| Serviço v2 publicado | Runtime isolado confirmado em 16/09/2026; sua saúde é distinta dos testes integrados abaixo |
| Implementado no código | Contrato presente nas fontes canônicas, mas sem afirmação de promoção produtiva |
| Integração validada por API/MCP | Canários produtivos de busca, isolamento, política, versão, exclusão e reconstrução de documento aprovados em 16/09/2026 |
| Interface desta versão | Busca habilitada após validação produtiva da API; controles testados localmente, sessão humana produtiva não aferida |

## Acesso e tenants

A rota compartilhada é `https://hub.grupocsv.com/documentos/?portal={portal}`. O parâmetro `portal` é validado contra o registro publicado; tenant e permissões são novamente derivados no backend.

| Portal | Identificador | Entrada |
|---|---|---|
| Grupo CSV | `grupo-csv` | [Abrir Central corporativa](https://hub.grupocsv.com/documentos/?portal=grupo-csv) |
| Unimed Governador Valadares | `unimed` | [Abrir Central da Unimed](https://hub.grupocsv.com/documentos/?portal=unimed) |
| Unihealth | `unihealth` | [Abrir Central da Unihealth](https://hub.grupocsv.com/documentos/?portal=unihealth) |
| ICDS | `icds` | [Abrir Central do ICDS](https://hub.grupocsv.com/documentos/?portal=icds) |
| 2iM | `2im` | [Abrir Central da 2iM](https://hub.grupocsv.com/documentos/?portal=2im) |

Esta versão do frontend habilita os cinco identificadores acima, com upload, visualizador, favoritos e busca. A configuração efetivamente servida deve ser conferida no runtime público ao verificar a publicação.

## Inventário canônico

| Camada | Recurso | Função | Estado |
|---|---|---|---|
| Frontend | `/documentos/` no `grupocsv/hub` | Catálogo, filtros, upload, visualizador, favoritos e gestão permitida ao papel | Produção verificada |
| Identidade | `csv-auth` por Service Binding | Valida sessão humana; não armazena papéis documentais | Produção verificada |
| Control plane | Worker `csv-documents` | Autoriza e executa operações documentais | Produção verificada |
| API | `https://documentos-api.grupocsv.com` | Fronteira HTTP autenticada; `/health` é a exceção pública | Produção verificada |
| Estado | D1 `csv-documents` | Tenants, papéis, ACL, documentos, versões, jobs, auditoria, idempotência e outbox | Produção verificada |
| Arquivos | R2 privado `csv-documents-private` | Originais e derivados sem URL pública ou exposição de object key | Produção verificada |
| Transporte | Queue `csv-documents-jobs` | Entrega assíncrona de jobs opacos ao consumer | Produção verificada |
| Contingência | DLQ `csv-documents-jobs-dlq` | Retém falhas esgotadas para recuperação auditada | Produção verificada |
| Processamento | `documentos-processor.grupocsv.com` | Validação, detecção de MIME, checksum, antivírus, extração e derivados | Produção verificada |
| Monitoramento | Worker `csv-documents-monitor` | Avalia Worker, Queue, DLQ, D1, processador e ClamAV; não possui rota pública | Implementado no código e operado por agenda própria |
| Busca documental | Panta v2 em `panta-v2.grupocsv.com` | Índice tenant-aware derivado, sem autoridade de acesso | API/MCP validados em produção; interface habilitada nesta versão |
| Links públicos nativos | Control plane documental | Compartilhamento explícito de uma versão por slug, com ativação e revogação | Produção verificada |
| Operação por agentes | Extensio MCP + credencial de serviço | Publicar, consultar, pesquisar e gerenciar dentro do tenant e dos escopos concedidos | Operações documentais verificadas; busca Panta v2 validada em 16/09/2026 |

O Worker possui cron de reconciliação. Queue, DLQ, processador e Panta transportam ou derivam dados, mas não autorizam acesso nem decidem qual versão é vigente. O D1 documental permanece a fonte de verdade do domínio.

## Fluxo de upload e publicação

1. A sessão humana ou credencial de serviço é autenticada.
2. O Worker deriva tenant, papel ou escopos no servidor.
3. A API cria documento, versão e sessão curta de upload de modo idempotente.
4. Os bytes são enviados por stream ao R2 privado; nome original não vira chave pública.
5. A conclusão cria o job canônico e publica somente IDs opacos na Queue.
6. O processador recupera o original por fronteira interna, recalcula checksum, detecta MIME, valida estrutura e consulta o ClamAV.
7. Apenas conteúdo `clean` pode gerar derivados ou tornar-se elegível à publicação.
8. O Worker aplica callbacks monotônicos, promove a versão autorizada e registra auditoria.

Scanner indisponível falha fechado. Falha de preview ou busca não torna o arquivo original público e não amplia autorização.

## Autorização

### Pessoas

O `csv-auth` confirma identidade, tenant e validade da sessão. Papéis e ACL documentais pertencem ao D1 `csv-documents`. Os papéis documentais são `viewer`, `contributor`, `manager`, `tenant_admin` e `super_admin`.

### Agentes e automações

Agentes usam credenciais de serviço próprias. Nunca reutilizam cookie, sessão ou token humano. O token é armazenado somente como hash e vinculado a tenants, validade, status e escopos explícitos:

| Escopo | Capacidades |
|---|---|
| `documents:read` | Consultar catálogo, documento, versão e estado autorizado |
| `documents:write` | Criar documento, nova versão e atualizar metadados permitidos |
| `documents:publish` | Promover versão elegível |
| `documents:manage` | Arquivar, restaurar, solicitar exclusão, gerenciar links públicos e executar gestões autorizadas |
| `documents:admin` | Revisar pedidos de exclusão lógica dentro dos tenants concedidos |

Credencial associada a mais de um tenant precisa informar `X-Tenant-Id`; o backend rejeita tenant fora da allowlist. Mutações idempotentes devem repetir a mesma `Idempotency-Key` durante retry.

## API, OpenAPI e MCP

A fonte canônica atual do contrato HTTP é `workers/csv-documents/openapi/document-api.json`, no repositório `grupocsv/backend`. Ela descreve catálogo, documentos, versões, upload, viewer, coleções, tags, favoritos, busca e recuperação de jobs.

Estado de entrega:

| Interface | Estado |
|---|---|
| API `/v1/*` | Operações documentais verificadas; busca Panta v2 validada em produção em 16/09/2026. Autenticação e autorização exigidas por operação |
| OpenAPI versionada no repositório | Publicada e validada em produção |
| `GET /docs/openapi.json` | Produção verificada em `documentos-api.grupocsv.com` |
| CLI documental | Versionado em `workers/csv-documents/scripts/documents-cli.mjs`; usa token de serviço, tenant explícito e a API publicada |
| SDK documental dedicado | Não incluído; integrações usam o MCP do Extensio, o CLI ou a API descrita pelo OpenAPI |
| Ferramentas MCP do Extensio | Publicadas com Service Binding `DOCUMENTS`, secret próprio e credencial revogável para os cinco tenants |

Ferramentas MCP definidas nesta entrega:

| Tool | Finalidade |
|---|---|
| `documents_list` | Listar documentos autorizados do tenant |
| `documents_get` | Consultar metadados e estados de um documento |
| `documents_publish` | Criar documento ou publicar nova versão, enviar bytes privados e iniciar processamento com idempotência |
| `documents_status` | Consultar o estado de um job assíncrono |
| `documents_download` | Recuperar até 8 MiB autorizados em Base64; arquivos maiores são percorridos em blocos com Range, sem expor bucket ou object key |
| `documents_search` | Buscar pela API da Central no escopo autorizado; canário integrado Panta v2 aprovado nos cinco tenants em 16/09/2026 |
| `documents_manage` | Atualizar, listar ou promover versões, arquivar, restaurar ou solicitar exclusão lógica |
| `documents_public_links` | Listar, criar, ativar e inativar links públicos mediados pela API |
| `documents_deletion_requests` | Listar, aprovar, rejeitar ou cancelar solicitações de exclusão lógica |

O Extensio chama a Central por Service Binding `DOCUMENTS` e mantém o token documental somente como secret do Worker. Toda tool exige `tenant_id`, que a API revalida contra a credencial de serviço. As rotas MCP continuam protegidas pela autenticação própria do Extensio.

O transporte MCP limita cada publicação e cada resposta de download a 8 MiB para manter o uso de memória previsível durante a serialização Base64. A API documental continua sendo a interface para publicações maiores; downloads por MCP usam intervalos `Range` sucessivos.

O CLI aceita listagem, consulta, busca, status, promoção de versão, archive/restore, solicitação e decisão de exclusão, links públicos e download para arquivo. Ele lê `DOCUMENTS_API_URL`, `DOCUMENTS_API_TOKEN` e `DOCUMENTS_TENANT_ID` do ambiente; mutações exigem chave idempotente. Criação e upload de bytes são feitos pelo MCP ou diretamente pela API, não pelo CLI atual.

Uma integração só está pronta quando o contrato publicado, a credencial revogável, o tenant, os escopos, a idempotência e um canário real estiverem validados. Em 24/08/2026, o canário produtivo autorizou os cinco tenants, rejeitou acesso cruzado e tenant inexistente, confirmou bytes de upload e download, link público, `HEAD`, `GET`, `Range`, revogação e exclusão lógica. As nove ferramentas `documents_*` foram descobertas no MCP publicado, e `documents_list` respondeu 200 por meio do Extensio nos cinco tenants. A mera existência do schema ou da ferramenta não comprova acesso produtivo.

### Extensão Compass™ — Estado Separado

As rotas `/v1/compass/*` estão implementadas no `csv-documents`. Elas reutilizam `documents`, `document_versions` e `document_public_links`; não criam bytes duplicados nem expõem chaves do R2. A migration `0021_create_compass_catalog.sql` já está aplicada no D1, conforme verificação de 16/09/2026. A aplicação do schema não comprova, por si só, cada fluxo editorial ou publicação Compass.

| Operação | Contrato Implementado | Verificação nesta rodada Panta |
|---|---|---|
| Listar ou registrar edições | `GET/POST /v1/compass/editions` | Fluxo não revalidado nesta rodada |
| Consultar edição | `GET /v1/compass/editions/{editionId}` | Fluxo não revalidado nesta rodada |
| Listar ou preparar releases | `GET/POST /v1/compass/editions/{editionId}/releases` | Fluxo não revalidado nesta rodada |
| Ativar ou restaurar release | `POST /v1/compass/editions/{editionId}/releases/{releaseId}/activate` | Fluxo não revalidado nesta rodada |
| Servir o PDF | `GET/HEAD /s/{slug}` | Entrega documental existente; vínculo de cada release não revalidado nesta rodada |

A consolidação Panta não modifica o fluxo editorial Compass, não republica suas edições e não usa a aplicação da migration como aceite de operações não testadas. A documentação específica do Compass continua sendo a referência desse produto.

## Ciclo Documental e Exclusão

O passo a passo para solicitar, aprovar, rejeitar ou cancelar está no [manual — Arquivar ou excluir](/_infra/manuais/central-documentos#exclusoes).

| Estado | Significado | Ações usuais |
|---|---|---|
| `draft` | Documento ainda não publicado | editar metadados, carregar ou processar versão |
| `active` | Documento disponível conforme RBAC e ACL | ler, versionar, arquivar ou solicitar exclusão |
| `archived` | Documento retirado do catálogo normal | restaurar ou solicitar exclusão |
| `deletion_requested` | Exclusão lógica solicitada e auditada | aguardar decisão administrativa |
| `deleting` | Remoção definitiva em processamento, quando política futura a habilitar | operação interna controlada |
| `deleted` | Estado terminal de remoção | nenhuma restauração implícita |

No contrato produtivo verificado, hard delete permanece desabilitado. A interface confirma o pedido de exclusão; ela não confirma destruição física dos bytes. Arquivamento e restauração são operações próprias e não equivalem a exclusão.

O backend produtivo oferece decisão administrativa de exclusão lógica pelos contratos abaixo:

| Operação | Contrato incluído nesta entrega | Autorização |
|---|---|---|
| Listar pedidos do tenant | `GET /v1/deletion-requests?status={status}&limit={1..100}&cursor={cursor}` | painel autenticado conforme o contrato final |
| Aprovar | `POST /v1/deletion-requests/{requestId}/approve` | `tenant_admin`, `super_admin` ou serviço `documents:admin` |
| Rejeitar | `POST /v1/deletion-requests/{requestId}/reject` | `tenant_admin`, `super_admin` ou serviço `documents:admin` |
| Cancelar | `POST /v1/deletion-requests/{requestId}/cancel` | solicitante original com permissão `request_deletion`, enquanto o pedido está `requested` |

As três decisões aceitam body fechado com `reason` opcional. O pedido assume `requested`, `approved`, `rejected`, `cancelled` ou `executed`. Aprovar conclui um tombstone lógico: registra `deleted_at`, leva o documento a `deleted`, marca o pedido como `executed` e inativa seus links públicos. Os bytes e as versões são preservados. Rejeitar ou cancelar restaura o lifecycle anterior, `active` ou `archived`. Solicitar exclusão, arquivar ou aprovar um pedido inativa imediatamente os links públicos do documento; restauração, rejeição e cancelamento não os reativam implicitamente.

A documentação não deve apresentar `deletion_requested` como arquivo apagado nem o tombstone lógico como destruição física.

## Links públicos nativos

Para criar o endereço curto e administrar os links na tela, siga o [manual — Links públicos](/_infra/manuais/central-documentos#links-publicos).

Links públicos documentais são uma capacidade diferente de Open Pages. Open Pages publica HTML e assets no domínio `open.grupocsv.com`; um link documental referencia uma versão autorizada que continua armazenada no R2 privado e é entregue pelo control plane.

A capacidade produtiva usa estes contratos autenticados:

| Operação | Rota |
|---|---|
| Listar links de um documento | `GET /v1/documents/{documentId}/public-links?limit={1..100}&cursor={cursor}` |
| Criar link | `POST /v1/documents/{documentId}/public-links` |
| Atualizar ou inativar | `PATCH /v1/documents/{documentId}/public-links/{linkId}` |
| Listar todos os links do tenant para o painel | `GET /v1/public-links?limit={1..100}&cursor={cursor}` |
| Consumir link público | `GET /s/{slug}` ou `HEAD /s/{slug}` |

Criação aceita body fechado com `slug`, `version_id` opcional, `expires_at` opcional e `allow_download` opcional. Sem `version_id`, a API fixa a versão vigente naquele momento. A resposta devolve identificadores e `public_url`, sem expor tenant, object key ou bucket. Atualização aceita somente `status` (`active` ou `inactive`), `expires_at` e `allow_download`.

Os invariantes são:

- criação explícita por usuário ou serviço autorizado;
- slug globalmente único, com 3 a 48 caracteres no padrão exato `^[a-z0-9]+(?:-[a-z0-9]+)*$`; `admin`, `api`, `docs`, `health`, `login` e `openapi` são reservados;
- vínculo imutável ao tenant, documento e versão selecionada;
- estado ativo ou inativo, com revogação imediata no control plane;
- listagem administrativa por tenant, sem ampliar acesso entre organizações;
- entrega por endpoint controlado, nunca por URL direta do R2;
- auditoria das mutações; acessos anônimos ficam nos logs operacionais e são limitados por slug e endereço de origem, sem gravar uma linha no D1 por download;
- resposta pública com `X-Robots-Tag: noindex, nofollow, nosnippet`, CSP fechada, `nosniff` e política de referrer;
- expiração e estados inválidos falham fechados;
- documentos `confidential` ou `restricted` não podem receber link;
- documento precisa estar `active` e a versão, `uploaded` e `clean`;
- exclusão lógica, documento arquivado, versão retirada ou link inativo impedem a entrega;
- `allow_download` controla `Content-Disposition`: ativo força anexo; inativo permite abertura em linha quando o navegador suporta o tipo. Essa opção não impede o destinatário de salvar uma cópia e não torna o R2 público.

Papéis `manager`, `tenant_admin` e `super_admin` gerenciam links; clientes de serviço usam `documents:manage`.

A classificação `Público` continua significando somente acesso autenticado conforme as regras do tenant. Ela não cria link anônimo: o compartilhamento exige criação explícita de um link, que pode ser inativado ou ter validade definida.

## Relação com o Panta

### Panta v1

O serviço em `panta.grupocsv.com` é a busca federada existente. Ele é independente da Central de Documentos e não recebe autoridade documental. Agentes não devem contornar o control plane usando ingestão direta do Panta para publicar ou recuperar documentos da Central.

### Panta v2

O [guia da pesquisa Panta v2](/_infra/ferramentas/panta-v2) explica o uso na interface, a diferença para a v1 e o contrato para agentes. Ele separa capacidade implementada de ativação produtiva e não substitui a verificação autenticada do ambiente.

O Panta v2 documental está implementado no repositório `grupocsv/backend` como índice tenant-aware. O fluxo correto é sempre:

1. o `csv-documents` autentica e calcula no D1 o conjunto permitido, incluindo a revisão confirmada de cada documento;
2. o Panta v2 pesquisa somente os IDs, versões e revisões autorizados;
3. o Worker revalida tenant, lifecycle, política, ACL, versão vigente e a mesma revisão confirmada antes de devolver cada resultado.

Panta v2 não armazena papéis ou ACL como autoridade, não recebe token humano e não pode devolver path, chave R2 ou URL interna.

### Estado da busca

Em 16/09/2026, o serviço isolado respondeu em `https://panta-v2.grupocsv.com/health` com versão `2.1.0`, schema `2` e build `aa8f220f28e8fbdcfc921b152e2e4e976fdf228d`. Ele executa em Docker na VPS-CSV, ligado somente à porta local `8092` e exposto pelo tunnel. O ensaio autenticado local aprovou nove cenários e confirmou a persistência do tombstone após reinício. A v1 permaneceu saudável, com API `8090` e MCP `8091` preservados.

Uma credencial exclusiva da integração foi registrada no Arsenal Técnico e provisionada na VPS e no Worker, sem alterar as anteriores. A versão Worker `0389d7b4-eed6-4b60-b0d1-bdff6e25760b`, fonte `094c8871e65c5f6d9ae0c9d6f0cbff8c107620b9`, recebe 100% do tráfego. A falha de transporte inicialmente diagnosticada foi corrigida, e os testes integrados pela Central/Extensio passaram em produção.

Os canários comprovaram busca por conteúdo nos cinco tenants, consulta cruzada rejeitada com `404`, busca cruzada sem resultados, política `metadata_only` com título pesquisável e corpo ausente, política `disabled` sem resultados, exclusão lógica da amostra 2iM com revisão aplicada, troca de versão no ICDS sem recuperar o texto anterior e reconstrução do documento de teste da Unihealth após retirada do índice. Ao encerrar a validação em 16/09/2026, os cinco canários estavam excluídos logicamente, com consulta `404` e busca sem resultados.

Esta versão configura `features.search = true` após os testes produtivos da API/MCP e os testes locais da interface. A sessão humana autenticada no navegador permanece não aferida. Não foi realizado um novo reinício da VPS nem restauração integral do volume a partir de backup nesta rodada; reconstruir um documento não comprova essa restauração completa.

O contrato de sincronização usa `/internal/v2/documents/sync` e `panta_sync_state`: uma alteração canônica incrementa `revision`, e somente a confirmação correspondente avança `applied_revision`. A pesquisa exige igualdade entre essas revisões. A reconciliação roda a cada cinco minutos, somados à fila, processamento e retries; isso não é garantia de latência máxima. O escopo admite até 500 documentos autorizados por consulta; excesso retorna `422 search_scope_too_large`, sem corte silencioso. A pesquisa é lexical, não semântica.

Na interface preparada para a busca, a pesquisa informa indisponibilidade, ausência de resultados ou limite do acervo sem confundi-los. O usuário pode voltar ao catálogo e continuar a gestão documental. Trechos são exibidos como texto simples e cada resultado mantém a referência do documento e da versão; a abertura continua passando pela autorização da Central.

A demonstração prática a Guilherme sobre Central, Panta v1 e Panta v2 permanece pendente até apresentação do produto publicado e confirmação de entendimento.

O [manual do Panta v2](/_infra/manuais/panta-v2) explica o fluxo previsto, a dependência da VPS e os limites da pesquisa. A disponibilidade deve ser conferida neste estado operacional, não presumida a partir das instruções de uso.

## Fontes canônicas e verificação

| Assunto | Fonte |
|---|---|
| Frontend e registro de tenants | `grupocsv/hub`: `scripts/documentos-runtime-config.json` e `scripts/documentos-tenants.json` |
| API e autorização | `grupocsv/backend`: `workers/csv-documents/` |
| Contrato HTTP | `grupocsv/backend`: `workers/csv-documents/openapi/document-api.json` |
| Processador | `grupocsv/backend`: `services/csv-documents-processor/` |
| Monitor | `grupocsv/backend`: `workers/csv-documents-monitor/` |
| Panta v2 | `grupocsv/backend`: `services/panta-v2/` e `docs/hub-documents/PANTA-INTEGRATION.md` |
| Ferramentas de agentes | `grupocsv/extensio`: `packages/mcp/` |

Verificações externas úteis:

- [Health do control plane](https://documentos-api.grupocsv.com/health)
- [Readiness do processador e ClamAV](https://documentos-processor.grupocsv.com/readyz)
- [Configuração pública do frontend](https://hub.grupocsv.com/documentos/assets/runtime-config.js)
- [Saúde do serviço Panta v2](https://panta-v2.grupocsv.com/health)

Health check prova disponibilidade pontual; não prova permissões, integridade de todos os documentos, operação por agentes, links públicos ou busca. Para essas capacidades, use um canário autenticado no tenant correto. O canário de 24/08/2026 foi encerrado por tombstone lógico, preservando a versão e a referência privada do objeto; não restaram pedidos de exclusão pendentes.

## Relação com outras páginas da infraestrutura

- [Arquitetura técnica do Hub](/_infra/technical-architecture)
- [Panta](/_infra/ferramentas/panta)
- [Páginas Públicas (Open Pages)](/_infra/public-pages)
- [AI Search do conteúdo estático do Hub](/_infra/ai-search)

AI Search, Panta e Central de Documentos são sistemas distintos. A Central usa seu próprio control plane, D1 e R2 privado; nenhum dos dois mecanismos de busca substitui a autorização documental.
