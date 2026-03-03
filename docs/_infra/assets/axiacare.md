---
layout: page
title: "Assets AxiaCare®"
---

<style scoped>
.VPPage { padding: 0 !important; }

.assets-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background: radial-gradient(1400px 600px at -10% -20%, #e8f0f6 0%, transparent 60%), radial-gradient(1200px 500px at 110% 0%, #e6f4ed 0%, transparent 60%), #F6F4EF;
  min-height: calc(100vh - 64px);
}
.dark .assets-page { background: var(--vp-c-bg); }

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
.dark .page-title { color: #196396; filter: brightness(1.4); }
.page-subtitle { font-size: 0.92rem; color: #5b6470; margin: 0 0 8px; line-height: 1.6; }

.section-title {
  margin: 0 0 16px;
  color: #2d3445;
  font-size: clamp(1.15rem, 1.1vw + 0.9rem, 1.35rem);
  border: none;
}
.dark .section-title { color: var(--vp-c-text-1); }

.logo-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.logo-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-light {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.preview-dark {
  background: #1a1a2e;
  border: 1px solid #2d2d44;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.logo-item img {
  max-width: 100%;
  max-height: 100px;
  object-fit: contain;
}

.logo-label {
  font-size: 0.78rem;
  color: #5b6470;
  text-align: center;
  line-height: 1.4;
}

.dl-link {
  display: block;
  text-align: center;
  font-size: 0.78rem;
  color: #196396;
  text-decoration: none;
  font-weight: 600;
}
.dl-link:hover { text-decoration: underline; }

.avatar-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.avatar-item img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e5e7eb;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  text-decoration: none !important;
  color: #2d3445 !important;
  transition: all 0.15s;
}
.file-item:hover { background: #f0f2f5; transform: translateX(4px); }
.dark .file-item { background: var(--vp-c-bg-alt); border-color: var(--vp-c-divider); color: var(--vp-c-text-1) !important; }

.file-ext {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 28px;
  background: #196396;
  color: white;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.file-name {
  font-size: 0.85rem;
  word-break: break-all;
}

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
.back-link:hover { filter: brightness(1.15); transform: translateY(-2px); }

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

.format-note {
  font-size: 0.82rem;
  color: #94a3b8;
  font-style: italic;
  margin-bottom: 16px;
}
</style>

<div class="assets-page">
  <div class="frame">
    <h1 class="page-title">Assets: AxiaCare®</h1>
    <p class="page-subtitle">
      Todos os assets oficiais de identidade visual. Use a versao <strong>positive</strong> (fundo claro)
      em superficies brancas/claras e a versao <strong>negative</strong> (fundo escuro) em superficies
      pretas/escuras. Prefira SVG para web, PNG para uso geral.
    </p>
  </div>

  <div class="frame">
    <h2 class="section-title">Logotipos (PNG)</h2>
    <p class="format-note">Imagem raster com transparencia. Uso geral.</p>
<div class="logo-grid">
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_negative.png" alt="axiacare_logo_horizontal_full-color_negative.png" loading="lazy" />
    </div>
    <div class="logo-label">Horizontal / Full Color / Fundo escuro</div>
    <a href="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_positive.png" alt="axiacare_logo_horizontal_full-color_positive.png" loading="lazy" />
    </div>
    <div class="logo-label">Horizontal / Full Color / Fundo claro</div>
    <a href="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_positive.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_monochrome_negative.png" alt="axiacare_logo_horizontal_monochrome_negative.png" loading="lazy" />
    </div>
    <div class="logo-label">Horizontal / Monochrome / Fundo escuro</div>
    <a href="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_monochrome_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_monochrome_positive.png" alt="axiacare_logo_horizontal_monochrome_positive.png" loading="lazy" />
    </div>
    <div class="logo-label">Horizontal / Monochrome / Fundo claro</div>
    <a href="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_monochrome_positive.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/axiacare/logo/png/axiacare_logo_vertical_full-color_negative.png" alt="axiacare_logo_vertical_full-color_negative.png" loading="lazy" />
    </div>
    <div class="logo-label">Vertical / Full Color / Fundo escuro</div>
    <a href="/visual-identity/axiacare/logo/png/axiacare_logo_vertical_full-color_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/axiacare/logo/png/axiacare_logo_vertical_full-color_positive.png" alt="axiacare_logo_vertical_full-color_positive.png" loading="lazy" />
    </div>
    <div class="logo-label">Vertical / Full Color / Fundo claro</div>
    <a href="/visual-identity/axiacare/logo/png/axiacare_logo_vertical_full-color_positive.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/axiacare/logo/png/axiacare_logo_vertical_monochrome_negative.png" alt="axiacare_logo_vertical_monochrome_negative.png" loading="lazy" />
    </div>
    <div class="logo-label">Vertical / Monochrome / Fundo escuro</div>
    <a href="/visual-identity/axiacare/logo/png/axiacare_logo_vertical_monochrome_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/axiacare/logo/png/axiacare_logo_vertical_monochrome_positive.png" alt="axiacare_logo_vertical_monochrome_positive.png" loading="lazy" />
    </div>
    <div class="logo-label">Vertical / Monochrome / Fundo claro</div>
    <a href="/visual-identity/axiacare/logo/png/axiacare_logo_vertical_monochrome_positive.png" download class="dl-link">Download PNG</a>
  </div>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Logotipos (SVG)</h2>
    <p class="format-note">Vetor escalavel. Uso preferencial para web e impressao.</p>
<div class="file-list">
  <a href="/visual-identity/axiacare/logo/svg/axiacare_logo_horizontal_full-color_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">axiacare_logo_horizontal_full-color_negative.svg</span>
  </a>
  <a href="/visual-identity/axiacare/logo/svg/axiacare_logo_horizontal_full-color_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">axiacare_logo_horizontal_full-color_positive.svg</span>
  </a>
  <a href="/visual-identity/axiacare/logo/svg/axiacare_logo_horizontal_monochrome_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">axiacare_logo_horizontal_monochrome_negative.svg</span>
  </a>
  <a href="/visual-identity/axiacare/logo/svg/axiacare_logo_horizontal_monochrome_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">axiacare_logo_horizontal_monochrome_positive.svg</span>
  </a>
  <a href="/visual-identity/axiacare/logo/svg/axiacare_logo_vertical_full-color_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">axiacare_logo_vertical_full-color_negative.svg</span>
  </a>
  <a href="/visual-identity/axiacare/logo/svg/axiacare_logo_vertical_full-color_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">axiacare_logo_vertical_full-color_positive.svg</span>
  </a>
  <a href="/visual-identity/axiacare/logo/svg/axiacare_logo_vertical_monochrome_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">axiacare_logo_vertical_monochrome_negative.svg</span>
  </a>
  <a href="/visual-identity/axiacare/logo/svg/axiacare_logo_vertical_monochrome_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">axiacare_logo_vertical_monochrome_positive.svg</span>
  </a>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Logotipos (WebP)</h2>
    <p class="format-note">Imagem web otimizada com transparencia.</p>
<div class="file-list">
  <a href="/visual-identity/axiacare/logo/webp/axiacare_logo_horizontal_full-color_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">axiacare_logo_horizontal_full-color_negative.webp</span>
  </a>
  <a href="/visual-identity/axiacare/logo/webp/axiacare_logo_horizontal_full-color_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">axiacare_logo_horizontal_full-color_positive.webp</span>
  </a>
  <a href="/visual-identity/axiacare/logo/webp/axiacare_logo_horizontal_monochrome_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">axiacare_logo_horizontal_monochrome_negative.webp</span>
  </a>
  <a href="/visual-identity/axiacare/logo/webp/axiacare_logo_horizontal_monochrome_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">axiacare_logo_horizontal_monochrome_positive.webp</span>
  </a>
  <a href="/visual-identity/axiacare/logo/webp/axiacare_logo_vertical_full-color_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">axiacare_logo_vertical_full-color_negative.webp</span>
  </a>
  <a href="/visual-identity/axiacare/logo/webp/axiacare_logo_vertical_full-color_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">axiacare_logo_vertical_full-color_positive.webp</span>
  </a>
  <a href="/visual-identity/axiacare/logo/webp/axiacare_logo_vertical_monochrome_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">axiacare_logo_vertical_monochrome_negative.webp</span>
  </a>
  <a href="/visual-identity/axiacare/logo/webp/axiacare_logo_vertical_monochrome_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">axiacare_logo_vertical_monochrome_positive.webp</span>
  </a>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Logotipos (JPG)</h2>
    <p class="format-note">Imagem raster com fundo solido.</p>
<div class="logo-grid">
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/axiacare/logo/jpg/axiacare_logo_horizontal_full-color_negative.jpg" alt="axiacare_logo_horizontal_full-color_negative.jpg" loading="lazy" />
    </div>
    <div class="logo-label">Horizontal / Full Color / Fundo escuro</div>
    <a href="/visual-identity/axiacare/logo/jpg/axiacare_logo_horizontal_full-color_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/axiacare/logo/jpg/axiacare_logo_horizontal_full-color_positive.jpg" alt="axiacare_logo_horizontal_full-color_positive.jpg" loading="lazy" />
    </div>
    <div class="logo-label">Horizontal / Full Color / Fundo claro</div>
    <a href="/visual-identity/axiacare/logo/jpg/axiacare_logo_horizontal_full-color_positive.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/axiacare/logo/jpg/axiacare_logo_horizontal_monochrome_negative.jpg" alt="axiacare_logo_horizontal_monochrome_negative.jpg" loading="lazy" />
    </div>
    <div class="logo-label">Horizontal / Monochrome / Fundo escuro</div>
    <a href="/visual-identity/axiacare/logo/jpg/axiacare_logo_horizontal_monochrome_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/axiacare/logo/jpg/axiacare_logo_horizontal_monochrome_positive.jpg" alt="axiacare_logo_horizontal_monochrome_positive.jpg" loading="lazy" />
    </div>
    <div class="logo-label">Horizontal / Monochrome / Fundo claro</div>
    <a href="/visual-identity/axiacare/logo/jpg/axiacare_logo_horizontal_monochrome_positive.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light" style="padding:16px;">
      <img src="/visual-identity/axiacare/logo/jpg/axiacare_logo_preview.jpg" alt="axiacare_logo_preview.jpg" loading="lazy" />
    </div>
    <div class="logo-label">Preview</div>
    <a href="/visual-identity/axiacare/logo/jpg/axiacare_logo_preview.jpg" download class="dl-link">Download</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/axiacare/logo/jpg/axiacare_logo_vertical_full-color_negative.jpg" alt="axiacare_logo_vertical_full-color_negative.jpg" loading="lazy" />
    </div>
    <div class="logo-label">Vertical / Full Color / Fundo escuro</div>
    <a href="/visual-identity/axiacare/logo/jpg/axiacare_logo_vertical_full-color_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/axiacare/logo/jpg/axiacare_logo_vertical_monochrome_negative.jpg" alt="axiacare_logo_vertical_monochrome_negative.jpg" loading="lazy" />
    </div>
    <div class="logo-label">Vertical / Monochrome / Fundo escuro</div>
    <a href="/visual-identity/axiacare/logo/jpg/axiacare_logo_vertical_monochrome_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/axiacare/logo/jpg/axiacare_logo_vertical_monochrome_positive.jpg" alt="axiacare_logo_vertical_monochrome_positive.jpg" loading="lazy" />
    </div>
    <div class="logo-label">Vertical / Monochrome / Fundo claro</div>
    <a href="/visual-identity/axiacare/logo/jpg/axiacare_logo_vertical_monochrome_positive.jpg" download class="dl-link">Download PNG</a>
  </div>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Arquivos Fonte</h2>
    <p class="format-note">Arquivos editaveis (.ai, .pdf) para uso profissional.</p>
<div class="file-list">
  <a href="/visual-identity/axiacare/logo/source/axiacare_logo_source.ai" download class="file-item">
    <span class="file-ext">AI</span>
    <span class="file-name">axiacare_logo_source.ai</span>
  </a>
  <a href="/visual-identity/axiacare/logo/source/axiacare_logo_source.pdf" download class="file-item">
    <span class="file-ext">PDF</span>
    <span class="file-name">axiacare_logo_source.pdf</span>
  </a>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Avatares</h2>
    <p class="format-note">Imagens para perfis em redes sociais e plataformas.</p>
<div class="avatar-grid">
  <div class="avatar-item">
    <img src="/visual-identity/axiacare/avatar/axiacare_avatar_v1.png" alt="axiacare_avatar_v1.png" loading="lazy" />
    <div class="logo-label">axiacare_avatar_v1.png</div>
    <a href="/visual-identity/axiacare/avatar/axiacare_avatar_v1.png" download class="dl-link">Download</a>
  </div>
  <div class="avatar-item">
    <img src="/visual-identity/axiacare/avatar/axiacare_avatar_v2.png" alt="axiacare_avatar_v2.png" loading="lazy" />
    <div class="logo-label">axiacare_avatar_v2.png</div>
    <a href="/visual-identity/axiacare/avatar/axiacare_avatar_v2.png" download class="dl-link">Download</a>
  </div>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Papelaria</h2>
    <p class="format-note">Cartoes de visita, timbrados, envelopes e outros materiais impressos.</p>
<div class="file-list">
  <a href="/visual-identity/axiacare/stationery/axiacare_stationery_business-card_print-ready.pdf" download class="file-item">
    <span class="file-ext">PDF</span>
    <span class="file-name">axiacare_stationery_business-card_print-ready.pdf</span>
  </a>
  <a href="/visual-identity/axiacare/stationery/axiacare_stationery_envelope_print-ready.pdf" download class="file-item">
    <span class="file-ext">PDF</span>
    <span class="file-name">axiacare_stationery_envelope_print-ready.pdf</span>
  </a>
  <a href="/visual-identity/axiacare/stationery/axiacare_stationery_letterhead_editable.docx" download class="file-item">
    <span class="file-ext">DOCX</span>
    <span class="file-name">axiacare_stationery_letterhead_editable.docx</span>
  </a>
  <a href="/visual-identity/axiacare/stationery/axiacare_stationery_letterhead_print-ready.pdf" download class="file-item">
    <span class="file-ext">PDF</span>
    <span class="file-name">axiacare_stationery_letterhead_print-ready.pdf</span>
  </a>
</div>

  </div>

  <div style="text-align:center; margin-bottom:24px;">
    <a href="/_infra/assets/" class="back-link">Voltar a Central de Assets</a>
  </div>

  <div class="page-footer">
    <strong>AxiaCare® — Grupo CSV</strong>
    <div class="small">Identidade visual oficial. Uso conforme brand guidelines.</div>
  </div>
</div>
