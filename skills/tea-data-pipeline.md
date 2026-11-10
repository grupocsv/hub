# Rito oficial — dados privados do Painel Terapias Especiais

Painel interno: `unimed/tea.html`
Cópia compartilhável: `https://hub.grupocsv.com/p/painel-tea/`
Pipeline: `scripts/build-tea-data.py`
Fonte funcional: `docs/_infra/prd-2026-07-painel-terapias-especiais.md`

## Arquitetura vigente

O repositório `grupocsv/hub` é público e contém apenas a aplicação cliente.
O JSON completo não é injetado no HTML, não é gravado em `unimed/data/` e não
é versionado. Ele é produzido fora de qualquer Git e enviado à camada privada
autenticada do painel.

O artefato privado mantém métricas exatas, inclusive grupos raros, nomes de
prestador e nomes de solicitante. Não há máscara `<5`, supressão nem agrupamento
`OUTROS`. Nome, matrícula, data de nascimento, guia e qualquer chave individual
de beneficiário continuam proibidos no JSON. A chave Nome + Nascimento existe
somente em memória para deduplicação.

## Insumos e destino

São obrigatórios:

1. diretório externo com exatamente 19 arquivos `.xlsx`, um por código de
   origem — o **período-base**, 2025/01 a 2026/06;
2. Matriz Analítica 2025 externa;
3. arquivo de saída `.json` em diretório privado fora de qualquer Git.

Para publicar competências posteriores a 2026/06, acrescente:

4. um ou mais **blocos complementares** (`--bloco`): planilhas consolidadas,
   com vários códigos na mesma aba e o mesmo cabeçalho de 19 colunas;
5. `--ate AAAA/MM`: a última competência fechada a publicar.

Os brutos ficam guardados no cofre privado (R2 `csv-dados-sensiveis`, prefixo
`unimed-tea/raw/`) e são restaurados para uma pasta privada a cada build:

    python scripts/tea-release.py cofre-listar
    python scripts/tea-release.py cofre-enviar <planilha.xlsx> --papel bloco
    python scripts/tea-release.py cofre-enviar-base <pasta-da-base> --matriz <matriz.xlsx>
    python scripts/tea-release.py cofre-restaurar <pasta-privada>

`cofre-restaurar` traz as 19 fontes e a Matriz para `<pasta>/base`, os blocos
vigentes para `<pasta>/blocos` com os nomes originais, confere o SHA-256 de
cada arquivo contra o manifesto e imprime o comando do build. A base guardada
não é sobrescrita por arquivo de mesmo nome e conteúdo diferente, e o cofre
recusa a vigésima fonte, uma segunda Matriz, conteúdo repetido e o mesmo
arquivo com outro papel. Planilha com o nome de um bloco vigente e outro
conteúdo só entra como substituição explícita (`--substitui`). Item enviado
por engano sai do uso com `cofre-retirar <nome> --motivo <texto>`; o objeto
continua guardado, e `cofre-listar` mostra a situação de cada arquivo (em
uso, bloco vigente, substituído, retirado, sem entrada no manifesto).

Exemplo de organização:

    C:\dev\GitHub\dados-brutos-te\
    C:\dev\dados-privados-te\tea-2025-2026.json

O pipeline resolve os caminhos reais e procura `.git` em todos os ancestrais.
Insumo, Matriz ou saída dentro de qualquer Git provocam aborto sem opção de
contorno. O diretório pai de `--saida` deve existir antes da execução.

## Comando de produção

    python scripts/build-tea-data.py "C:\dev\GitHub\dados-brutos-te\Análises Intensidade - Terapias Especiais" --matriz "C:\dev\GitHub\dados-brutos-te\Matriz_Analítica_Terapias_Especiais_2025.xlsx" --saida "C:\dev\dados-privados-te\tea-2025-2026.json" --corte 2026-06-30

Com competências novas:

    python scripts/build-tea-data.py "<base>" --matriz "<matriz>" --bloco "<Terapias_Especiais_072026_092026.xlsx>" --ate 2026/09 --saida "<privado>\tea.json"

O corte etário padrão é o último dia da última competência publicada.

### Base congelada e janela estendida

- O período-base é sempre construído e validado primeiro, pelo mesmo caminho
  de um build sem blocos: critérios de aceite e Matriz 2025.
- O conjunto de terapias é o da base. Uma terapia mantida sem lançamentos em
  uma competência nova aparece com zero; Método PECS — Fonoaudiologia continua
  fora, e os registros posteriores dele são contados no descarte.
