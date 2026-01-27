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
      { text: 'Compliance', link: '/compliance/' },
      { text: 'Assets', link: '/csv-core/assets' },
      { text: 'Founder', link: '/csv-core/founder' },
    ],
    sidebar: {
      '/axiacare/': [
        {
          text: 'AxiaCare®',
          items: [
            { text: 'Mandato Institucional', link: '/axiacare/mandate' },
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
      ],
      '/compliance/': [
        {
          text: 'Central de Compliance',
          items: [
            { text: 'Visão Geral', link: '/compliance/' },
            { text: 'Política de Privacidade', link: '/compliance/privacidade' },
            { text: 'Termos de Uso', link: '/compliance/termos' },
            { text: 'Política de Cookies', link: '/compliance/cookies' },
            { text: 'Autorização de Parceria', link: '/compliance/autorizacao-parceria' },
          ]
        },
        {
          text: 'Integridade e Conduta',
          items: [
            { text: 'Código de Ética e Conduta', link: '/compliance/codigo-de-conduta' },
            { text: 'Política de Brindes', link: '/compliance/brindes' },
            { text: 'Política Anticorrupção', link: '/compliance/anticorrupcao' },
            { text: 'Relacionamento com Terceiros', link: '/compliance/terceiros' },
            { text: 'Cláusulas de Integridade', link: '/compliance/integridade' },
          ]
        },
        {
          text: 'Por Empresa',
          items: [
            { text: 'AxiaCare – Privacidade', link: '/compliance/axiacare/privacidade' },
            { text: 'AxiaCare – Termos', link: '/compliance/axiacare/termos' },
            { text: 'MedValor – Privacidade', link: '/compliance/medvalor/privacidade' },
            { text: 'MedValor – Termos', link: '/compliance/medvalor/termos' },
            { text: 'Thera – Privacidade', link: '/compliance/thera/privacidade' },
            { text: 'Thera – Termos', link: '/compliance/thera/termos' },
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
