---
layout: page
title: "Assets MedValor®"
---

<style scoped>
.VPPage { padding: 0 !important; }

.assets-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background: radial-gradient(1400px 600px at -10% -20%, #fef3e8 0%, transparent 60%), radial-gradient(1200px 500px at 110% 0%, #fff7ed 0%, transparent 60%), #F6F4EF;
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
  color: #c2410c;
  border: none;
}
.dark .page-title { color: #c2410c; filter: brightness(1.4); }
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
  color: #c2410c;
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
  background: #c2410c;
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
  background: #c2410c;
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

.dark .dark .copy-bar-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all .2s ease;
  font-family: inherit;
  line-height: 1.2;
}
.copy-bar-btn:hover { background: #e5e7eb; color: #111827; border-color: #9ca3af; }
.copy-bar-btn.copied { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
.dark .copy-bar-btn { background: #1f2937; color: #d1d5db; border-color: #4b5563; }
.dark .copy-bar-btn:hover { background: #374151; color: #f3f4f6; border-color: #6b7280; }
.dark .copy-bar-btn.copied { background: #064e3b; color: #6ee7b7; border-color: #065f46; }
</style>

<div class="copy-bar">
<button class="copy-bar-btn" id="copy-page-btn">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
Copiar página
</button>
</div>

<div class="assets-page">
<div class="frame">
    <h1 class="page-title">Assets: MedValor®</h1>
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
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_blue_negative.png" alt="medvalor_logo_horizontal_blue_negative.png" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Blue / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_blue_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_blue_positive.png" alt="medvalor_logo_horizontal_blue_positive.png" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Blue / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_blue_positive.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_monochrome_negative.png" alt="medvalor_logo_horizontal_monochrome_negative.png" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Monochrome / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_monochrome_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_monochrome_positive.png" alt="medvalor_logo_horizontal_monochrome_positive.png" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Monochrome / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_monochrome_positive.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_orange_negative.png" alt="medvalor_logo_horizontal_orange_negative.png" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Orange / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_orange_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_orange_positive.png" alt="medvalor_logo_horizontal_orange_positive.png" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Orange / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_horizontal_orange_positive.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_blue_negative.png" alt="medvalor_logo_vertical_blue_negative.png" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Blue / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_blue_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_blue_positive.png" alt="medvalor_logo_vertical_blue_positive.png" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Blue / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_blue_positive.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_monochrome_negative.png" alt="medvalor_logo_vertical_monochrome_negative.png" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Monochrome / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_monochrome_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_monochrome_positive.png" alt="medvalor_logo_vertical_monochrome_positive.png" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Monochrome / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_monochrome_positive.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_orange_negative.png" alt="medvalor_logo_vertical_orange_negative.png" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Orange / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_orange_negative.png" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_orange_positive.png" alt="medvalor_logo_vertical_orange_positive.png" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Orange / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/png/medvalor_logo_vertical_orange_positive.png" download class="dl-link">Download PNG</a>
  </div>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Logotipos (SVG)</h2>
    <p class="format-note">Vetor escalável. Uso preferencial para web e impressão.</p>
    <p class="format-note"><strong>Padrão canônico para fundo escuro:</strong> usar as variantes verde-laranja abaixo. Elas preservam o símbolo bicolor e alteram somente o nome para branco.</p>
<div class="file-list">
  <a href="https://assets.grupocsv.com/logos/medvalor/horizontal-negativo-verde-laranja.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">horizontal-negativo-verde-laranja.svg — canônico para tema escuro</span>
  </a>
  <a href="https://assets.grupocsv.com/logos/medvalor/vertical-negativo-verde-laranja.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">vertical-negativo-verde-laranja.svg — canônico para tema escuro</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_horizontal_blue_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_horizontal_blue_negative.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_horizontal_blue_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_horizontal_blue_positive.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_horizontal_monochrome_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_horizontal_monochrome_negative.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_horizontal_monochrome_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_horizontal_monochrome_positive.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_horizontal_orange_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_horizontal_orange_negative.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_horizontal_orange_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_horizontal_orange_positive.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_vertical_blue_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_vertical_blue_negative.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_vertical_blue_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_vertical_blue_positive.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_vertical_monochrome_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_vertical_monochrome_negative.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_vertical_monochrome_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_vertical_monochrome_positive.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_vertical_orange_negative.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_vertical_orange_negative.svg</span>
  </a>
  <a href="/visual-identity/medvalor/logo/svg/medvalor_logo_vertical_orange_positive.svg" download class="file-item">
    <span class="file-ext">SVG</span>
    <span class="file-name">medvalor_logo_vertical_orange_positive.svg</span>
  </a>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Logotipos (WebP)</h2>
    <p class="format-note">Imagem web otimizada com transparencia.</p>
<div class="file-list">
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_horizontal_blue_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_horizontal_blue_negative.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_horizontal_blue_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_horizontal_blue_positive.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_horizontal_monochrome_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_horizontal_monochrome_negative.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_horizontal_monochrome_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_horizontal_monochrome_positive.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_horizontal_orange_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_horizontal_orange_negative.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_horizontal_orange_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_horizontal_orange_positive.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_vertical_blue_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_vertical_blue_negative.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_vertical_blue_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_vertical_blue_positive.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_vertical_monochrome_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_vertical_monochrome_negative.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_vertical_monochrome_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_vertical_monochrome_positive.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_vertical_orange_negative.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_vertical_orange_negative.webp</span>
  </a>
  <a href="/visual-identity/medvalor/logo/webp/medvalor_logo_vertical_orange_positive.webp" download class="file-item">
    <span class="file-ext">WEBP</span>
    <span class="file-name">medvalor_logo_vertical_orange_positive.webp</span>
  </a>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Logotipos (JPG)</h2>
    <p class="format-note">Imagem raster com fundo solido.</p>
<div class="logo-grid">
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_blue_negative.jpg" alt="medvalor_logo_horizontal_blue_negative.jpg" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Blue / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_blue_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_blue_positive.jpg" alt="medvalor_logo_horizontal_blue_positive.jpg" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Blue / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_blue_positive.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_monochrome_negative.jpg" alt="medvalor_logo_horizontal_monochrome_negative.jpg" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Monochrome / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_monochrome_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_monochrome_positive.jpg" alt="medvalor_logo_horizontal_monochrome_positive.jpg" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Monochrome / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_monochrome_positive.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_orange_negative.jpg" alt="medvalor_logo_horizontal_orange_negative.jpg" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Orange / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_orange_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_orange_positive.jpg" alt="medvalor_logo_horizontal_orange_positive.jpg" loading="lazy">
    </div>
    <div class="logo-label">Horizontal / Orange / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_horizontal_orange_positive.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light" style="padding:16px;">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_preview.jpg" alt="medvalor_logo_preview.jpg" loading="lazy">
    </div>
    <div class="logo-label">Preview</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_preview.jpg" download class="dl-link">Download</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_blue_negative.jpg" alt="medvalor_logo_vertical_blue_negative.jpg" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Blue / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_blue_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_monochrome_negative.jpg" alt="medvalor_logo_vertical_monochrome_negative.jpg" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Monochrome / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_monochrome_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_monochrome_positive.jpg" alt="medvalor_logo_vertical_monochrome_positive.jpg" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Monochrome / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_monochrome_positive.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-dark">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_orange_negative.jpg" alt="medvalor_logo_vertical_orange_negative.jpg" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Orange / Fundo escuro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_orange_negative.jpg" download class="dl-link">Download PNG</a>
  </div>
  <div class="logo-item">
    <div class="preview-light">
      <img src="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_orange_positive.jpg" alt="medvalor_logo_vertical_orange_positive.jpg" loading="lazy">
    </div>
    <div class="logo-label">Vertical / Orange / Fundo claro</div>
    <a href="/visual-identity/medvalor/logo/jpg/medvalor_logo_vertical_orange_positive.jpg" download class="dl-link">Download PNG</a>
  </div>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Arquivos Fonte</h2>
    <p class="format-note">Arquivos editaveis (.ai, .pdf) para uso profissional.</p>
<div class="file-list">
  <a href="/visual-identity/medvalor/logo/source/medvalor_logo_source.ai" download class="file-item">
    <span class="file-ext">AI</span>
    <span class="file-name">medvalor_logo_source.ai</span>
  </a>
  <a href="/visual-identity/medvalor/logo/source/medvalor_logo_source.pdf" download class="file-item">
    <span class="file-ext">PDF</span>
    <span class="file-name">medvalor_logo_source.pdf</span>
  </a>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Avatares</h2>
    <p class="format-note">Imagens para perfis em redes sociais e plataformas.</p>
<div class="avatar-grid">
  <div class="avatar-item">
    <img src="/visual-identity/medvalor/avatar/medvalor_avatar_v1.png" alt="medvalor_avatar_v1.png" loading="lazy">
    <div class="logo-label">medvalor_avatar_v1.png</div>
    <a href="/visual-identity/medvalor/avatar/medvalor_avatar_v1.png" download class="dl-link">Download</a>
  </div>
  <div class="avatar-item">
    <img src="/visual-identity/medvalor/avatar/medvalor_avatar_v2.png" alt="medvalor_avatar_v2.png" loading="lazy">
    <div class="logo-label">medvalor_avatar_v2.png</div>
    <a href="/visual-identity/medvalor/avatar/medvalor_avatar_v2.png" download class="dl-link">Download</a>
  </div>
</div>

  </div>

  <div class="frame">
    <h2 class="section-title">Papelaria</h2>
    <p class="format-note">Cartoes de visita, timbrados, envelopes e outros materiais impressos.</p>
<div class="file-list">
  <a href="/visual-identity/medvalor/stationery/medvalor_stationery_letterhead_editable.docx" download class="file-item">
    <span class="file-ext">DOCX</span>
    <span class="file-name">medvalor_stationery_letterhead_editable.docx</span>
  </a>
  <a href="/visual-identity/medvalor/stationery/medvalor_stationery_letterhead_print-ready.pdf" download class="file-item">
    <span class="file-ext">PDF</span>
    <span class="file-name">medvalor_stationery_letterhead_print-ready.pdf</span>
  </a>
</div>

  </div>

  <div style="text-align:center; margin-bottom:24px;">
    <a href="/_infra/assets/" class="back-link">Voltar a Central de Assets</a>
  </div>

  <div class="page-footer">
    <strong>MedValor® — Grupo CSV</strong>
    <div class="small">Identidade visual oficial. Uso conforme brand guidelines.</div>
  </div>
</div>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const btn = document.getElementById('copy-page-btn')
  if (!btn) return
  btn.addEventListener('click', () => {
    const content = document.querySelector('.vp-doc') || document.querySelector('.VPPage') || document.querySelector('main')
    if (!content) return

    function htmlToMd(el) {
      let md = ''
      function walk(node) {
        if (node.nodeType === 3) { md += node.textContent; return }
        if (node.nodeType !== 1) return
        const tag = node.tagName.toLowerCase()
        if (node.classList && (node.classList.contains('copy-bar-btn') || node.classList.contains('copy-bar'))) return
        if (['style','script','nav','aside'].includes(tag)) return
        if (tag === 'h1') { md += '\n# '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h2') { md += '\n## '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h3') { md += '\n### '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h4') { md += '\n#### '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'p') { node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'br') { md += '\n'; return }
        if (tag === 'strong' || tag === 'b') { md += '**'; node.childNodes.forEach(walk); md += '**'; return }
        if (tag === 'em' || tag === 'i') { md += '*'; node.childNodes.forEach(walk); md += '*'; return }
        if (tag === 'code' && node.parentElement.tagName.toLowerCase() !== 'pre') {
          md += '`' + node.textContent + '`'; return
        }
        if (tag === 'pre') { md += '\n```\n' + node.textContent + '\n```\n\n'; return }
        if (tag === 'a') { md += '['; node.childNodes.forEach(walk); md += '](' + (node.href || '') + ')'; return }
        if (tag === 'li') { md += '- '; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'ul' || tag === 'ol') { md += '\n'; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'table') {
          const rows = node.querySelectorAll('tr')
          rows.forEach((row, i) => {
            const cells = row.querySelectorAll('th, td')
            md += '| ' + Array.from(cells).map(c => c.textContent.trim()).join(' | ') + ' |\n'
            if (i === 0) md += '|' + Array.from(cells).map(() => '---').join('|') + '|\n'
          })
          md += '\n'
          return
        }
        if (tag === 'hr') { md += '\n---\n\n'; return }
        if (tag === 'blockquote') { md += '> '; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'img') return
        node.childNodes.forEach(walk)
      }
      walk(el)
      return md.replace(/\n{3,}/g, '\n\n').trim()
    }

    const md = htmlToMd(content)
    navigator.clipboard.writeText(md).then(() => {
      btn.classList.add('copied')
      const origHTML = btn.innerHTML
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!'
      setTimeout(() => {
        btn.classList.remove('copied')
        btn.innerHTML = origHTML
      }, 3000)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = md
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      btn.classList.add('copied')
      const origHTML = btn.innerHTML
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!'
      setTimeout(() => {
        btn.classList.remove('copied')
        btn.innerHTML = origHTML
      }, 3000)
    })
  })
})
</script>
