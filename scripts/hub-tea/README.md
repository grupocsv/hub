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
- **Cartão 01, Estratégia.** A estrela caminha pela trilha pontilhada, em vez do
  antigo facho de luz. É a mesma ideia de movimento que já existia, agora com a
  geometria da marca.
- **Rodapé.** A logomarca horizontal assina a página.

O cabeçalho continua sendo o lockup institucional da Unimed. A marca da
estratégia não disputa espaço com ele.

## Mockups

| Cartão | Origem | Tratamento |
| --- | --- | --- |
| 02 · Jornada | captura do diagrama público de `open.grupocsv.com/jornada-tea/` | recorte das estações 03 a 05 |
| 03 · Painel | interface real de `p/painel-tea/index.html` | números desfocados, gráficos sem escala |

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
