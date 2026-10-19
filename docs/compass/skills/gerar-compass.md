# Guia Operacional | Produzir e Publicar Edições do Compass™

**Compass™ — elaboração do Grupo CSV | Responsabilidade editorial: MedValor®**

A elaboração é creditada ao Grupo CSV e a responsabilidade editorial à MedValor®. Nenhuma edição carrega selo de estado editorial (minuta, revisão, aprovação) na capa, na Central ou no componente global: uma edição publicada é a edição. O campo `status` dos metadados é operacional.

## Princípio Operacional

A fonte única de cada edição fica em `compass/edicoes/<ano>/<número>/`. A árvore `docs/compass/edicoes/` e o catálogo público são derivados por scripts; não devem ser editados manualmente. A mesma fonte versionada produz a página responsiva e o PDF A4.

| Artefato | Responsabilidade |
|---|---|
| `metadata.yml` | Identidade, marcas, rotas, engine, estado e release |
| `compass.md` | Invólucro VitePress e configuração do componente global |
| `CompassNNNContent.vue` | Conteúdo semântico integral da edição |
| `edition.css` | Estilos específicos, sempre namespaceados em `.compass-v2`; nas edições paginadas, com escopo próprio da edição (`.compass-ed-NNN`) |
| `assets/` | Imagens e recursos locais da edição |
| `compass_NNN_AAAA.pdf` | PDF A4 determinístico |
| `release.json` | Checksum, tamanho, procedência e versão do render |

## 1. Validar a Fonte Primária

Identifique os documentos autorizados para a edição e preserve integralmente os fatos, números, citações, tabelas e referências. Nenhum dado deve ser incluído sem confirmação na fonte primária. Registre em `metadata.yml` apenas temas, tags e referências efetivamente presentes no material.

## 2. Criar a Fonte Canônica

Crie a pasta da edição somente em `compass/edicoes/AAAA/NNN/` e copie os templates v2:

```bash
mkdir -p compass/edicoes/AAAA/NNN/assets
cp compass/templates/metadata_template.yml compass/edicoes/AAAA/NNN/metadata.yml
cp compass/templates/compass_template.md compass/edicoes/AAAA/NNN/compass.md
```

Substitua todos os marcadores `AAAA`, `NNN` e os textos de exemplo. O número tem três dígitos e é imutável. O identificador usa o formato `NNN-AAAA`; as rotas públicas seguem:

```text
/compass/edicoes/AAAA/NNN/compass
/compass/edicoes/AAAA/NNN/compass_NNN_AAAA.pdf
```

## 3. Preencher os Metadados e as Marcas

O arquivo `metadata.yml` deve seguir `schemaVersion: 2`. A hierarquia institucional é obrigatória e não admite variações:

```yaml
product:
  name: Compass™
  owner: Grupo CSV
editorial:
  responsible: MedValor®
elaboration:
  - Grupo CSV
engine:
  name: compass-v2
  version: 2.0.0
  templateVersion: 2.0.0
```

Use `migration.state: native-v2` para novas edições. O release nasce inativo até concluir os gates e o processo de ativação controlada; o campo `status` é operacional e não aparece na capa nem na Central.

## 4. Estruturar o Conteúdo Semântico

Crie `CompassNNNContent.vue` com um único bloco `<template>`. Use HTML semântico, títulos em ordem lógica, tabelas com `thead` e `tbody`, imagens com texto alternativo e links externos com destino preservado. Todo CSS específico deve ficar em `edition.css`, sob o namespace `.compass-v2`, para não contaminar o Hub.

O arquivo `compass.md` usa `CompassEdition.vue` como moldura. Selecione `mode: flow` para leitura contínua com PDF paginado pelo navegador. Use `mode: paged` quando a edição for composta página a página em A4.

### Edição de referência do padrão paginado

A edição **009/2026** (`compass/edicoes/2026/009/`) é a referência visual e funcional para novas edições paginadas. Parta dela, nunca do zero nem da edição 008:

