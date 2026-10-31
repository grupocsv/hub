---
title: Central de Links — operação
description: Como criar, trocar, restaurar e acompanhar os links curtos do Grupo CSV.
head:
  - - meta
    - name: robots
      content: noindex, nofollow
---

# Central de Links — operação

A Central de Links administra os endereços curtos de `csv.online`. No Admin do Hub, abra **Links e Páginas → Central de Links**. Desde 30/10/2026, a Central fica nessa seção, ao lado de **Páginas Públicas**; a [visão unificada](/_infra/links-e-paginas) explica quando usar cada recurso. A sessão é a mesma do Admin; as ações disponíveis dependem do papel confirmado pelo servidor.

| Tipo | Quando usar | Quem pode alterar o destino |
|---|---|---|
| Rotativo | Um endereço permanente que acompanha o conteúdo escolhido no momento, como `csv.online/blog`. | Admin e superadmin, por troca manual. |
| Estático | Uma referência a um documento, material ou conteúdo específico. | Somente superadmin, em uma correção com motivo registrado. |

O link curto leva a uma URL já publicada. A central não recebe arquivos e não altera a proteção do destino: páginas que exigem login continuam exigindo login. Os dois tipos usam redirecionamento temporário, sem armazenamento em cache pelo navegador.

## Consultar os links

**Visão geral** reúne totais, cliques sem robôs nos últimos 7 e 30 dias, alterações recentes e links cujo último teste diário falhou. Confira também a data da última execução bem-sucedida da tarefa diária.

Em **Rotativos** ou **Estáticos**, busque pelo texto e filtre por situação ou etiqueta. As listas mostram 25 itens por página. **Copiar** copia o endereço público; **Abrir** abre o link; **Detalhes** reúne destino, versão, validade, ações e histórico.

As sugestões `compass`, `evento`, `material` e `agenda` preenchem o nome no formulário. Elas só se tornam links depois que você informa um destino e conclui a criação.

## Criar um link

1. Abra a lista do tipo desejado e escolha **Criar**.
2. Escolha **Rotativo** ou **Estático** e preencha o **Nome curto**. Confira a prévia do endereço e sua disponibilidade. Nomes repetidos ou reservados são recusados pelo servidor.
3. Informe o **Título interno**. Escolha um **Post do blog** ou selecione **Outra URL** para informar um endereço HTTPS público.
4. Se necessário, preencha etiquetas, notas e descrição da prévia, com até 160 caracteres. A validade é opcional e começa vazia. Datas e horas são apresentadas no horário de Brasília.
5. Clique em **Testar destino**. Confira o status HTTP, o endereço final, os redirecionamentos e a indicação de prévia própria.
6. Clique em **Criar link**. Se o teste tiver falhado e você decidir prosseguir, marque **Publicar mesmo assim** e confirme a publicação.

Um teste com falha não prova que o destino está incorreto: o serviço pode estar temporariamente indisponível ou exigir login. Confira o endereço antes de confirmar. A confirmação não libera endereços proibidos pela validação de segurança.

O rotativo `blog` só muda quando alguém escolhe e publica outro destino. A publicação de um post novo no blog não altera o link automaticamente. Para indicar sempre um post específico, compartilhe o endereço desse post.

## Trocar o destino de um rotativo

Abra **Detalhes → Trocar destino**, escolha o novo post ou informe outra URL, teste e publique. O endereço `https://csv.online/<nome>` permanece igual. A troca encerra a vigência do destino anterior e acrescenta uma entrada ao histórico.

Se outra pessoa publicar enquanto você edita, o painel informa:

> Outra pessoa alterou este link enquanto você editava. Recarregue para ver a versão atual. Nada foi gravado.

Clique em **Recarregar**, confira a versão atual e decida se a alteração ainda deve ser feita. A mesma proteção vale para outras edições do link.

## Atualizar o csv.online/blog depois de um post novo

A publicação de um post não muda o `csv.online/blog`. O caminho mais curto é o botão da aba do blog:

1. Abra **Conteúdo → Blog grupocsv.com**. O cartão **Link csv.online/blog**, acima do painel do blog, mostra o destino atual, o post publicado mais recente e a situação (**Em dia** ou **Desatualizado**).
2. Se estiver desatualizado, clique em **Apontar para o último post**, confira o post na confirmação e confirme. O cartão usa a mesma troca de destino da Central, com teste do destino, e acompanha a propagação até **Confirmado** (no mínimo 90 segundos). Se a confirmação não vier em 5 minutos, siga a seção Acompanhar a propagação.

