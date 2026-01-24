# Sistema de Identidade Visual: Grupo CSV

Este documento define os parâmetros visuais canônicos para agentes de IA e desenvolvedores. A identidade visual deve ser tratada como **dados estruturados**, não como sugestão artística.

---

## 1. Marcas do Ecossistema

O ecossistema possui **6 marcas** organizadas em dois níveis:

### Nível Corporativo
| Marca | Tipo | Uso Principal |
| :--- | :--- | :--- |
| **Grupo CSV** | Holding | Comunicação institucional, documentos legais, investidores. |
| **Guilherme Thomé** | Marca Pessoal | Comunicação B2C, redes sociais, conteúdo educacional online. |

### Nível Operacional (Empresas)
| Marca | Segmento | Uso Principal |
| :--- | :--- | :--- |
| **AxiaCare®** | Gestão em Saúde | Consultoria, governança clínica, operações. |
| **MedValor®** | Educação | Cursos, mentorias, conteúdo educacional B2B. |
| **Thera®** | Tecnologia | Software, SaaS, produtos digitais. |

---

## 2. Paleta de Cores Canônica

### Grupo CSV (Corporativo)
| Token | Hex | RGB | Uso Principal |
| :--- | :--- | :--- | :--- |
| `csv-primary` | `#196396` | `rgb(25,99,150)` | Marca principal, cabeçalhos, links primários. |
| `csv-dark` | `#1b1e24` | `rgb(27,30,36)` | Textos, fundos de alto contraste. |
| `csv-light` | `#f4f6f8` | `rgb(244,246,248)` | Fundos de página, áreas de respiro. |
| `csv-green` | `#2DBF7F` | `rgb(45,191,127)` | Acentos compartilhados do ecossistema. |

### Guilherme Thomé (Marca Pessoal)
| Token | Hex | RGB | Uso Principal |
| :--- | :--- | :--- | :--- |
| `gt-primary` | `#196396` | `rgb(25,99,150)` | Herda do Grupo CSV. |
| `gt-accent` | `#2DBF7F` | `rgb(45,191,127)` | Destaques em conteúdo pessoal. |

### AxiaCare® (Gestão)
| Token | Hex | RGB | Uso Principal |
| :--- | :--- | :--- | :--- |
| `axia-blue` | `#196396` | `rgb(25,99,150)` | Cor primária (mesma do Grupo CSV). |
| `axia-green` | `#2DBF7F` | `rgb(45,191,127)` | Acentos, elementos de destaque. |

### TheraTech® (Tecnologia)
| Token | Hex | RGB | Uso Principal |
| :--- | :--- | :--- | :--- |
| `thera-purple` | `#6B5B95` | `rgb(107,91,149)` | Cor individual da marca. |
| `thera-green` | `#2DBF7F` | `rgb(45,191,127)` | Acentos, indicadores de sucesso. |
| `thera-dark` | `#0D264C` | `rgb(13,38,76)` | Fundos tecnológicos, terminais. |

### MedValor® (Educação)
| Token | Hex | RGB | Uso Principal |
| :--- | :--- | :--- | :--- |
| `med-orange` | `#c2410c` | `rgb(194,65,12)` | Cor individual da marca. |
| `med-green` | `#2DBF7F` | `rgb(45,191,127)` | Versão grupo (acentos compartilhados). |
| `med-cream` | `#fff7ed` | `rgb(255,247,237)` | Fundos de áreas de leitura. |

---

## 3. Tipografia

O sistema utiliza uma abordagem "Swiss Modern" com foco em legibilidade e hierarquia clara.

| Função | Fonte | Pesos | Uso |
| :--- | :--- | :--- | :--- |
| **Primária** | `Inter` | 400, 500, 600, 700, 800 | Interface, textos, títulos. |
| **Código** | `JetBrains Mono` | 400, 500 | Blocos de código, dados técnicos. |

**CDN (Google Fonts):**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 4. Sistema de Logos

Todas as marcas possuem variações padronizadas para diferentes aplicações.

### Estrutura de Variações

| Marca | Versão de Cor | Variações Disponíveis |
| :--- | :--- | :--- |
| **Grupo CSV** | Azul e Verde | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **Guilherme Thomé** | Azul e Verde | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **AxiaCare®** | Azul e Verde | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **MedValor®** | Cor Grupo (Azul/Verde) | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **MedValor®** | Cor Individual (Laranja/Verde) | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **Thera®** | Cor Grupo (Azul/Verde) | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **Thera®** | Cor Individual (Roxo/Verde) | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |

### Arquivos Disponíveis

Os logos completos estão nos pacotes ZIP em `/uploads_usuario/upload_001/`:
- `Logotipo Grupo CSV.zip`
- `Logotipo Guilherme Thomé.zip`
- `Logotipo AxiaCare.zip`
- `Logotipo MedValor.zip`
- `Logotipo Thera.zip`

**Logos do Front-end (uso rápido):**
| Marca | Arquivo | Path |
| :--- | :--- | :--- |
| AxiaCare® | `axia-logo.png` | `/axia-logo.png` |
| MedValor® | `medvalor-logo.png` | `/medvalor-logo.png` |
| Thera® | `thera-logo.png` | `/thera-logo.png` |
| Grupo CSV | `csv-header-logo.png` | `/csv-header-logo.png` |

### Regras de Uso

- **Fundo claro:** Usar versões "Positiva" sobre `#ffffff` ou `#f4f6f8`.
- **Fundo escuro:** Usar versões "Negativa" para garantir contraste.
- **Contexto corporativo:** Preferir versões "Cor Grupo" (Azul/Verde).
- **Contexto independente:** Usar versões "Cor Individual" da empresa específica.

### Proibições Estritas

- **NUNCA** distorcer a proporção dos logos.
- **NUNCA** aplicar sombras ou efeitos 3D nos logos.
- **NUNCA** usar cores fora da paleta oficial para elementos de marca.
- **NUNCA** misturar versões de cor (grupo vs individual) no mesmo material.

---

## 5. Wallpapers e Fundos

Wallpapers oficiais disponíveis em `/wallpapers/`:

| Arquivo | Resolução | Uso Recomendado |
| :--- | :--- | :--- |
| `csv_ecosystem_wallpaper_final3.png` | Alta | Hero sections, capas de apresentação. |
| `csv_wallpaper_dark.png` | Alta | Fundos em Dark Mode, terminais. |
| `csv_wallpaper_light.png` | Alta | Fundos em Light Mode, documentos. |
| `videocall_4k.png` | 4K | Fundo oficial para reuniões virtuais. |

---

## 6. Dados Estruturados (Para IA)

```json
{
  "ecosystem": "Grupo CSV",
  "brands": [
    {
      "name": "Grupo CSV",
      "type": "corporate",
      "colors": {"primary": "#196396", "accent": "#2DBF7F"}
    },
    {
      "name": "Guilherme Thomé",
      "type": "personal",
      "colors": {"primary": "#196396", "accent": "#2DBF7F"}
    },
    {
      "name": "AxiaCare",
      "type": "business",
      "segment": "healthcare-management",
      "colors": {"primary": "#196396", "accent": "#2DBF7F"}
    },
    {
      "name": "MedValor",
      "type": "business",
      "segment": "education",
      "colors": {"individual": "#c2410c", "group": "#196396", "accent": "#2DBF7F"}
    },
    {
      "name": "Thera",
      "type": "business",
      "segment": "technology",
      "colors": {"individual": "#6B5B95", "group": "#196396", "accent": "#2DBF7F"}
    }
  ],
  "typography": {
    "primary": "Inter",
    "code": "JetBrains Mono"
  }
}
```