| Elemento | Regra observada na 009 |
|---|---|
| Invólucro | Todas as seções `.compass-page` ficam dentro de `<div class="compass-ed-NNN">` no componente Vue |
| Escopo do CSS | Todo seletor começa por `.compass-v2--paged .compass-v2__content .compass-ed-NNN …`; o VitePress concatena o CSS de todas as edições em um único bundle, e esse escopo impede que uma edição paginada altere outra e garante precedência sobre `.vp-doc` e sobre o tema genérico |
| Página nomeada | `@page compass-edition-NNN { size:A4; margin:0 }` e `:where(.compass-v2--paged) .compass-ed-NNN .compass-page { page:compass-edition-NNN }` |
| Contrato de tipografia | As regras `:where(.compass-v2--paged) p { text-indent:4.5mm; text-align:justify; hyphens:auto }` e congêneres permanecem (ver `tests/compass-v2/paged-css-isolation.test.mjs`) |
| Tela | Leitura fluida em qualquer largura (sem fac-símile A4), figuras SVG com rolagem horizontal no celular, tabelas roláveis; A4 somente em `@media print` |
| Impressão | O tema força cores em `p`, `td`, `strong`, `h2` e `h3` na impressão; a edição devolve as suas com `!important` no bloco `@media print` |
| Fontes | Inter 400/400i/500/600/700, JetBrains Mono 500 e Grifter Bold em `assets/`, referenciadas por `url("/compass/edicoes/AAAA/NNN/assets/…")`; a Grifter não possui `õ`, `Õ`, travessões e setas, o que limita títulos em fonte display |
| Componentes editoriais | Abertura de capítulo em faixa escura, linhas de dados, fichas de prática (`.verbete`), quadros com `colgroup`, figuras SVG inline com legenda e fonte, referências com numeração original |
| Capa | Marca, créditos em duas linhas, ilustração, título, subtítulo, linha de fonte (quando adaptação), Edição e Data de publicação. Sem rótulo de tipo ou tema, sem bloco de público ou aplicação e sem selo de estado editorial |
| Texto sem metalinguagem | O texto apresenta o conteúdo e não fala de si: sem rubricas acima dos títulos ("Conteúdo", "O essencial"), sem parágrafos que expliquem o que a edição é ou como ler o aparato (notas, sobrescritos), sem anúncio de figura ("a figura X mostra"), sem notas de tradução ("no original"). Remissões secas entre parênteses: `(cap. 6)`, `(figura 3.3)`. Fonte de figura e quadro na forma `Fonte: Autor et al., ano.` |
| Camada de texto do PDF | Sem hifens suaves (U+00AD) inseridos no HTML: eles contaminam busca, cópia e indexação do PDF |

## 5. Publicar a Árvore Derivada e Gerar o Catálogo

Execute:

```bash
npm run compass:publish
npm run compass:catalog
```

O primeiro comando sincroniza as fontes v2 para `docs/compass/edicoes/`. O segundo deriva `docs/compass/catalog.json` a partir dos metadados. Não inclua a edição manualmente na Central, na sidebar ou em listas paralelas.

## 6. Construir e Visualizar Localmente

```bash
npm run docs:build
npm run docs:preview -- --host 127.0.0.1 --port 4192
```

A renderização PDF aceita somente `localhost` ou `127.0.0.1`. Confirme na prévia a capa, a hierarquia das marcas, o conteúdo integral, o comportamento mobile, as tabelas roláveis, as figuras e as ações finais.

## 7. Gerar o PDF A4 Determinístico

Crie temporariamente `compass/edicoes/AAAA/NNN/.render-edition.json`:

```json
{
  "id": "NNN-AAAA",
  "slug": "NNN",
  "year": AAAA
}
```

Com a prévia local ativa, execute:

```bash
npm run compass:pdf:runtime -- node scripts/compass-v2/render-pdf.mjs \
  --url http://127.0.0.1:4192/compass/edicoes/AAAA/NNN/compass \
  --output compass/edicoes/AAAA/NNN/compass_NNN_AAAA.pdf \
  --edition-file compass/edicoes/AAAA/NNN/.render-edition.json \
  --source-file compass/edicoes/AAAA/NNN/CompassNNNContent.vue \
  --manifest compass/edicoes/AAAA/NNN/release.json

rm compass/edicoes/AAAA/NNN/.render-edition.json
```

