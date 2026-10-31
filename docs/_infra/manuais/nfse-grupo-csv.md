---
title: NFS-e Grupo CSV
description: Construção da área fiscal unificada e condições de liberação.
---

# NFS-e Grupo CSV

## Estado desta versão

Área em construção em `/grupo-csv/nfse/`. O código da nova interface consulta a API `/nfse/v2`. A publicação de arquivos não habilita emissões nem migra os dados anteriores automaticamente. A área anterior da AxiaCare permanece disponível em `/axia/nota-fiscal.html` até o corte aprovado.

O escopo é emitir e acompanhar NFS-e de AxiaCare, TheraTech e MedValor. O acesso fiscal é exclusivo do proprietário. As regras do calendário podem ser criadas, editadas, pausadas e arquivadas, mesmo enquanto uma empresa aguarda configuração fiscal. O calendário não transmite notas automaticamente.

## Fluxo de operação

1. Selecionar a empresa e o perfil fiscal validado.
2. Informar valor, competência e os campos exigidos pelo perfil.
3. Conferir a prévia com os dados do emitente, tomador, serviço, tributos e líquido.
4. Aprovar a nota ou lote discriminado.
5. Acompanhar o resultado oficial e obter os arquivos disponíveis.

Pelo MCP, a confirmação explícita na conversa é registrada pelo cliente autenticado. Não há segunda confirmação obrigatória em outro canal. Uma concessão de acesso ao cliente não representa aprovação de todas as notas futuras.

## Limites do primeiro recorte

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

Cancelamento e substituição fiscal não integram o catálogo executável desta versão. O acompanhamento de eventos externos será incorporado ao histórico. Também não há contas a pagar/receber, controle de pagamentos ou envio automático de documentos a terceiros.
