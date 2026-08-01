# Themis™ — Suporte técnico médico jurídico.

## Visão Geral

Themis™ organiza evidências documentais e apoia a elaboração de análises técnicas, relatórios e quesitos com rastreabilidade interna. A implantação inicial é uma ferramenta interna dedicada à Unimed Governador Valadares.

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

O acesso utiliza convite individual, e-mail, senha e TOTP por meio do Supabase Auth, com autorização prévia e perfil ativo. Os domínios admitidos são `unimedgv.com.br`, `unimedgv.coop.br` e `grupocsv.com`; pertencer a um desses domínios não concede acesso automaticamente.

- Admin visualiza todos os casos e atua como curador.
- Usuário visualiza somente os casos atribuídos.
- RLS protege o acesso direto aos dados estruturados.
- Arquivos permanecem em bucket privado.
- Todas as rotas aplicam `noindex`, `nofollow` e `noarchive`.
- Logs operacionais não devem armazenar conteúdo sensível dos casos.

## Processamento e Geração

O contrato GenerationGateway permite trocar provedores sem alterar as regras de casos, evidências, curadoria e exportação. No piloto sintético, a Themis™ usa o adaptador `workers-ai-responses`, o modelo `@cf/openai/gpt-oss-120b` e o binding Workers AI do próprio Worker, com passagem pelo AI Gateway dedicado `themis-generation`.

Esse piloto aceita exclusivamente casos classificados como `synthetic`. Casos `restricted` permanecem bloqueados por escopo antes do despacho e passam por nova verificação no Workflow; portanto, o piloto não autoriza o processamento de documentos reais, identificáveis ou pseudonimizados pelo Workers AI.

As chamadas do piloto desabilitam cache de resposta e coleta de payload no gateway. Provedores externos permanecem inativos até a aprovação dos gates contratuais, de privacidade, retenção e avaliação do modelo. Mudança de provedor exige nova execução registrada e não pode ocorrer por fallback silencioso.

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

Em 1º de agosto de 2026, o frontend, a API, o Worker, o Workflow, o R2 privado, o schema Supabase, o domínio e o health check integravam a publicação controlada do MVP. O acesso ocorre por convite individual, e-mail, senha e TOTP. O escopo de geração e extração assistida do piloto é exclusivamente sintético, pelo Workers AI; casos `restricted` continuam bloqueados e dependem dos gates institucionais registrados no PRD da Themis™.
