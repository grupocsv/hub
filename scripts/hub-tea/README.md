# Hub TEA — identidade visual e peças reais

Cadeia que reconstrói o `index.html` do Hub TEA (`hub.unimedgv.com/tea/`) com a
identidade do Caminhos Brilhantes e com as peças dos cartões. Tudo é
determinístico: a mesma entrada produz sempre a mesma saída, conferida por
SHA-256 antes de publicar.

## Onde a identidade é usada, e por quê

A logomarca Trilha tem três aplicações na página, e só três:

- **Herói.** O risco sob "Brilhantes" deixa de ser um traço laranja e passa a
  ser a trilha da marca: seis pontos crescentes que sobem até a estrela. Os
  raios, as cores e o desenho da estrela vêm do símbolo oficial
  (`logos/caminhos-brilhantes/01-trilha/simbolo-positivo.svg`).
- **Cartão 01, Estratégia.** A estrela caminha pela trilha e acende cada ponto
  por onde passa. O ponto aceso **fica** aceso, e os dois últimos, amarelos,
  brilham mais forte. A leitura é a da própria estratégia: o ganho da criança se
  acumula ao longo do percurso, não pisca e some. O traço também se preenche
  atrás da estrela, marcando o caminho já andado.

  O tempo é o mesmo para tudo: o ciclo dura 11 segundos e a estrela gasta 84%
  deles percorrendo a trilha, em movimento linear. Como o movimento é linear, a
  fração do percurso de cada ponto vira direto a porcentagem de tempo em que ele
  acende, e `montar_hub.py` gera um `@keyframes` por ponto com essa marca. Se os
  quadros-chave não entrarem na folha de estilo, nada acende e o script para: há
  uma verificação para isso.

  Duas armadilhas de leiaute já cobradas em conferência: o SVG precisa de
  `width:100%` explícito, senão usa a proporção intrínseca, fica mais largo que o
  cartão e o fim da trilha some no corte; e o pé do desenho fica acima do botão,
  para que nenhum ponto acenda por trás de palavra.
- **Rodapé.** A logomarca horizontal assina a página.

O cabeçalho continua sendo o lockup institucional da Unimed. A marca da
estratégia não disputa espaço com ele.

## As três peças

Cada cartão mostra o objeto como ele existe no mundo, não uma miniatura de tela.

| Cartão | Objeto | Origem |
| --- | --- | --- |
| 02 · Jornada | prancha impressa, com a marca de ampliar | `Jornada_TEA_CaminhosBrilhantes.pdf`, rasterizado |
| 03 · Painel | tela de tablet | interface real de `p/painel-tea/index.html` |
| 04 · Relatório | livro, só a capa | capa remontada com o desenho do relatório |

A prancha e a capa saem do **PDF verdadeiro**, por `render-pdf.js`, e não de uma
captura de tela: captura pega a página no meio do carregamento, com fonte ainda
não trocada ou imagem que não veio, e o resultado sai quebrado sem avisar. O PDF
já está fechado.

O objeto nunca cruza com o texto. No cartão 02, que é largo, a prancha fica na
**coluna ao lado** da explicação. Nos cartões 03 e 04, estreitos, o objeto é o
último item da coluna, com `margin-top:auto`: encosta no pé do cartão seja qual
for a altura da linha do grid, e nunca sobe por cima da chamada. O corte pela
borda arredondada é proposital, e vem de margem negativa **percentual** — assim a
fração cortada é a mesma em qualquer largura de tela, do desktop ao telefone.

`medir-pecas.js` confere isso em várias larguras: devolve a caixa de cada peça e
de cada chamada, e acusa sobreposição e transbordo horizontal.

## O que pode aparecer numa página aberta

Nada é desfocado e nada é inventado — as duas coisas estavam na versão anterior e
saíram. Em troca, o que entra é escolhido:

- **Jornada.** Documento público, já publicado em `open.grupocsv.com/jornada-tea/`.
  Entra inteiro.
- **Painel.** A tela mostra a aba Terapias com o **catálogo clínico**: as 17
  terapias, as 5 disciplinas, os 4 métodos estruturados. É informação de
  catálogo, que já circula na Jornada pública. Número de carteira não entra —
  pagamento, sessões, crianças, concentração de prestadores e custo por criança
  ficam no material restrito, atrás do login que o próprio cartão anuncia.
