---
titulo: Manual Técnico do MCP Extensio
edicao: 2026-11-01
tipo: manual-tecnico-para-agentes
versao_do_pacote: sanitizada
classificacao: publicação no Hub (sanitizada)
worker: extensio-mcp
endpoint: https://mcp-extensio.grupocsv.com/mcp/standard
fachada_oauth: https://mcp-extensio-anthropic.grupocsv.com/mcp
versao_ativa_auditada: c5c4afcc-d80c-436b-8a9a-c9b1690be22f
catalog_sha: 415233a9f562
tools_em_producao: 88
coleta: 2026-11-01T00:11/08:45 (Brasília)
validade: fotografia de 01/11/2026; revalidar contagens e versões ao vivo
---

# Manual Técnico do MCP Extensio

> **Versão sanitizada para o Hub.** O Hub é público. Esta versão omite o detalhamento dos achados de segurança em aberto, o inventário nominal dos secrets e os endereços das contas Google. A versão completa, de acesso restrito, fica na Central de Documentos do Grupo CSV (PDF) e no Panta v1 (pacote em Markdown).

## Regras para agentes (ler antes de agir)

1. Não publicar `extensio-mcp` nem `extensio-mcp-anthropic` a partir de `main` até a reconciliação descrita na seção 11. A versão ativa não tem commit correspondente no GitHub; um deploy de `main` remove 4 tools e reabre falhas já corrigidas.
2. Tratar todo número deste documento como fotografia de 01/11/2026. Antes de citar contagem, versão ou estado, consultar a fonte ao vivo: `health_check` e `tools/list` no MCP, API de deployments da Cloudflare, `pipeline_status`.
3. Conferir o catálogo pelo par contagem e `catalog_sha`: em 01/11/2026, 88 tools e `415233a9f562`. Divergência indica deploy de outra fonte.
4. Nunca reproduzir valores de secrets. Esta versão não cita nomes de secrets; o inventário nominal está na versão completa.
5. Conectores remotos do Claude são configurados na conta Claude, não no `claude_desktop_config.json`. Ver seção 07.
6. Registrar no ACB toda mudança de produção no MCP, com commit, versão gerada, contagem e `catalog_sha`.

## Arquivos deste pacote

| Arquivo | Conteúdo |
|---|---|
| `MANUAL.md` | Este documento: texto integral do manual em Markdown |
| `catalogo-tools.json` | As 88 tools com domínio, modo, função e estado em 01/11/2026 |
| `pendencias.json` | Pendências priorizadas do plano de continuidade |
| `arquitetura.mmd` | Diagrama de arquitetura em Mermaid (relações entre componentes) |

## Apresentação — Escopo, Método e Sumário

Este manual consolida o estado do MCP Extensio em 1º de novembro de 2026, desde a criação do monorepo `grupocsv/extensio`, em 4 de março de 2026. Cada afirmação técnica foi conferida em fonte primária durante esta auditoria: código do GitHub, bundle da versão ativa baixado pela API da Cloudflare, configuração viva dos Workers, telemetria, chamadas somente leitura às próprias tools e documentação oficial de terceiros. Memórias do Hindsight e registros do Agent Context Bridge (ACB) serviram para reconstruir a história e as decisões, sempre confrontados com o que está em produção hoje.

| Fonte | O Que Comprova |
|---|---|
| GitHub `grupocsv/extensio` | Histórico (145 commits em main, HEAD `a360b88` de 28/10), código, 19 branches remotas, 18 PRs e suíte de testes (73/73 aprovados). |
| GitHub `extensio-mcp-anthropic` | Código da fachada OAuth em main e na branch `codex/extensio-oauth-identity`, que é a que está em produção. |
| API Cloudflare | Deployments, 211 versões, 50 bindings, nomes dos 41 secrets, crons e o bundle da versão ativa (469.874 bytes, 28 módulos). |
| Analytics e Observability | Volume de requisições, exceções, agentes de usuário da fachada e falhas do Daily Pipeline. |
| Endpoints públicos | `/health` dos Workers e descoberta OAuth (RFC 8414 e RFC 9728) da fachada. |
| Tools do próprio MCP | Estado das integrações por chamadas somente leitura (24 tools testadas ao vivo). |
| ACB e Hindsight | Marcos, incidentes e decisões registrados por Manus, OpenClaw, Codex e Hermes. |
| Documentação oficial | Anthropic (conectores remotos e OAuth do Claude) e Cloudflare (Cron Triggers). |

> **Convenções.** Horários aparecem em UTC com o equivalente de Brasília (UTC−3). "Verificado" significa conferido nesta auditoria; "não confirmado" indica ausência de evidência suficiente. Nenhum valor de segredo, token ou senha é reproduzido. Conteúdo de mensagens, briefings e dados pessoais lidos durante os testes também não é reproduzido.

## 01 · Sumário Executivo — Saudável no Ar, à Frente do Código

O MCP Extensio é o barramento de ferramentas do ecossistema: um Worker Cloudflare que expõe 88 tools pelo protocolo MCP (JSON-RPC 2.0) para agentes e assistentes, cobrindo WhatsApp, Google Workspace, Notion, GitHub, Cloudflare, Supabase, e-mail, Deck, ACB, Manus e a Central de Documentos.

| Indicador | Valor | Contexto |
|---|---|---|
| Tools em Produção | 88 | tools/list e /health, impressão digital 415233a9f562 |
| Requisições em 7 Dias | 20.188 | 25/10 a 01/11, zero exceções de Worker, cerca de 2.884 por dia |
| Serviços Saudáveis | 12/12 | health_check de 01/11/2026 |
| Versões Publicadas | 211 | De 22/03 a 31/10/2026 |
| Mensagens no D1 | 141.652 | whatsapp-brain às 08h41 de 01/11; 4.765 ingeridas em 7 dias |
| Último Briefing | 26/10 | Daily Pipeline sem créditos do Gemini (HTTP 402) |

> **Atenção.** A produção responde bem e é usada todos os dias por Claude, ChatGPT, Codex e pelos agentes internos. O risco está fora do Worker: a versão ativa não tem commit correspondente no GitHub, a fachada OAuth em produção não está em main e o Daily Pipeline não gera briefing desde 26/10. Um deploy feito hoje a partir de main removeria quatro tools e reabriria uma falha de autenticação já corrigida.

### Principais Achados

