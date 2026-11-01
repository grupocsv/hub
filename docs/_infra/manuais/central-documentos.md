---
title: Manual das Centrais de Documentos
description: Guia humano das Centrais do Grupo CSV, Unimed Governador Valadares, Unihealth, ICDS e 2iM, com versões, acesso, compartilhamento e uso por agentes.
head:
  - - meta
    - name: robots
      content: noindex, nofollow
---

# Manual das Centrais de Documentos

Guia de uso do Grupo CSV - Cuidados em Saúde com Valor. Revisão de 1º de novembro de 2026.

[Baixar este manual em PDF](/manuais/documentos/manual-centrais-documentos.pdf) · [Guia técnico para agentes](./central-documentos-agentes) · [Entender o Panta](./panta-v2)

## 1. Entender em um minuto {#entender}

A Central é o lugar para **guardar, organizar, consultar e compartilhar documentos**, mantendo o histórico das versões. Há uma Central do Grupo CSV e Centrais próprias dos parceiros. Todas usam a mesma aplicação; os acervos não são misturados.

**Tenant** é o nome técnico dessa separação por organização. Na prática, significa escolher a Central certa antes de enviar, procurar ou compartilhar um arquivo.

| Conceito | Em palavras simples |
|---|---|
| Central | A aplicação em que você trabalha com os documentos. |
| Tenant | O acervo e as permissões de uma organização. |
| Documento | O registro que aparece em um único cartão, com título, descrição e histórico. |
| Versão | Um arquivo enviado para esse mesmo documento, sem apagar o anterior. |
| Coleção | Um agrupamento para organizar documentos de um assunto ou projeto. |
| Tag | Uma palavra-chave que ajuda a classificar e filtrar documentos. |
| Panta v2 | O motor que pesquisa o conteúdo autorizado da Central. Não é outro lugar para enviar cópias. |

![Uma aplicação compartilhada, com acervos separados para Grupo CSV, Unimed Governador Valadares, Unihealth, ICDS e 2iM.](/manuais/documentos/centrais-tenants.svg)

As ilustrações deste manual são diagramas explicativos. Não apresentam documentos reais nem representam uma comprovação de acesso a acervos de terceiros.

## 2. Entrar na Central certa {#acesso}

No início do Hub, o acesso corporativo leva à Central do Grupo CSV. Na seção de instituições parceiras e dentro do portal de cada parceiro, use o botão **Central de Documentos** da própria instituição.

Faça login quando solicitado. Confira a logomarca e o nome da organização antes de continuar. O endereço seleciona o acervo; o servidor ainda verifica se você pode acessá-lo.

### 2.1. Grupo CSV: o acervo corporativo {#grupo-csv}

[Abrir a Central do Grupo CSV](/documentos/?portal=grupo-csv)

É o espaço dos documentos corporativos do Grupo CSV. Exemplos de organização, não um inventário do que já foi enviado: manuais internos, referências institucionais e documentos comuns à operação do grupo.

Um arquivo da Unimed Governador Valadares não deve ir para este acervo apenas porque foi produzido por uma pessoa do Grupo CSV. A organização responsável pelo documento e o público autorizado orientam o destino.

Identificador para agentes: `grupo-csv`.

### 2.2. Unimed Governador Valadares: a operadora {#unimed}

[Abrir a Central da Unimed Governador Valadares](/documentos/?portal=unimed)

É o acervo da Unimed Governador Valadares. O EVS - Escritório de Valor em Saúde - vinculado à operadora está nesse contexto institucional. Exemplos possíveis: documentos de gestão, protocolos e entregáveis autorizados da operadora.

Este acervo **não é** o acervo do hospital Unihealth. Um título parecido ou a participação das mesmas pessoas não torna os dois destinos intercambiáveis.

Identificador para agentes: `unimed`.

### 2.3. Unihealth: o hospital {#unihealth}

[Abrir a Central da Unihealth](/documentos/?portal=unihealth)

A Unihealth é o hospital gerido pelo ICDS. Sua Central separa os documentos do contexto hospitalar dos documentos da operadora e dos documentos institucionais próprios do ICDS.

