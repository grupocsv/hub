---
name: painel-tea-ingestao
description: Atualiza o Painel Terapias Especiais (Painel TEA) da Unimed Governador Valadares a partir de uma planilha nova de competências. Use sempre que o usuário enviar uma planilha de terapias especiais (por exemplo Terapias_Especiais_072026_092026.xlsx) ou pedir para atualizar o painel TEA, publicar o mês novo, incluir competências, refazer o release ou desfazer uma publicação do painel. Cobre o caminho inteiro — guardar a planilha no cofre privado, gerar o JSON com o pipeline oficial, comparar com o release no ar, publicar, verificar e relatar — sem expor dado de beneficiário.
---

# Painel TEA — da planilha ao painel atualizado

O usuário manda uma planilha; o painel em `hub.grupocsv.com/unimed/tea.html`
(e a cópia `/p/painel-tea/`) passa a mostrar as competências novas. Tudo o que
segue existe para que isso aconteça sem atrito e sem número errado.

## Como o produto funciona

- **Período-base (2025/01 a 2026/06), congelado.** São 19 planilhas, uma por
  código, mais a Matriz Analítica 2025. Definem as 17 terapias e os números de
  aceite (1.416 crianças, 81.217 sessões, R$ 13.919.882,74). O pipeline refaz e
  confere a base em todo build.
- **Blocos complementares.** Planilhas consolidadas com as competências
  seguintes (vários códigos na mesma aba `Desembolso`, mesmo cabeçalho de 19
  colunas). É o que o usuário manda no dia a dia.
- **Pipeline** `scripts/build-tea-data.py` → JSON privado → **release**
  imutável `releases/<SHA-256>.json` no bucket `unimed-te-data-private` → o
  serviço `unimed-te-data` entrega o release apontado pela linha
  `painel-tea` da tabela `tea_panel_releases` (D1 `csv-hub`).
- **Cofre** dos brutos: bucket privado `csv-dados-sensiveis`, prefixo
  `unimed-tea/raw/` (`base/2025-01_2026-06/`, `blocos/`, `manifesto.json`).

Regras e contrato de dados: `skills/tea-data-pipeline.md`. Decisões:
`docs/_infra/prd-2026-11-painel-atualizacao-por-competencia.md`.

## Conduta com os dados

As planilhas trazem nome, nascimento, matrícula e guia de crianças.

- O bruto vive só no cofre e, durante o trabalho, em uma pasta privada fora de
  qualquer Git (`~/tea-privado`, modo 700). O repositório `grupocsv/hub` é
  público: nada de bruto nem de JSON privado nele — o pipeline e a ferramenta
  de release abortam se tentarem.
- **O bruto não se edita.** Se a planilha precisa de correção, a correção é na
  origem; aqui ela entra como chegou.
- Nunca escreva nome, nascimento, matrícula ou guia em mensagem, log, commit,
  PR ou relatório. Diagnósticos mostram contagens, competências, códigos e o
  **formato** da célula (`99/99/9999`), nunca o conteúdo.
- Execute com `python3 -I` todo script que abre planilha recebida.
- Segredos nunca passam pela linha de comando. O token do Cloudflare fica em
  arquivo modo 600 fora de Git, com uma única linha (só o token, sem rótulo).
  Está no Arsenal Técnico (Notion) como "Cloudflare Workers Token (Manus)" e
  precisa de R2 com escrita. Não grave token em script.

## Preparação

Trabalhe em um clone do repositório `grupocsv/hub`: o pipeline e a ferramenta
de release estão em `scripts/`.

```bash
python3 -m pip install -q openpyxl==3.1.5
install -d -m 700 ~/tea-privado ~/tea-privado/trabalho ~/tea-privado/chegada
# token: ~/tea-privado/.cf-r2 (modo 600, uma linha), obtido do Arsenal
```

Se `python3 -I` não encontrar o `openpyxl` depois da instalação (pip gravou no
site do usuário), crie um ambiente em `~/tea-privado/venv` e use o Python
dele; não retire o `-I`.

O estado do shell não acompanha de uma chamada para a outra. **Comece cada
bloco de comandos** com:

```bash
export CLOUDFLARE_ACCOUNT_ID=da0c29123f448f3c3892f784cd9f7cac
TR="python3 scripts/tea-release.py --token-file $HOME/tea-privado/.cf-r2"
```

## Passo a passo

