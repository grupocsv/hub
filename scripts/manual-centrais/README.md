# Manual das Centrais: geração do PDF

O conteúdo editorial em `build_manual.py` corresponde ao manual humano de 01/11/2026 e aos tópicos de Panta v2. Os HTMLs canônicos estão em `docs/_infra/manuais/central-documentos.md` e `panta-v2.md`; o guia para integração está em `central-documentos-agentes.md`.

O PDF não é um despejo automático do Markdown: os textos foram editados para 16 páginas, com passos, tabelas e diagramas. Ao alterar funcionalidades, atualizar as duas representações e conferir os rótulos na implementação.

## Preparar e executar

Python 3.11 ou posterior. Usar ambiente virtual local, fora de diretórios publicados; nenhuma credencial ou conexão com a Central é necessária.

```sh
python -m venv .venv-manual
# Ativar o ambiente conforme seu sistema operacional.
python -m pip install -r scripts/manual-centrais/requirements.txt
python scripts/manual-centrais/build_manual.py
```

Saída padrão: `output/pdf/manual-centrais-documentos.pdf`, resolvida a partir da raiz do repositório. Alternativa:

```sh
python scripts/manual-centrais/build_manual.py --output /caminho/privado/manual.pdf
```

O gerador informa tamanho, quantidade de páginas e tamanho do texto extraído por página. Ele falha se a paginação for diferente de 16 páginas. Isso não substitui a inspeção visual.

## Tipografia e identidade

- O logo negativo oficial está em `assets/csv-horizontal-negativo-sf.png`, preservado sem edição. Origem: pacote oficial `design-system-csv`, arquivo `logos/csv-horizontal-negativo-sf.png`. SHA-256: `a66d0e561b920d31ed1098a8ff202703f37accae626b0f373b41e75f282d19c6`.
- A fonte Grifter oficial é lida da árvore `docs/public/visual-identity`. Quando seu formato não é aceito pelo ReportLab, o título usa o negrito da família corporal.
- No Windows, o padrão usa Segoe UI já instalada no sistema, sem redistribuí-la. Em outros sistemas, usa Liberation Sans, já versionada em `docs/public/documentos/vendor/pdfjs/standard_fonts`, com sua licença nessa mesma pasta.
- `--font-family liberation` força a alternativa portátil; `--font-family segoe` exige Segoe UI. Trocar a fonte exige nova inspeção visual.
- Os SVGs ilustrativos são lidos de `docs/public/manuais/documentos/`. Não há downloads nem caminhos de usuário fixados no código.

## Conferência e publicação

```sh
pdfinfo output/pdf/manual-centrais-documentos.pdf
pdftoppm -r 110 -png output/pdf/manual-centrais-documentos.pdf /caminho/temporario/pagina
```

Inspecionar todas as páginas: ausência de cortes, sobreposições, páginas vazias e títulos órfãos; legibilidade das tabelas e dos diagramas; sumário e links corretos. Somente depois copiar o PDF revisado para `docs/public/manuais/documentos/manual-centrais-documentos.pdf` no fluxo autorizado de publicação. O gerador não publica, não envia arquivos para a Central e não altera infraestrutura.

## Validação da edição de 01/11/2026

- 16 páginas A4 confirmadas pelo gerador (pypdf) e pelo `pdfinfo`.
- Todas as 16 páginas renderizadas e inspecionadas.
- Exemplos sintéticos e diagramas explicativos; nenhum documento real incorporado.
- Limites explícitos: XLSX/DOCX não suportados diretamente; Panta pesquisa a versão vigente; conteúdo histórico é acessado pelo histórico de versões; equivalência entre Centrais não concede igualdade de permissões.
