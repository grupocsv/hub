# QA do Marco M5 — Backend, Downloads, Admin e Documentação

## Escopo

O Marco M5 implementa, somente em código local, a extensão Compass™ no `csv-documents`, a aba de consulta no Admin do Hub, os contratos de build e a documentação técnica. Nenhuma migration, deploy, binding, bucket, Queue, gateway, RLS ou alteração de produção foi executada.

**Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®**. AxiaCare® permanece identificada na elaboração e na aplicação prática das consultorias e assessorias.

## Revisão 1 — Verificação Determinística

| Gate | Resultado | Evidência |
|---|---|---|
| CI completo do `csv-documents` | Aprovado | 717 testes Workers e 56 testes Node; typecheck, tipos Wrangler, lint, Prettier, migration policy, scan sensível e bundle seco aprovados |
| Migration D1 | Aprovada localmente | Sequência 0001–0021, parser compatível e `scope=local-only`; nenhuma aplicação remota |
| API Compass™ | Aprovada | Isolamento tenant-first, RBAC, escopos de serviço, Origin humano, payload/query fechados e idempotência |
| Release bifásico | Aprovado | Preparação sem troca de ponteiro; ativação e rollback atômicos por ponteiro |
| Downloads | Aprovados | Reuso de `document_public_links` e `/s/{slug}`, Range e `allow_download`, sem `object_key` |
| OpenAPI 0.12.0 | Aprovada | 34 paths e 44 operações alinhados ao roteador; schemas públicos fechados |
| Contratos Compass™ do Hub | Aprovados | 53 testes Node |
| Build VitePress | Aprovado | Publicação v2, catálogo e Central Compass™ compilados; apenas warnings preexistentes não bloqueantes |
| PDF em runtime isolado | Aprovado | Integração real A4 executada em container efêmero |
| Smoke do artefato | Aprovado | Admin, Central Compass™, catálogo JSON público e página 008 presentes |
| Scan de segredos | Aprovado | Nenhum padrão sensível detectado no backend; Admin sem credencial de serviço |

## Revisão 2 — Análise Adversarial e Visual

A revisão adversarial percorreu cenários de acesso cruzado, principal sem `documents:publish`, sessão humana sem `Origin`, query e campos extras, colisão idempotente, slug imutável, release concorrente, rollback, link inativo e tentativa de vazamento de chave R2.

Dois defeitos foram identificados e corrigidos antes do fechamento:

1. O replay da mesma ativação idempotente poderia ser rejeitado depois da primeira troca de ponteiro. A rota passou a reconhecer o registro idempotente antes da precondição concorrente, e o cenário recebeu teste de regressão.
2. O catálogo `docs/compass/catalog.json` é importado pelo VitePress, mas não era copiado como JSON estável para o artefato. O workflow passou a publicá-lo explicitamente e o smoke foi corrigido para validar o campo real `number: 8`.

A inspeção visual do Admin foi executada localmente com dados sintéticos, sem credenciais e sem chamadas à produção. A aba Compass™ apresentou hierarquia, cards, tabela, checksums abreviados, links, histórico de versões e aviso de segurança legíveis em desktop. Não existem controles de mutação. A renderização escapa texto e atributos; links web e de download são aceitos somente quando seguem os prefixos esperados.

## Decisões Arquiteturais Confirmadas

| Decisão | Justificativa Verificada |
|---|---|
| Reutilizar `csv-documents` | O Worker já possui D1, R2 privado, documentos, versões, links públicos, auditoria e idempotência |
| Uma edição referencia um documento PDF | Preserva o ciclo documental e evita duplicar bytes |
| Cada release referencia uma versão | Mantém versões imutáveis e rollback por ponteiro |
| Git permanece fonte do web | O catálogo e o VitePress são derivados da árvore `compass/edicoes/` |
| Admin somente leitura no M5 | Backend e migration ainda não estão em produção; credencial de serviço não deve chegar ao navegador |
| Sem gateway adicional | O `csv-documents` já possui domínio próprio e autenticação existente |
| Sem job Compass™ na Queue | O M5 não exige processamento assíncrono; Queue e DLQ permanecem no fluxo documental existente |
| Open Pages fora do fluxo | HTML/assets independentes não substituem links públicos documentais |

## Estado Operacional

A migration `0021_create_compass_catalog.sql` e o código do Worker permanecem não aplicados. A branch do Hub permanece não publicada. Qualquer aplicação de migration, push, merge ou deploy exige autorização explícita e execução do procedimento protegido.

O n8n não integra o caminho crítico do Compass™ e não foi alterado.

### Estados de Autenticação do Admin

A simulação local de 403 manteve a sessão e o token de teste, preservou o painel aberto e exibiu a mensagem específica de permissão insuficiente. A simulação de 401 removeu o token de teste, reabriu o formulário de login e exibiu a mensagem de sessão expirada. Os dois cenários foram executados sem rede de produção.

### Auditoria Semântica da OpenAPI

A OpenAPI atual foi comparada como estrutura JSON com a versão `HEAD`, removendo da comparação apenas a atualização 0.11.0 → 0.12.0, a descrição, a tag Compass™, quatro paths novos e onze schemas novos. O resultado confirmou `unchangedExistingContract: true`, sem path ou schema preexistente removido. Portanto, a diferença textual ampla decorre da adição dos contratos Compass™ e da formatação do JSON, não de regressão semântica nas 38 operações anteriores.

### Gate Integrado do Hub

Após todas as correções, `npm run compass:test`, `npm run documentos:test`, `npm run docs:build`, o espelhamento byte a byte do Admin e `git diff --check` foram aprovados. A suíte preexistente de Documentos invoca o executável `python`; como a VPS disponibiliza `python3`, o gate foi executado com um alias efêmero em diretório temporário, removido automaticamente ao final, sem mudança no host. O build manteve apenas os warnings preexistentes do Rollup sobre anotações `#__PURE__` e tamanho de chunks, sem erro ou bloqueio.

### Endurecimento Final do Contrato

A revisão linha a linha encontrou um terceiro defeito antes do commit: `public_slug` aceitava até 64 caracteres, enquanto `document_public_links.slug` aceita no máximo 48. O teste RED comprovou que um slug de 49 caracteres era aceito com HTTP 201. Domínio, rota, migration e os dois schemas OpenAPI foram alinhados para 3–48 caracteres. O teste HTTP, o teste de política da migration, o contrato OpenAPI, o parser local e o formatador passaram após a correção.

A mesma revisão verificou a concorrência da ativação. O primeiro statement da batch insere `compass_release_activations`; o trigger `compass_release_activation_guard` compara `edition.active_release_id` com `expected_active_release_id` no momento da transação e aborta a batch se houver divergência. Assim, os updates posteriores não são aplicados em conflito e a operação permanece fail-closed.
