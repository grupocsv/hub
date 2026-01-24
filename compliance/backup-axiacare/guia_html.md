---
title: "Guia AxView — Padrões Definitivos para HTMLs Corporativos"
version: 3.0.0
owner: "Guilherme"
scope: "Padrões unificados de design e desenvolvimento para HTMLs corporativos e institucionais das marcas AxiaCare®, MedValor®, Unihealth e Unimed"
last_compiled: 2025-09-13
tags: [AxSets, AxView, VBHC, Compliance, Propostas, Educação Executiva]
---

# Sumário executivo

Este guia consolida e atualiza os padrões de HTML corporativo e institucional para **AxiaCare**, **MedValor**, **Unihealth** e **Unimed**, unindo as diretrizes do *Documento Mestre* anterior, a **marca AxView™** e as especificações oficiais da **GT Corporation**. Os objetivos principais são:

- **Padronizar e escalar** o desenvolvimento de páginas e documentos HTML (políticas, autorizações, propostas, relatórios, landing pages, dashboards) de forma consistente, responsiva, acessível e elegante.
- **Harmonizar a identidade visual**, incorporando os *tokens* de cores e tipografia da marca (retirados do kit de marca no Canva) e garantindo que as diferenças entre AxiaCare (consultoria/gestão) e MedValor (educação executiva) se manifestem apenas na cor de acento:contentReference[oaicite:1]{index=1}.
- **Garantir governança e segurança**, com uso de hash SHA‑256 + data/hora como carimbo de autoridade, placeholders claros para personalização e integração de webhooks e `mailto` para interações.
- **Promover modularidade e reuso**: bibliotecas de componentes, templates completos e comandos (`gen_html`, `assess_html`, `refine_html`) que podem ser utilizados em DevMode, GPT‑Custom e API para geração automatizada de documentos.
- **Reforçar a cultura AxControl™**, assegurando que cada documento seja mais que uma página: um *ambiente inteligente* ligado ao Método (AxWay), Visual (AxView) e Inteligência (AxIntel), conforme as fórmulas do GTCorp.

## 1. Paleta de cores e tokens visuais

A paleta oficial da marca foi obtida no **Kit de Marca Axia | MedValor** no Canva. Para padronizar, adote os seguintes grupos de cores e use tokens semânticos. Cada marca (AxiaCare®, MedValor®, Unihealth, Unimed) escolhe um *accent* (cor de acento) diferente, mantendo as demais.

| Token             | Hex     | Uso principal                       |
|-------------------|---------|-------------------------------------|
| `--color-primary` | #196396 | Azul escuro — base para cabeçalhos, títulos e elementos de marca. |
| `--color-secondary-1` | #a6d8c0 | Verde pastel — detalhes, cartões e fundos claros. |
| `--color-secondary-2` | #a6fb90 | Verde‑limão — realces sutis, gradientes e gráficos. |
| `--color-dark`    | #2d3445 | Azul‑marinho quase preto — texto, ícones escuros, contrastes. |
| `--color-light`   | #f8f5f0 | Off‑white — fundo de páginas e cartões. |
| `--color-white`   | #ffffff | Branco puro — fundo de seções e elementos transparentes. |
| `--color-accent`  | #2dbf7f (AxiaCare/Unihealth) / #ff8f00 (MedValor) | Cor de destaque para botões, chips, links e CTAs; altere conforme a marca. |

> **Nota:** O Documento Mestre original usava `#196396` e `#2DBF7F` como primária e acento. O kit de marca adiciona o laranja `#ff8f00` (usado apenas na MedValor) e tons pastéis. Use os tokens acima para todos os elementos estilizados. Aplique `clamp()` em tamanhos de fonte para responsividade e garanta contraste AA em combinações de cores:contentReference[oaicite:3]{index=3}.

## 2. Tipografia e hierarquia de títulos

O kit de marca define **Grifter** como fonte oficial para títulos e subtítulos. Aplique:

| Nível              | Fonte           | Tamanho base (desktop) | Estilo     | Uso                                   |
|--------------------|-----------------|------------------------|-----------|---------------------------------------|
| Título             | Grifter         | 42px                   | Bold      | Títulos de páginas e seções principais. |
| Subtítulo          | Grifter         | 36px                   | Regular   | Subtítulos e cabeçalhos de blocos.      |
| Cabeçalho de seção | System UI / Sans-serif (e.g., Inter, Segoe UI) | 24–32px via `clamp()` | Regular | Títulos internos, colunas de tabelas. |
| Corpo              | System UI / Sans-serif | 16–20px via `clamp()` | Regular   | Parágrafos, listas, notas e tabelas.   |
| Legenda            | System UI / Sans-serif | 14px                | Italic    | Figuras, gráficos e observações.       |

