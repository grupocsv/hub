# Importar e versionar arquivos

## Inventário local

O script `../scripts/inventariar_pasta.py` lê arquivos em fluxo, calcula SHA-256 e grava JSON sem incluir o conteúdo. Ele não converte, envia, remove nem altera arquivos da origem. Nomes e caminhos ainda podem ser sensíveis: mantenha o manifesto privado, fora de Git e fora da pasta inventariada.

Exemplo em PowerShell, substituindo por caminhos reais autorizados:

```powershell
python "C:/Users/camar/.codex/skills/central-documentos/scripts/inventariar_pasta.py" --source "C:/Acervo/Unimed" --output "C:/InventariosPrivados/unimed-inventario.json"
```

A pasta do arquivo de saída deve existir. O script recusa saída existente, saída dentro da origem e saída sob repositório Git. Não segue links simbólicos, junctions ou outros pontos de reanálise; informa itens ignorados e falhas de leitura. Não é um snapshot transacional: alterações concorrentes devem ser interrompidas ou conferidas novamente.

Leia `issues` e `scope_complete` antes de afirmar cobertura. `scope_complete` só indica enumeração/leitura do escopo local elegível; não comprova leitura semântica, inventário de nuvem, equivalência com a Central ou conclusão de importação. O formato indicado pela extensão é uma pista; a API/processador validam MIME e bytes.

## Reconciliar antes do envio

1. Identifique a organização e preserve os originais. Pasta com organizações misturadas requer destino por documento.
2. Compare grupos SHA-256 para duplicatas exatas. `version_candidates` são apenas nomes normalizados com marcadores como `v2` ou `rev3`; confira conteúdo e contexto.
3. Percorra o catálogo e consulte versões dos documentos candidatos. Registre a correspondência real com `document_id`/`version_id`; não invente IDs existentes.
4. Proponha ação por item: ignorar duplicata, criar documento, adicionar versão ou revisar. Registre título, descrição, coleção, tags, classificação e política de indexação.
5. Aponte arquivos sem suporte, incompletos e conteúdo que demanda cuidado de sigilo. Não concluir que PDF convertido preserva a função de XLSX/DOCX.
6. Se o usuário pediu apenas análise, entregue a proposta e aguarde autorização do lote. Se já aprovou a lista e os destinos, execute sem pedir a mesma confirmação repetidamente.

## Executar lote aprovado

Persistir no manifesto privado a ação aprovada, a autorização de referência, os IDs conhecidos e a chave de idempotência de cada envio antes da primeira tentativa. Não colocar tokens nele.

- Novo documento: `documents_publish` com `create_document: true`, novo `document_id`, tenant e metadados obrigatórios.
- Nova versão: `create_document: false`, o `document_id` existente e os novos bytes. O cartão continua sendo o mesmo.
- Repetição: mesma `idempotency_key`, IDs e payload da operação. Payload alterado exige nova operação deliberada, não reaproveitamento da chave.
- Acompanhar `documents_status` e conferir a versão retornada. No MCP legado, concluir `documents_manage`/`promote_version` quando autorizado e ainda necessário.
- Conferir o registro e, proporcionalmente ao risco, os bytes baixados e o SHA-256. Para busca de conteúdo aprovada, verificar a sincronização; demora não autoriza duplicar o upload.

Limitar retries de falhas transitórias, com backoff. Não repetir indefinidamente `401`, `403`, conflito de ETag, divergência de payload idempotente ou rejeição de segurança. Em timeout ambíguo, consultar o estado/IDs conhecidos antes de tentar de novo.

O fechamento do lote distingue concluído, ignorado como duplicata, aguardando processamento/disponibilização e falha. Indicar o que foi verificado e o que permanece pendente.
