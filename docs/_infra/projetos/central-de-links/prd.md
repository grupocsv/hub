# PRD — Central de Links do Grupo CSV (csv.online e csv.email)

| Campo | Valor |
|---|---|
| Versão | 1.1 |
| Data | 22/10/2026 |
| Revisão | 1.1 (22/10/2026): token da API administrativa (seções 4, 8.2 e 10.1), campos da listagem `GET /links` (seção 9) e saúde de csv.online antes da virada (seção 10.5) |
| Situação | Em produção desde 25/10/2026 (virada do `csv.online/blog`). Em 30/10/2026, o item do Admin passou para a seção "Links e Páginas", sem mudança de mecanismo |
| Repositórios afetados | grupocsv/backend, grupocsv/hub, grupocsv/csv-open-pages |
| Documento público | Sim. Este arquivo fica no repositório público grupocsv/hub. IDs de recursos, registros DNS, contas e credenciais ficam fora dele, no handoff privado da VPS-CSV |

## 1. Objetivo

Criar, dentro do Painel Admin do Hub CSV, uma central para administrar links curtos próprios em `csv.online`. Ela separa dois tipos:

- **Rotativo**: o endereço público fica o mesmo, e o destino pode ser trocado. O caso obrigatório é `csv.online/blog`, que sempre leva ao post do blog escolhido no momento.
- **Estático**: uma referência curta a um conteúdo específico, que não muda de destino, salvo por correção excepcional e registrada.

A central também inclui uma área de preparação do `csv.email` que não ativa nenhum serviço de e-mail, e um card genérico de prévia (Open Graph) para os endereços do Grupo CSV que ainda não têm imagem própria.

"Rotativo" não significa sorteio, alternância por visita nem teste A/B. Nada disso faz parte deste produto.

## 2. Escopo

| Dentro do escopo | Fora do escopo |
|---|---|
| Links rotativos e estáticos em csv.online e www.csv.online | Troca automática para o último post publicado (decisão P4) |
| Escolha do post do blog numa lista vinda da API do blog, com a opção de digitar outra URL | Link estático gerado automaticamente a partir de cada post (P12) |
| Histórico completo, restauração de destino anterior e controle de edição simultânea | Sorteio, alternância, teste A/B e regras condicionais de destino |
| Métricas diárias, sem dado pessoal | Envio, recebimento, encaminhamento ou caixas postais no csv.email |
| QR Code gerado no navegador | Migração de endereços de e-mail atuais |
| Página própria de link inexistente, desativado ou expirado | Site no csv.email (P29) |
| Área de preparação do csv.email, com checklist verificável | Upload público de arquivos ("hospedador de links" não autoriza isso) |
| Card genérico de prévia nos endereços sem imagem própria | Contratação de serviços |
| Substituição do redirecionamento provisório pela central definitiva | Mudanças de RLS, n8n, csv-gateway, buckets existentes, DLQ e crons existentes |

## 3. Decisões confirmadas

As decisões abaixo vieram de uma sabatina com Guilherme Thomé, de P1 a P46, e foram confirmadas por ele em 22/10/2026. O implementador não as reabre. Uma divergência só é levantada quando houver bloqueio técnico comprovado, e nesse caso ela é registrada no ACB e devolvida ao revisor.

| # | Decisão | Origem |
|---|---|---|
| D1 | A "Central de Links" é um item novo no menu lateral do Admin, com as seções Visão geral, Rotativos, Estáticos, Domínios, Métricas e csv.email | P1 |
| D2 | O destino do csv.online/blog é escolhido numa lista dos posts publicados (API do blog). Também há um campo para digitar outra URL | P2 |
| D3 | O primeiro destino é o post "Organizar o cuidado por condição: por onde começar" | P3 |
| D4 | Nesta versão, a troca é só manual | P4 |
| D5 | O csv.online/blog serve para qualquer uso e sempre leva ao post do momento. Para indicar um post específico, usa-se o endereço normal do blog | P5, P12 |
| D6 | Os links estáticos continuam na central, para documentos, materiais e outros conteúdos fixos | P13 |
| D7 | Cada endereço tem um nome curto escolhido pelo admin (csv.online/nome). O servidor bloqueia nomes repetidos e reservados | P6 |
| D8 | `csv.online/` leva a grupocsv.com. Um link inexistente, desativado ou expirado mostra uma página simples do Grupo CSV que explica a situação | P7 |
| D9 | www.csv.online funciona igual ao csv.online, sem redirecionamento extra | P22 |
| D10 | Qualquer admin cria links e troca destinos de rotativos. Corrigir um link estático e excluir de vez ficam só com o superadmin | P8 |
| D11 | Para corrigir um estático, é preciso escrever o motivo e confirmar o endereço. Tudo fica no histórico | P25 |
| D12 | Antes de publicar, o servidor testa o novo destino, sem acessar endereços internos. Se o teste falhar, ainda dá para publicar, com uma confirmação explícita | P24 |
| D13 | O destino pode ser qualquer endereço https público. Ficam bloqueados os endereços internos, os esquemas `javascript:` e `data:` e os destinos dentro do próprio csv.online | P20 |
| D14 | Só os parâmetros `utm_` passam para o destino, e eles nunca o alteram | P16 |
| D15 | Todos os links usam 302 com `Cache-Control: no-store`, inclusive os estáticos | P23 |
| D16 | A data de validade é opcional e vem vazia. Depois dela, o link mostra a página de link expirado | P26 |
| D17 | Um endereço excluído fica livre na hora. O histórico e as métricas continuam ligados ao link antigo, e o novo link começa do zero | P27, P37 |
| D18 | A organização é por etiquetas livres, com filtro e busca | P28 |
| D19 | Nesta entrega, só o csv.online/blog é criado. Compass, evento, material e agenda aparecem como sugestão, sem destino | P21 |
| D20 | O QR Code é gerado no navegador e sempre traz o endereço público | P10 |
| D21 | A central roda num Worker próprio (`csv-links`), com base própria. O login é o mesmo do Admin, conferido no servidor pelo csv-auth | P15 |
| D22 | A base D1 guarda links, histórico e controle de concorrência, e o KV responde aos cliques. Uma troca leva cerca de 1 minuto, às vezes mais, e o painel mostra "em propagação" nesse período | P14 |
| D23 | As métricas são contagens diárias por link e por período de cada destino, com país e origem, sem IP e sem dado pessoal. Os robôs de prévia são contados à parte. Retenção de 24 meses | P9, P17, P18 |
| D24 | csv.online e csv.email têm proteção de e-mail que pode ser desfeita: MX nulo, SPF `-all` e DMARC `p=reject`. Já aplicada em 22/10/2026 | P11, P19, P36 |
| D25 | O csv.email fica sem site até a definição da finalidade | P29 |
| D26 | O csv.online/blog provisório continua no ar até a central definitiva assumir | P31 |
| D27 | Este PRD permite que outra plataforma implemente tudo de ponta a ponta, sem depender da sessão que o escreveu | P30 |
| D28 | Papéis: o implementador escreve o código e os testes; o revisor-publicador revisa, faz o merge e publica | P32, P40 |
| D29 | A publicação passa só por PR, checks e workflows do GitHub. O implementador nunca recebe chave da Cloudflare | P34 |
| D30 | Depois da revisão, o revisor-publicador faz o merge e publica quando os checks passam. Ele para só em ação destrutiva, contratação, credencial ou mudança de e-mail fora da proteção D24 | P35 |
| D31 | O card genérico de prévia usa o logo oficial do bucket e vale em todo endereço do Grupo CSV sem imagem própria: csv.online, csv.email (quando tiver site), assets.grupocsv.com e o padrão das Open Pages. Os cards próprios continuam | P38, P41 |
| D32 | Quando o destino de um link tem prévia própria, ela é mantida. O card genérico aparece nas páginas do próprio csv.online e nos destinos sem imagem | P42 |
| D33 | O card traz o logo horizontal negativo oficial no fundo #1b1e24, a frase "Cuidados em Saúde com Valor" e um detalhe no verde #2DBF7F, tudo na área central | P43 |
| D34 | A imagem do card é produzida e publicada no bucket pelo revisor-publicador. O código que a usa fica com o implementador | P45 |
| D35 | As imagens de prévia frágeis são corrigidas sem mudar o visual. A do Hub ganha uma versão leve em JPEG neste projeto; a do grupocsv.com é tratada fora do GitHub pelo revisor-publicador | P46 |

## 4. Estado atual verificado (22/10/2026)

> Registro histórico da situação anterior à implantação. Para a situação vigente, consulte [Links e Páginas — Visão Unificada](/_infra/links-e-paginas) e o [guia de operação](/_infra/projetos/central-de-links/operacao).

