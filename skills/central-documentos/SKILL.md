---
name: central-documentos
description: "Opera as Centrais de Documentos do Grupo CSV e parceiros: consulta, envio autorizado, versões, tags, links e análise de pastas para importação. Usar quando o pedido envolver o acervo documental ou a incorporação de um arquivo à Central; não confundir com a busca federada Panta v1."
---

# Centrais de Documentos

Use as ferramentas `documents_*` do Extensio MCP. A Central guarda os originais privados, as versões e as permissões; o Panta v2 é seu índice de busca. **Não usar `panta_index_document` para cadastrar documentos na Central.** Não criar um acervo paralelo na VPS.

## Escolher o acervo

| Organização | `tenant_id` |
|---|---|
| Grupo CSV, corporativo | `grupo-csv` |
| Unimed Governador Valadares, operadora e EVS | `unimed` |
| Unihealth, hospital gerido pelo ICDS | `unihealth` |
| ICDS, institucional | `icds` |
| 2iM | `2im` |

O tenant acompanha cada operação e deve ser coerente com a autorização. Não tratar Unimed, Unihealth e ICDS como o mesmo destino. Pergunte apenas se o contexto não resolver a organização ou a ação pretendida.

## Consultar e operar

Descubra o schema efetivamente instalado antes de chamar a ferramenta; o prefixo do conector pode variar.

- Catálogo: `documents_list`, percorrendo cursores. Uma página ou busca vazia não prova ausência no acervo.
- Registro: `documents_get`, com `document_id` da Central.
- Pesquisa da versão vigente: `documents_search`. Consulte o documento original antes de citar; score não é certeza factual.
- Histórico: `documents_manage`, `action: "list_versions"`; bytes da versão escolhida: `documents_download`, com `version_id`.
- Envio: `documents_publish`; acompanhamento: `documents_status`.
- Edição, disponibilização, arquivamento e solicitação de exclusão: `documents_manage`.
- Compartilhamento público: `documents_public_links`. Decisão de exclusão lógica: `documents_deletion_requests`.

Para importar ou atualizar arquivos, leia [references/importacao.md](references/importacao.md). Para fluxos HTTP, tags e limites dos conectores, leia [references/contratos.md](references/contratos.md).

## Autorização e integridade

Consultar/analisar não autoriza enviar, substituir versões, alterar classificação, publicar link ou excluir. Execute o lote explicitamente aprovado dentro do escopo descrito, sem repetir a mesma pergunta para cada item. Preserve os arquivos locais. Não mude senhas nem permissões para contornar uma negação.

Um documento atualizado deve manter seu `document_id` e receber uma nova versão. Não criar outro cartão só porque mudou o arquivo. Não fundir documentos distintos por título parecido. Duplicata exata de uma versão já registrada deve ser identificada antes de qualquer novo envio.

Não confunda envio concluído, verificação concluída, versão disponibilizada e busca sincronizada. Relate somente a etapa confirmada. Use a mesma chave e o mesmo conteúdo ao repetir uma operação idempotente; consulte o resultado após timeout antes de criar uma nova tentativa lógica.

Links internos exigem login e autorização. Classificação `public` não cria acesso anônimo. Criar link público exige intenção explícita e fixa uma versão; novas versões não alteram automaticamente esse link. Exclusão disponível é lógica, não destruição dos bytes.

O conector utiliza credencial de serviço. Para HTTP direto, use o procedimento `api-key-manager` quando disponível; nunca peça senha no chat ou reutilize cookie humano. Tokens não entram em manifesto, código, captura ou relatório.

## Oferecer inclusão quando pertinente

Quando estiver trabalhando em um documento destinado a uma das organizações e a inclusão na Central não tiver sido decidida, ofereça de forma contextual: “Quer incorporar esta versão à Central da Unimed Governador Valadares, mantendo o histórico do documento existente?”.

Não aplicar essa pergunta a toda interação nem a arquivos temporários. Não perguntar de novo se a ação já estiver aprovada. Se a correspondência com o documento existente for incerta, apresente-a como proposta antes de enviar.

## Referências operacionais

- Manual humano: https://hub.grupocsv.com/_infra/manuais/central-documentos
- Guia de agentes: https://hub.grupocsv.com/_infra/manuais/central-documentos-agentes
- Contrato HTTP: https://documentos-api.grupocsv.com/docs/openapi.json

Esta skill não atesta disponibilidade da produção. Verifique a resposta atual do conector e a publicação dos contratos novos antes de utilizá-los.
