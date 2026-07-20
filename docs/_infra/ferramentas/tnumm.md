# TNUMM — Catálogo de Materiais e Medicamentos

## Visão Geral

A TNUMM é a plataforma autônoma do Grupo CSV para consulta, histórico e atualização governada da Tabela Nacional Unimed de Materiais e Medicamentos. O produto mantém seu catálogo independente de operadoras e aplicações consumidoras, permitindo que diferentes soluções do ecossistema utilizem a mesma fonte por meio de uma API versionada.

| Campo | Valor |
|---|---|
| Produto | TNUMM |
| Categoria | WebApp e API |
| URL | [tnumm.grupocsv.com](https://tnumm.grupocsv.com) |
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
| Interface web | Autenticação, busca, publicações e atualização |
| API versionada | Autorização e integração estável com aplicações consumidoras |
| Catálogo canônico | Itens, histórico, vigências e projeção de busca |
| Governança operacional | Identidade, sessões, operações e auditoria da aplicação |
| Arquivos de origem | Publicações oficiais, manifestos e evidências de processamento |

O Hub CSV funciona somente como ponto de entrada. A sessão, as permissões e os dados da TNUMM permanecem sob responsabilidade da própria aplicação. Os consumidores utilizam a API versionada e não acessam diretamente a estrutura interna do catálogo.

## Atualização do Catálogo

Cada nova publicação oficial entra como uma versão separada. O fluxo preserva os arquivos de origem, valida a carga sem substituir o catálogo ativo e exige ativação controlada. Esse desenho mantém a rastreabilidade entre o resultado consultado, a publicação vigente e a evidência recebida.

## Integração

A fronteira de integração é a API versionada da TNUMM. Aplicações futuras poderão consultar códigos individualmente ou em lote sem incorporar uma cópia própria do catálogo e sem acoplamento ao Hub CSV.

Integrações específicas com produtos ou clientes não fazem parte do escopo atual.