| Item | Estado | Como foi verificado |
|---|---|---|
| Zonas csv.online e csv.email | Ativas na conta Cloudflare do Grupo CSV, plano Free; certificado `*.csv.online` ativo | API da Cloudflare |
| Workers Paid | Ativo na conta | API da Cloudflare |
| csv.online/blog provisório | No ar desde 21/10/2026, 23h38. Duas Redirect Rules (fase `http_request_dynamic_redirect`): `/blog` e `/blog/` vão com 302 ao post vigente; o restante de `csv.online` e `www.csv.online` vai com 302 a grupocsv.com. Sem repasse de query string. Os registros DNS de `csv.online` e `www` são AAAA `100::` com proxy | API da Cloudflare e testes em http, https, www e utm |
| Proteção de e-mail | MX nulo, SPF `v=spf1 -all` e DMARC `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` nas duas zonas | dns.google e cloudflare-dns.com |
| Blog | API pública `https://grupocsv.com/api/blog/posts` (7 posts publicados). URL do post: `https://grupocsv.com/blog/<slug>` (o formato `/blog/post/<slug>` responde 404) | Teste HTTP |
| csv-auth | `/verify` aceita GET e POST com o header `X-Auth-Token` e devolve `{valid, portal, email, expires_at, auth_mode}`, **sem o papel**. O papel (`superadmin` ou `admin`) aparece no corpo do `POST /login` do portal admin e na lista `GET /admin/admins`, que exige sessão de admin e não traz senhas. Não existe `/admin/whoami` | Código na main do grupocsv/backend |
| Padrão de verificação de sessão | O csv-documents usa o service binding `AUTH` para o csv-auth e chama `https://csv-auth.internal/verify` em modo fail-closed | Código na main do grupocsv/backend |
| Modelo de Worker com D1, rota e release | `workers/nfse-api` (TypeScript, vitest com `@cloudflare/vitest-pool-workers`, `wrangler.production.jsonc` e o workflow `nfse-api-release.yml`, que faz migrations, `deploy --strict`, health check e rollback automático) | Código na main do grupocsv/backend |
| Proteção da main | hub: PR obrigatório, checks `build` e CodeQL, sem bypass. backend: PR obrigatório, checks "Validar Worker", "Validar Processador" e "Validar Autenticação", sem bypass. O ambiente `production` do backend exige revisor | API do GitHub |
| Admin do Hub | `admin/index.html`, com as seções Geral, Deck, Infraestrutura, Comunicação, Conteúdo e Sistema. A aba "Links Públicos" trata do `/p/` e das Open Pages, não de links curtos. A sessão do Admin no csv-auth (login com `portal: 'admin'`) fica em `localStorage['hub_auth_admin_token']`, é lida por `getToken()` e vai no header `X-Auth-Token`. O `localStorage['op_admin_token']` é outro token, o das Open Pages, enviado como `Authorization: Bearer`. Sem CSP | Código na main do grupocsv/hub |
| `api.grupocsv.com` | A rota `api.grupocsv.com/*` é do csv-gateway, que exige `X-API-Key` (um caminho novo como `/links/v1/health` responde 401 dele). Há rotas mais específicas para o nfse-api (`/nfse/*`) e o unimed-system (`/unimed*`). `links-api.grupocsv.com` não existe no DNS | API da Cloudflare, código e teste HTTP |
| Open Pages | A og:image padrão é `${DOMAIN}/_assets/og/default.png` (`src/index.js`). O repositório não tem workflow de deploy; o README manda publicar com `npx wrangler deploy` | Código na main do grupocsv/csv-open-pages |
| assets.grupocsv.com | O Worker `csv-assets` está publicado, mas o código-fonte não está versionado em nenhum repositório. `/` devolve JSON de serviço, sem HTML nem tags de prévia | API da Cloudflare (download do código publicado) |
| Prévia do Hub | `docs/public/og/og_hub.png`, 1200 x 630 e 520 KB, perto do limite oficial de 600 KB do WhatsApp | Teste HTTP |

## 5. Arquitetura

### 5.1 Componentes

| Componente | Repositório | Função |
|---|---|---|
| Worker `csv-links` | grupocsv/backend, `workers/csv-links` | Responde aos cliques em `csv.online/*` e `www.csv.online/*` e serve a API administrativa no domínio próprio de Worker `links-api.grupocsv.com`. O csv-gateway não é alterado |
| D1 `csv-links` | Criado na conta Cloudflare antes do primeiro release | Fonte da verdade: links, destinos, eventos, etiquetas, métricas e preparação do csv.email |
| KV `csv-links-routes` | Criado na conta Cloudflare antes do primeiro release | Cópia derivada para leitura rápida no clique. Pode ser reconstruído a partir do D1 a qualquer momento |
| Service binding `AUTH` | Para o Worker `csv-auth` existente, que não é alterado | Confere a sessão do Admin e o papel no servidor, só com rotas que já existem (seção 8.2) |
| Aba "Central de Links" | grupocsv/hub, `admin/index.html` | Interface administrativa integrada ao Admin existente |
| Card genérico de prévia | Bucket de assets, chave `criativos/grupo-csv/og-generico-v1.jpg` | Imagem 1200 x 630 em JPEG, publicada pelo revisor-publicador com entrada no `manifest.json` |

A escolha de um Worker separado (D21) isola falhas: um erro na central não afeta o login do Hub, e o rollback dela é independente. Pelo mesmo motivo, o csv-auth não muda neste projeto: o papel do admin é obtido de rotas que ele já oferece.

Hosts atendidos pelo Worker: `csv.online`, `www.csv.online` e `pre.csv.online`. O último existe só para validar a central em produção antes da virada (seção 16) e perde o registro DNS depois dela. Qualquer outro host recebe 404.

### 5.2 Fluxo de um clique

1. A requisição chega a `csv.online/<nome>` ou `www.csv.online/<nome>`, por http ou https.
2. O Worker normaliza o nome: minúsculas, sem a barra final e sem codificação percentual inválida. O host `www` é tratado como `csv.online`.
3. Se o caminho for `/`, o Worker responde 302 para `https://grupocsv.com/`.
4. Se for um caminho reservado do próprio serviço (seção 8.1), o Worker o atende.
5. Nos demais casos, o Worker lê a chave `r:csv.online:<nome>` no KV, com `cacheTtl` de 30 segundos, o mínimo permitido.
6. Se a chave não existir, o Worker consulta o D1. Isso evita que um link recém-criado fique "inexistente" por causa do cache negativo do KV. O caminho de chave ausente tem limitador de taxa. Se o D1 encontrar o link, o Worker regrava o KV em segundo plano (`waitUntil`).
7. Link ativo e dentro da validade: resposta 302 com `Location` igual ao destino vigente mais os parâmetros `utm_` permitidos (seção 8.5).
8. Link desativado ou expirado: página do Grupo CSV com status 410. Link inexistente ou excluído: página com status 404.
9. Em segundo plano, o Worker soma 1 na métrica diária, como clique ou como robô (seção 13). Uma falha nessa soma nunca afeta a resposta.

Não há página intermediária, tela de confirmação nem salto extra. Do csv.online ao destino, há um único redirecionamento.

### 5.3 Fluxo de troca de destino e propagação

1. O admin escolhe o novo destino (post da lista ou URL digitada).
2. A API testa o destino (seção 8.4) e devolve o resultado.
3. O admin publica, enviando o `expected_version` lido. Se o teste falhou, o admin precisa marcar "Publicar mesmo assim".
4. Numa única transação (`batch`) no D1, a API encerra o destino anterior (`valid_to`), cria o novo, atualiza o link, incrementa `version` e grava o evento no histórico. Se `version` mudou desde a leitura, nada é gravado e a resposta é 409.
5. A API grava o KV.
6. O painel mostra "em propagação" a partir de `published_at`. A situação passa a "confirmado" quando duas condições valem: (a) passaram 90 segundos (60 s de propagação documentada do KV + 30 s de `cacheTtl`); e (b) o navegador do admin consulta `https://csv.online/_csv/v/<nome>` (seção 8.1), que lê o KV pelo mesmo caminho do clique, e recebe uma `version` igual ou maior que a publicada. Se (b) falhar depois de 5 minutos, o painel mostra "propagação não confirmada" e oferece "Regravar rota".

A consulta (b) é feita pelo navegador, com `redirect: 'manual'`, e não pelo próprio Worker. Assim, evita-se que o Worker chame a própria rota. Ela confirma o que a região de rede do admin enxerga; para as outras regiões, vale o prazo documentado da Cloudflare. Enquanto a regra provisória estiver ativa, `csv.online/_csv/v/...` devolve o 302 da regra (resposta `opaqueredirect`). Nesse caso, o painel repete a consulta em `https://pre.csv.online/_csv/v/<nome>` e mostra o aviso "A regra provisória ainda responde em csv.online".

Comportamento observável documentado para o usuário: em até cerca de 90 segundos depois da troca, alguns acessos ainda podem chegar ao destino anterior, conforme a região da rede. Não se promete atualização global instantânea.

### 5.4 Política HTTP

| Situação | Status | Cabeçalhos obrigatórios |
|---|---|---|
| Link ativo (rotativo ou estático) | 302 | `Location`, `Cache-Control: no-store`, `X-Robots-Tag: noindex`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Csv-Links-Version` |
| `csv.online/` | 302 para `https://grupocsv.com/` | `Cache-Control: no-store` |
| Inexistente ou excluído | 404, com página HTML | `Cache-Control: no-store`, `X-Robots-Tag: noindex`, CSP restritiva (seção 14) |
| Desativado ou expirado | 410, com página HTML | Os mesmos do 404 |
| Robô de prévia em destino sem og:image | 200, com página só de prévia (seção 12.3) | `Cache-Control: no-store`, `X-Robots-Tag: noindex` |
| Método diferente de GET ou HEAD em csv.online | 405 | `Allow: GET, HEAD` |

