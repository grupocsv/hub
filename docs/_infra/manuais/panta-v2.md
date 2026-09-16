---
title: Manual do Panta v2 nas Centrais
description: Entenda a relação entre Panta, VPS e Central de Documentos e como usar a busca documental autorizada.
head:
  - - meta
    - name: robots
      content: noindex, nofollow
---

# Manual do Panta v2 nas Centrais

**A Central organiza e administra os arquivos. O Panta v2 ajuda a encontrá-los.** Não é necessário criar uma segunda cópia no Panta para usar os documentos da Central.

Este manual acompanha a versão de 16/09/2026. A integração foi validada pela API em produção: busca no conteúdo nas cinco Centrais, isolamento entre organizações, políticas somente metadados e desabilitada, substituição da versão antiga por uma nova e reconstrução do índice de um documento de teste.

Esta versão do Hub habilita a busca nas cinco Centrais após a validação produtiva pela API. A demonstração com sessão humana ainda não foi realizada. O estado operacional está na [página técnica do Panta v2](/_infra/ferramentas/panta-v2). As ilustrações abaixo são diagramas de funcionamento, não capturas da interface em produção.

## 1. Panta v1, Panta v2 e Central: quem faz o quê?

| Componente | Explicação simples | O que não é |
|---|---|---|
| **Central de Documentos** | Lugar para enviar arquivos, consultar versões, controlar acesso, compartilhar por link e administrar exclusões. | Não é apenas um índice de busca. É a aplicação responsável pelo ciclo documental. |
| **Panta v2 documental** | Motor de pesquisa dos documentos autorizados da Central selecionada. Mantém um índice derivado das informações que a Central permite pesquisar. | Não é outra Central, outro armazenamento de originais nem um painel separado para gerir permissões. |
| **Panta v1 federado** | Serviço anterior para pesquisa em fontes do ecossistema e relações entre pessoas, empresas e projetos. | Não é a autoridade sobre os documentos das Centrais e não foi convertido automaticamente para a v2. |

Nesta entrega, “v2” identifica a nova busca documental integrada. Não significa que todos os recursos da v1 foram migrados, substituídos ou auditados novamente. O grafo e as fontes federadas da v1 continuam sendo um escopo distinto.

![A Central mantém arquivos e permissões; o Panta v2 na VPS recebe um índice derivado. A Central autoriza a busca e confere os resultados antes de entregá-los. O Panta v1 permanece separado.](/manuais/documentos/panta-central-vps.svg)

