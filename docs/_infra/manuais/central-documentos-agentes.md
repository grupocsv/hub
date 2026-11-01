---
title: Central de Documentos - Guia para agentes
description: Contratos e procedimentos para consultar, importar e versionar documentos nas Centrais, sem duplicar acervo nem contornar permissões.
head:
  - - meta
    - name: robots
      content: noindex, nofollow
---

# Central de Documentos: guia para agentes

Revisão de 1º de novembro de 2026. Para explicações de uso sem detalhes de integração, consulte o [manual humano](./central-documentos). Para o contrato HTTP completo, use o [OpenAPI publicado](https://documentos-api.grupocsv.com/docs/openapi.json).

## 1. Qual sistema usar

Use as ferramentas **`documents_*` do Extensio MCP** para operar a Central. O nome exibido pelo cliente pode receber um prefixo do conector. Confirme o schema da ferramenta instalada antes de chamá-la.

Não use `panta_index_document` ou outro comando da busca federada para cadastrar um documento na Central. O Panta v2 documental é um índice derivado; quem guarda os originais, aplica permissões e controla versões é a Central.

| Organização | `tenant_id` |
|---|---|
| Grupo CSV | `grupo-csv` |
| Unimed Governador Valadares | `unimed` |
| Unihealth, hospital gerido pelo ICDS | `unihealth` |
| ICDS | `icds` |
| 2iM | `2im` |

O tenant deve constar de cada operação. Um caminho local ou um nome de arquivo não substitui a definição do destino. Não tratar Unimed Governador Valadares, Unihealth e ICDS como o mesmo acervo.

## 2. Ferramentas disponíveis

| Operação | Ferramenta | Observação |
|---|---|---|
| Listar catálogo | `documents_list` | Percorrer os cursores; uma página não representa o acervo completo. |
| Consultar registro | `documents_get` | Usar o identificador do documento retornado pela Central. |
| Enviar documento ou versão | `documents_publish` | Envia bytes e inicia processamento; não presumir versão vigente. |
| Consultar processamento | `documents_status` | Usa `job_id` e `tenant_id`. |
| Listar versões | `documents_manage` com `action: "list_versions"` | Mantém o mesmo `document_id`. |
| Atualizar metadados | `documents_manage` com `action: "update"` | Preservar campos não solicitados e observar o ETag. |
| Disponibilizar versão | `documents_manage` com `action: "promote_version"` | Exige permissão de publicação e versão elegível. |
| Baixar uma versão | `documents_download` | Informar `version_id` para fixar a versão histórica. |
| Pesquisar conteúdo | `documents_search` | Pesquisa autorizada da versão vigente, conforme política. |
| Arquivar, restaurar ou pedir exclusão | `documents_manage` | São ações diferentes; confirmar a ação e o alvo. |
| Administrar compartilhamento público | `documents_public_links` | Exige decisão explícita de compartilhamento. |
| Decidir exclusão lógica | `documents_deletion_requests` | Depende de autorização administrativa. |

As ferramentas MCP atuais não cobrem toda rota nova da API. Em particular, não invente `auto_publish` ou `tags` em uma ferramenta cujo schema não exponha esses campos. Para recursos ainda não expostos pelo conector, use o contrato HTTP autorizado ou informe a limitação.

## 3. Autenticação e autorização

As ferramentas do Extensio utilizam credencial documental de serviço e validam o tenant. Na API direta, use uma credencial exclusiva, obtida pelo procedimento institucional de credenciais; nunca copie cookies de navegador ou reutilize uma sessão humana.

| Escopo | Uso |
|---|---|
| `documents:read` | Catálogo, consulta, versões, download e busca autorizados. |
| `documents:write` | Criação, nova versão e edição permitida de metadados. |
| `documents:publish` | Disponibilização de versão elegível. |
| `documents:manage` | Gestão autorizada, incluindo links públicos e solicitação de exclusão. |
| `documents:admin` | Decisão administrativa de exclusão lógica. |

O token não deve constar de prompts, arquivos de exemplo, capturas, logs ou URLs. Para credencial multi-tenant, `X-Tenant-Id` seleciona um tenant já concedido; não amplia seu alcance. Uma resposta de negação não autoriza procurar outro caminho para obter os mesmos bytes.

## 4. Consultar e pesquisar

Exemplo de argumentos de `documents_search`:

```json
{
  "tenant_id": "unimed",
  "query": "protocolo atendimento",
  "limit": 20
}
```

Confirme o documento de origem depois da busca. A relevância ordena resultados; não comprova a correção factual do trecho. Não apresente resultado vazio como prova de ausência de documento: políticas de indexação, permissões e sincronização também influenciam a busca.

O Panta pesquisa a versão vigente. Para uma revisão histórica, liste as versões e baixe a versão escolhida. Informe qual versão fundamentou a resposta.

## 5. Importar uma pasta sem criar duplicatas {#importacao}

### Preparar o lote

1. Receber caminho absoluto da pasta, escopo de subpastas e Central de destino. Se o destino já estiver inequívoco, não perguntar novamente.
2. Enumerar os arquivos preservando os originais. Arquivos de atalho, indisponíveis ou ilegíveis devem ser relatados, não contados como lidos.
3. Calcular SHA-256 dos bytes para detectar duplicatas exatas. Comparar também identidade e conteúdo para levantar versões prováveis; não usar só nome ou data.
4. Percorrer o catálogo autorizado e consultar versões dos candidatos correspondentes. Busca textual sozinha não é um censo do acervo.
5. Montar um manifesto local com arquivo, hash, formato real, tenant, ação proposta e identificadores conhecidos.
6. Distinguir `ignorar duplicata`, `criar documento`, `adicionar versão`, `revisar correspondência` e `formato não suportado`.
7. Propor título, descrição, coleção, tags, classificação e indexação. Não escolher acesso público ou texto completo indiscriminadamente.
8. Obter aprovação do lote quando o pedido ainda for apenas de análise. Uma aprovação de lote bem definido pode ser executada sem pedir confirmação arquivo a arquivo.

O manifesto pode conter nomes e contexto privados. Ele fica fora de repositório público e não deve incluir credenciais.

### Executar o lote aprovado

- Gere uma identidade de operação estável para cada ação; persista-a antes da primeira tentativa.
- Na criação, use `documents_publish` com `create_document: true`, `document_id` único do novo registro, tenant, título, classificação, indexação, nome, MIME e bytes.
- Em atualização, use `create_document: false` e o **`document_id` existente**. Não gere um documento novo para cada revisão.
- Reutilize a mesma `idempotency_key` e os mesmos bytes em uma repetição de `documents_publish`. Não recomece com outra chave apenas por timeout.
- Registre os IDs retornados e consulte `documents_status`.
- Confirme segurança, processamento e versão vigente. No MCP atual, promova a versão elegível com `documents_manage` quando a publicação fizer parte da autorização e o escopo permitir.
- Confira título, versão e, quando necessário, hash dos bytes baixados. Se indexação foi solicitada, verifique a busca após a sincronização, sem tratar demora como motivo para criar outra cópia.
- Entregue relatório por arquivo: concluído, duplicata ignorada, pendente ou falha, com razão objetiva e referência do documento.

Em erro transitório, faça novas tentativas limitadas com intervalo crescente. Em conflito de ETag, recarregue antes de decidir; em negação de acesso ou rejeição de segurança, pare aquela operação. Não marque como concluído um upload cujo processamento ou disponibilização ainda não foi confirmado.

### Limites dos arquivos

O MCP aceita até **8 MiB após decodificar o Base64**, sem prefixo `data:`. Os MIME aceitos são `application/pdf`, `image/png`, `image/jpeg`, `image/webp`, `text/plain` e `text/markdown`. O formulário humano aceita até **50 MiB**. O fluxo HTTP atende arquivos maiores que o transporte MCP dentro dos limites da API.

XLSX e DOCX não são formatos de upload suportados atualmente. Uma conversão autorizada deve preservar o original e identificar o derivado como tal. Não declarar um PDF convertido como se o XLSX original estivesse armazenado na Central.

## 6. Disponibilização automática pela API

A conclusão do upload pode registrar a intenção explícita:

```http
POST /v1/upload-sessions/{uploadSessionId}/complete
Content-Type: application/json

{"auto_publish": true}
```

A requisição continua autenticada e segue o contrato de idempotência. A API exige autorização de publicação ao registrar a intenção e volta a conferir as condições antes de disponibilizar a versão. O processamento deve terminar com arquivo seguro; uma versão anterior não pode substituir uma posterior por atraso do callback. Documento arquivado ou em exclusão não é reativado por esse fluxo.

A intenção é persistida no servidor, não depende de manter o navegador aberto. Sem a opção, o fluxo anterior permanece compatível. O `documents_publish` do MCP instalado nesta revisão não expõe essa opção; o agente deve concluir a publicação pelo caminho autorizado do conector, sem enviar parâmetros desconhecidos.

**Disponibilizar na Central não é criar um link público.** Nenhuma dessas operações concede acesso anônimo.

## 7. Tags e metadados

Título, descrição, classificação, coleção e política de indexação usam o contrato de edição do documento, observando ETag para não sobrescrever uma edição concorrente.

A edição do conjunto de tags usa:

```http
PUT /v1/documents/{documentId}/tags
Content-Type: application/json
If-Match: {etag-atual}
Idempotency-Key: {chave-estavel-da-operacao}

{"tags": ["atendimento", "revisao-anual"]}
```

Esse corpo define o conjunto de tags do documento; não é uma adição cega. Leia as tags atuais se a intenção for acrescentar sem remover. São aceitas até 20 tags, com até 120 caracteres por nome. Nomes são normalizados no tenant. A lista vazia retira os vínculos do documento e só deve ser enviada quando essa for a intenção.

Não inserir campos de tags em `documents_manage` se a versão instalada do conector não os declarar. O endpoint HTTP é a referência para essa operação.

## 8. Links e exclusões são decisões separadas

Para compartilhar internamente, use a URL da Central com o tenant e o documento/versão. O destinatário precisa de acesso. Para acesso sem login, obtenha autorização explícita do conteúdo, da versão e do endereço público; use `documents_public_links` e confira a URL retornada.

Classificação `public` não cria um link anônimo. Um link público é vinculado à versão escolhida; novas versões não mudam seu conteúdo automaticamente. Arquivamento, pedido de exclusão e desativação do link interrompem sua entrega conforme as regras da Central.

Excluir logicamente não significa apagar fisicamente os arquivos. Não prometa destruição dos bytes nem execute exclusão de um acervo para “limpar duplicatas” sem autorização específica.

## 9. Quando sugerir a inclusão na Central

Ao produzir ou revisar um documento destinado a uma organização já identificada, verifique se a inclusão na Central faz parte do pedido. Se não fizer e for útil, pergunte de forma curta:

> Você quer que esta versão seja incorporada à Central da Unimed Governador Valadares, no documento existente, mantendo o histórico?

Adapte a organização e diga se é criação ou nova versão. Não repetir a pergunta se a mesma ação já estiver aprovada. Não sugerir upload indiscriminado de arquivo temporário, credencial ou conteúdo fora do escopo.

## Referências

- [Manual humano](./central-documentos)
- [Manual da busca Panta v2](./panta-v2)
- [Arquitetura e operação da Central](/_infra/central-documentos)
- [Contrato OpenAPI publicado](https://documentos-api.grupocsv.com/docs/openapi.json)

Fontes de implementação: `grupocsv/hub` para interface e registro de tenants; `grupocsv/backend/workers/csv-documents` para domínio e API; `grupocsv/extensio` para os schemas efetivamente expostos pelo conector. Revalide o contrato instalado antes de automatizar uma nova operação.
