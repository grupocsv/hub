import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Grupo CSV | Hub",
  description: "Infraestrutura Cognitiva e Operacional",
  lang: 'pt-BR',
  cleanUrls: true,
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap', rel: 'stylesheet' }]
  ],

  themeConfig: {
    logo: { src: '/csv-header-logo.png', alt: 'Grupo CSV' },
    siteTitle: false,

    nav: [
      { text: 'AxiaCare', link: '/axiacare/mandate' },
      { text: 'MedValor', link: '/medvalor/mandate' },
      { text: 'TheraTech', link: '/thera/mandate' },
      { text: 'Assets', link: '/csv-core/assets' },
      { text: 'Founder', link: '/csv-core/founder' },
    ],

    sidebar: {
      '/axiacare/': [
        {
          text: 'AxiaCare®',
          items: [
            { text: 'Mandato Institucional', link: '/axiacare/mandate' },
            // Futuros documentos aparecerão aqui
          ]
        }
      ],
      '/medvalor/': [
        {
          text: 'MedValor®',
          items: [
            { text: 'Mandato Institucional', link: '/medvalor/mandate' },
          ]
        }
      ],
      '/thera/': [
        {
          text: 'TheraTech®',
          items: [
            { text: 'Mandato Institucional', link: '/thera/mandate' },
          ]
        }
      ],
      '/csv-core/': [
        {
          text: 'Núcleo Estratégico',
          items: [
            { text: 'Playbook do Hub', link: '/csv-core/playbook-hub' },
            { text: 'Definição Canônica', link: '/csv-core/definition' },
            { text: 'Sistema de Identidade', link: '/csv-core/identity-system' },
            { text: 'Central de Assets', link: '/csv-core/assets' },
            { text: 'Founder Profile', link: '/csv-core/founder' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/grupocsv/hub' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/guilhermethome/' }
    ],

    footer: {
      message: 'Operando em modo de alta integridade.',
      copyright: '© 2026 Grupo CSV. Cuidados em Saúde com Valor.'
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Pesquisar',
            buttonAriaLabel: 'Pesquisar'
          },
          modal: {
            noResultsText: 'Nenhum resultado para',
            resetButtonTitle: 'Limpar',
            footer: {
              selectText: 'para selecionar',
              navigateText: 'para navegar',
              closeText: 'para fechar'
            }
          }
        }
      }
    }
  }
})