Nunca se usa 301 nem 308, porque a RFC 9110 permite que o navegador guarde esses códigos por conta própria. Nenhuma resposta de csv.online grava cookie. HSTS e outras políticas que valem para o domínio inteiro ficam fora deste projeto.

### 5.5 Relação com Links Públicos, Open Pages e hospedagem

> Atualização de 30/10/2026: a aba "Links Públicos" passou a se chamar "Páginas Públicas" e fica com a Central de Links na seção "Links e Páginas" do Admin. O aviso de revogação passou a citar "Páginas Públicas". A separação de funções descrita abaixo não mudou.

A aba existente "Links Públicos" do Admin revoga e restaura páginas do Hub (`/p/`) e Open Pages. Ela não cria links curtos. A Central de Links não duplica essa função:

- Um link curto pode ter como destino uma Open Page ou uma página pública do Hub. Nesse caso, o painel mostra o aviso: "A revogação desta página é feita em Links Públicos". Se a página for revogada, o teste diário (seção 15.2) marca o link como "destino com falha".
- A central não hospeda arquivos e não aceita upload. Todo destino é uma URL que já existe. Documentos e materiais continuam publicados pelos serviços atuais (Open Pages, Hub e bucket de assets, com a governança do bucket).
- Links curtos não contornam proteção: o redirecionamento só leva ao destino, que continua aplicando o próprio login. O verificador de destino nunca envia credenciais, cookies ou tokens.

## 6. Modelo de dados (D1 `csv-links`)

Todas as datas são gravadas em UTC, no formato ISO 8601. A interface mostra o horário de Brasília. Os identificadores são texto (UUID v4 ou ULID). As migrations são aditivas e numeradas.

| Tabela | Colunas principais | Regras |
|---|---|---|
| `links` | `id`, `domain` (`csv.online`), `slug`, `kind` (`rotativo` ou `estatico`), `title`, `notes`, `preview_description` (opcional, até 160 caracteres), `routing_enabled` (0/1), `archived_at`, `expires_at`, `current_destination_id`, `version` (inteiro, começa em 1), `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by` | Índice único parcial em `(domain, slug)` com `WHERE deleted_at IS NULL`, que libera o nome na hora da exclusão (D17). `kind` não muda depois de criado |
| `destinations` | `id`, `link_id`, `url`, `label`, `source` (`blog` ou `manual`), `blog_post_id` (opcional), `valid_from`, `valid_to`, `created_by`, `publish_check_id`, `published_despite_failure` (0/1), `reason` (obrigatório nas correções de estático e nas restaurações de estático) | Só se acrescentam linhas (append-only); nenhuma é apagada. Um destino restaurado vira uma linha nova com a mesma URL. Só `valid_to` é preenchido depois, quando o destino deixa de valer |
| `destination_checks` | `id`, `destination_id` (vazio quando o teste é anterior à publicação), `url`, `at`, `trigger` (`previa`, `publicacao`, `manual` ou `diario`), `status` (`ok` ou `falhou`), `http_status`, `final_url`, `redirects` (inteiro), `has_og_image` (0/1), `og_title` (até 200 caracteres), `error_code`, `actor_email` (vazio no diário) | Só se acrescentam linhas. O resultado mais recente de cada destino vigente alimenta o KV |
| `link_events` | `id`, `link_id`, `type`, `actor_email`, `at`, `from_version`, `to_version`, `payload` (JSON sem segredos) | Tipos: `criado`, `destino_publicado`, `destino_restaurado`, `estatico_corrigido`, `desativado`, `reativado`, `arquivado`, `desarquivado`, `metadados_alterados`, `validade_alterada`, `excluido`, `rota_regravada`. Só se acrescentam linhas |
| `link_tags` | `link_id`, `tag` | Etiqueta em minúsculas, de 1 a 32 caracteres, com `[a-z0-9-]` e acentos normalizados; até 10 por link |
| `metrics_daily` | `day` (AAAA-MM-DD em America/Sao_Paulo), `link_id`, `destination_id`, `traffic` (`clique` ou `robo`), `country` (ISO de 2 letras ou `XX`), `source`, `campaign`, `count` | Chave primária composta pelas 7 primeiras colunas. Soma com `INSERT ... ON CONFLICT DO UPDATE SET count = count + 1`. Nenhuma coluna guarda IP, User-Agent, URL de referência completa ou cookie |
| `job_runs` | `id`, `job` (`conciliacao_kv`, `teste_diario`, `retencao_metricas`), `started_at`, `finished_at`, `status`, `summary` (JSON sem dados pessoais) | Registro da tarefa diária. Retenção de 90 dias |
| `email_prep` | `domain` (`csv.email`), `purpose`, `briefing`, `pending_decisions` (JSON), `checklist` (JSON), `version`, `updated_at`, `updated_by` | Uma linha por domínio. Concorrência por `version` |

O `actor_email` guarda o e-mail do admin autenticado. É o único dado pessoal da base, e serve para saber "quem fez a troca", como o prompt exige.

## 7. KV `csv-links-routes`

| Chave | Valor (JSON) |
|---|---|
| `r:csv.online:<slug>` | `{link_id, destination_id, url, kind, title, routing_enabled, expires_at, has_og_image, og_title, preview_description, version, written_at}` |

O KV nunca é fonte da verdade. Quando um link é excluído, a chave é apagada. Quando um link é desativado, ela é regravada com `routing_enabled: false`, para que a página 410 apareça. A rota `POST /v1/admin/rebuild-kv` da API (só superadmin, seção 9) regrava todas as chaves a partir do D1 e apaga as que sobram. A tarefa diária (seção 15.2) faz a mesma conciliação.

## 8. Segurança

### 8.1 Nomes curtos e caminhos reservados

| Regra | Valor |
|---|---|
| Formato do nome | `^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$` (de 1 a 64 caracteres, minúsculas, números e hífen, sem hífen nas pontas) |
| Normalização no clique | Maiúsculas viram minúsculas (`/Blog` atende como `/blog`); uma barra final é ignorada; qualquer caminho com mais de um segmento recebe 404 |
| Nomes reservados (não podem ser cadastrados) | `admin`, `api`, `app`, `assets`, `auth`, `email`, `favicon`, `health`, `help`, `links`, `login`, `logout`, `mail`, `og`, `p`, `preview`, `qr`, `robots`, `s`, `static`, `status`, `www`. A lista fica num único arquivo de código, coberto por teste |
| Caminhos do serviço | `/_csv/health` (JSON de saúde), `/_csv/v/<nome>` (versão publicada da rota, para o painel), `/robots.txt` e `/favicon.ico`. Como o formato do nome não aceita `_` nem `.`, eles não colidem com links |
| `robots.txt` | Não bloqueia caminhos, para não impedir robôs de prévia. A indexação é evitada pelo cabeçalho `X-Robots-Tag: noindex` |
| `favicon.ico` | 302 para um ícone oficial do Grupo CSV no bucket, escolhido pelo implementador no `manifest.json` (categoria `icone`) |
| `/_csv/v/<nome>` | Devolve `{slug, found, version, routing_enabled, written_at}`, com `Cache-Control: no-store` e CORS só para as origens de `ADMIN_ORIGINS`. Não devolve o destino. Tem limitador de taxa por IP (o IP não é guardado) |
| `/_csv/health` | Devolve `{service, version, kv, d1}`, sem dados de links, com `Cache-Control: no-store` e o mesmo CORS de `/_csv/v/` |

Colisão: a criação tenta o `INSERT`. Se o índice único parcial recusar, a resposta é 409 `slug_taken`. A consulta prévia de disponibilidade só serve para a interface e não substitui essa regra.

### 8.2 Autenticação e papéis

A API administrativa aceita só o header `X-Auth-Token` com a sessão do Admin do Hub, a mesma guardada hoje em `localStorage['hub_auth_admin_token']` e lida por `getToken()`; o `op_admin_token`, das Open Pages, não é aceito. Para cada requisição, a API faz:

1. Rejeita, com 401, token ausente, token com mais de 512 caracteres, token com caracteres de controle e token que começa com `shared_`.
2. Chama `AUTH.fetch('https://csv-auth.internal/verify')` com o token, com tempo limite de 5 segundos e `redirect: 'manual'`. Sessão inválida ou expirada (`valid !== true` ou `expires_at` no passado) dá 401. Sessão válida com `portal !== 'admin'` ou `auth_mode !== 'individual'` dá 403. Falha de rede, tempo esgotado, resposta não JSON ou corpo acima de 8 KB dão 503, sem fallback (fail-closed).
3. Obtém o papel chamando `AUTH.fetch('https://csv-auth.internal/admin/admins')` com o mesmo token. A rota já existe, exige sessão de admin e devolve a lista de admins com `email` e `role` (o superadmin com `role: 'superadmin'`, e os demais com `role` ou `admin`). A lista não contém senhas. A API procura o e-mail da sessão (em minúsculas) na lista. Se não encontrar, devolve 403. Se a lista falhar, devolve 503.
4. Se a entrada da lista tiver `must_change: true`, as operações de escrita devolvem 403 `must_change_password`. A leitura continua liberada.

