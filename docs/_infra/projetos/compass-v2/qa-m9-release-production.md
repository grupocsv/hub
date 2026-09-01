# QA de Produção — Marco M9 do Compass™ v2

**Status:** Aprovado e estabilizado em produção.

**Escopo:** Edições 001–008, Hub CSV, `csv-auth`, `csv-documents`, D1, R2 privado, downloads públicos versionados, Admin e AI Search.

**Hierarquia canônica:** Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®.

> O release preservou as rotas e os downloads históricos. RLS, `csv-gateway`, bindings, buckets, DLQ, cron jobs, domínios, n8n e Open Pages não foram alterados fora do escopo documental explicitamente aprovado.

## 1. Resultado Executivo

O Compass™ v2 foi publicado com as oito edições em uma única fonte semântica no Git, renderização web responsiva e PDFs A4 determinísticos. O backend mantém oito releases v2 ativos e oito baselines superseded; os 16 links públicos versionados permanecem preservados. O Hub apresenta a Central Compass™, as rotas canônicas, os PDFs históricos e a aba somente leitura no Admin.[1] [2]

| Controle | Estado Final Verificado |
|---|---|
| Edições no catálogo | 8 — Edições 001–008 |
| Releases v2 ativos | 8 — Release 2 e versão documental atual |
| Baselines preservadas | 8 — Release 1 em estado `superseded` |
| Links públicos versionados | 16 — Baseline e v2 de cada edição |
| Páginas dos PDFs v2 | 127 |
| Hub | Publicado na revisão `b74bddfc3a7ee73f74371ca690081cc7186969d0` |
| Backend | Publicado na revisão `dbe3aa0c5b59e5df3ccca51e6ac8a2077f9fdacf` |
| Admin Compass™ | Sessão humana aprovada; 8 publicadas, 0 em preparação e 8 downloads ativos |
| AI Search | Job oficial concluído; edições 008, 003 e 001 recuperadas |
| WAF de Release | Desabilitada; definição canônica completa preservada |
| Queue Documental | Ativa; backlog final igual a zero |
| Credencial Temporária | Revogada; HTTP 401 comprovado; cópias privadas eliminadas |
| n8n | Não alterado e fora do caminho crítico |

## 2. Revisões e Publicações

A implementação principal foi integrada por PR protegido no backend e no Hub. O repositório Open Pages recebeu somente a delimitação documental de escopo. Três correções pós-publicação foram integradas no Hub: criação efetiva do job do AI Search, espera da estabilização das estatísticas e atualização da mensagem somente leitura no Admin.[1] [2] [3] [4] [5] [6] [7]

