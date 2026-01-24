# Sistema de Identidade Visual: Grupo CSV

Este documento define os parâmetros visuais canônicos para agentes de IA e desenvolvedores. A identidade visual deve ser tratada como dados estruturados, não como sugestão artística.

## 1. Paleta de Cores Canônica

### Grupo CSV (Corporativo)
| Token | Hex | Uso Principal |
| :--- | :--- | :--- |
| `csv-primary` | `#196396` | Marca principal, cabeçalhos, links primários. |
| `csv-dark` | `#1b1e24` | Textos, fundos de alto contraste. |
| `csv-light` | `#f4f6f8` | Fundos de página, áreas de respiro. |

### AxiaCare® (Gestão)
| Token | Hex | Uso Principal |
| :--- | :--- | :--- |
| `axia-blue` | `#196396` | Cor primária (mesma do Grupo CSV). |
| `axia-green` | `#2DBF7F` | Acentos, elementos de destaque. |

### TheraTech® (Tecnologia)
| Token | Hex | Uso Principal |
| :--- | :--- | :--- |
| `thera-green` | `#2DBF7F` | Acentos, botões de ação, indicadores de sucesso. |
| `thera-dark` | `#0D264C` | Fundos tecnológicos, terminais. |
| `thera-purple` | `#6B5B95` | Cor individual da marca (versão independente). |

### MedValor® (Educação)
| Token | Hex | Uso Principal |
| :--- | :--- | :--- |
| `med-orange` | `#c2410c` | Destaques educacionais, alertas de atenção. |
| `med-cream` | `#fff7ed` | Fundos de áreas de leitura (conforto visual). |
| `med-green` | `#2DBF7F` | Versão grupo (acentos compartilhados). |

## 2. Tipografia
O sistema utiliza uma abordagem "Swiss Modern" com foco em legibilidade e hierarquia clara.

- **Primária (Interface/Texto):** `Inter` (Google Fonts). Pesos: 400 (Regular), 600 (SemiBold), 800 (ExtraBold).
- **Secundária (Dados/Código):** `JetBrains Mono` (Google Fonts). Pesos: 400, 500.

## 3. Sistema de Logos

Todas as marcas possuem variações padronizadas para diferentes aplicações.

### Estrutura de Variações

| Marca | Versão de Cor | Variações Disponíveis |
| :--- | :--- | :--- |
| **Grupo CSV** | Azul e Verde | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **AxiaCare®** | Azul e Verde (mesma do CSV) | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **MedValor®** | Cor Grupo (Azul/Verde) | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **MedValor®** | Cor Individual (Laranja/Verde) | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **Thera®** | Cor Grupo (Azul/Verde) | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |
| **Thera®** | Cor Individual (Roxo/Verde) | Vertical Positiva, Horizontal Positiva, Horizontal Negativa |

### Nomenclatura de Arquivos

```
[marca]-[orientacao]-[versao].[formato]

Exemplos:
- csv-horizontal-positiva.png
- axiacare-vertical-positiva.webp
- medvalor-horizontal-negativa-individual.webp
- thera-horizontal-positiva-grupo.webp
```

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

## 4. Wallpapers e Fundos

::: warning Em Desenvolvimento
Os wallpapers oficiais serão disponibilizados em breve. Quando prontos, seguirão este padrão de nomenclatura:
:::

| Tipo | Uso Recomendado |
| :--- | :--- |
| `wallpaper-ecosystem-hero` | Telas de login, capas de apresentação (Hero). |
| `background-videocall-default` | Fundo oficial para reuniões virtuais. |
| `wallpaper-brand-dark` | Fundos de aplicações em Dark Mode. |
| `wallpaper-brand-light` | Fundos de aplicações em Light Mode. |
