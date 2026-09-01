# Baseline congelada — Compass™ 001–008

**Data do congelamento:** 31 de agosto de 2026  
**Commit-base do Hub:** `8d05187e7693b16cc6bee7828a216649b85fb111`  
**Diretório externo de evidências:** `/home/ubuntu/workspace/compass-v2-baseline/2026-08-31/`  
**SHA-256 do manifesto completo:** `a4bd262cc3e636a20e98415d411e7c6f2ce22f3d820e69aa584f539f2119bdf4`

Esta baseline preserva os HTMLs e PDFs públicos das edições 001 a 007 e os dois insumos originais da edição 008. Os arquivos brutos permanecem fora do repositório; somente o inventário e os identificadores são versionados.

## Inventário dos artefatos

| Edição | HTML (bytes) | PDF (bytes) | Páginas do PDF | Origem |
|---|---:|---:|---:|---|
| 001 | 59.360 | 465.461 | 7 | Produção |
| 002 | 76.489 | 476.815 | 10 | Produção |
| 003 | 79.316 | 1.412.287 | 13 | Produção |
| 004 | 103.396 | 504.599 | 16 | Produção |
| 005 | 80.061 | 483.057 | 12 | Produção |
| 006 | 45.128 | 445.956 | 4 | Produção |
| 007 | 69.059 | 470.868 | 9 | Produção |
| 008 | 100.581 | 1.120.909 | 23 | Anexos originais |

## URLs históricas preservadas

O contrato público de cada edição anterior permanece:

- Página: `https://hub.grupocsv.com/compass/edicoes/2026/{edicao}/compass`
- PDF: `https://hub.grupocsv.com/compass/edicoes/2026/{edicao}/compass_{edicao}_2026.pdf`

As edições 001 a 007 foram baixadas com sucesso dessas URLs durante o congelamento.

## Checksums dos insumos 008

| Arquivo | SHA-256 |
|---|---|
| HTML original | `552e903ecdd33767b767d2e4956390c7c4edf52118b6a5936d7d1c8f92cf6f70` |
| PDF original | `5b344e2244db43215059d215fb42fb254dc22af373e260cd6b443dfbf86bbdc5` |
| ZIP original | `887c4fc5bdce7336fbd5782b75326fb88f9c53a6c55ee9d9e3e7a08d5a43b462` |

## Evidências visuais

O diretório `renders/` contém dez evidências: a capa de cada PDF 001–008 e capturas desktop/mobile do HTML original da edição 008. Essas imagens são a referência para comparações visuais e não serão usadas como fonte editorial.

## Regra de restauração

Durante a migração, qualquer divergência de conteúdo, numeração, download ou autoria deve ser comparada primeiro com esta baseline. O rollback deve restaurar o ponteiro ou arquivo anterior sem alterar o slug público.
