// Escopos de build do Hub (plano de seguranca do Hub, 27/11/2026).
//
// Sem HUB_BUILD_SCOPE o build e exatamente o de hoje (GitHub Pages).
// Com HUB_BUILD_SCOPE, cada escopo gera so as suas paginas, com pasta de
// arquivos e indice de busca proprios, para que quem tem acesso a um escopo
// nao receba o texto de outro:
//   main    portais e demais paginas      arquivos em /assets/
//   infra   /_infra/                       arquivos em /_infra/_static/
//   founder /founder/                      arquivos em /founder/_static/
//   public  /compass/ e /signal/           arquivos em /_public/_static/
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SCOPE_OWNED: Record<string, string[]> = {
  infra: ['_infra'],
  founder: ['founder'],
  public: ['compass', 'signal'],
}

export const SCOPE_ASSETS: Record<string, string> = {
  main: 'assets',
  infra: '_infra/_static',
  founder: 'founder/_static',
  public: '_public/_static',
}

const docsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function ownerOf(pathname: string): string {
  const first = pathname.replace(/^\/+/, '').split('/')[0]
  for (const [scope, dirs] of Object.entries(SCOPE_OWNED)) {
    if (dirs.includes(first)) return scope
  }
  return 'main'
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
    vite: { define: { __HUB_SCOPE__: JSON.stringify(scope) } },
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
