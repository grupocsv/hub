# CMM — Catálogo de Materiais e Medicamentos

## Visão Geral

O CMM é a plataforma autônoma do Grupo CSV para consulta temporal, histórico, procedência e atualização governada de materiais e medicamentos. As publicações da Tabela Nacional Unimed de Materiais e Medicamentos (TNUMM) são a fonte canônica atual, mas não constituem a identidade do produto. O catálogo permanece independente de operadoras e aplicações consumidoras e disponibiliza uma API versionada para diferentes soluções do ecossistema.

| Campo | Valor |
|---|---|
| Nome Autoral | CMM — Catálogo de Materiais e Medicamentos |
| Categoria | WebApp e API |
| Fonte Canônica Atual | Publicações oficiais TNUMM |
| URL Canônica | [cmm.grupocsv.com](https://cmm.grupocsv.com) |
| Compatibilidade Técnica | `tnumm.grupocsv.com` — não divulgar como identidade do produto |
| Proprietário | Grupo CSV — Cuidados em Saúde com Valor |
| Acesso | Interno e autenticado |

## Capacidades

- busca por código ou texto em materiais e medicamentos;
- consulta do item com identificação da publicação e da vigência utilizadas;
- histórico de publicações e alterações;
- atualização governada a partir dos arquivos oficiais;
- validação, aprovação, ativação e reversão controlada de catálogos;
- API versionada como fronteira estável para integrações futuras.

## Arquitetura

| Camada | Responsabilidade |
|---|---|
| Interface Web | Autenticação, busca, publicações e atualização |
| API Versionada | Autorização e integração estável com aplicações consumidoras |
| Catálogo Canônico | Itens, histórico, vigências e projeção de busca |
| Governança Operacional | Identidade, sessões, operações e auditoria da aplicação |
| Arquivos de Origem | Publicações oficiais, manifestos e evidências de processamento |

O Hub CSV funciona somente como ponto de entrada. A sessão, as permissões e os dados do CMM permanecem sob responsabilidade da própria aplicação. Os consumidores utilizam a API versionada e não acessam diretamente a estrutura interna do catálogo.

## Infraestrutura

| Componente | Identificador |
|---|---|
| Worker | `tnumm` |
| Banco de Controle | D1 `tnumm-control` |
| Evidências | R2 privado `tnumm-evidence` |
| Repositório | `grupocsv/tnumm` |
| Health Check | [cmm.grupocsv.com/api/health](https://cmm.grupocsv.com/api/health) |

Os identificadores técnicos `tnumm_*` são preservados por compatibilidade operacional. Não alteram a identidade pública do CMM.

## Atualização do Catálogo

Cada nova publicação oficial entra como uma versão separada. O fluxo preserva os arquivos de origem, valida a carga sem substituir o catálogo ativo e exige ativação controlada. Esse desenho mantém a rastreabilidade entre o resultado consultado, a publicação vigente e a evidência recebida.

## Integração

A fronteira de integração é a API versionada do CMM. Aplicações futuras poderão consultar códigos individualmente ou em lote sem incorporar uma cópia própria do catálogo e sem acoplamento ao Hub CSV.

Integrações específicas com produtos ou clientes não fazem parte do escopo atual.
