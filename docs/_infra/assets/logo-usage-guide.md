---
outline: deep
---

# Guia de Uso de Logos e Avatares

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


Este documento define as regras de aplicação de cada tipo de imagem da identidade visual do Grupo CSV e suas empresas. Deve ser consultado por agentes de IA e colaboradores antes de inserir qualquer logo ou avatar em materiais, páginas ou documentos.

---

## Conceitos Fundamentais

### Avatar

Imagem quadrada (proporção 1:1) com fundo decorativo (gradiente, glow ou cor sólida), projetada para caber em molduras circulares de redes sociais. O logo da marca aparece dentro de um círculo branco centralizado sobre o fundo colorido. Existem duas versões por marca:

| Versão | Resolução | Uso principal |
|--------|-----------|---------------|
| v1 | 2048 x 2048 | Perfil em redes sociais (Instagram, LinkedIn, YouTube) |
| v2 | 480 x 480 | Versão compacta para redes sociais, favicon |

**Avatar NUNCA substitui logo.** Avatares não devem ser usados em headers, footers, navbars, documentos, apresentações ou qualquer contexto institucional fora de redes sociais.

### Logo

Marca isolada sobre fundo branco (positive) ou escuro (negative), sem decoração. Para uso institucional em sites, documentos, headers, footers, apresentações e materiais impressos. Cada marca possui variantes organizadas por três eixos:

| Eixo | Opções | Descrição |
|------|--------|-----------|
| Orientação | horizontal, vertical | Horizontal (paisagem, ratio ~2.4-3.0) para barras e linhas. Vertical (quase quadrado, ratio ~1.27) para cards e blocos. |
| Cor | full-color, monochrome, ou cor específica | Full-color é a versão principal. Monochrome para contextos neutros. Cor específica (blue, orange, purple) para variantes de marca. |
| Polaridade | positive, negative | Positive para fundo claro. Negative para fundo escuro. |

Formatos disponíveis: PNG (raster) e SVG (vetor). Preferir SVG para web quando disponível; PNG para documentos e contextos que não suportam SVG.

---

## Regras de Aplicação por Contexto

### Contextos Web (Hub, sites, landing pages)

| Contexto | Tipo de logo | Arquivo de referência (Grupo CSV) |
|----------|-------------|-----------------------------------|
| Navbar | Horizontal, positive, transparent | `grupo-csv_logo_horizontal_full-color_positive_transparent.png` |
| Footer (inline, altura pequena) | Horizontal, positive | `{marca}_logo_horizontal_{cor}_positive.png` |
| Hero de página de empresa | Vertical, positive | `{marca}_logo_vertical_{cor}_positive.png` |
| Favicon | Avatar v2 | `{marca}_avatar_v2.png` |
| Dark mode | Horizontal ou vertical, negative | `{marca}_logo_{orientação}_{cor}_negative.png` |

### Contextos Documentais (PDF, Word, apresentações)

| Contexto | Tipo de logo |
|----------|-------------|
| Cabeçalho de documento | Horizontal, positive |
| Capa de documento | Vertical, positive |
| Rodapé de documento | Horizontal, positive (tamanho reduzido) |
| Fundo escuro em slide | Horizontal ou vertical, negative |

### Contextos de Redes Sociais

| Contexto | Tipo de imagem |
|----------|---------------|
| Foto de perfil | Avatar v1 (alta resolução) |
| Ícone em listagens | Avatar v2 (compacto) |

### Compliance (HTMLs standalone)

| Contexto | Tipo de logo | Observação |
|----------|-------------|------------|
| Header da página | Horizontal, positive, transparent | Logo do Grupo CSV |
| Footer da página | Horizontal, positive, transparent | Logo do Grupo CSV (tamanho menor) |
| Favicon (link rel="icon") | Avatar v2 | Único contexto onde avatar é aceitável em compliance |

---

## Inventário por Marca

### Grupo CSV

O Grupo CSV possui um caso especial: o arquivo `grupo-csv_logo_horizontal_full-color_positive.png` tem dimensões 500x500 (quadrado com fundo branco), apesar do nome "horizontal". Para uso web onde transparência é necessária, usar a versão `_transparent`.

| Arquivo | Dimensões | Transparência | Uso recomendado |
|---------|-----------|---------------|-----------------|
| `avatar/grupo-csv_avatar_v1.png` | 2048x2048 | Não | Redes sociais |
| `avatar/grupo-csv_avatar_v2.png` | 480x480 | Não | Redes sociais, favicon |
| `logo/png/grupo-csv_logo_horizontal_full-color_positive.png` | 500x500 | Não | Documentos (fundo branco) |
| `logo/png/grupo-csv_logo_horizontal_full-color_positive_transparent.png` | 1310x539 | Sim | Navbar, headers web, footers web |
| `logo/png/grupo-csv_logo_horizontal_full-color_negative_transparent.png` | 1291x522 | Sim | Headers/footers sobre fundo escuro |
| `logo/png/grupo-csv_logo_vertical_full-color_positive.png` | 500x500 | Não | Cards, blocos, capas |

