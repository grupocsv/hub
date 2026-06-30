---
layout: page
title: Guilherme Thomé
head:
  - - meta
    - property: og:title
      content: "Guilherme Thomé | Fundador do Grupo CSV"
  - - meta
    - property: og:description
      content: "Médico executivo e consultor em saúde. Fundador do Grupo CSV — AxiaCare®, MedValor®, TheraTech®."
  - - meta
    - property: og:image
      content: "https://hub.grupocsv.com/og/og_founder.png"
  - - meta
    - property: og:url
      content: "https://hub.grupocsv.com/founder/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:image
      content: "https://hub.grupocsv.com/og/og_founder.png"
---

<style scoped>
.VPPage { padding: 0 !important; }

.founder-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background:
    radial-gradient(1400px 600px at -10% -20%, #e8f0f6 0%, transparent 60%),
    radial-gradient(1200px 500px at 110% 0%, #ebf7f1 0%, transparent 60%),
    #F6F4EF;
  min-height: calc(100vh - 64px);
}
.dark .founder-page { background: var(--vp-c-bg); }

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

.profile-img {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(25,99,150,.15);
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(13,38,76,.12);
}

.hero-text h1 {
  margin: 0 0 6px;
  font-size: clamp(1.6rem, 2.3vw + 1rem, 2rem);
  color: #196396;
  border: none;
}
.dark .hero-text h1 { color: #5da9e0; }
.hero-text .role { font-size: 0.95rem; color: #2d3445; margin: 0 0 4px; font-weight: 500; }
.dark .hero-text .role { color: var(--vp-c-text-1); }
.hero-text .subtitle { font-size: 0.92rem; margin-top: 10px; line-height: 1.6; color: #5b6470; }

.section-title {
  margin: 0 0 12px;
  color: #2d3445;
  font-size: clamp(1.15rem, 1.1vw + 0.9rem, 1.35rem);
  border: none;
}
.dark .section-title { color: var(--vp-c-text-1); }
.section-desc { color: #5b6470; font-size: 0.92rem; margin-bottom: 16px; line-height: 1.6; }

.links-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}
@media (min-width: 760px) { .links-grid { grid-template-columns: 1fr 1fr 1fr; } }

.link-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #f0f6fb, #e8f0f6);
  border: 1px solid rgba(25,99,150,.08);
  border-radius: 14px;
  text-decoration: none !important;
  color: #2d3445 !important;
  transition: transform .18s ease, box-shadow .18s ease;
}
.link-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(25,99,150,.12); }
.dark .link-card { background: linear-gradient(180deg, #1e2a3a, #1a2530); border-color: var(--vp-c-divider); color: var(--vp-c-text-1) !important; }

.link-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(25,99,150,.08);
  border-radius: 10px;
  flex-shrink: 0;
  color: #196396;
}
.dark .link-icon { background: rgba(93,169,224,.12); color: #5da9e0; }

.link-info { text-align: left; }
.link-name { font-weight: 600; font-size: 0.9rem; }
.link-desc { font-size: 0.78rem; color: #5b6470; margin-top: 2px; }

.contact-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}
@media (min-width: 760px) { .contact-grid { grid-template-columns: 1fr 1fr 1fr; } }

.contact-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: #f0f6fb;
  border-radius: 12px;
  border: 1px solid rgba(25,99,150,.06);
}
.dark .contact-item { background: var(--vp-c-bg-alt); border-color: var(--vp-c-divider); }

.c-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(25,99,150,.08);
  border-radius: 8px;
  flex-shrink: 0;
  color: #196396;
}
.dark .c-icon { background: rgba(93,169,224,.12); color: #5da9e0; }

.c-info { display: flex; flex-direction: column; gap: 2px; }
.c-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #196396; font-weight: 600; }
.dark .c-label { color: #5da9e0; }
.c-value a { color: #2d3445; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
.c-value a:hover { text-decoration: underline; color: #196396; }
.dark .c-value a { color: var(--vp-c-text-1); }

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

<div class="founder-page">
  <div class="frame hero-section">
    <img src="/visual-identity/guilherme-thome/avatar/guilherme-thome_avatar_current.png" alt="Guilherme Thomé" class="profile-img">
    <div class="hero-text">
      <h1>Guilherme Thomé</h1>
      <p class="role">Médico Executivo e Consultor em Saúde</p>
      <p class="subtitle">
        Atuo na interseção entre estratégia, governança clínica e inovação.
        Superintendente Médico da Unimed Governador Valadares e da Unihealth GV (ICDS).
        Fundador do Grupo CSV — AxiaCare®, MedValor® e TheraTech®.
      </p>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Links</h2>
    <div class="links-grid">
      <a href="https://hub.guithome.com.br/cv.html" class="link-card" target="_blank">
        <div class="link-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
        <div class="link-info"><div class="link-name">Currículo Digital</div><div class="link-desc">CV interativo completo</div></div>
      </a>
      <a href="https://www.linkedin.com/in/gui-thome" class="link-card" target="_blank">
        <div class="link-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
        <div class="link-info"><div class="link-name">LinkedIn</div><div class="link-desc">Perfil profissional</div></div>
      </a>
      <a href="https://guithome.com.br" class="link-card" target="_blank">
        <div class="link-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
        <div class="link-info"><div class="link-name">Site Oficial</div><div class="link-desc">guithome.com.br</div></div>
      </a>
      <a href="https://blog.guithome.com.br" class="link-card" target="_blank">
        <div class="link-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
        <div class="link-info"><div class="link-name">Blog</div><div class="link-desc">Artigos e reflexões</div></div>
      </a>
      <a href="https://link.guithome.com.br" class="link-card" target="_blank">
        <div class="link-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
        <div class="link-info"><div class="link-name">Links</div><div class="link-desc">Todos os links</div></div>
      </a>
      <a href="https://hub.guithome.com.br/privacidade.html" class="link-card" target="_blank">
        <div class="link-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
        <div class="link-info"><div class="link-name">Privacidade</div><div class="link-desc">Política @guithome</div></div>
      </a>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Contato</h2>
    <div class="contact-grid">
      <div class="contact-item">
        <div class="c-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
        <div class="c-info">
          <span class="c-label">B2B</span>
          <div class="c-value"><a href="mailto:guilherme@grupocsv.com">guilherme@grupocsv.com</a></div>
        </div>
      </div>
      <div class="contact-item">
        <div class="c-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
        <div class="c-info">
          <span class="c-label">B2C</span>
          <div class="c-value"><a href="mailto:guilherme@guithome.com.br">guilherme@guithome.com.br</a></div>
        </div>
      </div>
      <div class="contact-item">
        <div class="c-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
        <div class="c-info">
          <span class="c-label">Telefone</span>
          <div class="c-value"><a href="tel:+5533999399959">+55 33 9 9939 9959</a></div>
        </div>
      </div>
    </div>
  </div>

  <div style="text-align:center; margin-bottom:24px;">
    <a href="/" class="back-link" target="_self">← Voltar ao Hub</a>
  </div>

  <div class="page-footer">
    <strong>Guilherme Thomé — Fundador Grupo CSV</strong>
    <div class="small">© 2026 Grupo CSV. Cuidados em Saúde com Valor. Todos os direitos reservados.</div>
  </div>
</div>
