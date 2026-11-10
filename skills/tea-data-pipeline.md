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
    python scripts/tea-release.py cofre-baixar unimed-tea/raw/base/2025-01_2026-06/ <pasta>
    python scripts/tea-release.py cofre-enviar <planilha.xlsx> --papel bloco

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
  posteriores. Bloco com competência da base, competência repetida em dois
  blocos, competência da janela sem registros ou dois blocos com o mesmo nome
  abortam o build.
- Depois de estender a janela, todo recorte fechado da base precisa sair
  idêntico ao do build só-base (`exigir_base_inalterada`); mudam apenas o
  período completo e o ano em curso.
- Registro de bloco sem data de nascimento: a data é recuperada quando a mesma
  matrícula e o mesmo nome têm uma única data em outro registro; caso
  contrário o registro fica fora do painel, contado em
  `meta.blocos_fonte[].sem_nascimento` e declarado em Método e Fontes. Acima da
  tolerância (5 registros ou 0,2% do bloco, o que for maior) o build para.
- Mensagens de erro descrevem o formato da célula (`99/99/9999`), nunca o
  conteúdo.

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
estendida com um bloco sintético: 35 recortes, 28 recortes fechados idênticos,
terapia sem movimento zerada, criança e prestador novos, nascimento em texto,
nascimento ausente (recuperado e fora do painel), competência além da janela,
guardas de bloco e mensagens de erro sem conteúdo de célula.

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

    python scripts/tea-release.py baixar <SHA-vigente> <privado>/vigente.json
    python scripts/tea-release.py comparar <privado>/vigente.json <privado>/tea.json
    python scripts/tea-release.py enviar <privado>/tea.json
    python scripts/tea-release.py sql <privado>/tea.json --anterior-sha <SHA-vigente>
    python scripts/tea-release.py registrar <privado>/tea.json --anterior-sha <SHA-vigente>
    python scripts/tea-release.py verificar <SHA-novo>

- `comparar` mostra recortes fechados idênticos, os que mudaram só na faixa
  etária (corte etário novo), os ampliados, os novos e, se houver, os
  **alterados** — reapresentação de dados que precisa ser entendida antes de
  publicar.
- `enviar` grava `releases/<SHA-256 em maiúsculas>.json` e confere por
  releitura. O painel só muda na troca do ponteiro.
- `sql` imprime o `UPDATE` condicional ao SHA vigente (precisa alterar
  exatamente uma linha) e o `SELECT` de conferência, para execução no D1
  `csv-hub`. O rollback é o mesmo `UPDATE` com os valores anteriores.
- `registrar` anota a ativação em `releases/historico.json`.

O painel no ar precisa aceitar a janela nova **antes** da troca do ponteiro: o
contrato de boot do cliente é estrutural desde a versão 5.1 do pipeline.
