# AGENTS.md — Orientação para o agente executor (Painel Terapias Especiais)

Este arquivo orienta o agente/engenheiro que vai **executar** a evolução do Painel TEA →
**Painel Terapias Especiais (multidisciplinar)** da Unimed Governador Valadares.

## 1. Fonte da verdade

Leia **integralmente**, do início ao fim, antes de qualquer código:

> **`docs/_infra/prd-2026-07-painel-escopos-comparaveis.md`** (v4 — escopos comparáveis, o PRD vigente)
> **`docs/_infra/prd-2026-07-painel-terapias-gestao.md`** (v3 — reforma de gestão, vigente no que o v4 não altera)

O v3 reforma as telas e o contrato de dados sobre a base já implantada: seis
perguntas de gestão, Visão Executiva com deltas e Fila de Ação, ranking Pareto,
variabilidade justificada×injustificada, decomposição preço×volume×população×mix,
correção da matriz e remoção dos visuais sem pergunta. Consulte também o
histórico, que segue valendo no que o v3 não altera:
`docs/_infra/prd-2026-07-painel-terapias-especiais.md` (v2 multidisciplinar),
`docs/_infra/prd-2026-07-painel-tea-v2.md` e `skills/tea-data-pipeline.md`.

Para **atualizar o painel com competências novas** (o caso do dia a dia: chega
uma planilha e o painel precisa refletir o mês), as decisões estão em
`docs/_infra/prd-2026-11-painel-atualizacao-por-competencia.md` (v5.1) e o rito
completo em `skills/painel-tea-ingestao/SKILL.md`. Siga-o do início ao fim.

## 2. Onde já está o que existe (ponto de partida no repo)

- `unimed/tea.html` — painel atual (hoje só ABA · Psicologia). É a **fonte durável** da estrutura (SPA, Chart.js, tokens). Editar aqui.
- `scripts/build-tea-data.py` — pipeline atual (injeta JSON entre marcadores `TEA-DATA:BEGIN/END`; `--emit-p` gera a cópia `/p/`; `--selftest` roda fixture sintética; relatório de build).
- `scripts/tea-release.py` — cofre dos insumos brutos e release (compara com o release anterior, envia o JSON imutável, gera o SQL do ponteiro, anota o histórico, verifica).
- `scripts/build-cte-data.py` — segundo pipeline (camada CTE).
- `p/painel-tea/index.html` + `p/registry.json` — cópia compartilhável com gate embutido.
- `.github/workflows/deploy.yml` — deploy (GitHub Pages via Fastly) no push para `main`, com **smoke test** (exige arquivos críticos e `meta robots noindex` em `unimed/tea.html`).

**Não reimplemente** login, hospedagem, gate, `/p/` nem logomarcas — preserve como estão (PRD §1).

## 3. ⚠️ LGPD — regra de ouro (dado bruto NUNCA no repositório)

Este repositório é **público**. As planilhas-fonte contêm **nome, data de nascimento,
gênero e procedimento de menores** (dado sensível). Elas **JAMAIS** entram na árvore do
repo — o pipeline **aborta** se o insumo estiver dentro de um git.

- Coloque os brutos em uma **pasta irmã, fora do clone**. Ex.: se o repo está em
  `~/dev/hub`, use `~/dev/dados-brutos-te/` (fora de `~/dev/hub`).
- `.gitignore` já bloqueia `*.xlsx`, `*.zip` e pastas `dados-brutos*/` / `insumo-te/` como
  rede de segurança — mas **não confie só nisso**: mantenha o bruto fora do repo por padrão.
- Só **agregados k-anonimizados (k=5)** são versionados. Rode a varredura anti-vazamento
  do pipeline (nenhum nome de beneficiário no HTML/JSON/`/p/`).
- **Onde o bruto mora:** no cofre privado (R2 `csv-dados-sensiveis`, prefixo
  `unimed-tea/raw/`, sem acesso público), operado por `scripts/tea-release.py cofre-*`.
  Por decisão do responsável pelo produto (Superintendência Médica, 04/11/2026), o bruto
  pode ser processado em sessão de agente para atualizar o painel — sempre em pasta
  privada fora de qualquer Git, apagada ao fim do trabalho.
- **Nunca** reproduza nome, matrícula, data de nascimento ou guia em mensagem, log,
  commit, PR ou relatório. As mensagens de erro do pipeline descrevem só o formato da
  célula; diagnósticos próprios devem fazer o mesmo.

## 4. Insumos (fornecidos à parte — não versionar)