- Fontes-base só contribuem com o período-base; blocos, só com competências
  posteriores. Bloco com competência da base, competência da janela sem
  registros, bloco inteiro além da janela, bloco inteiramente substituído por
  outro ou dois blocos com o mesmo nome abortam o build. Os caminhos dos
  blocos são validados antes da leitura da base.
- Competência presente em mais de um bloco fica com o bloco mais recente: o
  que começa no mesmo mês ou depois e termina depois — a planilha seguinte da
  série. Vale o intervalo inteiro de cada arquivo, inclusive além de `--ate`,
  para que o dono de um mês não mude quando a janela cresce. Os registros
  dessa competência nos demais blocos são cedidos (`registros_cedidos`,
  `competencias_cedidas`, `cedidas_a`): não são agregados nem servem de
  evidência. Quando o intervalo não diz qual é o mais recente (mesmo mês
  final, ou um arquivo que começa antes e termina depois do outro), o build
  para. A ordem dos blocos no comando não altera o JSON.
- Um bloco cobre meses seguidos: competência isolada, antes ou depois de uma
  lacuna, é linha com o mês digitado errado e para o build — ela mudaria o
  intervalo que decide qual planilha é a mais recente.
- O intervalo que decide é o **firme**: do primeiro ao último mês com pelo
  menos 5% das linhas do mês mais cheio da planilha. O mês recém-aberto da
  planilha seguinte (em geral 10% ou mais) conta; mês de borda abaixo de 5% —
  uma linha com o mês digitado errado, vizinho do começo ou do fim — continua
  sendo lido, mas não faz a planilha passar por mais recente, perde o mês
  para o bloco que o traz dentro do intervalo firme e sai apontado no
  relatório e em `borda_fraca`.
- Entre os blocos que trazem a competência dentro do intervalo firme, quem a
  traz **cheia** tem precedência sobre quem a traz parcial. Parcial é só o
  primeiro ou o último mês do intervalo firme, com menos de 25% das linhas do
  mês mais cheio da própria planilha: o mês começado no meio, ou ainda aberto
  quando ela foi extraída. A planilha seguinte, que repete esse mês fechado,
  fica com ele, tenha o mês novo dela passado ou não dos 5%. Mês do meio com
  pouco volume não é parcial: é dado da planilha (uma correção na origem, por
  exemplo), e a mais recente fica com ele. Quando é a planilha mais recente
  que cede o mês parcial a uma mais antiga, o manifesto registra
  (`parciais_cedidas`) e o relatório avisa: se a planilha nova corrige o mês,
  a correção não entrou.
- Registros de bloco além de `--ate` não são agregados nem servem de
  evidência de data de nascimento. Continuam lidos por inteiro: entram na
  varredura anti-vazamento, e uma linha inválida neles também para o build.
- Competência nova com menos de 25% das sessões de um mês recente da base
  (mediana dos seis últimos) não é publicada: é faturamento ainda entrando ou
  competência digitada errada. Entre 25% e 75% o build passa e o relatório
  avisa ("Volume AAAA/MM"): cabe ao operador confirmar se a competência está
  fechada.
- Depois de estender a janela, todo recorte fechado da base precisa sair
  idêntico ao do build só-base feito com o mesmo corte etário
  (`exigir_base_inalterada`); mudam apenas o período completo e o ano em
  curso. A faixa etária acompanha o corte etário: de um release para o
  seguinte ela muda em todos os recortes, e só ela.
- Registro de bloco sem data de nascimento: a data é recuperada quando a mesma
  matrícula e o mesmo nome têm uma única data em outro registro da base ou de
  bloco em competência até a do próprio registro — nunca de competência
  posterior, para que um mês não dependa dos seguintes; caso
  contrário o registro fica fora do painel, contado em
  `meta.blocos_fonte[].sem_nascimento` e declarado em Método e Fontes. Acima da
  tolerância (5 registros ou 0,2% dos registros do bloco na janela, o que for
  maior) o build para. Célula com dígitos que não forma data válida não é
  "ausente": para o build.
- Fechamento por bloco: registros lidos na janela = agregados + de terapia
  descartada + sem data de nascimento fora do painel
  (`registros_agregados`, `registros_terapia_descartada`). O relatório traz
  também os totais lidos da planilha por competência (`totais_lidos`), para
  conferência com o total informado pela origem, e o descarte por terapia em
  sessões e reais (`sessoes_pos_base`, `pagamento_pos_base`).
