---
layout: doc
title: Manual da NFS-e AxiaCare
---

# Manual da NFS-e AxiaCare

- **Versão operacional:** 3.2.0
- **Estado:** Emissão controlada em produção
- **Atualização:** 7 de outubro de 2026
- **Acesso:** [hub.grupocsv.com/axia/nota-fiscal.html](https://hub.grupocsv.com/axia/nota-fiscal.html)

## Estado Vigente

A NFS-e AxiaCare **emite NFS-e reais no Sistema Nacional NFS-e** pelos modelos oficiais dos tomadores 2iM, AbbVie, ICDS Matriz e ICDS Unihealth GV.

Cada emissão segue o fluxo **solicitação com prévia oficial → aprovação com confirmação do valor líquido → emissão → conferência automática do XML autorizado → DANFSe**. O mesmo fluxo está disponível no Hub, por sessão individual, e para agentes, por chave individual.

> **Cancelamento fora da ferramenta:** cancelamento e substituição de NFS-e não são executados pela API. A rota de cancelamento responde HTTP 423 e a operação fica com o responsável humano.

## Acesso e Autorização

### Sessão do Hub

- Sessão individual obrigatória: a sessão deve estar ativa e vinculada ao portal AxiaCare.
- Sessão compartilhada é recusada pela API fiscal.
- As chamadas da interface usam o cabeçalho `X-Auth-Token`, injetado pelo Hub Auth.
- A API aceita somente os tenants `axia` e `axiacare`.
- Operações de alteração exigem a origem `https://hub.grupocsv.com`.

### Papéis Fiscais

| Papel | Escopos | Uso |
|---|---|---|
| Administrador | `read`, `simulate`, `request`, `approve`, `emit`, `documents` | Todas as operações, inclusive gestão de chaves de agentes. |
| Solicitante | `read`, `simulate`, `request` | Consulta, simulação e criação de solicitações. |
| Aprovador | `read`, `simulate`, `approve` | Consulta, simulação e aprovação. |
| Auditor | `read`, `simulate`, `documents` | Consulta, simulação, histórico e DANFSe. |

### Chaves de Agentes

- Cada agente usa uma **chave individual**, no formato `nfse_ak_` seguido de 43 caracteres.
- A chave é enviada somente no cabeçalho `Authorization: Bearer <chave>`.
- Somente o administrador, em sessão individual no Hub, cria, lista e revoga chaves, na aba **Agentes**.
- O segredo é exibido **uma única vez** na criação. A API armazena apenas o hash SHA-256.
- A chave pode ter escopos reduzidos e validade de 1 a 730 dias.
- Agentes não enviam `Origin` e não podem usar `X-Auth-Token` e `Authorization` na mesma chamada.
- Agentes enviam um `User-Agent` próprio e identificado, por exemplo `grupocsv-nfse-agent/1.0 (Nome do agente)`. O `User-Agent` padrão da biblioteca `urllib` do Python (`Python-urllib/...`) é recusado pela borda da Cloudflare com HTTP 403 e código 1010, antes de chegar à API.

## Emissão de NFS-e

### Passo a Passo no Hub

1. Entre no portal AxiaCare com uma sessão individual.
2. Abra **NFS-e AxiaCare**. A aba **Emitir** é a aba inicial.
3. Consulte a aba **Solicitações** para confirmar que a nota ainda não foi solicitada ou emitida.
4. Na aba **Emitir**, selecione o tomador e informe o valor bruto e a competência (mês trabalhado).
5. Para AbbVie, informe também a descrição específica do serviço e a Ordem de Compra exatamente como recebida.
6. Selecione **Gerar prévia oficial**. A API cria a solicitação e o emissor monta e valida a DPS sem transmiti-la.
7. Confira tomador, CNPJ, competência, data de competência, código de tributação, NBS, descrição, valor bruto, cada retenção, ISS destacado e valor líquido.
8. Digite o valor líquido exatamente como apresentado na prévia e selecione **Confirmar e emitir**.
9. Ao final, abra o DANFSe e confira número, chave de acesso e valores.

### Campos da Solicitação

| Campo | Regra |
|---|---|
| Tomador | `2im`, `abbvie`, `icds-matriz` ou `icds-unihealth`. |
| Valor bruto | Centavos inteiros positivos; mínimo de R$ 1,00. |
| Competência | Mês trabalhado no formato `AAAA-MM`. |
| Descrição | Obrigatória somente para AbbVie, de 3 a 600 caracteres, sem marcação HTML ou caracteres de controle. Nos demais perfis, a descrição é padronizada e não deve ser informada. |
| Ordem de Compra | Obrigatória para AbbVie, com até 60 caracteres entre letras, números, espaço, ponto, hífen, sublinhado e barra. Não aplicável aos demais perfis. |

### Regra de Competência

- **Mês anterior ao da emissão:** a data de competência é o último dia do mês trabalhado.
- **Mês corrente:** a data de competência é a data da emissão.
- Não são aceitos mês futuro nem competência com mais de 12 meses.

## Perfis Fiscais Ativos

| Perfil | Código | Versão | Descrição na NFS-e | Ordem de Compra |
|---|---|---:|---|---|
| 2iM | `2im` | 2 | “Assessoria Estratégia de Gestão em Saúde” | Não aplicável |
| AbbVie | `abbvie` | 2 | Descrição específica, seguida dos dados bancários e da Ordem de Compra | Obrigatória |
| ICDS Matriz | `icds-matriz` | 1 | “Apoio Técnico Consultivo - Gestão em Saúde - Ref. mês/ano”, seguida dos dados bancários | Não aplicável |
| ICDS Unihealth GV | `icds-unihealth` | 1 | Descrição padronizada, seguida dos dados bancários | Não aplicável |

Todos os perfis vigoram desde 1º de setembro de 2026 e reproduzem as NFS-e oficiais de referência emitidas para cada tomador. Razão social e CNPJ de cada tomador constam na aba **Perfis** e em `GET /v1/profiles`, mediante autenticação.

### Parâmetros Comuns

| Parâmetro | Valor |
|---|---|
| Código de tributação nacional | `17.12.01` |
| NBS | `1.1401.22.00` |
| Local da prestação | Governador Valadares/MG |
| ISS | 5,00%, destacado, não retido e não subtraído do valor líquido |
| IRRF | 1,50% |
| PIS | 0,65% |
| COFINS | 3,00% |
| CSLL | 1,00% |
| Contribuições sociais | 4,65% (PIS, COFINS e CSLL) |
| Retenções federais totais | 6,15% |

O XML segue o leiaute vigente do Sistema Nacional NFS-e, inclusive com o grupo informativo de IBS/CBS presente nas notas de referência, sem valores de IBS/CBS.

## Cálculo e Arredondamento

Todos os valores autoritativos são calculados de forma independente pela API e pelo emissor, com:

- valor monetário em centavos inteiros;
- alíquota em basis points;
- arredondamento `HALF_UP` aplicado separadamente a cada tributo;
- total federal igual à soma dos componentes já arredondados;
- valor líquido igual ao valor bruto menos as retenções federais.

A solicitação é recusada se a prévia do emissor divergir do cálculo da API. A aprovação é recusada se o valor líquido informado divergir da prévia.

| Exemplo | IRRF | PIS | COFINS | CSLL | Total Federal | ISS Destacado | Valor Líquido |
|---|---:|---:|---:|---:|---:|---:|---:|
| R$ 10.000,00 | R$ 150,00 | R$ 65,00 | R$ 300,00 | R$ 100,00 | R$ 615,00 | R$ 500,00 | R$ 9.385,00 |
| R$ 30.000,00 | R$ 450,00 | R$ 195,00 | R$ 900,00 | R$ 300,00 | R$ 1.845,00 | R$ 1.500,00 | R$ 28.155,00 |
| R$ 8.055,00 | R$ 120,83 | R$ 52,36 | R$ 241,65 | R$ 80,55 | R$ 495,39 | R$ 402,75 | R$ 7.559,61 |

No exemplo de R$ 8.055,00, a soma dos componentes arredondados produz R$ 495,39, e o cálculo agregado de 6,15% produz R$ 495,38. Prevalece a soma dos componentes individualizados.

## Conferência Pós-Emissão

Após a autorização, o emissor confere o XML oficial contra a solicitação aprovada:

- data de competência e CNPJ do tomador;
- código de tributação nacional, NBS e descrição;
- valor do serviço, IRRF e contribuições sociais;
- tipo de retenção de PIS/COFINS/CSLL e ISS não retido;
- presença do grupo IBS/CBS;
- total de retenções, valor líquido e ISS destacado.

A API repete a conferência do valor do serviço, do valor líquido e do CNPJ do tomador. Qualquer divergência é devolvida em `warnings` e marca a resposta com `requires_review: true`. Nesse caso, revise o documento antes de enviá-lo ao tomador.

## DANFSe

- O DANFSe é gerado a partir do **XML autorizado**, conforme a **NT 008/2026 v1.02**, com QR Code de consulta pública.
- A API nacional de DANFSe foi suspensa pela NT 008/2026; por isso o documento é gerado pela própria ferramenta.
- O PDF fica no bucket privado e é entregue somente pela rota autenticada, com auditoria.
- **Regerar DANFSe**, no Histórico ou em Solicitações, gera o documento novamente a partir do XML autorizado, sem nova emissão.

## Abas da Ferramenta

### Emitir

Cria a solicitação com prévia oficial, registra a aprovação com o valor líquido confirmado e emite a NFS-e.

### Solicitações

Lista as solicitações com situação, tomador, competência, valores, número da NFS-e e ações disponíveis: continuar emissão pendente, abrir DANFSe e regerar DANFSe.

### Simular

Calcula a prévia no servidor sem criar solicitação e sem transmitir DPS.

### Histórico

Lista as NFS-e emitidas pela ferramenta e entrega o DANFSe pela rota autenticada.

### Perfis

Apresenta tomador, CNPJ, versão, serviço, alíquotas, exigência de descrição e de Ordem de Compra e situação de cada perfil.

### Agentes

Visível somente para o administrador. Cria, lista e revoga chaves individuais de agentes.

### Adequação

Reúne o roteiro técnico para avaliação futura de IBS/CBS. Não ativa recolhimento, não altera alíquotas e não afirma aplicabilidade automática à AxiaCare.

### Manual

Reúne o fluxo de uso, as regras dos perfis e o acesso a esta documentação técnica.

## Integração de Agentes

Base: `https://api.grupocsv.com/nfse`

### Fluxo

1. `GET /v1/meta` — confirma identidade, escopos e `mutations_enabled: true`.
2. `GET /v1/requests` — verifica se a nota já foi solicitada ou emitida para o mesmo tomador e competência.
3. `POST /v1/requests` — cria a solicitação e recebe a prévia oficial em `data.preview` e os valores em `data.amounts`.
4. `POST /v1/requests/{request_id}/approve` — envia `expected_net_amount_cents` igual a `data.amounts.net_amount_cents`.
5. `POST /v1/operations/{request_id}/emit` — envia `{}` e recebe número, chave de acesso, valores oficiais e documento.
6. `GET /v1/documents/{document_id}/pdf` — obtém o DANFSe.

### Exemplo de Solicitação

```http
POST /nfse/v1/requests
Authorization: Bearer <chave do agente>
User-Agent: grupocsv-nfse-agent/1.0 (Nome do agente)
Content-Type: application/json
Idempotency-Key: 2im-2026-09-solicitacao-0001

{"profile_code":"2im","gross_amount_cents":1000000,"competence":"2026-09"}
```

```http
POST /nfse/v1/requests/{request_id}/approve
Authorization: Bearer <chave do agente>
User-Agent: grupocsv-nfse-agent/1.0 (Nome do agente)
Content-Type: application/json
Idempotency-Key: 2im-2026-09-aprovacao-0001

{"expected_net_amount_cents":938500}
```

```http
POST /nfse/v1/operations/{request_id}/emit
Authorization: Bearer <chave do agente>
User-Agent: grupocsv-nfse-agent/1.0 (Nome do agente)
Content-Type: application/json
Idempotency-Key: 2im-2026-09-emissao-0001

{}
```

### Idempotência

- `Idempotency-Key` é obrigatória em `POST /v1/requests`, `/approve` e `/emit`, com 16 a 255 caracteres entre letras, números, ponto, hífen, sublinhado e dois-pontos.
- Repetir a mesma chave com o mesmo corpo devolve a resposta registrada, com o cabeçalho `Idempotency-Replayed: true`.
- Reutilizar a chave com outro corpo resulta em HTTP 409 `idempotency_key_reused`.
- Uma emissão já concluída devolve o resultado existente, sem nova nota.

### Confirmação Pendente

Se a emissão responder HTTP 202 `pending_confirmation`, o Sistema Nacional NFS-e ainda não confirmou a autorização. Repita a mesma chamada de emissão, com a mesma `Idempotency-Key`, após cerca de 30 segundos. O emissor reconcilia a mesma DPS e não gera nova nota. Não crie outra solicitação.

## Mensagens Operacionais

| Situação | Significado | Conduta |
|---|---|---|
| HTTP 403 com código 1010 da Cloudflare | `User-Agent` padrão do `Python-urllib`, recusado na borda. | Envie um `User-Agent` próprio e identificado do agente. |
| HTTP 401 `invalid_session` ou `invalid_agent_key` | Sessão ou chave não aceita, expirada ou revogada. | Entre novamente no portal ou solicite nova chave ao administrador. |
| HTTP 403 `insufficient_scope` ou `insufficient_role` | A identidade não possui o escopo exigido. | Solicite a revisão do papel ou dos escopos. |
| HTTP 400 `fixed_description_profile` | Descrição informada para perfil de descrição padronizada. | Remova o campo `description`. |
| HTTP 400 `description_required` ou `purchase_order_required` | Faltou a descrição ou a Ordem de Compra no perfil AbbVie. | Informe o dado e crie a solicitação novamente. |
| HTTP 409 `preview_mismatch` | A prévia do emissor divergiu do cálculo da API. | Não insista. A solicitação não foi criada; acione o responsável técnico. |
| HTTP 409 `expected_net_mismatch` | O valor líquido confirmado diverge da prévia. | Confira a prévia e confirme o valor correto. |
| HTTP 409 `approval_required` | Emissão solicitada antes da aprovação. | Aprove a solicitação antes de emitir. |
| HTTP 409 `profile_changed` | O perfil fiscal mudou após a solicitação. | Crie uma nova solicitação. |
| HTTP 202 `pending_confirmation` | Autorização ainda não confirmada pelo Sistema Nacional NFS-e. | Repita a emissão com a mesma `Idempotency-Key`. |
| HTTP 422 na emissão | O emissor ou o Sistema Nacional NFS-e recusou a DPS; o detalhe vem em `error.details.rejections`. | Não repita com outra chave sem corrigir a causa. |
| HTTP 423 `cancellation_disabled` | Cancelamento solicitado pela API. | Encaminhe ao responsável humano. |
| HTTP 503 `emitter_unavailable` | O emissor privado não respondeu. | Repita depois com a mesma solicitação. |

## Arquitetura Operacional

| Camada | Componente | Responsabilidade |
|---|---|---|
| Interface | `hub.grupocsv.com/axia/nota-fiscal.html` | Emissão, solicitações, simulação, histórico, perfis, agentes, adequação e manual. |
| Autenticação | `csv-auth` por Service Binding e chaves de agentes no D1 | Valida sessão individual e tenant, ou chave de agente com escopos. |
| API | Worker `nfse-api` em `api.grupocsv.com/nfse/*` | Autoriza, calcula, registra solicitações, aprovações, operações e auditoria e entrega PDFs privados. |
| Banco | D1 `csv-hub` | Perfis, versões, papéis, chaves de agentes, solicitações, snapshots, aprovações, operações, idempotência, documentos, eventos e auditoria. |
| Documentos | R2 `nfse-pdfs` | Bucket privado para DANFSe, sem domínio público. |
| Conector | Cloudflare Tunnel com Cloudflare Access | Hostname privado do emissor, acessível somente com service token do Worker. |
| Emissor | `nfse-emitter.service` na VPS-CSV | Monta, assina e transmite a DPS, reconcilia por ledger, confere o XML autorizado e gera o DANFSe. Autenticação HMAC-SHA256 com proteção contra repetição. |

## Endpoints Publicados

Base: `https://api.grupocsv.com/nfse`

| Método | Rota | Escopo | Função |
|---|---|---|---|
| `GET` | `/health` | Público | Saúde do serviço, sem dados fiscais. |
| `GET` | `/v1/meta` | `read` | Versão, ambiente, estado da emissão e identidade autenticada. |
| `GET` | `/v1/profiles` | `read` | Perfis fiscais ativos. |
| `POST` | `/v1/simulations` | `simulate` | Prévia de cálculo sem persistência. |
| `GET` | `/v1/requests` | `read` | Lista de solicitações. |
| `GET` | `/v1/requests/{id}` | `read` | Solicitação com documento vinculado. |
| `POST` | `/v1/requests` | `request` | Cria solicitação com prévia oficial do emissor. |
| `POST` | `/v1/requests/{id}/approve` | `approve` | Aprova com o valor líquido confirmado. |
| `POST` | `/v1/operations/{id}/emit` | `emit` | Emite a NFS-e da solicitação aprovada. |
| `POST` | `/v1/requests/{id}/danfse` | `documents` | Regera o DANFSe a partir do XML autorizado. |
| `GET` | `/v1/documents` | `documents` | Lista de documentos fiscais. |
| `GET` | `/v1/documents/{id}/pdf` | `documents` | DANFSe privado, com auditoria. |
| `POST` | `/v1/documents/{id}/cancel` | — | Sempre HTTP 423; cancelamento fora da ferramenta. |
| `GET` | `/v1/agent-keys` | Administrador em sessão | Lista chaves de agentes. |
| `POST` | `/v1/agent-keys` | Administrador em sessão | Cria chave de agente. |
| `POST` | `/v1/agent-keys/{id}/revoke` | Administrador em sessão | Revoga chave de agente. |

A rota legada `/api/nf/*` está desabilitada e retorna HTTP 410. O contrato completo está em `grupocsv/backend/workers/nfse-api/openapi.json`.

## Controles de Segurança

- CORS restrito a `https://hub.grupocsv.com`.
- Respostas privadas com `Cache-Control: private, no-store, max-age=0`.
- JSON estrito e limitado a 16 KiB na API pública.
- Idempotência obrigatória na solicitação, na aprovação e na emissão.
- Cálculo duplo e independente na API e no emissor; aprovação condicionada ao valor líquido confirmado.
- Ledger por solicitação no emissor, com numeração de DPS controlada e reconciliação sem nova nota.
- Auditoria obrigatória de solicitações, aprovações, emissões, regeração e entrega de PDF.
- Logs sem conteúdo fiscal, CNPJ, Ordem de Compra, documento ou credencial.
- Bucket privado, sem `r2.dev` e sem domínio customizado.
- Emissor sem exposição pública direta: acesso somente pelo túnel, com Cloudflare Access e HMAC-SHA256.
- Cancelamento bloqueado na API e no emissor.

## Referências Oficiais

- [Documentação técnica vigente da NFS-e](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual)
- [NT 008/2026 — DANFSe](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/rtc/nt-008-se-cgnfse-danfse-20260714-v1-02.pdf)
- [APIs de produção e produção restrita](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/apis-prod-restrita-e-producao)
- [API ADN de contribuintes](https://adn.nfse.gov.br/contribuintes/docs/index.html)
- [SEFIN Nacional](https://sefin.nfse.gov.br/SefinNacional/docs/index)

## Fontes Internas

- Frontend: `grupocsv/hub/axia/nota-fiscal.html`
- Worker e OpenAPI: `grupocsv/backend/workers/nfse-api/`
- Emissor privado: `grupocsv/backend/services/nfse-emitter/`
- PRD: `grupocsv/backend/docs/nfse/PRD_NFSe_AxiaCare_AbbVie_2iM_v3.md`
