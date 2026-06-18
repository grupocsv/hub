# Discovery™ — Diagnóstico Estratégico para OPSS

## Visão Geral

O Discovery™ é o instrumento de diagnóstico estratégico da AxiaCare para Organizações Prestadoras de Serviços de Saúde (OPSS). Padroniza a fase inicial de qualquer engajamento com uma OPSS por meio de um roteiro estruturado em 5 dimensões, garantindo que nenhuma dimensão crítica seja negligenciada e que o diagnóstico resultante seja comparável, auditável e orientado a dados.

| Campo | Valor |
|---|---|
| Marca | Discovery™ |
| URL pública | [discovery.axcare.app](https://discovery.axcare.app) |
| Hospedagem | Manus (React + TS + Tailwind) |
| Stack | Vite + React 19 + TypeScript + TailwindCSS + Drizzle + MySQL/TiDB + tRPC |
| Autenticação | PIN (padrão RTAV) + fallback Manus OAuth |
| Repositório | [grupocsv/discovery](https://github.com/grupocsv/discovery) |
| Proprietário | AxiaCare (Grupo CSV) |

## Dimensões de Análise

O instrumento coleta informações em 5 seções estruturadas:

| Seção | Dimensão | Escopo |
|---|---|---|
| 1 | Contexto da Organização | Natureza, estágio, motivação estratégica, definição de sucesso, prazo |
| 2 | Eficiência Operacional | Gargalos, KPIs, capacidade, fluxo do paciente, equipe, governança |
| 3 | Ciclo da Receita e Sustentabilidade | Modelo de receita, faturamento, glosas, ticket médio |
| 4 | Qualidade, Segurança e Tecnologia | Regulatório, sistemas, maturidade tecnológica, governança clínica |
| 5 | Visão de Futuro e Documentação | Restrições, espaço aberto, checklist de documentos |

## Entregáveis

| Entregável | Formato | Descrição |
|---|---|---|
| Relatório de diagnóstico | PDF (gerado client-side via jsPDF) | Capa timbrada AxiaCare, seções estruturadas, nota metodológica |
| Versão impressa | Formulário físico | Para entrega presencial ao cliente |
| Histórico | Painel admin | Diagnósticos salvos e consultáveis |

## Arquitetura

| Componente | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + TailwindCSS + Vite |
| Backend | tRPC (routers: reports CRUD, admin) |
| Banco de dados | MySQL/TiDB (Drizzle ORM) — tabelas: discovery_reports, report_documents |
| Autenticação | PIN (G6889) + Manus OAuth |
| PDF | jsPDF (geração client-side, capa econômica para impressão) |
| Deploy | Manus (auto-deploy via push) |
| DNS | CNAME discovery.axcare.app → cname.manus.space (Cloudflare) |

## Integração com o Ecossistema

| Ponto de integração | Descrição |
|---|---|
| Hub CSV | Card no portal AxiaCare (hub.grupocsv.com/axia) |
| csv-mail | Notificações por e-mail (preparado, não ativado) |
| Padrão visual | Header RTAV (logo AxiaCare + separador + Discovery™), footer padrão AxiaCare |
| Favicon | Hub Grupo CSV (assets/favicon) |

## Acesso

| Tipo | Detalhe |
|---|---|
| Landing page | discovery.axcare.app (pública) |
| Formulário | /novo (protegido por PIN/OAuth) |
| Histórico | /historico (protegido, admin only) |
| Login | /login (PIN ou OAuth) |
