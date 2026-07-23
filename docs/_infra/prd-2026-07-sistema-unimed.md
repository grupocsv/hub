# PRD — Sistema Unimed · AxiaCare

| Campo | Valor |
| --- | --- |
| Data | 21/07/2026 |
| Responsável do produto | Guilherme Camargo Thomé |
| Entidade | AxiaCare |
| Categoria | WebApp |
| Rota | `https://hub.grupocsv.com/axia/sistema-unimed.html` |
| API | `https://api.grupocsv.com/unimed` |
| Status | Em implementação |

## 1. Objetivo

Disponibilizar, no ambiente autenticado da AxiaCare, um catálogo institucional do Sistema Unimed consultável por pessoas e por integrações. A primeira entrega cobre entidades, códigos e ativos de identidade visual. O contrato deve permitir a inclusão posterior de PTU, manuais de auditoria, documentos e outros recursos sem quebrar os consumidores existentes.

O produto é um acervo de trabalho da AxiaCare. Ele não se apresenta como portal oficial da Unimed do Brasil nem substitui as fontes institucionais.

## 2. Escopo da primeira entrega

- busca por nome, código do Sistema Unimed, UF e tipo institucional;
- código canônico com quatro posições e aliases de consulta;
- cards com código, nome, UF, tipo institucional, papel operacional e situação ANS quando disponíveis;
- detalhe de cada entidade;
- quatro posições de identidade visual: com box e pinheiro, com box sem pinheiro, sem box e pinheiro, sem box e sem pinheiro;
- preview e download dos formatos disponibilizados pela API;
- paginação por cursor;
- estados de carregamento, resultado vazio, falha de serviço, sessão expirada e acesso negado;
- contrato GET versionado e documentado por OpenAPI.

Não fazem parte desta etapa:

- edição ou upload pelo navegador;
- publicação em `/p/` ou Open Pages;
- armazenamento de ZIPs, logos ou catálogos no repositório público;
- criação de um segundo login;
- classificação automática definitiva de registros ainda pendentes de confirmação no CadU.

## 3. Hospedagem e autenticação

### 3.1 Interface

A interface é um HTML standalone em `axia/sistema-unimed.html`, copiado para o artefato publicado pelo pipeline atual. Ela deve conter:

- `<meta name="robots" content="noindex, nofollow">`;
- `<meta name="hub-category" content="webapp">`;
- `<meta name="hub-entity" content="AxiaCare">`;
- slot explícito `#hub-auth-slot`;
- `<script src="/scripts/hub-auth.js" data-portal="axia"></script>`.

O script existente resolve `axia` para o tenant `axiacare`. O WebApp lê a sessão opaca já estabelecida e a envia à API pelo header `X-Auth-Token`. Não há formulário de autenticação próprio.

### 3.2 API e objetos privados

- API versionada sob `https://api.grupocsv.com/unimed/v1`;
- metadados relacionais em D1;
- ZIPs originais, vetores, imagens e previews em R2 privado;
- respostas autenticadas com `Cache-Control: private, no-store`;
- CORS restrito às origens autorizadas do Hub;
- registros de acesso sem payload ou conteúdo dos arquivos;
- nenhum segredo em URL, HTML, log, repositório ou armazenamento de longa duração da interface.

## 4. Contrato GET consumido pela interface

### 4.1 Pesquisa

```http
GET /v1/entities?q={texto}&uf={UF}&type={tipo}&limit=24&cursor={cursor}
X-Auth-Token: {sessao_opaca}
```

Resposta preferencial:

```json
{
  "data": [
    {
      "code": "0236",
      "source_code": "236",
      "name": "Unimed Governador Valadares",
      "uf": "MG",
      "type_ptu": "singular",
      "institutional_type": "singular",
      "operational_role": "operadora",
      "ans": {
        "registration": "386588",
        "status": "ativa",
        "modality": "cooperativa médica"
      },
      "assets": {
        "count": 16,
        "variant_count": 4,
        "complete_four_variants": true
      }
    }
  ],
  "meta": {
    "next_cursor": "string-ou-null",
    "returned": 1,
    "has_more": false
  }
}
```

### 4.2 Detalhe e assets

```http
GET /v1/entities/{codigo}
GET /v1/entities/{codigo}/assets
GET /v1/entities/{codigo}/logos?set=primary|secondary|all
GET /v1/assets/{asset_id}/download
```

Para agentes e integrações, `/logos` é a rota canônica. Sem `set`, o contrato
assume `primary` e devolve os quatro PNGs — duas composições com box e duas sem
box, contemplando as opções com e sem pinheiro. SVG, PDF e AI são formatos
secundários e permanecem acessíveis com `set=secondary` ou `set=all`.
`/assets` preserva o acesso compatível ao acervo completo.

O payload de assets deve informar, no mínimo:

- identificador estável;
- variante lógica;
- indicadores `has_box` e `has_symbol`;
- formato;
- nome do arquivo;
- versão;
- hash SHA-256;
- dimensões quando aplicáveis;
- URL de preview assinada ou endpoint autenticado de conteúdo;
- URL ou endpoint autenticado de download.

O frontend aceita envelopes equivalentes durante a evolução inicial (`data`, `items`, `entities`, `results`), mas o OpenAPI é a fonte normativa para novos consumidores.

