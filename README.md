# Hub Central do Grupo CSV

> **MATERIAL DE TRABALHO** - Migrado de `guicthome/guilherme` em 24/01/2026

Este repositório contém o hub central do Grupo CSV, servindo como ponto de convergência para todas as propriedades digitais do ecossistema.

---

## Domínio

| Propriedade | URL |
|-------------|-----|
| **Hub CSV** | [hub.grupocsv.com](https://hub.grupocsv.com) |

---

## Estrutura do Repositório

```
hub/
├── index.html                  # Homepage principal
├── cv.html                     # Currículo Guilherme Thomé
├── mandala-saude.html          # Mandala da Saúde
├── CNAME                       # hub.grupocsv.com
├── compliance/                 # Central de Compliance
│   ├── index.html              # Portal principal
│   ├── privacidade.html        # Política de Privacidade (Grupo)
│   ├── termos.html             # Termos de Uso (Grupo)
│   ├── cookies.html            # Política de Cookies
│   ├── codigo-de-conduta.html  # Código de Ética
│   ├── anticorrupcao.html      # Política Anticorrupção
│   ├── axiacare/               # Políticas AxiaCare
│   ├── medvalor/               # Políticas MedValor
│   └── thera/                  # Políticas Thera
├── axia/                       # AxiaCare assets
│   ├── themis.html
│   └── assets/
├── medvalor/                   # MedValor landing pages
│   ├── cursosgratis.html
│   ├── masterclass-processos.html
│   └── ...
├── thera/                      # TheraTech
├── unihealth/                  # Projetos UniHealth
├── unimed/                     # Projetos Unimed
│   ├── direx.template.html     # Template DIREX
│   └── assets/
└── _infra/                     # Infraestrutura Cognitiva e Operacional
    ├── csv-core/               # Sistema de identidade visual
    │   ├── identity-system.md  # Documentação completa de marca
    │   ├── definition.md       # Definição canônica do Grupo CSV
    │   ├── playbook-hub.md     # Playbook para agentes de IA
    │   └── assets.md           # Central de assets
    ├── uploads_usuario/        # Uploads processados
    │   └── upload_001/         # Logos e criativos extraídos
    │       └── logos_extraidos/
    └── public/                 # Assets públicos
        └── wallpapers/         # Fundos oficiais
```

---

## Sistema de Identidade Visual

O ecossistema possui **5 marcas** com assets completos:

| Marca | Segmento | Cores | Status |
|-------|----------|-------|--------|
| **Grupo CSV** | Corporativo | Azul (#196396) + Verde (#2DBF7F) | Logos extraídos |
| **Guilherme Thomé** | Marca Pessoal | Azul (#196396) + Verde (#2DBF7F) | Logos extraídos |
| **AxiaCare®** | Gestão em Saúde | Azul (#196396) + Verde (#2DBF7F) | Logos extraídos |
| **MedValor®** | Educação | Laranja (#c2410c) ou Azul | Logos extraídos |
| **Thera®** | Tecnologia | Roxo (#6B5B95) ou Azul | Logos extraídos |

### Localização dos Assets

```
_infra/uploads_usuario/upload_001/logos_extraidos/
├── grupo_csv/          # 4 arquivos PNG
├── axiacare/           # 8 variações × 6 formatos
├── medvalor/           # 12 variações × 6 formatos (Laranja + Azul)
├── thera/              # 12 variações × 6 formatos (Roxo + Azul)
├── guilherme_thome/    # 8 variações × 6 formatos
└── criativos/          # Materiais de marketing
```

### Formatos Disponíveis
- **AI** - Adobe Illustrator (edição vetorial)
- **PDF** - Impressão
- **SVG** - Web escalável
- **PNG** - Web com transparência
- **JPG** - Impressão
- **WebP** - Web otimizado

---

## Documentação Completa

Para informações detalhadas sobre identidade visual, consulte:

| Documento | Descrição |
|-----------|-----------|
| [`_infra/csv-core/identity-system.md`](./_infra/csv-core/identity-system.md) | Sistema completo de identidade visual |
| [`_infra/csv-core/assets.md`](./_infra/csv-core/assets.md) | Central de assets e downloads |
| [`_infra/uploads_usuario/README.md`](./_infra/uploads_usuario/README.md) | Instruções de upload e processamento |

---

## Links Oficiais

| Propriedade | URL |
|-------------|-----|
| **Hub CSV** | [hub.grupocsv.com](https://hub.grupocsv.com) |
| **Grupo CSV** | [grupocsv.com](https://grupocsv.com) |
| **Guilherme Thomé** | [guithome.com.br](https://guithome.com.br) |
| **AxiaCare** | [axcare.com.br](https://axcare.com.br) |
| **MedValor** | [medvalor.med.br](https://medvalor.med.br) |
| **Thera** | [thera.tech](https://thera.tech) |

---

## Central de Compliance

Acesse a Central de Compliance do Grupo CSV em [`/compliance/`](./compliance/).

| Categoria | Documentos |
|-----------|------------|
| **Políticas do Grupo** | Privacidade, Termos de Uso, Cookies, Código de Conduta |
| **Integridade** | Anticorrupção, Brindes, Terceiros, Cláusulas Contratuais |
| **Por Empresa** | Privacidade e Termos específicos (AxiaCare, MedValor, Thera) |

---

## Infraestrutura Cognitiva

A pasta `_infra/` contém a **fonte da verdade** para desenvolvedores e agentes de IA:

| Documento | Propósito |
|-----------|-----------|
| `csv-core/definition.md` | Definição canônica do Grupo CSV |
| `csv-core/identity-system.md` | Sistema de identidade visual completo |
| `csv-core/playbook-hub.md` | Playbook para agentes de IA |
| `csv-core/assets.md` | Inventário de assets disponíveis |

**Acesso:** [github.com/grupocsv/hub/tree/main/_infra](https://github.com/grupocsv/hub/tree/main/_infra)

---

## Histórico de Migração

| Data | Evento |
|------|--------|
| 24/01/2026 | Migração de `guicthome/guilherme` para `grupocsv/hub` |
| 24/01/2026 | Extração de todos os ZIPs de logos (5 marcas + criativos) |
| 24/01/2026 | Atualização completa da documentação de identidade visual |
| 24/01/2026 | Configuração do domínio `hub.grupocsv.com` |
| 24/01/2026 | Central de Compliance implementada (migrada da AxiaCare) |
| 24/01/2026 | Correção de cores nas páginas de Compliance (MedValor/Thera) |
| 24/01/2026 | Renomeação `_backup_vitepress` → `_infra` (Infraestrutura Cognitiva) |
| 24/01/2026 | Remoção do Radar (fora do escopo) |
| 24/01/2026 | Novo portal unificado com seções de Compliance e Infra |

---

## Contato

**Email:** [contato@grupocsv.com](mailto:contato@grupocsv.com)

---

**Última atualização:** 24/01/2026
