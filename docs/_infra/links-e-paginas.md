---
title: Links e Páginas — Visão Unificada
description: Onde ficam e como se relacionam os links curtos de csv.online, as páginas públicas do Hub e das Open Pages e os links de documentos.
head:
  - - meta
    - name: robots
      content: noindex, nofollow
---

# Links e Páginas — Visão Unificada

**Atualizada em 30 de outubro de 2026.** Esta página reúne os recursos do ecossistema que publicam conteúdo para fora do Hub ou encaminham alguém até ele. A organização é só de leitura e de manuseio: cada recurso mantém o seu serviço, a sua autenticação e a sua forma de administração.

No Admin do Hub, os dois itens ficam juntos na seção **Links e Páginas**, logo abaixo de Geral: **Central de Links** e **Páginas Públicas**.

## Qual Usar

| Preciso de | Use | Onde se Administra |
|---|---|---|
| Um endereço curto e permanente cujo destino eu possa trocar depois, como `csv.online/blog` | Link rotativo da Central de Links | Admin → Links e Páginas → Central de Links |
| Um endereço curto para um conteúdo específico, que não muda de destino | Link estático da Central de Links | Admin → Links e Páginas → Central de Links |
| Publicar uma página HTML (relatório, painel, proposta) acessível fora do Hub | Open Pages em `open.grupocsv.com` | Admin → Links e Páginas → Páginas Públicas; painel próprio em `open.grupocsv.com/_admin/`; ferramentas MCP do Extensio |
| Publicar uma página da Unimed Governador Valadares no domínio próprio | Open Pages em `hub.unimedgv.com` | Admin → Links e Páginas → Páginas Públicas |
| Revogar ou restaurar uma página do diretório `/p/` | Páginas `/p/` (legado) | Admin → Links e Páginas → Páginas Públicas |
| Compartilhar um arquivo da Central de Documentos | Link público de documento | Central de Documentos → Links Públicos |

Regra prática: a Central de Links não hospeda conteúdo; ela só encaminha para um endereço HTTPS que já existe. Primeiro publique o conteúdo (Open Pages, Central de Documentos ou o próprio site); depois, se quiser um endereço curto, crie o link na Central de Links.

## Mapa dos Recursos

| Recurso | Endereço Público | Serviço | Acesso no Admin |
|---|---|---|---|
| Central de Links (rotativos e estáticos) | `csv.online` e `www.csv.online` | Worker `csv-links` (D1 e KV), com API em `links-api.grupocsv.com` | Sessão do Admin; a Central só é carregada quando a aba é aberta |
| Open Pages | `open.grupocsv.com` | Worker `csv-open-pages` (R2 e KV); Auth Gate opcional pelo `csv-open-auth` | Token próprio das Open Pages, guardado no navegador |
| Open Pages Unimed GV | `hub.unimedgv.com` | Worker `hub-unimedgv` | Token próprio das Open Pages |
| Páginas `/p/` (legado) | `hub.grupocsv.com/p/` | GitHub Pages e `p/registry.json`; revogação e restauração pelo `csv-auth` | Sessão do Admin |
| Links de documentos | `documentos-api.grupocsv.com/s/…` | Worker `csv-documents` (D1); arquivos em R2 privado | Fora do Admin, na Central de Documentos |
| csv.email | Sem site | Somente registros de proteção de e-mail | Em standby; a preparação fica na seção csv.email da Central de Links |

O card **Páginas Públicas** da Visão Geral do Admin soma as páginas ativas de `/p/`, `open.grupocsv.com` e `hub.unimedgv.com`. Ele não conta links de `csv.online`, para que a Central continue sem nenhuma chamada à API antes de ser aberta.

## Como Eles se Relacionam

- Um link curto pode ter como destino uma Open Page ou uma página `/p/`. Nesse caso, a Central mostra o aviso **A revogação desta página é feita em Páginas Públicas**.
- Desativar ou excluir o link curto não tira a página do ar. Revogar a página não apaga o link curto: ele continua existindo e passa a levar a uma página indisponível. Ao revogar uma página que tenha link curto, revise o link na Central.
- No topo de Páginas Públicas, o botão **Abrir Central de Links** leva direto à Central. Ele apenas aciona o item do menu; não chama nenhuma API.
- "Links Públicos" da Central de Documentos é outro mecanismo: links de compartilhamento de arquivos, com regras próprias de acesso, descritos no [manual da Central](/_infra/manuais/central-documentos#links-publicos).

## csv.online/blog: Como o Destino Muda

O `blog` é um link rotativo com troca manual. A publicação de um post novo em grupocsv.com/blog não altera o destino: alguém precisa escolher o post em **Detalhes → Trocar destino**, testar e publicar. Essa foi a decisão P4 do PRD, que deixou a troca automática para o último post fora do escopo da primeira versão. O passo a passo está em [Central de Links — operação](/_infra/projetos/central-de-links/operacao#atualizar-o-csv-online-blog-depois-de-um-post-novo).

Qualquer automação dessa troca exige uma decisão nova e mudança no Worker `csv-links`; ela não faz parte da organização desta página.

## Quem Publica por Fora do Admin

- **Painel próprio das Open Pages**, em `open.grupocsv.com/_admin/`.
- **Ferramentas MCP do Extensio**: `open_page_publish` e `open_page_list`, usadas por agentes e automações.
- **Rotinas que publicam Open Pages**, como o Perfil do Bloco Cirúrgico, o CSV Memory e os envios por WhatsApp.
- **Páginas `/p/`**: a criação exige commit no repositório `grupocsv/hub`; o Admin só revoga e restaura.

## Situação do `/p/`

Em 30/10/2026, o `p/registry.json` publicado lista duas páginas, ambas ativas: `tea-dataset` (criada em 15/02/2026) e `painel-tea` (criada em 11/07/2026). A orientação documentada é publicar páginas novas em Open Pages. A situação oficial do `/p/`, se continua aceitando páginas ou fica congelado, ainda aguarda decisão.

## Pendências Conhecidas

| Pendência | Situação |
|---|---|
| Código-fonte do Worker `hub-unimedgv` | O repositório citado na documentação (`grupocsv/hub-unimedgv`) não foi encontrado no GitHub em 27/10/2026. Origem a confirmar. |
| Limpeza do redirecionamento provisório de `csv.online` | Prevista no PRD para depois de 01/11/2026. Mexe em configuração de produção e depende de aprovação própria. |
| csv.email | Em standby, sem ação prevista. |

## Documentos Relacionados

- [Central de Links — operação](/_infra/projetos/central-de-links/operacao)
- [Central de Links — PRD](/_infra/projetos/central-de-links/prd)
- [Páginas Públicas (Open Pages e `/p/`)](/_infra/public-pages)
- [Manual da Central de Documentos](/_infra/manuais/central-documentos)
- [Arquitetura Técnica](/_infra/technical-architecture)
