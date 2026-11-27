// Escopos de build do Hub (plano de seguranca do Hub, 27/11/2026).
//
// Sem HUB_BUILD_SCOPE o build e exatamente o de hoje (GitHub Pages).
// Com HUB_BUILD_SCOPE, cada escopo gera so as suas paginas, com pasta de
// arquivos e indice de busca proprios, para que quem tem acesso a um escopo
// nao receba o texto de outro. A lista de escopos fica em scopes.json, lida
// tambem pelo tema e pelos scripts de scripts/cloudflare.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const scopes = JSON.parse(fs.readFileSync(path.join(here, 'scopes.json'), 'utf8'))

export const SCOPE_OWNED: Record<string, string[]> = scopes.owned
export const SCOPE_ASSETS: Record<string, string> = scopes.assets

// Pasta de primeiro nivel -> escopo, usado pelo tema para decidir quando a
// navegacao precisa recarregar a pagina.
export const SCOPE_OWNERS: Record<string, string> = Object.fromEntries(
  Object.entries(SCOPE_OWNED).flatMap(([scope, dirs]) => dirs.map((d) => [d, scope])),
)

const docsDir = path.resolve(here, '..')

export function ownerOf(pathname: string): string {
  const first = pathname.replace(/^\/+/, '').split('/')[0]
  return SCOPE_OWNERS[first] ?? 'main'
}

export function currentScope(): string | undefined {
  const scope = process.env.HUB_BUILD_SCOPE
  if (!scope) return undefined
  if (!(scope in SCOPE_ASSETS)) {
    throw new Error(`HUB_BUILD_SCOPE desconhecido: ${scope}`)
  }
  return scope
}

function srcExcludeFor(scope: string): string[] {
  const entries = fs
    .readdirSync(docsDir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.') && e.name !== 'public')
  const owned = scope === 'main' ? null : SCOPE_OWNED[scope]
  const foreign = Object.values(SCOPE_OWNED).flat()
  // As paginas .md dentro de docs/public ficam com o escopo main.
  const exclude: string[] = owned ? ['public/**'] : []
  for (const e of entries) {
    const top = e.name
    const keep = owned ? owned.includes(top) : !foreign.includes(top)
    if (!keep) exclude.push(e.isDirectory() ? `${e.name}/**` : e.name)
  }
  return exclude
}

export function scopeOverrides(): Record<string, unknown> {
  const scope = currentScope()
  if (!scope) return {}
  return {
    srcExclude: srcExcludeFor(scope),
    assetsDir: SCOPE_ASSETS[scope],
    outDir: `.vitepress/dist-${scope}`,
    // Links para paginas de outro escopo existem no site final; aqui so
    // nao estao neste build.
    ignoreDeadLinks: [
      (url: string) => ownerOf(url.startsWith('/') ? url : `/${url}`) !== scope,
    ],
    vite: {
      define: {
        __HUB_SCOPE__: JSON.stringify(scope),
        __HUB_SCOPE_OWNERS__: JSON.stringify(SCOPE_OWNERS),
      },
    },
  }
}

// Menu lateral: cada escopo leva so as entradas das proprias paginas, para
// que o site de um escopo nao liste titulos e enderecos de outro.
export function scopeSidebar<T extends Record<string, unknown>>(sidebar: T): T {
  const scope = currentScope()
  if (!scope) return sidebar
  return Object.fromEntries(
    Object.entries(sidebar).filter(([prefix]) => ownerOf(prefix) === scope),
  ) as T
}
