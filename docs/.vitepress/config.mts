import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Hub Grupo CSV",
  description: "Portal central do ecossistema Grupo CSV - AxiaCare®, MedValor®, Thera®",
  lang: 'pt-BR',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicons/apple-touch-icon.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicons/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicons/favicon-16x16.png' }],
    ['meta', { property: 'og:title', content: 'Hub Grupo CSV | Portal Central' }],
    ['meta', { property: 'og:description', content: 'Ecossistema de soluções em saúde: AxiaCare®, MedValor®, Thera®' }],
    ['meta', { property: 'og:image', content: '/logos/marca_csv.png' }],
    ['meta', { property: 'og:url', content: 'https://hub.grupocsv.com' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    logo: '/logos/marca_csv.png',
    siteTitle: 'Hub Grupo CSV',

    nav: [
      { text: 'Início', link: '/' },
      {
        text: 'Empresas',
        items: [
          { text: 'AxiaCare', link: '/axia/' },
          { text: 'MedValor', link: '/medvalor/' },
          { text: 'Thera', link: '/thera/' },
        ]
      },
      {
        text: 'Parceiros',
        items: [
          { text: 'Unimed GV', link: '/unimed/' },
          { text: 'Unihealth', link: '/unihealth/' },
        ]
      },
      { text: 'Compliance', link: '/compliance/' },
      { text: 'Fundador', link: '/founder/' },
      { text: 'Infra', link: '/_infra/' },
    ],

    sidebar: {
      '/_infra/': [
        {
          text: 'Infraestrutura Cognitiva',
          items: [
            { text: 'Visão Geral', link: '/_infra/' },
            { text: 'CSV Core', link: '/_infra/csv-core/' },
            { text: 'AxiaCare Mandate', link: '/_infra/axiacare/' },
            { text: 'MedValor Mandate', link: '/_infra/medvalor/' },
            { text: 'Thera Mandate', link: '/_infra/thera/' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/grupocsv/hub' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/gui-thome' }
    ],

    footer: {
      message: 'Cuidados em Saúde com Valor',
      copyright: '© 2026 Grupo CSV. Todos os direitos reservados. | AxiaCare® • MedValor® • Thera®'
    },

    search: {
      provider: 'local'
    },

    outline: {
      label: 'Nesta página'
    },

    docFooter: {
      prev: 'Anterior',
      next: 'Próximo'
    },

    darkModeSwitchLabel: 'Tema',
    returnToTopLabel: 'Voltar ao topo',
    sidebarMenuLabel: 'Menu',
  }
})
