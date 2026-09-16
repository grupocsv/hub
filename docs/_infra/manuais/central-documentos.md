---
title: Manual da Central de Documentos
description: Como consultar, enviar, versionar, compartilhar e administrar documentos nas Centrais do Grupo CSV e dos parceiros.
head:
  - - meta
    - name: robots
      content: noindex, nofollow
---

# Manual da Central de Documentos

A Central reúne os arquivos de uma organização, suas versões e as permissões de acesso. Você usa a mesma aplicação no Grupo CSV e nos parceiros, mas cada Central tem seu próprio acervo. Entrar em uma delas não dá acesso automático às outras.

Este manual acompanha a versão de 16/09/2026. Esta versão do Hub habilita a busca nas cinco Centrais após a validação produtiva pela API. As opções exibidas também dependem da sua permissão. Consulte o [manual do Panta v2](./panta-v2) para os detalhes da busca.

A demonstração com sessão humana ainda não foi realizada. As ilustrações deste guia são diagramas de funcionamento, não capturas da interface em produção.

## 1. Entrar na Central certa {#acesso}

No Hub, use o acesso corporativo para os arquivos do Grupo CSV. Para arquivos de um parceiro, use **Central de Documentos** no cabeçalho da instituição. Dentro do portal do parceiro, o acesso também é próprio da instituição.

| Acervo | Acesso direto |
|---|---|
| Grupo CSV | [Abrir Central corporativa](/documentos/?portal=grupo-csv) |
| Unimed Governador Valadares | [Abrir Central da Unimed](/documentos/?portal=unimed) |
| Unihealth — hospital gerido pelo ICDS | [Abrir Central da Unihealth](/documentos/?portal=unihealth) |
| ICDS | [Abrir Central do ICDS](/documentos/?portal=icds) |
| 2iM | [Abrir Central da 2iM](/documentos/?portal=2im) |

Faça o login do Hub quando solicitado. Antes de enviar ou compartilhar algo, confira a organização identificada na página. Um nome no endereço não substitui a autorização: o servidor confirma o acesso ao acervo.

## 2. Entender a tela {#interface}

| Controle | Para que serve |
|---|---|
| **Documentos** | Voltar ao catálogo de arquivos autorizados. |
| **Coleções** | Navegar pelos agrupamentos existentes; em uma coleção, clicar em **Ver Documentos**. |
| **Favoritos** | Rever os documentos que você marcou com **Favoritar**. |
| **Recentes** | Retomar documentos carregados nesta sessão, ordenados pela atualização do documento. Não é um histórico permanente nem a ordem exata dos seus cliques. |
| **Links Públicos** | Administrar os links compartilháveis da Central atual, quando seu perfil permite. |
| **Exclusões** | Consultar e decidir solicitações de exclusão, conforme sua permissão. |
| **Enviar Documento** | Cadastrar um documento novo e enviar seu arquivo. |

Para navegar pelo catálogo, combine **Coleção**, **Tag**, **Classificação** e **Estado**, depois clique em **Aplicar Filtros**. Use **Limpar** para remover os filtros e **Carregar Mais** quando houver outra página de resultados.

Um catálogo vazio pode significar que os filtros não encontraram documentos ou que você não tem acesso aos itens esperados. Não significa, por si só, que os arquivos foram apagados.

## 3. Consultar e baixar um documento {#visualizador}

1. No cartão do documento, clique em **Ver Detalhes**.
2. Confira título, descrição, classificação, estado, política de indexação e versões.
3. Clique em **Abrir Documento**, quando disponível.
4. No visualizador, use **Página Anterior** e **Próxima Página** para PDFs com mais de uma página.
5. Use **Baixar Arquivo** se essa ação estiver autorizada. Clique em **Fechar** para voltar.

PDFs, imagens e arquivos de texto têm apresentação própria no visualizador. A disponibilidade da visualização depende do formato, do processamento e da autorização. A ausência de uma prévia não autoriza contornar o controle de acesso.

**Favoritar** facilita o retorno ao documento; não cria cópia, não altera sua classificação e não o compartilha.

## 4. Enviar um documento novo {#envio}

![Fluxo de um documento: enviar arquivo, concluir a verificação, promover a versão e consultar ou compartilhar explicitamente.](/manuais/documentos/ciclo-documental.svg)