Para escolher um post que não seja o mais recente, use a Central:

1. Abra **Links e Páginas → Central de Links → Rotativos** e, no link `blog`, clique em **Detalhes**.
2. Escolha **Trocar destino** e selecione o post novo na lista **Post do blog**. A lista vem da API pública do blog, ordenada do mais recente para o mais antigo, e pode levar até um minuto para mostrar um post recém-publicado.
3. Clique em **Testar destino**, confira o endereço final e publique.
4. Aguarde o estado **Confirmado**, cerca de 90 segundos depois da publicação. Para conferir de fora, abra `https://csv.online/blog` em uma janela anônima.

Se a troca não for feita, o link continua levando ao post escolhido da última vez, mesmo que haja posts mais recentes.

## Acompanhar a propagação

Após uma publicação, o link aparece **Em propagação**. Durante cerca de 90 segundos, alguns acessos ainda podem chegar ao destino anterior, conforme a região da rede.

O painel mostra **Confirmado** depois de pelo menos 90 segundos, quando a consulta feita pelo seu navegador encontra a versão publicada ou uma versão mais recente. Essa confirmação vale para a região de rede consultada; não é uma promessa de atualização simultânea em todo o mundo.

Se a versão não puder ser confirmada após 5 minutos, aparece **Propagação não confirmada**. Use **Regravar rota** e acompanhe novamente. Se a falha continuar, encaminhe a mensagem e o código da requisição ao responsável técnico. Não repita a troca de destino apenas para tentar acelerar a propagação.

## Restaurar um destino anterior

Nos detalhes, consulte a linha do tempo: ela mostra a vigência de cada destino, quem publicou, o resultado do teste e o motivo, quando informado. No destino anterior desejado, clique em **Restaurar este destino**, confira o endereço e confirme.

A restauração publica uma nova versão com o endereço escolhido. O histórico anterior é preservado e a nova versão também passa por propagação. Em links estáticos, restaurar exige o papel de superadmin e as mesmas confirmações de uma correção.

## Corrigir um estático

Somente o superadmin vê **Corrigir destino**. Use essa ação para corrigir uma referência que deveria continuar associada ao mesmo conteúdo.

Informe o novo destino, escreva um motivo com pelo menos 10 caracteres e digite o nome curto solicitado para confirmar. Teste o endereço e conclua a correção. O motivo, o responsável e os destinos anterior e novo ficam registrados no histórico.

## Desativar, arquivar ou excluir

| Ação | Efeito |
|---|---|
| **Desativar** | Interrompe o redirecionamento e mostra uma página de link desativado. **Reativar** permite voltar a usá-lo, se a validade ainda permitir. |
| **Arquivar** | Retira o link da lista padrão, mas mantém o redirecionamento funcionando. **Desarquivar** devolve o link à lista. |
| Definir uma validade | Depois do prazo, o endereço mostra uma página de link expirado. |
| **Excluir** | Disponível somente para superadmin. Exige digitar o nome curto e confirmar. O endereço passa a mostrar uma página de link não encontrado. |

A exclusão libera o nome curto imediatamente. Um novo link com esse nome começa com histórico e métricas próprios; os registros do link excluído continuam consultáveis em **Histórico e Métricas**. Confira materiais e QR Codes já distribuídos antes de reutilizar o nome, pois eles também apontarão para o novo link.

Quando o destino for uma Open Page ou uma página pública do Hub, o painel mostra: **A revogação desta página é feita em Páginas Públicas**. Desativar ou excluir o link curto não revoga a página de destino. Se a página for revogada em **Páginas Públicas**, o teste diário poderá marcar o link curto como **Destino com falha**.

## Gerar um QR Code

Na lista ou nos detalhes, clique em **QR Code** e baixe o arquivo em **PNG** ou **SVG**. O código é gerado no navegador e contém sempre `https://csv.online/<nome>`, nunca o destino vigente.