O resultado das etapas 2 e 3 pode ficar guardado na memória do isolate por até 30 segundos, indexado pelo SHA-256 do token. Ele nunca é gravado no KV, no D1 nem em log. Assim, um admin removido ou uma sessão encerrada perdem o acesso à central em até 30 segundos.

| Operação | admin | superadmin |
|---|---|---|
| Ler, buscar, ver histórico e métricas | Sim | Sim |
| Criar link, editar título, notas, etiquetas, validade e descrição de prévia | Sim | Sim |
| Trocar ou restaurar destino de rotativo | Sim | Sim |
| Desativar, reativar, arquivar e desarquivar | Sim | Sim |
| Corrigir ou restaurar destino de estático (exige motivo com pelo menos 10 caracteres e a digitação do nome curto) | Não (403) | Sim |
| Excluir link (exige a digitação do nome curto) | Não (403) | Sim |
| Reconstruir o KV e exportar a base | Não (403) | Sim |
| Editar a área do csv.email | Sim | Sim |

A interface esconde os botões que o papel não permite, mas quem decide é sempre o servidor. O csv-auth não é alterado.

CORS da API: `Access-Control-Allow-Origin` só para as origens da variável `ADMIN_ORIGINS` (em produção, só `https://hub.grupocsv.com`), métodos `GET, POST, PATCH, PUT, DELETE, OPTIONS`, cabeçalhos `Content-Type, X-Auth-Token, X-Request-Id` e sem `Allow-Credentials`. Origem fora da lista não recebe cabeçalhos CORS.

### 8.3 Validação do destino

| Regra | Comportamento |
|---|---|
| Esquema | Só `https:`. `http:`, `javascript:`, `data:`, `file:`, `blob:`, `ftp:` e outros são recusados |
| Credenciais na URL | `user:senha@host` é recusado |
| Host | Precisa ser um nome de domínio com pelo menos um ponto. IPs literais (IPv4 e IPv6), `localhost`, nomes sem ponto e os sufixos `.local`, `.localhost`, `.internal`, `.lan`, `.home.arpa` e `.test` são recusados |
| Domínios bloqueados | `csv.online` e seus subdomínios (evita ciclo, D13), `links-api.grupocsv.com` e os hosts internos da lista privada `BLOCKED_HOSTS`, cujos valores ficam no handoff privado |
| Porta | Só a padrão (443). Porta explícita é recusada |
| Tamanho | No máximo 2.048 caracteres depois da normalização pelo parser WHATWG URL |
| Caracteres | Espaços e caracteres de controle são recusados. Domínios internacionais são convertidos para punycode pelo parser |
| Fragmento (`#`) | Mantido |
| Parâmetros com aparência de credencial | Nomes como `token`, `access_token`, `key`, `apikey`, `api_key`, `sig`, `signature`, `password`, `senha`, `secret` e os que começam com `x-amz-` não são recusados, mas exigem a confirmação "Este endereço parece conter uma credencial e ficará visível para quem usar o link" |

### 8.4 Teste do destino (proteção contra SSRF)

O teste roda em quatro momentos: quando o admin clica em "Testar destino", na publicação, quando o admin pede um novo teste e na tarefa diária. Ele nunca roda no clique do público.

1. Valida a URL pelas regras da seção 8.3.
2. Resolve o host por DNS sobre HTTPS (`https://cloudflare-dns.com/dns-query`, tipos A e AAAA). Recusa o destino se qualquer resposta cair em faixa não pública: 0.0.0.0/8, 10.0.0.0/8, 100.64.0.0/10, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.0.0.0/24, 192.168.0.0/16, 198.18.0.0/15, 224.0.0.0/4, 240.0.0.0/4, ::/128, ::1/128, ::ffff:0:0/96, 64:ff9b::/96, 100::/64, fc00::/7, fe80::/10 e ff00::/8.
3. Faz `GET` com `redirect: 'manual'`, o User-Agent `csv-links-checker/1.0 (+https://hub.grupocsv.com)`, `Accept: text/html` e nenhum cookie ou header de autenticação. O tempo limite é de 5 segundos por salto e 10 segundos no total.
4. Segue no máximo 5 redirecionamentos e repete as etapas 1 e 2 em cada salto. Um salto para `http:` ou para um host bloqueado encerra o teste com falha.
5. Lê no máximo 512 KB do corpo e procura `og:image` (URL absoluta https) e `og:title` dentro do `<head>`.
6. Grava em `destination_checks`: status final, URL final, número de saltos, se há prévia própria, o título da prévia (até 200 caracteres) e o código de erro.

Resultado `ok`: o status final está entre 200 e 299. Qualquer outro caso é `falhou`, com o código do motivo (`dns_privado`, `tempo_esgotado`, `muitos_saltos`, `http_4xx`, `http_5xx`, `rebaixamento_http`, `host_bloqueado` e outros). Verificado em 22/10/2026: os posts do blog entregam `og:image` e `og:title` no HTML inicial, com qualquer User-Agent.

Risco residual documentado: entre a resolução DNS e o `fetch`, o DNS pode mudar (DNS rebinding). A mitigação é que o teste só roda por ação de admin ou na tarefa diária, não lê nada além do HTML e não envia credenciais.

### 8.5 Parâmetros do clique

Só passam para o destino os parâmetros cujo nome segue `^utm_[a-z0-9_]{1,28}$`, no máximo 5, com valor de até 200 caracteres. Os demais parâmetros são descartados, e nenhum parâmetro altera host, caminho ou parâmetros já existentes no destino. Se o destino já tiver o mesmo `utm_`, vale o do destino. A montagem usa `URLSearchParams`, que faz a codificação correta.

## 9. API administrativa

Base: `https://links-api.grupocsv.com/v1`. Respostas em JSON UTF-8. Erros seguem o formato `{error: "<codigo>", message: "<texto em PT-BR>", request_id}`. Toda resposta tem `X-Request-Id` e `Cache-Control: no-store`.

| Método e caminho | Papel | Função |
|---|---|---|
| `GET /health` | Público | `{service: "csv-links", version, d1, kv}`, em que `d1` e `kv` valem `"ok"` ou `"erro"`, sem dados de links |
| `GET /me` | admin | `{email, role}` |
| `GET /links` | admin | Lista com `q` (nome, título, destino e etiqueta), `kind`, `status` (`ativo`, `desativado`, `expirado`, `arquivado`, `excluido`, `com_falha`), `tag`, `sort` (`updated_at` ou `slug`), `page` e `page_size` (padrão 25, máximo 100). Sem filtro, oculta arquivados e excluídos. Cada item traz, além dos campos do link, `url` e `published_at` do destino vigente, `destination_label`, `destination_source`, `destination_blog_post_id`, `last_check_status` (`ok`, `falhou` ou vazio) e `last_check_at`, para que a lista não precise consultar o detalhe de cada item |
| `GET /slugs/:slug/availability` | admin | `{available, reason}` com `reason` igual a `formato`, `reservado` ou `em_uso` |
| `POST /checks` | admin | Testa uma URL (seção 8.4) e devolve o registro do teste, com `check_id`. Limite de 30 por minuto por admin |
| `POST /links` | admin | Cria o link com `slug`, `kind`, `title`, `notes`, `tags`, `expires_at`, `preview_description`, `destination {url, label, source, blog_post_id}`, `check_id` e `publish_despite_failure` |
| `GET /links/:id` | admin | Detalhe, destino vigente, último teste, `version` e situação de propagação |
| `PATCH /links/:id` | admin | Metadados (`title`, `notes`, `tags`, `expires_at`, `preview_description`), com `expected_version` obrigatório |
| `POST /links/:id/destination` | admin (rotativo) ou superadmin (estático) | Publica novo destino com `expected_version`, `url`, `label`, `source`, `blog_post_id`, `check_id`, `publish_despite_failure`; nos estáticos, também `reason` e `confirm_slug` |
| `POST /links/:id/restore` | admin (rotativo) ou superadmin (estático) | Restaura um destino anterior (`destination_id`) como um destino novo, com `expected_version`; nos estáticos, também `reason` e `confirm_slug` |
| `POST /links/:id/disable` e `/enable` | admin | Desativa ou reativa o roteamento, com `expected_version` |
| `POST /links/:id/archive` e `/unarchive` | admin | Arquivamento organizacional. Não muda o roteamento |
| `DELETE /links/:id` | superadmin | Exclui, com `expected_version` e `confirm_slug`. Libera o nome na hora e preserva histórico e métricas |
| `POST /links/:id/rewrite-route` | admin | Regrava a chave do KV a partir do D1 |
| `GET /links/:id/history` | admin | Eventos e destinos com vigência, paginados |
| `GET /links/:id/metrics` | admin | `from`, `to` (até 24 meses), `traffic` (`clique` ou `robo`) e `group` (`day`, `destination`, `country`, `source` ou `campaign`) |
| `GET /metrics/overview` | admin | Totais por período, sem robôs, e os 10 links com mais cliques |
| `GET /events` | admin | Histórico geral, filtrável por link, tipo, autor e período |
| `GET /blog/posts` | admin | Lê `https://grupocsv.com/api/blog/posts` (host fixo), filtra `published`, ordena por `publishedAt` decrescente e devolve `{id, slug, title, publishedAt, url}`, com `url = https://grupocsv.com/blog/<slug>`. Cache em memória de 60 s. Se a API do blog falhar, devolve 502 com mensagem clara, e a URL digitada continua disponível |
| `GET /domains` | admin | Verificação ao vivo por DNS sobre HTTPS de NS, MX, SPF, DMARC e A/AAAA de `csv.online`, `www.csv.online` e `csv.email`, com a hora da verificação |
| `GET /email-prep` e `PUT /email-prep` | admin | Área do csv.email, com `expected_version` no `PUT` |
| `GET /email-prep/verify` | admin | Executa os itens verificáveis do checklist (seção 11) e grava o resultado |
| `POST /admin/rebuild-kv` | superadmin | Regrava todas as chaves do KV a partir do D1 e apaga as que sobram |
| `GET /admin/export` | superadmin | Exporta links, destinos, eventos, etiquetas, testes e a área do csv.email em JSON, para cópia de segurança manual |