- **Relatório.** A capa segue o desenho do documento verdadeiro — banda branca
  com as duas assinaturas, campo `#003b3b`, faixa `#0d4545`, mesma hierarquia e
  o sumário dos treze capítulos. As duas faixas numéricas da capa real ficam de
  fora, pelo mesmo motivo: o documento é carimbado "USO RESTRITO" e a página do
  Hub é aberta e indexada. No lugar delas entram contagens de catálogo.

## Como regerar

Fora do repositório, num diretório de trabalho com os ativos baixados do bucket e
os dois PDFs:

```sh
# 0. rasterizador de PDF (ver o cabeçalho de render-pdf.js)
npm install pdfjs-dist
printf '<!doctype html><meta charset="utf-8"><title>r</title>' > vazio.html
npx http-server -p 8791 -s . &

# 1. prancha da jornada, do PDF verdadeiro
node render-pdf.js jornada.pdf jor 3 1 1          # -> jor-01.png
node imagem.js jor-01.png peca-jornada.webp 1600 0 0 3573 2524 0.82

# 2. capa do relatório, como livro
python3 montar_capa.py                            # -> capa-rel.html
node shot-mock.js capa-rel.html capa-rel-raw.png 636 900 3
node imagem.js capa-rel-raw.png peca-relatorio.webp 760 0 0 1908 2700 0.86

# 3. painel, na interface real, para a tela do tablet
python3 montar_mock_painel.py                     # -> mock-painel.html
node shot-mock.js mock-painel.html painel-raw.png 1194 834 2
node imagem.js painel-raw.png peca-painel.webp 1240 0 0 2388 1668 0.84

# 4. página, e conferência do leiaute
python3 montar_hub.py                             # -> hub-novo.html
node shot-hub.js hub-novo.html vista              # capturas 1440px e 390px
node medir-pecas.js 1440 1100 900 700 390
```

As três peças **não** entram embutidas como data URI: sobem como arquivos da
própria slug e o HTML aponta para elas por caminho relativo. A publicação troca o
conjunto inteiro numa requisição só, então não existe instante em que o HTML novo
conviva com imagem faltando, e não há endereço de fora que possa quebrar.

`shot-hub.js` grava um `vista-tmp.html` no diretório de trabalho antes de
fotografar, porque o caminho relativo das peças só resolve se a página for aberta
como arquivo ao lado delas.

## Publicação

O endpoint substitui o conjunto de arquivos da slug, então os quinze arquivos vão
juntos, e `title`, `description` e `og_image` precisam ser reenviados — sem eles
o Worker passa a servir OpenGraph vazio.

```sh
curl -X POST https://hub.unimedgv.com/api/upload \
  -H "Authorization: Bearer $HUB_ADMIN_TOKEN" \
  -F slug=tea -F "title=..." -F "description=..." \
  -F "og_image=https://hub.unimedgv.com/tea/og.jpg" \
  -F "files=@index.html;type=text/html" \
  -F "files=@peca-jornada.webp;type=image/webp" # ... e os demais treze arquivos
```

O token fica no KV do Worker, em `config:admin_token`.

## Conferência

`verificar_pub.py` baixa a página publicada, remove o bloco de `<head>` que o
Worker injeta e o beacon de analytics que a plataforma acrescenta, e compara o
resto byte a byte com o arquivo aprovado. Depois confere os quatorze arquivos da
slug — cada um por SHA-256 contra a cópia local — e os metadados servidos. As
contagens de conteúdo saem do próprio arquivo aprovado, não de números fixos, para
que a conferência não envelheça quando o desenho mudar.

Para a animação, `filme.js` congela todas as animações num instante do ciclo e
fotografa o cartão, o que permite ver a trilha em 2s, 6s e 10s sem depender de
sorte na captura. `posicoes.js` devolve a caixa do SVG, a do botão e o centro e a
cor de cada ponto — foi assim que apareceram o vazamento de largura e o ponto que
acendia por trás do botão.
