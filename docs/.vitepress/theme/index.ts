import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp() {
    // Mitigação de chunk obsoleto pós-deploy (mitigação oficial do Vite:
    // https://vite.dev/guide/troubleshooting — "Failed to fetch dynamically
    // imported module"). O site faz vários deploys por dia e todos os assets
    // são servidos com cache-control: max-age=600; na janela pós-deploy a
    // navegação SPA pode pedir um chunk com hash antigo e falhar (erro de
    // "MIME type", relatado como "415"), exigindo hard refresh manual.
    // Aqui, ao detectar a falha de preload, recarregamos a página UMA vez
    // (guarda em sessionStorage evita loop de reload).
    if (typeof window !== 'undefined') {
      window.addEventListener('vite:preloadError', (event) => {
        const KEY = 'vp-reloaded-on-preload-error'
        if (sessionStorage.getItem(KEY) === '1') return // já recarregou: não entrar em loop
        sessionStorage.setItem(KEY, '1')
        event.preventDefault()
        window.location.reload()
      })
      // Navegação bem-sucedida limpa a guarda para permitir futura recuperação
      window.addEventListener('load', () => {
        setTimeout(() => sessionStorage.removeItem('vp-reloaded-on-preload-error'), 5000)
      })
    }
  }
} satisfies Theme
