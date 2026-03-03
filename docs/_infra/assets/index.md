---
layout: page
title: Central de Assets
---

<style scoped>
.VPPage { padding: 0 !important; }

.assets-hub {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background:
    radial-gradient(1400px 600px at -10% -20%, #e8f0f6 0%, transparent 60%),
    radial-gradient(1200px 500px at 110% 0%, #e6f4ed 0%, transparent 60%),
    #F6F4EF;
  min-height: calc(100vh - 64px);
}
.dark .assets-hub { background: var(--vp-c-bg); }

.frame {
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(13,38,76,.06);
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(13,38,76,.14);
  padding: clamp(18px, 4vw, 28px);
  margin-bottom: 24px;
}
.dark .frame { background: var(--vp-c-bg-soft); border-color: var(--vp-c-divider); box-shadow: none; }

.page-title {
  margin: 0 0 6px;
  font-size: clamp(1.6rem, 2.3vw + 1rem, 2rem);
  color: #196396;
  border: none;
}
.dark .page-title { color: #5da9e0; }
.page-subtitle { font-size: 0.92rem; color: #5b6470; margin: 0 0 8px; line-height: 1.6; }

.section-title {
  margin: 0 0 16px;
  color: #2d3445;
  font-size: clamp(1.15rem, 1.1vw + 0.9rem, 1.35rem);
  border: none;
}
.dark .section-title { color: var(--vp-c-text-1); }

.brand-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}
@media (min-width: 760px) { .brand-grid { grid-template-columns: 1fr 1fr; } }

.brand-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(180deg, #f8f9fa, #f0f2f5);
  border: 1px solid rgba(13,38,76,.06);
  border-radius: 14px;
  text-decoration: none !important;
  color: #2d3445 !important;
  transition: all 0.18s;
}
.brand-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(13,38,76,.12); }
.dark .brand-card { background: linear-gradient(180deg, #1e2a3a, #1a2530); border-color: var(--vp-c-divider); color: var(--vp-c-text-1) !important; }

.brand-card img {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: contain;
  border: none;
  flex-shrink: 0;
}

.brand-card-text h3 {
  margin: 0 0 4px;
  font-size: 1rem;
  border: none;
}
.brand-card-text p {
  margin: 0;
  font-size: 0.82rem;
  color: #5b6470;
}

.extras-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}
@media (min-width: 760px) { .extras-grid { grid-template-columns: 1fr 1fr 1fr; } }

.extras-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: linear-gradient(180deg, #f8f9fa, #f0f2f5);
  border: 1px solid rgba(13,38,76,.06);
  border-radius: 14px;
  text-decoration: none !important;
  color: #2d3445 !important;
  transition: all 0.18s;
}
.extras-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(13,38,76,.12); }
.dark .extras-card { background: linear-gradient(180deg, #1e2a3a, #1a2530); border-color: var(--vp-c-divider); color: var(--vp-c-text-1) !important; }
.extras-card h4 { margin: 0; font-size: 0.95rem; border: none; color: #196396; }
.extras-card p { margin: 0; font-size: 0.82rem; color: #5b6470; }

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

<div class="assets-hub">
  <div class="frame">
    <h1 class="page-title">Central de Assets</h1>
    <p class="page-subtitle">
      Repositorio completo de identidade visual do ecossistema Grupo CSV. Todos os logotipos,
      avatares, papelaria, criativos e materiais de marca organizados por empresa.
    </p>
  </div>

  <div class="frame">
    <h2 class="section-title">Assets por Marca</h2>
    <div class="brand-grid">
      <a href="/_infra/assets/grupo-csv" class="brand-card">
        <img src="/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_positive_transparent.png" alt="Grupo CSV" />
        <div class="brand-card-text">
          <h3>Grupo CSV</h3>
          <p>Holding. Cuidados em Saude com Valor.</p>
        </div>
      </a>
      <a href="/_infra/assets/axiacare" class="brand-card">
        <img src="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_positive.png" alt="AxiaCare" />
        <div class="brand-card-text">
          <h3>AxiaCare</h3>
          <p>Consultoria e gestao hospitalar.</p>
        </div>
      </a>
      <a href="/_infra/assets/medvalor" class="brand-card">
        <img src="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_orange_positive.png" alt="MedValor" />
        <div class="brand-card-text">
          <h3>MedValor</h3>
          <p>Educacao medica e eventos.</p>
        </div>
      </a>
      <a href="/_infra/assets/thera" class="brand-card">
        <img src="/visual-identity/thera/logo/png/thera_logo_horizontal_purple_positive.png" alt="TheraTech" />
        <div class="brand-card-text">
          <h3>Thera</h3>
          <p>Tecnologia e SaaS em saude.</p>
        </div>
      </a>
      <a href="/_infra/assets/guilherme-thome" class="brand-card">
        <img src="/visual-identity/guilherme-thome/avatar/guilherme-thome_avatar_current.png" alt="Dr. Guilherme C. Thomé" />
        <div class="brand-card-text">
          <h3>Dr. Guilherme C. Thome</h3>
          <p>Marca pessoal do fundador.</p>
        </div>
      </a>
      <a href="/_infra/assets/icds" class="brand-card">
        <img src="/visual-identity/icds/logo/png/icds_horizontal_fundo_azul.png" alt="ICDS" />
        <div class="brand-card-text">
          <h3>ICDS</h3>
          <p>Parceiro. Entidade Filantropica e Gestora Assistencial.</p>
        </div>
      </a>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Recursos Transversais</h2>
    <div class="extras-grid">
      <a href="/_infra/assets/brand-guidelines" class="extras-card">
        <h4>Brand Guidelines</h4>
        <p>Guias de identidade visual, cores, fontes e regras de uso.</p>
      </a>
      <a href="/_infra/assets/creatives" class="extras-card">
        <h4>Criativos</h4>
        <p>Social media, banners, QR codes, thumbnails e backgrounds virtuais.</p>
      </a>
      <a href="/_infra/assets/wallpapers" class="extras-card">
        <h4>Wallpapers</h4>
        <p>Fundos de tela para desktop, celular e videochamadas.</p>
      </a>
    </div>
  </div>

  <div style="text-align:center; margin-bottom:24px;">
    <a href="/_infra/" class="back-link">Voltar a Infraestrutura Cognitiva</a>
  </div>

  <div class="page-footer">
    <strong>Central de Assets — Grupo CSV</strong>
    <div class="small">Identidade visual oficial do ecossistema. Fonte de verdade: _manifest.json</div>
  </div>
</div>
