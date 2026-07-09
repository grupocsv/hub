# PRD — Consistência do Hub CSV: widget de logout, erro "415", sincronização de portais, cards e dados TEA

| Campo | Valor |
|---|---|
| **Data** | 07/07/2026 |
| **Autor** | Guilherme Thomé (ditado) · consolidação por Claude Code |
| **Escopo** | hub.grupocsv.com (repo `grupocsv/hub`) + workers relacionados |
| **Status** | Executado em 07–08/07/2026 (exceto rotação do token, procedimento entregue; e captura do "415" em produção, que depende de ocorrência) |
| **Método** | Diagnóstico por 6 agentes paralelos com evidência arquivo:linha; implementação revisada em 3 rodadas independentes |

## 1. Contexto e objetivo

O Hub CSV é o centro documental da verdade sobre a infraestrutura do Grupo CSV e deve caminhar sempre sincronizado com ela. Esta rodada consolida cinco problemas relatados em produção e uma pergunta de dados, com diagnóstico baseado em evidência (nada inventado; incertezas explicitadas em §8):

1. Botão "Sair" (widget do `hub-auth.js`) sobreposto ao botão "← Hub Unimed" no header da `tea.html` — e situações análogas em outras páginas.
2. Erro "415" ao navegar em páginas do portal VitePress, resolvido só com hard refresh (Ctrl+Shift+R); correção anterior não resolveu.
3. Dessincronização entre painel admin, portal do cliente, menu expansivo e `tools.json`.
4. Cards internos das páginas de cliente visualmente fora do padrão ("feios").
5. Processo oficial para publicar página no portal do cliente + versão pública (worker "/p/" e Open Pages).
6. Dados da `tea.html`: o que ainda existe e quais recortes novos são possíveis.

## 2. Frente 1 — Overlap do widget "Sair" ✅ EXECUTADO

**Diagnóstico.** Das 20 páginas que carregam `scripts/hub-auth.js` (17 HTMLs estáticos + 3 índices VitePress que injetam o script em runtime), 16 caíam no fallback `position:fixed; top:0; right:0` (o widget só reconhecia headers com classes Tailwind ou VitePress). Quatro tinham elemento clicável sob o widget: `unimed/tea.html` (botão "← Hub Unimed" — confirmado em produção), `unimed/cuidadocoordenado.html` (watermark AxiaCare), `unihealth/calc-plantao.html` (toggle de tema + logo ICDS) e `axia/propostas.html` (pill "Hub" em notebooks). Agravante: em `unimed/drg.html` o widget montava inline via classes Tailwind falsas, mas com cores de fundo claro sobre header escuro `#004e4c` (contraste ~1:1, ilegível).

**Solução implementada (v2.5.0 do hub-auth.js).** Contrato de slot explícito, aditivo e retrocompatível:

```html
<span id="hub-auth-slot" data-hub-auth-theme="dark"></span>
```

- O slot tem precedência sobre os seletores automáticos; páginas sem slot não mudam em nada.
- `data-hub-auth-theme="dark"` ativa variante clara do badge/botão para headers escuros.
- Integrado em: `tea.html` e `drg.html` (slot dark no header), `propostas.html` e `calc-plantao.html` (slot claro), `cuidadocoordenado.html` (watermark deslocada para `top:72px`, abaixo da faixa do widget).
- Cópia espelho `docs/public/scripts/hub-auth.js` sincronizada — a duplicação do script em dois caminhos é dívida técnica conhecida (higiene futura: unificar a origem no deploy).
- Contrato documentado no cabeçalho do script e em `skills/public-pages.md`.

**Critério de aceite.** Em produção, com sessão ativa: nenhum elemento clicável coberto pelo widget nas 4 páginas; badge legível no header escuro de tea/drg; páginas não alteradas continuam idênticas.

**Pendente (baixa prioridade).** `unihealth/retornopa.html` e `unimed/gce.html` têm overlap apenas condicional em telas estreitas — monitorar e só intervir se reportado.

## 3. Frente 2 — Erro "415" no portal VitePress ✅ MITIGAÇÃO EXECUTADA · diagnóstico definitivo pendente de captura