### 4.3 Erros

| Status | Comportamento da interface |
| --- | --- |
| 400 | Informar filtro inválido sem apagar os filtros preenchidos. |
| 401 | Informar sessão expirada e oferecer nova autenticação. |
| 403 | Informar ausência de permissão sem invalidar uma sessão válida. |
| 404 | Informar entidade ou asset não encontrado. |
| 429 | Informar limite temporário e permitir nova tentativa. |
| 5xx/rede | Informar indisponibilidade temporária e permitir nova tentativa. |

## 5. Modelo de informação

Entidade e operação são dimensões distintas. O catálogo não deve inferir que todo registro da faixa numérica de Singulares é uma operadora ativa.

Campos centrais:

- `codigo_sistema_unimed`: código canônico com quatro posições;
- `codigo_fonte` e `aliases_codigo`;
- `nome_atual` e aliases históricos;
- `uf` e área de atuação;
- `tipo_ptu`;
- `tipo_institucional_atual`;
- `papel_operacional`;
- `registro_ans`, `situacao_ans` e `modalidade_ans`;
- início e fim de vigência;
- fonte, data de verificação, confiança e estado de curadoria.

Registros de teste permanecem na camada bruta e ficam ocultos no catálogo padrão. Registros não classificados como Singulares permanecem no acervo com seu tipo correto.

## 6. Ativos de identidade visual

O pacote original é preservado de forma imutável. A ingestão cria uma camada curada e ignora somente metadados técnicos do macOS, como `__MACOSX`, `._*` e `.DS_Store`.

Eixos de classificação:

- box: com ou sem;
- pinheiro: com ou sem;
- formato: AI, PDF, PNG, SVG e formatos futuros;
- pacote, versão, hash, tamanho, dimensões e transparência;
- objeto original e preview derivado.

A ausência de uma variante é exibida como indisponibilidade factual, sem gerar ou substituir a marca.

## 7. Experiência e acessibilidade

- shell institucional da AxiaCare;
- conteúdo com paleta e tipografia Unimed;
- fundo `#fafaf7`, texto `#004e4c` e ação principal `#00995d`;
- títulos e interface em Unimed Sans; corpo em Unimed Serif, com fallbacks seguros;
- contêineres com raio mínimo de 18 px e controles em formato pílula;
- sentence case;
- navegação completa por teclado;
- foco visível;
- status dinâmicos em região `aria-live`;
- diálogo nativo para detalhe;
- previews com texto alternativo contextual;
- alvos de toque de pelo menos 44 px;
- nenhuma rolagem horizontal da página em telas estreitas;
- respeito a `prefers-reduced-motion`.

## 8. Segurança da interface

- nenhum dado de entidade ou asset hardcoded no HTML;
- conteúdo recebido da API inserido com `textContent`, nunca como HTML executável;
- URLs validadas para `http:` ou `https:`;
- arquivos baixados por `fetch` autenticado quando pertencentes à API;
- nomes de arquivo normalizados antes do download;
- token somente em header;
- limpeza da sessão AxiaCare apenas após `401`, nunca em `403` ou falha transitória;
- nenhum dado do catálogo em `localStorage`;
- nenhum service worker ou cache offline nesta etapa.

## 9. Integração com o Hub

- card em `docs/axia/index.md`, que é a landing publicada pelo VitePress;
- card equivalente em `axia/index.html`, mantido como fallback estático;
- registro automático no `manifest.json` pelas meta tags do WebApp;
- classificação explícita na taxonomia de produtos;
- smoke test de existência e `noindex` no artefato final;
- verificador de links deve validar os dois cards;
- a página não entra em `/p/`, `p/registry.json` ou Open Pages.

## 10. Critérios de aceite

1. A rota é publicada apenas no fluxo normal do Hub e aparece nas duas landings da AxiaCare.
2. Sem sessão, o gate existente é exibido; não existe segundo login.
3. A pesquisa envia nome/código, UF e tipo à API sem dados fictícios.
4. Os estados loading, empty, error, 401 e 403 são distintos e acessíveis.
5. O detalhe oferece quatro posições de preview e somente os formatos realmente recebidos.
6. Downloads preservam autenticação e não expõem token na URL.
7. Nenhum asset institucional ou catálogo é versionado no Git.
8. `noindex, nofollow`, `hub-category`, `hub-entity` e slot de autenticação estão presentes.
9. Desktop e mobile não apresentam rolagem horizontal nem sobreposição do widget de logout.
10. `check-portal-links.py`, build VitePress e smoke tests aprovam o artefato.
11. O manifest inclui `axia/sistema-unimed.html` como `webapp` da AxiaCare.
12. Nenhuma publicação, migration ou alteração de permissão ocorre sem a etapa operacional correspondente.
13. A interface e a API identificam PNG como formato padrão; SVG, PDF e AI aparecem como secundários.

## 11. Evolução compatível

Novos domínios devem ser adicionados sob a mesma versão enquanto forem apenas aditivos:

```text
/v1/documents
/v1/ptu
/v1/manuals
/v1/taxonomies
/v1/openapi.json
```

Mudanças incompatíveis exigem nova versão de rota. Identificadores estáveis, aliases, paginação e semântica dos filtros não podem mudar silenciosamente.
