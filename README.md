# Hub Grupo CSV

Portal central do ecossistema **Grupo CSV** - Cuidados em Saúde com Valor.

**URL:** [hub.grupocsv.com](https://hub.grupocsv.com)

---

## Sobre

Este repositório contém o Hub Central do Grupo CSV, construído com [VitePress](https://vitepress.dev/), servindo como ponto de entrada unificado para:

- **Empresas do Grupo** - AxiaCare®, MedValor®, Thera
- **Instituições Parceiras** - Entregáveis para Unimed GV e Unihealth
- **Governança e Compliance** - Políticas, termos e documentação de integridade
- **Fundador** - Informações sobre Guilherme Thomé
- **Infraestrutura Cognitiva** - Documentação técnica para desenvolvedores e agentes
- **Produtos do Grupo CSV** - Compass™, Signal™, CMM, Deck™, Relay™, RTAV™, Panta™ e Discovery™

---

## Taxonomia de Produtos Digitais

O ecossistema Hub classifica seus ativos digitais em 5 categorias, conforme a taxonomia oficial definida em `_infra/csv-core/taxonomia-produtos.md`.

O inventário canônico dos produtos exibidos na página inicial está em `_infra/csv-core/produtos-grupo.json` e é validado automaticamente no pipeline de publicação.

| Categoria | Propósito | Back-end | Exemplos no Hub |
| :--- | :--- | :--- | :--- |
| **Página Estática** | Informar | Não | `compliance/*`, `founder/`, `thera/`, `medvalor/` |
| **Ferramenta (Tool)** | Executar tarefa específica | Opcional | `axia/nota-fiscal.html`, `axia/reembolso.html`, `unihealth/calc-plantao.html` |
| **WebApp** | Solução de negócio completa | Sim | `p/tea-dataset/`, `axia/propostas.html`, `cmm.grupocsv.com` |
| **Painel BI** | Visualizar e analisar dados | Sim | `unimed/onco.html`, `unimed/painel-onco-vo.html` |
| **Portal** | Ponto de acesso unificado | Sim | `hub.grupocsv.com` (visão futura) |

### Mapeamento Completo dos Ativos

| Ativo Digital | Caminho | Categoria | Entidade | Status |
| :--- | :--- | :--- | :--- | :--- |
| Data Set TEA | `p/tea-dataset/` | **WebApp** | ICDS | Ativo |
| Gerador de Propostas | `axia/propostas.html` | **WebApp** | AxiaCare | Ativo |
| Gerador de Nota Fiscal | `axia/nota-fiscal.html` | **Ferramenta** | AxiaCare | Ativo |
| Solicitação de Reembolso | `axia/reembolso.html` | **Ferramenta** | AxiaCare | Ativo |
| Calculadora de Plantão | `unihealth/calc-plantao.html` | **Ferramenta** | Unihealth | Ativo |
| Painel de Oncologia | `unimed/onco.html` | **Painel BI** | Unimed GV | Ativo |
| Painel Onco (versão original) | `unimed/painel-onco-vo.html` | **Painel BI** | Unimed GV | Ativo |
| Relatórios de Oncologia | `unimed/relatorios-onco.html` | **Painel BI** | Unimed GV | Ativo |
| Cuidado Coordenado | `unimed/cuidadocoordenado.html` | **Painel BI** | Unimed GV | Ativo |
| Especialidades | `unimed/especialidades.html` | **Painel BI** | Unimed GV | Ativo |
| GCE | `unimed/gce.html` | **Painel BI** | Unimed GV | Ativo |
| Terapias Especiais (Unimed) | `unimed/tea.html` | **Painel BI** | Unimed GV | Ativo |
| Psiquiatria | `unimed/psiquiatria.html` | **Painel BI** | Unimed GV | Ativo |
| Pediatria Ambulatorial | `unimed/ped-amb.html` | **Painel BI** | Unimed GV | Ativo |
| Variabilidade de Exames | `unimed/variabilidade-exames.html` | **Painel BI** | Unimed GV | Ativo |
| Viva Pleno | `unimed/vivapleno.html` | **Painel BI** | Unimed GV | Ativo |
| FIOS | `unihealth/fios.html` | **Painel BI** | Unihealth | Ativo |
| ISC Cesarianas | `unihealth/isc-cesarianas.html` | **Painel BI** | Unihealth | Ativo |
| OPME | `unihealth/opme.html` | **Painel BI** | Unihealth | Ativo |
| Repasse | `unihealth/repasse.html` | **Painel BI** | Unihealth | Ativo |
| Retorno PA | `unihealth/retornopa.html` | **Painel BI** | Unihealth | Ativo |
| Julho 2025 | `unihealth/julho25.html` | **Painel BI** | Unihealth | Ativo |
| Central de Compliance | `compliance/` | **Página Estática** | Grupo CSV | Ativo |
| Fundador | `founder/` | **Página Estática** | Grupo CSV | Ativo |
| Deck Institucional | `deck/` | **Página Estática** | Grupo CSV | Ativo |
| Admin | `admin/` | **Ferramenta** | Grupo CSV | Ativo |
| Compass™ | `compass/` | **Página Estática** | Grupo CSV | Ativo |
| Signal™ | `signal/` | **Página Estática** | Grupo CSV | Ativo |
| CMM | [cmm.grupocsv.com](https://cmm.grupocsv.com) | **WebApp** | Grupo CSV | Ativo |
| Deck™ | [deck.grupocsv.com](https://deck.grupocsv.com) | **WebApp** | Grupo CSV | Ativo |
| Relay™ | [relay.axcare.com.br](https://relay.axcare.com.br) | **WebApp** | Grupo CSV | Ativo |
| RTAV™ | [rtav.axcare.app](https://rtav.axcare.app) | **WebApp** | Grupo CSV | Ativo |
| Panta™ | [panta.grupocsv.com](https://panta.grupocsv.com) | **WebApp** | Grupo CSV | Ativo |
| Discovery™ | [discovery.axcare.app](https://discovery.axcare.app) | **WebApp** | Grupo CSV | Ativo |
| ICDS (landing) | `icds/` | **Página Estática** | ICDS | Ativo |

---

## Estrutura

```
grupocsv/hub/
├── docs/                    # VitePress source
│   ├── .vitepress/
│   │   └── config.mts       # Configuração VitePress
│   ├── public/              # Assets estáticos
│   └── index.md             # Página inicial
├── assets/                  # Assets fonte (logos, favicons)
│   ├── logos/
│   └── favicons/
│
├── axia/                    # AxiaCare — Ferramentas e WebApps
├── medvalor/                # MedValor — Página institucional
├── thera/                   # Thera — Página institucional
│
├── unimed/                  # Unimed GV — Painéis BI e dashboards
├── unihealth/               # Unihealth — Painéis BI e ferramentas
│
├── p/                       # WebApps standalone
│   └── tea-dataset/         # Data Set TEA (WebApp)
│
├── compliance/              # Central de Compliance (Páginas Estáticas)
│   ├── index.html
│   ├── axiacare/
│   ├── medvalor/
│   ├── spectra/
│   └── thera/
│
├── founder/                 # Guilherme Thomé (Página Estática)
├── icds/                    # ICDS — Landing page e assets
├── admin/                   # Painel administrativo (Ferramenta)
├── deck/                    # Deck institucional (Página Estática)
│
├── compass/                 # Compass™ — Linha editorial estratégica
│   ├── edicoes/
│   ├── templates/
│   ├── policies/
│   └── skills/
│
├── signal/                  # Signal™ — Resumo semanal estratégico
│   ├── edicoes/
│   ├── templates/
│   ├── policies/
│   └── skills/
│
├── _infra/                  # Infraestrutura Cognitiva
│   ├── csv-core/            # Definições canônicas e taxonomia
│   ├── axiacare/            # Mandate AxiaCare
│   ├── medvalor/            # Mandate MedValor
│   ├── thera/               # Mandate Thera
│   └── uploads_usuario/     # Logos extraídos
│
├── workers/                 # Cloudflare Workers (back-end)
│   ├── csv-auth/            # Autenticação e sessões
│   ├── csv-ai/              # Assistente de IA
│   └── csv-email/           # Envio de e-mails e persistência
│
├── tools/                   # Ferramentas internas (scripts)
│   ├── compass-pdf/
│   └── signal-pdf/
│
├── package.json
├── manifest.json            # Mapa de ativos para agentes de IA
├── llms.txt                 # Ponto de entrada para agentes de IA
├── completeness-checklist.md
└── CNAME                    # Domínio customizado
```

---

## Módulos

### Módulo 1 - Empresas do Grupo
| Empresa | Cor | Status |
|---------|-----|--------|
| **AxiaCare®** | Azul/Verde (#196396 + #2DBF7F) | Ativo |
| **MedValor®** | Laranja (#c2410c) | Placeholder |
| **Thera** | Roxo (#6B5B95) | Placeholder |

### Módulo 2 - Instituições Parceiras
- **Unimed Governador Valadares** - Painéis BI, relatórios, dashboards
- **Unihealth** - Painéis BI, calculadoras, indicadores

### Módulo 3 - Governança e Compliance
Central unificada de políticas, termos de uso, código de conduta e documentação de integridade.

### Módulo 4 - Fundador
Página com informações, links e contatos de Guilherme Thomé.

### Módulo 5 - Infraestrutura Cognitiva
Documentação técnica pensada para:
- Desenvolvedores humanos
- Agentes de IA
- Integração contínua

### Módulo 6 - Compass™
Linha editorial estratégica do Grupo CSV. Documentos técnico-estratégicos para tomada de decisão em organizações de saúde.

- **Central Compass:** [compass/README.md](compass/README.md)
- **Edição 001/2026:** [Metas quantitativas de produção em contratos ACO com orçamento global](compass/edicoes/2026/001/compass.md)

### Módulo 7 - Signal™
Resumo semanal de inteligência estratégica do Grupo CSV. Sintetiza os 5 a 7 fatos mais relevantes da semana, extraídos da varredura contínua de fontes internas.

- **Central Signal:** [signal/README.md](signal/README.md)
- **Edição S08/2026: [16 a 20 de fevereiro de 2026](signal/edicoes/2026/S08/signal.md)

### Módulo 8 - WebApps
Aplicações web completas com autenticação, persistência e lógica de negócio.

- **Data Set TEA:** [p/tea-dataset/](https://hub.grupocsv.com/p/tea-dataset/) — Coleta de dados multi-tenant para TEA (ICDS)
- **CMM:** [cmm.grupocsv.com](https://cmm.grupocsv.com) — catálogo versionado de materiais e medicamentos, com publicações TNUMM como fonte canônica atual

---

## Workers (Back-end)

| Worker | Função | Bindings |
| :--- | :--- | :--- |
| `csv-auth` | Autenticação e sessões | D1, Resend |
| `csv-ai` | Assistente de IA contextual | D1, AI Gateway |
| `csv-email` | Envio de e-mails e persistência de formulários | D1, Resend |
| `tnumm` | WebApp, API e atualização governada do CMM | D1 `tnumm-control`, R2 `tnumm-evidence` |

---

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run docs:dev

# Build para produção
npm run docs:build

# Preview do build
npm run docs:preview
```

---

## Deploy

O deploy é automático via GitHub Actions quando há push na branch `main`.

O workflow:
1. Faz build do VitePress
2. Copia módulos estáticos (axia, medvalor, compliance, etc.)
3. Deploy para GitHub Pages

---

## Ecossistema Digital

| Portal | URL | Função |
|--------|-----|--------|
| **Hub CSV** | [hub.grupocsv.com](https://hub.grupocsv.com) | Este portal (empresarial) |
| **Hub Pessoal** | [hub.guithome.com.br](https://hub.guithome.com.br) | Portal pessoal Guilherme |
| **Site CSV** | [grupocsv.com](https://grupocsv.com) | Site institucional |
| **Site Pessoal** | [guithome.com.br](https://guithome.com.br) | Site Guilherme Thomé |
| **Blog** | [blog.guithome.com.br](https://blog.guithome.com.br) | Artigos e conteúdo |
| **Links** | [link.guithome.com.br](https://link.guithome.com.br) | Linktree |

---

## Histórico de Migração

| Data | Evento |
|------|--------|
| 24/01/2026 | Migração de `guicthome/guilherme` para `grupocsv/hub` |
| 24/01/2026 | Implementação da Central de Compliance |
| 24/01/2026 | Renomeação `_backup_vitepress` → `_infra` |
| 24/01/2026 | Reestruturação completa em módulos |
| 24/01/2026 | Migração para VitePress |
| 24/01/2026 | Criação do módulo Founder |
| 24/01/2026 | Limpeza de arquivos desnecessários |
| 19/02/2026 | Implementação da Central Compass™ e publicação da edição 001/2026 |
| 19/02/2026 | Limpeza de avatares: manter apenas 3 oficiais (current, current_low-res, with-name) |
| 19/02/2026 | Footer com logos reais clicáveis; navbar com logo transparente; Compass™ TM global |
| 19/02/2026 | Redesign da publicação Compass™ 001/2026 com layout elegante |
| 24/02/2026 | Implementação da Central Signal™ e publicação da edição S08/2026 |
| 06/03/2026 | Adoção formal da Taxonomia de Produtos Digitais |
| 06/03/2026 | Mapeamento completo dos ativos digitais do ecossistema |
| 06/03/2026 | Documentação dos Workers (csv-auth, csv-ai, csv-email) |

---

## Contato

- **Grupo CSV:** contato@grupocsv.com
- **Compliance:** compliance@grupocsv.com
- **Guilherme Thomé:** guilherme@guithome.com.br

---

## Licença

© 2026 Grupo CSV. Todos os direitos reservados.

**AxiaCare®**, **MedValor®** e **Thera** integram o portfólio de marcas do Grupo CSV.

---

## Arquitetura de Consumo por IA

Este repositório implementa uma arquitetura robusta para consumo de conhecimento por Agentes de IA, garantindo completude, persistência e eficiência. A estrutura é composta por três artefatos principais na raiz do projeto:

1.  **`llms.txt`**: O ponto de entrada padronizado que fornece o contexto inicial e as instruções para o agente.
2.  **`manifest.json`**: O mapa completo e hierárquico de todos os ativos de conhecimento, com metadados como prioridade, versão e checksum para validação.
3.  **`completeness-checklist.md`**: Um guia processual com checkpoints que o agente deve seguir e marcar para garantir a leitura completa e criar um sinal de persistência entre sessões.

Agentes de IA devem obrigatoriamente iniciar sua interação pelo `llms.txt` e seguir as instruções contidas nele para uma compreensão precisa e integral do ecossistema do Grupo CSV.