- Continuidade: em cada competência nova, ao menos metade das crianças tem de
  já ter aparecido antes; abaixo disso o build para, porque nome ou
  nascimento vieram em outro formato e as mesmas crianças contariam como
  novas. Criança nova que só difere de uma já vista por caixa, acento ou
  espaços continua contada como nova (regra Nome + Nascimento) e é informada
  em `meta.competencias_novas[].grafia_divergente`; acima de 5 crianças ou 1%
  do mês, o build para.
- Terapias mantidas sem lançamento em uma competência nova são listadas em
  `meta.competencias_novas[].terapias_sem_lancamento`. Disciplina sem nenhum
  lançamento no mês sai dos cortes por disciplina daquele recorte; o painel
  mostra o escopo vazio.
- A leitura percorre a aba inteira mesmo quando a dimensão declarada no xlsx
  é menor que a área usada.
- Mensagens de erro descrevem o formato da célula (`99/99/9999`), nunca o
  conteúdo, e indicam arquivo e linha.

O build real:

- exige as 19 fontes e os 19 códigos esperados;
- localiza a aba pelo cabeçalho `Ano/Mês` e valida o schema literal de 19
  colunas;
- restringe o universo à janela publicada (2025/01–2026/06 sem blocos);
- mede cobertura e descarta programaticamente apenas Método PECS —
  Fonoaudiologia;
- integra o código 50000519 à ABA — Psicologia somente para PEDIAKIDS;
- consolida o par de CNPJ definido no PRD;
- reconcilia `Resumo_Executivo`, `Mensal` e `Rede_por_Terapia` da Matriz 2025;
- valida todos os números de aceite antes da escrita;
- varre chaves e valores para impedir identificadores de beneficiário;
- grava atomicamente apenas o arquivo indicado por `--saida`.

## Critérios bloqueantes

- 19 fontes;
- 17 terapias mantidas;
- Método PECS — Fonoaudiologia descartado por cobertura 13/18;
- 1.416 crianças únicas por Nome + Data de Nascimento;
- 161 nomes de prestador nas fontes;
- 160 prestadores após a consolidação do par de CNPJ;
- 81.217 sessões;
- R$ 13.919.882,74;
- Matriz 2025 reconciliada em 2.247 campos;
- 30 recortes de período na base: tudo, ano, semestre, trimestre e mês; com a
  janela estendida, um recorte por período da janela (35 até 2026/09);
- nenhum identificador individual de beneficiário no JSON.

Os números acima são do período-base e continuam exigidos em todo build, com
ou sem blocos.

## Contrato privado

O JSON mantém:

    meta
      periodo_canonico      janela publicada
      periodo_base          2025/01 a 2026/06
      blocos_fonte          manifesto dos blocos complementares (vazio na base)
      competencias_novas    por competência pós-base: crianças, já vistas,
                            grafia divergente, terapias sem lançamento
      periodos
      terapias
      terapias_descartadas
      contagens
      manifesto_fontes
      excecao_at
      matriz_2025
    recortes
      tudo
      ano-AAAA
      semestre-AAAA-Sn
      trimestre-AAAA-Tn
      mes-AAAA-MM

Cada recorte contém resumo, série mensal, terapias, prestadores, série por
prestador, linhas de cuidado, canais, solicitantes e perfil agregado dos
pacientes. Prestadores, solicitantes, combinações e métricas aparecem de forma
individual e exata. Rótulos de prestador e solicitante seguem `dNome`: CAIXA
ALTA sem acento.

Não existe manifesto público de dados. Se a aplicação cliente precisar de
configuração estática, a lista permitida é somente versão de contrato e URL do
endpoint autenticado; métricas, nomes, hashes de fonte e recortes são proibidos.

## Testes locais

    python -m py_compile scripts/build-tea-data.py scripts/check-tea-artifacts.py
    python scripts/build-tea-data.py --selftest
    python scripts/check-tea-artifacts.py --root .