Para compatibilidade universal (web e PDF), utilize fontes nativas do sistema no corpo de texto. Evite fontes customizadas externas ou carregamentos adicionais.

## 3. Layout e responsividade

Desenvolva todos os documentos em layout *mobile‑first*, utilizando grids fluídos e `clamp()` para escalonar tamanhos de fonte e margens. Certifique-se de que:

- **Cabeçalhos** tenham posicionamento `sticky` no topo, com fundo semiopaco e `backdrop-filter` para efeito vidro.
- **Tabelas** sejam envoltas em wrappers (`.table-wrap`, `.matrix-wrap`) com scroll horizontal no mobile e `thead` fixo.
- **Timeline** use elementos customizados (círculos e linhas) e seja semântica (`role="list"`).
- **Cards e chips** reutilizem tokens de borda, raio e sombra para coerência.
- **Rodapés** apresentem links e créditos institucionais, respeitando a variação de cores por marca.

## 4. Biblioteca de componentes

- **Header com chip de compliance** – logotipo, menu de navegação, chip “Compliance” (`mailto` ou link hub).
- **Cards institucionais** e **chips de status** – reutilize para destaques e âncoras.
- **Tabelas** (matriz 3×3, precificação, indicadores) – com cabeçalho sticky e responsividade.
- **Timeline / Diagramas** – fluxo de trabalho ou marcos importantes.
- **Formulários com feedback (modais/toasts)** – para autorizações e dúvidas, usando `mailto`.
- **Modal e Toast** – janelas leves para retorno ao usuário.
- **Rodapé** – adapte para cada marca, mantendo links úteis e redes sociais.

## 5. Templates completos

Forneça modelos prontos para:

- **Políticas** (Privacidade, Cookies, Anticorrupção, Brindes, Terceiros, Cláusulas de Integridade), com seções e tabelas.
- **Central de Compliance** – com âncoras e agrupamento de documentos.
- **Autorização de Parceria** – inclui formulários, hash + data/hora, webhooks e `mailto`.
- **Proposta Comercial (AxView | Pages)** – estrutura de 5 páginas: Apresentação, Impressões, Matriz de Valor, Precificação & Linha do Tempo, Vamos ao Trabalho.
- **Dashboards e Análises** (ex.: pareto de suturas).
- **Landing pages educativas** (MedValor).

## 6. Formatos de saída

Gere HTML5 com CSS inline (tokens) e JavaScript leve; crie wrappers para tabelas; use mailto para enviar formulários; permita impressão via `@media print` para PDF.

## 7. Dúvidas ou itens a evoluir

- Banner de cookies e rodapé definitivo.
- Integrações backend além de webhooks.
- Suporte multilíngue (EN/ES).
- Catálogo completo de compliance.

## 8. Aplicações práticas

Hub institucional de compliance; propostas comerciais escaláveis; educação executiva; relatórios de linhas de cuidado; automação com webhooks.

## 9. Riscos/limitações

- `mailto` não envia anexos automaticamente.
- Divergência de CSS sem assets centralizados.
- Dependência de JS do navegador para hash/hora.
- Possível quebra de layout em tabelas sem wrapper.

## 10. Organização e versionamento

1. **Estrutura de repositório**: mantenha assets (`css`, `js`) e templates em pastas dedicadas; crie subpastas para hubs (`hub.axcare.com.br`, `hub.medvalor.med.br`) e para propostas (`crm.axcare.com.br`).
2. **Versionamento semântico**: use `MAJOR.MINOR.PATCH`.
3. **Changelog**: registre alterações em cada update.
4. **CI/CD**: adote pipelines de lint, checker de links e preview em GitHub Pages.
5. **Reposição de código e domínios**: hospede novas páginas nos repositórios e domínios corretos; evite usar o repositório pessoal `guicthome/guilherme` para novos HTMLs.

## 11. Anexo – Comandos e DevMode

- **gen_html** – recebe JSON (`marca`, `tipo_template`, `dados`) e retorna HTML completo.
- **assess_html** – recebe HTML; retorna JSON com scores de responsividade, acessibilidade, consistência visual e aderência ao guia.
- **refine_html** – recebe HTML + JSON de requisitos; devolve HTML ajustado sem alterar dados substantivos.

---

**Conclusão:** Esta versão 3.0.0 do guia inclui o fluxo completo para integração com repositórios GitHub (control, comercial, hub) e o manual (`guia_html.md`), reforçando a governança e modularidade da AxView. Use-o como referência definitiva para o GPT Custom **AxIntel™ | HTML AxView™**, para DevMode e para qualquer automação via API.
