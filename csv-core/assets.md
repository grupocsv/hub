# Central de Assets e Identidade Visual

Repositório oficial de marcas, logotipos, wallpapers e elementos visuais do ecossistema Grupo CSV.

::: tip Download
Para baixar um arquivo, clique com o botão direito na imagem e selecione "Salvar imagem como...". Para pacotes completos de logos, acesse os arquivos ZIP na seção de downloads.
:::

---

## Logos do Front-end

Logos otimizados para uso rápido no site e aplicações:

| Marca | Preview | Arquivo |
| :--- | :--- | :--- |
| **Grupo CSV** | ![Logo CSV](/csv-header-logo.png) | `/csv-header-logo.png` |
| **AxiaCare®** | ![AxiaCare](/axia-logo.png) | `/axia-logo.png` |
| **MedValor®** | ![MedValor](/medvalor-logo.png) | `/medvalor-logo.png` |
| **Thera®** | ![Thera](/thera-logo.png) | `/thera-logo.png` |

---

## Wallpapers Oficiais

Fundos oficiais para apresentações, videochamadas e materiais:

| Preview | Arquivo | Uso Recomendado |
| :--- | :--- | :--- |
| ![Ecosystem](/wallpapers/csv_ecosystem_wallpaper_final3.png) | `csv_ecosystem_wallpaper_final3.png` | Hero sections, capas |
| ![Dark](/wallpapers/csv_wallpaper_dark.png) | `csv_wallpaper_dark.png` | Dark mode, terminais |
| ![Light](/wallpapers/csv_wallpaper_light.png) | `csv_wallpaper_light.png` | Light mode, docs |
| ![Videocall](/wallpapers/videocall_4k.png) | `videocall_4k.png` | Reuniões virtuais (4K) |

**Path:** `/wallpapers/[arquivo]`

---

## Pacotes Completos de Logos (ZIP)

Para acesso a todas as variações (vertical, horizontal, positiva, negativa), baixe os pacotes:

| Marca | Download | Conteúdo |
| :--- | :--- | :--- |
| **Grupo CSV** | [Logotipo Grupo CSV.zip](/uploads_usuario/upload_001/Logotipo%20Grupo%20CSV.zip) | Todas as variações |
| **Guilherme Thomé** | [Logotipo Guilherme Thomé.zip](/uploads_usuario/upload_001/Logotipo%20Guilherme%20Thomé.zip) | Marca pessoal completa |
| **AxiaCare®** | [Logotipo AxiaCare.zip](/uploads_usuario/upload_001/Logotipo%20AxiaCare.zip) | Todas as variações |
| **MedValor®** | [Logotipo MedValor.zip](/uploads_usuario/upload_001/Logotipo%20MedValor.zip) | Cor grupo + individual |
| **Thera®** | [Logotipo Thera.zip](/uploads_usuario/upload_001/Logotipo%20Thera.zip) | Cor grupo + individual |

---

## Criativos e Materiais de Marketing

| Pacote | Download | Conteúdo |
| :--- | :--- | :--- |
| **Criativos** | [criativos.zip](/uploads_usuario/upload_001/criativos.zip) | Materiais de marketing |

---

## Estrutura de Variações de Logo

Cada marca possui as seguintes variações:

```
[Marca]/
├── Vertical/
│   ├── positiva.png      # Fundo claro
│   └── negativa.png      # Fundo escuro
└── Horizontal/
    ├── positiva.png      # Fundo claro
    └── negativa.png      # Fundo escuro
```

**Regras:**
- **Positiva** → usar sobre fundos claros (#ffffff, #f4f6f8)
- **Negativa** → usar sobre fundos escuros (#1b1e24, #196396)

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
  "assets": {
    "logos_frontend": [
      {"brand": "Grupo CSV", "path": "/csv-header-logo.png", "format": "PNG"},
      {"brand": "AxiaCare", "path": "/axia-logo.png", "format": "PNG"},
      {"brand": "MedValor", "path": "/medvalor-logo.png", "format": "PNG"},
      {"brand": "Thera", "path": "/thera-logo.png", "format": "PNG"}
    ],
    "wallpapers": [
      {"name": "ecosystem", "path": "/wallpapers/csv_ecosystem_wallpaper_final3.png"},
      {"name": "dark", "path": "/wallpapers/csv_wallpaper_dark.png"},
      {"name": "light", "path": "/wallpapers/csv_wallpaper_light.png"},
      {"name": "videocall", "path": "/wallpapers/videocall_4k.png"}
    ],
    "packages": [
      {"brand": "Grupo CSV", "path": "/uploads_usuario/upload_001/Logotipo Grupo CSV.zip"},
      {"brand": "Guilherme Thomé", "path": "/uploads_usuario/upload_001/Logotipo Guilherme Thomé.zip"},
      {"brand": "AxiaCare", "path": "/uploads_usuario/upload_001/Logotipo AxiaCare.zip"},
      {"brand": "MedValor", "path": "/uploads_usuario/upload_001/Logotipo MedValor.zip"},
      {"brand": "Thera", "path": "/uploads_usuario/upload_001/Logotipo Thera.zip"}
    ]
  }
}
```
