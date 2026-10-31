---
title: NFS-e Grupo CSV
description: Construção da área fiscal unificada e condições de liberação.
---

# NFS-e Grupo CSV

## Estado desta versão

Candidata a publicação em `/grupo-csv/nfse/`, com validação local e PR própria. O código da nova interface consulta a API `/nfse/v2`. A publicação de arquivos não habilita emissões nem migra os dados anteriores automaticamente. A área anterior da AxiaCare permanece disponível em `/axia/nota-fiscal.html` até o corte aprovado.

O escopo é emitir e acompanhar NFS-e de AxiaCare, TheraTech e MedValor. O acesso fiscal é exclusivo do proprietário. As regras do calendário podem ser criadas, editadas, pausadas e arquivadas, mesmo enquanto uma empresa aguarda configuração fiscal. O calendário não transmite notas automaticamente.

## Fluxo de operação

1. Selecionar a empresa e o perfil fiscal validado.
2. Informar valor, competência e os campos exigidos pelo perfil.
3. Conferir a prévia com os dados do emitente, tomador, serviço, tributos e líquido.
4. Aprovar a nota ou lote discriminado.
5. Acompanhar o resultado oficial e obter os arquivos disponíveis.

Pelo MCP, a confirmação explícita na conversa é registrada pelo cliente autenticado. Não há segunda confirmação obrigatória em outro canal. Uma concessão de acesso ao cliente não representa aprovação de todas as notas futuras.

## Condições de ativação

A base nova começa sem histórico sincronizado e sem ativar automaticamente os cadastros fiscais. A tela distingue configuração pendente, indisponibilidade do serviço e ausência de registros. Simulação local não é homologação governamental. Operações de emissão permanecem bloqueadas enquanto o executor, o certificado, o perfil e o contrato governamental não estiverem liberados.

Os certificados e suas senhas não entram no navegador, em documentos do Hub ou nas conversas. O recebimento ocorre por procedimento privado revisado. O aplicativo armazena apenas a referência e os metadados necessários.

## Conexões MCP

A tela Conexões cria uma chave individual por aplicativo, permite alterar suas empresas e permissões e revogar seu acesso. A chave aparece uma única vez e não pode ser recuperada pelo aplicativo. O modo dinâmico do MCP valida essa mesma chave na API; não exige credencial adicional de gateway. A publicação do endpoint e os testes em cada aplicativo continuam etapas separadas.

O acervo oferece consulta de documentos, arquivos XML/PDF autenticados e verificação de integridade. O processo de distribuição registra cursor, eventos e itens recebidos sem confundi-los com notas emitidas.

## Construção e validação

- Interface: `docs/public/grupo-csv/nfse/`.
- Testes de calendário/valores: `tests/nfse-v4-model.test.mjs`.
- Testes de interface no Chromium com API sintética: `tests/nfse-v4-ui.test.mjs`.
- O build VitePress copia a área pública para o artefato final.
- A API e o MCP são mantidos no repositório privado do backend.

Antes de publicar: executar os testes pertinentes, revisar o artefato final, confirmar autenticação e permissões, atualizar a matriz de estado e aprovar a mudança de produção. A migração exige conferência de dados, backup, numeração fiscal única e plano de recuperação. Não restaurar um contador antigo sobre operações já transmitidas.

## Operações ainda não disponíveis

Cancelamento e substituição fiscal não integram o catálogo executável desta versão. O acompanhamento de eventos externos integra o histórico do acervo, conforme a cobertura disponível da distribuição. Também não há contas a pagar/receber, controle de pagamentos ou envio automático de documentos a terceiros.

## Calendário, lotes e revisão

As regras geram ocorrências mensais preservadas. É possível adiar ou dispensar uma ocorrência com motivo, preparar uma nota avulsa ou preparar até vinte itens em lote. Cada item precisa de data fiscal explícita; uma resposta parcial permite corrigir somente os pendentes. Editar uma prévia cria nova revisão e invalida sua autorização anterior.

O acervo filtra empresa, competência, situação, documento do tomador, chave e intervalo de emissão. As datas inicial/final são dias civis em America/Sao_Paulo. A visão geral distingue valores dos documentos autorizados e valores das prévias; documentos importados ou sincronizados entram nas contagens sem duplicar uma operação da plataforma.

## Importação e arquivos

A importação aceita até vinte XMLs e histórico JSON no formato fiscal permitido. O total de XML é limitado a 2 MiB; a requisição completa, a 3 MiB. Primeiro é apresentada a conferência. Somente a confirmação do mesmo manifesto grava os registros. A evidência histórica não se converte em autorização atual, e vínculos com o legado não são inventados.

XML original e PDFs permanecem privados. A regeneração deriva um PDF do XML preservado e acrescenta uma versão, sem mudar a nota fiscal. A versão original continua disponível. Repetições usam a mesma chave; chamadas concorrentes não criam versões diferentes para a mesma intenção.

## Saúde e recuperação

A API/MCP expõem diagnóstico de banco, presença/tamanho de uma amostra de arquivos e emissor privado. A amostra não constitui auditoria integral de hashes, validação de certificado ou homologação governamental.

O código de recuperação foi ensaiado com D1/R2 locais e journal SQLite sintético. O pacote privado verifica manifestos, dados e arquivos; não inclui credenciais nem restaura concessões de acesso. Os helpers de restauração exigem destino vazio de teste e emissão desabilitada. A recuperação de produção segue o plano operacional autorizado; o teste local não comprova a existência de backup de produção.

Após qualquer transmissão v2, um rollback deve primeiro bloquear o caminho legado, preservar o journal/reservas e reconciliar o resultado. O binário antigo não conhece as novas travas de corte. Não reabrir emissão com dois contadores nem restaurar configuração antiga com mutações ativas.

## Evidências de aceite

A validação inclui modelo e documentação, navegador em desktop/celular, sessão expirada com respostas tardias, preparação/aprovação/revisão por API real e importação/PDF por serviços locais. O aceite de produção e dos cinco clientes MCP permanece separado da prova local. Nunca usar uma emissão real para testar conectividade.
