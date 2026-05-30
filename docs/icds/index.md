---
layout: page
title: ICDS - Hub de Ferramentas
head:
  - - meta
    - property: og:title
      content: "ICDS — Instituto de Cooperação para o Desenvolvimento da Saúde | Hub de Ferramentas"
  - - meta
    - property: og:description
      content: "Dashboards, ferramentas e entregáveis desenvolvidos para o ICDS. Parceiro Grupo CSV."
  - - meta
    - property: og:image
      content: "https://hub.grupocsv.com/og/og_icds.png"
  - - meta
    - property: og:url
      content: "https://hub.grupocsv.com/icds/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:image
      content: "https://hub.grupocsv.com/og/og_icds.png"
---

<style scoped>
.VPPage { padding: 0 !important; }

.icds-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 48px;
  min-height: calc(100vh - 64px);
}

.icds-header {
  text-align: center;
  padding: 50px 20px;
  background: linear-gradient(135deg, rgba(27,58,92,0.04) 0%, rgba(44,95,138,0.02) 100%);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  margin-bottom: 40px;
  border: 1px solid rgba(27,58,92,0.12);
}
.dark .icds-header { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.icds-header .logo { width: 280px; max-width: 90%; margin: 0 auto 20px; display: block; }
.icds-header .logo-link { display: inline-block; transition: transform 0.3s; }
.icds-header .logo-link:hover { transform: scale(1.05); }

.icds-header h1 { color: #1B3A5C; font-size: 36px; font-weight: 700; margin: 0 0 12px; border: none; letter-spacing: -0.3px; }
.dark .icds-header h1 { color: #5da9e0; }
.icds-header .subtitle { color: var(--vp-c-text-2); font-size: 16px; }

.icds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
}

.icds-card {
  background: linear-gradient(135deg, rgba(27,58,92,0.03), rgba(44,95,138,0.05));
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  border: 1px solid rgba(27,58,92,0.1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.dark .icds-card { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.icds-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #1B3A5C, #2C5F8A);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s;
}
.icds-card:hover::before { transform: scaleX(1); }
.icds-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(27,58,92,0.15); border-color: rgba(27,58,92,0.2); }

.icds-card.featured {
  background: linear-gradient(135deg, #1B3A5C, #2C5F8A);
  color: white;
  border-color: #1B3A5C;
}
.icds-card.featured .icds-title { color: white; }
.icds-card.featured .icds-date { color: rgba(255,255,255,0.85); }
.icds-card.featured .icds-link { background: #5B8DB8; border-color: #5B8DB8; }
.icds-card.featured .icds-link:hover { background: #6fa0c8; border-color: #6fa0c8; }
.icds-card.featured::after {
  display: none;
  box-shadow: 0 2px 8px rgba(91,141,184,0.4);
}

.icds-title { color: #1B3A5C; font-size: 18px; font-weight: 600; margin-bottom: 8px; line-height: 1.3; flex-grow: 1; }
.dark .icds-card:not(.featured) .icds-title { color: #5da9e0; }

.icds-date { color: var(--vp-c-text-2); font-size: 13px; font-weight: 500; margin-bottom: 20px; display: block; }

.icds-link {
  display: block;
  width: 100%;
  padding: 14px 24px;
  background: #1B3A5C;
  color: white !important;
  text-decoration: none !important;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  transition: all 0.3s;
  border: 2px solid #1B3A5C;
}
.icds-link:hover { background: #2C5F8A; border-color: #2C5F8A; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(44,95,138,0.3); }

.icds-link.disabled { background: #94a3b8; border-color: #94a3b8; opacity: 0.7; cursor: not-allowed; }
.icds-link.disabled:hover { background: #94a3b8; border-color: #94a3b8; transform: none; box-shadow: none; }

.icds-foot {
  padding: 32px 20px;
  background: #f8f5f0;
  text-align: center;
  border-top: 2px solid #1B3A5C;
  border-radius: 16px;
}
.dark .icds-foot { background: var(--vp-c-bg-soft); border-color: #5da9e0; }
.icds-foot .foot-logo { width: 140px; margin: 0 auto 12px; display: block; }
.icds-foot .foot-slogan { font-size: 14px; font-weight: 600; color: #2d3445; margin: 8px 0 20px; letter-spacing: 0.01em; }
.dark .icds-foot .foot-slogan { color: var(--vp-c-text-1); }
.icds-foot .foot-links { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 8px; line-height: 1.6; }
.icds-foot .foot-links a { color: #196396; text-decoration: none; transition: color 0.2s; }
.dark .icds-foot .foot-links a { color: #5da9e0; }
.icds-foot .foot-links a:hover { text-decoration: underline; color: #0f2b46; }
.dark .icds-foot .foot-links a:hover { color: #8ec8f0; }
.icds-foot .sep { color: #cbd5e1; margin: 0 3px; font-size: 11px; }
.icds-foot .copyright { margin-top: 20px; font-size: 11px; color: #94a3b8; letter-spacing: 0.01em; }
@media (max-width: 480px) {
  .icds-foot { padding: 24px 16px; }
  .icds-foot .foot-logo { width: 120px; }
  .icds-foot .foot-slogan { font-size: 13px; }
  .icds-foot .foot-links { font-size: 12px; gap: 4px; }
}

@media (max-width: 768px) { .icds-grid { grid-template-columns: 1fr; } .icds-header h1 { font-size: 28px; } .icds-header .logo { width: 220px; } }
</style>

<div class="icds-page">
  <div class="icds-header">
    <a href="https://icds.org.br/" target="_blank" class="logo-link">
      <img src="/visual-identity/icds/logo/png/icds_horizontal_sem_fundo_positivo.png" alt="ICDS Logo" class="logo">
    </a>
    <h1>Hub ICDS</h1>
    <p class="subtitle">Entidade Filantrópica e Gestora Assistencial</p>
  </div>

  <div id="tools-grid-icds" class="icds-grid">
    <div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Carregando ferramentas...</div>
  </div>

  <div style="text-align:center; margin-bottom:30px;"><a href="https://hub.grupocsv.com" style="display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:10px; background:#1B3A5C; color:white; text-decoration:none; font-weight:600; font-size:0.9rem; transition:all 0.2s;">← Voltar ao Hub</a></div>
  <div class="icds-foot">
    <img class="foot-logo" src="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_positive.png" alt="AxiaCare">
    <div class="foot-slogan">Gestão e Consultoria em Saúde</div>
    <div class="foot-links">
      <a href="https://linktr.ee/gui.thome">Conheça nossas soluções</a>
      <span class="sep">|</span>
      <a href="https://www.axcare.com.br" target="_blank">axcare.com.br</a>
    </div>
    <div class="foot-links">
      <a href="https://grupocsv.com" target="_blank">grupocsv.com</a>
      <span class="sep">|</span>
      <a href="https://www.medvalor.med.br" target="_blank">medvalor.med.br</a>
      <span class="sep">|</span>
      <a href="https://thera.tech" target="_blank">thera.tech</a>
    </div>
    <div class="foot-links">
      <a href="https://guithome.com.br" target="_blank">guithome.com.br</a>
      <span class="sep">|</span>
      <a href="https://linkedin.com/in/guithome" target="_blank">LinkedIn</a>
      <span class="sep">|</span>
      <a href="https://www.instagram.com/gui.thome/" target="_blank">Instagram</a>
    </div>
    <div class="copyright">Copyright © 2026 AxiaCare | Todos os direitos reservados | Uma empresa do Grupo CSV</div>
  </div>
</div>


<script setup>
import { onMounted } from 'vue'
onMounted(() => {
  if (!document.querySelector('script[data-portal="icds"]')) {
    const s = document.createElement('script')
    s.src = '/scripts/hub-auth.js'
    s.setAttribute('data-portal', 'icds')
    document.body.appendChild(s)
  }

  fetch('/icds/tools.json')
    .then(r => r.json())
    .then(data => {
      const grid = document.getElementById('tools-grid-icds')
      if (!grid || !data.tools || data.tools.length === 0) return
      grid.innerHTML = data.tools.map(tool => {
        const href = tool.external ? tool.file : `/icds/${tool.file}`
        return `
        <div class="icds-card">
          <div class="icds-title">${tool.title}</div>
          <a data-direct href="${href}" class="icds-link">Acessar</a>
        </div>
      `}).join('')
    })
    .catch(() => {
      const grid = document.getElementById('tools-grid-icds')
      if (grid) grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Erro ao carregar ferramentas.</div>'
    })
})
</script>