| Achado Verificado | Consequência | Prioridade |
|---|---|---|
| Versão ativa `c5c4afcc` (31/10) sem commit no GitHub; quatro tools `whatsapp_agent_*` só existem na branch do PR #18, aberto. | Deploy a partir de main reduz o catálogo e desfaz a correção dos filtros do ACB. | [P0] |
| Gemini sem créditos pré-pagos desde, ao menos, 27/10. | Sem briefing diário, enriquecimento da fila falhando e busca semântica degradada sem aviso ao usuário. | [P0] |
| Fachada OAuth em produção vem de branch não mergeada (PR #1); main ainda autoaprova. | Redeploy de main reabre o acesso sem login humano corrigido em 06/10. | [P0] |
| Achados de segurança de severidade alta em aberto. | Detalhamento, evidência e correção restritos à versão completa, de acesso restrito. | [P0] |
| Código do `whatsapp-source-agent` ausente de todas as 19 branches do GitHub. | Sem reconstrução possível em caso de perda do Worker. | [P1] |
| 11 tools inoperantes por configuração ou serviço externo (Instagram, Crialê, WABA, portal do Hub e 7 do Claude Design). | Catálogo promete funções que falham. | [P1] |
| Documentação defasada: a skill cita 62 tools e a VPS antiga; STATUS.md é de 03/06. | Agentes partem de premissas erradas. | [P2] |

## 02 · Origem e Evolução — De Pré-Processador de WhatsApp a Barramento Universal

O Extensio nasceu como "segundo cérebro" sobre o WhatsApp pessoal de Guilherme: ingestão pela Evolution API, memória vetorial e um briefing diário. O MCP surgiu como a interface de leitura desse acervo e, em abril, virou o ponto único de acesso dos agentes a quase todo o ecossistema. A cronologia abaixo combina o log de main, as versões publicadas na Cloudflare e os registros do ACB e do Hindsight.

**Março de 2026**

- 04/03: Criação do monorepo `grupocsv/extensio` (`1b61ab2`), do D1 `whatsapp-brain` e do Worker `whatsapp-webhook`.
- 22/03: Fases 0 a 3 em um único dia: scaffold do MCP Server, primeiro deploy do Worker `extensio-mcp` (versão `d90205bb`, 19h37 UTC), memória vetorial com embeddings Gemini de 768 dimensões, Daily Pipeline com Service Binding, Gemini e csv-mail, e transcrição de áudios com Whisper.
- 23/03: Inteligência ativa (insights, sentimento, alertas) e Notion no Daily Pipeline v0.6.0; criação do Worker `extensio-daily-pipeline`.

**Abril de 2026**

- 02/04: v1.0.0, o "Barramento Universal", com 24 tools (`33e1368`).
- 03/04: OAuth Google multiconta para Gmail e Calendar, WABA, Google Drive (3 contas) e Tasks, Cloudflare completo e escrita no Supabase.
- 04/04: Daily Pipeline v2.0.0 e v3.0.0: o Worker passa a pré-processar e o briefing fica com o OpenClaw.
- 10–11/04: Checkpoints, filas e orquestrador; keepalive semanal dos tokens OAuth, com o cron ajustado à convenção da Cloudflare (1 = domingo); tools de integração com o Manus.
- 26–27/04: `unified_memory_search` com o projeto csv-brain; mais 18 tools (csv-mail, ACB, Deck, Hub, pipeline e observabilidade); `extensio_inbox`; endpoint MCP padrão JSON-RPC 2.0 em `/mcp/standard` (`54ba2ec`). Em 26/04 a chave Bearer do MCP foi trocada, o que deixou o Daily Pipeline recebendo HTTP 401 do MCP por meses (diagnóstico registrado no ACB em 17/10).
- 29–30/04: Cron de health check a cada 30 minutos criado e desativado no dia seguinte: Workers da mesma conta não se alcançavam por fetch.

**Maio de 2026**

- 13–14/05: `pipeline_status` passa a ler `operational_state`; primeiras correções de HTTP 522 com chamadas por `workers.dev`.
- 20–21/05: `health_check` com 12 serviços; `whatsapp-webhook` v3.0.0 com descrição de imagens por Workers AI; csv-assets-bucket sai da verificação ativa por 522.

**Junho de 2026**

- 03–04/06: Migração do AI Search para o novo endpoint, com fallback para o legado AutoRAG.
- 06/06: Criação da fachada `extensio-mcp-anthropic`: primeira tentativa com Cloudflare Access como OAuth (`f1ff8b8`), descartada no mesmo dia por `@cloudflare/workers-oauth-provider` com autoaprovação (`b0efd8f`).
- 12/06: Bindings `OPEN_PAGES_KV` e `OPEN_AUTH_KV`; tools do portão de acesso das Open Pages.
- 17/06: Conta ICDS no OAuth e `login_hint` para forçar a conta correta.

### Do Barramento ao Ecossistema Multiagente

**Julho de 2026**

- 06/07: Projetos Supabase gabi-care e spectra-warehouse entram no catálogo; criale marcado como fora do escopo Grupo CSV.
- 10/07: Service Binding `MAIL → csv-mail` elimina o 522 do `mail_send` (`f3a760d`, versão `35d68b58`).
- 26/07: `manus_create_task` migra para a API v2 com harness completo e parâmetro `origin`, aberto a qualquer agente.

**Agosto de 2026**

- 03/08: Claude Design: a integração por OAuth com PKCE é substituída pelo Design Service na VPS-CSV.
- 20/08: Conta ICDS removida do keepalive (conta excluída); o OAuth Google fica com 8 contas.
- 24/08: Central de Documentos: 9 tools por Service Binding `DOCUMENTS → csv-documents`.

**Setembro de 2026**

- 16/09: Ymunity: agente clínico no OpenClaw e tools `ymunity_sheet_*` com confirmação explícita, expiração e proteção contra replay.
- 22/09: Falha de segurança registrada no ACB: a fachada OAuth emitia token sem autenticação humana (DCR, código e token sem login). A conexão do Notion foi bloqueada.
- 27–29/09: Contingência entre provedores de modelo no OpenClaw e proteção contra o limite do OpenRouter.

**Outubro de 2026**

- 06/10: Fachada passa a exigir identidade Cloudflare Access e consentimento explícito (`9b3a9f3` e `5017cfa`, versão `8a22ef65`); fluxo validado com o ChatGPT.
- 12–16/10: Agente editorial privado no OpenClaw (coleta por grupo, imagens, áudio citado).
- 17/10: Catálogo único com contagem e impressão digital no `/health` (`7d92536`); filtro de período nas tools do WhatsApp Brain; carga do histórico Evolution → D1 com ledger e rollback; rotas de leitura do webhook com token; falha visível no Daily Pipeline.
- 19/10: OAuth Google com link por conta, página de escolha, `select_account` e `consent`; Gmail informa token revogado; conta Unimed reautorizada após troca de senha.
- 22/10: ACB registra catálogo ao vivo de 83 tools e corrige documentos que ainda citavam 62.
- 25–26/10: Criação do `whatsapp-source-agent`; versão `436424ec` sem mensagem; PR #15 (consolidação do briefing) e PR #16 (resolvedor de evidências) mergeados.
- 27/10: Primeiro registro, na janela observada, do erro Gemini 402 no orquestrador do Daily Pipeline.
- 28/10: Change feed incremental do WhatsApp (PR #17, versão `0e3fcbb9`); catálogo chega a 88 tools.
- 31/10: Versão ativa `c5c4afcc`, "ACB: corrigir filtros; fonte ativa 210 e catálogo de 88 preservados", publicada por Wrangler sem commit no GitHub. O PR #18 (compatibilidade Cue), aberto em 29/10, segue sem merge.
- 01/11: Daily Pipeline falha novamente às 06h00 de Brasília pelo mesmo erro 402; esta auditoria.

> **Leitura da trajetória.** Em oito meses o MCP passou de 24 para 88 tools e de um consumidor (o Daily Pipeline) para pelo menos nove. Três padrões se repetem: produção à frente do código versionado, falhas entre Workers da mesma zona resolvidas com Service Binding e dependência de um único provedor de LLM.

## 03 · Arquitetura em Produção — Um Worker Central, Duas Portas de Entrada

Todo acesso converge para o Worker `extensio-mcp`. Clientes hospedados que exigem OAuth (Claude e ChatGPT) entram pela fachada `extensio-mcp-anthropic`, que autentica o usuário, injeta a chave interna e repassa a chamada por Service Binding. Agentes internos (conector Manus, Claude Code e csv-mcp na VPS-CSV, OpenClaw, Hermes, ECC e Cue) chamam o endpoint diretamente com Bearer. O Daily Pipeline usa o mesmo Worker por Service Binding próprio.

Diagrama de arquitetura em texto: ver `arquitetura.mmd` neste pacote.

*Figura 1 · Fluxos verificados em 01/11/2026: Service Bindings pela API Cloudflare, consumidores por telemetria, ACB e configuração dos conectores*

Dos 62 scripts da conta Cloudflare, apenas dois apontam para o `extensio-mcp` por Service Binding: `extensio-daily-pipeline` (binding `MCP_SERVICE`) e `extensio-mcp-anthropic` (binding `EXTENSIO_MCP`). O WhatsApp Brain é alimentado por dois Workers que não passam pelo MCP: `whatsapp-webhook`, que grava mensagens recebidas da Evolution API, e `whatsapp-source-agent`, que produz resumos e itens abertos com modelos via OpenRouter. O MCP lê o mesmo D1.

## 04 · Componentes e Infraestrutura — Workers, Bindings e Runtime

| Worker | Papel | Endereço | Deploy Ativo |
|---|---|---|---|
| `extensio-mcp` | Servidor MCP com 88 tools | `mcp-extensio.grupocsv.com` e `extensio-mcp.guilherme-thom.workers.dev` | 31/10 · `c5c4afcc` |
| `extensio-mcp-anthropic` | Fachada OAuth 2.1 (v2.2.0) | `mcp-extensio-anthropic.grupocsv.com` | 06/10 · `8a22ef65` |
| `extensio-daily-pipeline` | Briefing diário (v5.0.0) e fila `extensio-enrichment` | `extensio-daily-pipeline.guilherme-thom.workers.dev` | 26/10 · `fe9b8c5f` |
| `whatsapp-webhook` | Ingestão Evolution API → D1 | `webhook.grupocsv.com` (wrangler.toml) | 17/10 |
| `whatsapp-source-agent` | Resumos e itens abertos (OpenRouter) | Sem rota pública verificada | 26/10 · `fd0b3698` |
| `csv-mail` | E-mail transacional (binding `MAIL`) | `csv-mail.guilherme-thom.workers.dev` | 28/10 |
| `csv-documents` | Central de Documentos (binding `DOCUMENTS`) | Acesso por Service Binding | 16/09 |

### Bindings do extensio-mcp

A API registra 50 bindings: 41 secrets, 3 variáveis de texto, 2 bancos D1, 2 namespaces KV e 2 Service Bindings. O inventário nominal dos secrets consta apenas na versão completa.

| Binding | Tipo | Destino | Uso Principal |
|---|---|---|---|
| `WHATSAPP_DB` | D1 | `whatsapp-brain` · `db907899…` | Mensagens, contatos, resumos, alertas, fila do agente, Ymunity |
| `HUB_DB` | D1 | `csv-hub` · `6fac03eb…` | Deck, memórias, anti-spam de alertas de saúde |
| `MAIL` | Service | `csv-mail` | `mail_*`, alertas do keepalive e de cron |
| `DOCUMENTS` | Service | `csv-documents` | `documents_*` |
| `OPEN_PAGES_KV` | KV | `7a21d052…` | Metadados das Open Pages |
| `OPEN_AUTH_KV` | KV | `2818feae…` | Portão de acesso das Open Pages |
| `AI_SEARCH_ENDPOINT` e `_LEGACY` | Variável | AI Search `hub-csv` | `search_hub_knowledge` |
| `ENVIRONMENT` | Variável | `production` | Sem referência no bundle ativo |

### Runtime e Empacotamento

| Atributo | Valor Verificado |
|---|---|
| Configuração | `compatibility_date` 2026-03-20, flag `nodejs_compat`, modelo de uso standard, placement padrão |
| Bundle ativo | 469.874 bytes, 28 módulos, handlers `fetch` e `scheduled` |
| Exposição | Rota `mcp-extensio.grupocsv.com/*`, `workers.dev` e previews habilitados |
| Observabilidade | Workers Logs desabilitado; sem Logpush e sem tail consumers |
| Pacote `packages/mcp` | `package.json` 0.1.0 (o servidor se anuncia 1.0.0); dependências `@modelcontextprotocol/sdk` ^1.29.0, `agents` ^0.11.6, `fast-xml-parser` 5.11.1, `fflate` 0.8.3 |
| Testes | 10 arquivos, 73 testes, 73 aprovados em main (`node --test test/*.test.mjs`, após `npm install`) |

## 05 · Protocolo e Rotas HTTP — JSON-RPC sem Estado sobre HTTP

O handler `mcp-handler.js` implementa MCP em JSON-RPC 2.0 sem sessão: cada POST é independente, lotes são aceitos, notificações recebem 202 e GET recebe 405. O servidor anuncia `protocolVersion` 2024-11-05 e `serverInfo` `extensio-mcp` 1.0.0, com os métodos `initialize`, `ping`, `tools/list` e `tools/call`. Não há resources, prompts nem streaming por SSE.

| Rota | Método | Autenticação | Função |
|---|---|---|---|
| `/health` | GET | Pública | Contagens do D1 e do Supabase, `tools.count` e `catalog_sha` (12 hexadecimais) |
| `/mcp/standard` | POST | Bearer | Endpoint MCP JSON-RPC 2.0, usado por todos os clientes e pela fachada |
| `/mcp/tools/list` e `/mcp/tools/call` | POST | Bearer | API REST anterior ao MCP padrão, mantida para scripts e ECC |
| `/keepalive` | GET | Bearer | Execução manual do keepalive dos tokens Google |
| `/oauth/authorize` | GET | Pública | Inicia o OAuth Google por conta; sem conta, mostra página de escolha |
| `/oauth/callback` | GET | Pública | Callback do OAuth Google por conta |
| `/oauth/claude-design/*` | GET | — | Resíduo da integração OAuth do Claude Design, substituída em 03/08; não usar |
| `OPTIONS` em qualquer rota | OPTIONS | Pública | Preflight CORS |

### Chamadas de Referência

```bash
# Saúde e impressão digital do catálogo (pública)
curl -s https://mcp-extensio.grupocsv.com/health | jq '.tools'
# {"count":88,"catalog_sha":"415233a9f562"} em 01/11/2026

# Lista de tools pelo endpoint MCP (Bearer interno em $MCP_BEARER, nunca no código)
curl -s https://mcp-extensio.grupocsv.com/mcp/standard \
  -H "Authorization: Bearer $MCP_BEARER" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'

# Chamada de tool
curl -s https://mcp-extensio.grupocsv.com/mcp/standard \
  -H "Authorization: Bearer $MCP_BEARER" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"health_check","arguments":{}}}'
```

Sem Bearer, `POST /mcp/standard` responde 401 com `{"error":"Unauthorized"}` (verificado). A latência do `/health` ficou entre 2,5 e 4,5 segundos nas medições desta auditoria, porque a rota consulta D1 e Supabase a cada chamada; ela não serve como teste de disponibilidade de alta frequência.

> **Impressão digital do catálogo.** Desde 17/10, `/health` publica a contagem de tools e os 12 primeiros caracteres de um hash do catálogo. Compare os dois valores antes e depois de qualquer deploy: mudança de `catalog_sha` sem mudança intencional de tools indica publicação a partir de outra fonte.

## 06 · Autenticação e Fachada OAuth — Três Camadas de Autenticação

A entrada direta usa uma chave Bearer estática, mantida como secret do Worker. A fachada injeta essa chave em cada chamada repassada. A fachada OAuth 2.1 atende os clientes hospedados que não aceitam chave fixa. Na direção oposta, o Extensio é cliente OAuth do Google para oito contas (seção 8).

### Fluxo da Fachada em Produção (Versão 8a22ef65)

1. **Descoberta.** `POST /mcp` sem token devolve 401 com `WWW-Authenticate: Bearer resource_metadata=".../.well-known/oauth-protected-resource/mcp"`. O documento de recurso protegido declara `resource` `https://mcp-extensio-anthropic.grupocsv.com/mcp`; o metadata do servidor (RFC 8414) anuncia PKCE S256, `registration_endpoint` e `client_id_metadata_document_supported: false`.
2. **Registro dinâmico.** O cliente se registra em `/register` (DCR). Como CIMD não é anunciado, o Claude usa DCR.
3. **Identidade humana.** `GET /authorize` redireciona (302) para o Cloudflare Access, aplicação "Extensio MCP OAuth": login por código de uso único enviado por e-mail, sessão de 1 hora, política que só admite `guilherme@grupocsv.com`. O Worker valida o JWT do Access (RS256, emissor, audiência, tipo e e-mail na allowlist).
4. **Validação da requisição.** `response_type=code`, `state` até 2.048 caracteres, `redirect_uri` idêntico a um item da allowlist e ao registrado no DCR, PKCE S256 obrigatório, escopo `extensio:access` e `resource` canônico.
5. **Consentimento.** Página com cookie `__Host-extensio-approval`, token CSRF e prazo; o POST exige `Origin` exato, `Sec-Fetch-Site: same-origin` e a mesma identidade. A autorização é concluída com o e-mail como `userId` e redirecionamento 303 com `iss`.
6. **Tokens.** `/token` emite access e refresh token, guardados no KV `OAUTH_KV` (`8c10d07b…`); revogação no mesmo endpoint.
7. **Proxy.** `POST /mcp` com token válido passa por allowlist de cabeçalhos (`content-type`, `accept`, `mcp-protocol-version`, `mcp-session-id`, `last-event-id`), recebe a chave Bearer do MCP e segue por Service Binding para `/mcp/standard`. Redirecionamentos viram 502 e as respostas levam `Cache-Control: no-store`.

| Redirect URI Permitido | Cliente |
|---|---|
| `https://claude.ai/api/mcp/auth_callback` | Claude web, Desktop (Windows e macOS), Cowork e apps móveis |
| `https://chatgpt.com/connector_platform_oauth_redirect` | ChatGPT (plataforma de conectores) |
| `https://chatgpt.com/connector/oauth/x8aAfqB82Dta` | ChatGPT (conector específico) |

As variáveis `TEAM_DOMAIN` e `POLICY_AUD` permanecem como resíduo da tentativa de 06/06 e não são usadas.

## 07 · Conexão no Claude e em Outros Clientes — O Conector Pertence à Conta, Não ao Computador

Segundo a documentação oficial da Anthropic consultada em 01/11/2026, conectores personalizados remotos existem em todos os planos (no Free, limitados a um), são configurados na conta Claude e acessados a partir da infraestrutura da Anthropic, em todos os clientes: claude.ai, Claude Desktop, Cowork e apps móveis. O arquivo `claude_desktop_config.json` do Windows serve a servidores MCP locais, que não ficam disponíveis no Cowork nem no claude.ai. Para o Extensio, portanto, não há configuração a fazer no Windows: a conexão feita uma vez na conta aparece no Desktop e no Cowork.

> **Verificado.** A telemetria da fachada registra chamadas `POST /mcp` com agente de usuário `Claude-User` em todos os dias de 25 a 31/10, além de `openai-mcp/1.0.0` (ChatGPT e Codex). Não houve `/authorize` nem `/register` no período: as conexões já existentes renovam o acesso por refresh token.

### Passo a Passo no Claude

1. Abrir **Customize › Connectors** (`claude.ai/customize/connectors`) e escolher **+ Add › Add custom connector**.
2. Informar um nome e a URL `https://mcp-extensio-anthropic.grupocsv.com/mcp`, com o caminho `/mcp`, que precisa coincidir com o `resource` anunciado.
3. Em autenticação, manter OAuth com registro automático (DCR). Não informar cabeçalhos nem chave.
4. Na janela de login, receber o código do Cloudflare Access em `guilherme@grupocsv.com`, aprovar a tela de consentimento e concluir.
5. Em cada conversa, ativar o conector pelo menu **+ › Connectors**. Para alterar a configuração, remover e adicionar de novo.

### Matriz de Clientes

| Cliente | Entrada | Autenticação | Estado em 01/11 |
|---|---|---|---|
| Claude web, Desktop e Cowork | Fachada | OAuth DCR + Access | [Em uso diário] |
| ChatGPT e Codex | Fachada | OAuth + Access | [Em uso] |
| Conector Manus `extensio` | Direta | Bearer | [Testado nesta auditoria] |
| Claude Code e csv-mcp (VPS-CSV) | Direta | Bearer | [Registro no ACB] |
| Claude Code pela fachada | Fachada | Callback loopback | [Incompatível] |
| OpenClaw, Hermes, ECC e Cue | Direta | Bearer | [Registro no ACB] |
| Daily Pipeline | Service Binding | Bearer interno | [Ativo] |

O Claude Code usa callback em `localhost` ou `127.0.0.1` com porta variável, ausente da allowlist da fachada; por isso conecta direto com Bearer. Limites documentados pela Anthropic para claude.ai e Desktop: cerca de 150.000 caracteres por resultado e 240 segundos por chamada de tool. A orientação anterior de configurar o Extensio pelo `claude_desktop_config.json` estava errada e fica substituída por esta seção.

## 08 · OAuth Google e Keepalive — Oito Contas, Um Cliente OAuth

Gmail, Calendar, Drive e Tasks usam um único cliente OAuth do Google e um refresh token por conta, cada um guardado como secret do Worker. O alias é resolvido a partir do parâmetro `account` das tools, que aceita sinônimos (por exemplo, `axiacare` resolve para `axcare`).

| Alias | Workspace | Observação |
|---|---|---|
| `pessoal` | Gmail | Conta do Google Tasks (lista principal) |
| `guithome` | guithome.com.br |  |
| `grupocsv` | grupocsv.com | Padrão de `gmail_send` e `drive_*` |
| `contato` | grupocsv.com |  |
| `axcare` | grupocsv.com |  |
| `medvalor` | grupocsv.com |  |
| `thera` | grupocsv.com |  |
| `unimed` | unimedgv.com.br | Reautorizada em 19/10 após troca de senha |

Teste de 01/11: `gmail_search` consultou as 8 contas sem falha. O mapa ainda contém o alias `icds`, mas a conta foi excluída em 20/08 e não há secret correspondente. Escopos solicitados: `gmail.modify`, `calendar`, `calendar.events`, `drive.readonly` e `tasks`.

### Reautorização de Uma Conta

1. Abrir `https://mcp-extensio.grupocsv.com/oauth/authorize?account=<alias>`. O Google pede escolha de conta e consentimento (`prompt=select_account consent`, com `login_hint`).
2. Gravar o novo token como secret do Worker (`npx wrangler secret put <SECRET_DA_CONTA> --name extensio-mcp`), sem colar o valor em chat, e-mail ou documento. O nome do secret de cada conta consta na versão completa.
3. Validar com uma busca mínima em `gmail_search` na conta e registrar a troca no Arsenal Técnico, sem o valor.

### Keepalive Semanal

O único cron do `extensio-mcp` é `0 12 * * 1`. Na Cloudflare, o dia 1 é domingo e os crons rodam em UTC: o keepalive executa aos domingos, 12h00 UTC (09h00 em Brasília), exercita os oito refresh tokens e envia por e-mail, via binding `MAIL`, um alerta com link pronto de reautorização para cada conta que falhar. No domingo 25/10, o minuto das 12h00 UTC registrou 18 subrequisições, contra 10 no mesmo minuto da segunda e da terça seguintes. O Google revoga refresh tokens com escopo de Gmail quando a senha da conta muda; é a causa mais frequente de `invalid_grant` no histórico.

## 09 · Catálogo de Tools — 88 Tools em 15 Domínios

Catálogo extraído de `tools/list` em 01/11/2026 e conferido contra o bundle ativo. Modo: L para leitura, E para escrita ou disparo. Estado: [OK] testada ao vivo nesta auditoria; [Teste Unitário] coberta pela suíte de main, sem chamada ao vivo; [Degradada] responde com perda de função; [Erro] falha ou depende de configuração ausente; [Não Testada] escrita ou dado pessoal, não exercitada.

| Tool | Modo | Função | Estado em 01/11 |
|---|---|---|---|
| **WhatsApp Brain e Inteligência · 11** | | | |
| `get_whatsapp_context` | L | Mensagens recentes do WhatsApp pessoal com remetente, direção e conversa | [Teste Unitário] |
| `get_whatsapp_triggers` | L | Gatilhos de volume alto e palavras-chave críticas | [Teste Unitário] |
| `get_conversation_insights` | L | Conversas agrupadas por JID, com resumo em cache no D1 | [Teste Unitário] |
| `store_conversation_summary` | E | Grava resumo enriquecido: sentimento, urgência, decisões e ações | [Não Testada] |
| `manage_alerts` | L/E | Lista, cria e reconhece alertas (`trigger_events`) | [Não Testada] |
| `whatsapp_agent_search` | L | Busca em resumos derivados, com IDs das mensagens de origem | [Não Testada] [Fora de main] |
| `whatsapp_agent_get_daily_summary` | L | Resumo diário na data de Brasília | [Não Testada] [Fora de main] |
| `whatsapp_agent_open_items` | L | Itens possivelmente abertos e dias sem fechamento | [Não Testada] [Fora de main] |
| `whatsapp_agent_status` | L | Fila, totais e custo do agente, sem conteúdo de mensagens | [OK] [Fora de main] |
| `whatsapp_agent_get_change_feed` | L | Log incremental de mudanças por cursor, sem conteúdo | [Teste Unitário] |
| `waba_context` | L | Histórico de um contato no D1 `whatsapp-brain` | [Não Testada] |
| **Memória e Conhecimento · 5** | | | |
| `search_hub_knowledge` | L | Busca semântica no AI Search `hub-csv` | [Degradada] |
| `store_memory` | E | Memória no Supabase extensio-brain com embedding Gemini | [Afetada pelo 402] |
| `retrieve_memory` | L | Busca textual e vetorial de memórias | [Degradada] |
| `unified_memory_search` | L | Busca federada em `csv_facts`, ACB, Deck e Notion | [Degradada] |
| `extensio_inbox` | E | Classifica texto livre com `gemini-2.5-flash` e roteia para a tool | [Afetada pelo 402] |
| **Notion · 4** | | | |
| `notion_search` | L | Busca páginas e bases, devolvendo todas as propriedades | [OK] |
| `notion_read` | L | Lê página por ID: propriedades e conteúdo | [Não Testada] |
| `notion_query_database` | L | Consulta base com filtros e ordenação | [Não Testada] |
| `notion_write` | E | Cria página, atualiza propriedades e acrescenta blocos | [Não Testada] |

### Desenvolvimento, Dados e Google

| Tool | Modo | Função | Estado em 01/11 |
|---|---|---|---|
| **GitHub · 4** | | | |
| `github_repos` | L | Repositórios por organização ou usuário | [OK] |
| `github_issues` · `github_prs` · `github_commits` | L | Issues, pull requests e commits de um repositório | [Não Testadas] |
| **Cloudflare · 6** | | | |
| `cloudflare_status` | L | Lista Workers, D1, KV e R2 da conta | [OK] |
| `d1_query` | L/E | SQL em qualquer D1 da conta, inclusive escrita e DDL | [Não Testada] |
| `kv_operate` | L/E | list, get, put e delete em KV | [Não Testada] |
| `r2_operate` | L | Lista objetos e obtém URL pública | [Não Testada] |
| `dns_manage` | L/E | list, create, update e delete de registros DNS | [Não Testada] |
| `zones_list` | L | Zonas da conta, com IDs e nameservers | [OK] |
| **Supabase · 2** | | | |
| `supabase_query` | L/E | select, insert, update e upsert nos projetos configurados | [Não Testada] |
| `supabase_list_projects` | L | Projetos e estado de configuração: 4 de 7 configurados | [OK] |
| **Google Workspace · 9** | | | |
| `gmail_search` | L | Busca nas 8 contas | [OK] |
| `gmail_read` | L | Mensagem ou thread completa de uma conta | [Não Testada] |
| `gmail_send` | E | Envio pela conta escolhida (padrão `grupocsv`) | [Não Testada] |
| `calendar_events` | L/E | list, get, create, update e delete de eventos | [Não Testada] |
| `drive_search` | L | Busca no Drive em 3 contas: grupocsv, pessoal e unimed | [Não Testada] |
| `drive_read` | L | Exporta Docs, Sheets e Slides; lê texto e XLSX | [Não Testada] |
| `drive_list_folders` | L | Estrutura de pastas do Drive | [Não Testada] |
| `tasks_lists` | L | Listas do Google Tasks da conta pessoal | [OK] |
| `tasks_manage` | L/E | list, get, create, update e complete de tarefas | [Não Testada] |
| **Ymunity · 3** | | | |
| `ymunity_sheet_propose` | L | Prévia de alteração na Planilha Oficial Ymunity, sem escrita | [Teste Unitário] |
| `ymunity_sheet_commit` | E | Autoriza prévia confirmada e delega a escrita; bloqueia expiração, replay e conflito | [Teste Unitário] |
| `ymunity_sheet_status` | L | Valida o resultado estruturado da escrita delegada | [Teste Unitário] |

Supabase configurados: extensio (extensio-brain), csvbrain, axiacare e criale (este fora do escopo Grupo CSV). Não configurados: spectra (sem secrets), spectra-warehouse (só a URL) e gabi-care. Para gabi-care os dois secrets existem pelo nome, mas a tool os avalia como vazios; o conteúdo não pôde ser verificado.

### Comunicação, Agentes e Hub

| Tool | Modo | Função | Estado em 01/11 |
|---|---|---|---|
| **Comunicação · 5** | | | |
| `mail_send` | E | Envio pelo csv-mail via Service Binding `MAIL` | [Validada em 10/07] |
| `mail_status` | L | Último evento de entrega de um e-mail | [Validada em 10/07] |
| `mail_logs` | L | Últimos envios do csv-mail; o erro 500 de julho não ocorre mais | [OK] |
| `resend_context` | L/E | Visão geral do Resend, status e envio direto | [Não Testada] |
| `waba_send` | E | WhatsApp Business via Zapier | [Sem ZAPIER_MCP_API_KEY] |
| **Serviços Externos · 4** | | | |
| `stripe_context` | L | Saldo, clientes, assinaturas e pagamentos recentes | [OK] |
| `vps_status` | L | VM Hostinger do OpenClaw (em execução, 8 vCPU, 32 GB) | [OK] |
| `instagram_insights` | L | Métricas da conta e dos posts | [Sem INSTAGRAM_TOKEN] |
| `criale_tasks` | L/E | Tarefas do Crialê Core | [Erro: resposta não JSON] |
| **Agentes e Orquestração · 8** | | | |
| `manus_create_task` | E | Tarefa Manus pela API v2 com harness completo e `origin` | [Teste Unitário] |
| `manus_task_status` | L | Status, perfil, última resposta e créditos de uma tarefa | [Teste Unitário] |
| `manus_list_tasks` | L | Tarefas recentes | [OK] |
| `acb_log` | E | Registra atividade, decisão ou arquivo no ACB | [Não Testada] |
| `acb_search` | L | Busca atividades e decisões por texto, projeto e agente | [OK] |
| `deck_card` · `deck_note` · `deck_memory` | L/E | Cards, notas do dia e memórias do Deck (D1 `csv-hub`) | [Não Testadas] |
| **Hub e Open Pages · 5** | | | |
| `open_page_publish` | E | Publica HTML no R2 e metadados no KV, com verificação da gravação | [Não Testada] |
| `open_page_list` | L | Open Pages com slug, título, URL e estado (33 registros) | [OK] |
| `hub_portal_access` | L | Senha de portal de parceiro do Hub | [Sem CSV_CONFIG_KV] |
| `open_auth_set_password` | E | Senha do portão de uma Open Page, sem exibi-la | [Não Testada] |
| `open_auth_logins` | L | Logins do portão: e-mail, página, horário e IP | [Não Testada] |

O `criale_tasks` chama `criale-core.guilherme-thom.workers.dev` sem `CRIALE_API_KEY`.

### Documentos, Operação e Design

| Tool | Modo | Função | Estado em 01/11 |
|---|---|---|---|
| **Central de Documentos · 9** | | | |
| `documents_list` · `documents_get` | L | Lista e metadados de documentos por tenant | [Teste Unitário] |
| `documents_search` | L | Busca, conforme a capacidade da Central | [Não Testada] |
| `documents_status` | L | Estado de job de processamento; exige `tenant_id` | [Não Testada] |
| `documents_download` | L | Até 8 MiB em Base64, sem revelar bucket ou chave do objeto | [Teste Unitário] |
| `documents_publish` | E | Cria documento ou nova versão, com chave de idempotência | [Teste Unitário] |
| `documents_manage` | E | Metadados, versões, arquivamento e exclusão lógica | [Teste Unitário] |
| `documents_public_links` | L/E | Links públicos curtos mediados pela API | [Teste Unitário] |
| `documents_deletion_requests` | L/E | Pedidos de exclusão lógica e decisão | [Teste Unitário] |
| **Pipeline e Observabilidade · 6** | | | |
| `pipeline_run` | E | Dispara manualmente o Daily Pipeline | [Não Testada] |
| `pipeline_status` | L | Último briefing gerado (26/10, 13h24 UTC) | [OK] |
| `memory_sync_run` | E | Dispara o CSV Memory Sync | [Não Testada] |
| `memory_sync_status` | L | Lê `csv_sync_log`, cuja última linha é de 23/08 | [Desatualizada] |
| `health_check` | L | Saúde de 12 serviços do ecossistema, com latência | [OK] |
| `ecosystem_status` | L | Saúde e contagens de fatos, sessões e atividades | [OK] |
| **Claude Design · 7** | | | |
| `claude_design_status` | L | Estado do Design Service na VPS-CSV | [Erro 401] |
| `claude_design_list_systems` · `_list_projects` | L | Design Systems e projetos disponíveis | [Dependem do Serviço] |
| `claude_design_generate` · `_iterate` · `_get_status` · `_export` | E | Geração, iteração, acompanhamento e exportação de artefatos | [Dependem do Serviço] |

### Divergência de Catálogo entre Produção e main

main define 85 tools. Destas, 84 estão em produção; `whatsapp_agent_get_evidence`, mergeada em 26/10 pelo PR #16, nunca entrou no bundle ativo. Produção tem 4 tools que main não tem (`whatsapp_agent_search`, `_get_daily_summary`, `_open_items` e `_status`), versionadas apenas no commit `fb055b0` da branch `feat/cue-ecosystem-20261029`, criado em 29/10 para "preservar consultas WhatsApp na base versionada". A conta fecha: 85 − 1 + 4 = 88.

> **Degradação silenciosa.** Com o Gemini em 402, `retrieve_memory` cai para busca textual e `unified_memory_search` deixa de consultar `csv_facts` sem informar a falha na resposta (o erro só vai para o log, que está desligado neste Worker). No teste de 01/11 a busca federada usou três das quatro fontes. O `claude_design_status` recebeu 401 `authentication_required` do endereço `hooks.grupocsv.com/design`; a causa não foi confirmada.

## 10 · Dados e Segredos — Onde Estão os Dados e as Chaves

| Armazenamento | Conteúdo | Volume Verificado |
|---|---|---|
| D1 `whatsapp-brain` | 32 tabelas (com FTS): `messages`, `contacts`, `conversation_summaries`, `trigger_events`, `whatsapp_agent_*`, `whatsapp_message_changes`, `ymunity_sheet_confirmations` | 419,3 MiB; 141.652 mensagens desde 24/12/2023; 1.590 contatos; 367 resumos; 68 alertas pendentes |
| D1 `csv-hub` | 93 tabelas do Hub, Deck, memórias e `health_alerts` | 19,5 MiB |
| Supabase extensio-brain | Memórias vetoriais do Extensio (768 dimensões) | 8.269 memórias (8.268 às 00h18) |
| Supabase csv-brain | ACB e memória consolidada do ecossistema | 250.773 fatos; 7.528 sessões; 5.108 atividades |
| KV `OPEN_PAGES_KV` e `OPEN_AUTH_KV` | Metadados e portão das Open Pages | 33 páginas registradas |
| KV `OAUTH_KV` (fachada) | Clientes DCR, grants e tokens OAuth | Não contado |

A fila do `whatsapp-source-agent` tinha, em 01/11, 11.867 itens pendentes, 2.187 concluídos e 9 com falha; a fila diária, 319 pendentes, 37 concluídos e 1 com falha. O custo informado pelo OpenRouter no mês foi de US$ 0,068 em 16 chamadas. A ingestão dos últimos sete dias somou 4.765 mensagens, com média de 681 por dia.

### Secrets

O `extensio-mcp` mantém 41 secrets, agrupados em autenticação do MCP (1), Google OAuth (11), Supabase (11), Cloudflare (4), serviços do ecossistema CSV (5) e terceiros (9). Há secrets sem uso no código e variáveis lidas pelo código que não estão configuradas; essas ausências explicam parte das tools inoperantes do catálogo. O inventário nominal e a lista de órfãos e ausentes constam apenas na versão completa.

## 11 · Deploy, Versões e Rollback — Nenhum Deploy a Partir de main Até a Reconciliação

O código do MCP fica em `packages/mcp` do monorepo `grupocsv/extensio`. O `wrangler.toml` de main reproduz a configuração viva (nome, rota, D1, KV, Service Bindings, variáveis e cron). O problema é o conteúdo: a versão ativa foi publicada por Wrangler em 31/10, às 18h07 UTC, com a etiqueta `acb-filters-44a0af028714`, e nenhuma das 19 branches remotas contém esse código.

| Item | GitHub (main a360b88) | Produção (c5c4afcc) |
|---|---|---|
| Tools `whatsapp_agent_search`, `_get_daily_summary`, `_open_items`, `_status` | Ausentes (só em `fb055b0`, PR #18 aberto) | Presentes |
| `whatsapp_agent_get_evidence` | Presente (PR #16) | Ausente |
| Correção dos filtros do ACB | Ausente | Presente |
| Fachada OAuth com Access e consentimento | Ausente em main da fachada (PR #1 aberto) | Presente (`8a22ef65`) |
| Código do `whatsapp-source-agent` | Ausente de todas as branches | Presente (`fd0b3698`) |

### Procedimento de Publicação

```bash
# 1. Fonte única: VPS-CSV, ~/repos/grupocsv/extensio, depois de git pull
cd packages/mcp && npm install && npm test        # 73/73 esperado
# 2. Registrar o estado anterior
curl -s https://mcp-extensio.grupocsv.com/health | jq '.tools'
npx wrangler versions list --name extensio-mcp
# 3. Publicar com mensagem rastreável ao commit
npx wrangler deploy --message "<commit>: <descrição>"
# 4. Conferir contagem, impressão digital e saúde
curl -s https://mcp-extensio.grupocsv.com/health | jq '.tools'
# 5. Se algo regredir
npx wrangler rollback c5c4afcc-d80c-436b-8a9a-c9b1690be22f --name extensio-mcp -m "<motivo>"
```

Sintaxe conferida no Wrangler 4.156.0. Antes de publicar, confirme que a branch contém as 88 tools e a correção do ACB: a contagem deve continuar 88 e o `catalog_sha` só pode mudar quando houver mudança intencional no catálogo. Registre no ACB o commit, a versão gerada e o par contagem e impressão digital.

### Pontos de Rollback Verificados

| Versão | Data (UTC) | Conteúdo |
|---|---|---|
| `c5c4afcc-d80c-436b-8a9a-c9b1690be22f` | 31/10 18:07 | Ativa: filtros do ACB, 88 tools |
| `0e3fcbb9-fdb8-4ee3-8bf3-b744e458f049` | 28/10 04:16 | Change feed incremental do WhatsApp |
| `436424ec-21cf-4cb0-9fe1-9d674e21dce9` | 25/10 18:15 | Sem mensagem; anterior ao change feed |
| `35d68b58-3910-4292-93f8-8001ede44c6b` | 10/07 | Correção do 522 do `mail_send` |

## 12 · Operação e Observabilidade — Rotinas, Uso e Sinais Vitais

| Worker | Cron (UTC) | Horário de Brasília | Função |
|---|---|---|---|
| `extensio-mcp` | `0 12 * * 1` | Domingo, 09h00 | Keepalive dos 8 tokens Google |
| `extensio-daily-pipeline` | `0 9 * * *` | Diário, 06h00 | Briefing (orquestrador com fallback legado) |
| `whatsapp-source-agent` | `*/10 * * * *` e `0 10 * * *` | A cada 10 min; 07h00 | Ciclo do agente e rotina diária |
| `whatsapp-webhook` | `0 3 * * *` | Diário, 00h00 | Limpeza de `webhook_logs` |

O health check a cada 30 minutos (`cronHealthCheck`, com anti-spam em `health_alerts`) existe no código, mas não está agendado desde 30/04.

### Uso em Sete Dias (25/10 03h00 a 01/11 03h00 UTC)

| Worker | Requisições | Média Diária | Exceções | CPU |
|---|---|---|---|---|
| `extensio-mcp` | 20.188 | 2.884 | 0 | P50 0,54 ms · P99 7,13 ms |
| `extensio-mcp-anthropic` | 1.626 | 232 | 0 | P50 2,19 ms · P99 7,16 ms |
| `extensio-daily-pipeline` | 444 | 63 | 0 | P99 37,1 ms |

"Exceções" conta apenas falhas não tratadas do Worker. Respostas 4xx e 5xx devolvidas pela aplicação não aparecem nessa métrica. A API GraphQL desta conta aceita janelas de no máximo uma semana.

### Daily Pipeline: Falha em Curso

O orquestrador registra todos os dias, desde 27/10, "Orchestrator failed, falling back to legacy: Gemini API error (402): Your prepayment credits are depleted". O fallback legado roda, mas o resumo e os alertas também dependem do Gemini. A fila `extensio-enrichment` (lotes de 5, 3 tentativas, DLQ `extensio-enrichment-dlq`) falha pelo mesmo motivo: em 01/11, às 09h04 UTC, os lotes terminaram com 0 processados e 5 falhas cada. O `pipeline_status` aponta o último briefing em 26/10, às 13h24 UTC. Esse briefing registrou 6 chamadas de tools do MCP, o que indica que o 401 entre pipeline e MCP, aberto desde a troca de chave de 26/04, já estava resolvido.

### Onde Olhar

| Sinal | Fonte | Observação |
|---|---|---|
| Catálogo e contagens | `/health` do MCP | Contagem 88 e impressão digital 415233a9f562 |
| Saúde do ecossistema | `health_check` e `ecosystem_status` | O próprio MCP aparece com 0 ms (autoavaliação) e o csv-assets-bucket como não verificável |
| Logs do MCP | Workers Logs | Desabilitado: não há trilha das chamadas de tools |
| Logs da fachada e do pipeline | Workers Logs | Habilitado; amostragem integral no pipeline |
| Execução do pipeline | Healthchecks (`HC_PING_URL`) e `pipeline_status` | Ping de `/health` a cada 30 minutos por monitor externo |

## 13 · Segurança — Uma Chave Abre 88 Ferramentas

A superfície é ampla por desenho: o MCP lê e escreve em e-mail, agenda, DNS, bancos D1, Supabase, Notion, GitHub e Open Pages, e quem obtiver a chave Bearer do MCP executa qualquer uma das 88 tools. A auditoria de 01/11/2026 registrou achados de severidade alta, média e baixa em aberto. Severidade, evidência e correção recomendada constam apenas na versão completa, de acesso restrito, na Central de Documentos do Grupo CSV.

### Controles que Funcionam

A fachada OAuth em produção combina Cloudflare Access com e-mail em allowlist, PKCE S256 obrigatório, redirect URIs exatos, consentimento com cookie `__Host-`, CSRF, verificação de `Origin` e `Sec-Fetch-Site`, e filtragem dos cabeçalhos repassados. As rotas de leitura do `whatsapp-webhook` exigem token desde 17/10 e falham fechadas. As tools Ymunity exigem confirmação explícita com expiração e bloqueio de replay. A Central de Documentos nunca revela bucket nem chave de objeto.

### Regras de Segurança para Agentes

1. Nunca registrar, imprimir ou repassar a chave Bearer do MCP, tokens OAuth ou valores retornados por tools que contenham credenciais.
2. Não usar tools do MCP para obter senhas ou credenciais; credenciais vêm do Arsenal Técnico pelo fluxo da skill csv-vault-manager.
3. Antes de qualquer deploy da fachada, confirmar que a fonte contém o login humano e o consentimento da versão `8a22ef65`.
## 14 · Diagnóstico de Problemas — Sintoma, Causa Provável e Ação

| Sintoma | Causa Provável | Ação |
|---|---|---|
| 401 `Unauthorized` em `/mcp/standard` | Bearer ausente ou diferente da chave vigente | Conferir a chave no consumidor. Trocar a chave exige atualizar a fachada, o pipeline, o conector Manus, o csv-mcp da VPS-CSV e os demais agentes; a troca de 26/04 deixou o pipeline em 401 por meses |
| 522 entre Workers | Fetch para domínio próprio na mesma zona Cloudflare | Usar Service Binding (como `MAIL` e `DOCUMENTS`) ou, em último caso, `workers.dev` |
| Gmail, Drive ou Agenda com "token revogado" ou `invalid_grant` | Refresh token revogado, em geral por troca de senha | Reautorizar a conta (seção 8) e gravar o novo token no secret da conta |
| Briefing não chega; `pipeline_status` antigo | Gemini sem créditos (402) desde 27/10 | Recarregar créditos no AI Studio ou trocar o provedor; conferir a telemetria do `extensio-daily-pipeline` |
| Busca de memória pobre ou só textual | Falha de embedding do Gemini | Mesma ação acima; validar `retrieve_memory` com `search_type` semântico |
| Claude pede login repetidamente | Sessão do Access de 1 hora expirada no meio do fluxo, ou refresh token inválido | Repetir o login; se persistir, remover e adicionar o conector na conta Claude |
| Claude Code não conecta pela fachada | Callback `localhost` fora da allowlist | Conectar direto em `/mcp/standard` com Bearer |
| Contagem de tools diferente de 88 | Deploy feito a partir de outra fonte | Comparar `catalog_sha`; fazer rollback para `c5c4afcc` e reconciliar a branch |
| Tool responde "não configurado" | Secret ou binding ausente (seção 10) | Configurar o secret ou retirar a tool do catálogo |
| `claude_design_*` com 401 | Autenticação recusada pelo Design Service em `hooks.grupocsv.com/design` | Verificar o token esperado pelo serviço na VPS-CSV e o secret correspondente no Worker |
| `memory_sync_status` mostra agosto | A tool lê `csv_sync_log`, que não recebe registros desde 23/08 | Apontar a tool para o registro atual do sync; o crescimento de `csv_facts` mostra que o sync continua |
| `mail_logs` com 500 | Defeito de julho no `/logs` do csv-mail | Não reproduzido em 01/11; se voltar, conferir o binding D1 do `csv-mail` |
| `/health` lento (2,5 a 4,5 s) | Consultas ao D1 e ao Supabase a cada chamada | Não usar como sonda de alta frequência; criar rota leve sem consultas |

## 15 · Pendências e Plano de Continuidade — O Que Fazer, em Que Ordem

A ordem prioriza o que pode causar perda de função ou exposição de credenciais no próximo deploy ou no próximo acesso indevido. Nenhuma destas ações foi executada nesta auditoria, que foi somente leitura.

| Prioridade | Ação | Critério de Conclusão |
|---|---|---|
| [P0] | Restabelecer o provedor de LLM do pipeline e dos embeddings (créditos do Gemini ou troca de provedor) | Briefing do dia gerado; fila `extensio-enrichment` sem falhas 402; `retrieve_memory` semântico |
| [P0] | Reconciliar código e produção: localizar e commitar a fonte da versão `c5c4afcc`, levar as 4 tools `whatsapp_agent_*` para main e decidir sobre `whatsapp_agent_get_evidence`; fechar ou mergear o PR #18 | Deploy de main gera 88 tools (ou contagem decidida) com `catalog_sha` esperado |
| [P0] | Mergear o PR #1 da fachada OAuth em main | main da fachada igual à versão `8a22ef65` |
| [P0] | Corrigir os achados de segurança de severidade alta em aberto, parte 1 de 2 (detalhe na versão completa) | Critério definido na versão completa |
| [P0] | Corrigir os achados de segurança de severidade alta em aberto, parte 2 de 2 (detalhe na versão completa) | Critério definido na versão completa |
| [P1] | Versionar o `whatsapp-source-agent` no GitHub | Branch com o código do bundle `fd0b3698` e `wrangler.toml` |
| [P1] | Habilitar Workers Logs no `extensio-mcp`, com redação de argumentos | Logs disponíveis para chamadas de tools |
| [P1] | Endurecer a autenticação do MCP (detalhe na versão completa) | Revogar um consumidor sem afetar os demais |
| [P1] | Configurar ou retirar as 11 tools inoperantes (Instagram, Crialê, WABA, portal do Hub, Claude Design) e esclarecer gabi-care e spectra | Nenhuma tool do catálogo falha por configuração |
| [P1] | Corrigir a fonte de `memory_sync_status` e o filtro de `search_hub_knowledge` | Status com a execução mais recente; busca com resultados para termos conhecidos |
| [P2] | Atualizar a skill extensio (62 tools, VPS e endpoints antigos), `docs/STATUS.md`, `docs/ARCHITECTURE.md` e o README do pacote, tomando este manual como base | Documentos com 88 tools, VPS-CSV atual e fachada OAuth |
| [P2] | Higiene: remover secrets sem uso, arquivos de backup versionados, as variáveis legadas da fachada e o alias `icds`; alinhar `package.json` à versão anunciada | Inventário sem itens órfãos |
| [P2] | Tornar o `health_check` honesto: sonda real do próprio MCP e do csv-assets-bucket por Service Binding | Nenhum serviço reportado sem verificação |
| [P2] | Avaliar a atualização do `protocolVersion` (hoje 2024-11-05) frente às versões aceitas pelos clientes | Decisão registrada no ACB |

> **Regra operacional até a conclusão do P0.** Não publicar o `extensio-mcp` nem a fachada a partir de main. Qualquer correção urgente deve partir do código da versão ativa e terminar com contagem 88 e registro no ACB.

## 16 · Registro de Verificação — Como Cada Número Foi Conferido

| Fato | Valor | Método 1 | Método 2 |
|---|---|---|---|
| Tools em produção | 88 | `tools/list` pelo conector | `/health` `tools.count`; soma por domínio (11+5+4+4+6+2+9+3+5+4+8+5+9+6+7) |
| Catálogo de main | 85 | Nomes de tools no código | 85 − 1 + 4 = 88, igual ao vivo |
| Versões do `extensio-mcp` | 211 | `total_count` da API | IDs únicos nas páginas baixadas |
| Commits em main | 145 | `git rev-list --count` | `git log` (131 sem merges + 14 merges) |
| Bindings | 50 | Settings por tipo (41+3+2+2+2) | Lista de secrets (41) e agrupamento sem sobra |
| Requisições em 7 dias | 20.188 | GraphQL `workersInvocationsAdaptive` | 20.188 ÷ 7 = 2.884 por dia |
| Mensagens ingeridas em 7 dias | 4.765 | Contagem diária no D1 | 422+1.042+745+704+569+861+422, conferido em `bc` |
| Mensagens no D1 | 141.652 | `/health` às 08h41 | 141.636 às 00h18 mais a ingestão da manhã (141.650 às 08h16) |
| Tamanho do `whatsapp-brain` | 419,3 MiB | API D1: 439.693.312 bytes | `cloudflare_status`; 439.693.312 ÷ 1.048.576 |
| Testes de main | 73/73 | `node --test` | 10 arquivos de teste listados |
| Dia do keepalive | Domingo | Documentação Cloudflare (1 = domingo, UTC) | 18 subrequisições no domingo 25/10, 10 na segunda e na terça |
| Último briefing | 26/10 | `pipeline_status` | Telemetria de 01/11, 09h00 UTC: erro 402 |
| Uso pelo Claude | Diário | Agente `Claude-User` na telemetria | Callback do Claude na allowlist da fachada |
| Deployment ativo | `c5c4afcc` | API de deployments às 00h20 | Reconsulta às 08h16 |

Limites desta Auditoria
- Tools de escrita e tools que retornam conteúdo pessoal não foram exercitadas; o estado delas vem do código e dos testes unitários.
- A fonte local da versão ativa (provável cópia de trabalho na VPS-CSV) não foi inspecionada; a afirmação de ausência vale para o GitHub.
- A causa do 401 do Design Service, o conteúdo dos secrets de gabi-care e o estado atual do registro do Memory Sync não foram confirmados.
- O dataset de execuções agendadas da Cloudflare retornou vazio; a execução do keepalive foi inferida por subrequisições.