1. **Guardar a planilha nova.** Copie-a para `~/tea-privado/chegada/` e envie
   ao cofre:

   ```bash
   $TR cofre-listar
   $TR cofre-enviar ~/tea-privado/chegada/<planilha.xlsx> --papel bloco
   ```

   Se ela **substitui** um bloco vigente — cobre as mesmas competências e
   mais, como `072026_102026` no lugar de `072026_092026` — acrescente
   `--substitui <nome original do bloco antigo>`. Se cobre competências
   novas, é um bloco adicional, mesmo que repita o último mês do bloco
   anterior: quando a mesma competência vem em dois blocos, vale a da
   planilha que vai mais longe no tempo, e o relatório diz quais competências
   foram cedidas. Planilha com meses até 2026/06 não tem encaixe: peça à
   origem a planilha a partir de 2026/07.

2. **Restaurar os insumos.**

   ```bash
   $TR cofre-restaurar ~/tea-privado/trabalho
   ```

   Traz as 19 fontes e a Matriz para `trabalho/base/`, os blocos vigentes para
   `trabalho/blocos/` (com os nomes originais, hashes conferidos) e imprime o
   comando do build. A ordem dos blocos no comando não muda o resultado.
   Se disser que a base não está completa, veja "Primeira vez" no fim.

3. **Decidir a última competência a publicar (`--ate`).** Publique só
   competência fechada. Queda forte de volume no último mês da planilha
   costuma ser faturamento ainda entrando: publique até o mês anterior e diga
   isso ao usuário. Em dúvida real, pergunte qual é a última competência
   fechada.

4. **Gerar o JSON** com o comando impresso no passo 2, ajustando `--ate`:

   ```bash
   python3 -I scripts/build-tea-data.py ~/tea-privado/trabalho/base \
     --matriz ~/tea-privado/trabalho/base/<Matriz>.xlsx \
     --bloco ~/tea-privado/trabalho/blocos/<planilha>.xlsx \
     --ate AAAA/MM --saida ~/tea-privado/trabalho/tea.json
   ```

   Leia o relatório inteiro antes de seguir:
   - **Lido da planilha, por competência** (registros, sessões, pagamento):
     confira com o total que a origem informa para a planilha ou com a soma
     das colunas feita por outro meio. Diferença aqui é planilha lida pela
     metade ou arquivo errado.
   - **Fechamento do bloco**: lidos = agregados + terapia descartada + sem
     data de nascimento. O descarte e os registros sem data saem também em
     sessões e em reais, para fechar a conta em qualquer unidade.
   - **Competências cedidas**: meses que um bloco mais antigo deixou para o
     mais recente. Confira se é o que se esperava.
   - **Crianças já vistas antes**, por competência nova: o normal é ficar
     acima de 85%. Valor baixo indica nome ou nascimento em outro formato.
   - **Sem lançamento**: terapias do painel sem registro no mês — aparecem
     com zero. Se o mês é o último, pode ser faturamento atrasado.
   - **Base conferida** e **recortes fechados idênticos**.

5. **Comparar com o release no ar.** Duas conferências, nesta ordem.

   ```bash
   $TR ponteiro          # imprime o SELECT; execute no D1 csv-hub e anote o sha256
   $TR baixar <SHA-no-ar> ~/tea-privado/trabalho/no-ar.json   # informa janela e corte
   ```

   **a) O que já está no ar se reproduz.** Gere um build de conferência com
   os insumos de agora, na janela e no corte do release no ar. O `baixar`
   imprime as opções: se o release vai só até 2026/06, sem `--bloco`; senão,
   só com os blocos que têm competência até o fim dele.

   ```bash
   python3 -I scripts/build-tea-data.py ~/tea-privado/trabalho/base \
     --matriz ~/tea-privado/trabalho/base/<Matriz>.xlsx \
     --bloco ~/tea-privado/trabalho/blocos/<planilha>.xlsx --ate <fim no ar> \
     --corte <corte no ar> --saida ~/tea-privado/trabalho/conferencia.json
   $TR comparar ~/tea-privado/trabalho/no-ar.json \
       ~/tea-privado/trabalho/conferencia.json --exigir-fechados-inalterados
   ```

   Todos os recortes têm de sair **idênticos**. Com janela e corte iguais não
   existe diferença legítima: qualquer uma, inclusive de faixa etária, quer
   dizer que um mês já publicado chegou diferente — planilha que substitui a
   anterior, ou mês cedido a uma planilha mais recente, com outro valor ou
   outra data de nascimento. Explique ao usuário o que mudou e só siga com o
   aceite dele.

   **b) O release novo só acrescenta.**

   ```bash
   $TR comparar ~/tea-privado/trabalho/no-ar.json ~/tea-privado/trabalho/tea.json \
       --exigir-fechados-inalterados
   ```

   O esperado: recortes fechados idênticos ou "idênticos exceto faixa etária"
   (a faixa etária é recalculada na data de corte nova), o período completo,
   o ano e os períodos parciais em curso como ampliados, e os recortes novos.
   Se o comando falhar por **recorte fechado alterado**, ou um mês sair com a
   marca `ALTERADA`, algo já apresentado mudou. Explique ao usuário o que
   mudou e só publique com o aceite dele.