O runtime usa Chromium em container efêmero fixado por digest. O host não recebe bibliotecas do navegador. O gerador FPDF em `tools/compass-pdf/` permanece congelado apenas para reprodutibilidade histórica do v1; não deve ser usado em novas edições nem para atualizar PDFs v2.

## 8. Executar os Gates da Edição

```bash
npm run compass:pdf:runtime -- node scripts/compass-v2/quality-gates.mjs \
  --url http://127.0.0.1:4192/compass/edicoes/AAAA/NNN/compass \
  --pdf compass/edicoes/AAAA/NNN/compass_NNN_AAAA.pdf \
  --output-dir .tmp/compass-v2/qa/NNN \
  --required 'Compass™|Grupo CSV|MedValor®|AxiaCare®|Termo obrigatório da edição'
```

O relatório deve indicar aprovação simultânea de paridade web/PDF, tamanho máximo de 4 MB, acessibilidade, contraste de impressão, ausência de overflow documental e legibilidade das tabelas mobile. Inspecione visualmente a captura desktop, a captura mobile e todas as páginas do PDF.

## 9. Executar a Regressão Completa

Depois de gerar o PDF e o manifesto, republique a árvore derivada e rode os gates do repositório:

```bash
npm run compass:publish
npm run compass:catalog
npm run compass:test
npm run compass:test:pdf
npm run docs:build
```

A saída de `git status` não pode conter descritores `.render-edition.json`, diretórios `.tmp` ou outros artefatos temporários. A fonte canônica e a publicação derivada devem permanecer byte a byte equivalentes para os arquivos da edição.

## 10. Revisar e Preparar o Release

A revisão mínima combina dois métodos independentes:

| Método | Verificação |
|---|---|
| Determinístico | Testes, catálogo, checksums, paridade, build, links e varredura de segredos |
| Visual e Adversarial | Desktop, mobile, todas as páginas do PDF, contraste, cortes, tabelas, figuras e encerramento |

Faça commit atômico em branch de trabalho. Gere o plano offline com `npm run compass:release-plan`, usando a baseline congelada e os SHAs completos das revisões candidatas. O plano deve manter `remoteMutationAllowed: false`, exigir autorização explícita e validar as nove edições por checksum, bytes, páginas, rotas e limite de 4 MB.

Não faça push, merge, deploy, upload ou ativação de ponteiro antes da aprovação do release correspondente. A sequência completa, os checkpoints, as condições de interrupção e o rollback estão no [Runbook de Release e Rollback do Compass™ v2](/_infra/projetos/compass-v2/runbook-release-rollback).

## 11. Backend e Download Público

O ciclo administrativo do Compass™ reutiliza o Worker `csv-documents`. Cada edição usa um `document_id` determinístico para o PDF. O golden master é ingerido por serviço publicador com `source_type: migration` e `source_ref` imutável; o candidato v2 entra como nova versão do mesmo documento. A preparação registra a versão e os checksums sem alterar o ponteiro público; a ativação ocorre somente depois da aprovação técnica e move o release ativo de forma atômica. Downloads reutilizam `document_public_links` e `/s/{slug}`, com slugs versionados imutáveis para baseline e candidato.

A migration `0021_create_compass_catalog.sql` e as rotas `/v1/compass/*` não devem ser aplicadas ou publicadas fora do workflow protegido e da autorização explícita. O n8n não participa do caminho crítico do Compass™.

## Checklist de Aceite

- [ ] Fonte primária e referências preservadas integralmente
- [ ] `metadata.yml` válido no schema v2
- [ ] Fórmula institucional e símbolos ™ e ® corretos
- [ ] URL web e nome do PDF no padrão histórico
- [ ] Conteúdo semântico sem lista manual paralela
- [ ] PDF A4 gerado no runtime isolado
- [ ] `release.json` atualizado
- [ ] PDF abaixo de 4 MB
- [ ] Paridade web/PDF aprovada
- [ ] Zero violações bloqueantes de acessibilidade
- [ ] Zero overflow documental mobile
- [ ] Tabelas e figuras legíveis
- [ ] Inspeção visual de todas as páginas concluída
- [ ] Regressão das edições anteriores aprovada
- [ ] Nenhum segredo ou arquivo temporário no diff
- [ ] Release, rollback e autorização documentados antes de produção

[Voltar para a Central Compass™](/compass/)
