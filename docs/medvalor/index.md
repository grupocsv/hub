---
layout: page
title: MedValor®
head:
  - - meta
    - property: og:title
      content: "MedValor® | Educação Executiva em Saúde"
  - - meta
    - property: og:description
      content: "Formação de lideranças médicas e executivas em saúde baseada em valor. Uma empresa do Grupo CSV."
  - - meta
    - property: og:image
      content: "https://hub.grupocsv.com/og/og_medvalor.png"
  - - meta
    - property: og:url
      content: "https://hub.grupocsv.com/medvalor/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:image
      content: "https://hub.grupocsv.com/og/og_medvalor.png"
---

<style scoped>
.VPPage { padding: 0 !important; }

.empresa-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background:
    radial-gradient(1400px 600px at -10% -20%, #fef3ea 0%, transparent 60%),
    radial-gradient(1200px 500px at 110% 0%, #fdf0e6 0%, transparent 60%),
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
  filter: drop-shadow(0 4px 12px rgba(234,88,12,.15));
}
@media (max-width: 640px) { .brand-logo { width: 120px; } }

.hero-text h1 {
  margin: 0 0 6px;
  font-size: clamp(1.6rem, 2.3vw + 1rem, 2rem);
  color: #c2410c;
  border: none;
}
.dark .hero-text h1 { color: #fb923c; }
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
  background: linear-gradient(180deg, #fef7f0, #fdf0e6);
  border: 1px solid rgba(234,88,12,.08);
  border-radius: 14px;
  padding: 20px;
  transition: transform .18s ease, box-shadow .18s ease;
}
.service-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(234,88,12,.12); }
.dark .service-card { background: linear-gradient(180deg, #2a2218, #1e1a14); border-color: var(--vp-c-divider); }
.service-card h4 { margin: 0 0 8px; font-size: 0.95rem; color: #c2410c; border: none; }
.dark .service-card h4 { color: #fb923c; }
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
  background: #fef7f0;
  border-radius: 12px;
  border: 1px solid rgba(234,88,12,.06);
}
.dark .info-item { background: var(--vp-c-bg-alt); border-color: var(--vp-c-divider); }
.info-item .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.8px; color: #ea580c; font-weight: 600; }
.info-item .value { font-size: 0.9rem; color: #2d3445; margin-top: 2px; }
.dark .info-item .value { color: var(--vp-c-text-1); }
.info-item a { color: #c2410c; text-decoration: none; }
.info-item a:hover { text-decoration: underline; }

.status-banner {
  background: linear-gradient(180deg, #ea580c, #c2410c);
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
  background: #c2410c;
  color: white !important;
  text-decoration: none !important;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.back-link:hover { background: #ea580c; transform: translateY(-2px); }

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
    <img src="https://assets.grupocsv.com/logos/medvalor/vertical-positivo-laranja.svg" alt="MedValor" class="brand-logo theme-logo--light">
    <img src="https://assets.grupocsv.com/logos/medvalor/vertical-negativo-laranja.svg" alt="MedValor" class="brand-logo theme-logo--dark">
    <div class="hero-text">
      <h1>MedValor®</h1>
      <p class="razao">Medvalor Conteúdo em Saúde Ltda · CNPJ 58.323.964/0001-50</p>
      <p class="subtitle">
        Educação executiva e capacitação de lideranças em saúde. Formação de gestores,
        médicos líderes e equipes multidisciplinares orientados a resultados e valor.
      </p>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Áreas de Atuação</h2>
    <p class="section-desc">Programas de educação e desenvolvimento para profissionais e organizações de saúde.</p>
    <div class="service-grid">
      <div class="service-card">
        <h4>Educação Executiva</h4>
        <p>Programas de formação para gestores hospitalares, diretores médicos e lideranças de operadoras de saúde.</p>
      </div>
      <div class="service-card">
        <h4>Liderança Médica</h4>
        <p>Desenvolvimento de competências de liderança, comunicação e gestão para médicos em posições estratégicas.</p>
      </div>
      <div class="service-card">
        <h4>Conteúdo em Saúde</h4>
        <p>Produção de materiais educacionais, artigos técnicos e conteúdo especializado sobre gestão em saúde.</p>
      </div>
      <div class="service-card">
        <h4>Capacitação de Equipes</h4>
        <p>Treinamentos in-company para equipes multidisciplinares em qualidade, segurança do paciente e eficiência.</p>
      </div>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Informações e Contato</h2>
    <div class="info-grid">
      <div class="info-item">
        <div>
          <div class="label">Site</div>
          <div class="value"><a href="https://medvalor.med.br" target="_blank">medvalor.med.br</a></div>
        </div>
      </div>
      <div class="info-item">
        <div>
          <div class="label">E-mail</div>
          <div class="value"><a href="mailto:contato@medvalor.med.br">contato@medvalor.med.br</a></div>
        </div>
      </div>
      <div class="info-item">
        <div>
          <div class="label">Compliance</div>
          <div class="value"><a href="/compliance/">Central de Compliance</a></div>
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
    <strong>MedValor® — Grupo CSV</strong>
    <div class="small">© 2026 Grupo CSV. Cuidados em Saúde com Valor. Todos os direitos reservados.</div>
  </div>
</div>
