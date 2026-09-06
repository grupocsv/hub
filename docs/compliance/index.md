---
layout: page
title: Central de Compliance
head:
  - - meta
    - property: og:title
      content: "Central de Compliance | Grupo CSV"
  - - meta
    - property: og:description
      content: "Governança, ética e transparência. Documentos de compliance do ecossistema Grupo CSV."
  - - meta
    - property: og:image
      content: "https://hub.grupocsv.com/og/og_compliance.png"
  - - meta
    - property: og:url
      content: "https://hub.grupocsv.com/compliance/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:image
      content: "https://hub.grupocsv.com/og/og_compliance.png"
---

<style scoped>
.VPPage { padding: 0 !important; }

.compliance-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background:
    radial-gradient(1400px 600px at -10% -20%, #e8f0f6 0%, transparent 60%),
    radial-gradient(1200px 500px at 110% 0%, #ebf7f1 0%, transparent 60%),
    #F6F4EF;
  min-height: calc(100vh - 64px);
}

.dark .compliance-page {
  background: var(--vp-c-bg);
}

.frame {
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(13,38,76,.06);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(13,38,76,.14);
  padding: clamp(18px, 4vw, 28px);
  margin-bottom: 24px;
}

.dark .frame {
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-divider);
  box-shadow: none;
}

