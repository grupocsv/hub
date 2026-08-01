# Skill: Criar Pagina Publica em /p/ (LEGADO — somente manutenção)

> **AVISO — FLUXO LEGADO.** O fluxo `/p/` descrito nesta skill (cópia estática em `/p/{slug}/index.html` + `/p/registry.json`, servida pelo GitHub Pages) foi **descontinuado para novas publicações** (ver `docs/_infra/public-pages.md`, seção "Legado"). Use este documento **apenas para manter páginas que já existem em `/p/`** (correções, desativação, histórico).
>
> **Para criar NOVAS páginas públicas, use o Open Pages** (`open.grupocsv.com` — Worker `csv-open-pages` + R2 + KV, com toggle instantâneo ativo/inativo). Três vias de publicação:
>
> 1. **Aba "Links Públicos" do `/admin/index.html`:** o botão **"Nova Página"** abre o modal "Publicar Nova Página" (slug, título, descrição, upload de arquivos), que envia os arquivos para a API do Worker (`POST /api/upload`). Há um bloco para `open.grupocsv.com` e outro para `hub.unimedgv.com`.
> 2. **Painel dedicado:** `https://open.grupocsv.com/_admin/` (upload, listagem, toggle ativo/inativo, cópia rápida do link).
> 3. **Tools MCP do Extensio:** `open_page_publish` (publica ou atualiza uma página a partir do HTML — parâmetros `slug`, `html_content`, `title`, `description`) e `open_page_list` (lista as páginas com slug, título, URL e status).
>
> Referência completa da arquitetura: `docs/_infra/public-pages.md`.

## Sincronização com o menu do portal (extras.json)

Os menus dos portais **Unimed, Unihealth, ICDS e 2iM** são gerados automaticamente: a cada push, o CI (`.github/workflows/deploy.yml`) roda `scripts/generate-portal-tools.py`, que gera `{portal}/tools.json` a partir dos `<title>` dos arquivos `.html` do portal (exceto `index.html`; páginas com `<meta name="hub-menu" content="hidden">` ficam de fora).

Páginas públicas (Open Pages ou legado `/p/`) não são arquivos `.html` do portal, então entram no menu por **entrada manual em `{portal}/extras.json`**:

```json
[
  {
    "title": "TEA: Data Set Indicadores",
    "href": "/p/tea-dataset/",
    "created": "2026-02-15T00:00:00+00:00",
    "lastModified": "2026-02-15T00:00:00+00:00"
  }
]
```

- Campos: `title` e `href` (essenciais); `created` e `lastModified` (opcionais — `lastModified` tem default `2026-01-01T00:00:00+00:00`; `created` tem default igual ao `lastModified` informado, ou `2026-01-01` se ambos ausentes).
- No próximo push, a entrada aparece no `{portal}/tools.json` com `"external": true` e é renderizada nos menus — os índices dos portais (`docs/{portal}/index.md`) e a home (`docs/index.md`) fazem fetch de `tools.json` em runtime.
- Exemplo real: `icds/extras.json` aponta para `/p/tea-dataset/` e para a URL externa `https://rd-icds.axcare.app`.

## Slot do hub-auth em páginas de portal autenticado

Ao criar páginas novas dentro de um portal autenticado (a página de origem de uma futura página pública), inclua no header o slot do widget de logout do `hub-auth.js` (v2.5.0):

```html
<span id="hub-auth-slot"></span>
```

(ou qualquer elemento com `[data-hub-auth-slot]`). Para headers escuros, adicione `data-hub-auth-theme="dark"` ao slot. O slot tem precedência sobre os seletores automáticos e evita o fallback `position:fixed`, que pode sobrepor botões no canto superior direito. Páginas sem slot mantêm o comportamento anterior (retrocompatível). Detalhes no cabeçalho de `scripts/hub-auth.js`.

---

**Objetivo:** Publicar uma cópia pública de uma página de portal protegido, tornando-a acessível sem autenticação em `hub.grupocsv.com/p/{slug}/`.

**Quando usar (legado):** Somente para manutenção de páginas que já existem em `/p/`. Para novas páginas públicas, use o Open Pages (ver aviso acima).

---

## Contexto

O Hub possui portais protegidos por autenticação via Worker `csv-auth`. Cada portal (`/unimed/`, `/unihealth/`, `/icds/`, `/2im/`, `/axia/`, `/thera/`, `/medvalor/`) contém páginas HTML com ferramentas e relatórios.

A pasta `/p/` abriga copias publicas dessas paginas. Cada pagina publica fica em `/p/{slug}/index.html` e e catalogada em `/p/registry.json`.

**Infraestrutura existente:**

| Arquivo | Funcao |
|---|---|
| `/p/registry.json` | Catalogo de todas as paginas publicas (schema abaixo) |
| `/scripts/public-link-btn.js` | Botao admin-only que exibe link publico nas paginas dos portais |
| `/admin/index.html` | Aba "Links Publicos" que lista o registry.json |
| `/docs/_infra/public-pages.md` | Documentacao completa da infraestrutura |

---

## Fluxo de Execucao

### 1. Escolher o slug

O slug e o identificador unico da pagina publica. Convencoes:

- Minusculo, separado por hifen: `tea-dataset`, `variabilidade-exames`, `calc-plantao`
- Descritivo e curto
- Sem acentos ou caracteres especiais

### 2. Criar a subpasta