6. **Publicar.**

   ```bash
   $TR enviar ~/tea-privado/trabalho/tea.json
   $TR sql ~/tea-privado/trabalho/tea.json --anterior-sha <SHA-no-ar>
   ```

   Execute o `UPDATE` impresso no D1 `csv-hub` (ferramenta de D1 disponível na
   sessão) e confirme que alterou **exatamente uma linha**. Rode o `SELECT`
   de conferência e passe o `sha256` devolvido para a verificação:

   ```bash
   $TR verificar <SHA-novo> --ponteiro <sha256 devolvido pelo SELECT>
   $TR registrar ~/tea-privado/trabalho/tea.json --anterior-sha <SHA-no-ar> --nota "<o que entrou>"
   ```

   `verificar` só aprova com o objeto íntegro, o serviço no ar, o dado
   fechado para quem não tem sessão e o ponteiro no release novo.

7. **Conferir no ar e relatar.** Abra o painel real e veja o período completo
   com a data final nova. Conte ao usuário, em poucas linhas: até que
   competência o painel vai, os números das competências novas, o que ficou
   fora e por quê, terapias sem lançamento e qualquer movimento que mereça
   atenção. Informe o SHA novo e o anterior. Registre a publicação no Agent
   Context Bridge.

8. **Limpar.** Apague `~/tea-privado` ao terminar; o cofre guarda o que é
   preciso para a próxima vez.

## Quando o pipeline para

| Mensagem | O que significa | O que fazer |
|---|---|---|
| `schema divergente` / `esperado um único cabeçalho 'Ano/Mês'` | A planilha não tem as 19 colunas esperadas | Conferir se é a aba certa; pedir a planilha no formato padrão |
| `código fora do catálogo` | Apareceu um procedimento novo | Ver o código na linha indicada (pasta privada); decisão de produto: avisar o usuário, não mapear por conta própria |
| `Tipo Prestador desconhecido` | Canal novo na origem | Idem: o mapa de canais é auditável, muda por decisão |
| `bloco complementar contém competência do período-base` | A planilha traz meses até 2026/06 | Pedir à origem a planilha a partir de 2026/07; a base não muda por bloco |
| `todas as competências do bloco vêm também de um bloco mais recente` | Um bloco foi inteiramente substituído por outro | Retirar o bloco antigo do comando e do cofre (`cofre-retirar <nome> --motivo …`), para o próximo `cofre-restaurar` não trazê-lo |
| `os blocos trazem a competência … e terminam no mesmo mês` | Dois arquivos repetem um mês e nenhum vai mais longe: não há como saber qual é o mais recente | Ficar com um deles e tirar o outro do comando e do cofre (`cofre-retirar`); se os dois são necessários, pedir à origem uma planilha única |
| `sem registros em nenhum bloco` | `--ate` passa do que as planilhas trazem | Corrigir o `--ate` |
| `nenhuma competência do bloco está na janela publicada` | Um bloco inteiro é posterior ao `--ate` | Retirar o bloco do comando ou avançar o `--ate` |
| `registros sem data de nascimento … acima da tolerância` | Problema de cadastro em volume | Devolver à origem; não contornar |
| `Data Nascimento inválida (formato …)` | Célula com data ilegível, mesmo em mês ainda não publicado | Correção na origem |
| `já apareciam em competências anteriores` | Menos da metade das crianças do mês é conhecida: nome ou nascimento vieram em outro formato | Não publicar; pedir a planilha no formato da base |
| `só diferem de crianças já vistas` | Muitos nomes mudaram só em caixa, acento ou espaços | Idem: a grafia mudou na origem |
| `não fecham com agregados` | Defeito de contagem | Parar e investigar |
| `anti-vazamento bloqueou presença de …` | Um identificador coincidiria com texto do JSON | Não publicar; investigar a coincidência sem imprimir o valor |
| `a extensão da janela alterou recortes fechados` | Defeito no pipeline | Parar e investigar; nunca publicar assim |
| `validações reprovadas` com os números de aceite (1.416, 81.217…) | A base restaurada não é a auditada | Conferir o cofre; a base não se troca sem decisão |