Conflito de edição: se `expected_version` for diferente da versão gravada, a resposta é 409 `version_conflict`, com a versão atual e o registro atual. Nada é gravado.

Limites de taxa (binding de rate limiting do Workers, mesma técnica do csv-auth): 120 requisições por minuto por sessão na API; 30 testes de destino por minuto por sessão; 60 consultas por minuto por IP em `/_csv/v/` e nos caminhos de link inexistente. A chave do limitador é calculada em memória e não é gravada.

## 10. Interface no Admin do Hub

### 10.1 Navegação

- Item novo "Central de Links" no menu lateral, na seção "Comunicação", com `data-tab="central-links"`. Atualização de 30/10/2026: o item passou para a seção "Links e Páginas", ao lado de "Páginas Públicas" (antiga "Links Públicos"), com o mesmo `data-tab`; o aviso de revogação passou a citar "Páginas Públicas".
- Dentro da aba, um seletor de seções com Visão geral, Rotativos, Estáticos, Domínios, Métricas e csv.email (D1). A seção do histórico geral fica dentro de Métricas, com o título "Histórico e Métricas".
- A aba usa os estilos, as variáveis de cor, o tema e os componentes que o Admin já tem. Não há CSS de outra marca nem framework novo.
- A constante `LINKS_API = 'https://links-api.grupocsv.com/v1'` fica junto das constantes de API existentes. O token é a sessão do Admin, lida por `getToken()`, e nunca o `op_admin_token`.

### 10.2 Listas de Rotativos e Estáticos

| Coluna | Conteúdo |
|---|---|
| Endereço público | `csv.online/<nome>`, com o botão "Copiar" |
| Destino vigente | URL encurtada visualmente, com o texto completo no `title` e o rótulo do post quando vier do blog |
| Tipo | Rotativo ou Estático, com cores distintas e texto (nunca só cor) |
| Situação | Ativo, Em propagação, Desativado, Expirado, Arquivado, Excluído ou Destino com falha |
| Última alteração | Data e hora de Brasília e o e-mail de quem alterou |
| Ações | Abrir, Copiar, QR Code e Detalhes |

Busca por texto, filtros por situação e etiqueta, ordenação e paginação de 25 itens. Em telas de até 768 px, cada linha vira um cartão, sem rolagem horizontal até 320 px.

Na lista de Rotativos, um bloco "Sugestões" mostra `compass`, `evento`, `material` e `agenda` como "não criados" (D19). O botão "Criar" abre o formulário com o nome e o tipo preenchidos e o destino vazio. Nada é gravado até o admin completar e salvar.

### 10.3 Formulário de criação

1. Tipo, com explicação curta. Rotativo: "O endereço fica o mesmo, e você pode trocar o destino quando quiser". Estático: "O endereço sempre leva ao mesmo conteúdo; só o superadmin corrige, com motivo".
2. Nome curto, com a prévia `csv.online/<nome>` e a disponibilidade verificada enquanto o admin digita.
3. Título interno.
4. Destino, com duas opções: "Post do blog", numa lista vinda de `GET /blog/posts` com o título e a data, e "Outra URL".
5. Etiquetas, validade (opcional e vazia), descrição de prévia (opcional, até 160 caracteres) e notas.
6. Botão "Testar destino", que mostra o status HTTP, o endereço final, o número de redirecionamentos e se o destino tem prévia própria (com o título dela).
7. Botão "Criar link". Se o teste falhou, aparece a caixa "Publicar mesmo assim", seguida de uma confirmação.

### 10.4 Detalhe do link

- Endereço público, destino vigente, tipo, situação, versão, validade e etiquetas.
- Situação de propagação: "Em propagação" com contagem, "Confirmado" ou "Propagação não confirmada" com o botão "Regravar rota" (seção 5.3).
- Ações conforme o papel: Trocar destino (rotativo), Corrigir destino (estático, só superadmin), Desativar ou Reativar, Arquivar ou Desarquivar, Excluir (só superadmin), Testar destino de novo e Regravar rota.
- QR Code gerado no navegador, sempre com `https://csv.online/<nome>` e nunca com o destino (D20), em PNG e SVG. A biblioteca fica copiada no repositório, em `admin/vendor/`, com versão e licença registradas, sem CDN.
- Linha do tempo com cada destino, sua vigência (de, até), quem publicou, o resultado do teste e o motivo (quando houver). Cada destino anterior tem o botão "Restaurar este destino".
- Conflito de edição (409): a mensagem "Outra pessoa alterou este link enquanto você editava. Recarregue para ver a versão atual. Nada foi gravado." e o botão "Recarregar".
- Quando o destino for uma Open Page ou página pública do Hub, aparece o aviso da seção 5.5.

### 10.5 Visão geral, Domínios e Métricas

- **Visão geral**: totais de rotativos e estáticos; ativos, desativados, expirados e com falha no último teste diário; cliques sem robôs nos últimos 7 e 30 dias; as 10 alterações mais recentes; situação dos domínios.
- **Domínios**: resultado de `GET /domains` com a hora da verificação; saúde do Worker em `csv.online/_csv/health`, consultada pelo navegador (até a virada da seção 16.3, `csv.online` ainda responde com o redirecionamento provisório e essa consulta falha; a aba mostra "Sem resposta", com a hora da tentativa); a política vigente em modo de leitura (302 com `no-store`, parâmetros `utm_`, nomes reservados). A central não altera DNS e não tem chave da Cloudflare.
- **Métricas**: período de 7, 30 ou 90 dias ou personalizado (até 24 meses); escolha do link; gráfico diário de cliques, com robôs numa série separada que pode ser ocultada; tabelas por período de cada destino, país, origem e campanha. O gráfico é desenhado em SVG ou canvas, sem biblioteca de CDN. Abaixo, o histórico geral com filtros por link, tipo de evento, autor e período.

### 10.6 Qualidade da interface

Rótulos em todos os campos, foco visível, navegação por teclado, mensagens de erro ao lado do campo e textos em PT-BR. O axe não pode apontar violação séria ou crítica na aba nova. As abas existentes não podem mudar de comportamento.

## 11. Área do csv.email

A área serve para registrar decisões futuras. Ela não ativa nada.

| Campo | Regras |
|---|---|
| Finalidade pretendida | Texto livre, até 2.000 caracteres |
| Notas de briefing | Texto livre, até 10.000 caracteres |
| Decisões pendentes | Lista de itens com título, opções, situação (`pendente` ou `decidida`), decisão e data |
| Checklist | Itens com situação `verificado` (com data, hora e método), `pendente` ou `nao_configurado` |

Itens iniciais do checklist:

| Item | Situação inicial | Como é verificado |
|---|---|---|
| Zona csv.email ativa na Cloudflare, com os nameservers da conta | Verificável | DNS sobre HTTPS, tipo NS |
| MX nulo publicado (RFC 7505) | Verificável | DNS sobre HTTPS, tipo MX, que deve trazer exatamente `0 .` |
| SPF `v=spf1 -all` | Verificável | DNS sobre HTTPS, tipo TXT |
| DMARC `p=reject` | Verificável | DNS sobre HTTPS, `_dmarc.csv.email`, tipo TXT |
| Finalidade definida por Guilherme Thomé | Pendente | Manual |
| Site no csv.email | Não configurado (D25) | — |
| Recebimento ou encaminhamento | Não configurado | — |
| Envio | Não configurado | — |
| Caixas postais | Não configurado | — |
| DKIM | Não configurado | — |

Regras de segurança da área: ela não tem campo de credencial. O servidor recusa, com 422 `possivel_credencial`, textos com padrões de segredo: `-----BEGIN`, `re_` seguido de 20 ou mais caracteres, `sk-`, `sk_live_`, `ghp_`, `github_pat_`, `xox`, `AKIA` seguido de 16 caracteres, `Bearer ` e o formato de JWT (`eyJ...` com dois pontos). Nenhum indicador simula serviço que não existe: um item só aparece como "verificado" depois de um teste real, com data e método.

A área também mostra, em modo de leitura, as possibilidades levantadas, com as fontes e a data da consulta:

