# PRD v5.1 — Painel Terapias Especiais · Atualização por Competência

**Complementa:** `prd-2026-07-painel-v5-consolidacao.md` (v5) e os PRDs v3 e v4, vigentes no que este documento não altera.
**Motivação:** o painel nasceu com um período fixo (jan/2025 a jun/2026). A operação segue faturando todo mês, e o painel precisa acompanhar: chega uma planilha com as competências novas e o painel passa a mostrá-las, sem refazer o que já foi auditado.
**Data:** Novembro de 2026 · **Autor:** Grupo CSV / EVS · AxiaCare

---

## 1. Princípio

> **A base auditada não se mexe; o que chega depois entra por cima.**

O período-base (2025/01 a 2026/06) é o que foi conferido com a Matriz Analítica 2025 e validado pelos critérios de aceite. Ele fica congelado. As competências seguintes chegam em **blocos complementares** e apenas estendem a janela publicada.

## 2. Decisões

| # | Decisão | Razão |
|---|---|---|
| D1 | **Período-base congelado.** As 19 fontes e a Matriz 2025 continuam sendo lidas e validadas em todo build, pelo mesmo caminho de sempre. | Os números de aceite (1.416 crianças, 81.217 sessões, R$ 13.919.882,74) deixam de depender de memória: são exigidos a cada publicação. |
| D2 | **Blocos complementares** (`--bloco`): planilhas consolidadas, com vários códigos na mesma aba e o cabeçalho padrão de 19 colunas, apenas com competências posteriores a 2026/06. Competência presente em dois blocos fica com o que vai mais longe no tempo, em qualquer ordem de comando; os registros cedidos são contados e declarados, e dois blocos que terminam no mesmo mês e repetem uma competência param o build. | É o formato em que a operadora entrega as competências novas, e a planilha seguinte costuma repetir o último mês da anterior, ainda aberto quando ela foi extraída. |
| D3 | **Janela publicada explícita** (`--ate AAAA/MM`): a última competência **fechada**. Registros além dela não são agregados nem influenciam os meses publicados; continuam lidos por inteiro, para a varredura anti-vazamento. | Competência ainda em faturamento distorce o mês mais recente. |
| D4 | **Conjunto de terapias congelado na base** (17 terapias). Terapia mantida sem lançamento em uma competência nova aparece com zero. Método PECS — Fonoaudiologia segue fora; seus registros posteriores são contados no descarte. | Reavaliar a cobertura a cada mês faria terapias de baixo volume entrarem e saírem de toda a série histórica. |
| D5 | **Períodos fechados não mudam em silêncio.** Na base, isso é imposto: depois de estender a janela, todo recorte que não recebeu competência nova precisa sair idêntico ao do build só-base, ou o build para. Mudam o período completo e o ano em curso. Mês novo já publicado que venha diferente em uma planilha posterior é apontado na comparação com o release no ar, antes de publicar; e um build de conferência, com os insumos atuais na janela e no corte do release no ar, tem de reproduzi-lo por inteiro — com janela e corte iguais, qualquer diferença, inclusive de faixa etária, é mês já publicado que chegou diferente. | Um número já apresentado não pode se alterar sem que alguém veja e decida. |
| D6 | **Corte etário** = último dia da última competência publicada (antes: 30/06/2026 fixo). Consequência declarada em Método e Fontes: a faixa etária é recalculada a cada atualização, em todos os períodos — é a única medida de um período fechado que se move. | Mantém a regra original — idade na data de corte do painel — conforme a janela cresce. |
| D7 | **Registro sem data de nascimento** em bloco: a data é recuperada quando a mesma matrícula e o mesmo nome têm uma única data em outro registro da base ou de competência até a do próprio registro (nunca de competência posterior: um mês não depende dos seguintes); se não, o registro fica fora do painel, contado e declarado em Método e Fontes. Tolerância: 5 registros ou 0,2% dos registros do bloco na janela, o que for maior; acima disso o build para. Data ilegível não é data ausente: para o build. | Sem a data não há chave de paciente (Nome + Nascimento). Um cadastro incompleto não pode travar a atualização, e um problema em volume não pode passar. |
| D8 | **Mensagens de erro sem conteúdo de célula**: descrevem o formato (`99/99/9999`), nunca o valor, e indicam arquivo e linha. | O pipeline passa a rodar também em sessões assistidas; erro não pode carregar nome ou nascimento. |
| D9 | **Cliente com contrato estrutural**: o painel aceita qualquer número de recortes, desde que cada período declarado tenha o seu. Textos fixos de período saem do HTML. | O cliente precisa estar no ar antes dos dados novos e não pode exigir "30 recortes". |
| D10 | **Cofre dos brutos** no bucket privado `csv-dados-sensiveis` (`unimed-tea/raw/`), como o PRD v2 já previa, e **release com histórico** (`releases/historico.json`). A base entra no cofre depois de conferida contra o release no ar e não é sobrescrita; o cofre recusa a vigésima fonte, uma segunda Matriz e conteúdo repetido, e item enviado por engano sai do uso sem ser apagado (`cofre-retirar`). | Atualizar deixa de depender de onde a planilha foi parar; desfazer uma publicação é uma troca de ponteiro. |
| D11 | **Continuidade das crianças.** Em cada competência nova, ao menos metade das crianças tem de já ter aparecido antes; abaixo disso o build para. Criança nova que só difere de uma já vista por caixa, acento ou espaços no nome segue contada como nova e é informada; acima de 5 crianças ou 1% do mês, o build para. | A chave Nome + Nascimento não aproxima grafia. Se a planilha nova vier com os nomes em outro formato, as mesmas crianças contariam como novas e o total de crianças únicas dobraria com todas as validações verdes. |
| D12 | **Fechamento por bloco e totais de controle.** Registros lidos na janela = agregados + de terapia descartada + sem data de nascimento; os totais lidos da planilha, por competência, saem no relatório para conferência com o total da origem. Terapias sem lançamento em competência nova são listadas e declaradas. | A base tem a Matriz e os números de aceite; o bloco precisava de conferência equivalente. |
| D13 | **Escopo vazio no painel.** Disciplina selecionada sem lançamento no período mostra zero e aviso — nunca os números da rede. Na aba Prestadores, o pagamento, a concentração e o fora de faixa do escopo por disciplina são medidos sobre o total da disciplina. | Com meses novos, uma disciplina de baixo volume pode ficar um mês sem registro; e o indicador do escopo precisa usar o denominador do escopo. |