Não há um novo login ou painel próprio de usuário da v2. A entrada é a mesma [Central de Documentos](./central-documentos#acesso), pelo campo **Buscar Documentos**.

## 2. Qual é a dependência da VPS?

A VPS é o computador servidor onde os serviços Panta executam. A v1 e a v2 ficam separadas nesse servidor. O acesso externo chega a elas por um túnel protegido; uma falha nesse caminho pode tornar o serviço inacessível mesmo que o processo interno ainda esteja ligado.

O índice da v2 é uma cópia derivada para pesquisa. Os arquivos originais continuam no armazenamento privado da Central, e as permissões e a versão vigente continuam sob controle dela.

Foi validada a reconstrução da entrada de um documento de teste. Isso não equivale a testar a recuperação integral do volume de armazenamento depois de uma perda: esse cenário de restauração completa não foi validado nesta rodada.

Se a v2 ficar indisponível, a pesquisa textual pode falhar ou atrasar. Isso não apaga documentos nem muda quem pode abri-los. Catálogo, filtros e operações documentais não passam pelo motor de busca. A Central também tem um processador próprio de arquivos; problemas nesse processador devem ser investigados separadamente, não atribuídos automaticamente ao Panta.

## 3. Fazer uma busca {#buscar}

Quando **Buscar Documentos** estiver disponível na Central:

1. Confira a organização identificada na página.
2. Digite palavras do título ou do conteúdo no campo **Buscar Documentos**.
3. Clique em **Buscar**.
4. Leia o título e o trecho de cada resultado. A **Referência do resultado** identifica o documento e a versão retornados.
5. Use **Ver Detalhes** e **Abrir Documento** para conferir o arquivo de origem. Um trecho de pesquisa não substitui a leitura do documento.
6. Clique em **Voltar ao Catálogo** para retomar a navegação comum.

Use palavras específicas, como `protocolo atendimento`, em vez de esperar uma resposta redigida para uma pergunta longa. A implementação atual faz pesquisa textual; não é um chat, não produz respostas narrativas e não promete equivalência por significado ou sinônimos.

Os filtros de **Coleção**, **Tag**, **Classificação** e **Estado** pertencem ao catálogo. Eles não são combinados com essa pesquisa textual. A consulta continua restrita à Central atual e às permissões do usuário.

A tela solicita até 20 trechos por busca; um documento pode gerar mais de um resultado. Isso não representa necessariamente 20 documentos diferentes nem todo o acervo que menciona o assunto.

## 4. O que pode aparecer nos resultados? {#politicas}

Um documento precisa estar ativo, ter versão vigente segura, permitir indexação e estar sincronizado. Além disso, você precisa ter autorização para consultá-lo.

| Política de indexação | O que a busca utiliza | Exemplo |
|---|---|---|
| **Somente Metadados** (`metadata_only`) | Título, descrição e nomes de coleção e tags disponíveis. Não utiliza o corpo do arquivo. | Encontrar um manual pelo título, sem pesquisar seus parágrafos. |
| **Texto completo e metadados** (`full_text`) | Metadados e texto extraído autorizado da versão vigente. | Encontrar um termo que aparece no corpo de um PDF com texto extraível. |
| **Desabilitada** (`disabled`) | O documento não participa da pesquisa do Panta. | Manter o arquivo no catálogo autorizado, sem indexá-lo para busca. |

No envio de um documento novo, a opção **Texto completo e metadados** aparece quando a busca está habilitada. É uma escolha explícita: o padrão permanece **Somente Metadados**, inclusive ao abrir o próximo formulário de envio. Habilitar a busca ou escolher texto completo para um novo documento não converte automaticamente o acervo existente.

Para mudar a política de documentos já cadastrados, use uma integração autorizada. O formulário **Editar Metadados** da tela altera título e descrição, não essa política.

Texto completo depende de uma extração válida. A presença de um PDF ou de uma imagem não garante que todo seu conteúdo visual seja pesquisável. Não conte com OCR automático universal ou com leitura de elementos que o processamento não extraiu.

**Indexar não é publicar.** Um documento pesquisável pode continuar privado. A entrega a alguém sem login só ocorre mediante um [link público criado explicitamente](./central-documentos#links-publicos) e permitido pelas regras documentais.

## 5. Atualizações, versões e retirada da busca

O fluxo é assíncrono: salvar uma alteração e aparecer na busca não são o mesmo instante. A sincronização usa o estado atual da Central, não uma cópia antiga enviada por um agente.

![Alterar, promover, arquivar ou excluir modifica o estado na Central; a sincronização atualiza ou retira a entrada do Panta. Uma revisão antiga não restaura o texto anterior.](/manuais/documentos/sincronizacao-busca.svg)

- Alterar título ou descrição exige atualizar o índice, mesmo sem trocar a versão do arquivo.
- Promover uma nova versão faz a pesquisa acompanhar a versão vigente, após sincronização.
- Arquivar, solicitar exclusão, concluir exclusão lógica ou desabilitar a indexação torna o documento inelegível para a busca.
- Reduzir a política de texto completo para somente metadados retira o corpo do arquivo do índice, mantendo somente as informações permitidas.
- Um evento antigo ou repetido não deve recolocar texto de uma revisão já substituída ou removida.

Durante uma atualização, a busca pode omitir temporariamente o documento até confirmar a sincronização. A Central revalida os resultados antes de entregá-los. Isso evita mostrar uma versão antiga apenas porque ainda havia uma entrada no índice.

Não há promessa de atualização instantânea. Se o item demorar, confira primeiro seu estado, sua versão vigente e a política de indexação. Não reenviar o mesmo arquivo como outro documento evita duplicidades desnecessárias.

## 6. Limites e situações comuns

| Situação | Como interpretar e agir |
|---|---|
| O campo de busca não aparece | O recurso pode ainda não estar liberado no runtime dessa implantação. Use o catálogo e consulte o estado operacional. |
| Nenhum resultado | Confira Central, palavras, permissão, política, versão vigente e sincronização. Ausência de resultado não prova ausência do documento. |
| O documento está no catálogo, mas uma palavra do corpo não aparece | A política pode ser somente metadados; a extração ou a sincronização também pode não estar pronta. |
| Serviço indisponível | Volte ao catálogo. A indisponibilidade da busca não equivale a perda dos arquivos. |
| Acervo excede o limite da busca | A implementação atual recusa consultas cujo escopo pesquisável autorizado exceda 500 documentos. Use catálogo e filtros; eles não reduzem o escopo da pesquisa textual. |
| Resultado deixou de abrir | O acesso, estado ou versão pode ter mudado. Recarregue e respeite a nova autorização. |

O limite de 500 se refere ao conjunto de documentos elegíveis e autorizados para aquela consulta, não ao número de arquivos que podem ser guardados na Central. A API retorna um erro explícito em vez de pesquisar silenciosamente só uma parte desse conjunto.

## 7. Integração com agentes

Para pesquisar documentos das Centrais, use **`documents_search` no Extensio MCP**, informando `tenant_id`, `query` e, quando necessário, `limit`. Os comandos de busca federada `panta_*` da v1 não substituem esse caminho autorizado.

Exemplo de argumentos, sem credenciais:

```json
{
  "tenant_id": "grupo-csv",
  "query": "protocolo de atendimento",
  "limit": 20
}
```

Uma integração HTTP equivalente usa `POST /v1/search` na API documental, com credencial de serviço e tenant autorizado. O corpo é:

```json
{
  "query": "protocolo de atendimento",
  "limit": 20
}
```

O escopo necessário à pesquisa é `documents:read`. Quando a credencial atende mais de um tenant, o cabeçalho `X-Tenant-Id` seleciona um deles; ele nunca amplia a lista de tenants concedida à credencial. Não use cookies pessoais nem o segredo interno que liga o Worker ao serviço Panta.

A resposta identifica a consulta e devolve resultados com documento, versão, trecho e relevância. `score` mede ordenação de busca, não certeza factual. Depois de localizar o item, use `documents_get` e, se precisar dos bytes, `documents_download`; o acesso será verificado novamente.

### Operar o ciclo completo

A busca não envia, promove, compartilha ou exclui arquivos. Para essas ações, use as [ferramentas documentais correspondentes](./central-documentos#agentes). O fluxo de uma integração é:

1. Selecionar explicitamente a Central e usar uma credencial com os escopos necessários.
2. Enviar o documento ou a nova versão por `documents_publish` e acompanhar `documents_status`.
3. Promover a versão elegível por `documents_manage`, quando necessário e autorizado.
4. Aguardar sincronização e pesquisar por `documents_search`.
5. Conferir o documento de origem antes de citar ou reutilizar seu conteúdo.

Integrações não devem escrever diretamente no índice da VPS para contornar a Central. Também não devem tratar um trecho antigo guardado em cache como autorização permanente.

O [OpenAPI publicado](https://documentos-api.grupocsv.com/docs/openapi.json) é a referência HTTP. A [documentação técnica do Panta v2](/_infra/ferramentas/panta-v2) detalha arquitetura, operação e limites; o [manual da Central](./central-documentos) cobre as ações de usuário.
