# Interação da Jornada TEA oficial

Camada independente para `https://open.grupocsv.com/jornada-tea/`. Mantém o HTML editorial, o SVG, o cabeçalho e o Apoio Textual da página recebida. Acrescenta explicações por etapa abaixo do mapa, seleção por teclado/toque e imagem completa para abrir ou baixar após acesso institucional. O mapa ocupa a largura disponível e acompanha a rolagem da página, sem área própria de rolagem. A ampliação fica disponível pelo zoom nativo do navegador ou pela imagem completa. O mapa fica disponível também no celular, com alternância para o percurso textual existente.

## Escopo

- JavaScript e CSS com prefixo `ji-`, sem React nem serviços do portal CLAVS. O acesso institucional é exigido pelo Worker antes de entregar HTML, imagens e demais objetos do prefixo; não é responsabilidade desta camada visual.
- Os 30 pontos usam as coordenadas do mapa validado no portal CLAVS; suas explicações foram revisadas contra o Apoio Textual da página oficial.
- JSON inválido, estrutura incompatível ou ausência da camada preservam o conteúdo original.
- Publicação limitada a `jornada-tea/index.html` e ao PNG aprovado no R2 privado `csv-open-pages-tea-private`, servido pelo binding `TEA_CONTENT`. Não escreve em KV, Worker, DNS, no bucket compartilhado antigo ou em outras páginas.
- Git guarda código e manifesto dos bytes revisados. Capturas, cópias anteriores e evidências de execução ficam fora do repositório.

## Construção e verificação

Requer Python 3, Node.js e Playwright com Chromium instalado. Se necessário, informe a localização de um `package.json` cujo diretório resolva Playwright em `JORNADA_RUNTIME_PACKAGE` e um canal instalado em `JORNADA_BROWSER_CHANNEL`.

```powershell
python scripts/open-pages/jornada-interativa/build.py --input C:/jornada-release/origin/index.html --asset-directory C:/jornada-release/origin --output C:/jornada-release/package
node scripts/open-pages/jornada-interativa/verify-browser.mjs C:/jornada-release/package C:/jornada-release/qa-local
```

`--input` permite repetir a construção a partir de uma captura da origem por API autenticada. `--asset-directory` aponta o snapshot privado dos objetos de `jornada-tea/` e permite incorporar o selo local protegido. Não se tenta contornar o gate para baixar os objetos. O PNG é sempre renderizado do SVG capturado, com suas imagens incorporadas; não aceita uma imagem arbitrária. O arquivo recebe o prefixo do seu SHA-256 no nome.

A construção remove somente injeções reconhecidas do Worker e a camada desta implementação. Verifica igualdade do conteúdo anterior e do SVG antes de emitir o resultado. O manifesto distingue o conteúdo atualmente publicado (`source_current_sha256`) da base editorial (`source_base_sha256`).

## Publicação

Após revisão visual e funcional, registrar o manifesto revisado em `approved-output.json` e versionar as alterações. O nome desse arquivo indica aprovação técnica dos bytes; não concede autorização externa por si só.

```powershell
python scripts/open-pages/jornada-interativa/release.py snapshot --package C:/jornada-release/package --state C:/jornada-release/state
python scripts/open-pages/jornada-interativa/release.py publish --package C:/jornada-release/package --state C:/jornada-release/state
node scripts/open-pages/jornada-interativa/verify-browser.mjs C:/jornada-release/package C:/jornada-release/qa-live --live --storage-state C:/jornada-release/private-session.json
```

A credencial é solicitada por entrada protegida, nunca por argumento. O snapshot preserva todos os objetos do prefixo e os metadados antes de qualquer escrita. Antes da captura e da publicação, o script confirma que o bucket é privado, sem domínio R2 habilitado nem domínio customizado, e que o Worker aponta `TEA_CONTENT` para esse mesmo bucket. Snapshot do bucket antigo ou binding divergente impedem a operação. Divergências entre origem, pacote, manifesto, inventário ou KV também impedem a publicação. A imagem é gravada e conferida antes do HTML; uma imagem existente idêntica é reutilizada. Os bytes validados permanecem em memória durante a escrita.

Não há repetição automática de escrita. Em resposta incerta, executar `release.py verify` com o mesmo pacote e estado, examinar `events.jsonl` e reconciliar a origem antes de qualquer nova tentativa. Não restaurar cópias anteriores sem comparar o estado atual e preservar alterações posteriores.

A publicação exige primeiro o gate institucional ativo: GET e HEAD anônimos devem retornar 401, `X-TEA-Access: required` e `Cache-Control: no-store`, sem entregar o mapa. Respostas 200, 503, redirecionamentos e uma flag `auth_gate` isolada não comprovam proteção. A verificação compara os bytes reais de todos os objetos no R2 e confirma o bloqueio anônimo de todos eles, inclusive cópias anteriores. Não altera metadados KV, vínculos, Worker ou DNS.

O relatório `verified.json` separa origem conferida e bloqueio anônimo de `authenticated_browser_qa_required`: o QA em navegador com uma sessão institucional válida ainda é obrigatório. Esse estado de sessão é privado, fora do Git, e nunca deve aparecer nos logs. A suíte de navegador confirma interação, ausência de transbordamento, alinhamento dos pontos, carregamento das imagens, abertura e download do PNG. Não cria contas, não envia e-mails e não valida por si só todas as regras de permissão do provedor institucional.