.hero-section h1 {
  margin: 0 0 6px;
  font-size: clamp(1.6rem, 2.3vw + 1rem, 2rem);
  color: #196396;
  border: none;
}
.dark .hero-section h1 { color: #5da9e0; }
.hero-section .date { margin: 0; color: #5b6470; font-size: 0.9rem; }
.hero-section .subtitle { font-size: 0.95rem; margin-top: 8px; }

.section-title {
  margin: 0 0 12px;
  color: #2d3445;
  font-size: clamp(1.15rem, 1.1vw + 0.9rem, 1.35rem);
  border: none;
}
.dark .section-title { color: var(--vp-c-text-1); }
.section-desc { color: #5b6470; font-size: 0.92rem; margin-bottom: 16px; }

.btn-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}
@media (min-width: 760px) { .btn-grid { grid-template-columns: 1fr 1fr; } }

.policy-btn {
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
.policy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(13,38,76,.20);
}
.policy-btn::after { content: '›'; font-weight: 700; font-size: 1.4rem; opacity: 0.9; }

.policy-btn.secondary {
  background: linear-gradient(180deg, #eef4fa, #e6eef7);
  color: #1b2a3a !important;
}
.dark .policy-btn.secondary { background: linear-gradient(180deg, #2a3040, #1e2430); color: #ddd !important; }
.policy-btn.secondary:hover { box-shadow: 0 10px 20px rgba(13,38,76,.12); }

.policy-btn.axia { background: linear-gradient(180deg, #1d6fa0, #195f86); }
.policy-btn.medvalor { background: linear-gradient(180deg, #ea580c, #c2410c); }
.policy-btn.thera { background: linear-gradient(180deg, #8B7CB5, #6B5B95); }

.empresa-block { margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,.08); }
.dark .empresa-block { border-color: var(--vp-c-divider); }
.empresa-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.empresa-header img { height: 32px; width: auto; }
.empresa-header h4 { margin: 0; font-size: 1.05rem; color: #2d3445; }
.dark .empresa-header h4 { color: var(--vp-c-text-1); }

.contact-frame ul { margin: 12px 0 0; padding-left: 20px; }
.contact-frame a { color: #196396; text-decoration: none; }
.contact-frame a:hover { text-decoration: underline; }
.dark .contact-frame a { color: #5da9e0; }

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

<div class="compliance-page">
  <div class="frame hero-section">
    <h1>Central de Compliance</h1>
    <p class="date">Última atualização: 09/2026</p>
    <p class="subtitle">Documentos institucionais do <strong>Grupo CSV</strong> e suas empresas sobre privacidade, termos e integridade.</p>
  </div>

  <div class="frame">
    <h2 class="section-title">Políticas do Grupo CSV</h2>
    <p class="section-desc">Documentos transversais aplicáveis a todas as empresas do ecossistema.</p>
    <div class="btn-grid">
      <a class="policy-btn" target="_self" href="/compliance/privacidade.html">Política de Privacidade (LGPD)</a>
      <a class="policy-btn" target="_self" href="/compliance/termos.html">Termos de Uso</a>
      <a class="policy-btn" target="_self" href="/compliance/cookies.html">Política de Cookies</a>
      <a class="policy-btn" target="_self" href="/compliance/autorizacao-parceria.html">Autorização de Parceria – Uso de Marca</a>
      <a class="policy-btn" target="_self" href="/compliance/transparencia-ia.html">Transparência em Inteligência Artificial</a>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Integridade e Conduta</h2>
    <p class="section-desc">Diretrizes éticas e de governança corporativa do Grupo CSV.</p>
    <div class="btn-grid">
      <a class="policy-btn secondary" target="_self" href="/compliance/codigo-de-conduta.html">Código de Ética e Conduta</a>
      <a class="policy-btn secondary" target="_self" href="/compliance/brindes.html">Política de Brindes, Presentes e Hospitalidade</a>
      <a class="policy-btn secondary" target="_self" href="/compliance/anticorrupcao.html">Política Anticorrupção e Antissuborno</a>
      <a class="policy-btn secondary" target="_self" href="/compliance/terceiros.html">Relacionamento com Terceiros e Due Diligence</a>
      <a class="policy-btn secondary" target="_self" href="/compliance/integridade.html">Cláusulas-Padrão de Integridade</a>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Políticas por Empresa</h2>
    <p class="section-desc">Documentos específicos de cada unidade de negócio do Grupo CSV.</p>

<div class="empresa-block" style="border-top: none; margin-top: 0; padding-top: 0;">
<div class="empresa-header">
<h4>AxiaCare® — Axia Gestão em Saúde Ltda &bull; CNPJ 58.323.596/0001-40</h4>
</div>
<div class="btn-grid">
<a class="policy-btn axia" target="_self" href="/compliance/axiacare/privacidade.html">Privacidade – AxiaCare</a>
<a class="policy-btn axia" target="_self" href="/compliance/axiacare/termos.html">Termos de Uso – AxiaCare</a>
<a class="policy-btn axia" target="_self" href="/compliance/axiacare/nda.html">Acordo de Confidencialidade (NDA) – AxiaCare</a>
<a class="policy-btn axia" target="_self" href="/compliance/axiacare/cnds.html">Certidões Negativas de Débito (CNDs) – AxiaCare</a>
</div>
</div>

<div class="empresa-block">
<div class="empresa-header">
<h4>MedValor® — Medvalor Conteúdo em Saúde Ltda &bull; CNPJ 58.323.964/0001-50</h4>
</div>
<div class="btn-grid">
<a class="policy-btn medvalor" target="_self" href="/compliance/medvalor/privacidade.html">Privacidade – MedValor</a>
<a class="policy-btn medvalor" target="_self" href="/compliance/medvalor/termos.html">Termos de Uso – MedValor</a>
</div>
</div>

<div class="empresa-block">
<div class="empresa-header">
<h4>TheraTech® — Thera Tecnologia em Saúde Ltda &bull; CNPJ 63.100.433/0001-39</h4>
</div>
<div class="btn-grid">
<a class="policy-btn thera" target="_self" href="/compliance/thera/privacidade.html">Privacidade – TheraTech</a>
<a class="policy-btn thera" target="_self" href="/compliance/thera/termos.html">Termos de Uso – TheraTech</a>
</div>
</div>
  </div>

  <div class="frame contact-frame">
    <h2 class="section-title">Canal de Compliance</h2>
    <p>Dúvidas, sugestões ou reporte de potenciais não conformidades:</p>
    <ul>
      <li><strong>Grupo CSV:</strong> <a href="mailto:compliance@grupocsv.com">compliance@grupocsv.com</a></li>
      <li><strong>AxiaCare:</strong> <a href="mailto:compliance@axcare.com.br">compliance@axcare.com.br</a></li>
      <li><strong>MedValor:</strong> <a href="mailto:compliance@medvalor.med.br">compliance@medvalor.med.br</a></li>
      <li><strong>TheraTech:</strong> <a href="mailto:compliance@thera.tech">compliance@thera.tech</a></li>
    </ul>
  </div>

  <div style="text-align:center; margin-bottom:24px;"><a href="/" style="display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:10px; background:#196396; color:white; text-decoration:none; font-weight:600; font-size:0.9rem; transition:all 0.2s;">← Voltar ao Hub</a></div>

  <div class="page-footer">
    <strong>Grupo CSV – Central de Compliance</strong>
    <div class="small">© 2026 Grupo CSV. Cuidados em Saúde com Valor. Todos os direitos reservados.</div>
  </div>
</div>