**Diagnóstico (contraintuitivo).** Não existe nenhum produtor de HTTP 415 no stack de navegação: `hub.grupocsv.com` é servido por GitHub Pages/Fastly (sem Cloudflare no caminho — sondas devolvem 404/405/206, nunca 415); não há service worker (nunca houve, `/sw.js` → 404); o worker `csv-auth` (código auditado integralmente) não emite 415 e engole falhas de rede. A correção anterior (`target=_self`, commit `d4c601f`) mirava outro sintoma (interceptação SPA de links standalone → 404) e não toca em cache.

**Hipótese nº 1 (mais provável) — chunk obsoleto pós-deploy.** O site faz vários deploys por dia (ex.: 3 em 23 min em 06/07) e TODOS os assets têm `cache-control: max-age=600`. Na janela pós-deploy, a navegação SPA pede um chunk `.js` com hash antigo; o Vite/VitePress falha com erro de "MIME type" (media type — plausivelmente lido como "415 Unsupported Media Type") e renderiza 404 in-app; só hard refresh renova HTML + hashmap. Isso também explica por que a correção anterior "não funcionou": ela só age depois que o usuário recebe o HTML novo — exatamente o que o hard refresh faz.

**Mitigação implementada** (recomendação oficial do Vite): handler de `vite:preloadError` em `docs/.vitepress/theme/index.ts` que recarrega a página uma única vez ao detectar chunk perdido (guarda anti-loop em `sessionStorage`).

**Teste de confirmação na próxima ocorrência** (diagnóstico definitivo — roteiro para Guilherme):
1. DevTools → aba Network → clicar na request vermelha.
2. Se os response headers mostrarem `server: GitHub.com` + `x-fastly-request-id` → hipótese 1 (stale chunk); a mitigação deve ter resolvido.
3. Se NÃO houver esses headers → há um intermediário (proxy corporativo, antivírus com inspeção HTTPS, extensão) devolvendo 415 real → hipótese 2; salvar HAR e abrir issue.
4. DevTools → Application → Service Workers deve estar vazio (fecha em definitivo a hipótese de SW).

## 4. Frente 3 — Sincronização admin ↔ portal ↔ menu ↔ tools.json ⚙️ PARCIALMENTE EXECUTADO

**Como funciona hoje (mapeado).**
- `scripts/generate-portal-tools.py` roda no CI a cada push e gera `{portal}/tools.json` (unimed, unihealth, icds) a partir dos `<title>` dos `.html`; respeita `<meta name="hub-menu" content="hidden">` e mescla `{portal}/extras.json` (entradas externas, ex. páginas públicas).
- Menu expansivo da home (`docs/index.md`) e índices de portal (`docs/{portal}/index.md`) fazem **fetch de tools.json em runtime** → já são auto-sincronizados.
- O painel admin NÃO lê tools.json (lista páginas públicas via `/p/registry.json` manual + APIs Open Pages).

