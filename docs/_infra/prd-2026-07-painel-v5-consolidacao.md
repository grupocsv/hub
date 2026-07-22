# PRD v5 — Painel Terapias Especiais · Casa Unimed, Reatividade Total e Linguagem Final

**Complementa:** `prd-2026-07-painel-escopos-comparaveis.md` (v4) e `prd-2026-07-painel-terapias-gestao.md` (v3), vigentes no que este documento não altera.
**Origem:** feedback direto do gestor em 22/07/2026, consolidado a partir de quatro apontamentos: (1) erro grave — profissionais da Casa Unimed listados individualmente; (2) metalinguagem residual em títulos e subtítulos; (3) abas que não reagem ao escopo selecionado no Início; (4) cópia pública sem a imagem OpenGraph padrão Unimed.
**Data:** Julho de 2026 · **Autor:** Grupo CSV / EVS · AxiaCare

---

## 1. Casa Unimed como Entidade Única (erro grave)

### 1.1 Diagnóstico

O dado publicado hoje lista 13 profissionais pessoa física exclusivos do canal Casa Unimed como prestadores individuais (R$ 894,5 mil, 7.456 sessões no período completo), e um 14º caso misto. A Casa Unimed é uma unidade assistencial (abriga o Centro de Terapias Especiais); seus profissionais não são prestadores contratados individualmente e não devem aparecer no ranking, na matriz nem na dispersão como entidades próprias.

A base identifica os profissionais da Casa com segurança total: todo registro com **Tipo Prestador = `ATENDIMENTO ESPECIALIZADO`** é atendimento da Casa Unimed — a mesma regra que a conferência com a Matriz 2025 já usa para o corte "Rede própria". O pipeline v2 consolidava por essa regra (`prestador_agrupado`), removida indevidamente na evolução de 20/07/2026. A decisão canônica está registrada na memória institucional (fato de 09/07/2026): profissionais do tipo `ATENDIMENTO ESPECIALIZADO` vinculam-se à entidade CASA UNIMED.

### 1.2 Regra (contrato v5)

1. **Consolidação por registro, nunca por nome.** Campo novo `prest_entidade` derivado em `normalizar_registro`: `CASA UNIMED` quando o tipo do registro é `ATENDIMENTO ESPECIALIZADO`; caso contrário, o nome consolidado atual (pós-merge de CNPJ). Um profissional com registros em outros canais permanece prestador individual nesses canais (caso Neilson Costa Ribeiro: registros da Casa → CASA UNIMED; registros de reembolso → registro próprio).
2. **Ranking, fatias por disciplina, série por prestador, executantes de solicitantes e contagem de prestadores por canal** agregam por `prest_entidade`. A entidade CASA UNIMED publica `composicao`: lista dos profissionais (nome, sessões, pagamento) para a ficha.
3. **Referências de preço e intensidade permanecem na granularidade profissional** (`nome_prest`): colapsar dezenas de profissionais em uma observação distorceria mediana, quartis e o piso k≥5. Declarado em `meta`.
4. **Conferência da Matriz 2025 intocada**: `rede_matriz`/`agregados_matriz_esperados` continuam lendo `tipo_prest` cru. Os contadores canônicos `prestadores_observados` (161) e `prestadores_consolidados` (160) mantêm o significado; entra `prestadores_publicados` (entidades no ranking) e `profissionais_casa_unimed`.
5. **Validações novas**: soma da composição = totais da entidade (pagamento ±R$ 0,02; sessões exatas); canal da entidade = exclusivamente Casa Unimed; nenhum outro item do ranking com canal Casa Unimed; fixture sintética cobrindo o caso misto (profissional na composição da Casa e como individual em outro canal).
6. **Front**: CASA UNIMED aparece no ranking e nos gráficos comparáveis como um prestador da rede única, com marcação visual de rede própria (padrão `is-own` dos painéis v1/v2); a ficha lista a composição.

## 2. Reatividade Total do Escopo

Auditoria completa (aba × escopo). O mecanismo de re-render funciona; o que falta é dado ou correção pontual.

### 2.1 Bugs de front (correção imediata, sem dado novo)

| Onde | Defeito | Correção |
|---|---|---|
| `contextoPrestadores` | Cache com chave `periodId\|specialty` ignora o escopo — troca de escopo pode servir contexto obsoleto | Chave passa a incluir `escopoTipo\|escopoValor`; cache zerado em `selecionarEscopo` |
| Terapias × disciplina | KPIs usam o resumo da rede completa | KPIs de pagamento/exposições via `resumoDisciplina`; % do líder sobre a disciplina |
| Terapias × kit | Gráfico de combinações ignora o kit selecionado | Filtrar/destacar combinações cuja classificação = kit ativo (lógica já existente) |
| Canais (export CSV) | Closure captura o total do primeiro render | Recalcular dentro do handler |
| Ficha do prestador × disciplina | Série mensal é total sem aviso | Rotular "série de todas as disciplinas do prestador" |
| Terapias × rede (faixas por canal) | Fallback client-side mistura disciplinas na mesma faixa | Substituir por indicação de seleção de disciplina (coerente com o gate da matriz) |

### 2.2 Contrato v5 (dados novos por recorte)

