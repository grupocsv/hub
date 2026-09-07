# Open Pages — scripts de curadoria

Scripts determinísticos que reconstroem o HTML de uma Open Page publicada em
`open.grupocsv.com`, aplicando uma revisão de conteúdo verificável.

Cada script:

1. baixa a página viva (única entrada, sem dependência de arquivos locais);
2. remove o bloco de `<head>` que o Worker `csv-open-pages` injeta ao servir
   (favicons e OpenGraph padrão), para que a publicação não o duplique;
3. aplica substituições de texto com contagem esperada — qualquer divergência
   aborta a execução em vez de gerar HTML errado;
4. grava `index-novo.html` e imprime o SHA-256 de entrada e de saída.

Publicar somente quando o SHA-256 de saída coincidir com o documentado no
cabeçalho do script.

## `caminhos-brilhantes-set2026.py`

Curadoria de setembro de 2026 da estratégia Caminhos Brilhantes
(`open.grupocsv.com/caminhos-brilhantes/`), que estava congelada em maio de 2026.

O que muda:

| Bloco | Antes | Depois |
| --- | --- | --- |
| Cabeçalho e rodapé | Maio · 2026 | Setembro · 2026 |
| Marca | ausente | logomarca oficial Trilha no herói e no rodapé |
| Eixo 01 · Quálix | acreditação futura (15–17 de junho) | Casa Unimed e clínicas credenciadas certificadas |
| Eixo 01 · AAD | 60 crianças/mês | em operação desde 2 de setembro de 2026 · 60 crianças/mês |
| Eixo 02 | sigla PTM | plano terapêutico da Casa Unimed |
| Eixos 01–03 e card IBRAVS | framework chancelado pela ANS | framework desenvolvido no âmbito do acordo de cooperação técnica com a ANS |
| Nova seção | — | Marcos de 2026 (certificação Quálix, modelo pactuado com o IBRAVS, AAD em operação) |
| Card FEMG · Quálix | auditoria (15–17 de junho de 2026) | auditoria e certificação (14 de agosto de 2026) |
| Card Neurosteps | plataforma parceira | plataforma parceira, já em operação |
| Materiais | dois PDFs | link para a Jornada TEA em destaque, PDFs datados como concepção |
| Materiais | — | nota de acesso ao Hub TEA |
| Links dos PDFs | relativos (`./`) | absolutos (`/caminhos-brilhantes/`), que não quebram na URL sem barra final |

Restrições respeitadas: nenhum dado de carteira, custo, projeção de economia,
nome de prestador ou nota Quálix por clínica; nenhuma afirmação de "primeira
certificação de TEA do país"; nenhuma nota por clínica credenciada.

### Publicação

O arquivo gerado substitui o objeto `index.html` da slug `caminhos-brilhantes`
no bucket R2 `csv-open-pages`. Os demais arquivos da slug
(`apresentacao.pdf`, `relatorio.pdf`, `og.png`) devem ser preservados.

Três caminhos, em ordem de preferência:

1. **Painel** `open.grupocsv.com/_admin/` — subir o `index-novo.html` renomeado
   para `index.html` na slug existente.
2. **Endpoint de upload** — atenção: substitui o conjunto de arquivos da slug,
   então os quatro arquivos vão juntos.

   ```sh
   curl -X POST https://open.grupocsv.com/api/upload \
     -H "Authorization: Bearer $OPEN_PAGES_ADMIN_TOKEN" \
     -F slug=caminhos-brilhantes \
     -F "files=@index.html;type=text/html" \
     -F "files=@apresentacao.pdf;type=application/pdf" \
     -F "files=@relatorio.pdf;type=application/pdf" \
     -F "files=@og.png;type=image/png"
   ```

   O token fica no KV do próprio Worker, em `config:admin_token`.
3. **API do R2** — gravar só o objeto do index, o que não toca nos demais
   arquivos. É o caminho mais seguro quando só o HTML muda.

Guardar uma cópia do objeto atual antes de sobrescrever.

Após publicar, conferir no KV `csv-open-pages` (`page:caminhos-brilhantes`) que
`og_image` aponta para `https://open.grupocsv.com/caminhos-brilhantes/og.png` —
sem essa chave o Worker injeta a imagem genérica do Grupo CSV nos
compartilhamentos.
