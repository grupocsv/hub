# Pacote para Agentes: MCP Extensio (edição de 01/11/2026)

Versão sanitizada, publicada no Hub, que é público. Omite o detalhamento dos achados de segurança em aberto, os nomes dos secrets e as contas Google. A versão completa está na Central de Documentos do Grupo CSV (PDF) e no Panta v1 (pacote em Markdown).

Este pacote converte o Manual Técnico do MCP Extensio em formatos legíveis por máquina. O conteúdo é uma fotografia de 01/11/2026; números, versões e estados devem ser revalidados ao vivo antes de qualquer ação.

## Ordem de Leitura

1. `MANUAL.md`: leia primeiro a seção "Regras para agentes" e depois o capítulo pertinente à tarefa.
2. `catalogo-tools.json`: consulte para escolher uma tool; filtre por `dominio`, `modo` (L leitura, E escrita) e `estado_01_11_2026`.
3. `pendencias.json`: consulte antes de propor mudanças; a ordem P0, P1 e P2 é a prioridade acordada.
4. `arquitetura.mmd`: diagrama Mermaid das relações entre consumidores, Workers, bindings e APIs externas.
5. `manifest.json`: hashes SHA-256 para conferir a integridade dos arquivos.

## Arquivos

| Arquivo | Formato | Conteúdo |
|---|---|---|
| `README.md` | Markdown | Este guia de consumo |
| `MANUAL.md` | Markdown com frontmatter YAML | Texto integral do manual, 16 capítulos, tabelas em GFM |
| `catalogo-tools.json` | JSON | 88 tools com nome, domínio, modo, função e estado verificado |
| `pendencias.json` | JSON | 14 pendências com prioridade, ação e critério de conclusão |
| `arquitetura.mmd` | Mermaid | Diagrama de arquitetura em texto |
| `manifest.json` | JSON | Metadados da edição e SHA-256 de cada arquivo |

## Verificação ao Vivo Antes de Agir

| Pergunta | Fonte primária |
|---|---|
| Quantas tools e qual catálogo estão no ar? | `GET https://mcp-extensio.grupocsv.com/health`, campos `tools.count` e `tools.catalog_sha` (em 01/11: 88 e `415233a9f562`) |
| Qual versão está ativa? | API de deployments da Cloudflare para o Worker `extensio-mcp` (em 01/11: `c5c4afcc-d80c-436b-8a9a-c9b1690be22f`) |
| O ecossistema está saudável? | Tools `health_check` e `ecosystem_status` do próprio MCP |
| O briefing diário rodou? | Tool `pipeline_status` |

Se a fonte ao vivo divergir deste pacote, prevalece a fonte ao vivo. Registre a divergência no ACB.

## Onde Este Pacote Está Publicado

| Local | Variante | Endereço |
|---|---|---|
| Hub, seção `_infra` | Sanitizada | https://hub.grupocsv.com/_infra/manuais/mcp-extensio (arquivos em https://hub.grupocsv.com/manuais/mcp-extensio/) |
| Central de Documentos do Grupo CSV | PDF completo, acesso restrito | https://hub.grupocsv.com/documentos/?portal=grupo-csv, título "Manual Técnico do MCP Extensio (edição de 01/11/2026)" |
| Panta | Completa | Panta v1 (busca federada), arquivo pacote-agentes-mcp-extensio-2026-11-01-completo.md |
