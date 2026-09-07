# Hub TEA — identidade visual e mockups

Cadeia que reconstrói o `index.html` do Hub TEA (`hub.unimedgv.com/tea/`) com a
identidade do Caminhos Brilhantes e com os mockups dos cartões. Tudo é
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

## Janelas

A peça real não divide espaço com o texto. Cada cartão reserva uma faixa no pé,
encostada nas bordas, e o texto ganha recuo equivalente: imagem e palavra nunca
se cruzam, e não há degradê tapando frase. O cartão do Relatório segue o mesmo
ritmo, com o ícone no lugar da peça.

| Cartão | Origem | Tratamento |
| --- | --- | --- |
| 02 · Jornada | captura do diagrama público de `open.grupocsv.com/jornada-tea/` | faixa larga com o fluxo inteiro |
| 03 · Painel | interface real de `p/painel-tea/index.html` | faixa com os indicadores; números desfocados, gráficos sem escala |
| 04 · Relatório | ícone de documento | mesma faixa, fundo levemente tingido |

O painel é de acesso restrito e seus agregados não podem aparecer numa página
aberta. O mockup usa o HTML e o CSS verdadeiros do produto — barra lateral,
topo, componentes, tipografia — e substitui apenas os dados: os números ficam
desfocados e os gráficos não trazem eixo com valores. Assim o cartão mostra o
produto real sem publicar dado nenhum, e sem inventar número que alguém possa
ler como verdadeiro.

## Como regerar

Fora do repositório, num diretório de trabalho com os ativos baixados do bucket:

```sh
# 1. mockup do painel, a partir da interface real
python3 montar_mock_painel.py                      # -> mock-painel.html
node shot-mock.js mock-painel.html mock-painel-raw.png 1440 900 2

# 2. mockup da jornada, a partir da página pública
node shot-jornada.js                               # -> mock-jornada-raw.png

# 3. recorte e compressão
node imagem.js mock-jornada-raw.png mock-jornada.webp 980 1150 40 1814 1150 0.80
node imagem.js mock-painel-raw.png  mock-painel.webp  980  700 60 2180 1330 0.80

# 4. página
python3 montar_hub.py                              # -> hub-novo.html
node shot-hub.js hub-novo.html vista               # capturas 1440px e 390px
```

Os mockups entram embutidos como data URI: a página continua sendo um arquivo
único, sem requisição externa, e a publicação não tem estado intermediário em
que o HTML novo conviva com imagem faltando.

## Publicação

O endpoint substitui o conjunto de arquivos da slug, então os doze arquivos vão
juntos, e `title`, `description` e `og_image` precisam ser reenviados — sem eles
o Worker passa a servir OpenGraph vazio.

```sh
curl -X POST https://hub.unimedgv.com/api/upload \
  -H "Authorization: Bearer $HUB_ADMIN_TOKEN" \
  -F slug=tea -F "title=..." -F "description=..." \
  -F "og_image=https://hub.unimedgv.com/tea/og.jpg" \
  -F "files=@index.html;type=text/html" \
  -F "files=@og.jpg;type=image/jpeg" # ... e os demais dez arquivos
```

O token fica no KV do Worker, em `config:admin_token`.

## Conferência

`verificar_pub.py` baixa a página publicada, remove o bloco de `<head>` que o
Worker injeta e o beacon de analytics que a plataforma acrescenta, e compara o
resto byte a byte com o arquivo aprovado. Também confere os onze arquivos da
slug e os metadados servidos.

Para a animação, `filme.js` congela todas as animações num instante do ciclo e
fotografa o cartão, o que permite ver a trilha em 2s, 6s e 10s sem depender de
sorte na captura. `posicoes.js` devolve a caixa do SVG, a do botão e o centro e a
cor de cada ponto — foi assim que apareceram o vazamento de largura e o ponto que
acendia por trás do botão.
