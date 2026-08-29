---
layout: page
title: Hub Grupo CSV
head:
  - - meta
    - property: og:title
      content: "Hub Grupo CSV | Cuidados em Saúde com Valor"
  - - meta
    - property: og:description
      content: "Portal central do ecossistema Grupo CSV — AxiaCare®, MedValor®, Thera®"
  - - meta
    - property: og:image
      content: "https://hub.grupocsv.com/og/og_hub.png"
  - - meta
    - property: og:url
      content: "https://hub.grupocsv.com/"
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:image:width
      content: "1200"
  - - meta
    - property: og:image:height
      content: "630"
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:image
      content: "https://hub.grupocsv.com/og/og_hub.png"
---

<style>
.VPPage { padding: 0 !important; }

/* ── Hero ── */
.hub-hero {
  background: linear-gradient(135deg, #0f2b46 0%, #196396 40%, #2DBF7F 100%);
  padding: 96px 24px 72px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;
}
.hub-hero::before {
  content: '';
  position: absolute;
  top: -60%; left: -20%;
  width: 140%; height: 200%;
  background: radial-gradient(ellipse at 30% 20%, rgba(45,191,127,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 80%, rgba(25,99,150,0.2) 0%, transparent 50%);
  pointer-events: none;
}
.hub-hero .inner { position: relative; max-width: 1180px; margin: 0 auto; }
.hub-hero .logo { width: 140px; margin-bottom: 24px; filter: drop-shadow(0 4px 20px rgba(0,0,0,0.3)); }
.hub-hero h1 { font-size: clamp(2.2rem, 4.5vw, 3.2rem); font-weight: 800; margin: 0 0 0; border: none; color: white; letter-spacing: -1px; }
.hub-hero .hero-rule {
  width: 48px;
  height: 2px;
  background: rgba(255,255,255,0.4);
  margin: 16px auto 14px;
  border: none;
}
.hub-hero .tagline {
  font-size: clamp(1rem, 2vw, 1.25rem);
  opacity: 0.85;
  margin: 0 0 36px;
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.hub-hero .hero-subhead {
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  font-weight: 600;
  color: rgba(255,255,255,0.95);
  margin: 0;
  letter-spacing: 0.005em;
}
.hub-hero .hero-actions { display: flex; flex-direction: column; align-items: center; gap: 20px; }
.hub-hero .hero-btn {
  padding: 12px 28px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.2s;
}
.hub-hero .hero-btn.primary { background: white; color: #196396; }
.hub-hero .hero-btn.primary:hover { background: #e8f4fc; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.hub-hero .hero-btn.secondary { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); }
.hub-hero .hero-btn.secondary:hover { background: rgba(255,255,255,0.25); transform: translateY(-2px); }
.documents-gateway {
  width: 100%;
  max-width: 680px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 14px 13px 16px;
  border: 1px solid rgba(255,255,255,0.28);
  border-left: 4px solid #7ce0b2;
  border-radius: 14px;
  background: rgba(9,30,48,0.64);
  box-shadow: 0 14px 36px rgba(4,20,34,0.22);
  text-align: left;
  backdrop-filter: blur(10px);
}
.documents-gateway__icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 11px;
  color: #dff9ec;
  background: rgba(124,224,178,0.14);
  border: 1px solid rgba(124,224,178,0.28);
}
.documents-gateway__icon svg { width: 22px; height: 22px; }
.documents-gateway__copy {
  flex: 1 1 auto;
  min-width: 220px;
}
.documents-gateway__title {
  display: block;
  color: white;
  font-size: 0.96rem;
  font-weight: 750;
  letter-spacing: -0.01em;
}
.documents-gateway__hint {
  display: block;
  margin-top: 2px;
  color: rgba(255,255,255,0.68);
  font-size: 0.72rem;
  line-height: 1.35;
}
.documents-gateway__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 164px;
  min-height: 38px;
  margin-left: auto;
  padding: 8px 12px;
  border-radius: 9px;
  color: white !important;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  font-size: 0.76rem;
  font-weight: 650;
  text-decoration: none !important;
  transition: background .2s ease, border-color .2s ease, transform .2s ease;
}
.documents-gateway__link:hover {
  background: rgba(124,224,178,0.18);
  border-color: rgba(124,224,178,0.5);
  transform: translateY(-1px);
}
.documents-gateway__link--primary {
  color: #092238 !important;
  background: #7ce0b2;
  border-color: #a7efd0;
}
.documents-gateway__link--primary:hover {
  background: #9be9c5;
  border-color: #d3f8e7;
}
.documents-gateway__link:focus-visible {
  outline: 3px solid rgba(255,255,255,0.78);
  outline-offset: 2px;
}
.hub-hero .hero-groups {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  justify-content: center;
  width: 100%;
}
.hub-hero .hero-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.hub-hero .hero-group.products {
  width: 100%;
  max-width: 920px;
}
.hub-hero .hero-group.governance {
  width: 100%;
  max-width: 620px;
}
.hub-hero .hero-group-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.55;
  font-weight: 500;
}
.hub-hero .hero-group-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.hub-hero .hero-group-btns.products {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}
.hub-hero .hero-group-btns.products .hero-btn {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 56px;
  padding: 12px 16px;
  text-align: center;
}
.hub-hero .hero-group-btns.governance {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}
.hub-hero .hero-group-divider {
  display: none;
}
.hub-hero .hero-btn.admin {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.7);
  border: 1px dashed rgba(255,255,255,0.35);
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  gap: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.hub-hero .hero-btn.admin:hover {
  background: rgba(255,255,255,0.18);
  color: white;
  border-color: rgba(255,255,255,0.5);
  transform: translateY(-2px);
}
.hub-hero .hero-btn.admin svg {
  width: 13px;
  height: 13px;
  opacity: 0.7;
}

/* ── Layout ── */
.hub-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 60px;
  background:
    radial-gradient(1400px 600px at -10% -20%, #e8f0f6 0%, transparent 60%),
    radial-gradient(1200px 500px at 110% 0%, #ebf7f1 0%, transparent 60%),
    #F6F4EF;
}
.dark .hub-body { background: var(--vp-c-bg); }

.section { padding: 48px 0 0; }
.section-header { margin-bottom: 24px; }
.section-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 6px; color: #1a2b3c; border: none; }
.dark .section-title { color: var(--vp-c-text-1); }
.section-desc { color: #5b6470; font-size: 0.95rem; margin: 0; }

.divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent); margin: 48px 0 0; }
.dark .divider { background: linear-gradient(90deg, transparent, var(--vp-c-divider), transparent); }

/* ── Empresas Grid ── */
.empresas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
@media (max-width: 768px) { .empresas-grid { grid-template-columns: 1fr; } }

.empresa-card {
  background: white;
  border-radius: 16px;
  padding: 28px 24px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.dark .empresa-card { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }
.empresa-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }
.empresa-card .top-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
.empresa-card .card-logo { height: 64px; max-width: 220px; margin-bottom: 20px; object-fit: contain; }
.empresa-card .card-desc { font-size: 0.88rem; color: #5b6470; line-height: 1.5; margin: 0; flex-grow: 1; }

/* ── Partner Sections ── */
.partner-section {
  background: white;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 8px 32px rgba(0,0,0,0.06);
  overflow: hidden;
  margin-bottom: 24px;
}
.dark .partner-section { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.partner-header {
  padding: 28px 28px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}
.partner-header:hover { background: rgba(0,0,0,0.015); }
.dark .partner-header:hover { background: rgba(255,255,255,0.03); }
.dark .partner-header { border-color: var(--vp-c-divider); }
.partner-header .p-logo-link { display: inline-flex; align-items: center; text-decoration: none; transition: transform 0.2s; flex-shrink: 0; }
.partner-header .p-logo-link:hover { transform: scale(1.05); }
.partner-header .p-portal-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  color: #196396;
  background: rgba(25,99,150,0.07);
  border: 1px solid rgba(25,99,150,0.15);
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.partner-header .p-portal-btn:hover {
  background: rgba(25,99,150,0.14);
  border-color: rgba(25,99,150,0.3);
  transform: translateY(-1px);
}
.partner-header .p-portal-btn svg {
  width: 13px;
  height: 13px;
}
.partner-header .p-documents-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border-radius: 9px;
  color: #ffffff !important;
  background: #0f2b46;
  border: 1px solid #244c6c;
  box-shadow: inset 3px 0 0 #2DBF7F, 0 4px 12px rgba(15,43,70,0.15);
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none !important;
  white-space: nowrap;
  flex-shrink: 0;
  transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
}
.partner-header .p-documents-btn:hover {
  background: #163b5b;
  box-shadow: inset 3px 0 0 #7ce0b2, 0 7px 18px rgba(15,43,70,0.24);
  transform: translateY(-1px);
}
.partner-header .p-documents-btn:focus-visible {
  outline: 3px solid rgba(45,191,127,0.3);
  outline-offset: 2px;
}
.partner-header .p-documents-btn svg { width: 15px; height: 15px; }
.dark .partner-header .p-documents-btn {
  background: #173b5a;
  border-color: #315a78;
}
.dark .partner-header .p-portal-btn {
  color: #5da9e0;
  background: rgba(93,169,224,0.1);
  border-color: rgba(93,169,224,0.2);
}
.dark .partner-header .p-portal-btn:hover {
  background: rgba(93,169,224,0.18);
  border-color: rgba(93,169,224,0.35);
}
.partner-header .p-logo { height: 52px; object-fit: contain; }
.partner-header .p-info { flex-grow: 1; }
.partner-header .p-name { font-size: 1.2rem; font-weight: 700; margin: 0 0 2px; color: #1a2b3c; }
.dark .partner-header .p-name { color: var(--vp-c-text-1); }
.partner-header .p-sub { font-size: 0.85rem; color: #5b6470; margin: 0; }
.partner-header .p-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  background: rgba(100,116,139,0.07);
  border: 1px solid rgba(100,116,139,0.15);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: inherit;
}
.partner-header .p-toggle:hover {
  background: rgba(100,116,139,0.14);
  border-color: rgba(100,116,139,0.3);
}
.partner-header .p-toggle:focus-visible {
  outline: 3px solid rgba(25,99,150,0.28);
  outline-offset: 2px;
}
.dark .partner-header .p-toggle {
  color: #94a3b8;
  background: rgba(148,163,184,0.1);
  border-color: rgba(148,163,184,0.2);
}
.dark .partner-header .p-toggle:hover {
  background: rgba(148,163,184,0.18);
  border-color: rgba(148,163,184,0.35);
}
.partner-header .p-toggle svg {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
}
.partner-section.collapsed .partner-header .p-toggle svg {
  transform: rotate(-90deg);
}
.partner-header .p-toggle .toggle-label-expand { display: none; }
.partner-header .p-toggle .toggle-label-collapse { display: inline; }
.partner-section.collapsed .partner-header .p-toggle .toggle-label-expand { display: inline; }
.partner-section.collapsed .partner-header .p-toggle .toggle-label-collapse { display: none; }
.partner-section.collapsed .partner-header {
  border-bottom-color: transparent;
}

.partner-tools-wrapper {
  overflow: hidden;
  transition: max-height 0.5s ease, opacity 0.3s ease;
  max-height: 2000px;
  opacity: 1;
}
.partner-section.collapsed .partner-tools-wrapper {
  max-height: 0;
  opacity: 0;
}

.partner-tools {
  padding: 20px 28px 28px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  text-decoration: none !important;
  color: #1a2b3c !important;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  border: 1px solid rgba(0,0,0,0.06);
  background: #fafbfc;
}
.dark .tool-item { background: var(--vp-c-bg-alt); border-color: var(--vp-c-divider); color: var(--vp-c-text-1) !important; }
.tool-item:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
.tool-item .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.tool-item .arrow { margin-left: auto; opacity: 0.4; font-size: 0.85rem; flex-shrink: 0; }
.tool-item.disabled { opacity: 0.45; pointer-events: none; }

/* ── Governance Cards ── */
.gov-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }

.gov-card {
  background: white;
  border-radius: 14px;
  padding: 24px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}
.dark .gov-card { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }
.gov-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.gov-card .gc-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 8px; color: #1a2b3c; }
.dark .gov-card .gc-title { color: var(--vp-c-text-1); }
.gov-card .gc-desc { font-size: 0.88rem; color: #5b6470; line-height: 1.5; margin: 0; }

/* ── Footer Elegante ── */
.hub-footer {
  text-align: center;
  padding: 48px 24px 56px;
  margin-top: 48px;
  border-top: 1px solid rgba(0,0,0,0.06);
  background: linear-gradient(180deg, transparent 0%, rgba(25,99,150,0.03) 100%);
}
.dark .hub-footer {
  border-color: var(--vp-c-divider);
  background: linear-gradient(180deg, transparent 0%, rgba(25,99,150,0.06) 100%);
}
.hub-footer .footer-logos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 20px;
}
.hub-footer .footer-logos img {
  height: 36px !important;
  max-height: 36px !important;
  width: auto !important;
  max-width: 160px !important;
  opacity: 0.55;
  transition: opacity 0.3s;
  filter: grayscale(30%);
  object-fit: contain;
}
.hub-footer .footer-logos a {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
.hub-footer .footer-logos img:hover {
  opacity: 1;
  filter: grayscale(0%);
}
.hub-footer .footer-logos .logo-divider {
  width: 1px;
  height: 20px;
  background: rgba(0,0,0,0.12);
}
.dark .hub-footer .footer-logos .logo-divider {
  background: var(--vp-c-divider);
}
.hub-footer .footer-contacts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  flex-wrap: wrap;
}
.hub-footer .footer-contacts a {
  color: #196396;
  text-decoration: none;
  transition: color 0.2s;
}
.hub-footer .footer-contacts a:hover {
  color: #0f2b46;
  text-decoration: underline;
}
.dark .hub-footer .footer-contacts a { color: #5da9e0; }
.dark .hub-footer .footer-contacts a:hover { color: #8ec8f0; }
.hub-footer .footer-contacts .contact-sep {
  color: rgba(0,0,0,0.2);
  font-size: 0.7rem;
}
.dark .hub-footer .footer-contacts .contact-sep { color: var(--vp-c-divider); }
.hub-footer .footer-copy {
  font-size: 0.78rem;
  color: #94a3b8;
  letter-spacing: 0.02em;
}
.dark .hub-footer .footer-copy { color: var(--vp-c-text-3); }

/* ── Mobile Responsivo ── */
@media (max-width: 768px) {
  /* Hero */
  .hub-hero { padding: 56px 16px 44px; }
  .hub-hero .inner { padding: 0 4px; }
  .hub-hero .logo { width: 96px; margin-bottom: 16px; }
  .hub-hero h1 { font-size: 1.8rem; }
  .hub-hero .hero-rule { width: 36px; margin: 12px auto 10px; }
  .hub-hero .tagline { font-size: 0.78rem; margin-bottom: 24px; letter-spacing: 0.06em; word-wrap: break-word; overflow-wrap: break-word; }
  .hub-hero .hero-actions { gap: 16px; }
  .hub-hero .hero-subhead { font-size: 1rem; }
  .hub-hero .hero-btn { width: 100%; max-width: 280px; text-align: center; padding: 12px 20px; font-size: 0.9rem; }
  .documents-gateway { flex-wrap: wrap; max-width: 360px; padding: 13px; }
  .documents-gateway__copy { flex: 1 1 180px; min-width: 0; }
  .documents-gateway__link { width: 100%; min-width: 0; margin-left: 0; padding: 9px 12px; font-size: 0.74rem; }
  .hub-hero .hero-groups { gap: 20px; }
  .hub-hero .hero-group-divider { display: none; }
  .hub-hero .hero-group-btns { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; max-width: 320px; }
  .hub-hero .hero-group-btns.products { grid-template-columns: 1fr; max-width: 360px; }
  .hub-hero .hero-group-btns.governance { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 360px; }
  .hub-hero .hero-group-btns .hero-btn { width: 100%; text-align: center; max-width: none; padding: 10px 12px; font-size: 0.82rem; }
  .hub-hero .hero-group-btns .hero-btn.admin { grid-column: 1 / -1; max-width: 160px; justify-self: center; }

  /* Body */
  .hub-body { padding: 0 16px 40px; }
  .section { padding: 32px 0 0; }
  .section-title { font-size: 1.3rem; }
  .divider { margin: 32px 0 0; }

  /* Empresas */
  .empresas-grid { grid-template-columns: 1fr; gap: 14px; }
  .empresa-card { padding: 24px 18px; }
  .empresa-card .card-logo { height: 58px; max-width: 200px; margin-bottom: 18px; }

  /* Parceiros */
  .partner-header { padding: 16px; gap: 10px; flex-wrap: wrap; }
  .partner-header .p-logo-link { flex-shrink: 0; }
  .partner-header .p-logo { height: 38px; }
  .partner-header .p-info { flex: 1 1 0; min-width: 120px; }
  .partner-header .p-name { font-size: 1rem; word-wrap: break-word; }
  .partner-header .p-sub { font-size: 0.78rem; }
  .partner-header .p-documents-btn { padding: 7px 11px; font-size: 0.73rem; }
  .partner-header .p-documents-btn svg { width: 13px; height: 13px; }
  .partner-header .p-portal-btn { padding: 7px 12px; font-size: 0.75rem; flex-shrink: 0; }
  .partner-header .p-portal-btn svg { width: 11px; height: 11px; }
  .partner-header .p-toggle { padding: 7px 12px; font-size: 0.75rem; flex-shrink: 0; }
  .partner-header .p-toggle svg { width: 12px; height: 12px; }
  .partner-tools { padding: 14px 14px 18px; grid-template-columns: 1fr; gap: 8px; }
  .tool-item { padding: 12px 14px; font-size: 0.85rem; word-wrap: break-word; overflow-wrap: break-word; }

  /* Governança */
  .gov-grid { grid-template-columns: 1fr; gap: 12px; }
  .gov-card { padding: 20px; }

  /* Footer */
  .hub-footer { padding: 32px 16px 40px; margin-top: 32px; }
  .hub-footer .footer-logos {
    display: grid;
    grid-template-columns: repeat(2, auto);
    gap: 16px 24px;
    justify-content: center;
    justify-items: center;
    align-items: center;
  }
  .hub-footer .footer-logos img {
    height: 28px !important;
    max-height: 28px !important;
    max-width: 120px !important;
  }
  .hub-footer .footer-logos .logo-divider { display: none; }
  .hub-footer .footer-contacts { gap: 10px; font-size: 0.8rem; }
  .hub-footer .footer-copy { font-size: 0.72rem; }
}

@media (max-width: 400px) {
  .hub-hero { padding: 40px 12px 32px; }
  .hub-hero .logo { width: 80px; }
  .hub-hero .hero-btn { max-width: 240px; padding: 10px 16px; font-size: 0.85rem; }
  .hub-body { padding: 0 12px 32px; }
  .partner-tools { padding: 10px 10px 14px; }
  .hub-footer .footer-logos img {
    height: 24px !important;
    max-height: 24px !important;
    max-width: 100px !important;
  }
  .hub-footer .footer-logos { gap: 12px 20px; }
}
</style>

<div class="hub-hero">
  <div class="inner">
    <img src="https://assets.grupocsv.com/logos/grupo-csv/horizontal-negativo-transparente.png" alt="Grupo CSV" class="logo">
    <h1>Hub Grupo CSV</h1>
    <div class="hero-rule"></div>
    <p class="tagline">Cuidados em Saúde com Valor</p>
    <div class="hero-actions">
      <p class="hero-subhead">Dashboards e Ferramentas</p>
      <section class="documents-gateway" aria-labelledby="documents-gateway-title">
        <span class="documents-gateway__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M8 10h8M8 13h6"/></svg>
        </span>
        <span class="documents-gateway__copy">
          <strong class="documents-gateway__title" id="documents-gateway-title">Central de Documentos</strong>
          <span class="documents-gateway__hint">Acesse o acervo institucional do Grupo CSV</span>
        </span>
        <a href="/documentos/?portal=grupo-csv" class="documents-gateway__link documents-gateway__link--primary" target="_self">Acessar Central</a>
      </section>
      <div class="hero-groups">
        <div class="hero-group products" id="produtos-do-grupo">
          <span class="hero-group-label">Produtos do Grupo CSV</span>
          <div class="hero-group-btns products" data-product-catalog="grupo-csv">
            <a href="/compass/" class="hero-btn secondary" data-product-id="compass">Compass™</a>
            <a href="/signal/" class="hero-btn secondary" data-product-id="signal">Signal™</a>
            <a href="https://cmm.grupocsv.com" class="hero-btn secondary" data-product-id="cmm">CMM</a>
            <a href="https://themis.grupocsv.com" class="hero-btn secondary" data-product-id="themis">Themis™</a>
            <a href="https://deck.grupocsv.com" class="hero-btn secondary" data-product-id="deck">Deck™</a>
            <a href="https://relay.axcare.com.br" class="hero-btn secondary" data-product-id="relay">Relay™</a>
            <a href="https://rtav.axcare.app" class="hero-btn secondary" data-product-id="rtav">RTAV™</a>
            <a href="/panta/" class="hero-btn secondary" data-product-id="panta" target="_self">Panta™</a>
            <a href="https://discovery.axcare.app" class="hero-btn secondary" data-product-id="discovery">Discovery™</a>
          </div>
        </div>
        <div class="hero-group-divider"></div>
        <div class="hero-group governance">
          <span class="hero-group-label">Governança</span>
          <div class="hero-group-btns governance">
            <a href="/compliance/" class="hero-btn secondary">Compliance</a>
            <a href="/_infra/" class="hero-btn secondary">Infraestrutura</a>
            <a href="/admin/" class="hero-btn admin" target="_self"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Admin</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="hub-body">

  <!-- ═══ EMPRESAS ═══ -->
  <div class="section">
    <div class="section-header">
      <h2 class="section-title">Empresas do Grupo</h2>
      <p class="section-desc">Três empresas especializadas, cada uma focada em uma dimensão da transformação em saúde.</p>
    </div>
    <div class="empresas-grid">
      <a href="/axia/" class="empresa-card">
        <div class="top-bar" style="background: linear-gradient(90deg, #196396, #2DBF7F);"></div>
        <img src="https://assets.grupocsv.com/logos/axiacare/horizontal-positivo.svg" alt="AxiaCare®" class="card-logo theme-logo--light">
        <img src="https://assets.grupocsv.com/logos/axiacare/horizontal-negativo.svg" alt="AxiaCare®" class="card-logo theme-logo--dark">
        <div class="card-desc">Consultoria estratégica, governança clínica e operações de saúde.</div>
      </a>
      <a href="/medvalor/" class="empresa-card">
        <div class="top-bar" style="background: linear-gradient(90deg, #b5d8be, #f7901e);"></div>
        <img src="https://assets.grupocsv.com/logos/medvalor/horizontal-positivo-laranja.svg" alt="MedValor®" class="card-logo theme-logo--light">
        <img src="https://assets.grupocsv.com/logos/medvalor/horizontal-negativo-verde-laranja.svg" alt="MedValor®" class="card-logo theme-logo--dark">
        <div class="card-desc">Educação executiva e capacitação estratégica para líderes em saúde.</div>
      </a>
      <a href="/thera/" class="empresa-card">
        <div class="top-bar" style="background: linear-gradient(90deg, #6B5B95, #7c3aed);"></div>
        <img src="https://assets.grupocsv.com/logos/thera/horizontal-positivo-roxo.svg" alt="Thera®" class="card-logo theme-logo--light">
        <img src="https://assets.grupocsv.com/logos/thera/horizontal-negativo-roxo.svg" alt="Thera®" class="card-logo theme-logo--dark">
        <div class="card-desc">Desenvolvimento de software, IA e plataformas SaaS para saúde.</div>
      </a>
    </div>
  </div>

  <div class="divider"></div>

  <!-- ═══ PARCEIROS ═══ -->
  <div class="section" id="parceiros">
    <div class="section-header">
      <h2 class="section-title">Instituições Parceiras</h2>
      <p class="section-desc">Dashboards, ferramentas e entregáveis desenvolvidos para nossos parceiros.</p>
    </div>
    <!-- Unimed -->
    <div class="partner-section collapsed" id="partner-unimed">
      <div class="partner-header">
        <a href="/unimed/" class="p-logo-link"><img src="/img/prZGWXK.png" alt="Unimed GV" class="p-logo"></a>
        <div class="p-info">
          <div class="p-name">Unimed Governador Valadares</div>
          <div class="p-sub">Operadora de Planos de Saúde</div>
        </div>
        <a href="/documentos/?portal=unimed" class="p-documents-btn" target="_self"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M8 10h8M8 13h6"/></svg>Central de Documentos</a>
        <button type="button" class="p-toggle" aria-expanded="false" aria-controls="partner-tools-unimed"><span class="toggle-label-expand">Ver ferramentas</span><span class="toggle-label-collapse">Ocultar</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
        <a href="/unimed/" class="p-portal-btn">Acessar portal <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg></a>
      </div>
      <div class="partner-tools-wrapper" id="partner-tools-unimed" aria-hidden="true" inert>
      <div class="partner-tools" id="tools-unimed">
        <span class="tool-item disabled">Carregando ferramentas...</span>
      </div>
      </div>
    </div>
    <!-- Unihealth -->
    <div class="partner-section collapsed" id="partner-unihealth">
      <div class="partner-header">
        <a href="/unihealth/" class="p-logo-link"><img src="/img/ac2rphe.png" alt="Unihealth" class="p-logo"></a>
        <div class="p-info">
          <div class="p-name">Unihealth Governador Valadares</div>
          <div class="p-sub">Hospital de Média/Alta Complexidade</div>
        </div>
        <a href="/documentos/?portal=unihealth" class="p-documents-btn" target="_self"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M8 10h8M8 13h6"/></svg>Central de Documentos</a>
        <button type="button" class="p-toggle" aria-expanded="false" aria-controls="partner-tools-unihealth"><span class="toggle-label-expand">Ver ferramentas</span><span class="toggle-label-collapse">Ocultar</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
        <a href="/unihealth/" class="p-portal-btn">Acessar portal <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg></a>
      </div>
      <div class="partner-tools-wrapper" id="partner-tools-unihealth" aria-hidden="true" inert>
      <div class="partner-tools" id="tools-unihealth">
        <span class="tool-item disabled">Carregando ferramentas...</span>
      </div>
      </div>
    </div>
    <!-- ICDS -->
    <div class="partner-section collapsed" id="partner-icds">
      <div class="partner-header">
        <a href="/icds/" class="p-logo-link"><img src="/visual-identity/icds/logo/png/icds_horizontal_fundo_azul.png" alt="ICDS" class="p-logo" style="border-radius:8px;"></a>
        <div class="p-info">
          <div class="p-name">ICDS</div>
          <div class="p-sub">Entidade Filantrópica e Gestora Assistencial</div>
        </div>
        <a href="/documentos/?portal=icds" class="p-documents-btn" target="_self"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M8 10h8M8 13h6"/></svg>Central de Documentos</a>
        <button type="button" class="p-toggle" aria-expanded="false" aria-controls="partner-tools-icds"><span class="toggle-label-expand">Ver ferramentas</span><span class="toggle-label-collapse">Ocultar</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
        <a href="/icds/" class="p-portal-btn">Acessar portal <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg></a>
      </div>
      <div class="partner-tools-wrapper" id="partner-tools-icds" aria-hidden="true" inert>
      <div class="partner-tools" id="tools-icds">
        <span class="tool-item disabled">Carregando ferramentas...</span>
      </div>
      </div>
    </div>
    <!-- 2iM -->
    <div class="partner-section collapsed" id="partner-2im">
      <div class="partner-header">
        <a href="/2im/" class="p-logo-link"><img src="/2im/assets/2im-logo-card.png" alt="2iM" class="p-logo" style="border-radius:8px;"></a>
        <div class="p-info">
          <div class="p-name">2iM Inteligência Médica</div>
          <div class="p-sub">Healthtech</div>
        </div>
        <a href="/documentos/?portal=2im" class="p-documents-btn" target="_self"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H10l2 2h5.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><path d="M8 10h8M8 13h6"/></svg>Central de Documentos</a>
        <button type="button" class="p-toggle" aria-expanded="false" aria-controls="partner-tools-2im"><span class="toggle-label-expand">Ver ferramentas</span><span class="toggle-label-collapse">Ocultar</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg></button>
        <a href="/2im/" class="p-portal-btn">Acessar portal <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg></a>
      </div>
      <div class="partner-tools-wrapper" id="partner-tools-2im" aria-hidden="true" inert>
      <div class="partner-tools" id="tools-2im">
        <span class="tool-item disabled">Carregando ferramentas...</span>
      </div>
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- ═══ GOVERNANÇA ═══ -->
  <div class="section">
    <div class="section-header">
      <h2 class="section-title">Compliance, Fundador e Infraestrutura</h2>
    </div>
    <div class="gov-grid">
      <a href="/compliance/" class="gov-card">
        <div class="gc-title">Central de Compliance</div>
        <div class="gc-desc">Políticas de privacidade, termos de uso, código de conduta e documentação de integridade.</div>
      </a>
      <a href="/founder/" class="gov-card">
        <div class="gc-title">Guilherme Thomé</div>
        <div class="gc-desc">Médico executivo, Superintendente Unimed/ICDS, especialista em VBHC. Fundador do Grupo CSV.</div>
      </a>
      <a href="/_infra/" class="gov-card">
        <div class="gc-title">Infraestrutura Cognitiva</div>
        <div class="gc-desc">Playbooks, system identity, definições canônicas e mandates para integração com AI.</div>
      </a>
      <a href="https://github.com/grupocsv/hub" class="gov-card" target="_blank">
        <div class="gc-title">Repositório GitHub</div>
        <div class="gc-desc">Código fonte, assets e documentação completa do ecossistema Grupo CSV.</div>
      </a>
    </div>
  </div>

  <!-- ═══ FOOTER ═══ -->
  <div class="hub-footer">
    <div class="footer-logos">
      <a href="https://grupocsv.com" target="_blank" title="Grupo CSV"><img src="https://assets.grupocsv.com/logos/grupo-csv/horizontal-positivo-transparente.png" alt="Grupo CSV" class="theme-logo--light" style="height:36px;max-height:36px;width:auto;max-width:160px;object-fit:contain;"><img src="https://assets.grupocsv.com/logos/grupo-csv/horizontal-negativo-transparente.png" alt="Grupo CSV" class="theme-logo--dark" style="height:36px;max-height:36px;width:auto;max-width:160px;object-fit:contain;"></a>
      <span class="logo-divider"></span>
      <a href="https://axcare.com.br" target="_blank" title="AxiaCare®"><img src="https://assets.grupocsv.com/logos/axiacare/horizontal-positivo.svg" alt="AxiaCare" class="theme-logo--light" style="height:36px;max-height:36px;width:auto;max-width:160px;object-fit:contain;"><img src="https://assets.grupocsv.com/logos/axiacare/horizontal-negativo.svg" alt="AxiaCare" class="theme-logo--dark" style="height:36px;max-height:36px;width:auto;max-width:160px;object-fit:contain;"></a>
      <a href="https://medvalor.med.br" target="_blank" title="MedValor®"><img src="https://assets.grupocsv.com/logos/medvalor/horizontal-positivo-laranja.svg" alt="MedValor" class="theme-logo--light" style="height:36px;max-height:36px;width:auto;max-width:160px;object-fit:contain;"><img src="https://assets.grupocsv.com/logos/medvalor/horizontal-negativo-verde-laranja.svg" alt="MedValor" class="theme-logo--dark" style="height:36px;max-height:36px;width:auto;max-width:160px;object-fit:contain;"></a>
      <a href="https://thera.tech" target="_blank" title="Thera®"><img src="https://assets.grupocsv.com/logos/thera/horizontal-positivo-roxo.svg" alt="Thera" class="theme-logo--light" style="height:36px;max-height:36px;width:auto;max-width:160px;object-fit:contain;"><img src="https://assets.grupocsv.com/logos/thera/horizontal-negativo-roxo.svg" alt="Thera" class="theme-logo--dark" style="height:36px;max-height:36px;width:auto;max-width:160px;object-fit:contain;"></a>
    </div>
    <div class="footer-contacts">
      <a href="mailto:contato@grupocsv.com">contato@grupocsv.com</a>
      <span class="contact-sep">|</span>
      <a href="mailto:compliance@grupocsv.com">compliance@grupocsv.com</a>
    </div>
    <div class="footer-copy">© 2026 Grupo CSV. Todos os direitos reservados.</div>
</div>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Toggle parceiros
  document.querySelectorAll('.partner-header .p-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const section = toggle.closest('.partner-section');
      const wrapperId = toggle.getAttribute('aria-controls');
      const wrapper = wrapperId ? document.getElementById(wrapperId) : null;
      if (!section || !wrapper) return;
      section.classList.toggle('collapsed');
      const expanded = !section.classList.contains('collapsed');
      toggle.setAttribute('aria-expanded', String(expanded));
      wrapper.setAttribute('aria-hidden', String(!expanded));
      if (expanded) wrapper.removeAttribute('inert');
      else wrapper.setAttribute('inert', '');
    });
  });

  // Carregar ferramentas dinamicamente
  const portals = [
    { id: 'unimed', color: '#00995d', basePath: '/unimed/' },
    { id: 'unihealth', color: '#013d19', basePath: '/unihealth/' },
    { id: 'icds', color: '#1B3A5C', basePath: '/icds/' },
    { id: '2im', color: '#1B2A4A', basePath: '/2im/' },
  ];

  portals.forEach(portal => {
    const container = document.getElementById('tools-' + portal.id);
    if (!container) return;

    fetch(portal.basePath + 'tools.json')
      .then(r => r.json())
      .then(data => {
        const tools = (data.tools || []).filter(tool =>
          tool.managedBy !== 'hub-documentos' &&
          !(typeof tool.file === 'string' && tool.file.startsWith('/documentos/'))
        );
        if (tools.length === 0) {
          container.innerHTML = '<span class="tool-item disabled">Nenhuma ferramenta dispon\u00edvel</span>';
          return;
        }
        container.innerHTML = tools.map(tool => {
          const href = tool.external ? tool.file : (portal.basePath + tool.file);
          return '<a href="' + href + '" class="tool-item">' +
            '<span class="dot" style="background:' + portal.color + ';"></span>' +
            tool.title +
            '<span class="arrow">\u203a</span>' +
            '</a>';
        }).join('');
      })
      .catch(() => {
        container.innerHTML = '<span class="tool-item disabled">Erro ao carregar ferramentas</span>';
      });
  });
});
</script>

</div>