Exemplos possíveis: documentos operacionais do hospital e entregáveis hospitalares cujo acesso tenha sido autorizado. Dados pessoais ou clínicos exigem a classificação e as permissões adequadas; este manual não autoriza sua inclusão.

Identificador para agentes: `unihealth`.

### 2.4. ICDS: o acervo institucional {#icds}

[Abrir a Central do ICDS](/documentos/?portal=icds)

O ICDS - Instituto de Cooperação para o Desenvolvimento da Saúde - tem um acervo próprio. Ele não é uma pasta que abre automaticamente todos os documentos do hospital Unihealth.

Um documento institucional do ICDS e um documento operacional do hospital podem ter destinos diferentes. Se houver dúvida, confirme o responsável e o público antes de enviar; não publique cópias nos dois acervos como solução automática.

Identificador para agentes: `icds`.

### 2.5. 2iM: o acervo da parceria {#2im}

[Abrir a Central da 2iM](/documentos/?portal=2im)

É o espaço separado dos documentos autorizados da relação com a 2iM. Exemplos possíveis: entregáveis, referências e documentos de projeto. O acesso continua vinculado à organização, ao usuário e às permissões do documento.

Identificador para agentes: `2im`. Na interface, a grafia da marca é **2iM**.

### As Centrais são iguais? {#equivalencia}

**Sim quanto à aplicação e ao conjunto compartilhado de funcionalidades. Não quanto aos arquivos ou às permissões de cada pessoa.** A configuração desta revisão habilita os mesmos recursos nas cinco Centrais.

| Recurso compartilhado | Grupo CSV | Unimed GV | Unihealth | ICDS | 2iM |
|---|---|---|---|---|---|
| Catálogo, coleções e tags | Mesmo módulo | Mesmo módulo | Mesmo módulo | Mesmo módulo | Mesmo módulo |
| Envio e histórico de versões | Mesmo módulo | Mesmo módulo | Mesmo módulo | Mesmo módulo | Mesmo módulo |
| Visualização e download | Mesmo módulo | Mesmo módulo | Mesmo módulo | Mesmo módulo | Mesmo módulo |
| Estrela de favorito | Mesmo módulo | Mesmo módulo | Mesmo módulo | Mesmo módulo | Mesmo módulo |
| Busca documental do Panta v2 | Habilitada | Habilitada | Habilitada | Habilitada | Habilitada |
| Links públicos e exclusões | Conforme permissão | Conforme permissão | Conforme permissão | Conforme permissão | Conforme permissão |

Um botão ausente pode refletir o papel do usuário, uma restrição no documento ou uma operação ainda em processamento. Esta equivalência de implementação não significa que todo usuário seja administrador, nem que todos os arquivos tenham sido testados individualmente.

## 3. Conhecer a tela {#interface}

| Controle | Uso |
|---|---|
| **Documentos** | Voltar ao catálogo do acervo selecionado. |
| **Coleções** | Navegar pelos agrupamentos existentes e abrir seus documentos. |
| **Favoritos** | Rever os documentos que você marcou com a estrela. |
| **Recentes** | Retomar documentos carregados nesta sessão, ordenados pela atualização do documento. Não é um histórico permanente dos seus cliques. |
| **Links Públicos** | Administrar os endereços compartilháveis deste acervo, se autorizado. |
| **Exclusões** | Acompanhar e decidir solicitações de exclusão, conforme o papel. |
| **Enviar Documento** | Criar um documento novo. Para atualizar um existente, entre primeiro em seus detalhes. |

O cartão identifica o documento e o formato de seu arquivo, quando essa informação está disponível. **PDF**, **MD**, **TXT** ou uma extensão de imagem descrevem o arquivo; não são uma classificação de sigilo. O formato vem dos metadados do arquivo, não de palavras incluídas no título.

A estrela vazia permite adicionar aos favoritos; a estrela preenchida permite remover. O nome acessível do botão informa a ação para leitores de tela. Favoritar não cria cópia, não compartilha o documento e não altera permissões.