- **Zip com 19 planilhas-fonte** (uma por procedimento; inclui a do código de AT
  `50000519 - Pediakids`). Descompacte para a pasta irmã de brutos.
- **Matriz Analítica consolidada 2025** (`Matriz_Analitica_Terapias_Especiais_2025.xlsx`) —
  referência de **conferência cruzada**: os agregados 2025 do painel devem bater com ela.
- **Blocos complementares** — planilhas consolidadas (vários códigos na mesma aba) com as
  competências posteriores a 2026/06, por exemplo `Terapias_Especiais_072026_092026.xlsx`.
  Entram por `--bloco` e nunca alteram o período-base.

## 5. Regras inegociáveis (resumo do PRD §0)

1. **Zero metalinguagem de IA** em qualquer parte visível do produto.
2. **Português do Brasil** com acentuação e cedilha; nomes de prestador/solicitante em
   **CAIXA ALTA sem acento** (regra `dNome`) nos rótulos de dados.
3. **Nunca inventar** número — tudo do pipeline, declarado em **Método e Fontes**.
4. **Visão de rede única** (sai o corte "recurso próprio"); canais Rede Credenciada e
   Intercâmbio preservados. Objeto orientador = **paciente**; perspectivas
   paciente/prestador/população; **Prestadores** é a aba-âncora; **período selecionável**.
5. **17 terapias** (PECS · Fonoaudiologia descartada por cobertura incompleta — regra
   programática, ver PRD §2.3). **Período-base 2025/01–2026/06, congelado**: define o
   conjunto de terapias, os critérios de aceite e a conferência com a Matriz 2025. A
   janela publicada cresce por competência (`--bloco` + `--ate`); o pipeline refaz e
   confere a base a cada build e recusa qualquer mudança em período fechado da base.
   Mês novo já publicado que mude em uma planilha posterior é apontado por
   `tea-release.py comparar --exigir-fechados-inalterados`, antes de publicar.

## 6. Fluxo de trabalho

1. Ler o PRD inteiro + o painel/pipeline atuais.
2. **Analisar os dados mais de uma vez** antes de codar (reconferir cobertura de período,
   chaves, agregações contra o PRD e as planilhas).
3. Executar por fases (PRD §13), validando cada uma pelos **critérios de aceite** (PRD §12),
   que valem para o **período-base**: 17 terapias; **1.416 crianças únicas**;
   **161 prestadores**; **81.217 sessões**; **R$ 13.919.882,74**; conferência cruzada com
   a Matriz 2025. Com competências novas, o total do período completo cresce; os números
   da base continuam sendo exigidos pelo próprio pipeline.
4. **Verificar em render real** (desktop e mobile), sem erros de console. Regenerar `/p/`
   com `--emit-p`. Manter `meta robots noindex`.
5. Commit em branch própria → PR para `main` → deploy verde → **verificar no link real**
   (não de memória) que a versão nova está no ar.

## 7. Comando de sanidade do pipeline

```
python3 scripts/build-tea-data.py --selftest        # fixture sintética, valida regras
python3 scripts/build-tea-data.py <base-fora-do-repo> --matriz <matriz> --saida <json-privado>
python3 scripts/build-tea-data.py <base-fora-do-repo> --matriz <matriz> \
        --bloco <planilha-nova.xlsx> --ate AAAA/MM --saida <json-privado>
python3 scripts/build-tea-data.py --emit-p          # regenera p/painel-tea/index.html
python3 scripts/tea-release.py comparar <release-no-ar.json> <json-privado> --exigir-fechados-inalterados
```

`--selftest` cobre as duas ferramentas: ao fim, roda também o autoteste de
`scripts/tea-release.py` (rede simulada).

Comece confirmando, em poucas linhas, seu entendimento do escopo e do período canônico
antes de escrever código.

## 8. Política de acesso corporativo

- Contas cadastradas com status global `active` e e-mail de sufixo exato `@grupocsv.com` têm acesso a todos os portais válidos do Hub, com senha individual.
- O painel `admin` permanece restrito às credenciais administrativas e não participa dessa política.
- Conta corporativa inexistente, pendente ou revogada deve permanecer bloqueada; a revogação global é o mecanismo de desligamento.
- Domínios externos continuam sujeitos ao vínculo individual por tenant nos portais parceiros e às regras legadas dos portais de empresa.
- Os portais de empresa devem manter o e-mail corporativo como campo opcional e preservar o acesso compartilhado quando ele estiver vazio.
- Fonte canônica do backend: `grupocsv/backend/workers/csv-auth/index.js`. Cliente: `scripts/hub-auth.js` e `docs/public/scripts/hub-auth.js`.