**Onde quebra.** (a) Os `index.html` ESTÁTICOS da raiz dos portais têm cards hardcoded — foi neles que os cards mortos apareceram (unimed corrigido hoje mais cedo no PR #15, commit `0d59728`; unihealth estava com 2 cards mortos até esta rodada — `fios.html`, `isc-cesarianas.html` — e sem card para `repasse.html`); (b) `generate-manifest.py` usa dicionário hardcoded `PRODUCT_TAXONOMY` com 10 entradas de páginas já deletadas e sem `icds/slides.html`; (c) o workflow `sync-r2-ai-search.yml` envia ao R2/AI Search o checkout do repo (manifest stale de março + estáticos com cards mortos), não o dist gerado; (d) a lista de portais está triplicada (gerador, home, deploy.yml).

**Executado nesta rodada:** cards mortos removidos e card de repasse adicionado em `unihealth/index.html`; cards estáticos restilizados (ver §5).

**Executado em 08/07/2026 (aprovação do Guilherme — "Execute o PRD"):**
| Ação | Status |
|---|---|
| Guard-rail no CI: `scripts/check-portal-links.py` falha o build se algum href local (relativo OU absoluto) dos `index.html` estáticos **e dos índices VitePress servidos em produção** (`docs/{portal}/index.md`), ou `origin_page` do registry, apontar para arquivo inexistente (step "Check portal links" no `deploy.yml`, fail-fast antes do build) | ✅ executado — na primeira execução já flagrou o `origin_page` morto do registry (icds/tea.html), corrigido junto |
| Geradores (`generate-portal-tools.py` + `generate-manifest.py`) rodando no `sync-r2-ai-search.yml` antes do rclone, com `fetch-depth: 0` | ✅ executado — AI Search deixa de indexar artefatos stale |
| `generate-manifest.py` lê `<meta name="hub-category">`/`<meta name="hub-entity">` como fonte primária, com `PRODUCT_TAXONOMY` como fallback transitório; 10 entradas mortas removidas do dicionário; `icds/slides.html` incluída | ✅ executado — migração das páginas para meta tags pode ser gradual |
| `{portal}/tools-overrides.json` aplicado pelo gerador (merge raso pós-extração); `unimed/tools-overrides.json` criado preservando as 4 notas manuais que a regeneração apagaria | ✅ executado |
| Dinamizar (fetch de tools.json) ou remover os `index.html` estáticos | ⏸️ decisão registrada: **mantidos como fallback estático** — em produção o VitePress os sobrescreve, e o guard-rail acima passa a impedir estruturalmente o link morto, que era o risco real; dinamizá-los adicionaria dependência de JS sem ganho |

## 5. Frente 4 — Padrão visual dos cards internos ✅ EXECUTADO

**Diagnóstico.** O "bonito" é a home (`docs/index.md`): card branco, borda neutra 1px, sombra suave, barra superior 3px sempre visível, título escuro + descrição cinza, hover neutro. Os portais de parceiros (unimed/unihealth/icds, versões `docs/*/index.md` — que são as servidas em produção — e estáticas da raiz) usavam: fundo tingido da marca, sombra colorida pesada, barra escondida até o hover, título gigante na cor da marca, botão com troca brusca de cor, card "featured" verde sólido.

**Executado:** bloco `.portal-card` padrão (tokens do design system drg/tea: radius 16px, shadow-soft, ease/duração padrão, accent parametrizado por portal — Unimed `#00995d/#8baf1f`, Unihealth `#013d19/#ec7106`, ICDS `#1B3A5C/#2a6496`) aplicado às 6 páginas, mantendo classes e lógica JS de fetch intactas. Axia/Medvalor/Thera já seguiam padrão limpo — não tocados. Admin é dashboard funcional — não tocado.

**Evolução proposta (opcional):** extrair `<meta name="description">` no gerador para popular `desc` no tools.json e habilitar cards com descrição como na home.

## 6. Frente 5 — Páginas públicas: "/p/" (legado) vs Open Pages (vigente) ✅ DOCUMENTAÇÃO EXECUTADA

**Como é oficialmente hoje (auditado):**
- **Legado `/p/`**: cópia estática em `/p/{slug}/index.html` + `p/registry.json` (manual), servida pelo GitHub Pages; revogação/restauração pela aba Links Públicos do admin (via csv-auth + commit automático). Passo a passo em `skills/public-pages.md`. **Somente manutenção.**
- **Vigente Open Pages**: worker `csv-open-pages` + R2 + KV em `open.grupocsv.com` (e `hub.unimedgv.com`), com Auth Gate opcional. Três vias de publicação: aba Links Públicos do admin (botão "Nova Página"), painel `open.grupocsv.com/_admin/`, ou tool MCP `open_page_publish` (Extensio). Hoje: 20 páginas ativas.
- **Sincronização com o menu do portal**: entrada manual em `{portal}/extras.json` → aparece no `tools.json` com `external:true` no próximo push (ex.: `icds/extras.json` → `/p/tea-dataset/`).

**Executado:** `llms.txt` corrigido (apontava o fluxo legado como norma); `skills/public-pages.md` atualizado (aviso de legado + 3 vias Open Pages + passo do extras.json + contrato do slot hub-auth); seção de sincronização de menus adicionada a `docs/_infra/public-pages.md`.

**Atualização de 08/07/2026 (execução aprovada):**
1. **⚠️ SEGURANÇA — ENCERRADO por decisão do Guilherme (08/07/2026):** o token Bearer hardcoded (`OP_AUTH_TOKEN`) foi **removido** do `admin/index.html` (e da cópia `docs/public/admin/`): o admin agora pede o token uma única vez (botão "Informar token") e o guarda em `localStorage` (`op_admin_token`), com tratamento de 401/403. **Ordem do Guilherme: o token NÃO será rotacionado** — risco considerado aceitável por não ter havido uso indevido; nenhum agente deve reabrir esta pendência nem rotacionar por conta própria. O procedimento de rotação (auditado: ambos os workers validam contra o KV `config:admin_token` e expõem `POST /api/change-password`; a tool MCP `open_page_publish` grava direto no R2/KV e não seria afetada) permanece documentado aqui apenas como referência, caso a decisão mude — nesse caso, registrar o novo valor no Vault do Notion.
2. `tea-dataset` — ↩️ **REVERTIDO em 08/07/2026 por decisão do Guilherme** ("deve ficar exatamente como era antes; não mexer"): `/p/tea-dataset/` voltou a ser a página completa original (5.003 linhas), `icds/extras.json` voltou a apontar para `/p/tea-dataset/`, o `csv-email` segue emitindo a URL `/p/` e a taxonomia do manifest voltou a `webapp`. A duplicidade com `open.grupocsv.com/tea-dataset/` fica aceita conscientemente. Única diferença vs. estado original: o campo `origin_page` do `p/registry.json` (que apontava para `icds/tea.html`, arquivo que nunca existiu) ficou de fora — era metadado quebrado, invisível ao usuário, e reprovaria no guard-rail de links do CI.
3. Portais axia/medvalor/thera — ✅ documentado em `docs/_infra/public-pages.md` (§ Sincronização de Menus): índices curados manualmente, sem menu dinâmico; incluí-los no gerador criaria artefatos que nada lê.

## 7. Frente 6 — Dados da tea.html: o que existe e o que dá para recortar

**Resposta direta à pergunta.** Os dados brutos NÃO existem no repositório nem em nenhum commit da história — em 53 commits, os nomes das clínicas só aparecem dentro da própria `tea.html`. O export Plotly original embutia exatamente os mesmos 4 campos da página atual (nome, intensidade anual, custo/sessão, volume normalizado por categoria). Não há planilha-fonte versionada.

**Porém — descoberta relevante:** os valores absolutos são **reconstruíveis matematicamente** com alta confiança: cada intensidade é uma fração exata sessões/beneficiários (ex.: 19,0952... = 401/21) e o "size" é exatamente proporcional às sessões dentro da categoria. A solução inteira mínima fecha os 31 registros e é validada por 25/31 custos totais caindo em valores monetários redondos (ex.: Lagares 401 sessões × R$ 200,1247 = R$ 80.250,00; Casa Unimed 2.823 sessões / 222 beneficiários × R$ 120,00 = R$ 338.760,00). Totais da rede na solução mínima: **≈14.942 sessões, ≈728 registros-beneficiário, ≈R$ 2,35 mi**. Arquivo versionado: `unimed/data/tea-reconstructed-2024.json` (com rótulo explícito "valores inferidos — sujeitos a confirmação" nos metadados).

**Recortes possíveis HOJE (deriváveis):** custo anual por beneficiário por prestador (intensidade × custo/sessão); percentis e dispersões; com a reconstrução: custo total por prestador, participação % no gasto da rede, médias ponderadas por volume.

**Recorte "sessões por semana": possível como aritmética (intensidade ÷ 52), mas clinicamente frágil** — assume permanência de 12 meses (quem entrou em julho tem dose real ~2× a calculada) e "sessão" ≠ "hora" (prescrição ABA é em horas/semana). A média da rede daria ≈0,48 sessão/semana, valor sem significado clínico. Se publicado, rotular como "média anual ÷ 52", nunca como dose.

**Impossíveis sem dados brutos:** distribuição mensal/sazonalidade, dose semanal real, permanência em tratamento, beneficiários únicos deduplicados, horas de terapia.

**Checklist de reanexo para o próximo ciclo de dados** (habilita tudo acima + resolve as duplicidades Ananda/Maryana):
- Por prestador + competência mensal: CNPJ/CPF, beneficiários únicos, sessões, custo faturado, duração/horas por sessão.
- Por beneficiário pseudonimizado: id, meses em tratamento, sessões/mês.
- Versionar o CSV-fonte no repo (ex.: `unimed/data/tea-aba-2025.csv`) — evita repetir a perda de rastreabilidade.

*Nota:* há indício de base TEA mais rica fora do repo (Signal S24/2026: "Análise Estatística TEA — base de pacientes do CTE") — candidata a fonte para os recortes clínicos.

## 8. Incertezas declaradas (não inventado — não confirmado)

- O código de status literal "415" nunca foi capturado (sem HAR/screenshot); o roteiro do §3 fecha o diagnóstico na próxima ocorrência.
- Workers `csv-open-pages`/`hub-unimedgv` vivem em repos privados — comportamento confirmado só por documentação + client do admin.
- A escala absoluta da reconstrução TEA é determinada a menos de um múltiplo inteiro (assumida a solução mínima, fortemente plausível pelos valores monetários).
- Overlaps de `propostas.html`/`calc-plantao.html` derivados por análise estática de CSS (faixas de viewport estimadas).
- Não confirmado por que o `manifest.json` commitado em junho carrega `lastUpdated` de março.

## 9. Adendo — estado final consolidado (09/07/2026)

Registro das decisões e entregas posteriores à execução do PRD, para que qualquer sessão futura (ou o Manus) retome do ponto exato:

1. **Token Open Pages:** decisão encerrada — **não rotacionar** (ordem do Guilherme; ver §6.1). Token informado por ele no admin via botão "Informar token".
2. **tea-dataset:** revertido — `/p/tea-dataset/` é a página completa oficial (ver §6.2); a duplicidade com a cópia no Open Pages é aceita. O redeploy do `csv-email` deixou de ser necessário (o worker já emite a URL `/p/` correta).
3. **Página pública do painel ABA (Opção C):** publicada em `https://open.grupocsv.com/painel-tea/` com **Auth Gate embutido no HTML** (senha compartilhada do csv-open-auth, e-mails `@unimedgv.com.br`/`.coop.br`, notificação de acesso por e-mail, sessão de 4h) — trancada desde o primeiro byte, sem janela de exposição. Marcador `id="gate"` impede injeção dupla pelo worker. Não incluída no menu do portal (a versão autenticada `unimed/tea.html` já está lá).
4. **Dados TEA:** o Guilherme enviará as planilhas oficiais — os novos recortes sairão dos dados reais (a reconstrução inferida `unimed/data/tea-reconstructed-2024.json` fica como referência de validação cruzada).
5. **Migração ped-amb/vivapleno/scg100 para Open Pages:** confirmada como já realizada por outro agente (páginas ativas desde 05/07/2026); cópias locais permanecem no portal autenticado.
6. **Memórias corrigidas:** os registros do Hindsight que afirmavam a canônica do tea-dataset e as pendências de rotação/redeploy foram invalidados com justificativa; o ACB recebeu os registros de supersessão (decisões #179/#180 superadas; atividades #2906/#2908/#2949/#2950).

## 10. Critérios de aceite globais

1. Nenhum elemento clicável coberto pelo widget de logout em nenhuma página autenticada.
2. Zero "415"/tela branca na navegação do docs após a janela de deploy (ou captura HAR encaminhada se persistir).
3. Nenhum card de portal apontando para arquivo inexistente (hoje e estruturalmente, após o guard-rail do CI).
4. Cards de unimed/unihealth/icds visualmente coerentes com a home (card branco, barra 3px fixa, sombra neutra).
5. Documentação de páginas públicas sem contradições entre `llms.txt`, `skills/` e `docs/_infra/`.
6. Nenhum dado TEA inferido publicado sem rótulo de inferência.
