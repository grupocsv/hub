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

Detalhes de regra e contrato: `skills/tea-data-pipeline.md`.

## Conduta com os dados

As planilhas trazem nome, nascimento, matrícula e guia de crianças.

- O bruto vive só no cofre e, durante o trabalho, em uma pasta privada fora de
  qualquer Git (`~/tea-privado`, modo 700). O repositório `grupocsv/hub` é
  público: nada de bruto nem de JSON privado nele — o pipeline e a ferramenta
  de release abortam se tentarem.
- Nunca escreva nome, nascimento, matrícula ou guia em mensagem, log, commit,
  PR ou relatório. Diagnósticos mostram contagens, competências, códigos e o
  **formato** da célula (`99/99/9999`), nunca o conteúdo.
- Execute com `python3 -I` todo script que abre planilha recebida.
- O token do Cloudflare fica em arquivo modo 600 fora de Git e nunca é
  impresso. Está no Arsenal Técnico (Notion) como "Cloudflare Workers Token
  (Manus)" — precisa de R2 com escrita. Não grave token em script.

## Preparação (uma vez por sessão)

Trabalhe em um clone do repositório `grupocsv/hub`: o pipeline e a ferramenta
de release estão em `scripts/`.

```bash
python3 -m pip install -q openpyxl==3.1.5
install -d -m 700 ~/tea-privado/{base,blocos,saida}
# token: ~/tea-privado/.cf-r2 (modo 600), obtido do Arsenal
export CLOUDFLARE_ACCOUNT_ID=<conta Cloudflare — ver docs/_infra/index.md>
TR="python3 scripts/tea-release.py --token-file $HOME/tea-privado/.cf-r2"
$TR cofre-listar
$TR cofre-baixar unimed-tea/raw/base/2025-01_2026-06/ ~/tea-privado/base
```

A pasta `base` deve ficar com as 19 planilhas e a Matriz. Baixe também os
blocos marcados como `vigente` em `unimed-tea/raw/manifesto.json` que não
forem substituídos pela planilha nova.

Se o cofre não tiver a base (`"estado": "ausente"` no manifesto), ela precisa
entrar uma única vez: peça ao usuário o zip da pasta `012025_062026` do Drive
(as 19 planilhas) e a `Matriz_Analítica_Terapias_Especiais_2025`, guarde cada
arquivo com `cofre-enviar --papel base` (a Matriz com `--papel matriz`) e faça
a conferência de origem: um build **sem blocos** comparado com o release no ar
tem de dar todos os recortes idênticos.

## Passo a passo

1. **Guardar a planilha nova.** Copie-a para `~/tea-privado/blocos/` e envie
   ao cofre:
   `$TR cofre-enviar <planilha.xlsx> --papel bloco [--substitui <chave antiga>]`.
   Use `--substitui` quando a planilha nova cobre as mesmas competências de um
   bloco anterior (por exemplo `072026_102026` no lugar de `072026_092026`);
   se cobre competências novas e disjuntas, é um bloco adicional.

2. **Decidir a última competência a publicar (`--ate`).** Publique só
   competência fechada. Olhe o volume do último mês da planilha contra os
   anteriores (registros, sessões, pagamento por mês — só agregados). Queda
   forte no último mês costuma ser faturamento ainda entrando: publique até o
   mês anterior e diga isso ao usuário. Em dúvida real, pergunte qual é a
   última competência fechada.

3. **Gerar o JSON.**
   ```bash
   python3 -I scripts/build-tea-data.py ~/tea-privado/base \
     --matriz ~/tea-privado/base/<Matriz>.xlsx \
     --bloco ~/tea-privado/blocos/<planilha>.xlsx \
     --ate AAAA/MM --saida ~/tea-privado/saida/tea.json
   ```
   O relatório final traz a base conferida, os recortes fechados idênticos, a
   série das competências novas e o que ficou fora (PECS, registros sem data
   de nascimento, competências além da janela).

