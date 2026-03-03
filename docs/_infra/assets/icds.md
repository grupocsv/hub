---
layout: page
title: "Assets ICDS"
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
  color: #1B3A5C;
  border: none;
}
.dark .page-title { color: #1B3A5C; filter: brightness(1.4); }
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
  color: #1B3A5C;
  text-decoration: none;
  font-weight: 600;
}
.dl-link:hover { text-decoration: underline; }
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 10px;
  background: #1B3A5C;
  color: white !important;
  text-decoration: none !important;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.back-link:hover { background: #2C5F8A; transform: translateY(-2px); }
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
.rules-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-top: 12px;
}
.rules-table th, .rules-table td {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  text-align: left;
}
.rules-table th {
  background: #f0f2f5;
  font-weight: 600;
  color: #2d3445;
}
.dark .rules-table th { background: var(--vp-c-bg-alt); color: var(--vp-c-text-1); }
.dark .rules-table td { border-color: var(--vp-c-divider); }
</style>

<div class="assets-page">
  <div class="frame">
    <h1 class="page-title">Assets ICDS</h1>
    <p class="page-subtitle">
      Instituto de Cooperacao para o Desenvolvimento da Saude. Entidade Filantropica e Gestora Assistencial.<br>
      Cor primaria: azul marinho (#1B3A5C). Cor secundaria: azul medio (#2C5F8A).
    </p>
  </div>

  <div class="frame">
    <h2 class="section-title">Logotipos</h2>
    <p class="page-subtitle">Tres variantes oficiais do logo horizontal ICDS.</p>
    <div class="logo-grid">
      <div class="logo-item">
        <div class="preview-dark" style="background:#1B3A5C;">
          <img src="/visual-identity/icds/logo/png/icds_horizontal_fundo_azul.png" alt="ICDS Horizontal Fundo Azul" loading="lazy" />
        </div>
        <div class="logo-label">Horizontal / Fundo azul institucional</div>
        <a href="/visual-identity/icds/logo/png/icds_horizontal_fundo_azul.png" download class="dl-link">Download PNG</a>
      </div>
      <div class="logo-item">
        <div class="preview-light">
          <img src="/visual-identity/icds/logo/png/icds_horizontal_sem_fundo_positivo.png" alt="ICDS Horizontal Positivo" loading="lazy" />
        </div>
        <div class="logo-label">Horizontal / Sem fundo / Positivo (fundo claro)</div>
        <a href="/visual-identity/icds/logo/png/icds_horizontal_sem_fundo_positivo.png" download class="dl-link">Download PNG</a>
      </div>
      <div class="logo-item">
        <div class="preview-dark">
          <img src="/visual-identity/icds/logo/png/icds_horizontal_sem_fundo_negativo.png" alt="ICDS Horizontal Negativo" loading="lazy" />
        </div>
        <div class="logo-label">Horizontal / Sem fundo / Negativo (fundo escuro)</div>
        <a href="/visual-identity/icds/logo/png/icds_horizontal_sem_fundo_negativo.png" download class="dl-link">Download PNG</a>
      </div>
    </div>
  </div>

  <div class="frame">
    <h2 class="section-title">Regras de Aplicacao</h2>
    <p class="page-subtitle">Seguem as mesmas regras de aplicacao das demais marcas do ecossistema Grupo CSV.</p>
    <table class="rules-table">
      <thead>
        <tr>
          <th>Contexto</th>
          <th>Variante recomendada</th>
          <th>Arquivo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Navbar / Header web</td>
          <td>Horizontal, fundo azul</td>
          <td>icds_horizontal_fundo_azul.png</td>
        </tr>
        <tr>
          <td>Footer (inline, fundo claro)</td>
          <td>Horizontal, positivo</td>
          <td>icds_horizontal_sem_fundo_positivo.png</td>
        </tr>
        <tr>
          <td>Hero de pagina</td>
          <td>Horizontal, fundo azul</td>
          <td>icds_horizontal_fundo_azul.png</td>
        </tr>
        <tr>
          <td>Cabecalho de documento</td>
          <td>Horizontal, positivo</td>
          <td>icds_horizontal_sem_fundo_positivo.png</td>
        </tr>
        <tr>
          <td>Fundo escuro (dark mode, slide)</td>
          <td>Horizontal, negativo</td>
          <td>icds_horizontal_sem_fundo_negativo.png</td>
        </tr>
        <tr>
          <td>Card na homepage (fundo claro)</td>
          <td>Horizontal, fundo azul</td>
          <td>icds_horizontal_fundo_azul.png</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="text-align:center; margin-bottom:24px;">
    <a href="/_infra/assets/" class="back-link">Voltar a Central de Assets</a>
  </div>
  <div class="page-footer">
    <strong>ICDS — Parceiro Grupo CSV</strong>
    <div class="small">Identidade visual oficial. Uso conforme brand guidelines.</div>
  </div>
</div>
