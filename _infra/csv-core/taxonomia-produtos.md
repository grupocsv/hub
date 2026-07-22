# Taxonomia de Produtos Digitais

## Propósito

Este documento define a classificação oficial dos ativos digitais do ecossistema Hub CSV. Deve ser consultado ao nomear, organizar e planejar qualquer novo produto digital do Grupo CSV e parceiros.

O inventário transversal exibido na página inicial é mantido em `produtos-grupo.json`. Produtos do Grupo CSV permanecem no catálogo central; páginas de empresas e parceiros exibem somente seus recursos operacionais próprios e entregáveis específicos.

As definições foram consolidadas a partir de Gartner, TOGAF, SBIS e CDHI.br, adaptadas ao contexto do Hub.

## Categorias

A taxonomia é composta por 5 categorias com critérios claros de distinção.

| Categoria | Propósito Principal | Interatividade | Back-end | Exemplo no Hub |
| :--- | :--- | :--- | :--- | :--- |
| **Página Estática** | Informar | Baixa (links) | Não | `compliance/termos.html` |
| **Ferramenta (Tool)** | Executar tarefa específica | Média (inputs/outputs) | Opcional (client-side ou Worker) | `unihealth/calc-plantao.html` |
| **WebApp** | Solução de negócio completa | Alta (CRUD, workflows) | Sim (BD, Auth, APIs) | `icds/tea-dataset.html` |
| **Painel BI (Dashboard)** | Visualizar e analisar dados | Média (filtros, drill-down) | Sim (data warehouse) | `unimed/onco.html` |
| **Portal** | Ponto de acesso unificado | Alta (agregação de apps) | Sim (Auth central, APIs) | `hub.grupocsv.com` (visão futura) |

## Definições Detalhadas

### Página Estática

> Conteúdo fixo servido diretamente ao navegador sem processamento server-side. Não muda com base no usuário ou interação.

**Características:** HTML/CSS/JS puros, sem lógica de negócio. Foco em comunicação unidirecional.

**Quando usar:** Documentação (termos, políticas), infográficos, landing pages de marketing, páginas institucionais.

**Exemplos no Hub:** `compliance/termos.html`, `compliance/privacidade.html`, `thera/index.html`.

### Ferramenta (Tool)

> Aplicação focada em uma tarefa específica, com escopo limitado e interface simplificada.

**Características:** Resolve um problema pontual. Pode ser puramente client-side (lógica no navegador) ou usar um back-end leve (ex: Cloudflare Worker) para tarefas específicas. Não requer banco de dados complexo nem autenticação de múltiplos usuários.

**Quando usar:** Calculadoras, geradores de documentos simples, conversores, formulários de coleta com envio único.

**Exemplos no Hub:** `unihealth/calc-plantao.html` (calculadora), `axia/nota-fiscal.html` (gerador de NF), `axia/reembolso.html` (solicitação de reembolso).

### WebApp (Aplicação Web)

> Aplicação que roda no navegador com lógica de negócio, processamento de dados, interação dinâmica e, tipicamente, back-end.

**Características:** Solução completa para um processo de negócio. Envolve autenticação de usuários, persistência de dados em banco (CRUD), múltiplos papéis e permissões, e workflows complexos. É o que o TOGAF classifica como "Custom Development" para a cadeia de valor primária.

**Quando usar:** Sistemas de gestão, plataformas colaborativas, ferramentas de análise com entrada de dados contínua.

**Exemplos no Hub:** `icds/tea-dataset.html` é o exemplo mais claro de uma Ferramenta que evoluiu para WebApp, com login, multi-tenancy e back-end robusto para persistência e análise. `axia/propostas.html` também se enquadra aqui pela lógica de negócio complexa.

### Painel BI (Dashboard)

> Interface visual que agrega e apresenta dados de múltiplas fontes em formato consolidado (gráficos, KPIs, tabelas).

**Características:** Foco em consumo de informação, não em entrada de dados. Permite interatividade através de filtros, seletores de data e drill-down para explorar os dados. Requer um back-end com data warehouse ou data lake para consolidar e servir os dados.

**Quando usar:** Monitoramento de indicadores, análise de performance, apresentação de resultados.

**Exemplos no Hub:** `unimed/onco.html`, `unimed/painel-onco-vo.html`.

### Portal

> Ponto de entrada unificado que agrega múltiplas aplicações, ferramentas e conteúdos sob uma interface comum.

**Características:** Oferece uma experiência de usuário coesa para acessar diferentes sistemas. Geralmente inclui single sign-on (SSO), personalização baseada no perfil do usuário e um menu de navegação para os diferentes módulos (WebApps, Ferramentas, Painéis).

**Quando usar:** Quando o número de WebApps e Ferramentas cresce a ponto de exigir uma camada de orquestração e acesso centralizado.

**Exemplos no Hub:** O próprio `hub.grupocsv.com` é a semente de um Portal, que irá agregar todas as soluções desenvolvidas para os diferentes clientes e empresas do grupo.

## Mapeamento Atual do Ecossistema

| Ativo Digital | Categoria | Justificativa |
| :--- | :--- | :--- |
| `icds/tea-dataset.html` | **WebApp** | Lógica complexa, multi-tenancy, login, back-end para persistência. |
| `axia/nota-fiscal.html` | **Ferramenta** | Foco em uma única tarefa (gerar NF) com envio para Worker. |
| `axia/reembolso.html` | **Ferramenta** | Foco em uma única tarefa (solicitar reembolso) com envio para Worker. |
| `axia/propostas.html` | **WebApp** | Lógica de negócio complexa para gerar propostas, com múltiplos inputs e envio. |
| `unihealth/calc-plantao.html` | **Ferramenta** | Calculadora client-side com escopo bem definido. |
| `unimed/onco.html` | **Painel BI** | Visualização de dados de oncologia com filtros e gráficos. |
| `compliance/*` | **Página Estática** | Conteúdo informativo sem interatividade. |
| `cmm.grupocsv.com` | **WebApp** | Catálogo versionado, autenticação, API e atualização governada. TNUMM é a fonte canônica atual, não a identidade do produto. |

## Recomendações

1. Adotar formalmente esta taxonomia para nomear e organizar os projetos no repositório e na documentação interna.
2. Revisar o roadmap de cada ativo à luz desta classificação, alinhando expectativas de complexidade e infraestrutura.
3. Usar esta referência ao planejar novos produtos para definir escopo, stack e nível de back-end necessário desde o início.

## Referências

1. EveryStep Automation. "Web Applications vs. Static Websites - What's the Difference?".
2. Gartner Peer Insights. "Explore Enterprise Software Categories".
3. Gartner. "Reference Architecture Brief: Web Application Architecture". Julho 2025.
4. Conexiam. "TOGAF ADM Phase C - Develop the Application Architecture".
5. Rasmussen, N. H., Bansal, M., & Chen, C. Y. (2009). *Business dashboards: a visual catalog for design and deployment*. John Wiley & Sons.
6. LinkedIn. "Web Applications vs. Portals: Understanding the Strategic Distinction".
