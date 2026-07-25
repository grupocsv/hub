# Themis™ — Gestão Médico-Jurídica Baseada em Evidências

## Visão Geral

Themis™ é a ferramenta interna do Grupo CSV para estruturar casos médico-jurídicos e produzir análises técnicas, relatórios e quesitos de defesa rastreáveis às evidências documentais. A implantação inicial é uma ferramenta interna dedicada à Unimed Governador Valadares.

| Campo | Valor |
|---|---|
| Nome | Themis™ |
| Categoria | WebApp interno |
| Portfólio | Ferramenta reutilizável do Grupo CSV |
| Cliente inicial | Unimed Governador Valadares |
| URL canônica | [themis.grupocsv.com](https://themis.grupocsv.com) |
| Proprietário | Grupo CSV — Cuidados em Saúde com Valor |
| Repositório | `axiacare/themis` |
| Papéis | Admin, que também é o curador, e Usuário |

## Escopo Operacional

- criação e atribuição de casos;
- upload privado de documentos;
- estruturação de evidências documentais;
- snapshots imutáveis usados em cada geração;
- elaboração de relatório técnico ou de exatamente 15 quesitos;
- revisão humana e curadoria do corpus;
- separação entre entregável externo e anexo interno de rastreabilidade.

Casos similares e exemplos do corpus nunca substituem a evidência do caso em análise. Nenhuma afirmação material deve integrar uma versão validada sem referência documental.

## Arquitetura

| Camada | Responsabilidade |
|---|---|
| Cloudflare Worker `themis` | Frontend, API autenticada, autorização e downloads controlados |
| Workflow `themis-processing` | Processamento durável, estados, retomada e repetição controlada |
| R2 privado `themis-private` | Originais, intermediários e exportações, sem acesso público |
| Supabase `hstoxemjhpdltzwrmbkf` | Autenticação, perfis, papéis, RLS, casos, evidências e auditoria |
| GenerationGateway | Contrato interno de geração independente de fornecedor |

O frontend e a API operam no mesmo domínio. O navegador não recebe credenciais de serviço nem chama provedores de processamento ou geração diretamente.

## Acesso e Segurança

O acesso previsto utiliza Google Workspace por meio do Supabase Auth, com autorização prévia e perfil ativo. Os domínios admitidos são `unimedgv.com.br`, `unimedgv.coop.br` e `grupocsv.com`; pertencer a um desses domínios não concede acesso automaticamente.

- Admin visualiza todos os casos e atua como curador.
- Usuário visualiza somente os casos atribuídos.
- RLS protege o acesso direto aos dados estruturados.
- Arquivos permanecem em bucket privado.
- Todas as rotas aplicam `noindex`, `nofollow` e `noarchive`.
- Logs operacionais não devem armazenar conteúdo médico-jurídico.

## Processamento e Geração

O contrato GenerationGateway permite trocar provedores sem alterar as regras de casos, evidências, curadoria e exportação. A geração externa permanece desabilitada em produção até a aprovação dos gates contratuais, de privacidade, retenção e benchmark do modelo.

Quando promovida, a integração deverá operar por Cloudflare AI Gateway com BYOK, sem cache de resposta e sem logging de payload. Mudança de provedor exige nova execução registrada e não pode ocorrer por fallback silencioso.

## Infraestrutura e Operação

| Componente | Identificador |
|---|---|
| Worker | `themis` |
| Workflow | `themis-processing` |
| R2 | `themis-private` |
| Supabase | `hstoxemjhpdltzwrmbkf` |
| Domínio | `themis.grupocsv.com` |
| Health check | [themis.grupocsv.com/api/health](https://themis.grupocsv.com/api/health) |
| Deploy | GitHub Actions + Wrangler |

O health check público retorna somente o estado mínimo da aplicação. Não expõe dependências, versões, detalhes de erro ou dados de caso.

## Estado da Implantação

Em 25 de julho de 2026, o frontend, a API, o Worker, o Workflow, o R2 privado, o schema Supabase, o domínio e o health check estavam implantados. A geração com provedores externos permanece desabilitada por política. O início do piloto depende da configuração dedicada do provedor Google Workspace e dos demais gates de produção registrados no PRD da Themis™.
