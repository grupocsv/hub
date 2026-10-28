# Central de Assets e Identidade Visual

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


Repositório oficial de marcas, logotipos, wallpapers e elementos visuais do ecossistema Grupo CSV.

> **Atualizado:** 28/10/2026 — Catálogo v2 em `assets.grupocsv.com`. As seções a partir de "Acervo Original" registram a extração de 24/01/2026 e são mantidas como histórico.

---

## Catálogo Oficial (assets.grupocsv.com)

Para usar um asset, referencie sempre a URL pública dele em `https://assets.grupocsv.com/`. O catálogo completo fica em [`/manifest.json`](https://assets.grupocsv.com/manifest.json) (schema 2.0.0) e, em 28/10/2026, reunia **476 assets** de 44 marcas, em 8 categorias e 5 grupos.

| Grupo | Assets |
| :--- | :--- |
| Grupo CSV e Marcas Próprias | 278 |
| Clientes e Instituições Parceiras | 100 |
| Pessoas e Projetos Pessoais | 52 |
| Sistema Unimed | 29 |
| Terceiros | 17 |
| **Total** | **476** |

**Regra de URL:** nenhuma URL publicada é renomeada, movida ou apagada. Quando a marca, a categoria, a descrição ou a transparência de um arquivo é corrigida, o valor anterior fica no campo `legacy` e os filtros antigos continuam funcionando.

| Consulta | Endereço |
| :--- | :--- |
| Busca | `https://assets.grupocsv.com/api/search?q=axiacare&category=logo` |
| Totais | `https://assets.grupocsv.com/api/meta` |
| Por marca | `https://assets.grupocsv.com/api/brands/thera` |
| Especificação | `https://assets.grupocsv.com/api/openapi.json` |

**Consulta visual:** aba **Central de Assets** do [Painel Admin](https://hub.grupocsv.com/admin/), com cards das marcas em destaque, catálogo com busca e filtros, prévia em fundo claro ou escuro e botão para copiar a URL e a referência de cada arquivo.

---

## Acervo Original (Janeiro de 2026)

Os caminhos `_backup_vitepress/` citados abaixo são da época da extração. No repositório atual, o acervo fica em `_infra/uploads_usuario/upload_001/` e em `docs/_infra/uploads_usuario/upload_001/`. Para uso em páginas, e-mails e documentos, prefira a URL do catálogo oficial.

## Logos Extraídos (Acesso Direto)

Os logos foram extraídos dos pacotes ZIP e estão disponíveis em:
```
_backup_vitepress/uploads_usuario/upload_001/logos_extraidos/
```

### Grupo CSV
| Arquivo | Descrição |
| :--- | :--- |
| `csv_horizontal_positivo.png` | Logo horizontal, fundo branco |
| `csv_horizontal_positivo_sem_fundo.png` | Logo horizontal, transparente |
| `csv_horizontal_negativo_sem_fundo.png` | Logo horizontal negativo |
| `csv_vertical_positivo.png` | Logo vertical |

**Path:** `logos_extraidos/grupo_csv/Logotipo Grupo CSV/`

### AxiaCare®
| Variação | PNG | SVG | JPG | WebP | AI | PDF |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Horizontal Positivo | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Horizontal Negativo | ✓ | ✓ | ✓ | ✓ | - | - |
| Horizontal Mono Positivo | ✓ | ✓ | ✓ | ✓ | - | - |
| Horizontal Mono Negativo | ✓ | ✓ | ✓ | ✓ | - | - |
| Vertical Positivo | ✓ | ✓ | ✓ | ✓ | - | - |
| Vertical Negativo | ✓ | ✓ | ✓ | ✓ | - | - |
| Vertical Mono Positivo | ✓ | ✓ | ✓ | ✓ | - | - |
| Vertical Mono Negativo | ✓ | ✓ | ✓ | ✓ | - | - |

**Path:** `logos_extraidos/axiacare/Logotipo AxiaCare/`

### MedValor®
| Variação | Laranja | Azul (Grupo) |
| :--- | :--- | :--- |
| Horizontal Positivo | ✓ | ✓ |
| Horizontal Negativo | ✓ | ✓ |
| Vertical Positivo | ✓ | ✓ |
| Vertical Negativo | ✓ | ✓ |
| Mono Positivo | ✓ | ✓ |
| Mono Negativo | ✓ | ✓ |

**Path:** `logos_extraidos/medvalor/Logotipo MedValor/`

### Thera®
| Variação | Roxo | Azul (Grupo) |
| :--- | :--- | :--- |
| Horizontal Positivo | ✓ | ✓ |
| Horizontal Negativo | ✓ | ✓ |
| Vertical Positivo | ✓ | ✓ |
| Vertical Negativo | ✓ | ✓ |
| Mono Positivo | ✓ | ✓ |
| Mono Negativo | ✓ | ✓ |

**Path:** `logos_extraidos/thera/Logotipo Thera/`

### Guilherme Thomé
| Variação | PNG | SVG | JPG | WebP |
| :--- | :--- | :--- | :--- | :--- |
| Horizontal Positivo | ✓ | ✓ | ✓ | ✓ |
| Horizontal Negativo | ✓ | ✓ | ✓ | ✓ |
| Vertical Positivo | ✓ | ✓ | ✓ | ✓ |
| Vertical Negativo | ✓ | ✓ | ✓ | ✓ |
| Mono Positivo | ✓ | ✓ | ✓ | ✓ |
| Mono Negativo | ✓ | ✓ | ✓ | ✓ |

**Path:** `logos_extraidos/guilherme_thome/Logotipo Guilherme Thomé/`

---

## Wallpapers Oficiais

| Arquivo | Resolução | Uso |
| :--- | :--- | :--- |
| `csv_ecosystem_wallpaper_final3.png` | Alta | Hero, capas |
| `csv_wallpaper_dark.png` | Alta | Dark mode |
| `csv_wallpaper_light.png` | Alta | Light mode |
| `videocall_4k.png` | 4K | Reuniões virtuais |

**Path:** `_backup_vitepress/public/wallpapers/`

---

## Criativos e Marketing

| Arquivo | Uso |
| :--- | :--- |
| `linkedin_cover.png` | Banner LinkedIn |
| `linkedin_cover_v2.png` | Banner LinkedIn v2 |
| `triangulo_csv.png` | Elemento gráfico |
| `Powered Thera.png` | Selo |
| `Solução Axia.png` | Selo |
| `Workspace Axia.png` | Imagem |
| `assinatura_email_final_600px.png` | Email |
| Cartões de visita Thera (PDF) | Impressão |
| Timbrado Thera (PDF) | Documentos |
| Investigando Galileu Saúde (PDF) | Case study |

**Path:** `logos_extraidos/criativos/criativos/`

---

## Pacotes ZIP (Originais)

Para backup ou download completo:

| Marca | Arquivo | Tamanho |
| :--- | :--- | :--- |
| Grupo CSV | `Logotipo Grupo CSV.zip` | 286 KB |
| AxiaCare | `Logotipo AxiaCare.zip` | 10.1 MB |
| MedValor | `Logotipo MedValor.zip` | 13.7 MB |
| Thera | `Logotipo Thera.zip` | 12.7 MB |
| Guilherme Thomé | `Logotipo Guilherme Thomé.zip` | 14.5 MB |
| Criativos | `criativos.zip` | 10.5 MB |

**Path:** `_backup_vitepress/uploads_usuario/upload_001/`

---

## Estrutura de Formatos

| Formato | Extensão | Uso |
| :--- | :--- | :--- |
| Adobe Illustrator | `.ai` | Edição vetorial |
| PDF | `.pdf` | Impressão |
| SVG | `.svg` | Web (escalável) |
| PNG | `.png` | Web (transparente) |
| JPG | `.jpg` | Impressão |
| WebP | `.webp` | Web otimizado |

---

## Links Oficiais

| Empresa | Website | Segmento |
| :--- | :--- | :--- |
| **Grupo CSV** | [grupocsv.com](https://grupocsv.com) | Corporativo |
| **Guilherme Thomé** | [guithome.com.br](https://guithome.com.br) | Marca Pessoal |
| **AxiaCare** | [axcare.com.br](https://axcare.com.br) | Gestão em Saúde |
| **Thera** | [thera.tech](https://thera.tech) | Tecnologia |
| **MedValor** | [medvalor.med.br](https://medvalor.med.br) | Educação |

**Contato:** [contato@grupocsv.com](mailto:contato@grupocsv.com)

---

## Dados Estruturados (Para IA)

```json
{
  "updated": "2026-01-24",
  "status": "extracted",
  "assets": {
    "logos_extracted": {
      "base_path": "_backup_vitepress/uploads_usuario/upload_001/logos_extraidos/",
      "brands": {
        "grupo_csv": {
          "path": "grupo_csv/Logotipo Grupo CSV/",
          "files": ["csv_horizontal_positivo.png", "csv_horizontal_positivo_sem_fundo.png", "csv_horizontal_negativo_sem_fundo.png", "csv_vertical_positivo.png"]
        },
        "axiacare": {
          "path": "axiacare/Logotipo AxiaCare/",
          "formats": ["PNG (imagem sem fundo)", "JPG (imagem)", "SVG (vetor)", "WebP (imagem sem fundo)", "Adobe Illustrator (Vetor)", "PDF (vetor)"]
        },
        "medvalor": {
          "path": "medvalor/Logotipo MedValor/",
          "color_versions": ["Laranja", "Azul"]
        },
        "thera": {
          "path": "thera/Logotipo Thera/",
          "color_versions": ["Roxo", "Azul"]
        },
        "guilherme_thome": {
          "path": "guilherme_thome/Logotipo Guilherme Thomé/"
        }
      }
    },
    "wallpapers": {
      "path": "_backup_vitepress/public/wallpapers/",
      "files": ["csv_ecosystem_wallpaper_final3.png", "csv_wallpaper_dark.png", "csv_wallpaper_light.png", "videocall_4k.png"]
    },
    "criativos": {
      "path": "logos_extraidos/criativos/criativos/"
    },
    "zips_original": {
      "path": "_backup_vitepress/uploads_usuario/upload_001/"
    }
  }
}
```