| Possibilidade | Benefício | Dependências | Riscos | Custo verificado (22/10/2026) |
|---|---|---|---|---|
| Manter como está | Domínio protegido contra uso indevido em e-mail falso | Nenhuma | Nenhum | Zero |
| Recebimento com encaminhamento (Cloudflare Email Routing) | Endereços @csv.email que encaminham para caixas existentes | Remover o MX nulo, publicar o MX da Cloudflare e verificar os endereços de destino | Encaminhamento pode falhar no SPF e no DMARC de quem enviou; não é caixa postal | Recebimento ilimitado nos planos Free e Paid; limites de 200 regras por domínio, 200 destinos verificados por conta e 25 MiB por mensagem |
| Envio transacional pelo Resend (já usado pelo csv-mail) | Reaproveita a integração atual | Registros DKIM e SPF; o MX nulo não pode ficar no domínio usado como remetente (RFC 7505), o que pede um subdomínio de envio ou a retirada do MX nulo | Reputação de um domínio novo | Free: US$ 0, 3.000 por mês e 100 por dia, 3 domínios. Pro: US$ 20 por mês, 50.000 e-mails e 10 domínios. O plano atual da conta não foi verificado |
| Envio pela Cloudflare Email Service | Fica na mesma conta dos Workers | Workers Paid (a conta tem), registros de autenticação e a mesma questão do MX nulo | Serviço com cota inicial conservadora | 3.000 por mês incluídos por conta e US$ 0,35 por 1.000 depois. Envio para endereços verificados gratuito |
| Caixas postais (Google Workspace, já usado pelo grupocsv.com e pelo thera.tech) | Caixas completas | Configuração no Workspace e MX do Google | Custo por usuário | Starter US$ 7, Standard US$ 14 e Plus US$ 22 por usuário por mês, sem impostos. Adicionar o csv.email como domínio secundário ou alias no Workspace atual não foi verificado |

## 12. Prévia de link (Open Graph)

### 12.1 Card genérico

| Item | Valor |
|---|---|
| Arquivo | `criativos/grupo-csv/og-generico-v1.jpg` no bucket de assets |
| URL | `https://assets.grupocsv.com/criativos/grupo-csv/og-generico-v1.jpg` |
| Formato | JPEG de 1200 x 630, com menos de 300 KB |
| Conteúdo | Logo horizontal negativo oficial no fundo #1b1e24, a frase "Cuidados em Saúde com Valor" e um detalhe no verde #2DBF7F, tudo no quadrado central (D33) |
| Publicação | Pelo revisor-publicador, depois da escolha de Guilherme entre 3 versões, com entrada no `manifest.json` do bucket (D34) |
| No código | Variável `OG_GENERIC_URL`. Os testes usam essa variável e não dependem da versão escolhida |

Tags que acompanham o card: `og:image:width` 1200, `og:image:height` 630, `og:image:type` `image/jpeg`, `og:image:alt` "Grupo CSV — Cuidados em Saúde com Valor", `og:site_name` "Grupo CSV" e `twitter:card` `summary_large_image`.

### 12.2 Páginas do próprio csv.online

As páginas 404 e 410 (seção 14) têm `og:title`, `og:description`, `og:url` canônica sem parâmetros e o card genérico.

### 12.3 Página só de prévia para robôs (D32)

Quando o User-Agent é de um robô de prévia de mensageiro ou rede social (WhatsApp, `facebookexternalhit`, `Facebot`, `LinkedInBot`, `Twitterbot`, `TelegramBot`, `Slackbot-LinkExpanding`, `Discordbot` e `SkypeUriPreview`) e a rota do KV tem `has_og_image: false`, o Worker responde 200 com um HTML mínimo (o `<head>` termina antes de 2 KB):

- `og:title`: o `og_title` do teste, se existir; senão, o título do link.
- `og:description`: a descrição de prévia do link; senão, "Grupo CSV — Cuidados em Saúde com Valor". Nunca vazia, como a Meta exige.
- `og:url`: `https://csv.online/<nome>`, sem parâmetros.
- `og:image`: o card genérico.
- Um `<meta http-equiv="refresh" content="0;url=<destino>">` e um link visível para o destino. Assim, uma pessoa classificada como robô por engano ainda chega ao destino.

Todos os valores inseridos nesse HTML (título, descrição e URLs, inclusive a do `meta refresh`) são escapados para HTML, e a página usa a mesma CSP da seção 14.

Nos demais casos, inclusive quando o destino nunca foi testado, o robô recebe o 302 normal e lê a prévia do próprio destino. A requisição é contada como robô.

### 12.4 Outros endereços do Grupo CSV (D31 e D35)

| Endereço | Mudança | Repositório |
|---|---|---|
| Open Pages | A imagem padrão (`${DOMAIN}/_assets/og/default.png`, em `src/index.js`) passa a ser o card genérico, com as tags da seção 12.1. Páginas com `og_image` próprio não mudam | grupocsv/csv-open-pages |
| assets.grupocsv.com | A raiz `/` continua devolvendo o JSON de serviço para clientes de API. Ela passa a devolver um HTML mínimo com as tags de prévia quando o pedido aceita `text/html` sem aceitar JSON antes, ou quando vem de robô de prévia. Os demais caminhos não mudam | grupocsv/backend (código do csv-assets passa a ser versionado; seção 16.1) |
| Hub | Arquivo novo `docs/public/og/og_hub-v2.jpg`, gerado a partir do `og_hub.png` atual em JPEG 4:4:4 de qualidade 97, com 1200 x 630. As declarações de `og:image` e `twitter:image` em `docs/.vitepress/config.mts` e no frontmatter de `docs/index.md` passam a apontar para ele, com `og:image:type` `image/jpeg`. O `og_hub.png` original continua no repositório, sem alteração, porque outras páginas o usam. Medido em 22/10/2026: 245 KB e SSIM de 0,992 contra o original. A recompressão em PNG não serve: sem perda, só chega a 488 KB; com paleta, chega a 181 KB, mas com SSIM de 0,982 | grupocsv/hub |
| grupocsv.com | A imagem passa a sair do bucket, com o tipo correto. O site é publicado pela plataforma de origem dele, e não pelo GitHub | Fora deste PRD; fica com o revisor-publicador |
| csv.email | Nada agora. O card vale quando houver site (D25) | — |

## 13. Métricas

| Dimensão | Origem do valor | Observação |
|---|---|---|
| Dia | Data do clique em America/Sao_Paulo | — |
| Link e destino | IDs do KV no momento do clique | Permite ver os cliques durante a vigência de cada destino |
| Tráfego | `robo` se o User-Agent casar com a lista de robôs (a da seção 12.3 mais `Googlebot`, `bingbot`, `Applebot`, `DuckDuckBot`, `YandexBot` e o padrão genérico `/bot\|crawler\|spider\|preview/i`); senão, `clique` | Classificação por User-Agent é aproximada |
| País | `request.cf.country`; `XX` quando ausente ou `T1` | — |
| Origem | `utm_source` saneado (minúsculas, `[a-z0-9._-]`, até 32 caracteres). Sem ele, o host do `Referer` mapeado para `whatsapp`, `linkedin`, `instagram`, `facebook`, `x`, `google`, `email` ou `outro`. Sem `Referer`, `direto` | Só o host do `Referer` é lido, e nunca é gravado inteiro |
| Campanha | `utm_campaign` saneado, até 64 caracteres; vazio quando ausente | Separa campanhas e publicações diferentes |

Não se grava IP, User-Agent, URL de referência completa, cookie nem identificador de pessoa. A soma é feita em segundo plano (`waitUntil`). Uma falha na soma é registrada no log técnico e não muda a resposta do clique.

Retenção e descarte: `metrics_daily` guarda 24 meses, e a tarefa diária apaga o que for mais antigo. Histórico de links e destinos não expira. Só admins autenticados leem as métricas, pela API.

## 14. Páginas de erro e cabeçalhos

| Situação | Status | Título | Texto |
|---|---|---|---|
| Inexistente ou excluído | 404 | Link não encontrado | "Este endereço não existe ou foi removido." |
| Desativado | 410 | Link desativado | "Este endereço foi desativado por quem o administra." |
| Expirado | 410 | Link expirado | "Este endereço tinha prazo de validade, que já terminou." |
| Base e KV indisponíveis | 503 | Serviço indisponível | "Não foi possível abrir este endereço agora. Tente de novo em alguns minutos." |

Todas as páginas têm o botão "Ir para grupocsv.com", fundo #1b1e24, o logo horizontal negativo oficial do bucket, fonte do sistema, `lang="pt-BR"` e layout sem rolagem horizontal até 320 px. Elas nunca mostram o destino antigo.

Cabeçalhos das páginas: `Cache-Control: no-store`, `X-Robots-Tag: noindex`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` e `Content-Security-Policy: default-src 'none'; img-src https://assets.grupocsv.com; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`.

## 15. Operação

### 15.1 Observabilidade

- Observability do Workers ligada, com logs estruturados em JSON: `request_id`, tipo de rota (`clique`, `api`, `servico`), nome curto, status, latência, código de erro e versão. Nunca IP, User-Agent completo, token ou corpo de requisição.
- `GET /v1/health` e `/_csv/health`, usados pelo workflow de release e pela aba Domínios.
- A Visão geral mostra os links com falha no último teste diário e a data da última execução bem-sucedida da tarefa diária.

### 15.2 Tarefa diária (Cron Trigger novo, só no csv-links, às 09:00 UTC)