4. **Comparar com o release no ar.** Descubra o SHA vigente com o `SELECT` da
   seção de publicação, e então:
   ```bash
   $TR baixar <SHA-vigente> ~/tea-privado/saida/vigente.json
   $TR comparar ~/tea-privado/saida/vigente.json ~/tea-privado/saida/tea.json
   ```
   O esperado: recortes fechados idênticos (ou "idênticos exceto faixa
   etária", efeito do corte etário novo), `tudo` e o ano em curso ampliados,
   e os recortes novos. **Recorte fechado alterado** ou mês com a marca
   `ALTERADA` significa que a planilha reapresentou dado antigo: explique ao
   usuário o que mudou e confirme antes de publicar.

5. **Publicar.**
   ```bash
   $TR enviar ~/tea-privado/saida/tea.json
   $TR sql ~/tea-privado/saida/tea.json --anterior-sha <SHA-vigente>
   ```
   Execute o `UPDATE` impresso no D1 `csv-hub` (ferramenta de D1 disponível
   na sessão) e confirme que alterou **exatamente uma linha**; rode o `SELECT`
   de conferência. Depois:
   ```bash
   $TR registrar ~/tea-privado/saida/tea.json --anterior-sha <SHA-vigente> --nota "<o que entrou>"
   $TR verificar <SHA-novo>
   ```

6. **Conferir no ar e relatar.** Abra o painel real e veja o período completo
   com a data final nova. Conte ao usuário, em poucas linhas: até que
   competência o painel vai, os números das competências novas, o que ficou
   fora e por quê, e qualquer movimento que mereça atenção. Registre a
   publicação no Agent Context Bridge.

7. **Limpar.** Apague `~/tea-privado` ao terminar; o cofre guarda o que é
   preciso para a próxima vez.

## Quando o pipeline para

| Mensagem | O que significa | O que fazer |
|---|---|---|
| `schema divergente` / `esperado um único cabeçalho 'Ano/Mês'` | A planilha não tem as 19 colunas esperadas | Conferir se é a aba certa; pedir a planilha no formato padrão |
| `código fora do catálogo` | Apareceu um procedimento novo | Decisão de produto: avisar o usuário, não mapear por conta própria |
| `Tipo Prestador desconhecido` | Canal novo na origem | Idem: o mapa de canais é auditável, muda por decisão |
| `bloco complementar contém competência do período-base` | A planilha traz meses até 2026/06 | A base não muda por bloco; publicar só o que é posterior |
| `competência … aparece em dois blocos` | Dois arquivos cobrem o mesmo mês | Usar só o bloco mais recente daquele mês |
| `sem registros em nenhum bloco` | `--ate` passa do que as planilhas trazem | Corrigir o `--ate` |
| `registros sem data de nascimento … acima da tolerância` | Problema de cadastro em volume | Devolver à origem; não contornar |
| `Data Nascimento inválida (formato …)` | Célula com data ilegível | Ver a linha indicada na pasta privada; correção é na origem |
| `anti-vazamento bloqueou presença de …` | Um identificador coincidiria com texto do JSON | Não publicar; investigar a coincidência sem imprimir o valor |
| `a extensão da janela alterou recortes fechados` | Defeito ou insumo-base trocado | Parar e investigar; nunca publicar assim |
| critérios de aceite (1.416, 81.217…) | A base restaurada não é a auditada | Conferir os 19 arquivos contra os hashes do release vigente |

## Desfazer uma publicação

Os releases antigos permanecem no bucket e `releases/historico.json` guarda a
sequência. Para voltar: `sql` com o JSON do release anterior e
`--anterior-sha` igual ao SHA que está no ar; execute o `UPDATE`, confira e
rode `registrar` com a nota do motivo.

## Antes de mexer no cliente

O painel (`unimed/tea.html`) aceita qualquer número de recortes desde a versão
5.1 do pipeline. Se um dia o contrato de dados mudar, a versão compatível do
painel precisa estar no ar **antes** da troca do ponteiro; depois de editar
`unimed/tea.html`, rode `python3 scripts/build-tea-data.py --emit-p` e os
guardas do CI (`--selftest`, `check-tea-artifacts.py`,
`generate-portal-tools.py .`).
