
---
layout: page
title: Páginas Públicas — Infraestrutura Open Pages
---

# Páginas Públicas (Open Pages)

<style>
.dark .dark .copy-bar-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all .2s ease;
  font-family: inherit;
  line-height: 1.2;
}
.copy-bar-btn:hover { background: #e5e7eb; color: #111827; border-color: #9ca3af; }
.copy-bar-btn.copied { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
.dark .copy-bar-btn { background: #1f2937; color: #d1d5db; border-color: #4b5563; }
.dark .copy-bar-btn:hover { background: #374151; color: #f3f4f6; border-color: #6b7280; }
.dark .copy-bar-btn.copied { background: #064e3b; color: #6ee7b7; border-color: #065f46; }
</style>

<div class="copy-bar">
<button class="copy-bar-btn" id="copy-page-btn">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
Copiar página
</button>
</div>

Documentação da infraestrutura de publicação de páginas públicas do Hub Grupo CSV.

---

## Visão Geral

O Hub Grupo CSV possui uma infraestrutura independente para publicação rápida de páginas HTML acessíveis externamente, sem necessidade de autenticação. Esta infraestrutura é chamada de **Open Pages** e opera no subdomínio `open.grupocsv.com`.

**Objetivo:** Permitir o compartilhamento de relatórios, dashboards, propostas e datasets com parceiros externos (hospitais, operadoras, clientes) de forma rápida, segura e com controle de acesso (toggle ativo/inativo instantâneo).

**Arquitetura (open.grupocsv.com):**
- **Hospedagem:** Cloudflare R2 (Bucket `csv-open-pages`)
- **Estado (Toggle):** Cloudflare KV (Namespace `csv-open-pages`)
- **Roteamento e API:** Cloudflare Worker (`csv-open-pages`)
- **Auth Gate:** Cloudflare Worker (`csv-open-auth`) + KV (`csv-open-auth`)
- **Domínio:** `open.grupocsv.com`
- **Repositório:** `grupocsv/csv-open-pages` (privado, contém o código do Worker e do painel admin)

**Arquitetura (hub.unimedgv.com):**
- **Hospedagem:** Cloudflare R2 (Bucket `hub-unimedgv`)
- **Estado:** Cloudflare KV (Namespace `hub-unimedgv-kv`)
- **Roteamento:** Cloudflare Worker (`hub-unimedgv`)
- **Domínio:** `hub.unimedgv.com`
- **Repositório:** `grupocsv/hub-unimedgv` (privado)

---

## Como Funciona

### 1. Painel de Controle
O gerenciamento das páginas é feito através de um painel administrativo isolado, acessível em `https://open.grupocsv.com/_admin/`.

**Funcionalidades:**
- Autenticação por senha fixa (configurada como secret no Worker).
- Upload de arquivos HTML e assets (arrastar e soltar).
- Definição de slug (identificador na URL), título e descrição.
- Listagem de páginas publicadas com status atual.
- Toggle instantâneo (Ativar/Desativar) via Cloudflare KV.
- Cópia rápida do link público.

### 2. Roteamento e Bloqueio (Worker)
O Worker `csv-open-pages` intercepta todas as requisições para `open.grupocsv.com/*`.

**Fluxo de acesso público:**
1. Usuário acessa `https://open.grupocsv.com/{slug}/`.
2. O Worker consulta o status da página no Cloudflare KV (`page:{slug}`).
3. Se o status for `active`, o Worker busca o arquivo correspondente no bucket R2 e o serve ao usuário.
4. Se o status for `inactive` ou a página não existir, o Worker retorna uma página de erro 404 padronizada.

**Vantagem:** O bloqueio é real e ocorre na borda (edge). Uma página desativada não pode ser acessada, mesmo que os arquivos continuem armazenados no R2.

### 3. Publicação Programática (Tools MCP do Extensio)

Além dos painéis, o servidor MCP do **Extensio** expõe duas tools para operar as Open Pages de forma programática (por agentes de IA ou automações):

- **`open_page_publish`** — Publica ou atualiza uma Open Page em `open.grupocsv.com`. Parâmetros: `slug` e `html_content` (obrigatórios), `title` e `description` (metadados). Faz o upload do HTML para o R2, atualiza os metadados no KV e verifica a gravação.
- **`open_page_list`** — Lista as Open Pages ativas com seus metadados (slug, título, URL, status).

### 4. Legado (Diretório `/p/` no Hub)
Anteriormente, as páginas públicas eram armazenadas no diretório `/p/` do repositório principal do Hub e servidas via GitHub Pages. Este modelo foi descontinuado em favor da arquitetura independente (Open Pages) para permitir toggles instantâneos sem necessidade de novos deploys.

Páginas legadas (como o `tea-dataset`) foram migradas para o R2. O diretório `/p/` no repositório `grupocsv/hub` pode ser mantido temporariamente para fins de histórico ou redirecionamento (301), mas novas publicações devem ser feitas exclusivamente via Open Pages — por qualquer das três vias da seção anterior: aba Links Públicos do `/admin/`, painel `open.grupocsv.com/_admin/` ou tools MCP do Extensio.

---

## Padrão HTML de Páginas Públicas

Toda página publicada no Open Pages deve ser autocontida (HTML, CSS inline ou em arquivos relativos, JS) e seguir as diretrizes visuais do Grupo CSV.

### Meta tags OpenGraph

Recomenda-se a inclusão de meta tags para melhorar a apresentação ao compartilhar links no WhatsApp, LinkedIn, etc.

```html
<meta property="og:title" content="{Título} | {Portal}">
<meta property="og:description" content="{Descrição curta}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="https://open.grupocsv.com/{slug}/">
<meta property="og:site_name" content="{Portal} | Grupo CSV">
```

### Autenticação

Páginas públicas **NÃO** devem incluir scripts de autenticação interna do Hub (como `/scripts/hub-auth.js`). Elas são, por definição, abertas a qualquer pessoa com o link, desde que o status no painel esteja como "Ativo".

### Auth Gate (Portão de Autenticação)

As Open Pages suportam uma camada de proteção dinâmica chamada **Auth Gate**:
- Se o metadado no KV indicar `"auth_gate": true`, o Worker injeta dinamicamente um modal de login no HTML servido.
- A validação das credenciais é delegada para o Worker `csv-open-auth`.
- Isso permite que uma página hospedada no R2 seja pública por padrão, mas receba uma camada de proteção instantânea sem precisar recompilar o HTML.
- A ativação/desativação do Auth Gate é feita via API: `POST /api/set-auth-gate` com `{ "slug": "...", "auth_gate": true/false }`.

---

## Sincronização de Menus dos Portais

Os menus dos portais **Unimed, Unihealth, ICDS e 2iM** são gerados automaticamente a cada push — não há lista manual de ferramentas nos índices.

### Geração (CI)

1. O workflow de deploy (`.github/workflows/deploy.yml`, step "Generate portal tools.json") executa `scripts/generate-portal-tools.py` a cada push na `main`.
2. Para cada portal, o script escaneia os arquivos `.html` da pasta do portal (excluindo `index.html`), extrai o `<title>` (removendo sufixos como `| Unimed GV` e `| Grupo CSV`) e obtém as datas de criação e última modificação via `git log`.
3. Páginas com `<meta name="hub-menu" content="hidden">` no `<head>` são **excluídas do menu**.
4. Entradas manuais vêm de `{portal}/extras.json` — links para Open Pages, páginas legadas `/p/` ou URLs externas. Cada item usa `title` e `href` (opcionalmente `created`/`lastModified`) e entra no resultado com `"external": true`. Exemplo: `icds/extras.json` aponta para `/p/tea-dataset/` e para `https://rd-icds.axcare.app`.
5. O resultado é gravado em `{portal}/tools.json` (campos `portal`, `generatedAt`, `totalTools`, `tools`), ordenado do mais recente para o mais antigo.

### Consumo (runtime)

- Os índices VitePress de Unimed, Unihealth e ICDS, além do índice estático da 2iM (`2im/index.html`), fazem `fetch` de `/{portal}/tools.json` e renderizam os cards dinamicamente.
- A home (`docs/index.md`) também busca o `tools.json` de cada portal para montar as listas de ferramentas; itens com `external: true` usam o `href` diretamente, os demais recebem o prefixo do portal.

**Implicação para páginas públicas:** para que uma Open Page (ou página legada `/p/`) apareça no menu de um portal, adicione a entrada em `{portal}/extras.json` — ela passa a constar do `tools.json` no push seguinte.

**Por que Axia, Medvalor e Thera ficam fora do gerador:** são portais de empresas do grupo com índices curados manualmente (cards de serviço estáticos em `docs/{axia,medvalor,thera}/index.md`), sem menu dinâmico de ferramentas — não consomem `tools.json`. Incluí-los no `PORTALS` do gerador criaria artefatos que nada lê. Se algum deles ganhar menu dinâmico no futuro, basta adicioná-lo ao `PORTALS` em `scripts/generate-portal-tools.py` e trocar o índice para o padrão de `fetch` dos portais de parceiros.

---

## Histórico

| Data | Descrição |
|---|---|
| 2026-02-15 | Primeira página pública legada: `/p/tea-dataset/` no GitHub Pages |
| 2026-03-06 | Infraestrutura legada formalizada: `registry.json`, admin tab |
| 2026-03-18 | **Migração para Open Pages:** Nova arquitetura independente com Cloudflare Worker, R2 e KV no domínio `open.grupocsv.com`. Painel admin próprio e toggle instantâneo. |
| 2026-05-30 | **Hub Unimed GV:** Infraestrutura paralela exclusiva para a Unimed GV em `hub.unimedgv.com` (Worker + KV + R2 próprios). |
| 2026-06-11 | **Auth Gate:** Worker `csv-open-auth` implementado para proteger Open Pages com login dinâmico sem recompilar HTML. |

---

## Arquivos e Repositórios Relacionados

| Item | Tipo | Descrição |
|---|---|---|
| `grupocsv/csv-open-pages` | Repositório | Código-fonte do Worker e do painel admin (open.grupocsv.com) |
| `grupocsv/hub-unimedgv` | Repositório | Código-fonte do Worker e infraestrutura (hub.unimedgv.com) |
| `csv-open-pages` | CF Worker | Roteamento, API, Auth Gate e bloqueio na borda |
| `csv-open-auth` | CF Worker | Validação de credenciais do Auth Gate |
| `hub-unimedgv` | CF Worker | Roteamento e injeção de `<head>` para Unimed GV |
| `csv-open-pages` | CF R2 | Bucket de armazenamento dos arquivos HTML/assets |
| `hub-unimedgv` | CF R2 | Bucket de armazenamento dos arquivos HTML da Unimed GV |
| `csv-open-pages` | CF KV | Armazenamento do estado (ativo/inativo, auth_gate) e metadados |
| `csv-open-auth` | CF KV | Senhas e sessões do Auth Gate |
| `hub-unimedgv-kv` | CF KV | Estado e metadados das páginas da Unimed GV |
| `/docs/_infra/public-pages.md` | Docs | Este documento |

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const btn = document.getElementById('copy-page-btn')
  if (!btn) return
  btn.addEventListener('click', () => {
    const content = document.querySelector('.vp-doc') || document.querySelector('.VPPage') || document.querySelector('main')
    if (!content) return

    function htmlToMd(el) {
      let md = ''
      function walk(node) {
        if (node.nodeType === 3) { md += node.textContent; return }
        if (node.nodeType !== 1) return
        const tag = node.tagName.toLowerCase()
        if (node.classList && (node.classList.contains('copy-bar-btn') || node.classList.contains('copy-bar'))) return
        if (['style','script','nav','aside'].includes(tag)) return
        if (tag === 'h1') { md += '\n# '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h2') { md += '\n## '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h3') { md += '\n### '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h4') { md += '\n#### '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'p') { node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'br') { md += '\n'; return }
        if (tag === 'strong' || tag === 'b') { md += '**'; node.childNodes.forEach(walk); md += '**'; return }
        if (tag === 'em' || tag === 'i') { md += '*'; node.childNodes.forEach(walk); md += '*'; return }
        if (tag === 'code' && node.parentElement.tagName.toLowerCase() !== 'pre') {
          md += '`' + node.textContent + '`'; return
        }
        if (tag === 'pre') { md += '\n```\n' + node.textContent + '\n```\n\n'; return }
        if (tag === 'a') { md += '['; node.childNodes.forEach(walk); md += '](' + (node.href || '') + ')'; return }
        if (tag === 'li') { md += '- '; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'ul' || tag === 'ol') { md += '\n'; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'table') {
          const rows = node.querySelectorAll('tr')
          rows.forEach((row, i) => {
            const cells = row.querySelectorAll('th, td')
            md += '| ' + Array.from(cells).map(c => c.textContent.trim()).join(' | ') + ' |\n'
            if (i === 0) md += '|' + Array.from(cells).map(() => '---').join('|') + '|\n'
          })
          md += '\n'
          return
        }
        if (tag === 'hr') { md += '\n---\n\n'; return }
        if (tag === 'blockquote') { md += '> '; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'img') return
        node.childNodes.forEach(walk)
      }
      walk(el)
      return md.replace(/\n{3,}/g, '\n\n').trim()
    }

    const md = htmlToMd(content)
    navigator.clipboard.writeText(md).then(() => {
      btn.classList.add('copied')
      const origHTML = btn.innerHTML
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!'
      setTimeout(() => {
        btn.classList.remove('copied')
        btn.innerHTML = origHTML
      }, 3000)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = md
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      btn.classList.add('copied')
      const origHTML = btn.innerHTML
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!'
      setTimeout(() => {
        btn.classList.remove('copied')
        btn.innerHTML = origHTML
      }, 3000)
    })
  })
})
</script>
