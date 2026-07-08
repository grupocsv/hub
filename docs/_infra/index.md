---
layout: page
title: Infraestrutura — Fonte Única da Verdade
---

<style scoped>
.VPPage { padding: 0 !important; }

.infra-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background:
    radial-gradient(1400px 600px at -10% -20%, #e8f0f6 0%, transparent 60%),
    radial-gradient(1200px 500px at 110% 0%, #ebf7f1 0%, transparent 60%),
    #F6F4EF;
  min-height: calc(100vh - 64px);
}
.dark .infra-page { background: var(--vp-c-bg); }

.frame {
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(13,38,76,.06);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(13,38,76,.14);
  padding: clamp(18px, 4vw, 28px);
  margin-bottom: 24px;
}
.dark .frame { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.hero-section h1 {
  margin: 0 0 6px;
  font-size: clamp(1.6rem, 2.3vw + 1rem, 2rem);
  color: #196396;
  border: none;
}
.dark .hero-section h1 { color: #5da9e0; }
.hero-section .subtitle { font-size: 0.95rem; margin-top: 8px; line-height: 1.6; color: #5b6470; }
.hero-section .version { font-size: 0.82rem; color: #94a3b8; margin-top: 6px; }

.section-title {
  margin: 0 0 12px;
  color: #2d3445;
  font-size: clamp(1.15rem, 1.1vw + 0.9rem, 1.35rem);
  border: none;
}
.dark .section-title { color: var(--vp-c-text-1); }
.section-desc { color: #5b6470; font-size: 0.92rem; margin-bottom: 16px; line-height: 1.6; }

.subsection-title {
  margin: 20px 0 8px;
  color: #196396;
  font-size: 1.05rem;
  border: none;
  font-weight: 700;
}
.dark .subsection-title { color: #5da9e0; }

.infra-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  margin-bottom: 16px;
}
.infra-table th {
  background: #f1f5f9;
  color: #2d3445;
  font-weight: 700;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid #e2e8f0;
}
.dark .infra-table th { background: #1e2430; color: #e2e8f0; border-color: #334155; }
.infra-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #374151;
  vertical-align: top;
}
.dark .infra-table td { border-color: #334155; color: #d1d5db; }
.infra-table tr:last-child td { border-bottom: none; }
.infra-table code { font-size: 0.82rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
.dark .infra-table code { background: #1e2430; }

.resource-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}
@media (min-width: 760px) { .resource-grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 960px) { .resource-grid.tri { grid-template-columns: 1fr 1fr 1fr; } }

.resource-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(180deg, #1d6fa0, #195f86);
  color: #fff !important;
  border-radius: 14px;
  padding: 16px 18px;
  text-decoration: none !important;
  box-shadow: 0 4px 12px rgba(13,38,76,.10);
  border: 1px solid rgba(0,0,0,.06);
  transition: transform .18s ease, box-shadow .18s ease;
  font-weight: 700;
  font-size: 0.95rem;
}
.resource-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(13,38,76,.20); }
.resource-btn::after { content: '>'; font-weight: 700; font-size: 1.4rem; opacity: 0.9; }

.resource-btn.secondary {
  background: linear-gradient(180deg, #eef4fa, #e6eef7);
  color: #1b2a3a !important;
}
.dark .resource-btn.secondary { background: linear-gradient(180deg, #2a3040, #1e2430); color: #ddd !important; }

.resource-btn.axia { background: linear-gradient(180deg, #1d6fa0, #196396); }
.resource-btn.medvalor { background: linear-gradient(180deg, #ea580c, #c2410c); }
.resource-btn.thera { background: linear-gradient(180deg, #8B7CB5, #6B5B95); }
.resource-btn.dark-btn { background: linear-gradient(180deg, #334155, #1e293b); }

.empresa-block { margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,.08); }
.dark .empresa-block { border-color: var(--vp-c-divider); }
.empresa-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.empresa-header img { height: 32px; width: auto; }
.empresa-header h4 { margin: 0; font-size: 1.05rem; color: #2d3445; border: none; }
.dark .empresa-header h4 { color: var(--vp-c-text-1); }

.copy-bar {
  position: fixed;
  top: 72px;
  right: 24px;
  z-index: 20;
}
.copy-bar-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all .2s ease;
  font-family: inherit;
  line-height: 1.2;
}
.copy-bar-btn:hover { background: #e5e7eb; color: #111827; border-color: #9ca3af; }
.copy-bar-btn.copied { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
.dark .copy-bar-btn { background: #1f2937; color: #d1d5db; border-color: #4b5563; }
.dark .copy-bar-btn:hover { background: #374151; color: #f3f4f6; border-color: #6b7280; }
.dark .copy-bar-btn.copied { background: #064e3b; color: #6ee7b7; border-color: #065f46; }

.page-footer {
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(13,38,76,.10);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
  text-align: center;
}
.dark .page-footer { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }
.page-footer .small { font-size: 0.85rem; color: #5b6470; }
</style>

<div class="infra-page">

<!-- HERO -->
<div class="frame hero-section">
<h1>Infraestrutura do Ecossistema Grupo CSV</h1>
<p class="subtitle">
<strong>Fonte Única da Verdade (SSOT)</strong> de 100% da infraestrutura digital do Grupo CSV.
      Cobre produtos, backend serverless, bancos de dados, storage, domínios, DNS, agentes de IA,
      automações, APIs externas, comunicação e assets. Projetada para consumo por humanos e agentes.
</p>
<p class="version" id="page-version">Atualizada em 01 de julho de 2026</p>
</div>

<div class="copy-bar">
<button class="copy-bar-btn" id="copy-md-btn">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
Copiar página
</button>
</div>

<!-- 1. PRODUTOS DIGITAIS -->
<div class="frame">
<h2 class="section-title">1. Produtos Digitais</h2>
<p class="section-desc">Ferramentas e plataformas próprias do ecossistema, cada uma com documentação individual.</p>
<table class="infra-table">
<thead><tr><th>Produto</th><th>Função</th><th>URL</th><th>Hospedagem</th></tr></thead>
<tbody>
<tr><td><strong>Compass™</strong></td><td>Publicações estratégicas (documentos técnicos)</td><td><a href="https://hub.grupocsv.com/compass/">hub.grupocsv.com/compass/</a></td><td>GitHub Pages (VitePress)</td></tr>
<tr><td><strong>Signal™</strong></td><td>Boletim semanal de inteligência</td><td><a href="https://hub.grupocsv.com/signal/">hub.grupocsv.com/signal/</a></td><td>GitHub Pages (VitePress)</td></tr>
<tr><td><strong>Deck™</strong></td><td>Painel de contexto ativo</td><td><a href="https://deck.grupocsv.com">deck.grupocsv.com</a></td><td>Cloudflare Pages</td></tr>
<tr><td><strong>Relay™</strong></td><td>Mensagens institucionais padronizadas</td><td><a href="https://relay.axcare.com.br">relay.axcare.com.br</a></td><td>Manus (React + TS + Tailwind)</td></tr>
<tr><td><strong>RTAV™</strong></td><td>Referencial Técnico de Avaliação por Valor</td><td><a href="https://rtav.axcare.app">rtav.axcare.app</a></td><td>Manus (React + TS + Tailwind)</td></tr>
<tr><td><strong>Panta™</strong></td><td>Omnisearch federado (busca unificada)</td><td><a href="https://panta.grupocsv.com">panta.grupocsv.com</a></td><td>VPS-CSV (FastAPI + Cloudflare Tunnel)</td></tr>
<tr><td><strong>Discovery™</strong></td><td>Diagnóstico estratégico para OPSS</td><td><a href="https://discovery.axcare.app">discovery.axcare.app</a></td><td>Manus (React + TS + Tailwind)</td></tr>
</tbody>
</table>
<div class="resource-grid tri">
<a class="resource-btn" href="/_infra/ferramentas/compass">Compass™</a>
<a class="resource-btn" href="/_infra/ferramentas/signal">Signal™</a>
<a class="resource-btn" href="/_infra/ferramentas/deck">Deck™</a>
<a class="resource-btn axia" href="/_infra/ferramentas/relay">Relay™</a>
<a class="resource-btn axia" href="/_infra/ferramentas/rtav">RTAV™</a>
<a class="resource-btn" href="/_infra/ferramentas/panta">Panta™</a>
<a class="resource-btn axia" href="/_infra/ferramentas/discovery">Discovery™</a>
</div>
</div>

<!-- 2. BACKEND SERVERLESS -->
<div class="frame">
<h2 class="section-title">2. Backend Serverless (Cloudflare Workers)</h2>
<p class="section-desc">Todos os Workers ativos no ecossistema, com rotas, bindings e função.</p>

<h3 class="subsection-title">Workers do Hub CSV</h3>
<table class="infra-table">
<thead><tr><th>Worker</th><th>Rota / Domínio</th><th>Bindings</th><th>Função</th></tr></thead>
<tbody>
<tr><td><code>csv-gateway</code></td><td>api.grupocsv.com/*</td><td>D1: csv-hub, Secrets</td><td>API gateway central</td></tr>
<tr><td><code>csv-auth</code></td><td>csv-auth.guilherme-thom.workers.dev</td><td>D1: csv-hub, KV: csv-config, Secret</td><td>Autenticação e sessões (v4.1.0)</td></tr>
<tr><td><code>csv-ai</code></td><td>csv-ai.guilherme-thom.workers.dev</td><td>D1: csv-hub, Secret</td><td>Assistente IA contextual</td></tr>
<tr><td><code>csv-data</code></td><td>csv-data.guilherme-thom.workers.dev</td><td>D1: csv-hub, KV: csv-config</td><td>Dados e configurações</td></tr>
<tr><td><code>csv-cron</code></td><td>csv-cron.guilherme-thom.workers.dev</td><td>D1: csv-hub, KV: csv-config, Secret</td><td>Tarefas agendadas (v2.1)</td></tr>
<tr><td><code>csv-email</code></td><td>csv-email.guilherme-thom.workers.dev</td><td>Secret: RESEND_API_KEY</td><td>E-mail + submissions</td></tr>
<tr><td><code>csv-mail</code></td><td>mail-api.grupocsv.com/*</td><td>D1: csv-hub, Secrets</td><td>E-mail agêntico (templates)</td></tr>
<tr><td><code>csv-webhook</code></td><td>csv-webhook.guilherme-thom.workers.dev</td><td>Secret</td><td>Webhooks</td></tr>
<tr><td><code>csv-propostas</code></td><td>csv-propostas.guilherme-thom.workers.dev</td><td>R2: csv-propostas, Secret</td><td>Propostas comerciais</td></tr>
<tr><td><code>csv-assets</code></td><td>assets.grupocsv.com/*</td><td>R2: csv-open-pages</td><td>Serviço de assets estáticos</td></tr>
<tr><td><code>csv-open-pages</code></td><td>open.grupocsv.com/*</td><td>KV: csv-open-pages, R2: csv-open-pages</td><td>Páginas públicas com toggle e auth gate</td></tr>
<tr><td><code>csv-open-auth</code></td><td>csv-open-auth.guilherme-thom.workers.dev</td><td>KV: csv-open-auth</td><td>Autenticação para Open Pages (Auth Gate)</td></tr>
<tr><td><code>hub-unimedgv</code></td><td>hub.unimedgv.com/*</td><td>KV: hub-unimedgv-kv, R2: hub-unimedgv</td><td>Páginas públicas exclusivas Unimed GV</td></tr>
</tbody>
</table>

<h3 class="subsection-title">Workers de Produtos</h3>
<table class="infra-table">
<thead><tr><th>Worker</th><th>Rota / Domínio</th><th>Bindings</th><th>Função</th></tr></thead>
<tbody>
<tr><td><code>deck-vision</code></td><td>deck-vision.guilherme-thom.workers.dev</td><td>Secret: OPENAI_API_KEY</td><td>Análise visual Deck (GPT-4o)</td></tr>
<tr><td><code>decks-worker</code></td><td>decks.grupocsv.com/*</td><td>R2: decks</td><td>Geração e armazenamento de PPTX</td></tr>
<tr><td><code>tea-dataset-api</code></td><td>tea-dataset-api.guilherme-thom.workers.dev</td><td>D1: csv-hub, Secrets</td><td>Backend TEA (Data Set)</td></tr>
<tr><td><code>thera-contact</code></td><td>api.thera.tech/*</td><td>Secrets</td><td>Formulário de contato Thera</td></tr>
<tr><td><code>slides-worker</code></td><td>slides-worker.guilherme-thom.workers.dev</td><td>Secrets</td><td>Geração de slides (Slides CSV)</td></tr>
</tbody>
</table>

<h3 class="subsection-title">Workers de Agentes e Automações</h3>
<table class="infra-table">
<thead><tr><th>Worker</th><th>Rota / Domínio</th><th>Bindings</th><th>Função</th></tr></thead>
<tbody>
<tr><td><code>whatsapp-webhook</code></td><td>webhook.grupocsv.com/*</td><td>D1: whatsapp-brain</td><td>Webhook WhatsApp (WABA)</td></tr>
<tr><td><code>extensio-mcp</code></td><td>extensio-mcp.guilherme-thom.workers.dev</td><td>D1: csv-hub, D1: whatsapp-brain, Secrets</td><td>MCP Server Extensio</td></tr>
<tr><td><code>extensio-daily-pipeline</code></td><td>extensio-daily-pipeline.guilherme-thom.workers.dev</td><td>Secrets</td><td>Pipeline diário Extensio</td></tr>
<tr><td><code>agent-context-bridge</code></td><td>agent-context-bridge.guilherme-thom.workers.dev</td><td>Secrets: SUPABASE_URL, SUPABASE_KEY</td><td>MCP de contexto entre agentes (ACB)</td></tr>
<tr><td><code>manus-webhook</code></td><td>manus-webhook.guilherme-thom.workers.dev</td><td>Secrets</td><td>Receptor de webhooks do Manus</td></tr>
<tr><td><code>resend-webhook</code></td><td>resend-webhook.guilherme-thom.workers.dev</td><td>Secrets</td><td>Webhook Resend para Supabase</td></tr>
<tr><td><code>extensio-mcp-anthropic</code></td><td>extensio-mcp-anthropic.guilherme-thom.workers.dev</td><td>KV: extensio-mcp-anthropic-oauth, Secrets</td><td>MCP Server Extensio (protocolo Anthropic)</td></tr>
<tr><td><code>navia-email-ingest</code></td><td>navia-email-ingest.guilherme-thom.workers.dev</td><td>Secrets</td><td>Ingestão de e-mails do Navia</td></tr>
<tr><td><code>deck-mcp</code></td><td>deck-mcp.guilherme-thom.workers.dev</td><td>D1, Secrets</td><td>MCP Server do Deck</td></tr>
<tr><td><code>whisper-proxy</code></td><td>whisper-proxy.guilherme-thom.workers.dev</td><td>Secrets</td><td>Proxy para transcrição de áudio (Whisper)</td></tr>
<tr><td><code>axiacare-methods-mcp</code></td><td>axiacare-methods-mcp.guilherme-thom.workers.dev</td><td>D1: axiacare-methods, R2: axiacare-methods, Secrets</td><td>Methods Registry AxiaCare (API de metodos canonicos)</td></tr>
</tbody>
</table>

<h3 class="subsection-title">Workers Externos (Criale, CRT, Digital Deck)</h3>
<table class="infra-table">
<thead><tr><th>Worker</th><th>Rota / Domínio</th><th>Função</th></tr></thead>
<tbody>
<tr><td><code>criale-ai</code></td><td>criale-ai.guilherme-thom.workers.dev</td><td>IA para Criale</td></tr>
<tr><td><code>criale-todo</code></td><td>criale-todo.guilherme-thom.workers.dev</td><td>Tarefas Criale</td></tr>
<tr><td><code>criale-core</code></td><td>criale-core.guilherme-thom.workers.dev</td><td>MCP Server do Criale Core</td></tr>
<tr><td><code>crt</code></td><td>crt.guilherme-thom.workers.dev</td><td>CRT</td></tr>
<tr><td><code>digital-deck-api</code></td><td>digital-deck-api.guilherme-thom.workers.dev</td><td>API de leads, gates e campanhas</td></tr>
</tbody>
</table>
<h3 class="subsection-title">Workers de Saúde e Dados</h3>
<table class="infra-table">
<thead><tr><th>Worker</th><th>Rota / Domínio</th><th>Bindings</th><th>Função</th></tr></thead>
<tbody>
<tr><td><code>unimed-cooperados-page</code></td><td>unimed-cooperados-page.guilherme-thom.workers.dev</td><td>D1, KV: cooperados-api-keys</td><td>Página de cooperados Unimed GV</td></tr>
<tr><td><code>rd-icds</code></td><td>rd-icds.guilherme-thom.workers.dev</td><td>Secrets</td><td>Relatório de Desempenho ICDS</td></tr>
<tr><td><code>drg-data-proxy</code></td><td>drg-data-proxy.guilherme-thom.workers.dev</td><td>Secrets</td><td>Proxy de dados DRG Brasil</td></tr>
<tr><td><code>drg-ai-proxy</code></td><td>drg-ai-proxy.guilherme-thom.workers.dev</td><td>Secrets</td><td>Proxy de IA para DRG</td></tr>
<tr><td><code>spectra-api</code></td><td>spectra-api.guilherme-thom.workers.dev</td><td>D1: spectra-db, KV: spectra-sessions, KV: spectra-config, R2: spectra-assets, R2: spectra-knowledge</td><td>API Principal Spectra</td></tr>
</tbody>
</table>

<div style="margin-top: 12px;">
<a class="resource-btn dark-btn" href="/_infra/technical-architecture" style="display:inline-flex; max-width: 400px;">Arquitetura Técnica Completa</a>
</div>
</div>

<!-- 3. BANCOS DE DADOS -->
<div class="frame">
<h2 class="section-title">3. Bancos de Dados (D1)</h2>
<p class="section-desc">Bancos SQLite serverless na Cloudflare.</p>
<table class="infra-table">
<thead><tr><th>Banco</th><th>ID</th><th>Tamanho</th><th>Tabelas</th><th>Uso</th></tr></thead>
<tbody>
<tr><td><code>csv-hub</code></td><td><code>6fac03eb-4c71-40d5-8edf-7fb0f2e27d37</code></td><td>1.2 MB</td><td>21</td><td>Hub principal (auth, logs, NF, TEA, propostas, e-mail)</td></tr>
<tr><td><code>whatsapp-brain</code></td><td><code>db907899-3b4d-43b3-b2d4-f429bad2a88a</code></td><td>98 MB</td><td>4</td><td>Cérebro do WhatsApp (Extensio)</td></tr>
<tr><td><code>ccrt</code></td><td><code>8adfc2da-379f-4983-a19c-4d089b5e0fdc</code></td><td>52 KB</td><td>-</td><td>CRT</td></tr>
</tbody>
</table>

<h3 class="subsection-title">Tabelas do csv-hub (21)</h3>
<table class="infra-table">
<thead><tr><th>Tabela</th><th>Descrição</th></tr></thead>
<tbody>
<tr><td><code>auth_sessions</code></td><td>Sessões ativas (token, tenant_id, user_email, expires_at)</td></tr>
<tr><td><code>access_logs</code></td><td>Logs de acesso (tenant_id, user_email, action, ip, device, country)</td></tr>
<tr><td><code>access_requests</code></td><td>Solicitações pendentes (name, email, tenant_id, status)</td></tr>
<tr><td><code>users</code></td><td>Usuários (email, name, password_hash, status)</td></tr>
<tr><td><code>user_tenants</code></td><td>Relação usuário-tenant (multi-tenant)</td></tr>
<tr><td><code>config</code></td><td>Configurações do sistema</td></tr>
<tr><td><code>nf_tomadores</code></td><td>Tomadores de serviço para NF</td></tr>
<tr><td><code>nf_servicos</code></td><td>Serviços prestados para NF</td></tr>
<tr><td><code>nf_solicitacoes</code></td><td>Solicitações de NF emitidas</td></tr>
<tr><td><code>nf_dados_bancarios</code></td><td>Dados bancários</td></tr>
<tr><td><code>tea_submissions</code></td><td>Submissões dataset TEA</td></tr>
<tr><td><code>tea_answers</code></td><td>Respostas dataset TEA</td></tr>
<tr><td><code>tea_users</code></td><td>Usuários TEA</td></tr>
<tr><td><code>tea_organizations</code></td><td>Organizações TEA</td></tr>
<tr><td><code>tea_audit_logs</code></td><td>Auditoria TEA</td></tr>
<tr><td><code>proposals</code></td><td>Propostas comerciais</td></tr>
<tr><td><code>email_logs</code></td><td>Logs de e-mails</td></tr>
<tr><td><code>api_logs</code></td><td>Logs de API</td></tr>
<tr><td><code>form_submissions</code></td><td>Submissões de formulários</td></tr>
<tr><td><code>webhook_events</code></td><td>Eventos webhook</td></tr>
<tr><td><code>_cf_KV</code></td><td>Tabela interna Cloudflare</td></tr>
</tbody>
</table>
</div>

<!-- 4. KV E R2 -->
<div class="frame">
<h2 class="section-title">4. Key-Value Store (KV) e Object Storage (R2)</h2>

<h3 class="subsection-title">KV Namespaces</h3>
<table class="infra-table">
<thead><tr><th>Namespace</th><th>ID</th><th>Uso</th></tr></thead>
<tbody>
<tr><td><code>csv-config</code></td><td><code>dc02d334d6e04075a7adf7e801e86d7e</code></td><td>Senhas de portais, webhooks, configurações</td></tr>
<tr><td><code>csv-open-pages</code></td><td><code>7a21d052398e4724aabb3d3c62372d12</code></td><td>Metadados de páginas públicas (Open Pages)</td></tr>
</tbody>
</table>

<h3 class="subsection-title">R2 Buckets (12)</h3>
<table class="infra-table">
<thead><tr><th>Bucket</th><th>Domínio Público</th><th>Uso</th></tr></thead>
<tbody>
<tr><td><code>csv-open-pages</code></td><td>assets.grupocsv.com, open.grupocsv.com</td><td>Open Pages + Assets visuais</td></tr>
<tr><td><code>hub-unimedgv</code></td><td>hub.unimedgv.com</td><td>Open Pages exclusivas Unimed GV</td></tr>
<tr><td><code>csv-propostas</code></td><td>propostas.axcare.com.br</td><td>Propostas comerciais (PDF)</td></tr>
<tr><td><code>decks</code></td><td>decks.grupocsv.com</td><td>Apresentações PPTX geradas</td></tr>
<tr><td><code>slides</code></td><td>-</td><td>Slides gerados via Markdown</td></tr>
<tr><td><code>hub-csv-knowledge</code></td><td>-</td><td>Base vetorial para AI Search (191 objetos)</td></tr>
<tr><td><code>spectra-assets</code></td><td>-</td><td>Assets visuais do Spectra AI</td></tr>
<tr><td><code>spectra-knowledge</code></td><td>-</td><td>Base de conhecimento do Spectra AI</td></tr>
<tr><td><code>vps-csv-backups</code></td><td>-</td><td>Backups criptografados da VPS-CSV (Restic)</td></tr>
<tr><td><code>gabi-assets</code></td><td>-</td><td>Assets de projetos associados</td></tr>
<tr><td><code>rd-icds-uploads</code></td><td>-</td><td>Uploads do Relatório de Desempenho ICDS</td></tr>
<tr><td><code>axiacare-methods</code></td><td>-</td><td>Arquivos do Methods Registry AxiaCare</td></tr>
</tbody>
</table>
</div>

<!-- 5. DOMINIOS E DNS -->
<div class="frame">
<h2 class="section-title">5. Domínios e DNS</h2>
<p class="section-desc">Todas as zonas DNS gerenciadas na Cloudflare com SSL Full Strict.</p>

<h3 class="subsection-title">Zonas Cloudflare</h3>
<table class="infra-table">
<thead><tr><th>Domínio</th><th>Zone ID</th></tr></thead>
<tbody>
<tr><td>grupocsv.com</td><td><code>8a8f9adb4965260df64447c732f9ebbd</code></td></tr>
<tr><td>guithome.com.br</td><td><code>63a6c58d3f7aec9fa79be5fc0bb4b7be</code></td></tr>
<tr><td>axcare.com.br</td><td><code>2a2af254f84a3dbf588e4c7f3a0a3c8e</code></td></tr>
<tr><td>axcare.app</td><td><code>57f5f50766ac9713f8682d16d53331fb</code></td></tr>
<tr><td>axcare.ai</td><td><code>246edfbaeffc09b741a1bb2e830d52a9</code></td></tr>
<tr><td>thera.tech</td><td><code>3fdeeb868c665ec33947eb6b51be75b8</code></td></tr>
<tr><td>thera.med.br</td><td><code>c0c702aabca32d3c57e1718eade9f2f0</code></td></tr>
<tr><td>theramed.ai</td><td><code>013c68695048d30445273ade3e5f4ac4</code></td></tr>
<tr><td>medvalor.med.br</td><td><code>25823a280daf10098aadfc42904e4f85</code></td></tr>
</tbody>
</table>

<h3 class="subsection-title">Subdomínios Principais</h3>
<table class="infra-table">
<thead><tr><th>Subdomínio</th><th>Destino</th><th>Função</th></tr></thead>
<tbody>
<tr><td>hub.grupocsv.com</td><td>grupocsv.github.io</td><td>Hub principal (GitHub Pages)</td></tr>
<tr><td>api.grupocsv.com</td><td>Worker csv-gateway</td><td>API gateway</td></tr>
<tr><td>mail-api.grupocsv.com</td><td>Worker csv-mail</td><td>E-mail agêntico</td></tr>
<tr><td>webhook.grupocsv.com</td><td>Worker whatsapp-webhook</td><td>Webhook WhatsApp</td></tr>
<tr><td>open.grupocsv.com</td><td>Worker csv-open-pages</td><td>Páginas públicas</td></tr>
<tr><td>assets.grupocsv.com</td><td>Worker csv-assets</td><td>Assets estáticos</td></tr>
<tr><td>deck.grupocsv.com</td><td>Cloudflare Pages</td><td>Deck™</td></tr>
<tr><td>decks.grupocsv.com</td><td>Worker decks-worker</td><td>Geração de PPTX</td></tr>
<tr><td>pay.grupocsv.com</td><td>Stripe</td><td>Checkout Criale</td></tr>
<tr><td>propostas.axcare.com.br</td><td>R2 public</td><td>Propostas PDF</td></tr>
<tr><td>relay.axcare.com.br</td><td>cname.manus.space</td><td>Relay™</td></tr>
<tr><td>rtav.axcare.app</td><td>cname.manus.space</td><td>RTAV™</td></tr>
<tr><td>api.thera.tech</td><td>Worker thera-contact</td><td>API Thera</td></tr>
<tr><td>thera.tech</td><td>cname.manus.space</td><td>Site Thera</td></tr>
<tr><td>spectra.thera.tech</td><td>cname.manus.space</td><td>Spectra AI</td></tr>
<tr><td>discovery.axcare.app</td><td>cname.manus.space</td><td>Discovery™</td></tr>
<tr><td>hooks.grupocsv.com</td><td>Cloudflare Tunnel (VPS-CSV)</td><td>Webhook Receiver v2</td></tr>
<tr><td>panta.grupocsv.com</td><td>Cloudflare Tunnel (VPS-CSV)</td><td>Panta™</td></tr>
<tr><td>claw.grupocsv.com</td><td>Cloudflare Tunnel (VPS Hostinger)</td><td>OpenClaw bilateral</td></tr>
<tr><td>n8n.grupocsv.com</td><td>Cloudflare Tunnel (VPS-CSV)</td><td>n8n (automação de workflows)</td></tr>
<tr><td>unimedgv.com</td><td>Cloudflare</td><td>Domínio Unimed GV</td></tr>
</tbody>
</table>
</div>

<!-- 6. AGENTES DE IA -->
<div class="frame">
<h2 class="section-title">6. Agentes de IA</h2>
<p class="section-desc">Três agentes coordenados operam o ecossistema digital do Grupo CSV.</p>
<table class="infra-table">
<thead><tr><th>Agente</th><th>Função</th><th>Infraestrutura</th><th>Comunicação</th></tr></thead>
<tbody>
<tr><td><strong>Manus</strong></td><td>Agente principal: tarefas complexas, desenvolvimento, deploy, pesquisa</td><td>Sandbox isolado (Manus Cloud)</td><td>API Manus, Webhook, MCP</td></tr>
<tr><td><strong>OpenClaw</strong></td><td>Agente autônomo 24/7: WhatsApp (Extensio), heartbeat, cron jobs</td><td>VPS Hostinger (extensio-vps)</td><td>WhatsApp (WABA), API Manus</td></tr>
<tr><td><strong>Claude</strong></td><td>Agente de desenvolvimento: coding sessions locais</td><td>Claude Code (local)</td><td>Terminal, GitHub</td></tr>
<tr><td><strong>Hermes</strong></td><td>Agente auxiliar: execução de tarefas delegadas</td><td>VPS Hostinger (Docker, Claude Haiku 4.5)</td><td>MCPs (Extensio, ACB, Deck), 15 tools nativas</td></tr>
</tbody>
</table>

<h3 class="subsection-title">Ponte de Contexto (ACB)</h3>
<p class="section-desc">A comunicação entre agentes é feita via Agent Context Bridge (ACB) no Supabase do OpenClaw. O Worker <code>agent-context-bridge</code> expõe ferramentas MCP: <code>log_activity</code>, <code>log_file</code>, <code>log_decision</code>, <code>get_recent_activities</code>, <code>get_project_context</code>, <code>search_activities</code>.</p>

<h3 class="subsection-title">Extensio (MCP Server)</h3>
<p class="section-desc">O Worker <code>extensio-mcp</code> é o servidor MCP do Extensio, com acesso a D1 (csv-hub, whatsapp-brain), AI Search, Notion, OpenAI e Gemini. O <code>extensio-daily-pipeline</code> executa o pipeline diário com envio de e-mail via csv-mail.</p>
</div>

<!-- 7. AI SEARCH -->
<div class="frame">
<h2 class="section-title">7. AI Search (Busca Semântica)</h2>
<p class="section-desc">Cloudflare AutoRAG indexa automaticamente todo o conteúdo do Hub para busca semântica via API REST.</p>
<table class="infra-table">
<thead><tr><th>Campo</th><th>Valor</th></tr></thead>
<tbody>
<tr><td>Instância</td><td><code>hub-csv</code></td></tr>
<tr><td>Bucket R2</td><td><code>hub-csv-knowledge</code> (191 objetos, 384 vetores)</td></tr>
<tr><td>Embedding</td><td>qwen3-embedding-0.6b (2048 tokens/chunk, 10% overlap)</td></tr>
<tr><td>AI Gateway</td><td><code>csv_ai_gateway</code></td></tr>
<tr><td>Sincronização</td><td>Automática: push na main → GitHub Actions → R2 → re-index</td></tr>
</tbody>
</table>
<div style="margin-top: 12px;">
<a class="resource-btn secondary" href="/_infra/ai-search">Documentação Completa do AI Search</a>
</div>
</div>

<!-- 8. APIS EXTERNAS -->
<div class="frame">
<h2 class="section-title">8. APIs e Serviços Externos</h2>
<table class="infra-table">
<thead><tr><th>Serviço</th><th>Uso</th><th>Detalhes</th></tr></thead>
<tbody>
<tr><td><strong>Resend</strong></td><td>E-mail transacional</td><td>Domínios: mail.grupocsv.com, thera.tech, veritas.thera.tech, spectra.thera.tech</td></tr>
<tr><td><strong>OpenAI</strong></td><td>GPT-4o (deck-vision, varredura ortográfica, csv-ai)</td><td>Via Cloudflare AI Gateway</td></tr>
<tr><td><strong>Google Gemini</strong></td><td>Extensio MCP, Daily Pipeline</td><td>API direta</td></tr>
<tr><td><strong>Stripe</strong></td><td>Pagamentos Criale</td><td>Checkout: pay.grupocsv.com, Webhook: Supabase</td></tr>
<tr><td><strong>Supabase</strong></td><td>Backend Criale + Repositório clínico AxiaCare</td><td>Projetos: criale, axiacare</td></tr>
<tr><td><strong>GitHub API</strong></td><td>Changelog (csv-cron), deploy, sync R2</td><td>GitHub Actions + API REST</td></tr>
<tr><td><strong>Notion API</strong></td><td>Extensio, Daily Pipeline, Dicionário Oficial</td><td>Via NOTION_TOKEN</td></tr>
<tr><td><strong>Manus API</strong></td><td>Criação de tarefas, polling, webhooks</td><td>OpenClaw → Manus via extensio__manus_create_task</td></tr>
<tr><td><strong>Anthropic (Claude)</strong></td><td>Hermes Agent, Claude Code, extensio-mcp-anthropic</td><td>API direta + MCP</td></tr>
<tr><td><strong>Vectorize.io (Hindsight)</strong></td><td>Memória persistente de longo prazo</td><td>Memory Bank: hindsight_extensio</td></tr>
<tr><td><strong>Healthchecks.io</strong></td><td>Monitoramento de cron jobs VPS-CSV</td><td>9 checks ativos</td></tr>
<tr><td><strong>ElevenLabs</strong></td><td>TTS e geração de áudio</td><td>API direta</td></tr>
<tr><td><strong>OpenRouter</strong></td><td>Roteamento de modelos (OpenClaw)</td><td>API direta</td></tr>
<tr><td><strong>Cloudflare AI</strong></td><td>AutoRAG, AI Gateway, embeddings</td><td>Workers AI + AI Gateway csv_ai_gateway</td></tr>
</tbody>
</table>
</div>

<!-- 9. COMUNICAÇÃO -->
<div class="frame">
<h2 class="section-title">9. Comunicação</h2>

<h3 class="subsection-title">WhatsApp Business API (WABA)</h3>
<p class="section-desc">O Extensio (OpenClaw) gerencia o WhatsApp do Grupo CSV via WABA. O webhook <code>webhook.grupocsv.com</code> recebe mensagens e armazena no D1 <code>whatsapp-brain</code>. Templates Meta são gerenciados via Zapier MCP.</p>

<h3 class="subsection-title">E-mail</h3>
<table class="infra-table">
<thead><tr><th>Worker</th><th>Endpoint</th><th>Uso</th></tr></thead>
<tbody>
<tr><td><code>csv-email</code></td><td>csv-email.guilherme-thom.workers.dev</td><td>E-mail genérico + submissions</td></tr>
<tr><td><code>csv-mail</code></td><td>mail-api.grupocsv.com</td><td>E-mail agêntico com templates (Signal, relatórios, notificações)</td></tr>
</tbody>
</table>
<p class="section-desc">Domínio de envio: <code>mail.grupocsv.com</code> (Resend). Autenticação csv-mail: Bearer token via header Authorization.</p>
</div>

<!-- 10. AUTENTICAÇÃO -->
<div class="frame">
<h2 class="section-title">10. Autenticação</h2>
<p class="section-desc">Sistema multi-tenant com dois fluxos distintos.</p>
<table class="infra-table">
<thead><tr><th>Tipo</th><th>Portais</th><th>Método</th></tr></thead>
<tbody>
<tr><td>Senha fixa</td><td>AxiaCare, Thera, MedValor</td><td>Senha única por portal (armazenada no KV csv-config)</td></tr>
<tr><td>Login individual</td><td>Unimed, Unihealth, ICDS</td><td>E-mail + senha, com fluxo de solicitação e aprovação</td></tr>
<tr><td>PIN local</td><td>Deck™</td><td>PIN 4 dígitos (SHA-256 no localStorage)</td></tr>
</tbody>
</table>
<p class="section-desc">Script client-side: <code>hub-auth.js</code> (v2.5.0, com slot de montagem <code>#hub-auth-slot</code> / <code>data-hub-auth-theme="dark"</code> para o widget de logout) incluído em toda página protegida via <code>&lt;script src="/scripts/hub-auth.js" data-portal="{id}"&gt;</code>. Painel Admin: <code>hub.grupocsv.com/admin/</code> (8 abas: usuários, senhas, links, logs, deck, feedback, admins, datasets).</p>
</div>

<!-- 11. REPOSITORIOS -->
<div class="frame">
<h2 class="section-title">11. Repositórios e Deploy</h2>
<table class="infra-table">
<thead><tr><th>Repositório</th><th>Conteúdo</th><th>Deploy</th></tr></thead>
<tbody>
<tr><td><code>grupocsv/hub</code></td><td>Frontend: VitePress + HTML + portais + compliance + admin + deck</td><td>GitHub Pages (Actions)</td></tr>
<tr><td><code>grupocsv/backend</code></td><td>Workers: csv-auth, csv-gateway, csv-data, csv-email, csv-propostas, tea-dataset-api</td><td>Wrangler (manual)</td></tr>
<tr><td><code>grupocsv/csv-open-pages</code></td><td>Worker + admin do Open Pages</td><td>Wrangler (manual)</td></tr>
<tr><td><code>grupocsv/discovery</code></td><td>Discovery™ (diagnóstico estratégico OPSS)</td><td>Manus (auto-deploy)</td></tr>
<tr><td><code>grupocsv/deck</code></td><td>Deck™ (Cloudflare Pages)</td><td>Cloudflare Pages (auto)</td></tr>
<tr><td><code>grupocsv/deck-csv</code></td><td>Deck MCP Server</td><td>Wrangler (manual)</td></tr>
<tr><td><code>grupocsv/extensio</code></td><td>Extensio MCP Server</td><td>Wrangler (manual)</td></tr>
<tr><td><code>grupocsv/ecc</code></td><td>Extensio Command Center</td><td>Manus (auto-deploy)</td></tr>
<tr><td><code>grupocsv/spectra-core</code></td><td>Spectra Core</td><td>Wrangler (manual)</td></tr>
<tr><td><code>grupocsv/relay</code></td><td>Relay™</td><td>Manus (auto-deploy)</td></tr>
<tr><td><code>guicthome/slides-worker</code></td><td>Slides Worker</td><td>Wrangler (manual)</td></tr>
<tr><td><code>thera-tech/navia</code></td><td>Navia (Gestão de Linhas de Cuidado)</td><td>Manus (auto-deploy)</td></tr>
<tr><td><code>thera-tech/spectra</code></td><td>Spectra AI</td><td>Manus (auto-deploy)</td></tr>
<tr><td><code>thera-tech/agent-context-bridge</code></td><td>Agent Context Bridge (ACB)</td><td>Wrangler (manual)</td></tr>
</tbody>
</table>

<h3 class="subsection-title">Pipeline de Deploy (Hub)</h3>
<p class="section-desc">Push na <code>main</code> dispara dois workflows: (1) Build VitePress + copia módulos estáticos + deploy GitHub Pages; (2) Sincroniza conteúdo para R2 <code>hub-csv-knowledge</code> e re-indexa o AI Search.</p>
</div>

<!-- 12. ASSETS -->
<div class="frame">
<h2 class="section-title">12. Assets Visuais</h2>
<p class="section-desc">Repositório centralizado de assets em <code>assets.grupocsv.com</code> (Cloudflare R2 + Worker csv-assets). Total: <strong>284 assets</strong>, 22 marcas, 8 categorias. API de busca: <code>/api/search</code>, <code>/api/brands/:brand</code>, <code>/api/meta</code>.</p>
<table class="infra-table">
<thead><tr><th>Marca</th><th>Qtd</th><th>Cor Principal</th></tr></thead>
<tbody>
<tr><td>thera</td><td>64</td><td>#6B5B95 (roxo)</td></tr>
<tr><td>medvalor</td><td>49</td><td>Azul + Laranja</td></tr>
<tr><td>guilherme-thome</td><td>38</td><td>#196396 (azul)</td></tr>
<tr><td>axiacare</td><td>34</td><td>#196396 (azul)</td></tr>
<tr><td>grupo-csv</td><td>25</td><td>#196396 (azul) + #2DBF7F (verde)</td></tr>
<tr><td>unimed-gv</td><td>19</td><td>#00995d (verde)</td></tr>
<tr><td>evs</td><td>16</td><td>#00995d (verde)</td></tr>
<tr><td>icds</td><td>6</td><td>#013d19 (verde escuro)</td></tr>
<tr><td>naline-rocha</td><td>5</td><td>—</td></tr>
<tr><td>unimed-leste-nordeste</td><td>5</td><td>#00995d (verde)</td></tr>
<tr><td>panta</td><td>4</td><td>#196396 (azul)</td></tr>
<tr><td>criale</td><td>4</td><td>#F472B6 (rosa)</td></tr>
<tr><td>unimed-federacao-minas</td><td>4</td><td>#00995d (verde)</td></tr>
<tr><td>unihealth</td><td>3</td><td>#013d19 (verde escuro)</td></tr>
<tr><td>Outras (8 marcas)</td><td>8</td><td>—</td></tr>
</tbody>
</table>
<div class="resource-grid">
<a class="resource-btn secondary" href="/_infra/csv-core/identity-system">Sistema de Identidade Visual</a>
<a class="resource-btn secondary" href="/_infra/csv-core/assets">Central de Assets</a>
</div>
</div>

<!-- 13. DEFINIÇÕES E MANDATOS -->
<div class="frame">
<h2 class="section-title">13. Definições e Mandatos</h2>
<p class="section-desc">Documentos fundacionais que definem o Grupo CSV, suas empresas e parceiros.</p>
<div class="resource-grid">
<a class="resource-btn" href="/_infra/csv-core/definition">Definições Canônicas</a>
<a class="resource-btn" href="/_infra/csv-core/founder">Perfil do Fundador</a>
</div>

<div class="empresa-block" style="border-top: none; margin-top: 16px; padding-top: 0;"><div class="empresa-header"><img src="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_positive.png" alt="AxiaCare"><h4>AxiaCare® — Consultoria e Governança Clínica</h4></div><div class="resource-grid"><a class="resource-btn axia" href="/_infra/axiacare/mandate">Mandato AxiaCare</a></div></div>
<div class="empresa-block"><div class="empresa-header"><img src="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_orange_positive.png" alt="MedValor"><h4>MedValor® — Educação e Capacitação</h4></div><div class="resource-grid"><a class="resource-btn medvalor" href="/_infra/medvalor/mandate">Mandato MedValor</a></div></div>
<div class="empresa-block"><div class="empresa-header"><img src="/visual-identity/thera/logo/png/thera_logo_horizontal_purple_positive.png" alt="TheraTech"><h4>TheraTech® — Desenvolvimento de Software e IA</h4></div><div class="resource-grid"><a class="resource-btn thera" href="/_infra/thera/mandate">Mandato TheraTech</a></div></div>
</div>

<!-- 14. RECURSOS TRANSVERSAIS -->
<div class="frame">
<h2 class="section-title">14. Recursos Transversais</h2>
<div class="resource-grid tri">
<a class="resource-btn secondary" href="/_infra/public-pages">Páginas Públicas (Open Pages)</a>
<a class="resource-btn secondary" href="/compliance/">Central de Compliance</a>
<a class="resource-btn secondary" href="/_infra/standards/footer">Padrão de Footer</a>
<a class="resource-btn secondary" href="/_infra/archive/">Arquivo de Páginas</a>
<a class="resource-btn secondary" href="https://github.com/grupocsv/hub" target="_blank">Repositório GitHub</a>
<a class="resource-btn secondary" href="/_infra/csv-core/playbook-hub">Playbook Hub</a>
</div>
</div>

<!-- FOOTER -->
<div style="text-align:center; margin-bottom:24px;">
<a href="/" style="display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:10px; background:#196396; color:white; text-decoration:none; font-weight:600; font-size:0.9rem; transition:all 0.2s;">← Voltar ao Hub</a>
</div>

<div class="page-footer">
<strong>Grupo CSV — Infraestrutura do Ecossistema</strong>
<div class="small">© 2026 Grupo CSV. Cuidados em Saúde com Valor. Todos os direitos reservados.</div>
</div>
</div>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const btn = document.getElementById('copy-md-btn')
  if (!btn) return
  btn.addEventListener('click', () => {
  const md = `# Infraestrutura do Ecossistema Grupo CSV — SSOT

Fonte Unica da Verdade (SSOT) de 100% da infraestrutura digital do Grupo CSV. Atualizada em 01 de julho de 2026.

---

## 1. Produtos Digitais

| Produto | Funcao | URL | Hospedagem |
|---|---|---|---|
| Compass™ | Publicacoes estrategicas | hub.grupocsv.com/compass/ | GitHub Pages (VitePress) |
| Signal™ | Boletim semanal de inteligencia | hub.grupocsv.com/signal/ | GitHub Pages (VitePress) |
| Deck™ | Painel de contexto ativo | deck.grupocsv.com | Cloudflare Pages |
| Relay™ | Mensagens institucionais padronizadas | relay.axcare.com.br | Manus (React + TS + Tailwind) |
| RTAV™ | Referencial Tecnico de Avaliacao por Valor | rtav.axcare.app | Manus (React + TS + Tailwind) |

---

## 2. Backend Serverless (Cloudflare Workers)

### Workers do Hub CSV

| Worker | Rota / Dominio | Bindings | Funcao |
|---|---|---|---|
| csv-gateway | api.grupocsv.com/* | D1: csv-hub, Secrets | API gateway central |
| csv-auth | csv-auth.guilherme-thom.workers.dev | D1: csv-hub, KV: csv-config, Secret | Autenticacao e sessoes (v4.1.0) |
| csv-ai | csv-ai.guilherme-thom.workers.dev | D1: csv-hub, Secret | Assistente IA contextual |
| csv-data | csv-data.guilherme-thom.workers.dev | D1: csv-hub, KV: csv-config | Dados e configuracoes |
| csv-cron | csv-cron.guilherme-thom.workers.dev | D1: csv-hub, KV: csv-config, Secret | Tarefas agendadas (v2.1) |
| csv-email | csv-email.guilherme-thom.workers.dev | Secret: RESEND_API_KEY | E-mail + submissions |
| csv-mail | mail-api.grupocsv.com/* | D1: csv-hub, Secrets | E-mail agentico (templates) |
| csv-webhook | csv-webhook.guilherme-thom.workers.dev | Secret | Webhooks |
| csv-propostas | csv-propostas.guilherme-thom.workers.dev | R2: csv-propostas, Secret | Propostas comerciais |
| csv-assets | assets.grupocsv.com/* | R2: csv-open-pages | Servico de assets estaticos |
| csv-open-pages | open.grupocsv.com/* | KV: csv-open-pages, R2: csv-open-pages | Paginas publicas com toggle |

### Workers de Produtos

| Worker | Rota / Dominio | Bindings | Funcao |
|---|---|---|---|
| deck-vision | deck-vision.guilherme-thom.workers.dev | Secret: OPENAI_API_KEY | Analise visual Deck (GPT-4o) |
| decks-worker | decks.grupocsv.com/* | R2: decks | Geracao e armazenamento de PPTX |
| tea-dataset-api | tea-dataset-api.guilherme-thom.workers.dev | D1: csv-hub, Secrets | Backend TEA |
| thera-contact | api.thera.tech/* | Secrets | Formulario de contato Thera |

### Workers de Agentes e Automacoes

| Worker | Rota / Dominio | Bindings | Funcao |
|---|---|---|---|
| whatsapp-webhook | webhook.grupocsv.com/* | D1: whatsapp-brain | Webhook WhatsApp (WABA) |
| extensio-mcp | extensio-mcp.guilherme-thom.workers.dev | D1: csv-hub, D1: whatsapp-brain, Secrets | MCP Server Extensio |
| extensio-daily-pipeline | extensio-daily-pipeline.guilherme-thom.workers.dev | Secrets | Pipeline diario Extensio |
| agent-context-bridge | agent-context-bridge.guilherme-thom.workers.dev | Secrets: SUPABASE_URL, SUPABASE_KEY | MCP de contexto entre agentes (ACB) |
| manus-webhook | manus-webhook.guilherme-thom.workers.dev | Secrets | Receptor de webhooks do Manus |
| resend-webhook | resend-webhook.guilherme-thom.workers.dev | Secrets | Webhook Resend para Supabase |

### Workers Externos (Criale, CRT, Digital Deck)

| Worker | Rota / Dominio | Funcao |
|---|---|---|
| criale-ai | criale-ai.guilherme-thom.workers.dev | IA para Criale |
| criale-todo | criale-todo.guilherme-thom.workers.dev | Tarefas Criale |
| criale-core | criale-core.guilherme-thom.workers.dev | MCP Server do Criale Core |
| crt | crt.guilherme-thom.workers.dev | CRT |
| digital-deck-api | digital-deck-api.guilherme-thom.workers.dev | API de leads, gates e campanhas |

---

## 3. Bancos de Dados (D1)

| Banco | ID | Tamanho | Tabelas | Uso |
|---|---|---|---|---|
| csv-hub | 6fac03eb-4c71-40d5-8edf-7fb0f2e27d37 | 1.2 MB | 21 | Hub principal (auth, logs, NF, TEA, propostas, e-mail) |
| whatsapp-brain | db907899-3b4d-43b3-b2d4-f429bad2a88a | 98 MB | 4 | Cerebro do WhatsApp (Extensio) |
| ccrt | 8adfc2da-379f-4983-a19c-4d089b5e0fdc | 52 KB | - | CRT |

### Tabelas do csv-hub (21)

auth_sessions, access_logs, access_requests, users, user_tenants, config, nf_tomadores, nf_servicos, nf_solicitacoes, nf_dados_bancarios, tea_submissions, tea_answers, tea_users, tea_organizations, tea_audit_logs, proposals, email_logs, api_logs, form_submissions, webhook_events, _cf_KV

---

## 4. Key-Value Store (KV) e Object Storage (R2)

### KV Namespaces

| Namespace | ID | Uso |
|---|---|---|
| csv-config | dc02d334d6e04075a7adf7e801e86d7e | Senhas de portais, webhooks, configuracoes |
| csv-open-pages | 7a21d052398e4724aabb3d3c62372d12 | Metadados de paginas publicas (Open Pages) |
| spectra-config | 0efd99edc8b1423fb1362799afaf6c7d | Configurações do Spectra |
| spectra-sessions | 7babc11357234bb18c89510be68373c8 | Sessões do Spectra |
| csv-open-auth | 2818feaed1f94c24b51328d8a4171669 | Tokens de autenticação Open Pages |
| extensio-mcp-anthropic-oauth | 8c10d07b261942ecbbced1853a9834d7 | OAuth tokens Extensio MCP (Anthropic) |
| hub-unimedgv-kv | d5f5d3f2a5644b3e96a3f81e50aaaf35 | Dados do portal Unimed GV |
| cooperados-api-keys | dd3b5c7794764d68bd0c49bb8578f171 | Chaves de API do sistema de cooperados |

### R2 Buckets

| Bucket | Dominio Publico | Uso |
|---|---|---|
| csv-propostas | propostas.axcare.com.br | Propostas comerciais (PDF) |
| hub-csv-knowledge | - | Base vetorial para AI Search (191 objetos) |
| csv-open-pages | - | Open Pages + Assets estaticos |
| decks | decks.grupocsv.com | Apresentacoes PPTX geradas |
| csv-assets | assets.grupocsv.com | Assets visuais (logos, imagens, criativos) |
| vps-csv-backups | - | Backups criptografados da VPS-CSV (Restic) |

---

## 5. Dominios e DNS

### Zonas Cloudflare

grupocsv.com (8a8f9adb4965260df64447c732f9ebbd), guithome.com.br (63a6c58d3f7aec9fa79be5fc0bb4b7be), axcare.com.br (2a2af254f84a3dbf588e4c7f3a0a3c8e), axcare.app (57f5f50766ac9713f8682d16d53331fb), axcare.ai (246edfbaeffc09b741a1bb2e830d52a9), thera.tech (3fdeeb868c665ec33947eb6b51be75b8), thera.med.br (c0c702aabca32d3c57e1718eade9f2f0), theramed.ai (013c68695048d30445273ade3e5f4ac4), medvalor.med.br (25823a280daf10098aadfc42904e4f85), unimedgv.com

### Subdominios Principais

| Subdominio | Destino | Funcao |
|---|---|---|
| hub.grupocsv.com | grupocsv.github.io | Hub principal (GitHub Pages) |
| api.grupocsv.com | Worker csv-gateway | API gateway |
| mail-api.grupocsv.com | Worker csv-mail | E-mail agentico |
| webhook.grupocsv.com | Worker whatsapp-webhook | Webhook WhatsApp |
| open.grupocsv.com | Worker csv-open-pages | Paginas publicas |
| assets.grupocsv.com | Worker csv-assets | Assets estaticos |
| deck.grupocsv.com | Cloudflare Pages | Deck |
| decks.grupocsv.com | Worker decks-worker | Geracao de PPTX |
| pay.grupocsv.com | Stripe | Checkout Criale |
| propostas.axcare.com.br | R2 public | Propostas PDF |
| relay.axcare.com.br | cname.manus.space | Relay |
| rtav.axcare.app | cname.manus.space | RTAV |
| api.thera.tech | Worker thera-contact | API Thera |
| thera.tech | cname.manus.space | Site Thera |
| spectra.thera.tech | cname.manus.space | Spectra AI |
| discovery.axcare.app | cname.manus.space | Discovery |
| hooks.grupocsv.com | Cloudflare Tunnel (VPS-CSV) | Webhook Receiver v2 |
| panta.grupocsv.com | Cloudflare Tunnel (VPS-CSV) | Panta |
| claw.grupocsv.com | Cloudflare Tunnel (VPS Hostinger) | OpenClaw bilateral |
| n8n.grupocsv.com | Cloudflare Tunnel (VPS-CSV) | n8n (automacao de workflows) |
| hub.unimedgv.com | Worker hub-unimedgv | Open Pages Unimed GV |

---

## 6. Agentes de IA

| Agente | Funcao | Infraestrutura | Comunicacao |
|---|---|---|---|
| Manus | Agente principal: tarefas complexas, desenvolvimento, deploy, pesquisa | Sandbox isolado (Manus Cloud) | API Manus, Webhook, MCP |
| OpenClaw | Agente autonomo 24/7: WhatsApp (Extensio), heartbeat, cron jobs | VPS Hostinger (extensio-vps) | WhatsApp (WABA), API Manus |
| Claude | Agente de desenvolvimento: coding sessions locais | Claude Code (local) | Terminal, GitHub |
| Hermes | Agente auxiliar: execucao de tarefas delegadas | VPS Hostinger (Docker, Claude Haiku 4.5) | MCPs (Extensio, ACB, Deck), 15 tools nativas |

Ponte de contexto (ACB): Worker agent-context-bridge com ferramentas MCP (log_activity, log_file, log_decision, get_recent_activities, get_project_context, search_activities).

Extensio MCP Server: Worker extensio-mcp com acesso a D1 (csv-hub, whatsapp-brain), AI Search, Notion, OpenAI e Gemini. Pipeline diario via extensio-daily-pipeline.
<h3 class="subsection-title">Memória de Longo Prazo (Hindsight Cloud)</h3>
<p class="section-desc">Vectorize.io Memory Bank (<code>hindsight_extensio</code>). 27 ferramentas MCP: retain, recall, reflect, mental models, directives, entities, documentos. Endpoint: <code>https://api.hindsight.vectorize.io/mcp/hindsight_extensio/</code>.</p>
<h3 class="subsection-title">VPS-CSV (Infraestrutura de Orquestração)</h3>
<p class="section-desc">GCP cloud-pc (35.231.90.205). Serviços: Webhook Receiver v2 (hooks.grupocsv.com), Telegram Bridge v3.0, Cloudflare Tunnel. 10 cron jobs monitorados via Healthchecks.io. 36 repositórios GitHub. Claude Code instalado. Backup criptografado (Restic → R2).</p>

---

## 7. AI Search (Busca Semantica)

Cloudflare AutoRAG indexa automaticamente todo o conteudo do Hub.

| Campo | Valor |
|---|---|
| Instancia | hub-csv |
| Bucket R2 | hub-csv-knowledge (191 objetos, 384 vetores) |
| Embedding | qwen3-embedding-0.6b (2048 tokens/chunk, 10% overlap) |
| AI Gateway | csv_ai_gateway |
| Sincronizacao | Automatica: push na main → GitHub Actions → R2 → re-index |

---

## 8. APIs e Servicos Externos

| Servico | Uso | Detalhes |
|---|---|---|
| Resend | E-mail transacional | Dominios: mail.grupocsv.com, icds.grupocsv.com, thera.tech, veritas.thera.tech, spectra.thera.tech |
| OpenAI | GPT-4o (deck-vision, varredura ortografica, csv-ai) | Via Cloudflare AI Gateway |
| Google Gemini | Extensio MCP, Daily Pipeline | API direta |
| Stripe | Pagamentos Criale | Checkout: pay.grupocsv.com, Webhook: Supabase |
| Supabase | Backend Criale + Repositorio clinico AxiaCare | Projetos: criale, axiacare |
| GitHub API | Changelog (csv-cron), deploy, sync R2 | GitHub Actions + API REST |
| Notion API | Extensio, Daily Pipeline, Dicionario Oficial | Via NOTION_TOKEN |
| Manus API | Criacao de tarefas, polling, webhooks | OpenClaw → Manus via extensio__manus_create_task |

---

## 9. Comunicacao

### WhatsApp Business API (WABA)
O Extensio (OpenClaw) gerencia o WhatsApp do Grupo CSV via WABA. Webhook: webhook.grupocsv.com. Armazenamento: D1 whatsapp-brain. Templates Meta via Zapier MCP.

### E-mail
- csv-email (csv-email.guilherme-thom.workers.dev): E-mail generico + submissions
- csv-mail (mail-api.grupocsv.com): E-mail agentico com templates (Signal, relatorios, notificacoes)
- Dominio de envio: mail.grupocsv.com (Resend). Autenticacao csv-mail: Bearer token.
- Domínios adicionais de envio (Resend): icds.grupocsv.com, thera.tech, veritas.thera.tech, spectra.thera.tech

---

## 10. Autenticacao

| Tipo | Portais | Metodo |
|---|---|---|
| Senha fixa | AxiaCare, Thera, MedValor | Senha unica por portal (KV csv-config) |
| Login individual | Unimed, Unihealth, ICDS | E-mail + senha, com fluxo de solicitacao e aprovacao |
| PIN local | Deck | PIN 4 digitos (SHA-256 no localStorage) |

Script client-side: hub-auth.js (v2.5.0, slot #hub-auth-slot para o widget de logout). Painel Admin: hub.grupocsv.com/admin/ (8 abas).

---

## 11. Repositorios e Deploy

| Repositorio | Conteudo | Deploy |
|---|---|---|
| grupocsv/hub | Frontend: VitePress + HTML + portais + compliance + admin + deck | GitHub Pages (Actions) |
| grupocsv/backend | Workers: csv-auth, csv-gateway, csv-data, csv-email, csv-propostas, tea-dataset-api | Wrangler (manual) |
| grupocsv/csv-open-pages | Worker + admin do Open Pages | Wrangler (manual) |

Pipeline: push na main → (1) Build VitePress + deploy GitHub Pages; (2) Sync R2 + re-index AI Search.

---

## 12. Assets Visuais

Repositorio centralizado em assets.grupocsv.com (Cloudflare R2 + Worker csv-assets).

| Entidade | Cor Principal |
|---|---|
| Grupo CSV | #196396 (azul) + #2DBF7F (verde) |
| AxiaCare | #196396 (azul) |
| MedValor | Azul + Laranja |
| TheraTech | #6B5B95 (roxo) |
| Unimed GV | #00995d (verde) |
| Unihealth | #013d19 (verde escuro) |

---

## 13. Conta Cloudflare

| Campo | Valor |
|---|---|
| Nome | Guilherme Thome |
| Account ID | da0c29123f448f3c3892f784cd9f7cac |
| Workers Subdomain | guilherme-thom.workers.dev |

---

## 14. Contatos Oficiais

| Canal | Endereco |
|---|---|
| Grupo CSV | contato@grupocsv.com |
| Compliance | compliance@grupocsv.com |
| Guilherme Thome | guilherme@guithome.com.br |
`;
  navigator.clipboard.writeText(md).then(() => {
    btn.classList.add('copied')
    const origHTML = btn.innerHTML
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!'
    setTimeout(() => {
      btn.classList.remove('copied')
      btn.innerHTML = origHTML
    }, 3000)
  }).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = md
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    btn.classList.add('copied')
    const origHTML = btn.innerHTML
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!'
    setTimeout(() => {
      btn.classList.remove('copied')
      btn.innerHTML = origHTML
    }, 3000)
  })
  })
})
</script>
