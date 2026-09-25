---
layout: doc
title: Manual da NFS-e AxiaCare
---

# Manual da NFS-e AxiaCare

- **Versão operacional:** 3.0.0
- **Estado:** Homologação segura
- **Atualização:** 25 de setembro de 2026
- **Acesso:** [hub.grupocsv.com/axia/nota-fiscal.html](https://hub.grupocsv.com/axia/nota-fiscal.html)

## Estado Vigente

A NFS-e AxiaCare está disponível para **consulta de perfis fiscais, simulação de retenções e consulta autenticada de documentos privados**.

> **Mutações desabilitadas:** criação de solicitação, aprovação, emissão e cancelamento permanecem bloqueados. A interface não transmite DPS nem executa qualquer operação no Sistema Nacional NFS-e.

Os perfis AbbVie e 2iM permanecem no estado `blocked_accounting`. A simulação informa os valores e as razões de bloqueio, mas não cria registro fiscal nem altera documento existente.

## Acesso e Autorização

- A sessão deve ser **individual**, ativa e vinculada ao portal AxiaCare.
- Sessão compartilhada é recusada pela API fiscal.
- As chamadas da interface usam o cabeçalho `X-Auth-Token`, injetado pelo Hub Auth.
- A API aceita somente os tenants `axia` e `axiacare`.
- A origem autorizada para chamadas do navegador é `https://hub.grupocsv.com`.
- Perfis e simulações exigem sessão individual válida.
- Histórico global e PDFs exigem papel fiscal de auditoria ou administração.

## Simulação de NFS-e

### Campos Obrigatórios

| Campo | Regra |
|---|---|
| Perfil fiscal | AbbVie ou 2iM. |
| Valor bruto | Valor positivo, informado com duas casas decimais. |
| Competência | Mês de referência no formato `AAAA-MM`. |
| Data do serviço | Data existente no formato `AAAA-MM-DD`. |
| Descrição | De 3 a 500 caracteres, sem caracteres de controle ou marcação HTML. |
| Ordem de Compra | Obrigatória para AbbVie e opcional para 2iM. |

### Passo a Passo

1. Entre no portal AxiaCare com uma sessão individual.
2. Abra **NFS-e AxiaCare**.
3. Na aba **Simular**, selecione o perfil fiscal.
4. Informe valor bruto, competência, data do serviço e descrição.
5. Para AbbVie, informe a Ordem de Compra exatamente como recebida.
6. Selecione **Calcular prévia**.
7. Confira o valor bruto, cada retenção, o total federal, o valor líquido, o código do serviço, a versão do perfil e as razões de bloqueio.
8. Não utilize a prévia como comprovante fiscal. Ela não representa emissão, autorização ou registro no ambiente nacional.

## Perfis Fiscais em Homologação

| Perfil | Serviço de Referência | ISS Destacado | IRRF | PIS | COFINS | CSLL | Total Federal | Ordem de Compra |
|---|---|---:|---:|---:|---:|---:|---:|---|
| AbbVie | `170101` — Assessoria estratégica de gestão em saúde | 3,00% | 1,50% | 0,65% | 3,00% | 1,00% | 6,15% | Obrigatória |
| 2iM | `171201` — Assessoria Estratégia de Gestão em Saúde | 5,00% | 1,50% | 0,65% | 3,00% | 1,00% | 6,15% | Não exigida |

As contribuições sociais correspondem a **PIS, COFINS e CSLL**, totalizando **4,65%**. Somadas ao **IRRF de 1,5%**, resultam em **retenções federais totais de 6,15%**.

O ISS é apenas destacado na prévia e não é subtraído do valor líquido. Os perfis permanecem bloqueados até a aprovação das pendências apresentadas pela API.

## Cálculo e Arredondamento

Todos os valores autoritativos são calculados no servidor com:

- valor monetário armazenado em centavos inteiros;
- alíquota armazenada em basis points;
- arredondamento `HALF_UP` aplicado separadamente a cada tributo;
- total federal igual à soma dos componentes já arredondados;
- valor líquido igual ao valor bruto menos as retenções federais.

| Referência de Homologação | IRRF | PIS | COFINS | CSLL | Total Federal | Valor Líquido |
|---|---:|---:|---:|---:|---:|---:|
| AbbVie — R$ 8.055,00 | R$ 120,83 | R$ 52,36 | R$ 241,65 | R$ 80,55 | R$ 495,39 | R$ 7.559,61 |
| 2iM — R$ 10.000,00 | R$ 150,00 | R$ 65,00 | R$ 300,00 | R$ 100,00 | R$ 615,00 | R$ 9.385,00 |

No exemplo AbbVie, a soma dos componentes arredondados produz R$ 495,39. O cálculo agregado de 6,15% produz R$ 495,38. A prévia preserva os componentes individualizados e informa a diferença de arredondamento.

## Abas da Ferramenta

### Simular

Solicita ao servidor a prévia canônica. Não persiste a simulação e não cria solicitação de emissão.

### Histórico

Lista documentos fiscais privados disponíveis ao papel autorizado. O PDF é entregue somente pela rota autenticada, sem endereço público de objeto.

### Perfis

Apresenta razão social, CNPJ, versão, serviço, alíquotas, exigência de Ordem de Compra, estado e razões de bloqueio.

### Adequação

Reúne o roteiro técnico para avaliação futura de IBS/CBS. Não ativa campos fiscais, não altera alíquotas e não afirma aplicabilidade automática à AxiaCare.

### Manual

Reúne o fluxo de uso, as regras dos perfis, os limites operacionais e o acesso à documentação técnica.

## Mensagens Operacionais

| Situação | Significado | Conduta |
|---|---|---|
| Sessão inválida ou expirada | A sessão individual não foi aceita. | Entre novamente no portal AxiaCare. |
| `purchase_order_required` | A Ordem de Compra não foi informada no perfil AbbVie. | Informe o número recebido e repita a simulação. |
| Acesso negado ao histórico ou PDF | O papel fiscal não permite consulta global de documentos. | Solicite a revisão do papel de acesso. |
| `mutations_disabled` — HTTP 423 | A operação solicitada alteraria estado fiscal. | Não contorne o bloqueio. Aguarde a liberação formal do fluxo. |
| Serviço temporariamente indisponível | Uma dependência obrigatória não respondeu com segurança. | Interrompa a operação e repita somente após a normalização. |

## Arquitetura Operacional

| Camada | Componente | Responsabilidade |
|---|---|---|
| Interface | `hub.grupocsv.com/axia/nota-fiscal.html` | Consulta de perfis, simulação, histórico, adequação e manual. |
| Autenticação | `csv-auth` por Service Binding | Valida sessão individual e tenant antes da execução fiscal. |
| API | Worker `nfse-api` em `api.grupocsv.com/nfse/*` | Autoriza, calcula, consulta D1, registra auditoria e entrega PDFs privados. |
| Banco | D1 `csv-hub` | Perfis, versões, papéis, solicitações, snapshots, aprovações, operações, idempotência, documentos, eventos e auditoria. |
| Documentos | R2 `nfse-pdfs` | Bucket privado para PDFs fiscais, sem domínio público. |
| Emissor | `nfse-emitter.service` na VPS-CSV | Serviço privado em `127.0.0.1:8789`, autenticado por HMAC-SHA256 e com mutações bloqueadas. |

## Endpoints Publicados

Base: `https://api.grupocsv.com/nfse`

| Método | Rota | Estado Vigente |
|---|---|---|
| `GET` | `/health` | Saúde pública, sem dados fiscais. |
| `GET` | `/v1/meta` | Metadados operacionais autenticados. |
| `GET` | `/v1/profiles` | Perfis fiscais autenticados. |
| `POST` | `/v1/simulations` | Prévia fiscal sem persistência e sem emissão. |
| `GET` | `/v1/documents` | Documentos privados para auditoria ou administração. |
| `GET` | `/v1/documents/{id}/pdf` | PDF privado com autenticação e auditoria obrigatórias. |
| `POST` | `/v1/requests` | Bloqueado. |
| `POST` | `/v1/requests/{id}/approve` | Bloqueado. |
| `POST` | `/v1/operations/{id}/emit` | Bloqueado. |
| `POST` | `/v1/documents/{id}/cancel` | Bloqueado. |

A rota legada `/api/nf/*` está desabilitada e retorna HTTP 410.

## Controles de Segurança

- CORS restrito a `https://hub.grupocsv.com`.
- Respostas privadas com `Cache-Control: private, no-store, max-age=0`.
- JSON estrito e limitado a 16 KiB na API pública.
- Idempotência obrigatória nas rotas de mutação bloqueadas.
- Auditoria obrigatória antes da entrega de PDF.
- Logs sem conteúdo fiscal, CNPJ, Ordem de Compra, documento ou credencial.
- Bucket privado, sem `r2.dev` e sem domínio customizado.
- Emissor local isolado por `systemd`, em loopback e sem exposição pública direta.

## Gates para Emissão Futura

A emissão somente poderá ser desenvolvida e liberada após:

1. aprovação contábil das pendências de cada perfil;
2. definição versionada da competência, do serviço, do ISS, do arredondamento e da Ordem de Compra;
3. criação de solicitação auditável;
4. aprovação aplicável e segregação de funções;
5. idempotência e prevenção de duplicidade;
6. transmissão controlada pelo emissor privado;
7. reconciliação oficial no Ambiente de Dados Nacional;
8. conferência de XML, DANFSe e valores por três métodos independentes;
9. canário produtivo legítimo, previamente solicitado e sem emissão simbólica de teste;
10. plano de rollback e registro de evidências.

## Referências Oficiais

- [Documentação técnica vigente da NFS-e](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual)
- [APIs de produção e produção restrita](https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/apis-prod-restrita-e-producao)
- [API ADN de contribuintes](https://adn.nfse.gov.br/contribuintes/docs/index.html)
- [SEFIN Nacional](https://sefin.nfse.gov.br/SefinNacional/docs/index)

## Fontes Internas

- Frontend: `grupocsv/hub/axia/nota-fiscal.html`
- Worker e OpenAPI: `grupocsv/backend/workers/nfse-api/`
- Emissor privado: `grupocsv/backend/services/nfse-emitter/`
- PRD: `grupocsv/backend/docs/nfse/PRD_NFSe_AxiaCare_AbbVie_2iM_v3.md`
