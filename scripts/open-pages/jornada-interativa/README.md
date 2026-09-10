# Interação da Jornada TEA oficial

Camada independente para `https://open.grupocsv.com/jornada-tea/`. Mantém o HTML editorial, o SVG, o cabeçalho e o Apoio Textual da página recebida. Acrescenta explicações por etapa, seleção por teclado/toque e imagem completa para abrir ou baixar. O mapa ocupa a largura disponível e acompanha a rolagem da página, sem área própria de rolagem. A ampliação fica disponível pelo zoom nativo do navegador ou pela imagem completa. O mapa fica disponível também no celular, com alternância para o percurso textual existente.

## Escopo

- JavaScript e CSS com prefixo `ji-`, sem React, autenticação ou serviços do portal CLAVS.
- Os 30 pontos usam as coordenadas do mapa validado no portal CLAVS; suas explicações foram revisadas contra o Apoio Textual da página oficial.
- JSON inválido, estrutura incompatível ou ausência da camada preservam o conteúdo original.
- Publicação limitada a `jornada-tea/index.html` e ao novo PNG no R2 `csv-open-pages`. Não escreve em KV, Worker, DNS ou outras páginas.
- Git guarda código e manifesto dos bytes revisados. Capturas, cópias anteriores e evidências de execução ficam fora do repositório.

## Construção e verificação

Requer Python 3, Node.js e Playwright com Chromium instalado. Se necessário, informe a localização de um `package.json` cujo diretório resolva Playwright em `JORNADA_RUNTIME_PACKAGE` e um canal instalado em `JORNADA_BROWSER_CHANNEL`.

```powershell
python scripts/open-pages/jornada-interativa/build.py --output C:/jornada-release/package
node scripts/open-pages/jornada-interativa/verify-browser.mjs C:/jornada-release/package C:/jornada-release/qa-local
```

`--input` permite repetir a construção a partir de uma captura pública. O PNG é sempre renderizado do SVG capturado, com suas imagens incorporadas; não aceita uma imagem arbitrária. O arquivo recebe o prefixo do seu SHA-256 no nome.

A construção remove somente injeções reconhecidas do Worker e a camada desta implementação. Verifica igualdade do conteúdo anterior e do SVG antes de emitir o resultado. O manifesto distingue o conteúdo atualmente publicado (`source_current_sha256`) da base editorial (`source_base_sha256`).

## Publicação

Após revisão visual e funcional, registrar o manifesto revisado em `approved-output.json` e versionar as alterações. O nome desse arquivo indica aprovação técnica dos bytes; não concede autorização externa por si só.

```powershell
python scripts/open-pages/jornada-interativa/release.py snapshot --package C:/jornada-release/package --state C:/jornada-release/state
python scripts/open-pages/jornada-interativa/release.py publish --package C:/jornada-release/package --state C:/jornada-release/state
node scripts/open-pages/jornada-interativa/verify-browser.mjs C:/jornada-release/package C:/jornada-release/qa-live --live
```

A credencial é solicitada por entrada protegida, nunca por argumento. O snapshot preserva todos os objetos do prefixo e os metadados antes de qualquer escrita. Divergências entre origem, pacote, manifesto, inventário ou KV impedem a publicação. A imagem é gravada e conferida antes do HTML; uma imagem existente idêntica é reutilizada. Os bytes validados permanecem em memória durante a escrita.

Não há repetição automática de escrita. Em resposta incerta, executar `release.py verify` com o mesmo pacote e estado, examinar `events.jsonl` e reconciliar a origem antes de qualquer nova tentativa. Não restaurar cópias anteriores sem comparar o estado atual e preservar alterações posteriores.

A verificação compara o R2 com os bytes revisados, o HTML público normalizado com o R2, os arquivos auxiliares com suas cópias anteriores e os metadados públicos de compartilhamento e favicon com o snapshot. O QA no navegador confirma interação, ausência de transbordamento horizontal, alinhamento dos pontos, carregamento das imagens, abertura e download do PNG.

## Curadoria das explicações

Fonte: aba Apoio Textual, “Como Cada Nó Opera e por Que Estão Articulados”, da [jornada oficial](https://open.grupocsv.com/jornada-tea/), consultada em 09/09/2026.

| Pontos | Seções de referência |
|---|---|
| Rastreio e status quo | Rastreio Populacional; Definição de Status Quo |
| Pediatria e protocolo | Protocolo e Incentivo; Orquestração e Unidades Prestadoras |
| CCC e navegação | Orquestração e Unidades Prestadoras; Navegação Contínua |
| Auditoria e visualizador | Leitura Assistencial da Demanda; Visualizador Clínico |
| Cluster, M-CHAT e CARS | Estratificação 0 a 3; Onde os Instrumentos São Aplicados |
| AAD, entregas e destinos | Entregas do AAD; Quatro Destinos Combináveis; Natureza dos Três Atos Médicos |
| Terapias | Plano pactuado com a família; Experiência Reportada |
| CBDF e alça fechada | Natureza da CBDF; Alça Fechada |
| Códigos de demanda | Triagem por Código de Demanda |
| EVS | Escritório de Valor em Saúde |

As explicações novas usam “plano terapêutico” e não introduzem números de capacidade, metas clínicas ou regras assistenciais. Há divergências editoriais entre o handoff e a página recebida sobre siglas do plano e capacidade do AAD. A adaptação interativa preserva o texto e o desenho originais; uma correção editorial deve ser tratada separadamente, com fonte validada.

## Correção de rolagem — 09/09/2026

Removidos o limite de altura, a rolagem do contêiner e os controles que aumentavam a largura do desenho. O seletor de etapas não amplia mais o canvas: move apenas a página até a etapa e mostra sua explicação. Desenho e cabeçalho originais permanecem intactos. No celular, o seletor oferece acesso confortável às explicações quando os rótulos do mapa completo ficam pequenos; o percurso textual e a imagem integral continuam disponíveis.