## Desfazer uma publicação

Os releases antigos permanecem no bucket e o histórico guarda a sequência.

```bash
$TR historico                         # acha o SHA anterior
$TR ponteiro                          # SELECT → confirma o SHA que está no ar
$TR baixar <SHA-anterior> ~/tea-privado/trabalho/anterior.json
$TR sql ~/tea-privado/trabalho/anterior.json --anterior-sha <SHA-no-ar>
# UPDATE no D1 (exatamente uma linha) e SELECT de conferência
$TR verificar <SHA-anterior> --ponteiro <sha256 devolvido pelo SELECT>
$TR registrar ~/tea-privado/trabalho/anterior.json --anterior-sha <SHA-no-ar> --nota "rollback: <motivo>"
```

## Primeira vez: a base no cofre

Se `cofre-restaurar` disser que a base não está completa, ela precisa entrar
uma única vez. Peça ao usuário o zip da pasta `012025_062026` do Drive (as 19
planilhas) e a `Matriz_Analítica_Terapias_Especiais_2025`. **Confira antes de
guardar**: o cofre só recebe a base que reproduz o que está no ar.

```bash
install -d -m 700 ~/tea-privado/chegada/base
# as 19 planilhas em ~/tea-privado/chegada/base/ e a Matriz em ~/tea-privado/chegada/
$TR ponteiro
$TR baixar <SHA-no-ar> ~/tea-privado/trabalho/no-ar.json
python3 -I scripts/build-tea-data.py ~/tea-privado/chegada/base \
  --matriz ~/tea-privado/chegada/<Matriz>.xlsx --corte <corte no ar> \
  --saida ~/tea-privado/trabalho/base.json
$TR comparar ~/tea-privado/trabalho/base.json ~/tea-privado/trabalho/no-ar.json \
    --exigir-fechados-inalterados
```

O build só passa com exatamente 19 fontes, os números de aceite e a Matriz
reconciliada. A comparação toma o build da base como anterior e o release no
ar como novo: todos os recortes até 2026/06 têm de sair idênticos; se o
release no ar já tem competências posteriores, o período completo e o ano de
2026 aparecem como ampliados. Então guarde:

```bash
for f in ~/tea-privado/chegada/base/*.xlsx; do $TR cofre-enviar "$f" --papel base; done
$TR cofre-enviar ~/tea-privado/chegada/<Matriz>.xlsx --papel matriz
```

## Quando o cofre recusa

| Mensagem | O que significa | O que fazer |
|---|---|---|
| `a base já tem as 19 fontes` | O arquivo não é da base | Planilha de competências novas entra com `--papel bloco` |
| `o mesmo conteúdo já está na base` | Arquivo repetido com outro nome | Nada a fazer: já está guardado |
| `a Matriz já está no cofre` | A base tem uma só Matriz e ela já foi guardada | Nada a fazer; se a guardada é a errada, retire-a com `cofre-retirar` e envie a certa |
| `já existe no cofre com outro conteúdo` | Outra versão de um arquivo da base | A base auditada não se troca; confirme com o usuário qual é a versão que reproduz os números de aceite |
| `--substitui deve indicar exatamente um bloco vigente` | Nome ou chave não confere | `$TR cofre-listar` e use o nome original do bloco |

Item enviado por engano — base ou bloco — sai do uso com
`$TR cofre-retirar <nome> --motivo "<por quê>"`. Nada é apagado: o objeto
continua no cofre e a retirada fica registrada no manifesto.

## Antes de mexer no cliente

O painel (`unimed/tea.html`) aceita qualquer número de recortes desde a versão
5.1 do pipeline. Se um dia o contrato de dados mudar, a versão compatível do
painel precisa estar no ar — e o cache da página vencido, cerca de 15 minutos
depois do deploy — **antes** da troca do ponteiro. Depois de editar
`unimed/tea.html`, rode `python3 scripts/build-tea-data.py --emit-p` e os
guardas do CI (`--selftest`, `check-tea-artifacts.py`,
`generate-portal-tools.py .`).