1. **Conciliação**: compara a `version` de cada chave do KV com o D1, regrava as divergentes e apaga as que sobram.
2. **Teste diário**: testa o destino vigente de cada link ativo (seção 8.4), com no máximo 4 testes simultâneos, e atualiza `has_og_image` e `og_title` no KV.
3. **Retenção**: apaga métricas com mais de 24 meses e registros de `job_runs` com mais de 90 dias.

Cada etapa grava o resultado em `job_runs`. Os crons existentes de outros Workers não são alterados.

### 15.3 Cópia de segurança e restauração

| Camada | Mecanismo | Restauração |
|---|---|---|
| D1 `csv-links` | Time Travel do D1, com qualquer minuto dos últimos 30 dias no Workers Paid | `wrangler d1 time-travel restore csv-links --timestamp=<ISO>`. A restauração sobrescreve a base e devolve um bookmark para desfazê-la. Depois, rodar `POST /v1/admin/rebuild-kv` |
| Cópia além de 30 dias | `GET /v1/admin/export` (superadmin), guardada pelo revisor-publicador fora do repositório público | Reimportação por script do implementador (`scripts/import-export.mjs`), testada contra uma base local |
| KV | Derivado do D1 | `POST /v1/admin/rebuild-kv` ou a conciliação diária |
| Código | Repositórios no GitHub e versões do Worker na Cloudflare | `wrangler rollback` pelo workflow, ou novo release de um SHA anterior |

## 16. Implantação

### 16.1 Pull requests

| PR | Repositório | Conteúdo | Autor |
|---|---|---|---|
| PR-0 | grupocsv/hub | Este PRD e a entrada na sidebar do _infra | Revisor-publicador |
| PR-1 | grupocsv/backend | `workers/csv-links` completo (código, migrations, testes, `wrangler.production.jsonc`, README de operação), `csv-links-ci.yml` e `csv-links-release.yml` | Implementador |
| PR-2 | grupocsv/backend | `workers/csv-assets`: primeiro commit com o código publicado exatamente igual (SHA-256 conferido contra a cópia do handoff); segundo commit com a mudança da seção 12.4; `csv-assets-release.yml` | Implementador |
| PR-3 | grupocsv/hub | Aba Central de Links, `admin/vendor/` do QR Code, testes estáticos e E2E, passo novo no `deploy.yml` que exige `data-tab="central-links"`, `og_hub-v2.jpg` com as declarações atualizadas (seção 12.4) e `operacao.md` no _infra | Implementador |
| PR-4 | grupocsv/csv-open-pages | Imagem padrão da seção 12.4 e um workflow de publicação novo (`workflow_dispatch`, só da main e só pelo usuário guicthome), porque hoje o repositório não tem um | Implementador |

Ordem: PR-0, PR-1 e publicação do csv-links; depois PR-3; PR-2 e PR-4 em paralelo, depois da publicação do card no bucket.

Modelo dos workflows de release: `nfse-api-release.yml`. Entrada `source_revision` com SHA de 40 caracteres igual ao `origin/main`; só a ref `main` e o usuário guicthome; ambiente `production`; `npm ci`; checagens completas; `wrangler d1 migrations apply --remote` (só no csv-links); `wrangler deploy --strict`; health check com novas tentativas; testes negativos (por exemplo, `GET /v1/me` sem token devolve 401); e `wrangler rollback` automático em caso de falha. As migrations são aditivas e compatíveis com a versão anterior, porque o rollback do código não desfaz migrations.

Configuração de produção do csv-links: `workers_dev: false`, `preview_urls: false`; rotas `csv.online/*`, `www.csv.online/*` e `pre.csv.online/*` na zona `csv.online`; domínio próprio `links-api.grupocsv.com`; bindings `DB` (D1 `csv-links`), `ROUTES` (KV `csv-links-routes`), `AUTH` (service `csv-auth`) e os limitadores de taxa; variáveis `SERVICE_VERSION`, `ADMIN_ORIGINS`, `OG_GENERIC_URL` e `BLOCKED_HOSTS`; Cron Trigger diário; observability ligada.

### 16.2 Preparação na Cloudflare (revisor-publicador)

1. Criar o D1 `csv-links` e o KV `csv-links-routes` e passar os IDs ao implementador pelo handoff privado. Feito em 22/10/2026. O D1 foi criado com a dica de localização `enam` (leste da América do Norte), a mais próxima do Brasil entre as que o D1 aceita, porque ele não roda na América do Sul. O banco está vazio; as tabelas nascem das migrations do PR-1.
2. Criar o registro `pre.csv.online` (AAAA `100::` com proxy). Feito em 22/10/2026. Ele resolve nos resolvedores públicos e, sem Worker, responde 522, como esperado.
3. Confirmar que o token do ambiente `production` do backend consegue publicar rotas na zona `csv.online` e criar o domínio `links-api.grupocsv.com`. Esse token é segredo do ambiente e não pode ser lido; a confirmação acontece no primeiro release do csv-links. Se faltar permissão, o release falha sem afetar o público, porque as regras provisórias continuam respondendo em `csv.online` e `www.csv.online` antes de qualquer Worker (seção 16.3). Nesse caso, parar e pedir orientação, porque envolve credencial (D30).

### 16.3 Virada do csv.online/blog

Condição prévia: o card genérico está publicado no bucket (seção 12.1) e responde 200 com `image/jpeg`. Sem ele, as etapas 1 a 4 podem ser feitas em `pre.csv.online`, mas a etapa 5 espera.

1. Publicar o csv-links pelo workflow e conferir `GET https://links-api.grupocsv.com/v1/health` e `https://pre.csv.online/_csv/health`.
2. Pelo Admin, criar o rotativo `blog` com o post "Organizar o cuidado por condição: por onde começar" (D3), escolhido na lista do blog.
3. Validar em `https://pre.csv.online/blog`: 302 único para o post, `Cache-Control: no-store` e `X-Csv-Links-Version`.
4. Rodar os testes de produção da seção 17.2 em `pre.csv.online`.
5. Desativar as duas Redirect Rules provisórias (`enabled: false`), sem apagá-las. Como elas rodam antes dos Workers, só então o csv-links passa a responder em `csv.online` e `www.csv.online`.
6. Repetir os testes da seção 17.2 em `csv.online` e `www.csv.online`, por http e https e com `utm_`.
7. Depois de 7 dias sem incidente, apagar as regras provisórias e o registro `pre.csv.online`, e retirar a rota `pre.csv.online/*` num release.

### 16.4 Rollback

| Situação | Ação | Tempo esperado |
|---|---|---|
| Falha logo após a virada | Reativar as duas Redirect Rules provisórias | Segundos |
| Versão nova do csv-links com defeito | `wrangler rollback` pelo workflow ou release de um SHA anterior | Minutos |
| Dados gravados por engano | Restaurar destino pelo histórico (preferível) ou Time Travel do D1 seguido de `rebuild-kv` | Minutos |
| Aba do Admin com defeito | Reverter o PR-3 por PR; o Hub publica a versão anterior | Minutos |
| csv-assets ou Open Pages com defeito | `wrangler rollback` pelos workflows novos | Minutos |
| Proteção de e-mail precisa sair | Apagar os 3 registros de cada zona, pelos IDs do handoff privado | Minutos, mais o TTL de 3.600 s |

## 17. Testes e critérios de aceite

### 17.1 Testes automatizados (no PR)

Suíte com vitest e `@cloudflare/vitest-pool-workers`, como no nfse-api, usando D1 e KV locais e um serviço `AUTH` falso.

