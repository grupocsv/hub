import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Hub Grupo CSV",
  description: "Portal central do ecossistema Grupo CSV - AxiaCare®, MedValor®, Thera®",
  lang: 'pt-BR',
  appearance: 'dark',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicons/apple-touch-icon.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicons/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicons/favicon-16x16.png' }],
    ['meta', { property: 'og:title', content: 'Hub Grupo CSV | Portal Central' }],
    ['meta', { property: 'og:description', content: 'Ecossistema de soluções em saúde: AxiaCare®, MedValor®, Thera®' }],
    ['meta', { property: 'og:image', content: 'https://hub.grupocsv.com/og/og_hub.png' }],
    ['meta', { property: 'og:url', content: 'https://hub.grupocsv.com' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://hub.grupocsv.com/og/og_hub.png' }],
  ],

  themeConfig: {
    logo: {
      light: 'https://assets.grupocsv.com/logos/grupo-csv/horizontal-positivo-transparente.png',
      dark: 'https://assets.grupocsv.com/logos/grupo-csv/horizontal-negativo-transparente.png',
      alt: 'Grupo CSV',
    },
    siteTitle: 'Hub Grupo CSV',

    nav: [
      { text: 'In\u00EDcio', link: '/' },
      {
        text: 'Empresas',
        items: [
          { text: 'AxiaCare\u00AE', link: '/axia/' },
          { text: 'MedValor\u00AE', link: '/medvalor/' },
          { text: 'Thera', link: '/thera/' },
        ]
      },
      {
        text: 'Parceiros',
        items: [
          { text: 'Unimed GV', link: '/unimed/' },
          { text: 'Unihealth GV', link: '/unihealth/' },
          { text: 'ICDS', link: '/icds/' },
        ]
      },
      {
        text: 'Produtos',
        items: [
          { text: 'Compass™', link: '/compass/' },
          { text: 'Signal™', link: '/signal/' },
          { text: 'CMM', link: 'https://cmm.grupocsv.com' },
          { text: 'Themis™', link: 'https://themis.grupocsv.com' },
          { text: 'Deck™', link: 'https://deck.grupocsv.com' },
          { text: 'Relay™', link: 'https://relay.axcare.com.br' },
          { text: 'RTAV™', link: 'https://rtav.axcare.app' },
          { text: 'Panta™', link: '/panta/' },
          { text: 'Discovery™', link: 'https://discovery.axcare.app' },
        ]
      },
      {
        text: 'Governan\u00E7a',
        items: [
          { text: 'Compliance', link: '/compliance/' },
          { text: 'Infraestrutura', link: '/_infra/' },
          { text: 'Fundador', link: '/founder/' },
        ]
      },
    ],

    sidebar: {
      '/compass/': [
        {
          text: 'Compass\u2122',
          items: [
            { text: 'Central Compass\u2122', link: '/compass/' },
            {
              text: '2026',
              collapsed: false,
              items: [
                { text: '001 — Metas ACO', link: '/compass/edicoes/2026/001/compass' },
                { text: '002 — Prostatectomia Rob\u00f3tica', link: '/compass/edicoes/2026/002/compass' },
                { text: '003 — Fototerapia Neonatal', link: '/compass/edicoes/2026/003/compass' },
                { text: '004 — NATS na Sa\u00fade Suplementar', link: '/compass/edicoes/2026/004/compass' },
                { text: '005 — Saving Cirúrgico Estrutural', link: '/compass/edicoes/2026/005/compass' },
                { text: '006 — Oftalmologia na Saúde Suplementar', link: '/compass/edicoes/2026/006/compass' },
                { text: '007 — Desperdício na Saúde Suplementar', link: '/compass/edicoes/2026/007/compass' },
              ]
            },
          ]
        }
      ],
      '/signal/': [
        {
          text: 'Signal\u2122',
          items: [
            { text: 'Central Signal\u2122', link: '/signal/' },
            {
              text: '2026',
              collapsed: false,
              items: [
              { text: 'S31 — 27-31 Jul', link: '/signal/edicoes/2026/S31/' },
              { text: 'S30 — 20-24 Jul', link: '/signal/edicoes/2026/S30/' },
              { text: 'S29 — 13-17 Jul', link: '/signal/edicoes/2026/S29/' },
              { text: 'S28 — 06-10 Jul', link: '/signal/edicoes/2026/S28/' },
              { text: 'S27 — 29 Jun-03 Jul', link: '/signal/edicoes/2026/S27/' },
              { text: 'S26 — 22-26 Jun', link: '/signal/edicoes/2026/S26/' },
              { text: 'S25 — 16-20 Jun', link: '/signal/edicoes/2026/S25/' },
              { text: 'S24 — 08-12 Jun', link: '/signal/edicoes/2026/S24/' },
              { text: 'S23 — 02-06 Jun', link: '/signal/edicoes/2026/S23/signal' },
              { text: 'S22 — 25-29 Mai', link: '/signal/edicoes/2026/S22/signal' },
                { text: 'S21 — 18-22 Mai', link: '/signal/edicoes/2026/S21/signal' },
                { text: 'S20 — 11-17 Mai', link: '/signal/edicoes/2026/S20/signal' },
                { text: 'S19 — 04-10 Mai', link: '/signal/edicoes/2026/S19/signal' },
                { text: 'S17 — 20-26 Abr', link: '/signal/edicoes/2026/S17/signal' },
                { text: 'S16 — 13-19 Abr', link: '/signal/edicoes/2026/S16/signal' },
                { text: 'S15 — 06-12 Abr', link: '/signal/edicoes/2026/S15/signal' },
                { text: 'S14 — 30 Mar-05 Abr', link: '/signal/edicoes/2026/S14/signal' },
                { text: 'S13 — 23-27 Mar', link: '/signal/edicoes/2026/S13/signal' },
                { text: 'S12 — 16-20 Mar', link: '/signal/edicoes/2026/S12/signal' },
                { text: 'S11 — 9-13 Mar', link: '/signal/edicoes/2026/S11/signal' },
                { text: 'S10 — 2-6 Mar', link: '/signal/edicoes/2026/S10/signal' },
                { text: 'S09 — 23-27 Fev', link: '/signal/edicoes/2026/S09/signal' },
                { text: 'S08 — 16-20 Fev', link: '/signal/edicoes/2026/S08/signal' },
              ]
            },
            { text: 'Padr\u00e3o Editorial', link: '/signal/policies/padrao-editorial' },
            { text: 'Guia Operacional', link: '/signal/skills/gerar-signal' },
            { text: 'Template', link: '/signal/templates/signal_template' },
          ]
        }
      ],
      '/_infra/': [
        {
          text: 'Infraestrutura',
          items: [
            { text: 'Vis\u00e3o Geral', link: '/_infra/' },
            { text: 'Central de Documentos', link: '/_infra/central-documentos' },
            { text: 'Arquitetura T\u00e9cnica', link: '/_infra/technical-architecture' },
            { text: 'AI Search', link: '/_infra/ai-search' },
            { text: 'P\u00e1ginas P\u00fablicas', link: '/_infra/public-pages' },
          ]
        },
        {
          text: 'Ferramentas',
          collapsed: false,
          items: [
            { text: 'Compass\u2122', link: '/_infra/ferramentas/compass' },
            { text: 'Signal\u2122', link: '/_infra/ferramentas/signal' },
            { text: 'CMM', link: '/_infra/ferramentas/cmm' },
            { text: 'Themis\u2122', link: '/_infra/ferramentas/themis' },
            { text: 'Deck\u2122', link: '/_infra/ferramentas/deck' },
            { text: 'Relay\u2122', link: '/_infra/ferramentas/relay' },
            { text: 'RTAV\u2122', link: '/_infra/ferramentas/rtav' },
            { text: 'Panta\u2122', link: '/_infra/ferramentas/panta' },
            { text: 'Discovery™', link: '/_infra/ferramentas/discovery' },
          ]
        },
        {
          text: 'CSV Core',
          collapsed: false,
          items: [
            { text: 'Defini\u00e7\u00e3o', link: '/_infra/csv-core/definition' },
            { text: 'Sistema de Identidade', link: '/_infra/csv-core/identity-system' },
            { text: 'Assets', link: '/_infra/csv-core/assets' },
            { text: 'Guia de Logos', link: '/_infra/assets/logo-usage-guide' },
            { text: 'Playbook Hub', link: '/_infra/csv-core/playbook-hub' },
            { text: 'Fundador', link: '/_infra/csv-core/founder' },
          ]
        },
        {
          text: 'Mandatos',
          collapsed: true,
          items: [
            { text: 'AxiaCare\u00AE', link: '/_infra/axiacare/mandate' },
            { text: 'MedValor\u00AE', link: '/_infra/medvalor/mandate' },
            { text: 'Thera', link: '/_infra/thera/mandate' },
          ]
        },
        {
          text: 'Padr\u00f5es',
          collapsed: true,
          items: [
            { text: 'Padr\u00e3o de Footer', link: '/_infra/standards/footer' },
            { text: 'Arquivo de P\u00e1ginas', link: '/_infra/archive/' },
          ]
        },
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/grupocsv/hub' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/gui-thome' }
    ],

    search: {
      provider: 'local'
    },

    outline: {
      label: 'Nesta p\u00e1gina'
    },

    docFooter: {
      prev: 'Anterior',
      next: 'Pr\u00f3ximo'
    },

    darkModeSwitchLabel: 'Tema',
    returnToTopLabel: 'Voltar ao topo',
    sidebarMenuLabel: 'Menu',
  }
})