### AxiaCare

Cor primária: azul (#196396). Símbolo: estrela estilizada com gradiente azul-verde.

| Tipo | Arquivo principal (positive) | Dimensões |
|------|------------------------------|-----------|
| Horizontal full-color | `axiacare_logo_horizontal_full-color_positive.png` | 3299x1357 |
| Vertical full-color | `axiacare_logo_vertical_full-color_positive.png` | 2554x2016 |
| Horizontal monochrome | `axiacare_logo_horizontal_monochrome_positive.png` | 3299x1357 |
| Vertical monochrome | `axiacare_logo_vertical_monochrome_positive.png` | 2554x2015 |

### MedValor

Cor primária: laranja (`#f7901e`). O símbolo institucional é bicolor, com gradientes entre verde-claro (`#b5d8be`) e laranja.

| Tema / fundo | Orientação | Asset canônico |
|---|---|---|
| Claro | Horizontal | `https://assets.grupocsv.com/logos/medvalor/horizontal-positivo-laranja.svg` |
| Escuro | Horizontal | `https://assets.grupocsv.com/logos/medvalor/horizontal-negativo-verde-laranja.svg` |
| Claro | Vertical | `https://assets.grupocsv.com/logos/medvalor/vertical-positivo-laranja.svg` |
| Escuro | Vertical | `https://assets.grupocsv.com/logos/medvalor/vertical-negativo-verde-laranja.svg` |

> **Regra canônica para fundos escuros:** preservar integralmente o símbolo verde-laranja e alterar somente o lettering “MedValor” e o símbolo de marca registrada para branco. Não usar `horizontal-negativo-laranja.svg` ou `vertical-negativo-laranja.svg` quando a composição bicolor institucional for necessária, pois essas variantes antigas não preservam o componente laranja do símbolo.

### TheraTech

Cor primária: roxo. Variante secundária: azul.

| Tipo | Arquivo principal (positive) | Dimensões |
|------|------------------------------|-----------|
| Horizontal purple | `thera_logo_horizontal_purple_positive.png` | 3299x1357 |
| Horizontal blue | `thera_logo_horizontal_blue_positive.png` | 3299x1357 |
| Vertical purple | `thera_logo_vertical_purple_positive.png` | 2554x2016 |
| Vertical blue | `thera_logo_vertical_blue_positive.png` | 2554x2015 |

### Guilherme Thomé

| Tipo | Arquivo | Dimensões | Uso |
|------|---------|-----------|-----|
| Avatar (atual) | `guilherme-thome_avatar_current.png` | 2048x2048 | Seção Fundador, redes sociais |
| Avatar low-res | `guilherme-thome_avatar_current_low-res.png` | 1024x1024 | Web otimizado |
| Avatar com nome | `guilherme-thome_avatar_with-name.png` | 4096x4096 | Materiais específicos |
| Logo horizontal | `guilherme-thome_logo_horizontal_full-color_positive.png` | 3299x1357 | Documentos, assinaturas |
| Logo vertical | `guilherme-thome_logo_vertical_full-color_positive.png` | 2554x2016 | Cards, blocos |
| Rubrica | `guilherme-thome_rubrica.png` | 3130x1313 | Documentos formais |
| Assinatura completa | `guilherme-thome_signature_full.png` | 3319x1043 | Documentos formais |

### ICDS (Parceiro)

Cor primaria: azul marinho (#1B3A5C). Cor secundaria: azul medio (#2C5F8A). Entidade Filantropica e Gestora Assistencial.

| Tipo | Arquivo | Dimensoes | Uso |
|------|---------|-----------|-----|
| Horizontal fundo azul | `icds_horizontal_fundo_azul.png` | 404x156 | Navbar, hero, cards (fundo claro ou escuro) |
| Horizontal positivo | `icds_horizontal_sem_fundo_positivo.png` | 500x178 | Documentos, footers, fundo claro |
| Horizontal negativo | `icds_horizontal_sem_fundo_negativo.png` | 600x214 | Fundo escuro, dark mode |

---

## Erros Comuns a Evitar

1. **Usar avatar como logo em header/footer.** O avatar tem fundo decorativo e moldura circular que não pertencem a contextos institucionais.

2. **Usar logo positive sobre fundo escuro.** O texto ficará invisível. Usar variante negative.

3. **Usar logo negative sobre fundo claro.** O texto ficará invisível. Usar variante positive.

4. **Confundir o arquivo `grupo-csv_logo_horizontal_full-color_positive.png` (500x500) com uma logo quadrada.** Apesar das dimensões, é uma logo horizontal com padding branco. Para web, preferir a versão `_transparent`.

5. **Usar logos de alta resolução (3000px+) sem redimensionamento.** Em contextos web, definir height/width via CSS para evitar carregamento desnecessário.

6. **Misturar variantes de cor entre marcas.** Cada marca tem sua cor primária. AxiaCare = azul, MedValor = laranja, TheraTech = roxo.