Preferencialmente, use `--storage-state-stdin`: o executor autenticado passa o JSON de cookies diretamente ao subprocesso, só em memória, sem arquivo de sessão, argumento, variável de ambiente ou log. O modo aceita apenas os cookies institucionais seguros do domínio oficial. O executor deve encerrar a sessão no `finally`, inclusive se algum teste falhar.

O publicador não serve para instalar o gate ou migrar objetos. A ordem é: preservar a origem, copiar os prefixos para o bucket privado com integridade conferida, ativar o binding e o gate, neutralizar as cópias antigas públicas, executar snapshot/publicação da camada visual, validar acesso autorizado e anônimo. Migração e neutralização pertencem à entrega de acesso em `csv-open-pages`; esta camada nunca volta a publicar conteúdo no bucket compartilhado. Não reativar downloads públicos para simplificar uma publicação.

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

## Explicação abaixo do mapa — 21/09/2026

O balão flutuante foi removido. O hover e o foco apenas destacam a etapa; não selecionam, não movimentam a página e não cobrem outro trecho do desenho. Clique, toque, Enter ou espaço selecionam a etapa e levam à explicação, localizada após o mapa. O retorno leva o foco de volta à etapa. A seleção permanece após rolagem, Escape, clique fora, alternância do percurso textual e troca entre Diagrama/Apoio Textual.

O seletor superior atualiza a explicação sem deslocamento automático; o botão Ler explicação permite avançar quando a pessoa terminar de escolher. Mapa e explicação têm altura natural e nenhuma rolagem independente. O SVG, os textos, o cabeçalho, as imagens e os pontos de referência não foram redesenhados.

Validação local: Chromium em 320, 390, 768 e 1440 pixels, os 30 pontos em 390 pixels, amostra nas demais larguras, navegação por toque e teclado, hover sem deslocamento, persistência da seleção, foco, ausência de recortes, rolagem da página por roda/toque, imagem integral e download. Isso não substitui teste de produção autenticado ou em aparelhos físicos.

Contrato do publicador: `python -m unittest discover -s scripts/open-pages/jornada-interativa -p test_release.py`.

## QA autenticado e rolagem

O verificador aceita `--live --storage-state-stdin` para receber a sessão pela entrada padrão em memória. O chamador deve autenticar antes e revogar a sessão em `finally`; o verificador não imprime nem salva cookies. A entrada aceita somente os cookies institucionais seguros do host `open.grupocsv.com`, sem estado de outras origens.

Para testar localmente depois da proteção da origem, acrescente `--source-snapshot CAMINHO_PRIVADO` apontando para o snapshot do publicador. O runner confere tamanho e SHA-256 das imagens PNG e fontes OTF antes de servir essas fixtures em loopback ou atender suas URLs absolutas somente no contexto local. Não publica nem inclui esses arquivos no Git. O modo `--live` rejeita essa opção e lê exclusivamente a publicação real.

Após roda ou swipe, o teste aguarda a rolagem estabilizar. Para medir hover, posiciona primeiro uma etapa no viewport e move o mouse por coordenadas, sem usar o reposicionamento automático de `locator.hover`. A asserção de ausência de deslocamento continua estrita e registra as posições antes/depois. Esse cuidado separa a interação da página da inércia do gesto emulado e da rolagem do próprio executor.

## Revisão editorial ESC-TEA-100 — 22/09/2026

Somente com `--editorial-esc-tea`, `build.py` aplica antes da construção a transformação em `editorial_esc_tea.py`. Ela exige o SHA-256 exato da base editorial anterior, substituições únicas e reversão byte a byte. A origem atualmente publicada continua registrada separadamente em `source_current_sha256`, para o preflight detectar qualquer alteração concorrente no R2. O manifesto acrescenta o recibo das mudanças editoriais; a preservação da camada interativa continua obrigatória.

A revisão alinha SVG, percurso textual móvel, Apoio Textual e explicações: triagem por faixa etária, pré-clusterização apoiada pelo ESC-TEA-100 e revisão médica no AAD. A tabela anterior de faixas é substituída por síntese dos três componentes e link à metodologia. Não replica faixas, pesos ou novas regras clínicas, nem equipara cluster a nível diagnóstico de suporte. Capacidades, destinos, horas, proporções e critérios não envolvidos permanecem na fonte original.

```powershell
python scripts/open-pages/jornada-interativa/build.py --input ORIGEM_PRIVADA/index.html --asset-directory SNAPSHOT_PRIVADO/objects --output PACOTE_PRIVADO --editorial-esc-tea
python -m unittest discover -s scripts/open-pages/jornada-interativa -p 'test_*.py'
node scripts/open-pages/jornada-interativa/verify-browser.mjs PACOTE_PRIVADO QA_LOCAL --source-snapshot SNAPSHOT_PRIVADO
```

O SVG incorporado é a fonte do novo PNG de abertura e download, com nome derivado do hash. O PNG anterior permanece protegido e imutável, incluindo o destino histórico do redirecionamento do Hub; este publicador não altera o Worker do Hub. A revisão não usa os antigos scripts de download público para reconstruir uma página agora protegida.

Antes de publicar, validar os bytes finais em `approved-output.json`. O gate institucional e o bucket privado continuam sendo pré-requisitos; a revisão editorial não tem opção de contorná-los. O QA acrescenta a aferição dos rótulos SVG dentro de seus espaços, a remoção das equivalências antigas e o link à metodologia, além das regressões de interação e download já existentes.
