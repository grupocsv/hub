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

<style>
.VPPage { padding: 0 !important; }

.unimed-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 48px;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 50px 20px;
  background: linear-gradient(135deg, rgba(0,153,93,0.04) 0%, rgba(0,153,93,0.02) 100%);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  margin-bottom: 40px;
  border: 1px solid rgba(0,153,93,0.12);
}
.dark .page-header { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.page-header .logo { width: 280px; max-width: 90%; height: auto; margin: 0 auto; display: block; }
.page-header .logo-link { display: block; margin: 0 auto 20px; line-height: 0; transition: transform 0.3s; }
.page-header .logo-link:hover { transform: scale(1.05); }

.page-header .eyebrow { display: block; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6f8f14; margin: 0 auto 10px; text-align: center; }
.dark .page-header .eyebrow { color: #a8d15a; }
.page-header h1 { color: #00995d; font-size: 36px; font-weight: 700; margin: 0 0 12px; border: none; letter-spacing: -0.3px; text-align: center; }
.dark .page-header h1 { color: #3dcc8e; }
.page-header .subtitle { color: var(--vp-c-text-2); font-size: 16px; margin: 0; text-align: center; }
.documents-entry {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: min(100%, 360px);
  margin-top: 24px;
  padding: 12px 14px;
  border-radius: 12px;
  color: #ffffff !important;
  background: #0f2b46;
  border: 1px solid #244c6c;
  border-left: 4px solid #2DBF7F;
  box-shadow: 0 12px 28px rgba(15,43,70,0.18);
  text-align: left;
  text-decoration: none !important;
  transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
}
.documents-entry:hover {
  background: #163b5b;
  box-shadow: 0 16px 34px rgba(15,43,70,0.26);
  transform: translateY(-2px);
}
.documents-entry:focus-visible { outline: 3px solid rgba(45,191,127,0.36); outline-offset: 3px; }
.documents-entry__icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 10px;
  color: #dff9ec;
  background: rgba(45,191,127,0.14);
  border: 1px solid rgba(124,224,178,0.24);
}
.documents-entry__icon svg { width: 21px; height: 21px; }
.documents-entry__copy { flex: 1; }
.documents-entry__title { display: block; font-size: 0.92rem; font-weight: 750; line-height: 1.2; }
.documents-entry__hint { display: block; margin-top: 3px; color: rgba(255,255,255,0.67); font-size: 0.72rem; line-height: 1.3; }
.documents-entry__arrow { font-size: 1.15rem; opacity: .68; }

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
}

.tool-card {
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
.dark .tool-card { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.tool-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00995d, #8baf1f);
}
.tool-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }

.tool-card.featured::after {
  content: 'NOVO';
  position: absolute;
  top: 14px; right: 14px;
  background: #8baf1f;
  color: white;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.tool-card .tool-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(0,153,93,0.1); color: #00995d; margin-bottom: 16px; flex-shrink: 0; }
.dark .tool-card .tool-icon { background: rgba(61,204,142,0.14); color: #3dcc8e; }
.tool-card .tool-icon svg { width: 22px; height: 22px; }

.tool-title { color: #1a2b3c; font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; line-height: 1.35; flex-grow: 1; }
.dark .tool-card .tool-title { color: var(--vp-c-text-1); }

.tool-meta { display: block; color: var(--vp-c-text-2); font-size: 12.5px; font-weight: 500; margin: 0 0 18px; }

.tool-link {
  display: block;
  width: 100%;
  padding: 11px 0;
  background: #00995d;
  color: white !important;
  text-decoration: none !important;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  text-align: center;
  transition: filter .2s ease, transform .2s ease, box-shadow .2s ease;
}
.tool-link:hover { filter: brightness(1.12); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,153,93,0.3); }

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

@media (max-width: 768px) {
  .tools-grid { grid-template-columns: 1fr; }
  .page-header { padding: 30px 16px; }
  .page-header h1 { font-size: 28px; }
  .page-header .logo { width: 220px; max-width: 100%; }
  .page-header .subtitle { font-size: 14px; }
  .documents-entry { width: min(100%, 360px); min-width: 0; }
}
</style>

<div class="unimed-page">
  <div class="page-header">
    <a href="https://www.unimed.coop.br/site/web/governadorvaladares" target="_blank" class="logo-link">
      <img src="/img/prZGWXK.png" alt="Unimed Governador Valadares" class="logo">
    </a>
    <p class="eyebrow">Hub de Ferramentas Profissionais</p>
    <h1>Hub Unimed Governador Valadares</h1>
    <p class="subtitle">Operadora de Planos de Saúde</p>
    <a href="/documentos/?portal=unimed" class="documents-entry" target="_self">
      <span class="documents-entry__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M8 10h8M8 13h6"/></svg></span>
      <span class="documents-entry__copy"><strong class="documents-entry__title">Central de Documentos</strong><span class="documents-entry__hint">Acesse o acervo institucional da Unimed GV</span></span>
      <span class="documents-entry__arrow" aria-hidden="true">→</span>
    </a>
  </div>

  <div id="tools-grid-unimed" class="tools-grid">
    <div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Carregando ferramentas...</div>
  </div>

  <div style="text-align:center; margin-bottom:30px;"><a href="https://hub.grupocsv.com" style="display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:10px; background:#00995d; color:white; text-decoration:none; font-weight:600; font-size:0.9rem; transition:all 0.2s;">← Voltar ao Hub</a></div>
  <div class="page-foot">
    <img class="foot-logo theme-logo--light" src="https://assets.grupocsv.com/logos/axiacare/horizontal-positivo.svg" alt="AxiaCare">
    <img class="foot-logo theme-logo--dark" src="https://assets.grupocsv.com/logos/axiacare/horizontal-negativo.svg" alt="AxiaCare">
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
  const ICONS = {
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"/><path d="M9 12l2 2 4-4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    bars: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'
  }
  function pickIcon(title) {
    const t = title.toLowerCase()
    if (t.includes('tea') || t.includes('psicolog') || t.includes('autis')) return ICONS.activity
    if (t.includes('pediatr')) return ICONS.smile
    if (t.includes('gce') || t.includes('gerenciamento')) return ICONS.clipboard
    if (t.includes('vivapleno') || t.includes('idoso')) return ICONS.heart
    if (t.includes('drg') || t.includes('analytics')) return ICONS.bars
    if (t.includes('coorden') || t.includes('cuidado')) return ICONS.shield
    return ICONS.grid
  }
  function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d)) return ''
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  fetch('/unimed/tools.json')
    .then(r => r.json())
    .then(data => {
      const grid = document.getElementById('tools-grid-unimed')
      if (!grid) return
      const tools = (data.tools || []).filter(tool =>
        tool.managedBy !== 'hub-documentos' &&
        !(typeof tool.file === 'string' && tool.file.startsWith('/documentos/'))
      )
      if (tools.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Nenhuma ferramenta disponível.</div>'
        return
      }
      grid.innerHTML = tools.map(tool => {
        const href = tool.external ? tool.file : `/unimed/${tool.file}`
        const updated = formatDate(tool.lastModified)
        return `
        <div class="tool-card${tool.featured === true ? ' featured' : ''}">
          <div class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pickIcon(tool.title)}</svg></div>
          <div class="tool-title">${tool.title}</div>
          ${updated ? `<span class="tool-meta">Atualizado em ${updated}</span>` : '<span class="tool-meta">&nbsp;</span>'}
          <a target="_self" href="${href}" class="tool-link">Acessar</a>
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