```
/p/{slug}/
/p/{slug}/index.html
```

### 3. Copiar e adaptar o HTML

Copie o HTML da pagina original do portal e faca os seguintes ajustes:

**Remover a camada de autenticacao:**
- Remova a tag `<script src="/scripts/hub-auth.js" data-portal="..."></script>` do final do body.
- Se a pagina precisa de autenticacao propria (como o TEA com compartilhamento por hash), adapte o fluxo para funcionar sem o hub-auth.js, usando autenticacao direta via Worker csv-auth.

**Adicionar meta tags OpenGraph** (no `<head>`, antes dos links de favicon):

```html
<meta property="og:title" content="{Titulo da Pagina} | {Portal}">
<meta property="og:description" content="{Descricao curta}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:image" content="https://hub.grupocsv.com/assets/og/og_hub.png">
<meta property="og:url" content="https://hub.grupocsv.com/p/{slug}/">
<meta property="og:site_name" content="{Portal} | Hub Grupo CSV">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{Titulo da Pagina}">
<meta name="twitter:description" content="{Descricao curta}">
<meta name="twitter:image" content="https://hub.grupocsv.com/assets/og/og_hub.png">
```

Imagens OG disponiveis: `og_hub.png`, `og_unimed.png`, `og_unihealth.png`, `og_axiacare.png`, `og_thera.png`, `og_medvalor.png`, `og_compass.png`, `og_founder.png`. Todas em `/assets/og/` (tambem espelhadas em `/docs/public/og/`).

**Adicionar Hub back button** (CSS no `<style>`, HTML logo apos `<body>`):

CSS:
```css
.hub-back-btn{position:fixed;top:16px;left:16px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,0.1);border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,0.08);color:#1B3A5C;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;transition:all 0.2s;line-height:1}
@media(max-width:768px){.hub-back-btn{position:relative;top:auto;left:auto;display:flex;width:fit-content;margin:12px auto 0;z-index:1;box-shadow:0 1px 6px rgba(0,0,0,0.06)}}
.hub-back-btn:hover{background:#1B3A5C;color:#fff;box-shadow:0 4px 20px rgba(27,58,92,0.3);transform:translateY(-1px)}
@media print{.hub-back-btn{display:none!important}}
```

HTML (logo apos `<body>`):
```html
<a href="https://hub.grupocsv.com" class="hub-back-btn">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="15 18 9 12 15 6"/></svg>
  Hub CSV
</a>
```

**Favicons** (no `<head>`):
```html
<link rel="icon" href="/assets/favicons/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicons/apple-touch-icon.png">
```

### 4. Registrar no registry.json

Adicione uma entrada ao array `pages` em `/p/registry.json`:

```json
{
  "slug": "{slug}",
  "title": "{Titulo}",
  "description": "{Descricao curta}",
  "origin_portal": "{portal_id}",
  "origin_page": "{arquivo_original.html}",
  "public_url": "https://hub.grupocsv.com/p/{slug}/",
  "status": "active",
  "created_at": "{YYYY-MM-DD}",
  "og_image": "https://hub.grupocsv.com/assets/og/og_hub.png"
}
```

Atualize tambem o campo `updated_at` na raiz do JSON.

**Campos do registry.json:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| slug | string | sim | Identificador unico, corresponde a subpasta em /p/ |
| title | string | sim | Titulo legivel da pagina |
| description | string | sim | Descricao curta |
| origin_portal | string | sim | ID do portal de origem: unimed, unihealth, icds, 2im, axiacare, thera, medvalor |
| origin_page | string | sim | Nome do arquivo HTML original no portal (ex: onco.html) |
| public_url | string | sim | URL publica completa |
| status | string | sim | "active" ou "inactive" |
| created_at | string | sim | Data de criacao (YYYY-MM-DD) |
| og_image | string | nao | URL da imagem OpenGraph |

### 5. Adicionar o botao admin-only na pagina original do portal

Na pagina original do portal (a que foi copiada), adicione antes do `</body>`:

```html
<script src="/scripts/public-link-btn.js" data-page="{arquivo_original.html}"></script>
```

O valor de `data-page` deve corresponder exatamente ao campo `origin_page` no registry.json.

### 6. Commit e push

Commits atomicos em ingles:

```
feat(p): add public page {slug}
```

Se tambem adicionou o botao na pagina do portal:

```
feat({portal}): add public-link-btn to {arquivo}
```

### 7. Verificar deploy

Apos o push, aguarde o deploy no GitHub Pages e verifique:

- `https://hub.grupocsv.com/p/{slug}/` carrega corretamente
- OpenGraph funciona (testar em https://www.opengraph.xyz/)
- Hub back button aparece e leva ao hub
- A pagina aparece na aba "Links Publicos" do admin

---

## Referencia: Pagina existente

O primeiro exemplo e `/p/tea-dataset/`. Consulte `/p/tea-dataset/index.html` para ver a implementacao de referencia, incluindo:

- Meta tags OpenGraph
- CSS do hub-back-btn
- Autenticacao adaptada (usa csv-auth diretamente com compartilhamento por hash)
- Estrutura de login com selecao de unidade

---

## O que NAO fazer

- NAO alterar `/p/tea-dataset/` (producao)
- NAO automatizar deploy via GitHub API
- NAO criar paginas publicas sem registrar no registry.json
- NAO usar emojis no HTML
- NAO remover ou alterar o `/p/index.html` (redirect de protecao)