1. Confira se está na Central correta e clique em **Enviar Documento**.
2. Preencha **Título** e, se útil, **Descrição** e **Coleção**.
3. Escolha a **Classificação** apropriada: Público, Interno, Restrito ou Confidencial. Não escolha Público para tentar resolver uma falta de acesso.
4. Defina a **Política de Indexação** entre as opções disponíveis. O padrão **Somente Metadados** permite pesquisar informações como título e descrição. Com a busca habilitada, **Texto completo e metadados** permite incluir também o texto extraído do arquivo, por escolha explícita. **Desabilitada** retira o documento da busca do Panta; não remove o arquivo do catálogo autorizado.
5. Selecione o **Arquivo** e clique em **Enviar**.
6. Aguarde a conclusão do envio e do processamento. A mensagem **Documento processado com sucesso.** confirma o processamento, não a publicação como versão vigente.
7. Abra **Ver Detalhes** e, na seção **Versões**, use **Promover** na versão elegível, se seu perfil tiver permissão de publicação.

O formulário aceita PDF, PNG, JPG, JPEG, WEBP, TXT ou MD, com até 50 MiB por arquivo. DOCX e XLSX não são formatos aceitos nesse formulário.

O arquivo passa por verificação de segurança antes de ficar apto à publicação. Se aparecer rejeição de segurança, não tente tornar o arquivo público como alternativa. Se o acompanhamento demorar ou falhar, confira o estado do documento antes de repetir o envio; **Tentar Novamente** só aparece quando o fluxo permite essa retomada.

Escolher texto completo em um novo envio não altera a política dos documentos existentes. A opção só aparece quando a busca está habilitada; cada novo formulário começa novamente em **Somente Metadados**.

O processamento pode continuar no servidor depois que a tela deixa de acompanhá-lo. Fechar a janela não é uma confirmação de exclusão do arquivo já enviado.

## 5. Atualizar sem perder as versões anteriores {#versoes}

Para substituir o conteúdo de um documento existente, use **Ver Detalhes → Enviar Nova Versão**. Não crie outro documento apenas para atualizar o arquivo.

1. Envie o novo arquivo e acompanhe seu processamento.
2. Na seção **Versões**, identifique a versão recém-processada.
3. Clique em **Promover** quando a ação estiver disponível.
4. Confira se a versão passou a ser a vigente.

Alguns estados de versão aparecem com os identificadores técnicos: `eligible` significa apta à promoção, `current` significa vigente e `superseded` significa substituída por outra versão. O botão **Promover** só aparece para uma versão elegível e para quem pode publicá-la.

**Editar Metadados** permite alterar o título e a descrição na interface atual. Essa edição não substitui o arquivo. Mudanças de classificação, coleção, tags ou política de indexação podem exigir a integração administrativa; não estão todas nesse formulário.

Um link público já criado continua apontando para a versão que foi escolhida na criação. Promover outra versão não atualiza esse link automaticamente.

## 6. Criar e administrar um link público {#links-publicos}

Um link público permite que alguém abra a versão compartilhada sem entrar no Hub. Use-o somente para conteúdo que pode ser entregue a qualquer pessoa que receba o endereço.

**Marcar a classificação como Público não cria um link nem publica o arquivo automaticamente.** O compartilhamento é uma ação explícita e separada.

### Criar

1. Abra **Ver Detalhes** de um documento ativo, com versão vigente liberada pela verificação de segurança.
2. Na seção **Compartilhamento Externo → Links Públicos**, clique em **Criar Link**.
3. Preencha **Endereço Curto**, por exemplo `manual-institucional`. Use de 3 a 48 caracteres: letras minúsculas sem acentos, números e hífens simples entre palavras. O endereço precisa estar disponível; não é exclusivo apenas dentro da sua Central.
4. Se necessário, informe uma **Expiração Opcional**.
5. Marque **Forçar download ao abrir** se quiser que o navegador baixe o arquivo em vez de tentar exibi-lo.
6. Clique em **Criar Link Público** e use **Copiar URL** para compartilhar o endereço devolvido pela aplicação.

Documentos Restritos ou Confidenciais não são elegíveis para esse compartilhamento. Também não basta possuir o endereço de um documento arquivado, excluído ou com versão bloqueada: a entrega pública continua sujeita às verificações do servidor.

Desmarcar **Forçar download ao abrir** não impede que o destinatário salve uma cópia. Inativar um link interrompe novos acessos por ele, mas não apaga cópias já baixadas.

### Ver todos e interromper o acesso

Abra **Links Públicos** no menu da Central. O painel lista os links desse acervo e permite filtrar por **Estado**, **Slug** ou **ID do Documento**. Ele não mistura os links de todas as instituições.

Use **Inativar** para interromper o acesso pelo link e confirme a ação. Use **Ativar** para reabilitá-lo, desde que o documento, a versão e a expiração ainda permitam a entrega. **Ativo** não substitui a conferência da data de expiração.

Arquivar um documento ou solicitar sua exclusão inativa seus links públicos. Restaurar o documento, rejeitar a exclusão ou cancelar o pedido não reativa os links automaticamente. Revise-os antes de compartilhar novamente.

