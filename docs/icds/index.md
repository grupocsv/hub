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

<style>
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

.icds-header .logo-link {
  width: min(100%, 320px);
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  transition: transform 0.3s;
}
.icds-header .logo-link:hover { transform: scale(1.05); }
.icds-header .logo {
  width: 280px;
  max-width: 100%;
  height: auto;
  margin: 0;
  display: block;
  object-fit: contain;
  object-position: center;
}
.icds-header .logo--dark { display: none; }
.dark .icds-header .logo--light { display: none; }
.dark .icds-header .logo--dark { display: block; }

.icds-header .eyebrow { display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2a6496; margin-bottom: 10px; }
.dark .icds-header .eyebrow { color: #5da9e0; }
.icds-header h1 { color: #1B3A5C; font-size: 36px; font-weight: 700; margin: 0 0 12px; border: none; letter-spacing: -0.3px; }
.dark .icds-header h1 { color: #5da9e0; }
.icds-header .subtitle { color: var(--vp-c-text-2); font-size: 16px; }
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

.icds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
}

.icds-card {
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
.dark .icds-card { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.icds-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #1B3A5C, #2a6496);
}
.icds-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }

.icds-card .icds-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(27,58,92,0.08); color: #1B3A5C; margin-bottom: 16px; flex-shrink: 0; }
.dark .icds-card .icds-icon { background: rgba(93,169,224,0.14); color: #5da9e0; }
.icds-card .icds-icon svg { width: 22px; height: 22px; }

.icds-title { color: #1a2b3c; font-size: 1.05rem; font-weight: 700; margin-bottom: 6px; line-height: 1.35; flex-grow: 1; }
.dark .icds-card .icds-title { color: var(--vp-c-text-1); }

.icds-date { color: var(--vp-c-text-2); font-size: 12.5px; font-weight: 500; margin: 0 0 18px; display: block; }

.icds-link {
  display: block;
  width: 100%;
  padding: 11px 0;
  background: #1B3A5C;
  color: white !important;
  text-decoration: none !important;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  text-align: center;
  transition: filter .2s ease, transform .2s ease, box-shadow .2s ease;
}
.icds-link:hover { filter: brightness(1.12); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(27,58,92,0.3); }

.icds-link.disabled { background: #94a3b8; opacity: 0.7; cursor: not-allowed; }
.icds-link.disabled:hover { background: #94a3b8; filter: none; transform: none; box-shadow: none; }

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

@media (max-width: 768px) { .icds-grid { grid-template-columns: 1fr; } .icds-header h1 { font-size: 28px; } .icds-header .logo-link { width: min(100%, 260px); } .icds-header .logo { width: 220px; } }
</style>

<div class="icds-page">
  <div class="icds-header">
    <a href="https://icds.org.br/" target="_blank" rel="noopener noreferrer" class="logo-link" aria-label="Acessar o site do ICDS">
      <img src="https://assets.grupocsv.com/logos/icds/horizontal-positivo.png" alt="" class="logo logo--light" width="500" height="178" loading="eager" fetchpriority="high" aria-hidden="true">
      <img src="https://assets.grupocsv.com/logos/icds/horizontal-negativo.png" alt="" class="logo logo--dark" width="600" height="214" loading="eager" fetchpriority="high" aria-hidden="true">
    </a>
    <p class="eyebrow">Hub de Ferramentas Profissionais</p>
    <h1>Hub ICDS</h1>
    <p class="subtitle">Entidade Filantrópica e Gestora Assistencial</p>
    <a href="/documentos/?portal=icds" class="documents-entry" target="_self">
      <span class="documents-entry__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M8 10h8M8 13h6"/></svg></span>
      <span class="documents-entry__copy"><strong class="documents-entry__title">Central de Documentos</strong><span class="documents-entry__hint">Acesse o acervo institucional do ICDS</span></span>
      <span class="documents-entry__arrow" aria-hidden="true">→</span>
    </a>
  </div>

  <div id="tools-grid-icds" class="icds-grid">
    <div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Carregando ferramentas...</div>
  </div>

  <div style="text-align:center; margin-bottom:30px;"><a href="https://hub.grupocsv.com" style="display:inline-flex; align-items:center; gap:8px; padding:10px 24px; border-radius:10px; background:#1B3A5C; color:white; text-decoration:none; font-weight:600; font-size:0.9rem; transition:all 0.2s;">← Voltar ao Hub</a></div>
  <div class="icds-foot">
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
  if (!document.querySelector('script[data-portal="icds"]')) {
    const s = document.createElement('script')
    s.src = '/scripts/hub-auth.js'
    s.setAttribute('data-portal', 'icds')
    document.body.appendChild(s)
  }

  const ICONS = {
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    presentation: '<path d="M2 3h20"/><path d="M3 3v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V3"/><path d="m8 21 4-4 4 4"/><line x1="12" y1="15" x2="12" y2="17"/>',
    dataset: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    bars: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'
  }
  function pickIcon(title) {
    const t = title.toLowerCase()
    if (t.includes('documento')) return ICONS.doc
    if (t.includes('apresenta') || t.includes('slide') || t.includes('gerador')) return ICONS.presentation
    if (t.includes('data set') || t.includes('dataset') || t.includes('indicador') || t.includes('tea')) return ICONS.dataset
    if (t.includes('análise') || t.includes('analise') || t.includes('analytics')) return ICONS.bars
    return ICONS.grid
  }
  function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d)) return ''
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  fetch('/icds/tools.json')
    .then(r => r.json())
    .then(data => {
      const grid = document.getElementById('tools-grid-icds')
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
        const href = tool.external ? tool.file : `/icds/${tool.file}`
        const updated = formatDate(tool.lastModified)
        return `
        <div class="icds-card">
          <div class="icds-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${pickIcon(tool.title)}</svg></div>
          <div class="icds-title">${tool.title}</div>
          ${updated ? `<span class="icds-date">Atualizado em ${updated}</span>` : '<span class="icds-date">&nbsp;</span>'}
          <a target="_self" href="${href}" class="icds-link">Acessar</a>
        </div>
      `}).join('')
    })
    .catch(() => {
      const grid = document.getElementById('tools-grid-icds')
      if (grid) grid.innerHTML = '<div style="text-align:center; padding:40px; color:var(--vp-c-text-2);">Erro ao carregar ferramentas.</div>'
    })
})
</script>