Combine **Coleção**, **Tag**, **Classificação** e **Disponibilidade** e clique em **Aplicar Filtros**. O filtro de disponibilidade permite consultar documentos arquivados ou em exclusão sem expor a antiga escolha entre rascunho e ativo. Use **Limpar** para recomeçar e **Carregar Mais** quando houver outra página de resultados. Um catálogo vazio pode significar que os filtros não encontraram documentos ou que você não tem acesso aos itens esperados.

### Procurar pelo conteúdo

No campo **Buscar Documentos**, digite termos específicos e clique em **Buscar**. Para sair dos resultados, use **Voltar ao Catálogo**. A busca é textual e autorizada; não é uma conversa que produz uma resposta resumida.

Os filtros de navegação do catálogo não se combinam automaticamente com a busca textual. A pesquisa usa o conteúdo da versão vigente e a política de indexação de cada documento. Veja [o que o Panta pesquisa](./panta-v2#politicas).

## 4. Consultar, abrir e baixar {#visualizador}

1. No cartão, clique em **Ver Detalhes**.
2. Confira título, descrição, classificação e versão do documento.
3. Use **Abrir Documento** para consultar a versão vigente.
4. No visualizador de PDF, avance e volte pelas páginas. O layout se adapta à tela disponível.
5. Use **Baixar Arquivo**, se autorizado, para salvar uma cópia. Clique em **Fechar** para retornar.

Uma versão antiga deve ser aberta a partir do **Histórico de Versões**, não confundida com a versão vigente. A disponibilidade da prévia depende do formato e do processamento. Ausência de prévia não autoriza contornar o controle de acesso; use o download somente quando a aplicação o oferecer.

## 5. Enviar um documento novo {#envio}

Antes de enviar, procure o documento. Se ele já existe e você tem uma atualização, siga [o procedimento de nova versão](#versoes).

1. Confira a Central e clique em **Enviar Documento**.
2. Preencha **Título**, uma **Descrição** útil e, quando aplicável, a **Coleção**.
3. Escolha a **Classificação** adequada: Público, Interno, Restrito ou Confidencial.
4. Defina a **Política de Indexação**. O padrão é **Somente Metadados**; **Texto completo e metadados** inclui o texto extraído autorizado. **Desabilitada** mantém o arquivo fora da busca do Panta.
5. Selecione o arquivo e envie. Acompanhe a verificação e o resultado.
6. Confira o documento e a versão disponibilizada. Depois, inclua ou ajuste as tags nos detalhes.

![Envio de arquivo, verificação de segurança, disponibilização autorizada e consulta. O compartilhamento público é uma ação opcional separada.](/manuais/documentos/ciclo-documental.svg)

No envio pela interface, quem tem permissão de disponibilizar versões aciona essa etapa automaticamente após a verificação. O servidor mantém a intenção registrada mesmo que a aba seja fechada e confirma novamente as condições de acesso antes de concluir. Para quem só pode enviar, a disponibilização depende de uma pessoa autorizada. **Simplificar a interface não concede uma permissão que o usuário não possui.**

Os termos técnicos `draft` e `active` ainda podem aparecer em integrações antigas. Eles não são duas pastas que você precise administrar. O que importa no uso é saber se o arquivo está sendo verificado, se está disponível, se houve uma falha ou se foi retirado de uso.

### Formatos e limites {#formatos}

| Formato enviado | Como usar |
|---|---|
| PDF | Consulta em páginas e download autorizado. |
| PNG, JPG/JPEG, WEBP | Consulta de imagem e download autorizado. |
| TXT e MD | Consulta de texto com renderização segura. |
| XLSX, DOCX e outros não listados | Não são aceitos diretamente por este fluxo. Não basta trocar a extensão. |

O formulário humano aceita até **50 MiB por arquivo**. O envio por MCP aceita até **8 MiB de conteúdo decodificado** por operação. Arquivos maiores que o limite MCP exigem o fluxo da API documental, dentro dos limites da Central.

Uma planilha convertida em PDF passa a ser um PDF: não preserva as fórmulas e a edição do XLSX. Preserve o original fora da conversão. Decida explicitamente se quer guardar uma representação de leitura enquanto o formato original não é suportado.

Se houver falha, consulte o resultado antes de reenviar. O mesmo arquivo não deve virar outro documento apenas porque o primeiro processamento demorou. Um arquivo reprovado na verificação não fica disponível ao público.

## 6. Atualizar no mesmo cartão {#versoes}

**Um documento, um cartão, várias versões.** Para substituir o conteúdo sem perder o histórico, use **Ver Detalhes → Enviar Nova Versão**.

![Um cartão reúne a versão vigente e versões anteriores. Enviar uma atualização no documento existente mantém o mesmo identificador.](/manuais/documentos/documento-versoes.svg)

1. Abra o documento que será atualizado e confira sua identidade.
2. Envie a nova versão dentro dele.
3. Aguarde a verificação e a disponibilização autorizada.
4. Confira no **Histórico de Versões** qual versão está vigente e quais são anteriores. Use **Localizar versão** para filtrar por número, nome ou data.
5. Use **Abrir esta versão** na versão desejada; o download fica no visualizador, quando permitido.

O arquivo anterior não é sobrescrito. A nova versão mantém o documento e seu cartão, mas recebe um identificador de versão próprio.

Um documento sem versão atual pode aparecer como **Aguardando disponibilização**. Para um envio antigo já verificado que ainda dependa dessa etapa, o histórico pode oferecer **Usar como versão atual** a quem tem permissão. Isso não autoriza abrir um arquivo reprovado nem elimina versões anteriores.

**Arquivos iguais não são necessariamente documentos diferentes.** Na importação de uma pasta, compare os bytes e a identidade documental. Cópia idêntica deve ser identificada como duplicata; atualização real do mesmo documento deve virar nova versão. Nome parecido, sozinho, não prova que dois arquivos sejam versões do mesmo documento.

### Histórico não é a mesma coisa que busca no conteúdo antigo

O histórico permite localizar, abrir e baixar versões anteriores. A pesquisa textual do Panta v2 trabalha com a **versão vigente**. Ela não pesquisa simultaneamente o conteúdo de todas as versões antigas. Para consultar o corpo de uma versão anterior, abra o arquivo correspondente no histórico.

Um link público já criado fica associado à versão escolhida na criação. Enviar ou disponibilizar outra versão **não atualiza esse link automaticamente**.

## 7. Organizar com coleções e tags {#tags}

Coleção e tag cumprem papéis diferentes. Uma coleção agrupa documentos de um projeto ou assunto; uma tag acrescenta uma palavra-chave que pode atravessar vários agrupamentos.

Exemplo de organização, não uma classificação já aplicada: coleção `Manuais de operação`, com tags `atendimento` e `revisao-anual`.

Para ajustar as tags de um documento:

1. Abra **Ver Detalhes** e localize a seção **Tags**.
2. Se seu perfil permitir edição, informe os nomes separados por vírgula: até 20 tags, com até 120 caracteres por nome.
3. Use palavras-chave curtas, evitando nomes de pessoas ou dados sensíveis desnecessários.
4. Clique em **Salvar Tags** e confira o resultado. A lista informada substitui o conjunto de tags do documento.
5. Volte ao catálogo e use o filtro **Tag** para localizar os documentos associados.

As tags são próprias de cada Central. Usar a mesma palavra em duas organizações não conecta seus acervos nem concede acesso cruzado. O filtro mostra tags existentes; filtrar não é o mesmo que cadastrar uma tag.

## 8. Link interno ou link público? {#links}

![O link interno leva à Central e exige acesso. O link público permite abrir uma versão sem login, até expirar ou ser inativado.](/manuais/documentos/links-internos-publicos.svg)

| | Link interno | Link público |
|---|---|---|
| Destino | Documento ou visualizador dentro da Central. | Uma versão compartilhada pelo endereço curto. |
| Login | Exigido, com permissão no acervo e no documento. | Não é exigido do destinatário. |
| Como obter | Abrir o visualizador na Central e copiar o endereço da barra do navegador. | Criar explicitamente em **Links Públicos**. |
| Quem pode abrir | Usuário autorizado. Ter a URL não concede acesso. | Qualquer pessoa que tenha o link, enquanto válido. |
| Troca de versão | Confira se o endereço aponta para uma versão específica. | O link permanece fixo na versão escolhida. |
| Interromper acesso | Revogar o acesso ao documento ou retirá-lo de uso, conforme permissão. | Inativar o link, deixar expirar ou retirar o documento de uso. |

Copiar a URL interna **não publica** o documento. Abra o visualizador antes de copiar, para que o endereço identifique o documento e, quando aplicável, a versão. Se você quer que um destinatário externo sem conta o abra, precisa criar um link público autorizado.

### Criar um link público {#links-publicos}

1. Abra **Ver Detalhes** de um documento disponível, com versão segura.
2. Em **Compartilhamento Externo → Links Públicos**, clique em **Criar Link**.
3. Defina o **Endereço Curto**, por exemplo `manual-atendimento`. Use de 3 a 48 caracteres: letras minúsculas sem acentos, números e hífens simples entre palavras. O nome precisa estar disponível no serviço, não apenas na sua Central.
4. Se necessário, informe uma **Expiração Opcional**.
5. Marque **Forçar download ao abrir** se preferir o download à abertura no navegador.
6. Confirme em **Criar Link Público** e compartilhe a URL devolvida pela aplicação.

**Classificação Público não cria um link nem publica o arquivo automaticamente.** O link é uma decisão separada. Documentos Restritos ou Confidenciais não admitem esse compartilhamento.

### Acompanhar e interromper

No menu **Links Públicos**, consulte os links da Central atual. Use os filtros disponíveis e as ações **Inativar** ou **Ativar**. Confira a expiração: um link marcado como ativo pode já estar vencido.

Inativar interrompe novos acessos pelo endereço, mas não apaga cópias que alguém já baixou. A opção de abrir no navegador também não impede que o destinatário salve uma cópia.

Arquivar um documento ou solicitar sua exclusão inativa os links. Restaurar o documento, rejeitar a exclusão ou cancelar o pedido não os reativa automaticamente.

## 9. Retirar de uso ou excluir {#exclusoes}

| Necessidade | Caminho |
|---|---|
| Retirar de uso com possibilidade de retorno | **Ver Detalhes → Arquivar**. Quando cabível, use **Restaurar**. |
| Solicitar a retirada por exclusão | **Ver Detalhes → Solicitar Exclusão**, informando o motivo. |
| Confirmar a exclusão solicitada | Menu **Exclusões → Aprovar Exclusão Lógica**, para administrador autorizado. |

Em **Exclusões**, confira documento, motivo e solicitante. Um pedido ainda pode ser rejeitado; o solicitante original pode cancelá-lo enquanto isso for permitido. O rótulo de exclusão solicitada não significa que a exclusão foi concluída.

A aprovação cabe ao administrador documental autorizado do acervo; não depende de uma pessoa nominal específica.

**A exclusão disponível é lógica.** O documento deixa de estar disponível pela aplicação, mas os bytes e as versões são preservados conforme a retenção. O botão **Restaurar** do arquivamento não desfaz uma exclusão lógica já aprovada.

## 10. Trazer uma pasta do computador {#importacao}

Você não precisa anexar os arquivos um a um. Para um agente com acesso ao seu computador, informe o **caminho completo da pasta** e a **Central de destino**. Se o material estiver apenas no Google Drive, informe a URL da pasta e a conta pertinente.

O primeiro passo é analisar, não enviar tudo indiscriminadamente:

1. Inventariar arquivos e subpastas sem alterar os originais.
2. Separar duplicatas idênticas, versões prováveis e documentos distintos.
3. Comparar com os documentos já existentes na Central escolhida.
4. Propor título, descrição, coleção, tags, classificação e política de indexação.
5. Apontar formatos não suportados e documentos que exigem cuidado com sigilo.
6. Após a aprovação do lote, enviar cada item para o documento correto e conferir o resultado.

Texto para copiar:

```text
Analise a pasta [CAMINHO COMPLETO], incluindo as subpastas,
para integração à Central da Unimed Governador Valadares
(tenant unimed). Preserve os originais. Identifique duplicatas,
versões do mesmo documento e correspondências com o acervo.
Proponha a organização e informe os formatos não suportados.
Nesta primeira etapa, não envie, não exclua e não crie links públicos.
```

Se a pasta mistura organizações, classifique o destino antes do envio. Não presuma que o local no computador define sozinho a titularidade do arquivo. A importação não é uma sincronização contínua: arquivos novos ou alterados depois precisam de nova integração.

## 11. Operação por agentes {#agentes}

Os agentes usam a mesma Central, por ferramentas documentais ou pela API. O pedido pode ser simples, mas a execução deve manter a organização certa, as permissões e o histórico.

Exemplos de comandos humanos:

- “Localize o manual de atendimento na Central da Unimed Governador Valadares.”
- “Atualize este documento com o arquivo anexo, mantendo o mesmo cartão e o histórico.”
- “Analise esta pasta e proponha o que cadastrar ou versionar; não envie ainda.”
- “Crie um link público para esta versão, com o endereço curto e a validade que informei.”

Quando produzir ou revisar um documento relacionado a uma Central e a intenção de arquivamento não estiver definida, o agente deve perguntar se você quer incorporá-lo. **Produzir um arquivo não é autorização automática para enviá-lo ou torná-lo público.** Uma aprovação clara de lote pode abranger os itens descritos, sem exigir a mesma pergunta para cada arquivo.

O [guia para agentes](./central-documentos-agentes) documenta os comandos `documents_*`, o uso de identificadores, os limites de transporte e a prevenção de duplicidades. Ele não contém credenciais. As integrações não devem usar cookies pessoais nem escrever diretamente no índice do Panta.

## 12. Central, Panta e VPS {#panta}

**A Central é a biblioteca; o Panta v2 é o mecanismo de busca dessa biblioteca.** Essa é uma comparação funcional: quem controla o documento e o acesso continua sendo a Central.

- Os arquivos enviados ficam no **armazenamento privado R2**, não em uma pasta pública da VPS.
- O catálogo, as permissões e os identificadores das versões ficam no **D1**, o banco da Central.
- A **VPS** executa serviços de processamento e busca. O Panta v2 mantém um índice derivado, para localizar o conteúdo autorizado.
- O **Panta v1 federado** é o serviço anterior de busca e relações entre fontes. Ele não foi integralmente substituído pelo Panta v2 documental.

Você não precisa transportar manualmente a pasta do computador para a VPS. Envie pela Central ou por uma integração autorizada. A aplicação cuida da transferência e do processamento.

Se a busca falhar, isso não significa que os arquivos foram apagados. Catálogo e armazenamento não são o índice do Panta. Saiba mais no [manual do Panta v2](./panta-v2).

## 13. Resolver situações comuns {#duvidas}

| Situação | O que fazer |
|---|---|
| Falta um botão de envio, edição ou exclusão | Confira Central, sessão e permissão. Os recursos são compartilhados, mas os papéis não precisam ser iguais. |
| Envio terminou, mas o documento não está disponível | Confira processamento, segurança e autorização de disponibilização; não crie outro cartão para tentar resolver. |
| Não encontro um documento | Confira Central, filtros, permissão, retirada de uso e política de indexação. |
| A versão antiga não aparece na busca textual | Consulte o histórico do documento; o Panta pesquisa a versão vigente. |
| Quero enviar um XLSX | O formato não é aceito diretamente. Preserve o original e avalie uma representação em PDF, sem fingir que ela conserva fórmulas. |
| O link público abriu um conteúdo anterior | Ele fica vinculado à versão escolhida. Uma atualização do documento não altera o link. |
| A aplicação informa que o documento mudou | Recarregue os detalhes antes de repetir a alteração, evitando sobrescrever uma edição recente. |

Para arquitetura, contratos e registros de verificação, consulte a [documentação técnica da Central](/_infra/central-documentos). Este manual explica o uso; não substitui a verificação do resultado de cada operação.