## 7. Arquivar ou excluir: são ações diferentes {#exclusoes}

| O que você quer fazer | Ação |
|---|---|
| Retirar um documento de uso, mantendo a possibilidade de retorno | **Arquivar**; depois, quando cabível, **Restaurar**. |
| Encaminhar a retirada definitiva do uso na Central | **Solicitar Exclusão** e aguardar a decisão administrativa. |
| Confirmar a exclusão de um pedido recebido | **Exclusões → Aprovar Exclusão Lógica**, se você for administrador autorizado. |

### Solicitar

Em **Ver Detalhes**, clique em **Solicitar Exclusão**, preencha **Motivo da Solicitação** e clique em **Confirmar Solicitação**. O documento passa a ter uma solicitação registrada. O rótulo **Exclusão Solicitada** não significa que a exclusão já foi aprovada.

### Aprovar, rejeitar ou cancelar

O local de confirmação é o menu **Exclusões** da própria Central. No painel **Solicitações de Exclusão**, confira o documento, o motivo e o solicitante.

- **Aprovar Exclusão Lógica**: confirme a mensagem. O documento fica indisponível no Hub e o pedido aparece como **Excluído Logicamente**.
- **Rejeitar**: recusa o pedido e devolve o documento ao estado anterior aplicável.
- **Cancelar Solicitação**: pode ser usado pelo solicitante original enquanto o pedido ainda admite cancelamento e sua permissão continua válida.

A aprovação cabe aos administradores documentais autorizados da Central; não depende de uma pessoa nominal específica. A ausência do botão pode refletir seu papel ou o estado do pedido.

**A exclusão disponível é lógica: os bytes físicos e as versões são preservados.** Este painel não executa destruição definitiva do armazenamento. Não conte com **Restaurar** para desfazer uma exclusão lógica já aprovada; essa ação de restauração é própria do arquivamento.

## 8. Uso por agentes e automações {#agentes}

As integrações usam a mesma Central e as mesmas regras de acesso. Elas não devem criar um acervo paralelo no Panta nem usar a sessão pessoal de alguém.

| Tarefa | Ferramenta no Extensio MCP |
|---|---|
| Listar e consultar documentos | `documents_list`, `documents_get` |
| Enviar documento ou nova versão e iniciar processamento | `documents_publish` |
| Acompanhar processamento | `documents_status` |
| Recuperar o arquivo autorizado | `documents_download` |
| Editar metadados, promover, arquivar, restaurar ou solicitar exclusão | `documents_manage` |
| Administrar links compartilháveis | `documents_public_links` |
| Listar e decidir pedidos de exclusão | `documents_deletion_requests` |
| Pesquisar com o Panta v2, quando habilitado | `documents_search` |

Informe o `tenant_id` correto em cada operação. O agente precisa de uma credencial de serviço com os escopos necessários; as operações administrativas não são liberadas por uma credencial somente de leitura. Em repetições de uma mesma mutação, mantenha a mesma chave de idempotência para não duplicá-la.

Não confunda o nome `documents_publish` com a conclusão do ciclo: após o envio, acompanhe o job e confira a versão; promova a versão elegível quando necessário. O envio pelo MCP aceita até 8 MiB por publicação. Para arquivos maiores, use a API documental; o formulário humano mantém o limite de 50 MiB.

Para implementar uma integração, consulte o [contrato OpenAPI](https://documentos-api.grupocsv.com/docs/openapi.json) e a [documentação técnica da Central](/_infra/central-documentos#api-openapi-e-mcp). Nunca coloque tokens em mensagens, links públicos, capturas de tela ou arquivos de exemplo.

## 9. Resolver dúvidas comuns

| Situação | O que conferir |
|---|---|
| Não vejo o botão de envio, de links ou de exclusões | Central selecionada, sessão e permissão documental. Ser usuário do Hub não equivale a ser administrador. |
| Enviei, mas o documento não aparece como ativo | Processamento e promoção da versão. No catálogo, confira também **Estado → Rascunho**. |
| Não encontro um arquivo | Central, filtros, permissões, estado e, se estiver usando busca, a política de indexação. |
| O link público parou de funcionar | Estado do link, expiração, arquivamento/exclusão e disponibilidade da versão vinculada. |
| O visualizador não abre | Estado de segurança, formato, processamento e permissão. Use download apenas se oferecido. |
| Uma ação informa que o documento mudou | Recarregue os detalhes e confira o estado atual antes de repetir. |

Para entender o que o Panta acrescenta sem substituir esta aplicação, siga para o [manual do Panta v2](./panta-v2).