| Repositório | PR | Finalidade | Revisão Integrada |
|---|---:|---|---|
| `grupocsv/backend` | [#49][1] | Catálogo, migration 0021, releases e links Compass™ | `3139c4cd577bef516900871b60d064393bc50002` |
| `grupocsv/backend` | [#50][2] | Alias seguro `admin` → `grupo-csv`, preservando o papel D1 | `dbe3aa0c5b59e5df3ccca51e6ac8a2077f9fdacf` |
| `grupocsv/hub` | [#124][3] | Acervo 001–008, Central Compass™, PDFs, Admin e runbook | `3bd22f1e3703b467fc42f8740009a9fe3b406083` |
| `grupocsv/hub` | [#125][4] | Job oficial de sincronização do AI Search | `b63633960700d1000dfe21a140464f7ac17c236f` |
| `grupocsv/hub` | [#126][5] | Polling pós-job até `queued=0` e `running=0` | `ae7c6678b0c159c8af8a3ba0255ad3133d641a23` |
| `grupocsv/hub` | [#127][6] | Mensagem operacional correta no Admin somente leitura | `b74bddfc3a7ee73f74371ca690081cc7186969d0` |
| `grupocsv/csv-open-pages` | [#15][7] | Delimitação documental; sem código de runtime Compass™ | `d8650a30aa91e670be495fefa0ea971de5989455` |

A promoção final do hotfix de autenticação ocorreu pela cadeia protegida: `csv-auth` concluiu a execução `33498735163`; em seguida, `csv-documents` concluiu a execução `33498899491`, com migrations aditivas idempotentes, envio sem tráfego, smoke versionado e promoção revalidada.[8] [9]

## 3. Método 1 — Verificação Determinística

### 3.1 Backend, D1 e Autorização

A consulta final do D1 foi repetida após o hotfix, sem credencial temporária. O resultado confirmou oito edições `released`, oito ponteiros ativos para release 2, versões documentais `current`, checksums SHA-256 com 64 caracteres, contagens de páginas e bytes coerentes, oito releases ativos e oito releases superseded.

A causa do 403 no Admin foi rastreada até a fronteira entre os serviços: A sessão humana autenticada chegava como `portal=admin`, enquanto o catálogo documental era tenant-first em `grupo-csv`. A correção mapeia somente esse portal ao tenant institucional e continua exigindo o papel humano existente no D1. O teste regressivo falhou com 403 antes da correção e passou depois dela. O checkpoint final do `csv-documents` aprovou 723 testes Workers e 57 testes Node.

| Cenário de Autorização | Resultado |
|---|---|
| Sessão humana administrativa válida | HTTP 200; oito edições e duas versões por edição |
| Requisição sem sessão | HTTP 401; resposta genérica, sem campos privados |
| Token inválido | HTTP 401; resposta genérica, sem campos privados |
| 403 anterior ao hotfix | Reproduzido e tratado sem exposição de credencial; causa raiz eliminada |
| Credencial de serviço no navegador | Ausente |
| Operação mutável no Admin | Ausente; painel permanece somente leitura |

### 3.2 Downloads Públicos

Os 16 links foram verificados integralmente após a ativação por HEAD, download completo, tamanho, SHA-256, `Content-Disposition: attachment`, `Cache-Control: no-store`, `X-Robots-Tag: noindex`, suporte a Range 206 e ausência de chaves privadas do R2. O hotfix posterior alterou apenas a resolução de tenant da autenticação humana; nenhuma rota pública, slug, versão documental ou implementação de download foi modificada.[2]

Uma repetição integral posterior pelo sandbox encontrou timeouts de transporte nos domínios públicos. Esse evento não produziu mutação. O controle final foi reconciliado por quatro evidências independentes: A verificação integral anterior dos 16 links; o D1 pós-hotfix com os oito ponteiros e metadados intactos; o Admin humano com oito links ativos; e o workflow final do Hub, que executou smoke de oito páginas e oito PDFs. O resultado permanece aprovado.

### 3.3 Hub e PDFs

O deploy final do Hub concluiu build, testes de contratos, geração do catálogo, rejeição de deriva, integração em Chromium, cópia explícita dos PDFs e smoke do artefato publicado.[10] A Central Compass™ e as oito rotas canônicas terminadas em `/compass` responderam corretamente nas verificações anteriores e permaneceram inalteradas pelo último PR, que modificou somente duas cópias do HTML do Admin e seu teste.[6]

| Edição | Páginas v2 | Bytes v2 | Estado |
|---|---:|---:|---|
| 001 | 11 | 379.631 | Aprovada |
| 002 | 15 | 490.063 | Aprovada |
| 003 | 18 | 1.361.584 | Aprovada |
| 004 | 24 | 648.960 | Aprovada |
| 005 | 18 | 529.546 | Aprovada |
| 006 | 6 | 337.944 | Aprovada |
| 007 | 12 | 393.367 | Aprovada |
| 008 | 23 | 1.179.294 | Aprovada |

Os totais foram conferidos por redução do plano de release e pela soma independente dos oito manifestos. Ambos produziram 127 páginas e 5.320.389 bytes.

### 3.4 AI Search

O workflow final sincronizou o conteúdo indexável com o R2 e criou um job real por `POST /ai-search/instances/hub-csv/jobs`. O job foi acompanhado até `ended_at`; em seguida, o workflow aguardou as estatísticas drenarem para `queued=0` e `running=0`, exigindo também `error=0` e `outdated=0`.[5] [11]

| Edição | Consulta Distintiva | Resultado |
|---|---|---|
| 008 | Marcos temporais do processo de alta e da substituição do leito | Conteúdo da edição em primeiro lugar; fonte web e PDF v2 recuperados |
| 003 | Fototerapia neonatal, idade gestacional e via de parto | Fonte e PDF v2 recuperados com a hierarquia editorial canônica |
| 001 | Metas quantitativas, ACO e orçamento global | Fonte e PDF v2 recuperados com a hierarquia editorial canônica |

Cópias históricas preservadas também aparecem nos resultados. Os artefatos v2 atuais foram identificados por título, marcas e metadados do motor. A sincronização final concluiu com sucesso na execução `33500675006`.[11]

## 4. Método 2 — Navegador Real e Revisão Visual

A validação em navegador real cobriu a Central Compass™, a edição 008 e o Admin autenticado. Em desktop, a edição 008 apresentou conteúdo integral, hierarquia editorial, Elaboração: AxiaCare® e a ação `Baixar PDF da edição 008`, sem overflow horizontal.[12]

Em Chromium isolado, com viewport de 390 × 844 pixels e dark mode, foram verificadas nove rotas: Central Compass™ e edições 001–008. O resultado registrou zero overflow horizontal, zero `pageerror`, zero erro de console e ação de download da edição 008 visível e correta.

No Admin, a sessão humana de `guilherme@grupocsv.com` carregou o catálogo após o hotfix. A interface exibiu oito publicadas, zero em preparação, oito downloads ativos, release `r2` ativo e baseline `r1` superseded em todas as linhas. O rodapé passou a informar corretamente que o painel permanece somente leitura por desenho operacional.[6]

## 5. Janela Controlada de Infraestrutura

A publicação protegida exigiu WAF canônica habilitada e Queue pausada com backlog zero antes da primeira mutação. A segunda janela foi autorizada para o hotfix do Admin.

Durante a habilitação, o PATCH parcial preservou a regra, mas removeu `action_parameters`. O gate do workflow detectou a divergência e interrompeu a promoção antes de qualquer mutação. A definição completa foi recuperada de uma versão anterior do ruleset, restaurada com HTTP 403 customizado e revalidada. A terceira tentativa do `csv-auth` e a publicação subsequente do `csv-documents` foram aprovadas.

| Controle Final | Resultado |
|---|---|
| Regra WAF | `hub_documents_release_gate_v1` |
| Estado | Desabilitada |
| Definição | Expressão e resposta customizada canônicas preservadas |
| Queue | `csv-documents-jobs` ativa |
| Backlog | 0 mensagens e 0 bytes |
| Purge | Não executado |

A janela foi encerrada após o deploy: A WAF ficou desabilitada e a Queue voltou ao estado ativo. O verificador final comparou o hash da expressão com a definição canônica restaurada.

## 6. Credencial Temporária e Segurança

A credencial `compass-release-temporary` foi criada com menor privilégio, validade curta e escopo restrito ao tenant `grupo-csv`. Após a ativação, a credencial foi revogada no D1, o token passou a receber HTTP 401 e os arquivos privados locais e da VPS foram eliminados. O registro no Arsenal Técnico foi marcado como `Revogado`, com a confirmação HTTP 401 e sem valor sensível armazenado.

Nenhum token, cookie, chave Cloudflare, credencial Supabase, object key, payload privado do Vault ou credencial de serviço integra este documento ou o repositório.

## 7. Rollback e Preservação Histórica

O rollback permanece baseado em reativação de ponteiro para a baseline, conforme o runbook.[13] Não há down migration destrutiva nem exclusão dos links versionados. A migration 0021 é aditiva; uma revisão anterior do Worker ignora as tabelas novas.

Os 16 links versionados não devem ser revogados ou renomeados. A correção histórica da numeração cruzada dos PDFs 005 e 006 foi aplicada somente aos candidatos v2, preservando as rotas canônicas e os bytes das baselines.

## 8. Escopo Não Alterado

| Componente | Estado |
|---|---|
| RLS | Não ativado e não modificado |
| `csv-gateway` | Não alterado |
| Bindings, buckets e DLQ | Não alterados |
| Cron jobs e domínios | Não alterados |
| n8n | Não alterado; fora do caminho crítico |
| Links versionados | Preservados |
| Open Pages | Apenas README documental integrado |

## 9. Conclusão

O Marco M9 está tecnicamente concluído. As oito edições v2 estão ativas; as baselines permanecem disponíveis; o Hub, o Admin, o backend, os downloads e o AI Search foram validados por métodos determinístico e visual; a credencial temporária foi revogada; e a infraestrutura retornou ao estado operacional esperado.

## Referências

[1]: https://github.com/grupocsv/backend/pull/49 "PR 49 — Catálogo e Release do Compass™ no csv-documents"
[2]: https://github.com/grupocsv/backend/pull/50 "PR 50 — Hotfix de Autorização do Admin Compass™"
[3]: https://github.com/grupocsv/hub/pull/124 "PR 124 — Compass™ v2 no Hub"
[4]: https://github.com/grupocsv/hub/pull/125 "PR 125 — Job de Indexação do AI Search"
[5]: https://github.com/grupocsv/hub/pull/126 "PR 126 — Estabilização das Estatísticas do AI Search"
[6]: https://github.com/grupocsv/hub/pull/127 "PR 127 — Estado Somente Leitura do Admin Compass™"
[7]: https://github.com/grupocsv/csv-open-pages/pull/15 "PR 15 — Delimitação de Open Pages e Compass™ v2"
[8]: https://github.com/grupocsv/backend/actions/runs/33498735163 "Release Protegido do csv-auth"
[9]: https://github.com/grupocsv/backend/actions/runs/33498899491 "Release Protegido do csv-documents"
[10]: https://github.com/grupocsv/hub/actions/runs/33500402271 "Deploy Final do Hub"
[11]: https://github.com/grupocsv/hub/actions/runs/33500675006 "Sincronização Final do AI Search"
[12]: https://hub.grupocsv.com/compass/ "Central Compass™ em Produção"
[13]: ./runbook-release-rollback.md "Runbook de Release e Rollback do Compass™ v2"
