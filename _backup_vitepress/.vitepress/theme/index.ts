import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import { useRoute, useRouter } from 'vitepress'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => {
        const route = useRoute()
        if (route.path === '/') return null // Não mostrar na home

        return h('div', { 
          style: 'margin-bottom: 24px; display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--vp-c-brand); font-weight: 500;',
          onClick: () => window.history.back()
        }, [
          h('span', '←'),
          h('span', 'Voltar')
        ])
      }
    })
  }
}
