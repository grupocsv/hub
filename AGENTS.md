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

## 2. Onde já está o que existe (ponto de partida no repo)

- `unimed/tea.html` — painel atual (hoje só ABA · Psicologia). É a **fonte durável** da estrutura (SPA, Chart.js, tokens). Editar aqui.
- `scripts/build-tea-data.py` — pipeline atual (injeta JSON entre marcadores `TEA-DATA:BEGIN/END`; `--emit-p` gera a cópia `/p/`; `--selftest` roda fixture sintética; relatório de build).
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

## 4. Insumos (fornecidos à parte — não versionar)

- **Zip com 19 planilhas-fonte** (uma por procedimento; inclui a do código de AT
  `50000519 - Pediakids`). Descompacte para a pasta irmã de brutos.
- **Matriz Analítica consolidada 2025** (`Matriz_Analitica_Terapias_Especiais_2025.xlsx`) —
  referência de **conferência cruzada**: os agregados 2025 do painel devem bater com ela.

## 5. Regras inegociáveis (resumo do PRD §0)

1. **Zero metalinguagem de IA** em qualquer parte visível do produto.
2. **Português do Brasil** com acentuação e cedilha; nomes de prestador/solicitante em
   **CAIXA ALTA sem acento** (regra `dNome`) nos rótulos de dados.
3. **Nunca inventar** número — tudo do pipeline, declarado em **Método e Fontes**.
4. **Visão de rede única** (sai o corte "recurso próprio"); canais Rede Credenciada e
   Intercâmbio preservados. Objeto orientador = **paciente**; perspectivas
   paciente/prestador/população; **Prestadores** é a aba-âncora; **período selecionável**.
5. **17 terapias** (PECS · Fonoaudiologia descartada por cobertura incompleta — regra
   programática, ver PRD §2.3). Período canônico **2025/01–2026/06**.

## 6. Fluxo de trabalho

1. Ler o PRD inteiro + o painel/pipeline atuais.
2. **Analisar os dados mais de uma vez** antes de codar (reconferir cobertura de período,
   chaves, agregações contra o PRD e as planilhas).
3. Executar por fases (PRD §13), validando cada uma pelos **critérios de aceite** (PRD §12):
   17 terapias; **1.416 crianças únicas**; **161 prestadores**; **81.217 sessões**;
   **R$ 13.919.882,74**; conferência cruzada com a Matriz 2025.
4. **Verificar em render real** (desktop e mobile), sem erros de console. Regenerar `/p/`
   com `--emit-p`. Manter `meta robots noindex`.
5. Commit em branch própria → PR para `main` → deploy verde → **verificar no link real**
   (não de memória) que a versão nova está no ar.

## 7. Comando de sanidade do pipeline

```
python3 scripts/build-tea-data.py --selftest        # fixture sintética, valida regras
python3 scripts/build-tea-data.py <insumo-fora-do-repo> --corte AAAA-MM-DD
python3 scripts/build-tea-data.py --emit-p          # regenera p/painel-tea/index.html
```

Comece confirmando, em poucas linhas, seu entendimento do escopo e do período canônico
antes de escrever código.
