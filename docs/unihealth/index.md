---
layout: page
title: Unihealth Governador Valadares - Hub de Ferramentas
head:
  - - meta
    - property: og:title
      content: "Unihealth Governador Valadares | Hub de Ferramentas"
  - - meta
    - property: og:description
      content: "Dashboards, ferramentas e entregáveis desenvolvidos para o Hospital Unihealth GV. Parceiro Grupo CSV."
  - - meta
    - property: og:image
      content: "https://hub.grupocsv.com/og/og_unihealth.png"
  - - meta
    - property: og:url
      content: "https://hub.grupocsv.com/unihealth/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:image
      content: "https://hub.grupocsv.com/og/og_unihealth.png"
---

<style>
.VPPage { padding: 0 !important; }

.uh-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 48px;
  min-height: calc(100vh - 64px);
}

.uh-header {
  text-align: center;
  padding: 50px 20px;
  background: linear-gradient(135deg, rgba(1,61,25,0.04) 0%, rgba(1,61,25,0.02) 100%);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  margin-bottom: 40px;
  border: 1px solid rgba(1,61,25,0.12);
}
.dark .uh-header { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.uh-header .logo { width: 280px; max-width: 90%; margin: 0 auto 20px; display: block; }
.uh-header .logo-link { display: inline-block; transition: transform 0.3s; }
.uh-header .logo-link:hover { transform: scale(1.05); }

.uh-header .eyebrow { display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c85c00; margin-bottom: 10px; }
.dark .uh-header .eyebrow { color: #f0894a; }
.uh-header h1 { color: #013d19; font-size: 36px; font-weight: 700; margin: 0 0 12px; border: none; letter-spacing: -0.3px; }
.dark .uh-header h1 { color: #3dcc8e; }
.uh-header .subtitle { color: var(--vp-c-text-2); font-size: 16px; }

.uh-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
}

.uh-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0,78,76,0.04), 0 6px 24px rgba(0,78,76,0.06);
  transition: transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms cubic-bezier(.2,.8,.2,1);
  border: 1px solid rgba(0,0,0,0.06);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.dark .uh-card { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.uh-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #013d19, #ec7106);
}
.uh-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }

.uh-card .uh-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(1,61,25,0.08); color: #013d19; margin-bottom: 16px; flex-shrink: 0; }
.dark .uh-card .uh-icon { background: rgba(61,204,142,0.14); color: #3dcc8e; }
.uh-card .uh-icon svg { width: 22px; height: 22px; }

.uh-title { color: #1a2b3c; font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; line-height: 1.35; flex-grow: 1; }
.dark .uh-card .uh-title { color: var(--vp-c-text-1); }

.uh-date { color: var(--vp-c-text-2); font-size: 12.5px; font-weight: 500; margin: 0 0 18px; display: block; }

.uh-link {
  display: block;
  width: 100%;
  padding: 11px 0;
  background: #013d19;
  color: white !important;
  text-decoration: none !important;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  text-align: center;
  transition: filter .2s ease, transform .2s ease, box-shadow .2s ease;
}
.uh-link:hover { filter: brightness(1.12); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(1,61,25,0.3); }

.uh-link.disabled { background: #94a3b8; opacity: 0.7; cursor: not-allowed; }
.uh-link.disabled:hover { background: #94a3b8; filter: none; transform: none; box-shadow: none; }

.uh-foot {
  padding: 32px 20px;
  background: #f8f5f0;
  text-align: center;
  border-top: 2px solid #006b68;
  border-radius: 16px;
}
.dark .uh-foot { background: var(--vp-c-bg-soft); border-color: #3dcc8e; }
.uh-foot .foot-logo { width: 140px; margin: 0 auto 12px; display: block; }
.uh-foot .foot-slogan { font-size: 14px; font-weight: 600; color: #2d3445; margin: 8px 0 20px; letter-spacing: 0.01em; }
.dark .uh-foot .foot-slogan { color: var(--vp-c-text-1); }
.uh-foot .foot-links { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 8px; line-height: 1.6; }
.uh-foot .foot-links a { color: #196396; text-decoration: none; transition: color 0.2s; }
.dark .uh-foot .foot-links a { color: #5da9e0; }
.uh-foot .foot-links a:hover { text-decoration: underline; color: #0f2b46; }
.dark .uh-foot .foot-links a:hover { color: #8ec8f0; }
.uh-foot .sep { color: #cbd5e1; margin: 0 3px; font-size: 11px; }
.uh-foot .copyright { margin-top: 20px; font-size: 11px; color: #94a3b8; letter-spacing: 0.01em; }
@media (max-width: 480px) {
  .uh-foot { padding: 24px 16px; }
  .uh-foot .foot-logo { width: 120px; }
  .uh-foot .foot-slogan { font-size: 13px; }
  .uh-foot .foot-links { font-size: 12px; gap: 4px; }
}

@media (max-width: 768px) { .uh-grid { grid-template-columns: 1fr; } .uh-header h1 { font-size: 28px; } .uh-header .logo { width: 220px; } }
</style>

<div class="uh-page">
  <div class="uh-header">
    <a href="https://icds.org.br/hospital-unimed-governador-valadares/" target="_blank" class="logo-link">
      <img src="/img/ac2rphe.png" alt="Unihealth Logo" class="logo">
    </a>
    <p class="eyebrow">Hub de Ferramentas Profissionais</p>
    <h1>Hub Unihealth Governador Valadares</h1>
    <p class="subtitle">Hospital de Média/Alta Complexidade</p>
  </div>

  <div id="tools-grid-unihealth" class="uh-grid">
    <div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Carregando ferramentas...</div>
  </div>

  <div style="text-align:center; margin-bottom:30px;"><a href="https://hub.grupocsv.com" style="display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:10px; background:#013d19; color:white; text-decoration:none; font-weight:600; font-size:0.9rem; transition:all 0.2s;">← Voltar ao Hub</a></div>
  <div class="uh-foot">
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
  if (!document.querySelector('script[data-portal="unihealth"]')) {
    const s = document.createElement('script')
    s.src = '/scripts/hub-auth.js'
    s.setAttribute('data-portal', 'unihealth')
    document.body.appendChild(s)
  }

  const ICONS = {
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    package: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    currency: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    bars: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'
  }
  function pickIcon(title) {
    const t = title.toLowerCase()
    if (t.includes('plant') || t.includes('variabilidade')) return ICONS.clock
    if (t.includes('opme') || t.includes('fluxo')) return ICONS.package
    if (t.includes('repasse')) return ICONS.currency
    if (t.includes('correla') || t.includes('análise') || t.includes('analise')) return ICONS.bars
    return ICONS.grid
  }
  function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d)) return ''
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  fetch('/unihealth/tools.json')
    .then(r => r.json())
    .then(data => {
      const grid = document.getElementById('tools-grid-unihealth')
      if (!grid || !data.tools || data.tools.length === 0) return
      grid.innerHTML = data.tools.map(tool => {
        const href = tool.external ? tool.file : `/unihealth/${tool.file}`
        const updated = formatDate(tool.lastModified)
        return `
        <div class="uh-card">
          <div class="uh-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pickIcon(tool.title)}</svg></div>
          <div class="uh-title">${tool.title}</div>
          ${updated ? `<span class="uh-date">Atualizado em ${updated}</span>` : '<span class="uh-date">&nbsp;</span>'}
          <a target="_self" href="${href}" class="uh-link">Acessar</a>
        </div>
      `}).join('')
    })
    .catch(() => {
      const grid = document.getElementById('tools-grid-unihealth')
      if (grid) grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Erro ao carregar ferramentas.</div>'
    })
})
</script>