| ID | Teste | Resultado esperado |
|---|---|---|
| T01 (obrigatório) | Cadastrar um rotativo, acessar, trocar o destino e acessar de novo | O primeiro acesso dá 302 para o destino inicial; depois da troca, novos acessos dão 302 para o novo destino; o endereço público não muda |
| T02 (obrigatório) | Criar um estático para o post A e um rotativo também para o post A; trocar o rotativo para o post B | O estático continua com 302 para o post A |
| T03 | Criação com nome inválido, reservado ou repetido; duas criações simultâneas com o mesmo nome | 422 ou 409; nas simultâneas, uma dá 201 e a outra 409 |
| T04 | Duas trocas simultâneas com o mesmo `expected_version` | Uma dá 200 e a outra 409; o histórico tem um só evento |
| T05 | Autorização: sem token, token `shared_`, sessão de portal que não é admin, admin e superadmin | 401, 401, 403 e as permissões da tabela da seção 8.2 |
| T06 | Correção de estático por admin; por superadmin sem motivo, com motivo curto ou com nome errado; por superadmin correto | 403, 422, 422, 422 e 200 com evento `estatico_corrigido` |
| T07 | Cabeçalhos de todo redirecionamento | 302, `Cache-Control: no-store` e nunca 301 ou 308 |
| T08 | Desativar, reativar, expirar e excluir | 410, 302, 410 e 404; após a exclusão, um link novo com o mesmo nome pode ser criado na hora e começa sem histórico nem métricas, e o histórico antigo continua consultável |
| T09 | Restaurar destino anterior | Cria um destino novo com a mesma URL e um evento `destino_restaurado` |
| T10 | Arquivar | O roteamento continua; a lista padrão oculta o link |
| T11 | Parâmetros | `utm_` passam (no máximo 5); outros parâmetros são descartados; um `utm_` que já existe no destino mantém o valor do destino; nenhum parâmetro muda o host |
| T12 | Validação de destino | Recusa `http:`, `javascript:`, `data:`, credenciais na URL, IPs literais, `localhost`, porta explícita, `csv.online` e subdomínios e os hosts de `BLOCKED_HOSTS` |
| T13 | SSRF no teste | Recusa DNS privado, salto para IP privado, salto para `http:` e mais de 5 saltos; respeita o tempo limite |
| T14 | Falha de dependências | `AUTH` fora do ar: API devolve 503 sem gravar. KV com acerto e D1 fora do ar: o clique redireciona. KV fora do ar: o clique usa o D1. Os dois fora do ar: página 503. API do blog fora do ar: 502 em `/blog/posts`, e a URL digitada funciona |
| T15 | KV sem chave e D1 com o link | Redireciona e regrava o KV |
| T16 | Robô de prévia | Destino sem prévia: 200 com a página só de prévia e o card. Destino com prévia ou não testado: 302. Em ambos, a métrica conta robô |
| T17 | Métricas | A soma separa clique de robô e destino de destino; o esquema não tem coluna de IP nem de User-Agent; a retenção apaga o que tem mais de 24 meses |
| T18 | `www.csv.online` e `http://` | Mesmo comportamento de `https://csv.online`, com um único 302 direto ao destino |
| T19 | Área do csv.email | Grava com `expected_version`; recusa os padrões de segredo com 422; os itens verificáveis só ficam "verificado" depois de um teste |
| T20 | Interface (Playwright, com a API simulada) | A aba aparece no menu; criar, trocar, ver conflito 409, restaurar e gerar QR Code funcionam; sem rolagem horizontal em 1440, 768, 390 e 320 px; axe sem violação séria ou crítica; as abas existentes continuam funcionando |
| T21 | Card nas Open Pages e no csv-assets | Página sem `og_image` usa o card; página com `og_image` não muda; `assets.grupocsv.com/` devolve JSON para clientes de API e HTML com prévia para navegador e robô |
| T22 | `og_hub-v2.jpg` | JPEG de 1200 x 630, com menos de 300 KB e SSIM de pelo menos 0,99 contra o `og_hub.png` original; `config.mts` e `docs/index.md` apontam para ele; o `og_hub.png` continua byte a byte igual |

O implementador entrega a suíte do csv-links e a do Admin verdes, o typecheck limpo, a varredura de segredos limpa e o dry-run do wrangler bem-sucedido. As suítes já existentes nos três repositórios continuam passando.

### 17.2 Testes em produção (revisor-publicador)

| ID | Teste | Critério de aceite |
|---|---|---|
| P01 | T01 em produção, com um rotativo temporário `teste-rotativo` apontando para dois posts reais do blog | Depois da troca, `X-Csv-Links-Version` sobe e o `Location` muda. O tempo até a mudança é medido e registrado |
| P02 | T02 em produção, com um estático temporário | O estático continua no post original |
| P03 | `csv.online/blog`, `www.csv.online/blog`, `http://csv.online/blog` e `csv.online/blog?utm_source=teste` | Um único 302 para o post vigente, com `no-store`; o `utm_source` passa |
| P04 | Troca do `blog` pelo Admin para outro post e retorno ao post vigente | O painel passa de "em propagação" a "confirmado"; o histórico mostra os dois eventos |
| P05 | Robôs (User-Agent do WhatsApp, do LinkedIn e do Facebook) em `csv.online/blog` | Recebem 302 e chegam à capa do post |
| P06 | Link inexistente, desativado e expirado | 404, 410 e 410, com as páginas da seção 14 |
| P07 | Admin em 1440, 768, 390 e 320 px, no navegador real | Sem rolagem horizontal e sem erro de console |
| P08 | Permissões | Um admin não consegue corrigir estático nem excluir, mesmo chamando a API direto |
| P09 | Prévias | Open Pages sem imagem própria, `assets.grupocsv.com/` e as páginas de erro do csv.online mostram o card no LinkedIn Post Inspector e no Facebook Sharing Debugger |
| P10 | Limpeza | Os links temporários são excluídos depois dos testes |

## 18. Documentação

| Entregável | Local | Responsável |
|---|---|---|
| PRD (este arquivo) | `docs/_infra/projetos/central-de-links/prd.md` no grupocsv/hub | Revisor-publicador |
| Guia de operação público (uso, troca, restauração, rollback, sem IDs) | `docs/_infra/projetos/central-de-links/operacao.md` no grupocsv/hub | Implementador |
| README técnico do Worker | `workers/csv-links/README.md` no grupocsv/backend | Implementador |
| Handoff privado (IDs, `BLOCKED_HOSTS`, rollback detalhado e prompt de ativação) | Diretório de handoffs da VPS-CSV | Revisor-publicador |
| Guia Técnico do Grupo CSV no Notion | Página do Guia Técnico | Revisor-publicador |
| Entrada do card no `manifest.json` do bucket | Bucket de assets | Revisor-publicador |
| Registros de início, decisões, checkpoints, testes, publicação e pendências | ACB e Hindsight | Implementador e revisor-publicador, cada um no seu trecho |

## 19. Papéis e regras de execução

| Regra | Implementador | Revisor-publicador |
|---|---|---|
| Onde trabalha | VPS-CSV, em worktrees novas a partir de `origin/main` | Sessão própria, com acesso à Cloudflare |
| Código e testes | Escreve tudo | Revisa e devolve as correções ao implementador, no mesmo PR (D28) |
| Commits | Atômicos, em português | — |
| Push e PR | Abre os PRs | — |
| Merge e publicação | Não faz | Faz depois da revisão e dos checks verdes (D30) |
| Chave da Cloudflare | Nunca recebe (D29) | Usa a própria, sem expor |
| Fora de alcance | csv-auth, csv-gateway, RLS, n8n, buckets existentes (configuração), DLQ, crons existentes, WAF e domínios além de `links-api.grupocsv.com` e das rotas de `csv.online` | Os mesmos, salvo nova autorização de Guilherme |
| Segredos | Nenhum no código, nos testes, nos logs, no PR, no ACB ou no Hindsight | O mesmo |
| Memórias | Registra no ACB e no Hindsight o início, os checkpoints e o fim | Registra a revisão, a publicação e a validação |
| Paradas obrigatórias | Bloqueio técnico real, dúvida material sobre uma decisão confirmada | Ação destrutiva, contratação, credencial e mudança de e-mail fora da D24 |

## 20. Riscos e pendências

| Item | Situação | Tratamento |
|---|---|---|
| Permissão do token de produção do backend na zona csv.online | Não verificada | Seção 16.2, item 3 |
| Permissão do segredo de Cloudflare do csv-open-pages para publicar Workers | Não verificada | Conferir no dry-run do workflow novo; se faltar, parar (credencial) |
| Escolha da versão do card | Pendente com Guilherme | O código usa `OG_GENERIC_URL` e não depende da escolha. A falta do card bloqueia só a virada (seção 16.3) |
| Teste real no aplicativo WhatsApp | Pendente com Guilherme | Depois da publicação do card |
| Cache da prévia no LinkedIn (cerca de 7 dias, segundo fontes secundárias) | Hipótese | LinkedIn Post Inspector na validação |
| Propagação do KV acima de 60 s | Comportamento documentado da Cloudflare | Situação "em propagação" e conciliação diária |
| Classificação de robôs por User-Agent | Aproximada | Página só de prévia com `meta refresh`; métricas rotuladas como aproximadas |
| Código do csv-assets fora do controle de versão | Risco de divergência | Primeiro commit idêntico ao publicado, conferido por SHA-256 |
| Checks do csv-links e do csv-assets fora dos checks obrigatórios do ruleset | Recomendação | O revisor-publicador só faz merge com eles verdes; incluir no ruleset depende de autorização |

## 21. Referências

| Fonte | Uso |
|---|---|
| RFC 9110, seções 15.4.2, 15.4.3, 15.4.8 e 15.4.9 | 301 e 308 podem ser guardados pelo navegador por heurística; 302 e 307, não |
| RFC 9111, seção 5.2.2.5 | `no-store` proíbe guardar a resposta |
| RFC 7505 e RFC 7208 | MX nulo e SPF `-all` |
| Cloudflare KV, "How KV works" e "Read key-value pairs" | Consistência eventual, cerca de 60 s, `cacheTtl` mínimo de 30 s e cache de leitura negativa |
| Cloudflare D1, "Read replication" e "Time Travel" | Instância primária única e restauração de 30 dias |
| Cloudflare Ruleset Engine, "Phases list" | Single Redirects rodam antes dos Workers |
| Cloudflare Email Routing (limites) e Email Service (preços) | Seção 11 |
| Dub, "Update a link" e "Organizing links" | Identidade (id) separada do endereço (`domain` e `key`) e do destino (`url`); etiquetas e arquivamento |
| Shlink, "Dynamic rule-based redirects" | Destino padrão separado de regras condicionais; regras ficam fora deste produto |
| Meta, "WhatsApp link previews" (21/05/2026) | `<head>` nos primeiros 300 KB, `og:image` abaixo de 600 KB, título, descrição e URL obrigatórios |
| LinkedIn, ajuda a521928, e Meta, "Sharing for webmasters: images" | Dimensões mínimas e proporção da imagem |
| Resend, página de preços | Seção 11 |
| Google Workspace, página de preços no Brasil | Seção 11 |
