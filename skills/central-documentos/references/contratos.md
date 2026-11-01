# Contratos e limites

Revalidar o schema MCP instalado e o OpenAPI publicado antes de usar opções recentes. O contrato da API pode ser mais amplo que o conector.

## Transporte

`documents_publish` recebe `tenant_id`, `document_id`, `file_name`, `content_type`, `content_base64` puro (sem `data:`), `idempotency_key` e `create_document`. Na criação, também exige título, classificação e política de indexação. O máximo do MCP é 8 MiB após decodificação; o formulário humano aceita 50 MiB. Para arquivo acima do transporte MCP, usar o fluxo HTTP autorizado, dentro dos limites atuais da API.

MIME suportado: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`, `text/plain`, `text/markdown`. XLSX e DOCX não são aceitos diretamente. Não renomear extensão nem declarar MIME falso. Conversão depende de intenção explícita, preserva o original e deve explicar perda de edição, fórmulas ou estrutura.

`documents_download` retorna até 8 MiB por chamada. Para arquivos maiores, seguir `Range` e recompor exatamente os bytes, conferindo extensão e hash quando pertinente.

## Disponibilização

Envio não é sinônimo de versão vigente. O fluxo MCP atual é `documents_publish` → `documents_status` → conferir versão → `documents_manage` com `action: "promote_version"`, quando elegível, necessário e autorizado. O schema de `documents_manage` não contém `idempotency_key`; use somente os campos que ele expõe e consulte o estado antes de repetir.

O contrato HTTP novo permite `POST /v1/upload-sessions/{id}/complete` com `{"auto_publish":true}`. Isso registra intenção durável para quem tem permissão de publicação; só conclui após segurança e revalidações. Não adicionar `auto_publish` ao MCP enquanto ele não expuser o campo. Confirmar implantação dessa extensão no OpenAPI antes de assumir sua disponibilidade.

## Tags

O contrato HTTP novo oferece `PUT /v1/documents/{id}/tags`, corpo `{"tags":["nome"]}`, `If-Match` e `Idempotency-Key`. Aceita até 20 nomes com até 120 caracteres cada. Define o conjunto completo do documento; para acrescentar, ler e preservar os demais vínculos. Lista vazia retira todos os vínculos. O conector atual não expõe essa ação em `documents_manage`; não inventar o campo ou tratar PATCH de metadados como equivalente.

## Escopos e identidade

Credencial HTTP de serviço deve ter tenants e escopos adequados: `documents:read`, `documents:write`, `documents:publish`, `documents:manage` e, para decidir exclusão lógica, `documents:admin`. A seleção por `X-Tenant-Id` não amplia os tenants concedidos. Observar os controles de ETag do endpoint.

## Busca e histórico

Panta v2 documental pesquisa a versão vigente autorizada. A versão histórica pode ser listada/aberta/baixada, mas não integra automaticamente a busca textual corrente. A política `metadata_only` não pesquisa o corpo; `full_text` depende de extração e sincronização; `disabled` deixa o documento fora do índice, não fora do catálogo autorizado.

A URL interna da Central exige acesso. A URL pública deve ser criada explicitamente pelo serviço e é vinculada a uma versão. Jamais montar URL de bucket R2 ou usar índice da VPS como atalho de autorização.
