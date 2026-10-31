---
title: NFS-e Grupo CSV
description: Publicação técnica da área fiscal unificada e condições de ativação.
---

# NFS-e Grupo CSV

## Estado em 31 de Outubro de 2026

A API NFS-e 4.0.0, a autenticação 4.2.0, o MCP e o emissor privado foram publicados. As migrações fiscais `0004` a `0009` foram aplicadas. A emissão v2 permanece desabilitada, e AxiaCare, TheraTech e MedValor continuam com estado `pending_configuration`. A publicação técnica não libera seus perfis, certificados, regras tributárias ou numeração para emitir pela v2.

A nova interface usa a API `/nfse/v2` e tem como endereço [NFS-e Grupo CSV](https://hub.grupocsv.com/grupo-csv/nfse/). A publicação no GitHub Pages foi concluída em 31/10/2026 pelo [pipeline de produção](https://github.com/grupocsv/hub/actions/runs/41197363050). HTML, JavaScript e CSS do endereço público foram comparados com a [revisão integrada da interface](https://github.com/grupocsv/hub/pull/193), sem divergências.

O caminho legado da [NFS-e AxiaCare](https://hub.grupocsv.com/axia/nota-fiscal.html) e seu estado fiscal foram preservados. Nenhuma emissão, cancelamento, substituição, importação real ou alteração de dados tributários foi realizada nesta publicação. A ativação fiscal e o corte do legado continuam etapas distintas.

O escopo é emitir e acompanhar NFS-e de AxiaCare, TheraTech e MedValor. O acesso fiscal é exclusivo do proprietário. As regras do calendário podem ser criadas, editadas, pausadas e arquivadas, mesmo enquanto uma empresa aguarda configuração fiscal. O calendário não transmite notas automaticamente.

## Fluxo de Operação

1. Selecionar a empresa e o perfil fiscal validado.
2. Informar valor, competência e os campos exigidos pelo perfil.
3. Conferir a prévia com os dados do emitente, tomador, serviço, tributos e líquido.
4. Aprovar a nota ou lote discriminado.
5. Acompanhar o resultado oficial e obter os arquivos disponíveis.

Pelo MCP, a confirmação explícita na conversa é registrada pelo cliente autenticado. Não há segunda confirmação obrigatória em outro canal. Uma concessão de acesso ao cliente não representa aprovação de todas as notas futuras.

## Condições de Ativação

A base nova começa sem histórico sincronizado e sem ativar automaticamente os cadastros fiscais. A tela distingue configuração pendente, indisponibilidade do serviço e ausência de registros. Simulação local não é homologação governamental. Operações de emissão permanecem bloqueadas enquanto o executor, o certificado, o perfil e o contrato governamental não estiverem liberados.

Os certificados e suas senhas não entram no navegador, em documentos do Hub ou nas conversas. O recebimento ocorre por procedimento privado revisado. O aplicativo armazena apenas a referência e os metadados necessários.

## Conexões MCP

A tela Conexões cria uma chave individual por aplicativo, permite alterar suas empresas e permissões e revogar seu acesso. A chave aparece uma única vez e não pode ser recuperada pelo aplicativo. O modo dinâmico do MCP valida essa mesma chave na API; não exige credencial adicional de gateway. O endpoint publicado é [NFS-e MCP](https://nfse-mcp.grupocsv.com/mcp). A publicação do serviço não equivale ao aceite em cada aplicativo: os testes de conexão com as credenciais do proprietário e a validação fiscal continuam etapas próprias.

O acervo oferece consulta de documentos, arquivos XML/PDF autenticados e verificação de integridade. O processo de distribuição registra cursor, eventos e itens recebidos sem confundi-los com notas emitidas.

## Construção e Validação

- Interface: `docs/public/grupo-csv/nfse/`.
- Testes de calendário/valores: `tests/nfse-v4-model.test.mjs`.
- Testes de interface no Chromium com API sintética: `tests/nfse-v4-ui.test.mjs`.
- O build VitePress copia a área pública para o artefato final.
- A API e o MCP são mantidos no repositório privado do backend.

Antes de cada nova publicação, executar os testes pertinentes, revisar o artefato final, confirmar autenticação e permissões, atualizar a matriz de estado e aprovar a mudança de produção. A migração exige conferência de dados, backup, numeração fiscal única e plano de recuperação. Não restaurar um contador antigo sobre operações já transmitidas.

## Operações Ainda Não Disponíveis

Cancelamento e substituição fiscal não integram o catálogo executável desta versão. O acompanhamento de eventos externos integra o histórico do acervo, conforme a cobertura disponível da distribuição. Também não há contas a pagar/receber, controle de pagamentos ou envio automático de documentos a terceiros.

## Calendário, Lotes e Revisão

As regras geram ocorrências mensais preservadas. É possível adiar ou dispensar uma ocorrência com motivo, preparar uma nota avulsa ou preparar até vinte itens em lote. Cada item precisa de data fiscal explícita; uma resposta parcial permite corrigir somente os pendentes. Editar uma prévia cria nova revisão e invalida sua autorização anterior.

O acervo filtra empresa, competência, situação, documento do tomador, chave e intervalo de emissão. As datas inicial/final são dias civis em America/Sao_Paulo. A visão geral distingue valores dos documentos autorizados e valores das prévias; documentos importados ou sincronizados entram nas contagens sem duplicar uma operação da plataforma.

## Importação e Arquivos

A importação aceita até vinte XMLs e histórico JSON no formato fiscal permitido. O total de XML é limitado a 2 MiB; a requisição completa, a 3 MiB. Primeiro é apresentada a conferência. Somente a confirmação do mesmo manifesto grava os registros. A evidência histórica não se converte em autorização atual, e vínculos com o legado não são inventados.

XML original e PDFs permanecem privados. A regeneração deriva um PDF do XML preservado e acrescenta uma versão, sem mudar a nota fiscal. A versão original continua disponível. Repetições usam a mesma chave; chamadas concorrentes não criam versões diferentes para a mesma intenção.

## Saúde e Recuperação

A API/MCP expõem diagnóstico de banco, presença/tamanho de uma amostra de arquivos e emissor privado. A amostra não constitui auditoria integral de hashes, validação de certificado ou homologação governamental.

O código de recuperação foi ensaiado com D1/R2 locais e journal SQLite sintético. O pacote privado verifica manifestos, dados e arquivos; não inclui credenciais nem restaura concessões de acesso. Os helpers de restauração exigem destino vazio de teste e emissão desabilitada. A recuperação de produção segue o plano operacional autorizado; o teste local não comprova a existência de backup de produção.

Após qualquer transmissão v2, um rollback deve primeiro bloquear o caminho legado, preservar o journal/reservas e reconciliar o resultado. O binário antigo não conhece as novas travas de corte. Não reabrir emissão com dois contadores nem restaurar configuração antiga com mutações ativas.

## Evidências de Aceite

A validação inclui modelo e documentação, navegador em desktop/celular, sessão expirada com respostas tardias, preparação/aprovação/revisão por API real e importação/PDF por serviços locais. O aceite de produção e dos cinco clientes MCP permanece separado da prova local. Nunca usar uma emissão real para testar conectividade.

## Registro Histórico

Em 7 de outubro de 2026, a documentação registrava a NFS-e AxiaCare v3.2 com emissão controlada em produção. Esse estado pertence ao caminho legado, preservado durante a publicação técnica de 31 de outubro de 2026. Não deve ser interpretado como ativação da nova emissão multiempresa.

## Corte do Leiaute Legado

A partir de 01/12/2026, às 00h em America/Sao_Paulo, novas transmissões ou retransmissões com o contrato NT004 ficam bloqueadas. Consultas e conciliação de uma DPS já aceita continuam disponíveis. Esse limite não habilita o contrato NT009: sua ativação exige os artefatos aplicáveis, parâmetros validados e homologação. O aplicativo mantém as empresas pendentes até essas condições serem comprovadas.