## 3. O que o painel passa a mostrar

- Seletor com as competências novas, o trimestre correspondente e os períodos parciais identificados ("2º semestre de 2026 · parcial (3 de 6 meses)").
- Comparações só entre períodos de mesma duração; parcial usa a comparação interna por metades (regra já vigente).
- Método e Fontes: período publicado e período-base; cada bloco complementar com arquivo, registros, competências e SHA-256; registros sem data de nascimento, quando houver; motivo do descarte de PECS referido ao período-base.
- Cabeçalho: o período aparece uma vez — no seletor, com as datas e o marcador de período parcial ao lado. Título, escopo, volta ao Hub e sessão nunca se sobrepõem nem são cortados: quando a largura não comporta tudo em uma linha, o seletor ocupa a seguinte (até 1919 px na página interna; até 1499 px na cópia compartilhável), e em celular e tablet o escopo e a sessão descem para a segunda linha. A largura decide; trocar de período não muda o seletor de lugar.

## 4. Critérios de aceite

1. Build sem blocos reproduz o release do período-base: todos os recortes idênticos.
2. Build com blocos: critérios de aceite da base aprovados, Matriz 2025 reconciliada e todos os recortes fechados idênticos aos do build só-base.
3. Soma de registros das competências novas = registros lidos da planilha na janela menos o que o relatório declara fora (terapia descartada e sem data de nascimento) — conferido pelo próprio build; os totais lidos por competência conferem com o total da origem.
4. Painel abre com o release anterior e com o novo, em computador e celular, sem erro de console.
5. Nenhum identificador de beneficiário no JSON, no relatório do build ou em mensagem de erro.
6. Antes de publicar, o build de conferência (insumos atuais, janela e corte do release no ar) reproduz o release no ar: todos os recortes idênticos.

## 5. Fora do escopo

- Revisão da regra de descarte por cobertura e do conjunto de terapias.
- Serviço próprio com banco de dados e página de envio de planilha (próxima etapa do produto).

Rito operacional: `skills/painel-tea-ingestao/SKILL.md`. Regras e contrato: `skills/tea-data-pipeline.md`.
