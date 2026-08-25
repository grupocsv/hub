---
layout: page
title: Infraestrutura Técnica
---

<style scoped>
.VPPage { padding: 0 !important; }

.tech-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background:
    radial-gradient(1400px 600px at -10% -20%, #e8f0f6 0%, transparent 60%),
    radial-gradient(1200px 500px at 110% 0%, #ebf7f1 0%, transparent 60%),
    #F6F4EF;
  min-height: calc(100vh - 64px);
}
.dark .tech-page { background: var(--vp-c-bg); }

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
.hero-section .version { font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }

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

.tech-table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0 16px;
  font-size: 0.88rem;
}
.tech-table th {
  background: #f1f5f9;
  color: #1e293b;
  font-weight: 700;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 2px solid #e2e8f0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.dark .tech-table th { background: #1e2430; color: #e2e8f0; border-color: #334155; }
.tech-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: top;
}
.dark .tech-table td { border-color: #334155; color: #cbd5e1; }
.tech-table tr:hover td { background: #f8fafc; }
.dark .tech-table tr:hover td { background: #1e2430; }

.tech-table code {
  background: #e8f0f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.82rem;
  color: #196396;
}
.dark .tech-table code { background: #1e2430; color: #5da9e0; }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.badge.public { background: #dcfce7; color: #166534; }
.badge.protected { background: #fef3c7; color: #92400e; }
.badge.internal { background: #e0e7ff; color: #3730a3; }
.dark .badge.public { background: #14532d; color: #86efac; }
.dark .badge.protected { background: #78350f; color: #fde68a; }
.dark .badge.internal { background: #312e81; color: #a5b4fc; }

.arch-diagram {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  margin: 16px 0;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  overflow-x: auto;
  color: #334155;
}
.dark .arch-diagram { background: #1e2430; border-color: #334155; color: #cbd5e1; }

.flow-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 8px 0;
}
.flow-number {
  min-width: 28px;
  height: 28px;
  background: #196396;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}
.flow-text { font-size: 0.9rem; color: #334155; line-height: 1.5; padding-top: 3px; }
.dark .flow-text { color: #cbd5e1; }

.worker-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
}
.dark .worker-card { background: #1e2430; border-color: #334155; }
.worker-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.worker-card-name {
  font-weight: 700;
  color: #196396;
  font-size: 1rem;
}
.dark .worker-card-name { color: #5da9e0; }
.worker-card-version {
  font-size: 0.78rem;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}
.dark .worker-card-version { background: #334155; }
.worker-card-desc { font-size: 0.88rem; color: #5b6470; line-height: 1.5; margin-bottom: 8px; }

.endpoint-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
}
.endpoint-list li {
  padding: 4px 0;
  font-size: 0.85rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}
.dark .endpoint-list li { color: #cbd5e1; border-color: #334155; }
.endpoint-list li:last-child { border-bottom: none; }

.security-note {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 14px 16px;
  margin: 16px 0;
  font-size: 0.88rem;
  color: #92400e;
  line-height: 1.5;
}
.dark .security-note { background: #422006; border-color: #78350f; color: #fde68a; }

.db-schema {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}
@media (min-width: 760px) { .db-schema { grid-template-columns: 1fr 1fr; } }

.db-table-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
}
.dark .db-table-card { background: #1e2430; border-color: #334155; }
.db-table-name {
  font-weight: 700;
  color: #196396;
  font-size: 0.9rem;
  margin-bottom: 6px;
}
.dark .db-table-name { color: #5da9e0; }
.db-table-desc { font-size: 0.82rem; color: #5b6470; }

.cron-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.dark .cron-row { border-color: #334155; }
.cron-row:last-child { border-bottom: none; }
.cron-schedule {
  font-family: 'Courier New', monospace;
  background: #e8f0f6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #196396;
  min-width: 140px;
  text-align: center;
}
.dark .cron-schedule { background: #1e2430; color: #5da9e0; }
.cron-info { font-size: 0.88rem; color: #334155; }
.dark .cron-info { color: #cbd5e1; }
.cron-info strong { color: #1e293b; }
.dark .cron-info strong { color: #e2e8f0; }

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

.dark .dark .copy-bar-btn {
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
</style>

<div class="copy-bar">
<button class="copy-bar-btn" id="copy-page-btn">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
Copiar página
</button>
</div>

<div class="tech-page">
<div class="frame hero-section">
<h1>Infraestrutura Técnica</h1>
<p class="version">Versão 1.2 — Atualizado em 24/08/2026</p>
<p class="subtitle">
Visão consolidada da arquitetura de backend documentada do ecossistema <strong>Grupo CSV</strong>.
Descreve os principais microserviços, bancos de dados, armazenamentos, rotas de API,
fluxos de autenticação e tarefas agendadas que sustentam o Hub e seus portais.
</p>
<p class="subtitle">
Este documento serve como <strong>índice técnico da arquitetura documentada</strong> para desenvolvedores,
agentes e qualquer pessoa que precise compreender o funcionamento interno do sistema. O estado de
produção deve ser revalidado antes de operação ou mudança de infraestrutura.
</p>
<div class="security-note">
<strong>Nota sobre segurança:</strong> Este documento descreve a arquitetura e o funcionamento dos componentes.
Informações sensíveis (chaves de API, tokens, senhas) não estão incluídas.
O proprietário mantém uma estrutura de gerenciamento de segredos própria, que pode ser consultada sob seu consentimento expresso.
</div>
</div>
<div class="frame">
<h2 class="section-title">1. Visão Geral da Arquitetura</h2>
<p class="section-desc">
O backend do Hub CSV é construído sobre a plataforma <strong>Cloudflare</strong>, utilizando uma arquitetura
de microserviços implementada com <strong>Cloudflare Workers</strong>. Cada worker é um serviço independente,
com responsabilidade única, que se comunica com os demais através do API Gateway.
</p>
<div class="arch-diagram">
<pre style="text-align:left; margin:0;">
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                           │
│                                                                 │
│   hub.grupocsv.com ─── GitHub Pages (Frontend)                 │
│   ├── VitePress (Infra, Compass, Signal)                       │
│   ├── Portais HTML (Unimed, ICDS, AxiaCare, Thera, MedValor)  │
│   ├── Admin (/admin/)                                           │
│   ├── Deck (/deck/)                                             │
│   └── Compliance (/compliance/)                                 │
└──────────────────────────┬──────────────────────────────────────┘
│ Chamadas de API
▼
┌─────────────────────────────────────────────────────────────────┐
│              API GATEWAY (csv-gateway)                           │
│              api.grupocsv.com — v1.6.0                          │
│                                                                 │
│   Autenticação ─── Roteamento ─── Logging ─── CORS             │
└──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────────────┘
│      │      │      │      │      │      │
▼      ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────────┐
│ auth ││ data ││  ai  ││ cron ││email ││webhk ││propostas │
│v3.0.0││      ││      ││v2.0  ││      ││      ││          │
└──┬───┘└──┬───┘└──────┘└──┬───┘└──────┘└──────┘└────┬─────┘
│       │               │                          │
▼       ▼               ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ARMAZENAMENTO                                │
│                                                                 │
│   D1 Database (csv-hub)     KV Store (csv-config)              │
│   ├── users                 ├── Senhas de portais              │
│   ├── user_tenants          └── Configurações dinâmicas        │
│   ├── pending_requests                                          │
│   ├── auth_sessions         R2 Storage (csv-propostas)         │
│   ├── access_logs           └── Propostas HTML/PDF             │
│   ├── api_logs                                                  │
│   └── email_logs                                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│          SERVICO INDEPENDENTE (fora do gateway)                  │
│                                                                 │
│   csv-mail v1.0.0 ─── mail-api.grupocsv.com                   │
│   Autenticação própria (Bearer API Key)                         │
│   Bindings: D1 (csv-hub), Resend                               │
└─────────────────────────────────────────────────────────────────┘
</pre>
</div>
<h3 class="subsection-title">Repositórios de Código</h3>
<table class="tech-table">
<thead><tr><th>Repositório</th><th>Conteúdo</th><th>Deploy</th></tr></thead>
<tbody>
<tr>
<td><code>grupocsv/hub</code></td>
<td>Frontend completo: VitePress, portais HTML, compliance, admin, deck</td>
<td>GitHub Pages</td>
</tr>
<tr>
<td><code>grupocsv/backend</code></td>
<td>Workers e serviços de backend, incluindo <code>csv-documents</code>, processador e monitor documentais</td>
<td>Cloudflare Workers + processador isolado</td>
</tr>
</tbody>
</table>
</div>
<div class="frame">
<h2 class="section-title">1.1. Central de Documentos</h2>
<p class="section-desc">
A Central de Documentos é um domínio privado e multi-tenant separado do gateway geral. O frontend compartilhado
em <code>/documentos/</code> chama diretamente o control plane <code>csv-documents</code> no domínio
<code>documentos-api.grupocsv.com</code>. O Worker valida a sessão pelo Service Binding do <code>csv-auth</code>
e mantém autorização documental no D1 dedicado.
</p>
<table class="tech-table">
<thead><tr><th>Componente</th><th>Recurso</th><th>Responsabilidade</th></tr></thead>
<tbody>
<tr><td>Control plane</td><td><code>csv-documents</code></td><td>Autenticação, RBAC, ACL, lifecycle, versões, auditoria e idempotência</td></tr>
<tr><td>Estado</td><td>D1 <code>csv-documents</code></td><td>Fonte de verdade tenant-first do domínio documental</td></tr>
<tr><td>Objetos</td><td>R2 <code>csv-documents-private</code></td><td>Originais e derivados privados, sem URL pública direta</td></tr>
<tr><td>Transporte</td><td><code>csv-documents-jobs</code> e <code>csv-documents-jobs-dlq</code></td><td>Jobs assíncronos e falhas esgotadas</td></tr>
<tr><td>Processamento</td><td><code>documentos-processor.grupocsv.com</code></td><td>Checksum, MIME, validação estrutural, ClamAV, extração e derivados</td></tr>
<tr><td>Monitor</td><td><code>csv-documents-monitor</code></td><td>Worker, Queue, DLQ, D1, processador e ClamAV; sem rota pública</td></tr>
<tr><td>Links públicos</td><td><code>documentos-api.grupocsv.com/s/{slug}</code></td><td>Entrega mediada, revogável e limitada; o bucket R2 continua privado</td></tr>
<tr><td>Operação por agentes</td><td><code>extensio-mcp</code> via Service Binding</td><td>Ferramentas tenant-aware com credencial de serviço, escopos e idempotência</td></tr>
</tbody>
</table>
<p class="section-desc">
Os tenants publicados são <code>grupo-csv</code>, <code>unimed</code>, <code>unihealth</code>, <code>icds</code>
e <code>2im</code>. A busca permanece desabilitada no frontend publicado. Panta v1 é independente; Panta v2
documental está implementado no código, mas não foi promovido. Consulte a
<a href="/_infra/central-documentos">documentação canônica da Central de Documentos</a> para lifecycle,
agentes, OpenAPI, links públicos e estado de entrega.
</p>
</div>
<div class="frame">
<h2 class="section-title">2. API Gateway (<code>csv-gateway</code>)</h2>
<p class="section-desc">
O <code>csv-gateway</code> é o ponto de entrada para todas as chamadas de API, acessível em
<strong>api.grupocsv.com</strong>. Recebe a requisição, valida a autenticação quando necessário,
registra o log no D1 e encaminha (proxy) para o worker de destino.
</p>
<h3 class="subsection-title">Mapa de Rotas</h3>
<table class="tech-table">
<thead><tr><th>Prefixo</th><th>Worker de Destino</th><th>Acesso</th><th>Descrição</th></tr></thead>
<tbody>
<tr>
<td><code>/auth</code></td>
<td>csv-auth</td>
<td><span class="badge public">Público</span></td>
<td>Login, verificação de token, solicitação de acesso, painel admin</td>
</tr>
<tr>
<td><code>/thera/contact</code></td>
<td>thera-contact</td>
<td><span class="badge public">Público</span></td>
<td>Formulário de contato do site Thera</td>
</tr>
<tr>
<td><code>/webhook</code></td>
<td>csv-webhook</td>
<td><span class="badge public">Público</span></td>
<td>Recebe webhooks de serviços externos</td>
</tr>
<tr>
<td><code>/data</code></td>
<td>csv-data</td>
<td><span class="badge protected">Protegido</span></td>
<td>Consultas ao D1 e KV</td>
</tr>
<tr>
<td><code>/ai</code></td>
<td>csv-ai</td>
<td><span class="badge protected">Protegido</span></td>
<td>Proxy para Cloudflare AI Gateway</td>
</tr>
<tr>
<td><code>/cron</code></td>
<td>csv-cron</td>
<td><span class="badge protected">Protegido</span></td>
<td>Disparo manual de tarefas agendadas</td>
</tr>
<tr>
<td><code>/email</code></td>
<td>csv-email</td>
<td><span class="badge protected">Protegido</span></td>
<td>Envio de e-mails transacionais via Resend</td>
</tr>
<tr>
<td><code>/axiacare/propostas</code></td>
<td>csv-propostas</td>
<td><span class="badge protected">Protegido</span></td>
<td>Geração de propostas comerciais</td>
</tr>
</tbody>
</table>
<div class="security-note" style="background:#f0f9ff; border-color:#93c5fd; color:#1e40af;">
<strong>Nota:</strong> O worker <code>csv-mail</code> opera fora do gateway, acessível diretamente em
<code>mail-api.grupocsv.com</code> com autenticação própria via Bearer token (API key dedicada).
Não consta na tabela acima por não utilizar o roteamento do <code>csv-gateway</code>.
</div>
<h3 class="subsection-title">Autenticação do Gateway</h3>
<p class="section-desc">
Rotas marcadas como <span class="badge protected">Protegido</span> exigem uma API Key,
enviada no header <code>X-API-Key</code> ou como parâmetro de query <code>?key=</code>.
Rotas públicas são acessíveis sem autenticação. Todas as requisições são registradas na tabela
<code>api_logs</code> do D1 com worker, método, path, status e tempo de resposta.
</p>
</div>
<div class="frame">
<h2 class="section-title">3. Workers de Serviço</h2>
<p class="section-desc">
Cada worker é um microserviço independente com responsabilidade única.
Todos rodam na edge da Cloudflare, garantindo latência mínima globalmente.
</p>
<div class="worker-card">
<div class="worker-card-header">
<span class="worker-card-name">csv-auth</span>
<span class="worker-card-version">v3.0.0</span>
</div>
<div class="worker-card-desc">
Serviço central de autenticação e controle de acesso. Gerencia login, tokens de sessão,
solicitações de acesso, aprovação de usuários e o painel administrativo.
</div>
<strong style="font-size:0.82rem; color:#1e293b;">Bindings:</strong>
<span style="font-size:0.82rem; color:#5b6470;"> D1 (csv-hub), Secret (RESEND_API_KEY), Secret (GITHUB_PAT)</span>
<ul class="endpoint-list">
<li><code>POST /login</code> — Valida credenciais e retorna token de sessão (24h)</li>
<li><code>GET /verify</code> — Valida um token de sessão existente</li>
<li><code>POST /logout</code> — Encerra uma sessão ativa</li>
<li><code>POST /request-access</code> — Cria solicitação de acesso para portais de parceiros</li>
<li><code>GET /admin/stats</code> — Estatísticas do painel (usuários, solicitações, links)</li>
<li><code>GET /admin/pending-requests</code> — Lista solicitações pendentes</li>
<li><code>POST /admin/approve</code> — Aprova solicitação e cria usuário</li>
<li><code>POST /admin/reject</code> — Rejeita solicitação de acesso</li>
<li><code>GET /admin/users</code> — Lista usuários aprovados com seus tenants</li>
<li><code>POST /admin/revoke</code> — Revoga acesso de um usuário a um tenant</li>
<li><code>GET /admin/logs</code> — Log de acessos externos (com JOIN de nome)</li>
<li><code>GET /admin/passwords</code> — Senhas dos portais de empresas (do KV)</li>
<li><code>POST /admin/update-password</code> — Atualiza senha de portal de empresa</li>
<li><code>POST /admin/revoke-public-link</code> — Revoga link público (commit no GitHub)</li>
<li><code>POST /admin/restore-public-link</code> — Restaura link público revogado</li>
<li><code>POST /admin/cleanup-sessions</code> — Remove sessões expiradas</li>
<li><code>POST /deck/reset-pin</code> — Envia PIN temporário por e-mail</li>
</ul>
</div>
<div class="worker-card">
<div class="worker-card-header">
<span class="worker-card-name">csv-cron</span>
<span class="worker-card-version">v2.0</span>
</div>
<div class="worker-card-desc">
Executa tarefas agendadas via Cron Triggers da Cloudflare. Gera o relatório diário,
monitora a saúde dos workers e realiza limpeza periódica do banco.
</div>
<strong style="font-size:0.82rem; color:#1e293b;">Bindings:</strong>
<span style="font-size:0.82rem; color:#5b6470;"> D1 (csv-hub), Secret (RESEND_API_KEY)</span>
<div style="margin-top:12px;">
<div class="cron-row">
<span class="cron-schedule">0 12 * * *</span>
<div class="cron-info"><strong>Relatório Diário</strong> — 09:00 BRT. Coleta métricas de API, autenticação, dados TEA e propostas. Envia por e-mail.</div>
</div>
<div class="cron-row">
<span class="cron-schedule">*/30 * * * *</span>
<div class="cron-info"><strong>Health Check</strong> — A cada 30 min. Verifica status de todos os workers. Envia alerta se algum estiver fora do ar.</div>
</div>
<div class="cron-row">
<span class="cron-schedule">0 6 * * SUN</span>
<div class="cron-info"><strong>Limpeza Semanal</strong> — Domingo 03:00 BRT. Remove sessões expiradas e logs antigos (> 90 dias).</div>
</div>
</div>
</div>
<div class="worker-card">
<div class="worker-card-header">
<span class="worker-card-name">csv-data</span>
<span class="worker-card-version">Fase 3</span>
</div>
<div class="worker-card-desc">
Interface de consulta para o banco D1 e o armazenamento KV. Fornece endpoints para leitura de logs,
configurações e dados estruturados.
</div>
<strong style="font-size:0.82rem; color:#1e293b;">Bindings:</strong>
<span style="font-size:0.82rem; color:#5b6470;"> D1 (csv-hub), KV (csv-config)</span>
</div>
<div class="worker-card">
<div class="worker-card-header">
<span class="worker-card-name">csv-ai</span>
<span class="worker-card-version">Fase 3</span>
</div>
<div class="worker-card-desc">
Proxy seguro para o <strong>Cloudflare AI Gateway</strong>. Permite que o frontend utilize modelos de IA
(chat, resumo, análise, rascunho de e-mail) sem expor tokens no navegador.
</div>
<strong style="font-size:0.82rem; color:#1e293b;">Bindings:</strong>
<span style="font-size:0.82rem; color:#5b6470;"> D1 (csv-hub), Secret (AI_GATEWAY_TOKEN), Secret (RESEND_API_KEY)</span>
<ul class="endpoint-list">
<li><code>POST /chat</code> — Chat completion (compatível com OpenAI)</li>
<li><code>POST /summarize</code> — Resumo de texto (template pronto)</li>
<li><code>POST /analyze</code> — Análise de dados (template pronto)</li>
<li><code>POST /draft-email</code> — Rascunho de e-mail (template pronto)</li>
<li><code>GET /models</code> — Lista modelos disponíveis</li>
<li><code>GET /usage</code> — Estatísticas de uso</li>
</ul>
</div>
<div class="worker-card">
<div class="worker-card-header">
<span class="worker-card-name">csv-email</span>
<span class="worker-card-version">—</span>
</div>
<div class="worker-card-desc">
Endpoint genérico para envio de e-mails transacionais via <strong>Resend</strong>.
Suporta HTML, texto simples, CC, BCC, reply-to e tags de rastreamento.
Remetente padrão: <code>Hub CSV &lt;hub@mail.grupocsv.com&gt;</code>.
</div>
<strong style="font-size:0.82rem; color:#1e293b;">Bindings:</strong>
<span style="font-size:0.82rem; color:#5b6470;"> Secret (RESEND_API_KEY)</span>
</div>
<div class="worker-card">
<div class="worker-card-header">
<span class="worker-card-name">csv-mail</span>
<span class="worker-card-version">v1.0.0</span>
</div>
<div class="worker-card-desc">
Sistema de envio de e-mails agentico do Grupo CSV. Endpoint independente com autenticacao por API key propria,
suporte a HTML, texto, template institucional (header/footer padrao), anexos (ate 25 MB), CC, BCC, reply-to
e tags de rastreamento. Remetente padrao: <code>Guilherme Thome &lt;guilherme@mail.grupocsv.com&gt;</code>.
</div>
<strong style="font-size:0.82rem; color:#1e293b;">Bindings:</strong>
<span style="font-size:0.82rem; color:#5b6470;"> D1 (csv-hub), Secret (RESEND_API_KEY), Secret (CSV_MAIL_API_KEY)</span>
<ul class="endpoint-list">
<li><code>POST /send</code> — Envio completo de e-mail</li>
<li><code>POST /send-template</code> — Envio com template institucional</li>
<li><code>GET /status/:id</code> — Consultar status via Resend</li>
<li><code>GET /logs</code> — Listar ultimos e-mails enviados (D1)</li>
<li><code>GET /health</code> — Health check</li>
</ul>
</div>
<div class="worker-card">
<div class="worker-card-header">
<span class="worker-card-name">csv-webhook</span>
<span class="worker-card-version">—</span>
</div>
<div class="worker-card-desc">
Recebe webhooks de formulários e ferramentas do Hub. Encaminha os dados para destinos configurados
(URLs externas, e-mail ou ambos). Cada canal (ex: <code>dataset-tea</code>, <code>feedback-proposta</code>)
possui destinos pré-configurados por segurança.
</div>
<strong style="font-size:0.82rem; color:#1e293b;">Bindings:</strong>
<span style="font-size:0.82rem; color:#5b6470;"> D1 (csv-hub), Secret (RESEND_API_KEY)</span>
</div>
<div class="worker-card">
<div class="worker-card-header">
<span class="worker-card-name">csv-propostas</span>
<span class="worker-card-version">—</span>
</div>
<div class="worker-card-desc">
Gera propostas comerciais em HTML a partir de um template, armazena o arquivo no <strong>R2 Storage</strong>
e envia o link por e-mail via Resend. As propostas ficam acessíveis publicamente em
<code>propostas.axcare.com.br</code>.
</div>
<strong style="font-size:0.82rem; color:#1e293b;">Bindings:</strong>
<span style="font-size:0.82rem; color:#5b6470;"> R2 (csv-propostas), Secret (RESEND_API_KEY)</span>
</div>
<div class="worker-card">
<div class="worker-card-header">
<span class="worker-card-name">thera-contact</span>
<span class="worker-card-version">—</span>
</div>
<div class="worker-card-desc">
Processa o formulário de contato do site <code>thera.tech</code>.
Envia os dados por e-mail para <code>contato@thera.tech</code> via Resend.
</div>
<strong style="font-size:0.82rem; color:#1e293b;">Bindings:</strong>
<span style="font-size:0.82rem; color:#5b6470;"> Secret (RESEND_API_KEY)</span>
</div>
</div>
<div class="frame">
<h2 class="section-title">4. Sistema de Autenticação</h2>
<p class="section-desc">
O Hub CSV possui três modelos de autenticação distintos, cada um adequado ao tipo de portal e público.
Todos são gerenciados pelo worker <code>csv-auth</code> e pelo script frontend <code>hub-auth.js</code>.
</p>
<h3 class="subsection-title">4.1. Admin Universal</h3>
<p class="section-desc">
O proprietário do sistema possui uma credencial mestra que concede acesso a todos os portais
e ao painel administrativo. Ao fazer login com essa credencial em qualquer portal, o sistema
reconhece automaticamente e concede acesso.
</p>
<h3 class="subsection-title">4.2. Portais de Parceiros (Autenticação Individual)</h3>
<p class="section-desc">
Portais: <strong>Unimed</strong>, <strong>Unihealth</strong>, <strong>ICDS</strong>.
</p>
<div style="margin: 12px 0;">
<div class="flow-step"><div class="flow-number">1</div><div class="flow-text">Usuário acessa uma página protegida (ex: <code>hub.grupocsv.com/unimed/</code>).</div></div>
<div class="flow-step"><div class="flow-number">2</div><div class="flow-text"><code>hub-auth.js</code> detecta ausência de token válido e exibe modal com abas "Login" e "Solicitar Acesso".</div></div>
<div class="flow-step"><div class="flow-number">3</div><div class="flow-text"><strong>Login:</strong> Requer e-mail e senha individual de um usuário previamente aprovado.</div></div>
<div class="flow-step"><div class="flow-number">4</div><div class="flow-text"><strong>Solicitar Acesso:</strong> Formulário com nome e e-mail. Gera uma solicitação pendente no D1 e notifica o admin por e-mail.</div></div>
<div class="flow-step"><div class="flow-number">5</div><div class="flow-text">O admin aprova ou rejeita a solicitação via Painel Admin. Ao aprovar, define a senha do usuário.</div></div>
<div class="flow-step"><div class="flow-number">6</div><div class="flow-text">Após aprovação, o usuário recebe e-mail de confirmação e pode efetuar login. Token válido por 24 horas.</div></div>
</div>
<h3 class="subsection-title">4.3. Portais de Empresas (Senha Compartilhada)</h3>
<p class="section-desc">
Portais: <strong>AxiaCare</strong>, <strong>Thera</strong>, <strong>MedValor</strong>.
</p>
<div style="margin: 12px 0;">
<div class="flow-step"><div class="flow-number">1</div><div class="flow-text">Usuário acessa uma página protegida (ex: <code>hub.grupocsv.com/axia/</code>).</div></div>
<div class="flow-step"><div class="flow-number">2</div><div class="flow-text"><code>hub-auth.js</code> exibe modal com campo de senha (sem e-mail).</div></div>
<div class="flow-step"><div class="flow-number">3</div><div class="flow-text">A senha fixa do portal é validada contra o valor armazenado na tabela <code>portal_passwords</code> do D1 (com fallback para valores padrão em memória).</div></div>
<div class="flow-step"><div class="flow-number">4</div><div class="flow-text">Token de sessão é gerado e armazenado no <code>localStorage</code>. Válido por 24 horas.</div></div>
</div>
<p class="section-desc">
As senhas dos portais de empresas podem ser alteradas em tempo real pelo Painel Admin,
na aba "Senhas dos Portais CSV".
</p>
<h3 class="subsection-title">4.4. Deck (PIN de 4 Dígitos)</h3>
<div style="margin: 12px 0;">
<div class="flow-step"><div class="flow-number">1</div><div class="flow-text">Usuário acessa <code>hub.grupocsv.com/deck/</code>.</div></div>
<div class="flow-step"><div class="flow-number">2</div><div class="flow-text">Tela de bloqueio exibe 4 campos para o PIN.</div></div>
<div class="flow-step"><div class="flow-number">3</div><div class="flow-text">PIN é validado contra um hash armazenado no <code>localStorage</code>.</div></div>
<div class="flow-step"><div class="flow-number">4</div><div class="flow-text">"Esqueceu o PIN?" envia PIN temporário por e-mail via <code>/deck/reset-pin</code> e força redefinição.</div></div>
</div>
</div>
<div class="frame">
<h2 class="section-title">5. Banco de Dados e Armazenamento</h2>
<h3 class="subsection-title">5.1. Cloudflare D1 (<code>csv-hub</code>)</h3>
<p class="section-desc">
Banco de dados SQL relacional (SQLite na edge). Principal fonte de verdade para dados estruturados.
</p>
<div class="db-schema">
<div class="db-table-card">
<div class="db-table-name">users</div>
<div class="db-table-desc">Usuários dos portais de parceiros. PK: email. Campos: email, password, name, status (pending/active), created_at, updated_at.</div>
</div>
<div class="db-table-card">
<div class="db-table-name">user_tenants</div>
<div class="db-table-desc">Vínculo entre usuário e portal (tenant). PK composta: (user_email, tenant_id). Campos: status, approved_by, approved_at, created_at, updated_at.</div>
</div>
<div class="db-table-card">
<div class="db-table-name">access_requests</div>
<div class="db-table-desc">Solicitações de acesso aos portais. Campos: id, user_email, tenant_id, status (pending/approved/rejected), request_token, requested_at, approved_by_email, approved_at.</div>
</div>
<div class="db-table-card">
<div class="db-table-name">auth_sessions</div>
<div class="db-table-desc">Tokens de sessão ativos. PK: token. Campos: user_email, tenant_id, device_info, ip_address, user_agent, expires_at, created_at.</div>
</div>
<div class="db-table-card">
<div class="db-table-name">access_logs</div>
<div class="db-table-desc">Registro de acessos e ações nos portais. Campos: id, tenant_id, user_email, action, page_accessed, ip_address, user_agent, device_info, country, city, timestamp.</div>
</div>
<div class="db-table-card">
<div class="db-table-name">api_logs</div>
<div class="db-table-desc">Log de todas as requisições ao gateway. Campos: worker, method, path, status_code, origin, ip, user_agent, payload_size, response_time_ms, error, created_at.</div>
</div>
<div class="db-table-card">
<div class="db-table-name">portal_passwords</div>
<div class="db-table-desc">Senhas dos portais de empresas. PK: portal_id. Campos: password, updated_at, updated_by. Criada sob demanda pelo csv-auth.</div>
</div>
<div class="db-table-card">
<div class="db-table-name">email_logs</div>
<div class="db-table-desc">Log de e-mails enviados via Resend. Campos: from_addr, to_addrs, subject, resend_id, status, error, worker_origin.</div>
</div>
</div>
<h3 class="subsection-title">5.2. Outros Bancos D1</h3>
<table class="tech-table">
<thead><tr><th>Banco</th><th>UUID</th><th>Função</th></tr></thead>
<tbody>
<tr><td><code>whatsapp-brain</code></td><td>db907899-3b4d-43b3-b2d4-f429bad2a88a</td><td>Contatos e histórico de mensagens WhatsApp (WABA)</td></tr>
<tr><td><code>ccrt</code></td><td>8adfc2da-379f-4983-a19c-4d089b5e0fdc</td><td>Projeto CCRT</td></tr>
<tr><td><code>digital-deck-db</code></td><td>b98fedb2-4ad6-44dd-b813-36c556867477</td><td>Leads, gates e campanhas do Digital Deck</td></tr>
<tr><td><code>spectra-db</code></td><td>a1f87c99-d990-4a06-897e-4c033bcd684c</td><td>Banco de dados do Spectra AI</td></tr>
<tr><td><code>rd-icds</code></td><td>d4c3391a-2b4d-4bc0-8979-f572727ccaf7</td><td>Relatório de Desempenho ICDS</td></tr>
<tr><td><code>axiacare-methods</code></td><td>abdf6e4e-6d63-44a9-ae22-b69400c79af8</td><td>Methods Registry AxiaCare</td></tr>
<tr><td><code>csv-documents</code></td><td>2e36c57f-1ab0-457b-ae1e-442168435b34</td><td>Estado canônico da Central de Documentos</td></tr>
</tbody>
</table>
<h3 class="subsection-title">5.3. Cloudflare KV (9 namespaces)</h3>
<p class="section-desc">
Armazenamento de chave-valor de baixa latência distribuído globalmente.
</p>
<table class="tech-table">
<thead><tr><th>Namespace</th><th>Função</th></tr></thead>
<tbody>
<tr><td><code>csv-config</code></td><td>Configurações globais, senhas de portais e lista de admins</td></tr>
<tr><td><code>csv-open-pages</code></td><td>Status (ativo/inativo, auth_gate) e metadados das Open Pages</td></tr>
<tr><td><code>csv-open-auth</code></td><td>Senhas e sessões do Auth Gate</td></tr>
<tr><td><code>hub-unimedgv-kv</code></td><td>Status e metadados das Open Pages da Unimed GV</td></tr>
<tr><td><code>spectra-config</code></td><td>Configurações do Spectra AI</td></tr>
<tr><td><code>spectra-sessions</code></td><td>Sessões ativas do Spectra AI</td></tr>
<tr><td><code>gabi_config</code></td><td>Configurações de projetos associados</td></tr>
<tr><td><code>extensio-mcp-anthropic-oauth</code></td><td>Tokens OAuth para MCP Extensio (Anthropic)</td></tr>
<tr><td><code>cooperados-api-keys</code></td><td>Chaves de API para a página de cooperados</td></tr>
</tbody>
</table>
<h3 class="subsection-title">5.4. Cloudflare R2</h3>
<p class="section-desc">
Armazenamento de objetos compatível com S3, distribuído globalmente.
</p>
<table class="tech-table">
<thead><tr><th>Bucket</th><th>Função</th></tr></thead>
<tbody>
<tr><td><code>csv-open-pages</code></td><td>Arquivos HTML e assets das Open Pages + assets visuais (assets.grupocsv.com)</td></tr>
<tr><td><code>hub-unimedgv</code></td><td>Arquivos HTML das Open Pages da Unimed GV</td></tr>
<tr><td><code>csv-propostas</code></td><td>PDFs de propostas comerciais (propostas.axcare.com.br)</td></tr>
<tr><td><code>decks</code></td><td>Apresentações PPTX geradas pelo Deck</td></tr>
<tr><td><code>slides</code></td><td>Slides gerados via Markdown</td></tr>
<tr><td><code>hub-csv-knowledge</code></td><td>Arquivos para indexação do AI Search (AutoRAG)</td></tr>
<tr><td><code>spectra-assets</code></td><td>Assets visuais do Spectra AI</td></tr>
<tr><td><code>spectra-knowledge</code></td><td>Base de conhecimento do Spectra AI</td></tr>
<tr><td><code>vps-csv-backups</code></td><td>Backups criptografados da VPS-CSV (Restic)</td></tr>
<tr><td><code>gabi-assets</code></td><td>Assets de projetos associados</td></tr>
<tr><td><code>rd-icds-uploads</code></td><td>Uploads do Relatório de Desempenho ICDS</td></tr>
<tr><td><code>axiacare-methods</code></td><td>Arquivos do Methods Registry AxiaCare</td></tr>
<tr><td><code>csv-documents-private</code></td><td>Originais e derivados privados da Central de Documentos</td></tr>
</tbody>
</table>
</div>
<div class="frame">
<h2 class="section-title">6. Painel Administrativo</h2>
<p class="section-desc">
Acessível em <code>hub.grupocsv.com/admin/</code>, protegido por autenticação de admin.
Permite gerenciar todo o sistema de autenticação e links públicos.
</p>
<table class="tech-table">
<thead><tr><th>Aba</th><th>Funcionalidade</th></tr></thead>
<tbody>
<tr>
<td><strong>Senhas dos Portais CSV</strong></td>
<td>Visualizar e alterar as senhas fixas dos portais de empresas (AxiaCare, Thera, MedValor). Alterações entram em vigor imediatamente.</td>
</tr>
<tr>
<td><strong>Usuários Externos</strong></td>
<td>Aprovar/rejeitar solicitações de acesso. Listar usuários aprovados com seus portais vinculados. Revogar acesso.</td>
</tr>
<tr>
<td><strong>Links Públicos</strong></td>
<td>Listar páginas publicadas em <code>/p/</code>. Revogar ou restaurar links públicos (altera o <code>registry.json</code> via commit no GitHub).</td>
</tr>
<tr>
<td><strong>Log de Acessos Externos</strong></td>
<td>Histórico de logins em portais externos, ordenado do mais recente ao mais antigo. Exibe e-mail, nome, portal e data.</td>
</tr>
</tbody>
</table>
</div>
<div class="frame">
<h2 class="section-title">7. Serviços Externos Integrados</h2>
<p class="section-desc">
O backend integra-se com serviços externos para funcionalidades específicas.
Todas as chaves de acesso são armazenadas como Secrets nos Workers.
</p>
<table class="tech-table">
<thead><tr><th>Serviço</th><th>Uso</th><th>Workers que Utilizam</th></tr></thead>
<tbody>
<tr>
<td><strong>Resend</strong></td>
<td>Envio de e-mails transacionais (notificações, relatórios, propostas, formulários de contato)</td>
<td>csv-auth, csv-cron, csv-email, csv-mail, csv-propostas, csv-webhook, thera-contact</td>
</tr>
<tr>
<td><strong>Cloudflare AI Gateway</strong></td>
<td>Proxy para modelos de IA (chat, resumo, análise)</td>
<td>csv-ai</td>
</tr>
<tr>
<td><strong>GitHub API</strong></td>
<td>Commits automáticos no repositório (revogação de links públicos)</td>
<td>csv-auth</td>
</tr>
</tbody>
</table>
<h3 class="subsection-title">Domínios de E-mail Verificados (Resend)</h3>
<table class="tech-table">
<thead><tr><th>Domínio</th><th>Uso Principal</th><th>Região</th></tr></thead>
<tbody>
<tr><td><code>mail.grupocsv.com</code></td><td>Backend do Hub CSV (notificações, relatórios, propostas)</td><td>sa-east-1</td></tr>
<tr><td><code>thera.tech</code></td><td>Formulário de contato do site Thera</td><td>sa-east-1</td></tr>
<tr><td><code>spectra.thera.tech</code></td><td>Spectra AI</td><td>sa-east-1</td></tr>
<tr><td><code>veritas.thera.tech</code></td><td>Veritas</td><td>sa-east-1</td></tr>
</tbody>
</table>
</div>
<div class="frame">
<h2 class="section-title">8. Domínios e DNS</h2>
<p class="section-desc">
Todos os domínios são gerenciados via <strong>Cloudflare DNS</strong>. Os registros mais relevantes
para a infraestrutura do Hub estão listados abaixo.
</p>
<table class="tech-table">
<thead><tr><th>Subdomínio</th><th>Tipo</th><th>Destino</th><th>Função</th></tr></thead>
<tbody>
<tr>
<td><code>hub.grupocsv.com</code></td>
<td>CNAME</td>
<td>grupocsv.github.io</td>
<td>Frontend do Hub (GitHub Pages)</td>
</tr>
<tr>
<td><code>api.grupocsv.com</code></td>
<td>AAAA</td>
<td>100::</td>
<td>API Gateway (Worker csv-gateway)</td>
</tr>
<tr>
<td><code>api.thera.tech</code></td>
<td>AAAA</td>
<td>100::</td>
<td>Worker thera-contact</td>
</tr>
<tr>
<td><code>propostas.axcare.com.br</code></td>
<td>CNAME</td>
<td>public.r2.dev</td>
<td>R2 Bucket (propostas)</td>
</tr>
<tr>
<td><code>mail-api.grupocsv.com</code></td>
<td>AAAA</td>
<td>100::</td>
<td>Worker csv-mail</td>
</tr>
<tr>
<td><code>webhook.grupocsv.com</code></td>
<td>A</td>
<td>192.0.2.1</td>
<td>Worker csv-webhook</td>
</tr>
</tbody>
</table>
<h3 class="subsection-title">Zonas Cloudflare</h3>
<p class="section-desc">
O ecossistema utiliza 9 zonas DNS no Cloudflare: <code>axcare.ai</code>, <code>axcare.app</code>,
<code>axcare.com.br</code>, <code>grupocsv.com</code>, <code>guithome.com.br</code>,
<code>medvalor.med.br</code>, <code>theramed.ai</code>, <code>thera.med.br</code> e <code>thera.tech</code>.
Todas utilizam Google Workspace para e-mail corporativo (MX records).
</p>
</div>
<div class="frame">
<h2 class="section-title">9. Notas Técnicas</h2>
<table class="tech-table">
<thead><tr><th>Tópico</th><th>Detalhe</th></tr></thead>
<tbody>
<tr>
<td><strong>SPA Navigation</strong></td>
<td>O VitePress intercepta cliques internos. Páginas HTML standalone precisam do atributo <code>target="_self"</code> nos links para bypass do router SPA.</td>
</tr>
<tr>
<td><strong>Convenção de Tenant</strong></td>
<td>O <code>csv-auth</code> usa colunas <code>tenant_id</code> e <code>user_email</code> no D1 (não "portal" e "email"). Aliases são suportados (ex: <code>axia</code> mapeia para <code>axiacare</code>).</td>
</tr>
<tr>
<td><strong>Notificações</strong></td>
<td>E-mails de notificação de login e solicitações de acesso são enviados via Resend para <code>contato@grupocsv.com</code>.</td>
</tr>
<tr>
<td><strong>CORS</strong></td>
<td>Todos os workers incluem headers CORS permissivos (<code>Access-Control-Allow-Origin: *</code>) para permitir chamadas do frontend em GitHub Pages.</td>
</tr>
<tr>
<td><strong>Logging</strong></td>
<td>Todas as requisições que passam pelo gateway são registradas na tabela <code>api_logs</code> com worker, método, path, status HTTP e tempo de resposta em milissegundos.</td>
</tr>
<tr>
<td><strong>Sessões</strong></td>
<td>Tokens de sessão têm validade de 24 horas. A limpeza automática de sessões expiradas ocorre semanalmente (domingo 03:00 BRT).</td>
</tr>
<tr>
<td><strong>Links Públicos</strong></td>
<td>Open Pages e páginas legadas <code>/p/</code> são independentes da Central. Links públicos documentais nativos pertencem ao control plane <code>csv-documents</code>, estão produtivos e mantêm o R2 privado; criação, expiração e revogação são mediadas pela API.</td>
</tr>
</tbody>
</table>
</div>
<div style="text-align:center; margin-bottom:24px;">
<a href="/_infra/" style="display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:10px; background:#196396; color:white; text-decoration:none; font-weight:600; font-size:0.9rem; transition:all 0.2s;">← Voltar à Infraestrutura Cognitiva</a>
</div>
<div class="page-footer">
<strong>Grupo CSV — Infraestrutura Técnica</strong>
<div class="small">© 2026 Grupo CSV. Cuidados em Saúde com Valor. Todos os direitos reservados.</div>
</div>
</div>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const btn = document.getElementById('copy-page-btn')
  if (!btn) return
  btn.addEventListener('click', () => {
    const content = document.querySelector('.vp-doc') || document.querySelector('.VPPage') || document.querySelector('main')
    if (!content) return

    function htmlToMd(el) {
      let md = ''
      function walk(node) {
        if (node.nodeType === 3) { md += node.textContent; return }
        if (node.nodeType !== 1) return
        const tag = node.tagName.toLowerCase()
        if (node.classList && (node.classList.contains('copy-bar-btn') || node.classList.contains('copy-bar'))) return
        if (['style','script','nav','aside'].includes(tag)) return
        if (tag === 'h1') { md += '\n# '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h2') { md += '\n## '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h3') { md += '\n### '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h4') { md += '\n#### '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'p') { node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'br') { md += '\n'; return }
        if (tag === 'strong' || tag === 'b') { md += '**'; node.childNodes.forEach(walk); md += '**'; return }
        if (tag === 'em' || tag === 'i') { md += '*'; node.childNodes.forEach(walk); md += '*'; return }
        if (tag === 'code' && node.parentElement.tagName.toLowerCase() !== 'pre') {
          md += '`' + node.textContent + '`'; return
        }
        if (tag === 'pre') { md += '\n```\n' + node.textContent + '\n```\n\n'; return }
        if (tag === 'a') { md += '['; node.childNodes.forEach(walk); md += '](' + (node.href || '') + ')'; return }
        if (tag === 'li') { md += '- '; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'ul' || tag === 'ol') { md += '\n'; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'table') {
          const rows = node.querySelectorAll('tr')
          rows.forEach((row, i) => {
            const cells = row.querySelectorAll('th, td')
            md += '| ' + Array.from(cells).map(c => c.textContent.trim()).join(' | ') + ' |\n'
            if (i === 0) md += '|' + Array.from(cells).map(() => '---').join('|') + '|\n'
          })
          md += '\n'
          return
        }
        if (tag === 'hr') { md += '\n---\n\n'; return }
        if (tag === 'blockquote') { md += '> '; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'img') return
        node.childNodes.forEach(walk)
      }
      walk(el)
      return md.replace(/\n{3,}/g, '\n\n').trim()
    }

    const md = htmlToMd(content)
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
