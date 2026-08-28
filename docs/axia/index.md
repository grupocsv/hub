---
layout: page
title: AxiaCare®
head:
  - - meta
    - property: og:title
      content: "AxiaCare® | Gestão e Consultoria em Saúde"
  - - meta
    - property: og:description
      content: "Consultoria especializada em gestão hospitalar, operadoras e saúde baseada em valor. Uma empresa do Grupo CSV."
  - - meta
    - property: og:image
      content: "https://hub.grupocsv.com/og/og_axiacare.png"
  - - meta
    - property: og:url
      content: "https://hub.grupocsv.com/axia/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:image
      content: "https://hub.grupocsv.com/og/og_axiacare.png"
---

<style scoped>
.VPPage { padding: 0 !important; }

.empresa-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background:
    radial-gradient(1400px 600px at -10% -20%, #e8f0f6 0%, transparent 60%),
    radial-gradient(1200px 500px at 110% 0%, #e6f4ed 0%, transparent 60%),
    #F6F4EF;
  min-height: calc(100vh - 64px);
}
.dark .empresa-page { background: var(--vp-c-bg); }

.frame {
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(13,38,76,.06);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(13,38,76,.14);
  padding: clamp(18px, 4vw, 28px);
  margin-bottom: 24px;
}
.dark .frame { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.hero-section {
  display: flex;
  align-items: center;
  gap: 32px;
}
@media (max-width: 640px) { .hero-section { flex-direction: column; text-align: center; } }

.brand-logo {
  width: 140px;
  height: auto;
  flex-shrink: 0;
  filter: drop-shadow(0 4px 12px rgba(25,99,150,.15));
}
@media (max-width: 640px) { .brand-logo { width: 120px; } }

.hero-text h1 {
  margin: 0 0 6px;
  font-size: clamp(1.6rem, 2.3vw + 1rem, 2rem);
  color: #196396;
  border: none;
}
.dark .hero-text h1 { color: #5da9e0; }
.hero-text .razao { font-size: 0.85rem; color: #5b6470; margin: 0 0 4px; }
.hero-text .subtitle { font-size: 0.95rem; margin-top: 10px; line-height: 1.6; color: #5b6470; }

.section-title {
  margin: 0 0 12px;
  color: #2d3445;
  font-size: clamp(1.15rem, 1.1vw + 0.9rem, 1.35rem);
  border: none;
}
.dark .section-title { color: var(--vp-c-text-1); }
.section-desc { color: #5b6470; font-size: 0.92rem; margin-bottom: 16px; line-height: 1.6; }

.service-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}
@media (min-width: 760px) { .service-grid { grid-template-columns: 1fr 1fr; } }

.service-card {
  background: linear-gradient(180deg, #f0f6fb, #e8f0f6);
  border: 1px solid rgba(25,99,150,.08);
  border-radius: 14px;
  padding: 20px;
  transition: transform .18s ease, box-shadow .18s ease;
}
.service-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(25,99,150,.12); }
.dark .service-card { background: linear-gradient(180deg, #1e2a3a, #1a2530); border-color: var(--vp-c-divider); }
.service-card h4 { margin: 0 0 8px; font-size: 0.95rem; color: #196396; border: none; }
.dark .service-card h4 { color: #5da9e0; }
.service-card p { margin: 0; font-size: 0.88rem; color: #5b6470; line-height: 1.5; }

.info-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}
@media (min-width: 760px) { .info-grid { grid-template-columns: 1fr 1fr; } }

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #f0f6fb;
  border-radius: 12px;
  border: 1px solid rgba(25,99,150,.06);
}
.dark .info-item { background: var(--vp-c-bg-alt); border-color: var(--vp-c-divider); }
.info-item .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.8px; color: #196396; font-weight: 600; }
.info-item .value { font-size: 0.9rem; color: #2d3445; margin-top: 2px; }
.dark .info-item .value { color: var(--vp-c-text-1); }
.info-item a { color: #196396; text-decoration: none; }
.info-item a:hover { text-decoration: underline; }

.status-banner {
  background: linear-gradient(180deg, #1d6fa0, #196396);
  color: white;
  border-radius: 14px;
  padding: 24px;
  text-align: center;
}
.status-banner h3 { margin: 0 0 8px; font-size: 1.1rem; border: none; color: white; }
.status-banner p { margin: 0; font-size: 0.9rem; opacity: 0.85; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 10px;
  background: #196396;
  color: white !important;
  text-decoration: none !important;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.back-link:hover { background: #1d7ab5; transform: translateY(-2px); }

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

<div class="empresa-page">
  <div class="frame hero-section">
    <img src="https://assets.grupocsv.com/logos/axiacare/vertical-positivo.svg" alt="AxiaCare" class="brand-logo theme-logo--light">
    <img src="https://assets.grupocsv.com/logos/axiacare/vertical-negativo.svg" alt="AxiaCare" class="brand-logo theme-logo--dark">
    <div class="hero-text">
      <h1>AxiaCare®</h1>
      <p class="razao">Axia Gestão em Saúde Ltda · CNPJ 58.323.596/0001-40</p>
      <p class="subtitle">
        Orquestrador B2B2X de saúde baseada em valor. Conectamos operadoras, hospitais, prestadores,
        empresas de tecnologia, indústria farmacêutica e operadores logísticos em alianças
        multi-organizacionais orientadas a desfechos e eficiência operacional.
      </p>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Operações da AxiaCare</h2>
    <p class="section-desc">Recursos internos da AxiaCare para propostas, reembolsos e emissão de notas fiscais.</p>
    <div style="display:grid; gap:16px; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));">
      <div style="background:rgba(255,255,255,0.95); border:1px solid rgba(25,99,150,.10); border-radius:14px; padding:22px 20px; display:flex; flex-direction:column; gap:14px;">
        <span style="display:inline-block; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; padding:3px 10px; border-radius:20px; width:fit-content; background:#d1fae5; color:#065f46;">Ativo</span>
        <h4 style="margin:0; font-size:0.95rem; color:#196396; border:none; line-height:1.4;">Sistema Unimed</h4>
        <p style="margin:0; font-size:0.84rem; color:#5b6470; line-height:1.5; flex-grow:1;">Catálogo institucional para consulta de entidades, códigos e ativos de identidade visual do Sistema Unimed.</p>
        <a href="/axia/sistema-unimed.html" target="_self" style="display:inline-block; padding:10px 0; background:linear-gradient(135deg, #196396, #2DBF7F); color:#fff; border-radius:10px; font-size:0.88rem; font-weight:600; text-align:center; text-decoration:none; transition:all 0.2s;">Acessar</a>
      </div>
      <div style="background:rgba(255,255,255,0.95); border:1px solid rgba(25,99,150,.10); border-radius:14px; padding:22px 20px; display:flex; flex-direction:column; gap:14px;">
        <span style="display:inline-block; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; padding:3px 10px; border-radius:20px; width:fit-content; background:#d1fae5; color:#065f46;">Ativo</span>
        <h4 style="margin:0; font-size:0.95rem; color:#196396; border:none; line-height:1.4;">Propostas Comerciais</h4>
        <p style="margin:0; font-size:0.84rem; color:#5b6470; line-height:1.5; flex-grow:1;">Gerador de propostas comerciais padronizadas para consultoria e projetos.</p>
        <a href="/axia/propostas.html" target="_self" style="display:inline-block; padding:10px 0; background:linear-gradient(135deg, #196396, #2DBF7F); color:#fff; border-radius:10px; font-size:0.88rem; font-weight:600; text-align:center; text-decoration:none; transition:all 0.2s;">Acessar</a>
      </div>
      <div style="background:rgba(255,255,255,0.95); border:1px solid rgba(25,99,150,.10); border-radius:14px; padding:22px 20px; display:flex; flex-direction:column; gap:14px;">
        <span style="display:inline-block; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; padding:3px 10px; border-radius:20px; width:fit-content; background:#d1fae5; color:#065f46;">Ativo</span>
        <h4 style="margin:0; font-size:0.95rem; color:#196396; border:none; line-height:1.4;">Solicitação de Reembolso</h4>
        <p style="margin:0; font-size:0.84rem; color:#5b6470; line-height:1.5; flex-grow:1;">Gerador de solicitações de reembolso padronizadas com geração de PDF.</p>
        <a href="/axia/reembolso.html" target="_self" style="display:inline-block; padding:10px 0; background:linear-gradient(135deg, #196396, #2DBF7F); color:#fff; border-radius:10px; font-size:0.88rem; font-weight:600; text-align:center; text-decoration:none; transition:all 0.2s;">Acessar</a>
      </div>
      <div style="background:rgba(255,255,255,0.95); border:1px solid rgba(25,99,150,.10); border-radius:14px; padding:22px 20px; display:flex; flex-direction:column; gap:14px;">
        <span style="display:inline-block; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; padding:3px 10px; border-radius:20px; width:fit-content; background:#d1fae5; color:#065f46;">Ativo</span>
        <h4 style="margin:0; font-size:0.95rem; color:#196396; border:none; line-height:1.4;">Solicitação de Emissão de NF</h4>
        <p style="margin:0; font-size:0.84rem; color:#5b6470; line-height:1.5; flex-grow:1;">Solicitação de emissão de nota fiscal com gestão de status e aprovações.</p>
        <a href="/axia/nota-fiscal.html" target="_self" style="display:inline-block; padding:10px 0; background:linear-gradient(135deg, #196396, #2DBF7F); color:#fff; border-radius:10px; font-size:0.88rem; font-weight:600; text-align:center; text-decoration:none; transition:all 0.2s;">Acessar</a>
      </div>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Áreas de Atuação</h2>
    <p class="section-desc">Soluções de consultoria para organizações de saúde orientadas a resultados.</p>
    <div class="service-grid">
      <div class="service-card">
        <h4>Governança Clínica</h4>
        <p>Estruturação de comitês, protocolos assistenciais e indicadores de qualidade para hospitais e operadoras.</p>
      </div>
      <div class="service-card">
        <h4>Saúde Baseada em Valor</h4>
        <p>Implementação de modelos VBHC com foco em desfechos que importam para o paciente e eficiência operacional.</p>
      </div>
      <div class="service-card">
        <h4>Gestão de Operadoras</h4>
        <p>Analytics de sinistralidade, linhas de cuidado e estratégias para sustentabilidade de planos de saúde.</p>
      </div>
      <div class="service-card">
        <h4>Acreditação e Qualidade</h4>
        <p>Preparação e acompanhamento de processos de acreditação hospitalar e certificações de qualidade.</p>
      </div>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Informações e Contato</h2>
    <div class="info-grid">
      <div class="info-item">
        <div>
          <div class="label">Site</div>
          <div class="value"><a href="https://axcare.com.br" target="_blank">axcare.com.br</a></div>
        </div>
      </div>
      <div class="info-item">
        <div>
          <div class="label">E-mail</div>
          <div class="value"><a href="mailto:contato@axcare.com.br">contato@axcare.com.br</a></div>
        </div>
      </div>
      <div class="info-item">
        <div>
          <div class="label">Compliance</div>
          <div class="value"><a href="/compliance/" target="_self">Central de Compliance</a></div>
        </div>
      </div>
      <div class="info-item">
        <div>
          <div class="label">Grupo</div>
          <div class="value"><a href="https://grupocsv.com" target="_blank">Grupo CSV</a></div>
        </div>
      </div>
    </div>
  </div>

  <div style="text-align:center; margin-bottom:24px;">
    <a href="/" class="back-link" target="_self">← Voltar ao Hub</a>
  </div>

  <div class="page-footer">
    <strong>AxiaCare® — Grupo CSV</strong>
    <div class="small">© 2026 Grupo CSV. Cuidados em Saúde com Valor. Todos os direitos reservados.</div>
  </div>
</div>
