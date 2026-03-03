---
layout: page
title: Brand Guidelines
---

<style scoped>
.VPPage { padding: 0 !important; }

.bg-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  background:
    radial-gradient(1400px 600px at -10% -20%, #e8f0f6 0%, transparent 60%),
    radial-gradient(1200px 500px at 110% 0%, #e6f4ed 0%, transparent 60%),
    #F6F4EF;
  min-height: calc(100vh - 64px);
}
.dark .bg-page { background: var(--vp-c-bg); }

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

.color-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.color-swatch {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.08);
}

.swatch-block {
  height: 80px;
  display: flex;
  align-items: flex-end;
  padding: 8px 12px;
}

.swatch-label {
  padding: 10px 12px;
  background: white;
  font-size: 0.82rem;
  line-height: 1.5;
}
.dark .swatch-label { background: var(--vp-c-bg-alt); }

.swatch-name { font-weight: 700; display: block; color: #2d3445; }
.dark .swatch-name { color: var(--vp-c-text-1); }
.swatch-hex { color: #5b6470; }

.polarity-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 640px) { .polarity-grid { grid-template-columns: 1fr; } }

.polarity-box {
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.polarity-light {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #2d3445;
}

.polarity-dark {
  background: #1a1a2e;
  border: 1px solid #2d2d44;
  color: #e5e7eb;
}

.polarity-box img {
  max-width: 200px;
  max-height: 80px;
  object-fit: contain;
}

.polarity-box .label {
  font-size: 0.85rem;
  font-weight: 600;
}

.polarity-box .desc {
  font-size: 0.78rem;
  opacity: 0.7;
}

.font-showcase {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.font-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
.dark .font-card { background: var(--vp-c-bg-alt); border-color: var(--vp-c-divider); }

.font-sample {
  font-size: 2rem;
  font-weight: 700;
  color: #196396;
  flex-shrink: 0;
}

.font-info h4 { margin: 0 0 4px; font-size: 0.95rem; border: none; }
.font-info p { margin: 0; font-size: 0.82rem; color: #5b6470; }

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
  margin-bottom: 8px;
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

.file-name { font-size: 0.85rem; word-break: break-all; }

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rules-list li {
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
  font-size: 0.9rem;
  color: #2d3445;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.dark .rules-list li { color: var(--vp-c-text-1); border-color: var(--vp-c-divider); }

.rules-list li:last-child { border-bottom: none; }

.rule-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 2px;
}
.rule-do { background: #dcfce7; color: #166534; }
.rule-dont { background: #fee2e2; color: #991b1b; }

.naming-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.naming-table th, .naming-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}
.dark .naming-table th, .dark .naming-table td { border-color: var(--vp-c-divider); }
.naming-table th { font-weight: 700; color: #196396; background: #f8f9fa; }
.dark .naming-table th { background: var(--vp-c-bg-alt); color: #5da9e0; }
.naming-table code { font-size: 0.8rem; background: #f0f2f5; padding: 2px 6px; border-radius: 4px; }

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

<div class="bg-page">
  <div class="frame">
    <h1 class="page-title">Brand Guidelines</h1>
    <p class="page-subtitle">
      Diretrizes de identidade visual do ecossistema Grupo CSV. Cores oficiais, tipografia,
      regras de uso e convencao de nomenclatura dos assets.
    </p>
  </div>

  <div class="frame">
    <h2 class="section-title">Paleta de Cores</h2>
    <div class="color-grid">
      <div class="color-swatch">
        <div class="swatch-block" style="background:#196396;"></div>
        <div class="swatch-label">
          <span class="swatch-name">Azul CSV</span>
          <span class="swatch-hex">#196396 — Primaria do grupo</span>
        </div>
      </div>
      <div class="color-swatch">
        <div class="swatch-block" style="background:#1d7ab5;"></div>
        <div class="swatch-label">
          <span class="swatch-name">Azul Claro</span>
          <span class="swatch-hex">#1D7AB5 — Hover / destaque</span>
        </div>
      </div>
      <div class="color-swatch">
        <div class="swatch-block" style="background:#0d264c;"></div>
        <div class="swatch-label">
          <span class="swatch-name">Azul Escuro</span>
          <span class="swatch-hex">#0D264C — Textos / hero</span>
        </div>
      </div>
      <div class="color-swatch">
        <div class="swatch-block" style="background:#00995d;"></div>
        <div class="swatch-label">
          <span class="swatch-name">Verde Unimed</span>
          <span class="swatch-hex">#00995D — Parceiro Unimed</span>
        </div>
      </div>
      <div class="color-swatch">
        <div class="swatch-block" style="background:#013d19;"></div>
        <div class="swatch-label">
          <span class="swatch-name">Verde Escuro</span>
          <span class="swatch-hex">#013D19 — Parceiro Unihealth</span>
        </div>
      </div>
      <div class="color-swatch">
        <div class="swatch-block" style="background:#6B5B95;"></div>
        <div class="swatch-label">
          <span class="swatch-name">Roxo Thera</span>
          <span class="swatch-hex">#6B5B95 — Thera / TheraTech</span>
        </div>
      </div>
      <div class="color-swatch">
        <div class="swatch-block" style="background:#c2410c;"></div>
        <div class="swatch-label">
          <span class="swatch-name">Laranja MedValor</span>
          <span class="swatch-hex">#C2410C — MedValor</span>
        </div>
      </div>
      <div class="color-swatch">
        <div class="swatch-block" style="background:#F6F4EF;"></div>
        <div class="swatch-label">
          <span class="swatch-name">Creme Base</span>
          <span class="swatch-hex">#F6F4EF — Background padrao</span>
        </div>
      </div>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Polaridade: Positivo vs Negativo</h2>
    <p class="page-subtitle" style="margin-bottom:16px;">
      Toda logo possui duas versoes de polaridade. A escolha depende do fundo onde sera aplicada.
    </p>
    <div class="polarity-grid">
      <div class="polarity-box polarity-light">
        <img src="/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_positive.png" alt="Positiva" />
        <div class="label">POSITIVE</div>
        <div class="desc">Logo escura sobre fundo claro. Uso em superficies brancas, cremes ou claras.</div>
      </div>
      <div class="polarity-box polarity-dark">
        <img src="/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_negative_transparent.png" alt="Negativa" />
        <div class="label">NEGATIVE</div>
        <div class="desc">Logo clara sobre fundo escuro. Uso em superficies pretas, azuis escuras ou gradientes.</div>
      </div>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Tipografia</h2>
    <div class="font-showcase">
      <div class="font-card">
        <div class="font-sample">Aa</div>
        <div class="font-info">
          <h4>Grifter Bold</h4>
          <p>Fonte principal para titulos e destaques. Usada nos logotipos do Grupo CSV e marcas associadas.</p>
        </div>
      </div>
      <div class="font-card">
        <div class="font-sample" style="font-family: system-ui; font-weight: 400;">Aa</div>
        <div class="font-info">
          <h4>System UI / Inter</h4>
          <p>Fonte de corpo para textos corridos, interfaces e documentos digitais.</p>
        </div>
      </div>
    </div>
    <div style="margin-top:16px;">
      <a href="/visual-identity/_brand-guidelines/grupo-csv_font_grifter-bold.otf" download class="file-item">
        <span class="file-ext">OTF</span>
        <span class="file-name">grupo-csv_font_grifter-bold.otf</span>
      </a>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Convencao de Nomenclatura</h2>
    <p class="page-subtitle" style="margin-bottom:16px;">
      Todos os assets seguem o padrao abaixo para garantir consistencia e rastreabilidade.
    </p>
    <table class="naming-table">
      <thead>
        <tr>
          <th>Campo</th>
          <th>Descricao</th>
          <th>Exemplo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>brand</code></td>
          <td>Nome da marca (kebab-case)</td>
          <td>grupo-csv, axiacare, thera</td>
        </tr>
        <tr>
          <td><code>asset-type</code></td>
          <td>Tipo do asset</td>
          <td>logo, avatar, creative, wallpaper</td>
        </tr>
        <tr>
          <td><code>orientation</code></td>
          <td>Orientacao (logos)</td>
          <td>horizontal, vertical</td>
        </tr>
        <tr>
          <td><code>color-scheme</code></td>
          <td>Esquema de cor</td>
          <td>full-color, monochrome, blue, purple</td>
        </tr>
        <tr>
          <td><code>polarity</code></td>
          <td>Polaridade</td>
          <td>positive, negative</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size:0.82rem; color:#94a3b8; margin-top:12px; font-style:italic;">
      Padrao completo: <code>{brand}_{asset-type}_{orientation}_{color-scheme}_{polarity}.{ext}</code>
    </p>
  </div>

  <div class="frame">
    <h2 class="section-title">Regras de Uso</h2>
    <ul class="rules-list">
      <li>
        <span class="rule-icon rule-do">S</span>
        <span>Use sempre a versao <strong>positive</strong> em fundos claros e <strong>negative</strong> em fundos escuros.</span>
      </li>
      <li>
        <span class="rule-icon rule-do">S</span>
        <span>Prefira SVG para web e PNG para uso geral. JPG apenas quando transparencia nao for necessaria.</span>
      </li>
      <li>
        <span class="rule-icon rule-do">S</span>
        <span>Mantenha a proporcao original. Nunca distorca, estique ou comprima os logotipos.</span>
      </li>
      <li>
        <span class="rule-icon rule-do">S</span>
        <span>Respeite a area de protecao minima ao redor do logotipo (equivalente a altura do simbolo).</span>
      </li>
      <li>
        <span class="rule-icon rule-dont">N</span>
        <span>Nao altere as cores oficiais dos logotipos. Use apenas as variantes fornecidas.</span>
      </li>
      <li>
        <span class="rule-icon rule-dont">N</span>
        <span>Nao adicione sombras, bordas, efeitos ou texturas sobre os logotipos.</span>
      </li>
      <li>
        <span class="rule-icon rule-dont">N</span>
        <span>Nao use a versao negativa (branca) sobre fundos claros. A logo ficara invisivel.</span>
      </li>
      <li>
        <span class="rule-icon rule-dont">N</span>
        <span>Nao recrie ou redesenhe os logotipos. Use exclusivamente os arquivos oficiais deste repositorio.</span>
      </li>
    </ul>
  </div>

  <div class="frame">
    <h2 class="section-title">Documentos de Referencia</h2>
    <a href="/visual-identity/_brand-guidelines/grupo-csv_brand-guide_visual-identity-presentation.pdf" download class="file-item">
      <span class="file-ext">PDF</span>
      <span class="file-name">Apresentacao de Identidade Visual</span>
    </a>
    <a href="/visual-identity/_brand-guidelines/grupo-csv_brand-guide_color-guide.pdf" download class="file-item">
      <span class="file-ext">PDF</span>
      <span class="file-name">Guia de Cores</span>
    </a>
    <a href="/visual-identity/_brand-guidelines/grupo-csv_brand-guide_pop-materials.pdf" download class="file-item">
      <span class="file-ext">PDF</span>
      <span class="file-name">Materiais POP</span>
    </a>
  </div>

  <div style="text-align:center; margin-bottom:24px;">
    <a href="/_infra/assets/" class="back-link">Voltar a Central de Assets</a>
  </div>

  <div class="page-footer">
    <strong>Brand Guidelines — Grupo CSV</strong>
    <div class="small">Diretrizes oficiais de identidade visual do ecossistema.</div>
  </div>
</div>