O selftest cria 19 fontes e uma Matriz sintética fora do repositório. Ele cobre
schema/aba, cobertura e descarte, exceção AT, deduplicação, consolidação de
CNPJ, métricas raras exatas, anti-vazamento, 30 períodos, pagamento zero,
reconciliação e bloqueio de entrada/saída dentro de Git. Cobre também a janela
estendida com blocos sintéticos: 35 e 39 recortes, 28 recortes fechados
idênticos, terapia e disciplina sem movimento, criança e prestador novos,
nascimento em texto, nascimento ausente (recuperado, fora do painel,
ambíguo, tolerância), competência além da janela, fechamento por bloco,
continuidade e grafia, dimensão declarada truncada, guardas de bloco,
critérios de aceite exigidos no build com bloco, linha de comando, relatório
montado antes da gravação e mensagens de erro sem conteúdo de célula. Ao fim,
roda o autoteste de `scripts/tea-release.py`, com a rede simulada.

O checker público exige a ausência de
`unimed/data/tea-2025-2026.json`, do bloco `tea-data` e de qualquer payload com
`recortes` nos dois HTML. Se os marcadores legados forem mantidos como ponto de
referência, só podem conter espaço em branco ou comentário, nunca dados. O
checker também preserva `noindex`, `hub-auth` no painel interno e o gate da
cópia `/p/`.

## Regeneração da cópia `/p/`

Depois que `unimed/tea.html` estiver sem payload e configurado para buscar o
endpoint autenticado:

    python scripts/build-tea-data.py --emit-p

O comando copia somente a aplicação cliente, remove `hub-auth` da variante
compartilhável, preserva o gate vigente e mantém `noindex, nofollow`. Ele aborta
se ainda encontrar um bloco `tea-data` no HTML interno.

Antes do deploy, revisar o diff e executar o checker. O JSON privado é publicado
fora do Git pelo rito da infraestrutura autenticada; nunca deve ser adicionado
ao commit, anexado ao PR ou servido como arquivo estático.

## Release

`scripts/tea-release.py` conduz a publicação do JSON privado (credenciais pelo
ambiente: `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN`, ou `--token-file`):

    python scripts/tea-release.py ponteiro
    python scripts/tea-release.py baixar <SHA-no-ar> <privado>/no-ar.json
    python scripts/build-tea-data.py <base> --matriz <matriz> [--bloco <xlsx> --ate <fim no ar>] --corte <corte no ar> --saida <privado>/conferencia.json
    python scripts/tea-release.py comparar <privado>/no-ar.json <privado>/conferencia.json --exigir-fechados-inalterados
    python scripts/tea-release.py comparar <privado>/no-ar.json <privado>/tea.json --exigir-fechados-inalterados
    python scripts/tea-release.py enviar <privado>/tea.json
    python scripts/tea-release.py sql <privado>/tea.json --anterior-sha <SHA-no-ar>
    python scripts/tea-release.py verificar <SHA-novo> --ponteiro <sha256 do SELECT>
    python scripts/tea-release.py registrar <privado>/tea.json --anterior-sha <SHA-no-ar>
    python scripts/tea-release.py historico

- `ponteiro` imprime o `SELECT` que mostra, no D1 `csv-hub`, o release no ar.
- `baixar` grava o release e informa os blocos que o montaram, a janela e o
  corte etário dele. O build
  de conferência usa os insumos atuais nessa janela e nesse corte e tem de
  reproduzir o release no ar por inteiro: com janela e corte iguais, qualquer
  diferença é mês já publicado que chegou diferente.
- `comparar` mostra recortes fechados idênticos, os que mudaram só na faixa
  etária (apenas quando o corte etário mudou), os ampliados, os novos e, se
  houver, os **alterados** — algo já apresentado mudou e precisa ser
  entendido antes de publicar. Com `--exigir-fechados-inalterados`, sai com
  erro nesse caso.
- `enviar` grava `releases/<SHA-256 em maiúsculas>.json` e confere por
  releitura. O painel só muda na troca do ponteiro.
- `sql` imprime o `UPDATE` condicional ao SHA no ar (precisa alterar
  exatamente uma linha) e o `SELECT` de conferência.
- `verificar` só aprova com o objeto íntegro, o serviço no ar, o dado fechado
  para quem não tem sessão e o ponteiro conferido — pelo `sha256` devolvido
  pelo `SELECT` (`--ponteiro`) ou pelo teste autenticado (`--sessao-file`).
- `registrar` anota a ativação em `releases/historico.json`; `historico`
  lista a sequência, de onde sai o SHA para desfazer uma publicação.
- Segredos vêm de arquivo fora de Git ou do ambiente, nunca da linha de
  comando; arquivo de token com mais de uma linha é recusado sem eco.

O painel no ar precisa aceitar a janela nova **antes** da troca do ponteiro: o
contrato de boot do cliente é estrutural desde a versão 5.1 do pipeline.
