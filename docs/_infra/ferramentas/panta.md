# Panta™ — Omnisearch Federado

## Visão Geral

O Panta™ (do grego Πάντα, "tudo") é o motor de busca federada do ecossistema Grupo CSV. Não é um banco de dados nem um CRM. É um serviço de infraestrutura que consulta múltiplas fontes em uma única requisição, retornando resultados ranqueados por relevância. Funciona como a camada de busca que conecta documentos, pessoas, memórias, assets e conhecimento acumulado.

::: warning Relação com a Central de Documentos
Esta página descreve o Panta v1 federado. Ele é independente da Central de Documentos e não pode autorizar acesso, decidir lifecycle nem expor bytes documentais. O Panta v2 tenant-aware existe no código do backend, mas não foi promovido. O frontend da Central permanece com busca desabilitada. Consulte [Central de Documentos — Relação com o Panta](/_infra/central-documentos#relação-com-o-panta).
:::

| Campo | Valor |
|---|---|
| Marca | Panta™ |
| URL pública | [panta.grupocsv.com](https://panta.grupocsv.com) |
| Hospedagem | VPS-CSV (GCP, systemd) |
| Exposição | Cloudflare Tunnel (fd7d2a33) |
| Stack | Python 3.12, FastAPI, SQLite FTS5, Supabase pgvector |
| Autenticação | Header X-Panta-Token |
| Porta local | 8090 |
| Proprietário | Grupo CSV |

## Fontes de Busca Federada

O Panta consulta 6 fontes simultaneamente e retorna resultados unificados com score de relevância:

| Fonte | Tipo | Descrição |
|---|---|---|
| panta_graph | Grafo de pessoas | Entidades (pessoas, empresas, projetos) e relações tipadas |
| hindsight | Memória longo prazo | Recall via MCP HTTP (Vectorize.io) |
| csvbrain | Fatos + sessões | Busca híbrida FTS + pgvector (71k+ fatos) |
| csv_assets | Assets visuais | Logos, criativos, wallpapers (247 assets, 15 marcas) |
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

O acesso requer o header `X-Panta-Token` em todas as requisições (exceto /health). O token é armazenado no config.json da VPS-CSV. O serviço não é exposto diretamente — passa pelo Cloudflare Tunnel com proteção DDoS e rate limiting.

## Manutenção

| Ação | Comando |
|---|---|
| Reiniciar | `sudo systemctl restart panta` |
| Logs | `sudo journalctl -u panta -f` |
| Status | `curl panta.grupocsv.com/health` |
| Ingestão batch | `python scripts/batch_ingest.py --dir /path/to/docs` |
| Popular grafo | `python scripts/populate_graph.py --cooperados --dicionario` |
