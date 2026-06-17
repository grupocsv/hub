# Compass™ — Publicações Estratégicas

<style>
.copy-bar {
  position: fixed;
  top: 72px;
  right: 24px;
  z-index: 20;
}
.copy-bar-btn {
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
      // Fallback para contextos sem clipboard API
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


## Visão Geral

O Compass™ é a linha editorial estratégica do Grupo CSV. Produz documentos técnico-estratégicos de alta densidade para tomada de decisão em saúde suplementar, combinando evidência científica, análise de dados e contexto regulatório brasileiro.

| Campo | Valor |
|---|---|
| Marca | Compass™ |
| URL | [hub.grupocsv.com/compass/](https://hub.grupocsv.com/compass/) |
| Hospedagem | GitHub Pages (VitePress) |
| Repositório | `grupocsv/hub` — `docs/compass/` |
| Formato | Markdown (VitePress) + PDF timbrado |
| Proprietário | Grupo CSV |

## Estrutura de Diretórios

```
compass/
  index.md                    Central Compass (índice de edições)
  edicoes/
    2026/
      001/compass.md           Edição 001 — Metas ACO
      001/assets/              PDF e recursos da edição
      002/compass.md           Edição 002 — Prostatectomia Robótica
      003/compass.md           Edição 003 — Fototerapia Neonatal
      004/compass.md           Edição 004 — NATS na Saúde Suplementar
      005/compass.md           Edição 005 — Precificação da Jornada Cirúrgica
      006/compass.md           Edição 006 — Transição Demográfica e Oftalmologia
      007/compass.md           Edição 007 — Crise de Sustentabilidade e Eficiência
  policies/                    Políticas editoriais
  skills/                      Guias operacionais
  templates/                   Templates de edição
```

## Edições Publicadas

| Edição | Título | Período |
|---|---|---|
| 001/2026 | Metas quantitativas de produção em contratos ACO com orçamento global | 2026 |
| 002/2026 | O impacto da prostatectomia radical assistida por robô na saúde suplementar brasileira | 2025–2026 |
| 003/2026 | Fototerapia Neonatal | 2026 |
| 004/2026 | Implantação Estratégica e Operacional de NATS na Saúde Suplementar Brasileira | 2026 |
| 005/2026 | Precificação Estruturada da Jornada Cirúrgica: Evidências de Saving em 4.800 Protocolos | 2026 |
| 006/2026 | Transição Demográfica e Oftalmologia na Saúde Suplementar | 2026 |
| 007/2026 | Crise de Sustentabilidade e Eficiência na Saúde Suplementar Brasileira | 2026 |

## Pipeline de Publicação

O pipeline completo envolve sete etapas: extração integral do texto-fonte, criação da estrutura de diretórios, redação do Markdown, geração do PDF timbrado via script Python (`tools/compass-pdf/compass-pdf-gen.py`), atualização da sidebar no `config.mts`, atualização do índice em `docs/compass/index.md`, e commit seguido de push na branch `main`.

O PDF é gerado com o pacote `fpdf2` (versão 2.x), utiliza fontes DejaVu e inclui cabeçalho institucional (`docs/public/compass_header.png`) e logo do Grupo CSV.

## Integração no Ecossistema

O Compass™ é indexado automaticamente pelo AI Search (Cloudflare AutoRAG) após cada deploy, tornando seu conteúdo consultável via API semântica por agentes e automações.