Assim, o QR Code de um rotativo continua útil depois de uma troca de destino. O PNG atende a usos comuns como mensagens e documentos; o SVG permite ampliar a imagem para impressão. Confira a leitura do código no material final antes de distribuí-lo.

## Consultar domínios e métricas

Em **Domínios**, confira o resultado e a hora de cada verificação. A saúde pública é consultada em `csv.online/_csv/health`. **Sem resposta** indica que a tentativa não produziu uma resposta utilizável pelo navegador; isso pode ocorrer enquanto o redirecionamento provisório do domínio estiver ativo. A falha não impede o uso das demais seções.

As políticas de redirecionamento, parâmetros e nomes reservados são somente para consulta. A central não altera DNS. Apenas parâmetros `utm_` aceitos passam ao destino; se o destino já possui um deles, prevalece seu valor.

Em **Métricas**, escolha o link e o período de 7, 30 ou 90 dias, ou informe um intervalo personalizado de até 24 meses. O gráfico separa cliques e robôs; você pode ocultar a série de robôs. As tabelas detalham os resultados por vigência do destino, país, origem e campanha.

As métricas são contagens agregadas, não pessoas únicas. A classificação de robôs é aproximada. Não são guardados IP, identificadores de pessoas, cookies nem a URL completa de referência. As contagens são preservadas por 24 meses; o histórico de destinos não expira.

Em **Histórico e Métricas**, use os filtros de link, evento, autor e período para localizar alterações, inclusive de links excluídos. A exportação e a reconstrução geral das rotas são ações exclusivas do superadmin. A exportação deve ser guardada fora do repositório público.

## Preparar o csv.email

A seção **csv.email** registra a finalidade pretendida, as notas de briefing e as decisões pendentes. Uma decisão pode conter título, opções, situação, decisão tomada e data. Salvar esses dados não ativa envio, recebimento, encaminhamento, site ou caixas postais.

O checklist distingue **Pendente**, **Não configurado** e **Verificado**. Os itens técnicos de domínio e proteção de e-mail só passam a **Verificado** após um teste real, acompanhado de data, hora e método. Os itens manuais devem refletir decisões efetivamente tomadas.

Não coloque senhas, chaves ou tokens nos campos de texto. Não há campo de credencial, e o servidor recusa padrões que possam conter segredos. Se aparecer uma recusa, remova o dado sensível antes de salvar novamente.

As possibilidades de uso e os custos exibidos são referências de planejamento com fonte e data da consulta. Eles não confirmam contratação nem a configuração atual de uma conta. Revise as condições antes de decidir sobre um serviço.

## Resolver falhas e reverter mudanças

Se a sessão expirar, entre novamente no Admin. Se houver solicitação de troca de senha, conclua-a antes de usar a central. Uma mensagem de falta de permissão deve ser tratada com o responsável pelo acesso, sem compartilhar sessões.

Erros de validação pedem correção dos campos; limite de requisições pede uma espera antes de tentar novamente. Em falhas temporárias do blog, é possível informar outra URL. Em falhas da API, confira o estado atual antes de repetir uma alteração. Preserve o código da requisição exibido para facilitar o diagnóstico.

| Situação | Caminho de reversão |
|---|---|
| Destino publicado por engano | Prefira **Restaurar este destino** no histórico. |
| Dados afetados além de um destino | O responsável técnico avalia a restauração da base para um ponto anterior e reconstrói as rotas a partir dela. |
| Falha logo após a ativação do domínio | O responsável pela publicação pode reativar as regras provisórias de redirecionamento, enquanto elas estiverem disponíveis. |
| Defeito em uma versão do serviço de links | O responsável pela publicação retorna à versão anterior pelo fluxo de publicação. |
| Defeito na aba do Admin | Reverter a alteração por revisão de código e publicar a versão anterior do Hub. Os links públicos têm serviço próprio. |
| Defeito nos serviços de assets ou Open Pages | Retornar à versão anterior pelo fluxo de publicação do respectivo serviço. |
| Necessidade de retirar a proteção provisória de e-mail | O responsável pelo domínio remove os registros correspondentes após autorização; a mudança também depende do prazo de atualização do DNS. |

A reversão de código não desfaz dados já gravados. Restaurações da base e mudanças de domínio exigem avaliação do responsável técnico. Consulte o [PRD da Central de Links](./prd) para os critérios completos de funcionamento e publicação.
