---
layout: home

hero:
  name: "Grupo CSV"
  text: "Hub Central"
  tagline: Cuidados em Saúde com Valor
  image:
    src: /logos/marca_csv.png
    alt: Grupo CSV
  actions:
    - theme: brand
      text: Empresas do Grupo
      link: '#empresas'
    - theme: alt
      text: Compliance
      link: /compliance/
    - theme: alt
      text: Infraestrutura
      link: /_infra/
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #196396 0%, #2DBF7F 100%);
  --vp-home-hero-image-background-image: linear-gradient(135deg, #196396 20%, #2DBF7F 80%);
  --vp-home-hero-image-filter: blur(44px);
}

.VPNavBarTitle .logo {
  height: 36px !important;
  width: auto !important;
}

.VPHero .image-bg {
  opacity: 0.8;
}

.VPHero .image-src {
  max-width: 280px !important;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.card {
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
  display: block;
}

.card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
}

.card-logo {
  height: 56px;
  margin-bottom: 20px;
  object-fit: contain;
}

.card-logo-only {
  height: 64px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.card-title {
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 12px;
  color: var(--vp-c-text-1);
}

.card-desc {
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.divider {
  height: 1px;
  background: var(--vp-c-divider);
  margin: 60px auto;
  max-width: 200px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--vp-c-text-1);
}

.section-desc {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  margin-bottom: 32px;
  max-width: 700px;
}

.partner-card {
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s;
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.partner-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
}
</style>

<div id="empresas"></div>

## Empresas do Grupo {#empresas}

<p class="section-desc">O Grupo CSV opera através de três empresas especializadas, cada uma focada em uma dimensão essencial da transformação em saúde:</p>

<div class="card-grid">
  <a href="/axia/" class="card">
    <img src="/logos/marca_axia.png" alt="AxiaCare" class="card-logo">
    <div class="card-title">AxiaCare®</div>
    <div class="card-desc">Consultoria estratégica, governança clínica e operações de saúde. Transformamos organizações através de inteligência aplicada.</div>
  </a>

  <a href="/medvalor/" class="card">
    <img src="/logos/marca_medvalor.png" alt="MedValor" class="card-logo">
    <div class="card-title">MedValor®</div>
    <div class="card-desc">Educação executiva e capacitação estratégica para líderes em saúde. Metodologias práticas e conteúdo de alta qualidade.</div>
  </a>

  <a href="/thera/" class="card">
    <img src="/logos/marca_thera.png" alt="TheraTech" class="card-logo">
    <div class="card-title">TheraTech®</div>
    <div class="card-desc">Fábrica de software, inteligência artificial e plataformas SaaS. Tecnologia desenvolvida para simplificar a saúde.</div>
  </a>
</div>

<div class="divider"></div>

## Instituições Parceiras

<p class="section-desc">Entregáveis e ferramentas desenvolvidas para nossos principais parceiros:</p>

<div class="card-grid-2">
  <a href="/unimed/" class="partner-card">
    <img src="https://i.imgur.com/prZGWXK.png" alt="Unimed Governador Valadares" class="card-logo-only">
  </a>

  <a href="/unihealth/" class="partner-card">
    <img src="https://i.imgur.com/ac2rphe.png" alt="Unihealth" class="card-logo-only">
  </a>
</div>

<div class="divider"></div>

## Governança e Compliance

<div class="card-grid">
  <a href="/compliance/" class="card">
    <div class="card-title">Central de Compliance</div>
    <div class="card-desc">Políticas de privacidade, termos de uso, código de conduta e documentação de integridade do Grupo CSV e suas empresas.</div>
  </a>
</div>

<div class="divider"></div>

## Fundador

<div class="card-grid">
  <a href="/founder/" class="card">
    <div class="card-title">Guilherme Thomé</div>
    <div class="card-desc">Médico executivo e consultor. Superintendente Unimed/ICDS. Especialista em Value-Based Healthcare. Fundador do Grupo CSV.</div>
  </a>
</div>

<div class="divider"></div>

## Infraestrutura Cognitiva

<p class="section-desc">Documentação técnica e recursos para desenvolvedores e agentes de IA:</p>

<div class="card-grid">
  <a href="/_infra/" class="card">
    <div class="card-title">Documentação Técnica</div>
    <div class="card-desc">Playbooks, system identity, definições canônicas e mandates para integração com AI.</div>
  </a>

  <a href="https://github.com/grupocsv/hub" class="card" target="_blank">
    <div class="card-title">Repositório GitHub</div>
    <div class="card-desc">Código fonte, assets e documentação completa do ecossistema.</div>
  </a>
</div>

<div class="divider"></div>

<div style="text-align: center; padding: 40px 20px;">

**Grupo CSV** — AxiaCare® · MedValor® · TheraTech®

[contato@grupocsv.com](mailto:contato@grupocsv.com) · [compliance@grupocsv.com](mailto:compliance@grupocsv.com)

</div>
