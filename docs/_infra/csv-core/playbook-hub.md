# Playbook do Hub Central

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


**Infraestrutura Cognitiva e Operacional do Grupo CSV**

## 1. O Conceito
O **Hub Central** (`hub.grupocsv.com`) não é apenas um site de documentação. Ele é o índice canônico do conhecimento institucional e da infraestrutura documentada do Grupo CSV; código, configuração publicada e runtime verificado continuam sendo as fontes primárias de cada componente.

Ele serve a dois mestres simultaneamente:
1.  **Humanos:** Executivos, colaboradores e parceiros que precisam acessar políticas, assets e diretrizes de forma rápida e visual.
2.  **Máquinas (IA):** Agentes autônomos que consomem a estrutura de pastas e arquivos Markdown para entender "quem somos", "o que fazemos" e "quais são as regras".

## 2. Arquitetura da Informação
A estrutura de pastas reflete a organização jurídica e operacional:

*   `/csv-core`: O "cérebro". Contém definições canônicas, compliance, identidade visual e assets. É o que une todas as empresas.
*   `/axiacare`: Mandatos e documentos específicos da operação de consultoria e gestão.
*   `/medvalor`: Conteúdo educacional e diretrizes da escola de negócios.
*   `/thera`: Documentação técnica e de produto da fábrica de software.

## 3. Tecnologia (VitePress)
Escolhemos o **VitePress** por ser:
*   **Static-First:** Gera HTML puro, extremamente rápido e seguro.
*   **Markdown-Based:** Todo o conteúdo é escrito em texto simples (`.md`), garantindo portabilidade e leitura por IA.
*   **Git-Driven:** A atualização é feita via commit no GitHub, garantindo versionamento e auditoria de cada mudança.

## 4. Como Operar
### Adicionar Novo Documento
1.  Crie um arquivo `.md` na pasta correspondente (ex: `/axiacare/novo-processo.md`).
2.  Adicione o link no arquivo de configuração `.vitepress/config.mts` (se quiser que apareça no menu lateral).
3.  Faça o commit e push para a branch `main`.
4.  O deploy é automático (1-2 minutos).

### Atualizar Assets
1.  Adicione a imagem na pasta `/public/assets/`.
2.  Referencie no Markdown usando o caminho absoluto (ex: `![Logo](/assets/logo.png)`).

## 5. Governança
*   **Owner:** Guilherme Thomé (@guithome).
*   **Acesso:** Público para leitura (transparência radical), restrito para escrita (governança).
*   **Manutenção:** Revisão trimestral dos mandatos e compliance.