1. **`disciplina_canais[disciplina]`** — por canal dentro da disciplina: pagamento, sessões, custo/sessão, exposições. → Aba Canais reage ao escopo de disciplina.
2. **`resumo_disciplina[disciplina]`** — pagamento, sessões, **crianças únicas da disciplina** (deduplicação dentro da disciplina), exposições. → KPIs corretos e waterfall de 3 efeitos (população × sessões/criança × preço) no escopo de disciplina.
3. **`pacientes_disciplina[disciplina]`** — faixa etária, faixas de intensidade (com mediana), custo por criança (média/mediana). → Aba Pacientes reage ao escopo de disciplina.
4. **`kits[kit_id]`** — crianças, pagamento, sessões, custo por criança-mês, distribuição por canal; classificação por criança conforme o conjunto de disciplinas no recorte (mesma taxonomia do painel: as três principais em conjunto; as três + outras; duas; três ou mais em outra combinação; única); célula com menos de 5 crianças não publica. → Visão Geral, Pacientes e Canais reagem ao escopo de combinação.
5. **Semântica de canais**: `prestadores` conta entidades (`prest_entidade`); campo novo `profissionais` conta pessoas físicas/CNPJs de origem.
6. Fora do escopo v5 (declarado em tela quando pertinente): série mensal por kit; série por prestador×disciplina.

### 2.3 Efeito no front

- **Canais × disciplina**: tabela e gráficos a partir de `disciplina_canais`; × kit: distribuição por canal do kit.
- **Visão Geral / Evolução × disciplina**: crianças únicas e decomposição de 3 efeitos via `resumo_disciplina`.
- **Visão Geral × kit**: KPIs da coorte (crianças, pagamento, sessões, custo por criança-mês) via `kits`.
- **Pacientes × disciplina**: gráficos por `pacientes_disciplina`; × kit: agregados do kit.
- Payload v4 (sem os campos novos): comportamento atual preservado com nota de limitação — o front é tolerante a contrato.

## 3. Linguagem Final (varredura de 60 strings)

Auditoria string a string concluída (60 itens com reescrita aprovada em `docs/_infra` — anexo da execução). Regras consolidadas:

1. **Título de gráfico é rótulo sóbrio**, sem artigo narrativo ("As crianças ativas…" → "Crianças Ativas por Competência") e sem pergunta ("Por que o pagamento variou" → "Decomposição da Variação do Pagamento").
2. **Proibido o padrão "Título — comentário"** quando o comentário é vago ou redundante ("— a série de eficiência", "— a referência é o meio", "— Selecione uma Disciplina").
3. **Zero autoexplicação da interface** ("aparece no topo de todas as abas", "busca, filtro, ordenação e paginação", "selecione no Início" dentro de KPI) e **zero remissão em cadeia** ("regras em Método e Fontes" repetido; manter a remissão apenas onde é a única fonte da regra).
4. **Zero jargão analítico** em rótulo de tela ("Pareto", "leituras de desvio", "auditável", "plano de decisão").
5. Notas descritivas curtas, linguagem de gestão de operadora, Title Case PT-BR nos títulos.

## 4. OpenGraph da Cópia Pública

- `unimed/tea.html` recebe o bloco OG/Twitter padrão dos painéis Unimed (drg, vivapleno, ped-amb): `og:type=website`, `og:locale=pt_BR`, título, descrição, `og:url` (string exata preservada — o `--emit-p` a troca por `/p/painel-tea/`), `og:site_name`, **`og:image=https://hub.grupocsv.com/og/og_unimed.png`** (1200×630, 48,5 KB — a atual `og_tea.png` de 250 KB/2400×1260 excede o limite prático do crawler do WhatsApp), dimensões e `twitter:card=summary_large_image`.
- `/p/` é gerado — nunca editar à mão. Validação em opengraph.xyz; no WhatsApp, testar com query string por causa do cache de preview.

## 5. Critérios de Aceite

1. Nenhum profissional da Casa Unimed listado individualmente em ranking, matriz, dispersão, intensidade ou executantes; entidade CASA UNIMED presente com composição íntegra (somas exatas) e marcação de rede própria.
2. Conferência da Matriz 2025 reconciliada sem alteração; 161 observados / 160 consolidados preservados; `prestadores_publicados` = consolidados − exclusivos da Casa + 1.
3. Toda aba responde ao escopo do Início com dado do escopo ou declaração explícita de limitação — nunca silêncio.
4. Zero ocorrência dos padrões de linguagem proibidos (§3) em qualquer tela, verificado por varredura automatizada no DOM.
5. Preview de compartilhamento com a imagem padrão Unimed na página autenticada e na cópia pública.
6. Selftest do pipeline verde com as validações novas; build real dentro do teto de 8 MB; render limpo desktop e mobile; `/p/` regenerado; deploy verificado no link real.
7. Publicação: novo release imutável no R2 + ponteiro D1 atualizado (fluxo vigente), com rollback documentado.

## 6. Fases de Execução

1. **F1** — Pipeline v5.0.0 (constantes + `prest_entidade` + guarda; fixture nova; consolidação nos seis agregadores; `disciplina_canais`; `resumo_disciplina`; `pacientes_disciplina`; `kits`; validações; meta; relatório).
2. **F2** — Build real, conferência dos aceites §5.1–5.2 e do teto de tamanho.
3. **F3** — Front: Casa Unimed (marcação + ficha), reatividade §2, linguagem §3, OG §4.
4. **F4** — Testes Playwright (payload real v5 + fallback v4 sintético; desktop + mobile), `--emit-p`, varredura de linguagem no DOM.
5. **F5** — PR, merge, deploy verificado; entrega do release para publicação (R2 + D1) e verificação.
