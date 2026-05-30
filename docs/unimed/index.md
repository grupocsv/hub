---
layout: page
title: Hub Unimed Governador Valadares
head:
  - - meta
    - property: og:title
      content: "Hub Unimed Governador Valadares | Operadora de Planos de Saúde"
  - - meta
    - property: og:description
      content: "Dashboards, ferramentas e entregáveis desenvolvidos para a Unimed GV. Parceiro Grupo CSV."
  - - meta
    - property: og:image
      content: "https://hub.grupocsv.com/og/og_unimed.png"
  - - meta
    - property: og:url
      content: "https://hub.grupocsv.com/unimed/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:image
      content: "https://hub.grupocsv.com/og/og_unimed.png"
---

<style scoped>
.VPPage { padding: 0 !important; }

.unimed-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 48px;
  min-height: calc(100vh - 64px);
}

.page-header {
  text-align: center;
  padding: 50px 20px;
  background: linear-gradient(135deg, rgba(0,153,93,0.04) 0%, rgba(0,153,93,0.02) 100%);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  margin-bottom: 40px;
  border: 1px solid rgba(0,153,93,0.12);
}
.dark .page-header { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.page-header .logo { width: 280px; max-width: 90%; margin: 0 auto 20px; display: block; }
.page-header .logo-link { display: inline-block; transition: transform 0.3s; }
.page-header .logo-link:hover { transform: scale(1.05); }

.page-header h1 { color: #00995d; font-size: 36px; font-weight: 700; margin: 0 0 12px; border: none; letter-spacing: -0.3px; }
.dark .page-header h1 { color: #3dcc8e; }
.page-header .subtitle { color: var(--vp-c-text-2); font-size: 16px; }

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
}

.tool-card {
  background: linear-gradient(135deg, rgba(0,153,93,0.03), rgba(0,153,93,0.05));
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  border: 1px solid rgba(0,153,93,0.1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.dark .tool-card { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.tool-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00995d, #8baf1f);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s;
}
.tool-card:hover::before { transform: scaleX(1); }
.tool-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,153,93,0.15); border-color: rgba(0,153,93,0.2); }

.tool-card.featured {
  background: linear-gradient(135deg, #00995d, #007a4a);
  color: white;
  border-color: #00995d;
}
.tool-card.featured .tool-title { color: white; }
.tool-card.featured .tool-link { background: #8baf1f; border-color: #8baf1f; }
.tool-card.featured .tool-link:hover { background: #a0c944; border-color: #a0c944; }
.tool-card.featured::after {
  display: none;
}

.tool-title { color: #00995d; font-size: 18px; font-weight: 600; margin-bottom: 20px; line-height: 1.3; flex-grow: 1; }
.dark .tool-card:not(.featured) .tool-title { color: #3dcc8e; }

.tool-link {
  display: block;
  width: 100%;
  padding: 14px 24px;
  background: #00995d;
  color: white !important;
  text-decoration: none !important;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  transition: all 0.3s;
  border: 2px solid #00995d;
}
.tool-link:hover { background: #8baf1f; border-color: #8baf1f; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(139,175,31,0.3); }

.page-foot {
  padding: 32px 20px;
  background: #f8f5f0;
  text-align: center;
  border-top: 2px solid #00995d;
  border-radius: 16px;
}
.dark .page-foot { background: var(--vp-c-bg-soft); border-color: #3dcc8e; }
.page-foot .foot-logo { width: 140px; margin: 0 auto 12px; display: block; }
.page-foot .foot-slogan { font-size: 14px; font-weight: 600; color: #2d3445; margin: 8px 0 20px; letter-spacing: 0.01em; }
.dark .page-foot .foot-slogan { color: var(--vp-c-text-1); }
.page-foot .foot-links { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 8px; line-height: 1.6; }
.page-foot .foot-links a { color: #196396; text-decoration: none; transition: color 0.2s; }
.dark .page-foot .foot-links a { color: #5da9e0; }
.page-foot .foot-links a:hover { text-decoration: underline; color: #0f2b46; }
.dark .page-foot .foot-links a:hover { color: #8ec8f0; }
.page-foot .sep { color: #cbd5e1; margin: 0 3px; font-size: 11px; }
.page-foot .copyright { margin-top: 20px; font-size: 11px; color: #94a3b8; letter-spacing: 0.01em; }
@media (max-width: 480px) {
  .page-foot { padding: 24px 16px; }
  .page-foot .foot-logo { width: 120px; }
  .page-foot .foot-slogan { font-size: 13px; }
  .page-foot .foot-links { font-size: 12px; gap: 4px; }
}

@media (max-width: 768px) { .tools-grid { grid-template-columns: 1fr; } .page-header h1 { font-size: 28px; } .page-header .logo { width: 220px; } }
</style>

<div class="unimed-page">
  <div class="page-header">
    <a href="https://www.unimed.coop.br/site/web/governadorvaladares" target="_blank" class="logo-link">
      <img src="https://i.imgur.com/prZGWXK.png" alt="Unimed Governador Valadares" class="logo">
    </a>
    <h1>Hub Unimed Governador Valadares</h1>
    <p class="subtitle">Operadora de Planos de Saúde</p>
  </div>

  <div id="tools-grid-unimed" class="tools-grid">
    <div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Carregando ferramentas...</div>
  </div>

  <div style="text-align:center; margin-bottom:30px;"><a href="https://hub.grupocsv.com" style="display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:10px; background:#00995d; color:white; text-decoration:none; font-weight:600; font-size:0.9rem; transition:all 0.2s;">← Voltar ao Hub</a></div>
  <div class="page-foot">
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
  // Carregar hub-auth.js
  if (!document.querySelector('script[data-portal="unimed"]')) {
    const s = document.createElement('script')
    s.src = '/scripts/hub-auth.js'
    s.setAttribute('data-portal', 'unimed')
    document.body.appendChild(s)
  }

  // Carregar tools.json e renderizar cards dinamicamente
  fetch('/unimed/tools.json')
    .then(r => r.json())
    .then(data => {
      const grid = document.getElementById('tools-grid-unimed')
      if (!grid || !data.tools || data.tools.length === 0) return
      grid.innerHTML = data.tools.map((tool, i) => {
        const href = tool.external ? tool.file : `/unimed/${tool.file}`
        return `
        <div class="tool-card${i === 0 ? ' featured' : ''}">
          <div class="tool-title">${tool.title}</div>
          <a data-direct href="${href}" class="tool-link">Acessar</a>
        </div>
      `}).join('')
    })
    .catch(() => {
      // Fallback: manter o texto de carregamento ou mostrar erro
      const grid = document.getElementById('tools-grid-unimed')
      if (grid) grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Erro ao carregar ferramentas.</div>'
    })
})
</script>
