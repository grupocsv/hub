# Panta™ — Omnisearch Federado

## Visão Geral

O Panta™ (do grego Πάντα, "tudo") é o motor de busca federada do ecossistema Grupo CSV. Não é um banco de dados nem um CRM. É um serviço de infraestrutura que consulta múltiplas fontes em uma única requisição, retornando resultados ranqueados por relevância. Funciona como a camada de busca que conecta documentos, pessoas, memórias, assets e conhecimento acumulado.

::: warning Relação com a Central de Documentos
Esta página descreve o Panta v1 federado. Ele é independente da Central de Documentos e não pode autorizar acesso, decidir o ciclo documental nem expor arquivos da Central. Em 16/09/2026, a pesquisa da v2 documental foi validada em produção pela Central/Extensio nos cinco tenants. Esta versão do Hub habilita o campo de busca após essa validação; a sessão humana no navegador permanece não aferida. A v1 continua saudável e preservada, sem migração automática de suas fontes ou grafo. Consulte [Central de Documentos — Relação com o Panta](/_infra/central-documentos#relação-com-o-panta).
:::

Para pesquisa dos documentos das Centrais corporativa e dos parceiros, consulte o [guia do Panta v2 documental](/_infra/ferramentas/panta-v2). As fontes, o grafo e os comandos desta página pertencem à v1; não são a API de gestão ou busca autorizada da Central.

Os [manuais da Central](/_infra/manuais/central-documentos) e [do Panta v2](/_infra/manuais/panta-v2) explicam essa diferença e o uso cotidiano. A demonstração prática a Guilherme permanece pendente; documentação publicada não substitui a apresentação.

| Campo | Valor |
|---|---|
| Marca | Panta™ |
| URL pública | [panta.grupocsv.com](https://panta.grupocsv.com) |
| Hospedagem | VPS-CSV (GCP, systemd) |
| Exposição | Cloudflare Tunnel (fd7d2a33) |
| Stack | Python 3.12, FastAPI, SQLite FTS5, Supabase pgvector |
| Autenticação | Header X-Panta-Token |
| Porta local | 8090 |
| Porta MCP preservada | 8091 |
| Proprietário | Grupo CSV |

A verificação de 16/09/2026 confirmou saúde e preservação da v1, não uma nova auditoria de todas as suas fontes. Os detalhes de stack, ingestão e ferramentas abaixo são o cadastro legado da v1; não devem ser usados como contrato de acesso aos documentos da Central.

## Fontes de Busca Federada

O cadastro da v1 descreve as fontes abaixo. Disponibilidade e tamanho atuais de cada fonte não foram revalidados na ativação documental da v2:

| Fonte | Tipo | Descrição |
|---|---|---|
| panta_graph | Grafo de pessoas | Entidades (pessoas, empresas, projetos) e relações tipadas |
| hindsight | Memória longo prazo | Recall via MCP HTTP (Vectorize.io) |
| csvbrain | Fatos + sessões | Busca híbrida FTS + pgvector |
| csv_assets | Assets visuais | Logos, criativos e wallpapers |
| local_docs | Documentos pessoais | PDF, DOCX, imagens ingeridos com OCR (SQLite FTS5) |
| semantic | Busca vetorial | Embeddings 768d via Gemini (panta_embeddings no Supabase) |

## Endpoints

| Método | Path | Descrição |
|---|---|---|
| GET | /health | Health check (status, versão, uptime) |
| GET | /search?q={termo} | Busca federada em todas as fontes |
| POST | /graph/entity | Criar entidade (pessoa, empresa, projeto, contexto) |
| POST | /graph/relation | Criar relação entre entidades |
| GET | /graph/company/{name}/people | Listar pessoas vinculadas a uma empresa |
| POST | /graph/context | Busca contextual no grafo |
| POST | /ingest/document | Ingerir arquivo via upload |
| POST | /ingest/path | Ingerir arquivo por path local na VPS |

## Grafo de Pessoas

O grafo armazena entidades com tipo, metadados e contexto, conectadas por relações tipadas. Permite buscas como "quem trabalha na Unimed GV?" ou "qual a função do Dr. Fulano?".

| Tipo de entidade | Exemplos |
|---|---|
| person | Guilherme Thomé, cooperados, diretores |
| company | Grupo CSV, Unimed GV, Unihealth, ICDS |
| project | Panta, Extensio, Crialê, Navia |
| context | Reunião Direx, ENTEC 2026, Provimento |

Relações são tipadas: `fundador_de`, `cooperado_de`, `superintendente_medico_de`, `trabalha_em`, `participa_de`.

## Ingestão de Documentos

O Panta extrai texto de documentos multi-formato e indexa para busca:

| Formato | Motor | Limite |
|---|---|---|
| PDF (até 5 MB) | Docling (IBM, OCR embutido) | ~90s por arquivo |
| PDF (acima 5 MB) | pdftotext (fallback rápido) | ~5s por arquivo |
| DOCX | python-docx | Instantâneo |
| Markdown | Leitura direta | Instantâneo |
| Imagens | Docling (OCR) | ~60s por arquivo |

Arquivos originais ficam intactos em `~/workspace/vault/documents/`. O Panta apenas indexa o texto extraído.

## Integração com Agentes

O Panta é acessível por todos os agentes do ecossistema:

| Agente | Método de acesso |
|---|---|
| Manus | MCP Server (panta-mcp) ou HTTP direto |
| OpenClaw | HTTP via panta.grupocsv.com |
| Claude Code | MCP Server (stdio) ou HTTP |
| Telegram Bot | Via Manus (busca delegada) |
| Hermes | HTTP direto |

## MCP Server

O Panta expõe um servidor MCP (Model Context Protocol) com as seguintes tools:

| Tool | Descrição |
|---|---|
| panta_search | Busca federada em todas as fontes |
| panta_add_entity | Adicionar pessoa/empresa/projeto ao grafo |
| panta_add_relation | Criar relação entre entidades |
| panta_find_people | Buscar pessoas por empresa ou contexto |
| panta_ingest | Ingerir documento por path |

## Tabelas Supabase

| Tabela | Função |
|---|---|
| panta_entities | Entidades do grafo (name, type, metadata, context) |
| panta_relations | Relações tipadas (from_id, to_id, relation_type) |
| panta_embeddings | Vetores 768d para busca semântica |

## Segurança

O contrato legado da v1 utiliza `X-Panta-Token` nas requisições protegidas; `/health` é público. A credencial fica na configuração protegida do serviço e não deve ser copiada para documentação, prompts ou logs. O local exato do armazenamento deve ser conferido no runtime vigente, não presumido a partir de um antigo `config.json`. A credencial exclusiva da v2 é separada e não substitui a da v1. A exposição HTTP passa pelo Cloudflare Tunnel.

## Manutenção

| Ação | Comando |
|---|---|
| Reiniciar | `sudo systemctl restart panta` |
| Logs | `sudo journalctl -u panta -f` |
| Status | `curl panta.grupocsv.com/health` |
| Ingestão batch | `python scripts/batch_ingest.py --dir /path/to/docs` |
| Popular grafo | `python scripts/populate_graph.py --cooperados --dicionario` |
