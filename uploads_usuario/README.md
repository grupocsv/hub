# Central de Uploads do Usuário

Esta pasta é o ponto de entrada para **todos os assets** enviados pelo proprietário do hub. Os arquivos aqui são processados e distribuídos para seus destinos finais no site.

---

## Instruções para Agentes de IA

### Objetivo
Quando novos arquivos aparecerem nesta pasta, o agente deve:
1. **Identificar** o tipo de arquivo (logo, wallpaper, criativo, documento)
2. **Processar** conforme as regras abaixo
3. **Mover** para o destino correto em `/public/`
4. **Atualizar** a documentação relevante
5. **Commitar** as alterações

### Estrutura de Uploads

```
uploads_usuario/
├── README.md                    # Este arquivo
├── upload_001/                  # Primeiro lote (Janeiro 2026)
│   ├── Logotipo Grupo CSV.zip   # Pacote completo de logos
│   ├── Logotipo Guilherme Thomé.zip
│   ├── Logotipo AxiaCare.zip
│   ├── Logotipo MedValor.zip
│   ├── Logotipo Thera.zip
│   ├── criativos.zip            # Materiais de marketing
│   ├── axiacare.png             # Logo front-end (já processado)
│   ├── medvalor.png             # Logo front-end (já processado)
│   ├── thera.png                # Logo front-end (já processado)
│   ├── readme.txt               # Notas do upload
│   └── wallpapers/              # Fundos oficiais
│       ├── csv_ecosystem_wallpaper_final3.png
│       ├── csv_wallpaper_dark.png
│       ├── csv_wallpaper_light.png
│       └── videocall_4k.png
└── upload_NNN/                  # Próximos lotes
```

---

## Regras de Processamento

### Logos (arquivos .png, .svg, .webp)
| Condição | Destino | Ação |
| :--- | :--- | :--- |
| Logo para front-end (homepage) | `/public/[marca]-logo.png` | Copiar e renomear |
| Pacote ZIP de logos | Manter em `/uploads_usuario/` | Referenciar na documentação |

**Nomenclatura de logos front-end:**
- `axia-logo.png` → AxiaCare
- `medvalor-logo.png` → MedValor
- `thera-logo.png` → Thera
- `csv-header-logo.png` → Grupo CSV (horizontal)

### Wallpapers (arquivos grandes .png)
| Condição | Destino |
| :--- | :--- |
| Wallpaper/fundo | `/public/wallpapers/` |

### Criativos (materiais de marketing)
| Condição | Destino |
| :--- | :--- |
| ZIP de criativos | Manter em `/uploads_usuario/` |
| Imagens soltas | `/public/criativos/` (criar se necessário) |

### Documentos
| Condição | Destino |
| :--- | :--- |
| PDFs, docs | `/public/docs/` (criar se necessário) |

---

## Registro de Uploads

| ID | Data | Conteúdo | Status | Processado por |
| :--- | :--- | :--- | :--- | :--- |
| `upload_001` | 2026-01-24 | Logos completos (5 marcas), wallpapers (4), criativos | ✅ Processado | Claude |

---

## Checklist de Processamento (Para IA)

Ao processar um novo upload:

- [ ] Verificar conteúdo da pasta
- [ ] Identificar logos para front-end (PNG/WebP soltos)
- [ ] Copiar logos para `/public/` com nomes corretos
- [ ] Copiar wallpapers para `/public/wallpapers/`
- [ ] Atualizar `/csv-core/assets.md` se houver novos assets
- [ ] Atualizar `/csv-core/identity-system.md` se houver novas marcas
- [ ] Atualizar este README com o registro do upload
- [ ] Testar build (`npm run docs:build`)
- [ ] Commitar e fazer push

---

## Marcas do Ecossistema

Para referência rápida, estas são as marcas que podem aparecer nos uploads:

| Marca | Segmento | Cores |
| :--- | :--- | :--- |
| **Grupo CSV** | Corporativo | Azul (#196396) + Verde (#2DBF7F) |
| **Guilherme Thomé** | Marca Pessoal | Azul (#196396) + Verde (#2DBF7F) |
| **AxiaCare®** | Gestão em Saúde | Azul (#196396) + Verde (#2DBF7F) |
| **MedValor®** | Educação | Laranja (#c2410c) ou Azul + Verde |
| **Thera®** | Tecnologia | Roxo (#6B5B95) ou Azul + Verde |

---

## Notas Técnicas

- **Tamanho máximo por arquivo no GitHub:** 25MB (usar ZIP para arquivos maiores)
- **Formatos preferidos:** PNG (logos com transparência), WebP (otimizado), SVG (vetorial)
- **Esta pasta NÃO é servida pelo VitePress** - apenas `/public/` é acessível no site final
- **Arquivos ZIP são mantidos aqui** para download/referência, não são extraídos automaticamente

---

**Última atualização:** 2026-01-24
**Atualizado por:** Claude (Agente IA)
