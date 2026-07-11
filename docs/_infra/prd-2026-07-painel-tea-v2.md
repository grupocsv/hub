# PRD — Painel TEA v2 · Releitura Completa do Painel Estratégico Terapia ABA (Psicologia) · Unimed GV

| Campo | Valor |
|---|---|
| **Documento** | `docs/_infra/prd-2026-07-painel-tea-v2.md` |
| **Data** | 09/07/2026 |
| **Solicitante** | Guilherme Camargo Thomé (Grupo CSV / EVS · AxiaCare) |
| **Status** | Proposta para aprovação |
| **Produto** | `unimed/tea.html` (hub interno) + `open.grupocsv.com/painel-tea/` (cópia pública com gate) |
| **Substitui** | `unimed/tea.html` atual (matriz estratégica única, ano base 2024, dados inferidos) |
| **Referência visual** | `https://open.grupocsv.com/painel-cirurgico` (Painel Cirúrgico — Hospital Unihealth) |
| **Base de evidência** | Planilha oficial Unimed GV (19.007 registros, jan/2025–jun/2026) + LEIA-ME; análises de 09/07/2026: dados, indicadores, design, gap e pipeline |
| **LGPD** | Este PRD não contém nome, matrícula ou nascimento de beneficiário. Nomes de prestadores (PJ/profissionais remunerados) são permitidos. |

---

## 1. Sumário executivo

**O quê.** Releitura completa do painel TEA da Unimed GV: sai a página única estática com dados agregados de 2024 (31 registros de prestadores, uma matriz de bolhas e seis insights congelados) e entra uma aplicação de página única (SPA por hash router) com seis seções navegáveis — Visão Geral, Evolução, Prestadores, Pacientes, Canais e Método — construída sobre os micro-dados oficiais de 18 competências (jan/2025 a jun/2026), no mesmo sistema visual do Painel Cirúrgico de referência: sidebar escura no desktop, tabbar fixa no mobile, tipografia Source Sans 3 + Source Serif 4, cards sem sombra, Chart.js com narrativa interpretativa e dados 100% gerados por pipeline auditável.

**Por quê.** Três motivos. (1) **Os dados atuais estão obsoletos e são inferidos** — o painel exibe médias de 2024 (R$ 168,21/sessão; 25,1 sessões/beneficiário) derivadas de uma reconstrução matemática rotulada "VALORES INFERIDOS", enquanto agora existe a planilha oficial: R$ 4.593.638,14 pagos, 28.979 sessões, 840 pacientes. (2) **O painel atual não responde às perguntas de gestão** — não tem série temporal, dimensão paciente, mix de canais de pagamento nem preço unitário real, exatamente as alavancas onde a análise encontrou dinheiro: dispersão de preço de 2,06x para o mesmo código, 44,98% do custo em negociação direta ao preço mais alto da carteira e ~R$ 330 mil de gap em 18 meses só nos três prestadores mais caros. (3) **Consistência de portfólio** — o Painel Cirúrgico estabeleceu o padrão visual e de UX dos painéis do Grupo CSV; o painel TEA deve entregar a mesma experiência em desktop e mobile.

**Para quem.** Diretoria e gestão de rede da Unimed GV (credenciamento, negociação de preço, provisão orçamentária), auditoria de contas (sinais de integridade) e EVS/AxiaCare como realizadora. Publicação em duas frentes a partir do mesmo build: interna (hub, autenticação `hub-auth`) e pública com gate de senha (Open Pages).

**Princípios de produto.** (a) Nenhum número no painel sem origem no pipeline reproduzível; (b) nenhum dado de beneficiário identificável — agregados com k-anonimato k=5; (c) o painel afirma apenas o que os dados suportam (sessões faturadas, não horas de terapia; competência, não caixa); (d) degradação elegante — tudo que o gráfico mostra existe em tabela ou texto.

---

## 2. Os dados novos

### 2.1 O que a planilha oficial traz

Micro-dados de faturamento do procedimento **50005103 — Terapia ABA · Psicologia · "Terapias Pediátricas Especiais"**, guias **SPSADT**, uma linha por item de guia, com: competência (Ano/Mês), data de atendimento, beneficiário (nome, matrícula, nascimento, gênero), prestador executante (nome, tipo), solicitante (nome, CBOS), quantidade de sessões e valor pago. Acompanha um **LEIA-ME** com regras de tratamento que este PRD adota como norma (§2.3). O arquivo bruto **jamais entra no repositório** — o repo `grupocsv/hub` é público (§6).

### 2.2 Números validados (fonte da verdade do produto)

| Dimensão | Valor validado |
|---|---|
| Registros | **19.007** |
| Período | **18 competências** — 2025/01 a 2026/06 |
| Sessões | **28.979** |
| Custo total pago | **R$ 4.593.638,14** |
| Custo médio por sessão (período) | **R$ 158,52** |
| Pacientes únicos (nome + nascimento) | **840** (em **884** matrículas; 43 pacientes com 2–3 carteirinhas: 797/42/1) |
| Prestadores | **91 brutos → 84 agrupados** |
| Fechamento 2025 | **R$ 3.080.027,55** · 19.236 sessões |
| 1º semestre 2026 | **R$ 1.513.610,59** · 9.743 sessões (média mensal R$ 252.268; run-rate anualizado ~R$ 3,03 mi) |
| Crescimento YoY (S1/2026 vs S1/2025) | custo **+7,13%** · sessões **+8,97%** |
| Pico / vale mensal | set/2025 **R$ 290.672,59** / jan/2025 **R$ 189.769,19** |
| Pacientes ativos por mês | 390 (jan/2025) → pico **498** (abr/2026) → 471 (jun/2026) |

> Nota de auditoria interna: um dos relatórios de apoio (gap analysis) registrou "289.790 sessões / R$ 54.427.435,00" — valores com erro de escala. Os totais canônicos deste PRD (28.979 sessões / R$ 4.593.638,14) foram validados de forma independente por três análises convergentes e são os que o pipeline deve reproduzir exatamente.

### 2.3 Regras do LEIA-ME (obrigatórias em todo cálculo)

1. **Chave de paciente = NOME + DATA DE NASCIMENTO** — nunca matrícula (um paciente pode ter até 3 carteirinhas; 884 matrículas ≠ 840 pacientes).
2. **Tipo Prestador "ATENDIMENTO ESPECIALIZADO" → prestador único "CASA UNIMED"** (5.735 registros). O agrupamento é **por registro, não por nome**: os registros desse tipo de 8 profissionais fundem-se em Casa Unimed; 1 deles (Neilson Costa Ribeiro) tem também 1 registro de REEMBOLSO, que permanece sob o nome próprio — ele conta nos dois grupos.
3. **"ANA CAROLINA OLIVEIRA FARIA FALCAO LTDA" + "CRIAR E CRESCER TEEN LTDA" = um só prestador** (mudança de CNPJ).
   *Aritmética completa (reproduzível pelo pipeline):* 91 nomes brutos − 8 nomes absorvidos pela Casa Unimed − 2 nomes do par de CNPJ + 1 (Casa Unimed) + 1 (par fundido) + 1 (Neilson reaparece pelo registro de reembolso) = **84 prestadores agrupados** (82 demais + Casa Unimed + par fundido). Nenhuma outra regra de fusão existe.
4. **Mapa Tipo Prestador → Tipo de Pagamento**: ATENDIMENTO ESPECIALIZADO → CASA UNIMED; ATENDIMENTOS FORNECEDORES → NEGOCIAÇÃO DIRETA; CLINICA ESPECIALIZADA → REDE CREDENCIADA; OUTRAS ESPEC. EXCETO MEDICO → NEGOCIAÇÃO DIRETA (P.F); REEMBOLSO → REEMBOLSO; UNIMED NACIONAL e UNIMED REGIONAL → INTERCÂMBIO.

### 2.4 Comparação com 2024 e destino do `tea-reconstructed-2024.json`

| Aspecto | Painel atual (base 2024) | Base oficial 2025–2026 |
|---|---|---|
| Origem | Reconstrução matemática de um export Plotly — status "VALORES INFERIDOS — sujeitos a confirmação" | Planilha oficial da operadora |
| Granularidade | 31 registros agregados de prestador (30 nomes), foto anual | 19.007 micro-registros, 18 competências |
| Totais | ≈14.942 sessões; ≈728 registros-beneficiário; ≈R$ 2,35 mi (inferidos) | 28.979 sessões; 840 pacientes; R$ 4.593.638,14 (oficiais) |
| Métricas de referência | R$ 168,21/sessão; 25,1 sessões/beneficiário-ano; 5 de 31 na "zona de eficiência" | R$ 158,52/sessão; mediana 3,11 sessões/paciente-mês; dimensões novas (canal, faixa etária, intensidade, permanência) |
| Insights | 6 cards hard-coded nominais de 2024 (possivelmente já resolvidos) | Gerados do dado corrente a cada build |

As bases **não são comparáveis** (inferida vs oficial; agregado anual vs mensal; 2024 vs 2025–26) — qualquer "evolução 2024 → 2025" seria indefensável e violaria a meta vigente do hub ("nenhum dado TEA inferido publicado sem rótulo de inferência").

**Decisão — aposentadoria com rastro** (aplicada em F5; objeção possível até a aprovação deste PRD): `unimed/data/tea-reconstructed-2024.json` **permanece no repositório como referência histórica**, ganhando os campos **novos** `"superseded": true` e `"superseded_by": "unimed/data/tea-2025-2026.json"` — o texto atual do campo `status` ("VALORES INFERIDOS — sujeitos a confirmação…") é **preservado**, nunca sobrescrito, para não apagar o rótulo de inferência exigido pela meta vigente do hub. Ele **nunca** aparece como ponto de dado em gráfico ou KPI do novo painel; é citado apenas na view Método, em nota rotulada ("análise anterior, base 2024 inferida"). Os 6 insights nominais de 2024 são descartados — a planilha oficial já resolve, por exemplo, as duplicidades cadastrais que motivaram dois deles.

---

## 3. Achados dos dados que moldam o produto

Cada achado define um requisito de produto (→).

1. **O crescimento é volume, não preço.** YoY S1: custo +7,13% com sessões +8,97%; pacientes ativos 390 → 471 (pico 498); custo/sessão **caiu 9,5% em 2026** (R$ 164,86 em jan, máximo da série → R$ 149,18 em jun, mínimo). → A view Evolução decompõe Δcusto em pacientes × intensidade × preço; um KPI de custo isolado esconderia a dinâmica.
2. **Sazonalidade forte de férias escolares.** Vale em dez–fev: jan/2026 R$ 200.963,91 vs set/2025 R$ 290.672,59; dez/2025 caiu 11,5% vs nov (R$ 243.505,05 vs R$ 275.199,70); sessões/paciente caem a 2,93 em janeiro (faixa da série: 2,93–3,88). → Comparações sempre YoY (mesmo mês) e projeção sazonalizada; nunca alarmar com queda de janeiro.
3. **Concentração alta e crescente de prestadores.** Top 5 = **62,2%** do custo; top 10 = **80,5%**; HHI saiu de 860,3 (2025) para **1.352,9** (S1/2026). Rede ativa encolheu de 48 prestadores/mês (jan/2025) para 30 (jun/2026; mínimo 27 em fev/2026). → Negociar com poucos move quase tudo; o painel prioriza ranking, Pareto e concentração no tempo.
4. **Dispersão de preço de 2,06x para o mesmo código.** Entre os 25 prestadores com ≥100 sessões: R$ 120,00 (Casa Unimed) a R$ 247,63 (Espaço Integrar), mediana R$ 180,00. A base tem 104 preços unitários distintos (valor/quantidade arredondado a centavos; modas: R$ 120,00 ×7.902; R$ 220,00 ×2.905; R$ 140,00 ×2.645; R$ 126,00 ×2.583; R$ 200,00 ×781). → Card de dispersão com linhas de referência internas (Casa R$ 120,00; média da carteira R$ 158,52) e gráfico de economia potencial.
5. **Mix de pagamento caro.** NEGOCIAÇÃO DIRETA = **44,98%** do custo (R$ 2.066.085,00) ao preço mais alto (**R$ 186,72**/sessão) vs REDE CREDENCIADA 36,01% (R$ 153,79) vs CASA UNIMED 14,98% (R$ 120,00 fixo em todos os 5.735 registros) vs REEMBOLSO 2,94% (R$ 134,84). → View Canais dedicada, com empilhado mensal e simulador de internalização.
6. **Economia endereçável concreta.** PEDIAKIDS (R$ 219,96/s), ANANDA VIEIRA MORAES (R$ 230,53/s) e COM AFFETO (R$ 212,23/s) somam ≈ R$ 1,17 mi no período; renegociar essas sessões à referência da carteira (~R$ 158) teria valido **~R$ 330 mil em 18 meses**. → Barras divergentes de economia potencial por prestador, com ressalva de substituibilidade/capacidade de rede.
7. **Cauda de custo em pacientes.** Top 10% dos pacientes (84) = **28,89%** do custo (R$ 1.327.108,00); custo por paciente no período: mediana R$ 4.400,00, p90 R$ 11.807,80, p99 R$ 22.162,95, máximo R$ 36.920,00. Intensidade: mediana de 3,11 sessões/mês-ativo por paciente (n=840); na distribuição paciente-mês (n=8.136), mediana 3,0, p90 6 e p99 11 — e **máximo de 114 sessões num único paciente-mês (R$ 20.000,00)**. → Distribuições + sinais de auditoria agregados (a RN 539/2022 veda teto de sessões; o controle possível é de integridade, não de volume).
8. **Perfil epidemiológico coerente e carteira jovem.** 88,1% dos pacientes têm 0–11 anos; a faixa 6–8 é o núcleo (331 pacientes = 39,4%; R$ 2.159.418,18 = **47,0% do custo**); razão M:F 2,78:1 (618/222), consistente com a epidemiologia de TEA; idade mediana de 6 anos completos (idade calendário exata na data de corte 30/06/2026 — método fixado no §6.2). → Pirâmide etária por gênero e leitura de exposição futura (anos de utilização à frente).
9. **Adultos num procedimento pediátrico.** 21 pacientes 18+ (idades de 18 a 78 anos), R$ 37.943,73 e 269 sessões sob o código "Terapias Pediátricas Especiais". → Flag de validação junto à operadora; exibido só como agregado da faixa 18+, sem lista de idades individuais e sem cruzamento com prestador.
10. **Quase metade do custo (49,0%) sem solicitante identificado.** 3.401 registros (17,89%) sem solicitante concentram **R$ 2.251.142,14 = 49,01% do custo** — todo o canal de negociação direta, reembolso e intercâmbio não captura o prescritor. Entre os identificados, psicólogo clínico solicita 59,65% dos registros e médicos, 22,23%. → Indicador de qualidade de dado com meta de redução; matriz solicitante × executante fica fora da v2 (§11).
11. **Sinais pontuais de integridade.** 44 paciente-mês com mais de um prestador simultâneo (96 pacientes com >1 prestador no período, 11,4%); 7 registros de valor zero; 29 registros retroativos >90 dias (R$ 36.912,61; 0,15%); 2 registros ≥ R$ 10 mil, ambos de um mesmo prestador pessoa física do canal negociação direta, com apenas 3 pacientes no período (114 sessões/R$ 20.000,00 em 2026/05 e 80 sessões/R$ 14.400,00 em 2026/06 — identificação nominal restrita à fila privada de auditoria, §6.2; verificado no insumo que o nome vem da coluna de prestador, com zero ocorrências como beneficiário). → Card "sinais de auditoria" com agregados; prestador de evento extremo único **não é nomeado** quando tem <5 pacientes (regra §6.3), pois nome + competência + evento de paciente único permitiriam reidentificação por quem conhece a carteira.
12. **Intercâmbio é marginal, mas existe.** R$ 45.666,00 (0,99% do custo), 372 sessões, 13 pacientes, 5 cooperativas (Pouso Alegre, Gerais de Minas, Nacional, Teófilo Otoni, Vale do Aço), R$ 122,76/sessão; pico da série em jun/2026 (R$ 5.562,00). → Nota dedicada na view Canais, sem inflar em card próprio.
13. **Faturamento tem cauda de lag.** 82,2% das linhas caem na competência do atendimento, 16,6% chegam com 1 mês de defasagem, cauda até 13 meses (1 registro isolado). → Último(s) mês(es) com selo "competência em consolidação"; projeção usa competência, não data de atendimento.
14. **Permanência e churn.** Permanência média de 9,69 meses (mediana 10); 91 pacientes presentes nos 18 meses; 332 saídas no período — mas as 64 de abr/2026 têm só 2 meses de janela de silêncio (churn provisório). → Entradas/saídas com honestidade de censura (jan/2025 é estoque inicial de 390, não coorte de entrada; média posterior ~26 entradas/mês).

---

## 4. Arquitetura de informação do novo painel

### 4.0 Navegação (na linha da referência)

SPA de arquivo único com **hash router** (`#/visao`, `#/evolucao`, …), seis sections `.view` com `data-title`/`data-sub`, lazy-render por view (gráficos montados na primeira visita, mapa `RENDERERS`), transição `viewIn 0.25s`, scroll ao topo a cada troca, deep-link e back/forward via `hashchange`.

| Slug | Título (topbar) | Sidebar desktop | Tabbar mobile |
|---|---|---|---|
| `visao` | Visão Geral | 1º | 1º |
| `evolucao` | Evolução | 2º | 2º |
| `prestadores` | Prestadores | 3º | 3º |
| `pacientes` | Pacientes | 4º | 4º |
| `canais` | Canais de Pagamento | 5º | 5º |
| `metodo` | Método e Fontes | 6º | via botão ⓘ da topbar (padrão da referência: 5 tabs + info) |

Sidebar exibe a pílula de período ("jan/2025 – jun/2026", via JS); topbar exibe chips "Período" e "Atualizado em {data de corte}". Todos os textos numéricos nascem como placeholder "–" e são preenchidos a partir do JSON embutido.

### 4.1 View Visão Geral (`#/visao`)

Função: responder em 15 segundos "quanto custa, para quantos, e para onde vai".

| Elemento | Pergunta de negócio | Visualização | Dados consumidos (blocos do §6.4) |
|---|---|---|---|
| KPI hero (grade 3×2 única, células com bordas internas) | Qual a escala e o momento? | 6 KPIs: custo acumulado 18m (R$ 4.593.638,14); custo do mês corrente (jun/2026: R$ 260.170,61, sub "em consolidação"); pacientes ativos no mês (471; sub "pico 498 em abr/2026"); sessões no mês (1.744); custo/sessão do mês (R$ 149,18; sub "mínimo da série"); YoY S1 custo (+7,13%; sub "+8,97% sessões") | `serie_mensal`, `comparativos`, `meta` |
| Linha resumo | Como o custo se moveu? | Linha/área verde dos últimos 12 meses de custo (padrão `c_home_serie`, box `short` 220px) | `serie_mensal.custo` |
| 2 status-cards (`data-goto`) | O que exige ação agora? | "Top 5 prestadores concentram 62,2% do custo → Ver Prestadores"; "44,98% do custo em negociação direta a R$ 186,72/sessão → Ver Canais" | `concentracao`, `tipo_pagamento` |
| Insight pullquote (serif) | Síntese executiva | "O custo cresce por volume de pacientes (+8,97% sessões YoY), não por preço — o custo por sessão caiu 9,5% em 2026 com o ganho de participação da Casa Unimed e da rede credenciada." | `comparativos` |
| 3 achado-cards (border-top semântica + kicker) | Alertas do período | Sazonalidade (âmbar); concentração crescente HHI 860,3 → 1.352,9 (teal); 21 pacientes 18+ em procedimento pediátrico — em validação (âmbar) | `achados` |
| Note-card | Ressalva de base | "Base: sessões faturadas do procedimento 50005103 (psicologia ABA) por competência; não inclui fono, TO ou fisioterapia; jun/2026 em consolidação." | `meta` |

### 4.2 View Evolução (`#/evolucao`)

Função: tendência, decomposição do crescimento, sazonalidade e projeção.

| Elemento | Pergunta de negócio | Visualização | Dados consumidos |
|---|---|---|---|
| kpi-row (3 células) | Quanto foi e quanto será? | 2025 fechado: R$ 3.080.027,55; S1/2026: R$ 1.513.610,59; run-rate 2026 ~R$ 3,03 mi | `comparativos` |
| `c_custo_mensal` | Qual a tendência do custo? | Linha/área (18 pontos) + média móvel 3m tracejada; extremos com semântica pico/vale (set/2025 e jan/2025 — padrão `c_ciclo`) | `serie_mensal.custo` |
| `c_decomposicao` | O que puxa o crescimento? | 3 linhas indexadas base 100 (jan/2025): pacientes ativos, sessões/paciente, custo/sessão — leitura direta de "volume vs preço" | `serie_mensal` (3 séries) |
| `c_yoy_mensal` | 2026 está acima de 2025? | Barras agrupadas por mês (jan–jun): custo 2025 (teal 45% de alpha) vs 2026 (teal sólido) — padrão `c_conv_yoy` | `serie_mensal` |
| `c_sazonalidade` | Qual o padrão de férias? | Linhas sobrepostas por ano (jan–dez/2025; jan–jun/2026) de sessões/paciente — evidencia o vale dez–fev (2,93 em jan/2026) | `serie_mensal.sessoes_por_paciente` |
| `c_fluxo_pacientes` | A carteira cresce como? | Barras de entradas (verde) e saídas (vermelho, negativo) por mês + linha de ativos; jan/2025 anotado "estoque inicial (390)"; abr/2026 anotado "saídas provisórias (64)" | `entradas_saidas`, `serie_mensal.pacientes_ativos` |
| `c_projecao` | Quanto provisionar? | Linha histórica + 12 meses projetados com faixa (3 cenários calculados **no build**: base = tendência de ativos sazonalizada; contido = estabilização de ativos; expansão = manutenção do ritmo de ~26 entradas/mês) | `projecao` |
| Note-card IBNR | Por que o último mês pode subir? | "82,2% das linhas caem na competência do atendimento; 16,6% chegam com 1 mês de atraso (cauda longa: caso isolado de 13 meses). Jun/2026 ainda consolida." | `qualidade.lag` |

### 4.3 View Prestadores (`#/prestadores`)

Função: quem recebe, a que preço, e onde negociar. **Evolui** (não substitui) a matriz de quadrantes do painel atual.

| Elemento | Pergunta de negócio | Visualização | Dados consumidos |
|---|---|---|---|
| kpi-row | Qual o tamanho da rede? | 84 prestadores em 18m; 30 ativos em jun/2026 (48 em jan/2025); HHI S1/2026 = 1.352,9 | `ranking_prestadores`, `concentracao` |
| Tabela ranking (componente `t-wrap`) | Quem custa quanto? | Tabela ordenável e filtrável, 84 linhas: Prestador · Canal · Custo (R$) · % do total · Sessões · R$/sessão · Pacientes (com k: "<5" em 62 dos 84) · Meses ativos. Linha `.is-own` para Casa Unimed; filtro com normalização NFD; `aria-sort`; sticky header; scroll-hint no mobile | `ranking_prestadores` |
| `c_pareto` | Poucos concentram quanto? | Pareto: barras de custo (top 15 + "demais") + linha acumulada (top 5 = 62,2%; top 10 = 80,5%) | `ranking_prestadores`, `concentracao` |
| `c_dispersao_preco` | Quem cobra fora da curva? | Barras horizontais dos 25 prestadores com ≥100 sessões por R$/sessão (R$ 120,00 → R$ 247,63) com linhas de referência: Casa Unimed R$ 120,00, média da carteira R$ 158,52, mediana do grupo R$ 180,00 | `dispersao_preco` |
| `c_economia_potencial` | Quanto vale negociar? | Barras divergentes: sessões × (preço − referência R$ 158,52) por prestador acima da referência; destaque PEDIAKIDS / ANANDA VIEIRA MORAES / COM AFFETO (≈ R$ 1,17 mi somados; ~R$ 330 mil de gap em 18m); narrativa com ressalva de substituibilidade | `economia_potencial` |
| `c_quadrante` | Qual a ação por prestador? | Bubble evoluída: x = sessões/paciente/mês no prestador, y = R$/sessão, **raio = custo total absoluto** (corrige a limitação autodeclarada do painel 2024), cor = canal; linhas de corte nos valores reais (R$ 158,52; mediana de intensidade 3,11); rótulos de ação por quadrante ("negociar preço", "auditar intensidade", "benchmark", "observar"); plugin de quadrantes com washes e halo herdado do painel atual; legenda HTML com chips `aria-pressed` | `quadrante_prestadores` |
| `c_preco_evolucao` | Houve reajuste tácito? | Linhas de preço médio mensal dos top 5 por custo (18 pontos cada) | `serie_prestador` |
| Modal de prestador (bottom-sheet no mobile) | Como este prestador evolui? | Para os top 15 (88,8% do custo): mini-KPIs (custo, sessões, R$/sessão, pacientes com k) + linha mensal custo/sessões + donut de canal; dados embutidos (sem fetch); charts destruídos ao fechar | `serie_prestador` |
| Achado-card | Cauda longa | "62 dos 84 prestadores atendem menos de 5 pacientes cada — cauda pulverizada (40 prestadores atuam exclusivamente via reembolso; 46 recebem por esse canal)" | `ranking_prestadores`, `tipo_pagamento` |

Ranking de topo esperado (validação visual da F3): Criar e Crescer Teen (ex-Ana Carolina Falcão) R$ 894.940,00 · 6.842 sessões · R$ 130,80/s · 238 pacientes · 19,48%; Casa Unimed R$ 688.200,00 · 5.735 · R$ 120,00 · 212 · 14,98%; Pediakids R$ 631.280,00 · 2.870 · R$ 219,96 · 113 · 13,74%; Cuidarim R$ 365.324,00 · 2.332 · R$ 156,66 · 51 · 7,95%; Ananda Vieira Moraes R$ 279.638,41 · 1.213 · R$ 230,53 · 23 · 6,09%; Com Affeto R$ 262.746,54 · 1.238 · R$ 212,23 · 23 · 5,72%.

### 4.4 View Pacientes (`#/pacientes`)

Função: perfil da carteira, distribuição de custo/intensidade e sinais de auditoria — **somente agregados** (k=5).

| Elemento | Pergunta de negócio | Visualização | Dados consumidos |
|---|---|---|---|
| kpi-row | Quem é a carteira? | 840 pacientes; mediana 3,11 sessões/mês-ativo por paciente; custo mediano por paciente R$ 4.400,00 (18m); permanência mediana 10 meses | `faixa_etaria`, `intensidade`, `custo_paciente`, `permanencia` |
| `c_piramide` | Qual o perfil etário? | Pirâmide etária × gênero (barras espelhadas M/F; buckets 0–2, 3–5, 6–8, 9–11, 12–14, 15–17, 18+; razão 2,78:1) | `faixa_etaria_x_genero` |
| `c_custo_faixa` | Onde está o custo? | Barras: custo por faixa etária — 6–8 anos = 47,0% do custo (R$ 2.159.418,18) com 39,4% dos pacientes | `faixa_etaria` |
| `c_intensidade` | Quantas sessões por mês? | Barras de distribuição da média de sessões/mês-ativo por paciente, buckets pelos cortes reais: <3 (363; 43,2%), 3–4,9 (367; 43,7%), 5–8,9 (84; 10,0%), 9+ (26; 3,1%); anotações da distribuição paciente-mês: p90 = 6 e p99 = 11 | `intensidade` |
| `c_concentracao_pacientes` | O custo concentra? | Barras de percentis de custo/paciente (mediana R$ 4.400,00 · p90 R$ 11.807,80 · p99 R$ 22.162,95 · máx R$ 36.920,00) + destaque "top 10% (84 pacientes) = 28,89% do custo; top 10 absoluto = 6,05%" | `custo_paciente` |
| `c_permanencia` | Quanto tempo em terapia? | Distribuição de permanência (média 9,69 m; mediana 10 m; 91 pacientes nos 18/18 meses); nota de censura à direita | `permanencia` |
| Card "Sinais de auditoria" (achado-cards) | O que auditar caso a caso? | Agregados: máx 114 sessões/paciente-mês (R$ 20.000,00); 44 paciente-mês com >1 prestador simultâneo; 17,89% dos registros sem solicitante = 49,01% do custo; 7 registros de valor zero; 2 registros ≥ R$ 10 mil de um mesmo prestador P.F. de negociação direta (não nomeado — <5 pacientes, regra §6.3); 21 pacientes 18+ (R$ 37.943,73). Prestadores com ≥5 pacientes podem ser nomeados; pacientes nunca; a identificação caso a caso fica na fila privada de auditoria (§6.2) | `qualidade`, `faixa_etaria` |
| Note-card LGPD | Por que não há lista de casos? | "Contagens menores que 5 aparecem como '<5'. A fila nominal de auditoria é artefato privado da operadora, fora deste painel (§6.2)." | `meta.politica_k` |

### 4.5 View Canais de Pagamento (`#/canais`)

Função: mix de contratação, preço por canal e cenário de internalização — a alavanca financeira nº 1.

| Elemento | Pergunta de negócio | Visualização | Dados consumidos |
|---|---|---|---|
| kpi-row | Qual o problema do mix? | Negociação direta: 44,98% do custo a R$ 186,72/sessão; Casa Unimed: 14,98% a R$ 120,00; Reembolso: 2,94% | `tipo_pagamento` |
| `c_mix_mensal` | O mix melhora ou piora? | Barras empilhadas 100% por mês (custo por canal, 18 meses) — evidencia o ganho de participação de Casa/rede que explica a queda do preço médio em 2026 | `tipo_pagamento_mensal` |
| `c_donut_canais` | Foto do acumulado | Donut (cutout 58%) do custo por canal, legenda "Nome (xx,x%)" | `tipo_pagamento` |
| `c_preco_canal` | Quanto custa cada canal? | Barras horizontais: R$ 186,72 · 153,79 · 134,84 · 122,76 · 120,00 · 92,69 por sessão | `tipo_pagamento` |
| Tabela de canais | Detalhe completo | Canal · Custo · % · Sessões · R$/sessão · Pacientes (P.F exibe "<5") · Prestadores (30/10/46/5/1/2) — ex.: Negociação Direta R$ 2.066.085,00 · 44,98% · 11.065 sessões · 227 pacientes · 30 prestadores; Rede Credenciada R$ 1.654.026,00 · 36,01% · 10.755 · 397 · 10; Casa Unimed R$ 688.200,00 · 14,98% · 5.735 · 212 · 1; Reembolso R$ 134.841,14 · 2,94% · 1.000 · 48 · 46; Intercâmbio R$ 45.666,00 · 0,99% · 372 · 13 · 5; P.F R$ 4.820,00 · 0,10% · 52 · "<5" · 2 | `tipo_pagamento` |
| Simulador de internalização | Quanto economizo migrando? | Slider "X% das 11.065 sessões de negociação direta absorvidas pela Casa Unimed a R$ 120,00" → economia = X% × 11.065 × (R$ 186,72 − R$ 120,00), calculada em runtime, exibida em R$/18m e R$/ano; ressalva fixa de capacidade instalada (a Casa atende 212 pacientes hoje) | `tipo_pagamento` (fórmula documentada no Método) |
| `c_proxy_regulatorio` | O risco regulatório cresce? | Linha do share mensal (reembolso + negociação direta) sobre o custo — proxy de insuficiência de rede/antessala de judicialização | `tipo_pagamento_mensal` |
| Note-card Intercâmbio | E os atendimentos fora da área? | "R$ 45.666,00 (0,99%), 372 sessões, 13 pacientes em 5 cooperativas; pico em jun/2026 (R$ 5.562,00)" | `intercambio` |
| Achado-card regulatório | Por que isso importa? | RN 469/2021 e RN 539/2022 (sessões ilimitadas, técnica por prescrição, CID F84); judicialização TEA com 92% de êxito do beneficiário e ABA citada em 66% dos pedidos (Insper/FJLS 2025); TEA/TGD = 9,0% do custo do setor vs oncologia 8,7% (Abramge 2023) | `contexto_regulatorio` |

### 4.6 View Método e Fontes (`#/metodo`)

Estrutura da referência (3 cards serifados + about-grid), conteúdo TEA:

1. **Nota metodológica**: unidade "sessão faturada" ≠ hora de terapia (um registro pode representar bloco negociado — proibido rotular como "horas"); chave de paciente nome+nascimento; agrupamentos do LEIA-ME; mapa de canais; competência vs data de atendimento (lag e selo de consolidação); k-anonimato k=5 e célula "<5"; cruzamento prestador × faixa etária excluído por risco de reidentificação; benchmark de preço interno (Casa R$ 120,00; média R$ 158,52) por inexistência de benchmark público confiável de preço ABA no Brasil; base restrita à psicologia ABA (código 50005103) — fono/TO/fisio fora; fórmula do simulador.
2. **Fontes de dados**: planilha oficial Unimed GV (data de corte e SHA-256 do insumo, exibidos do `meta`); pipeline `scripts/build-tea-data.py` (versão exibida); análise anterior base 2024 rotulada como inferida e aposentada (§2.4).
3. **Contexto regulatório com fontes**: RN 469/2021 e RN 539/2022 (gov.br/ANS), STJ 2023 (cobertura multidisciplinar ampla), Insper/FJLS 2025, Abramge 2023; diretrizes CASP/BACB (intervenção focada 10–25h/semana; abrangente 26–40h — conferir a edição vigente das *ASD Practice Guidelines* da CASP antes de publicar o texto final) apresentadas como benchmark clínico **externo dos EUA, não norma ANS**, com a ressalva de que sessões faturadas não são conversíveis em horas.
4. **Contexto institucional** (about-grid): Operadora Unimed GV; Realização EVS · AxiaCare · Grupo CSV; Responsável Técnico Guilherme Camargo Thomé — CRM-MG 64193; período da base.

---

## 5. Sistema visual

### 5.1 Tokens (paleta Unimed GV, alinhada 1:1 à referência)

A referência já usa a paleta institucional Unimed (`--u-*`) — o painel TEA adota os mesmos tokens, substituindo os divergentes do painel atual (`--u-cloud`, `--u-coal`, `shadow-soft`, radius 16):

| Token | Valor | Uso |
|---|---|---|
| `--u-green` | `#00995d` | nav ativa, séries, borda do insight |
| `--u-green-dark` | `#006b41` | deltas positivos, strong, setas de sort |
| `--u-citrus` | `#8baf1f` | série secundária |
| `--u-dark` / `--u-dark-2` | `#004e4c` / `#003c3a` | sidebar, tabbar, títulos, números de KPI, tooltip |
| `--u-orange` | `#f47920` | canal Negociação Direta (semântica de atenção) |
| `--u-paper` / `--card` | `#fafaf7` / `#ffffff` | fundo da página / cards |
| `--line` / `--line-soft` | `#dfe3db` / `#eef0ea` | bordas — cards **sem sombra** (`--shadow-card: none`) |
| `--ink` … `--ink-4` | `#103f3d` `#3f6260` `#5c7f7d` `#8aa3a1` | hierarquia de texto |
| `--green-100` / `--green-200` | `#eef7f0` / `#d9eee1` | chips, insight, hovers |
| `--red` / `--amber` | `#c0392b` / `#b7791f` | negativo / alerta |
| Radii | pills `9999px`; cards `12px`; kpi-grid/note `14px`; t-wrap `16px`; card mobile `18px`; modal `24px` | idem referência |
| Layout | `--sidebar-w: 250px`; `--topbar-h: 64px`; `--tabbar-h: 62px`; content `max-width: 1280px` (padding 26px 30px 46px) | idem referência |

**Paleta semântica de canais** (fonte única em JS, CVD-consciente, contraste verificado): Casa Unimed `#00995d`; Rede Credenciada `#004e4c`; Negociação Direta `#f47920`; Reembolso `#c0392b`; Intercâmbio `#2a78d6` (azul CVD-safe herdado do painel atual); Neg. Direta P.F `#8aa3a1`. Séries temporais neutras usam TEAL/GREEN como na referência.

### 5.2 Tipografia

**Source Sans 3** (300–700 + itálico 400) para tudo estrutural e numérico; **Source Serif 4** (400, 600 + itálico 400) **reservada à anotação editorial** — subtítulos de card, leads de view, subs de KPI, pullquote e nota metodológica. Substitui o par Inter/Source Serif do painel atual. Títulos em peso 650; números sempre `tabular-nums` com formatação pt-BR (`Intl.NumberFormat('pt-BR')`, vírgula decimal). Escala: KPI 27px → status 24px → topbar 19px → card-title 14,5px → corpo/narrativa 13px → card-sub/chip 11,5px → labels uppercase 10–11px (letter-spacing 0,9–1,4px, w700). Google Fonts com truque `media="print"` + `<noscript>` e `preconnect`.

### 5.3 Componentes reutilizados da referência

`kpi-grid` hero (grade única com bordas internas, não cards soltos) · `kpi-row` de mini-KPIs com deltas coloridos por sinal · `status-card` com `data-goto` · card de gráfico (`card-hd` + `chart-box` de altura fixa + parágrafo `narrative` interpretativo) · `sec-label` divisor com linha · `insight` pullquote serif com `<cite>` · `achado-card` com border-top semântica e kicker · `chips` (padrão e `soft`) · `note-card` de ressalva · tabela `t-wrap` (sticky header, sort com aria, filtro pill, contador "X de Y", scroll-hint) · modal/bottom-sheet de prestador · toast de interatividade (1x por sessão via `sessionStorage`) e pulse no primeiro chevron · bloco Método · footer multi-logo com separadores.

**Identidade (o que muda vs referência):** logo do topo da sidebar = Unimed GV (`assets.grupocsv.com/logos/unimed-gv/box-pinheiro.png`, fundo escuro; `sem-box-pinheiro.png` no footer claro) — no painel TEA a operadora é a dona do painel, não um hospital; rodapé mantém EVS (`evs/selo-white-web-360.png` na sidebar; `evs/icon-1x1-sem-fundo.png`, `axiacare/horizontal-positivo.svg` e `grupo-csv/horizontal-positivo-transparente.png` no footer claro), créditos "Realização: Escritório de Valor em Saúde / AxiaCare · Grupo CSV" e responsável técnico; títulos, descrições OG e `og.png` (1200×630) regenerados para o painel TEA; `theme-color #004e4c` permanece (cor Unimed). **OG da variante pública**: como o `open_page_publish` só envia o `html_content` (sem arquivos irmãos), o `og:image` da cópia pública aponta para imagem hospedada no hub (`https://hub.grupocsv.com/assets/og/og_tea.png`) — alternativa, se preferir o asset no próprio slug: upload multi-arquivo pelo painel `open.grupocsv.com/_admin/`.

### 5.4 Gráficos (Chart.js)

Chart.js **4.5.1** com versão fixada (como a referência; o painel atual usa 4.4.4) via cdn.jsdelivr.net. Defaults globais idem referência: fonte Source Sans 3 tamanho 11,5, cor `#5c7f7d`, `borderColor #e5e8e2`; tooltip `rgba(0,60,58,0.96)`, radius 10, `displayColors: false`, labels iniciando com espaço; legend bottom/start quando exibida (box 10); `responsive: true` + `maintainAspectRatio: false` dentro de `.chart-box` com alturas fixas (`short` 220 / padrão 300 / `med` 330 / `tall` 380; mobile 260/340); grid y `#f0f2ec`, x oculto; ticks pt-BR. Padrões herdados: linha com área de 8% de alpha; barras horizontais com degradê de opacidade por posição; pontos extremos com semântica pico/vale; bubble do quadrante com plugin custom (washes ~5%, linhas de corte tracejadas, rótulos com halo branco — herdado do painel atual, recalibrado para os cortes reais).

### 5.5 Comportamento responsivo detalhado

| Faixa | Comportamento |
|---|---|
| Desktop (>1150px) | Sidebar sticky 250px (100dvh) + topbar sticky 64px com blur + content 1280px; `.grid-2` em 2 colunas; kpi-grid 3×2 |
| ≤1150px | Cards de achados em 1 coluna |
| ≤1023px | Sidebar some; **tabbar fixa 62px** aparece (5 tabs em grid, `padding-bottom: env(safe-area-inset-bottom)`); topbar ganha logo mobile + botão ⓘ (→ `#/metodo`); `.grid-2` → 1 coluna; modal vira **bottom-sheet** (radius 20px 20px 0 0, max-height 100dvh); content padding compensa a tabbar |
| ≤640px | Chips e subtítulo da topbar somem; kpi-grid → 2 colunas (bordas internas recalculadas via `nth-child`); número de KPI 27→22px; alturas de gráfico 300→260 / 380→340; **scroll-hints** visíveis ("Deslize para ver a tabela completa →"); card padding 16px e radius 18px; ticks reduzidos (9–10,5px conforme viewport) |
| Sempre | Inputs de filtro com `font-size: 16px` (anti-zoom iOS); tabelas com `min-width` + `overflow-x: auto`; touch targets ≥40px; `@media print` básico (tabbar oculta) |

---

## 6. Pipeline de dados e LGPD

Contexto duro: **o repo `grupocsv/hub` é público** (GitHub API: `"private": false`; deploy GitHub Pages → hub.grupocsv.com). Regra de ouro: **o conteúdo commitado já precisa ser publicável** — a autenticação controla audiência; a anonimização controla o risco. O CSV é dado pessoal **sensível de menores** (LGPD art. 5º II, art. 11, art. 14); o tratamento pela contratante de gestão é legítimo (tutela da saúde, art. 11 II), mas exposição pública seria incidente com dever de comunicação à ANPD.

### 6.1 Onde vive o dado bruto (nunca no repo)

- **Primário**: pasta local `~/GrupoCSV/dados-sensiveis/unimed-tea/`, fora de qualquer working copy git e de sync público, em disco criptografado.
- **Backup**: bucket **R2 privado novo** (ex.: `csv-dados-sensiveis`), separado do bucket público do Open Pages; chave `unimed-tea/raw/tea-AAAA-MM.xlsx` (sem dado pessoal no nome do objeto). Rejeitados: bucket do Open Pages (conteúdo público), repo privado GitHub (governança fraca — colaboradores, forks, mudança de visibilidade); Drive apenas como plano C.
- **`.gitignore` ganha**: `*.xlsx`, `unimed/data/raw/`, `**/tea-microdados*`, `**/*beneficiario*`.
- **Versionável no repo público, e só isso**: `unimed/data/tea-2025-2026.json` (agregados k-anonimizados), `scripts/build-tea-data.py`, `unimed/tea.html` gerado, documentação sem exemplos reais de beneficiário.

### 6.2 `scripts/build-tea-data.py` (novo)

`python3 scripts/build-tea-data.py <caminho-externo>/tea-2026-06.xlsx --corte 2026-06-30`

- **Entrada**: xlsx (openpyxl) ou `--csv`, sempre fora do repo; o script **recusa insumo localizado dentro da árvore do repositório** (aborta).
- **Transformações**: regras do LEIA-ME (§2.3) — chave nome+nascimento, fusão Casa Unimed por registro (8 prestadores; caso Neilson documentado), merge de CNPJ Criar e Crescer/Ana Carolina Falcão, mapa de canais. **Idade = anos completos (aniversário) na data de corte** — método fixado para eliminar divergência de borda entre builds (divisão por 365,25 produz off-by-one: 330 vs 331 na faixa 6–8).
- **Saídas**: (a) `unimed/data/tea-2025-2026.json`, artefato canônico auditável; (b) o mesmo JSON **injetado** em `unimed/tea.html` num bloco `<script type="application/json" id="tea-data">` entre marcadores `<!-- TEA-DATA:BEGIN -->` / `<!-- TEA-DATA:END -->`; (c) `--emit-public`: deriva a variante pública (§6.6) em diretório de build não versionado; (d) `--auditoria`: grava **fora do repo**, na pasta sensível local, a fila nominal de auditoria (paciente-mês acima do p99, multi-prestador simultâneo, registros ≥ R$ 10 mil, valor zero) para uso interno da operadora — **jamais commitada ou publicada**.
- **Validações obrigatórias (qualquer falha → exit ≠ 0 e nada é escrito)**: somas de buckets etários, gênero e intensidade == 840; soma financeira da série mensal == ranking == canais == **R$ 4.593.638,14**; sessões == **28.979**; varredura anti-vazamento (nenhum valor das colunas Nome/Matrícula do insumo aparece como substring do JSON serializado); verificação k (nenhuma contagem de pacientes < 5 em claro); **verificação de evento extremo único** (registro ≥ R$ 10 mil ou paciente-mês acima do p99 de prestador com <5 pacientes não pode sair com nome do prestador + competência juntos); relatório de build impresso (totais, células suprimidas, SHA-256 do insumo).

### 6.3 K-anonimato (k = 5) — aplicação com os dados reais

Regra: toda **contagem de pacientes** < 5 é publicada como a string `"<5"` (ou a célula é fundida com vizinha); valores financeiros e de sessões permanecem exatos — não identificam indivíduo. Checagem automática a cada build (dado futuro pode rebaixar células hoje válidas).

| Corte | Situação hoje | Ação |
|---|---|---|
| Faixa etária (7 buckets) | mínimo 20 (faixa 0–2) | publica |
| Faixa etária × gênero | mínimo exato 5 (0–2 feminino) | publica; vigiar a cada build |
| Ranking de prestadores | **62 de 84** prestadores com <5 pacientes | coluna Pacientes exibe "<5"; custo/sessões exatos |
| Canais | Negociação Direta (P.F) = 2 pacientes | "<5" |
| Intensidade (buckets <3 / 3–4,9 / 5–8,9 / 9+ — o único esquema do JSON, §6.4) | 363 / 367 / 84 / 26 — mínimo 26 | publica sem supressão; regra k re-checada a cada build |
| Evento extremo único (registro ≥ R$ 10 mil; paciente-mês > p99) | 2 registros de um prestador P.F. com 3 pacientes | prestador **não nomeado** junto de competência+evento quando tiver <5 pacientes (nominal só na fila privada de auditoria) |
| Prestador × faixa etária | 140 de 175 células <5 (80%) | **cruzamento excluído do JSON** (não apenas suprimido) |
| Idades individuais dos 21 adultos | lista 18–78 potencialmente identificável | só o bucket 18+ agregado; sem lista, sem cruzamento com prestador |

### 6.4 Contrato de dados (JSON embutido — decisão: sem fetch em runtime)

O painel lê `JSON.parse(document.getElementById('tea-data').textContent)`. Rejeitados: fetch de `unimed/data/*.json` — a via de republicação da cópia pública (`open_page_publish`) envia apenas o `html_content`, sem arquivos irmãos, e o fetch quebraria a abertura offline/file:// (nota: o Worker do Open Pages *serve* paths irmãos — a própria referência faz `fetch('/painel-cirurgico/data.json')` — mas exigiria upload multi-arquivo fora do rito §6.5); rejeitado também endpoint R2 público (agregados fora do gate, superfície extra). **Nenhum array com granularidade paciente/guia existe no JSON** — Nome, Matrícula, Nascimento e Número de Guia nunca aparecem.

Blocos (núcleo definido no pipeline + extensões v2, todas agregadas e sujeitas ao mesmo k):

| Bloco | Conteúdo | Consumidores |
|---|---|---|
| `meta` | data de corte, data de geração, versão do script, SHA-256 do insumo, contagens, `politica_k: 5` | topbar, Método |
| `serie_mensal` | 18 pontos: custo, sessões, pacientes ativos, registros, custo/sessão, sessões/paciente, prestadores ativos | Visão, Evolução |
| `comparativos` | totais 2025, S1/2025, S1/2026, YoY (+7,13% / +8,97%), run-rate | KPIs |
| `ranking_prestadores` | 84 itens: custo, sessões, pacientes (k), R$/sessão, canal, meses ativos, participação | Prestadores |
| `serie_prestador` | top 15: custo/sessões/preço mensais (sem contagem mensal de pacientes) | modal, `c_preco_evolucao` |
| `quadrante_prestadores` | x, y, raio (custo absoluto) e canal por prestador elegível | quadrante |
| `dispersao_preco` | 25 prestadores ≥100 sessões (min/mediana/máx) | dispersão |
| `economia_potencial` | gap × sessões por prestador acima da referência | economia |
| `concentracao` | shares top 5/top 10, HHI 2025 / S1-2026 / período | Pareto, KPIs |
| `tipo_pagamento` + `tipo_pagamento_mensal` | acumulado e série mensal por canal | Canais |
| `intercambio` | total, série mensal, cooperativas | note-card |
| `faixa_etaria`, `faixa_etaria_x_genero` | buckets 0–2 … 18+ | Pacientes |
| `intensidade` | buckets únicos do contrato: <3 / 3–4,9 / 5–8,9 / 9+ (média de sessões/mês-ativo por paciente) + percentis paciente-mês | Pacientes |
| `custo_paciente`, `permanencia`, `entradas_saidas` | distribuições e percentis agregados | Pacientes, Evolução |
| `qualidade` | % sem solicitante (total e por canal), CBOS agregado, lag, valor zero, registros ≥10k (com prestador), retroativos | auditoria, note-cards |
| `projecao` | 12 meses × 3 cenários, índice sazonal, premissas em texto | `c_projecao` |
| `achados`, `contexto_regulatorio` | textos curtos gerados/curados no build, com fontes | achado-cards, Método |

Orçamento do JSON: ≤ 120 KB (o corte de `serie_prestador` em top 15 é o principal controle de peso).

### 6.5 Ciclo de atualização operacional (rito de 10 passos)

1. Receber a planilha nova → salvar em `~/GrupoCSV/dados-sensiveis/unimed-tea/tea-AAAA-MM.xlsx` (nunca no repo).
2. Backup no R2 privado (`unimed-tea/raw/…`).
3. `git pull` no hub.
4. Rodar `build-tea-data.py <xlsx> --corte AAAA-MM-DD` → regenera JSON + injeta no HTML; conferir o relatório de validação.
5. Conferir `unimed/tea.html` no navegador local.
6. **Revisão humana do `git diff`** — deve conter apenas agregados (nenhum nome de criança/matrícula).
7. `git add` com **paths explícitos** (`unimed/tea.html unimed/data/tea-2025-2026.json`) + commit + push → GitHub Pages publica o hub.
8. Republicar a cópia pública: `open_page_publish` com slug **`painel-tea`** (mesma slug, preserva a URL). O `og:image` da variante pública aponta para o asset do hub (§5.3) — não precisa de upload extra.
9. **Confirmar o auth gate ativo** no slug `painel-tea` — pré-condição, não opcional.
10. Registrar data de corte/versão (já presentes no `meta`) e manter a nota do menu em `unimed/tools-overrides.json`.

Documentar o rito em skill do repo (ex.: `skills/tea-data-pipeline.md`, referenciada em `skills/public-pages.md`), para que qualquer sessão futura siga o mesmo procedimento.

### 6.6 Dupla publicação (fonte única, duas variantes)

O build gera as duas variantes do mesmo conteúdo e dos mesmos dados:

- **Interna** — `hub.grupocsv.com/unimed/tea.html`: mantém `<span id="hub-auth-slot" data-hub-auth-theme="dark">` no header e `<script src="/scripts/hub-auth.js" data-portal="unimed">` como último script do body (contrato que corrigiu a sobreposição do botão Sair); link "← Hub Unimed"; listada no menu via `tools.json` gerado no CI.
- **Pública** — `open.grupocsv.com/painel-tea/`: derivada por `--emit-public` **sem** hub-auth, sem link para o hub e com assets absolutizados. **Gate de senha = padrão do Worker csv-open-pages** (decisão de padronização do Guilherme, 10/07/2026): o slug carrega `auth_gate: true` nos metadados (ativado ANTES de qualquer upload de conteúdo) e o Worker injeta o gate institucional no servidor — e-mail corporativo + senha compartilhada validados server-side pelo csv-open-auth (campo `senha`), sessão de 4h, notificação de acesso. **Proibido embutir gate customizado** (um `id="gate"` no HTML suprime o gate padrão; o pipeline agora ABORTA se detectar). A "Opção C" original (gate embutido) foi aposentada em 10/07/2026 após causar exatamente o desvio de padrão que ela tentava evitar: a regra vigente para slug novo é criar → ativar `auth_gate` → só então subir conteúdo. Não listada no menu do portal (decisão consciente pré-existente). Como o conteúdo já é 100% agregado e k-anonimizado, o gate é defesa em profundidade — não a única barreira.

**Modelo de exposição, dito sem eufemismo:** na variante interna, o `hub-auth` é um overlay client-side de controle de audiência/UX — o HTML completo (com o JSON embutido) é servido pelo GitHub Pages antes do login, `unimed/data/tea-2025-2026.json` fica world-readable em hub.grupocsv.com e ambos são indexados pelo R2 AI Search (`sync-r2-ai-search.yml` inclui `*.html`/`*.json`). Nenhuma das duas variantes tem barreira de conteúdo real; **a anonimização k=5 do build é a única proteção efetiva** — por isso ela é bloqueante (exit ≠ 0), não advisória.

---

## 7. Requisitos não-funcionais

### 7.1 Acessibilidade (preservar as conquistas do painel atual e cobrir os componentes novos)

- `aria-sort` dinâmico e **`<button>` reais** nos cabeçalhos ordenáveis; chips de legenda como botões com `aria-pressed`.
- Todo `canvas` com `role="img"` + `aria-label` apontando para a tabela/texto equivalente.
- Busca com normalização de acentos (`normalize('NFD')` — "espaco" encontra "ESPAÇO" e vice-versa).
- `focus-visible` com outline verde em links, botões, inputs e th; `aria-current="page"` na navegação sincronizada (sidebar + tabbar); operação 100% por teclado.
- Modal: `role="dialog"` + `aria-modal`, foco no botão fechar, Escape fecha, scroll do body restaurado ao fechar.
- Rótulos sobre gráficos com halo (`strokeText`) para não serem encobertos; paleta categórica CVD-consciente com contraste verificado.
- **Novos**: `prefers-reduced-motion` desliga `viewIn`, pulses e transições; tabbar e botão ⓘ com `aria-label`.

### 7.2 Performance (orçamento de peso)

- Lição do painel atual: reconstrução Plotly 3,4 MB → ~40 KB. Orçamento v2: **HTML final ≤ 300 KB** (alvo 250 KB), sendo **JSON embutido ≤ 120 KB**; zero imagens locais (logos remotas de assets.grupocsv.com); nenhum framework.
- Uma única dependência de runtime: Chart.js 4.5.1 (CDN, `defer`, versão fixada). Fontes com `media="print"` onload + `preconnect`.
- Lazy-render por view (gráficos só na primeira visita); charts do modal destruídos ao fechar (`activeCharts`); dados pré-agregados no build — **nunca** processar micro-dados no navegador.

### 7.3 Degradação sem CDN

- Gate global `typeof Chart === 'undefined'`: cada `.chart-box` é substituído por bloco de fallback apontando para a tabela/valor equivalente (o painel atual cobre 1 gráfico; o v2 cobre **todos**).
- KPIs, tabelas, narrativas, simulador e navegação funcionam 100% sem CDN e **offline/file://** (dados embutidos, sem fetch).
- Segurança de DOM: dados renderizados só via `createElement`/`textContent` (nunca `innerHTML` com dados); `'use strict'`.

### 7.4 Compatibilidade e integração

- Manter o nome `unimed/tea.html` — preserva menu, OG url (`https://hub.grupocsv.com/unimed/tea.html`) e links externos; o guard-rail `check-portal-links.py` roda fail-fast no deploy.
- Slot hub-auth intacto (§6.6); critério herdado: nenhum elemento clicável coberto pelo widget de logout.
- Metas OpenGraph regeneradas (título/descrição TEA, `og.png` própria, `theme-color #004e4c`); favicons do padrão.
- Nota do menu atualizada em `unimed/tools-overrides.json` (a atual descreve a reconstrução de jul/2026; nunca editar o `tools.json` gerado à mão).

---

## 8. Plano de execução em fases (critérios de aceite verificáveis)

**F0 — Pipeline e dados (fundação).** Entregas: `scripts/build-tea-data.py`, `unimed/data/tea-2025-2026.json`, `.gitignore` atualizado, **fixture 100% sintética** `scripts/tests/tea-fixture-sintetica.csv` (nomes fictícios, versionável, exercitando todas as regras do LEIA-ME: multi-carteirinha, fusão Casa Unimed inclusive o caso Neilson, merge de CNPJ, célula <5, evento extremo único), bucket R2 privado criado (mediante §11.5).
Aceite: (a) o relatório do build com o insumo real reproduz **R$ 4.593.638,14 / 28.979 sessões / 840 pacientes / 84 prestadores / 18 competências** (roda só na máquina local com o xlsx); (b)–(e) rodam **contra a fixture sintética**, reproduzíveis em qualquer máquina ou CI: (b) insumo dentro do repo → aborta; (c) teste de mutação: remover 1 paciente da fixture → somas revalidam ou o build falha; (d) grep do JSON serializado não encontra nenhum nome/matrícula do insumo; (e) nenhuma contagem de pacientes < 5 em claro e nenhum evento extremo nomeado de prestador <5 pacientes; (f) JSON ≤ 120 KB.

**F1 — Shell + design system.** Entregas: app-shell (sidebar/topbar/content/tabbar), hash router com lazy-render, tokens, tipografia, componentes base, view Método completa.
Aceite: 6 rotas deep-linkáveis com back/forward; `aria-current` sincronizado sidebar/tabbar; breakpoints 1150/1023/640 conforme §5.5 (verificação visual em 360, 768, 1280 e 1440 px); página funcional sem Chart.js; Lighthouse acessibilidade ≥ 95.

**F2 — Visão Geral + Evolução.** Aceite: os 6 KPIs hero e todos os pontos das séries batem 1:1 com o JSON (script de conferência compara JSON × DOM); selo "em consolidação" presente em jun/2026; projeção rotulada como cenário com premissas visíveis; fallback sem CDN presente em todos os gráficos da fase.

**F3 — Prestadores + Canais.** Aceite: tabela com 84 linhas, sort e filtro com acentos funcionando, coluna Pacientes com "<5" nos 62 casos; topo do ranking confere com §4.3; quadrante com raio proporcional ao custo absoluto; modal abre/fecha por teclado e destrói charts; simulador calcula pela fórmula documentada e exibe a ressalva de capacidade; empilhado mensal soma 100% em todos os 18 meses.

**F4 — Pacientes.** Aceite: pirâmide e distribuições somam 840; nenhuma célula < 5 em claro em nenhuma visualização (auditoria manual + verificação automática do build); card de auditoria só com agregados e nomes de prestador; note-card LGPD presente.

**F5 — Integração e publicação dupla.** Entregas: variantes interna e pública, OG/favicons (og público apontando para o asset do hub, §5.3), `tools-overrides.json`, skill do rito, aposentadoria do `tea-reconstructed-2024.json` (campos novos `superseded`/`superseded_by`; rótulo de inferência preservado).
Aceite: `check-portal-links.py` verde; widget de auth não cobre nenhum clicável; `open.grupocsv.com/painel-tea/` responde com gate ativo **antes de qualquer dado** (requisição sem sessão não vaza conteúdo); as duas URLs exibem os mesmos números; `git log` do ciclo completo sem qualquer dado sensível.

**Ordem de grandeza de esforço** (sessões de trabalho de agente, ~meio período cada): F0 ≈ 1–2 · F1 ≈ 1 · F2 ≈ 1 · F3 ≈ 1–2 · F4 ≈ 1 · F5 ≈ 1. Total ≈ 6–8 sessões; F0 é pré-requisito de tudo; F2–F4 podem intercalar; F5 fecha.

**Critérios de sucesso do produto (pós-lançamento):** (1) o painel v2 substitui o painel 2024 como fonte citada em reunião de diretoria/rede da Unimed GV; (2) ao menos 1 renegociação de preço instruída com o gráfico de economia potencial ou o simulador de internalização; (3) o rito de atualização executado de ponta a ponta por uma sessão futura (ou pelo Manus) sem intervenção manual além dos 10 passos; (4) zero incidentes LGPD.

---

## 9. Riscos e mitigação

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| 1 | Vazamento de dado sensível de menor (nome, matrícula, nascimento, guia) em HTML, JSON, commit ou R2 AI Search | Incidente LGPD grave (comunicação à ANPD) | Bruto nunca no repo; varredura anti-vazamento e k=5 automáticos no build (abort); revisão humana do diff; `git add` com paths explícitos; secret scanning no 1º ciclo; nada sensível commitado = nada a expurgar (se ocorrer: BFG/filter-repo + avaliação ANPD) |
| 2 | Reidentificação por cruzamento de agregados (prestador pequeno × faixa etária × mês) | LGPD | Cruzamento prestador×faixa **excluído**; contagens k=5; sem lista de idades de adultos; fila nominal de auditoria só como artefato privado local |
| 3 | Quebrar o slot hub-auth (regressão já ocorrida no hub) | Widget de logout sobrepõe o header | Manter o contrato exato (`id="hub-auth-slot"`, tema dark, script no fim do body); critério de aceite em F5 |
| 4 | Republicar a cópia pública **sem** gate, ou com gate duplicado | Dados de saúde expostos / UX quebrada | Gate embutido com marcador `id="gate"`; passo 9 do rito como pré-condição; teste sem sessão em F5 |
| 5 | Esquecer a republicação pública (duas "verdades" divergentes) | Diretoria decide com dado velho | Passo 8 do rito; aceite F5 exige paridade de números entre as duas URLs |
| 6 | Regressão de acessibilidade/robustez (aria-sort, botões reais, NFD, gate de CDN, zoom iOS) | Exclusão de usuários; painel frágil | Checklist §7.1 como critério de aceite por fase; fallback sem CDN para **todos** os gráficos |
| 7 | Misturar 2024 inferido com 2025–26 oficial | Viola a meta do hub ("nenhum dado inferido sem rótulo") | `tea-reconstructed-2024.json` marcado superseded; 2024 só em nota rotulada no Método; nunca em gráfico |
| 8 | Ignorar as regras do LEIA-ME em cálculo futuro | Contagens infladas (884 vs 840; 91 vs 84), série incomparável | Regras hard-coded no script único de build; validações de soma; proibido calcular fora do pipeline |
| 9 | Inflação de peso (repetir o Plotly de 3,4 MB) | Painel lento no mobile | Orçamento §7.2 verificado no build (falha se HTML > 300 KB); `serie_prestador` limitado a top 15 |
| 10 | Quebrar menu/links (renomear arquivo, href morto) | Deploy reprovado (fail-fast) ou link quebrado | Manter `unimed/tea.html`; `check-portal-links.py` no CI; nota via `tools-overrides.json` |
| 11 | Leitura indevida de "sessões" como "horas", ou da projeção como compromisso | Decisão clínica/financeira equivocada | Ressalvas fixas no Método e nas narrativas; projeção sempre "cenário"; benchmark CASP/BACB rotulado como externo |
| 12 | Sensibilidade política de nomear prestadores caros na cópia compartilhável | Atrito com a rede credenciada | Já é prática do painel atual (interesse legítimo de gestão da rede); tom factual nas narrativas; validação final do Guilherme (§11.2) |
| 13 | Último mês subestimado (lag de faturamento) | Falso alarme de queda | Selo "em consolidação"; projeção por competência; note-card IBNR |

---

## 10. Limitações e fora de escopo (o que os dados não suportam)

O painel dirá isso explicitamente na view Método — honestidade metodológica é requisito:

1. **Horas prescritas vs realizadas** — não há prescrição, plano terapêutico nem duração de sessão; "Quantidade" = sessões **faturadas**. Nunca rotular como horas de terapia (um registro pode representar bloco negociado).
2. **Visão multidisciplinar** — a base cobre **apenas psicologia ABA (50005103)**; fono, TO, fisioterapia, psicopedagogia e consultas do mesmo paciente estão fora — o custo TEA total da operadora é maior que o exibido.
3. **Desfecho clínico/efetividade** — sem VB-MAPP, Vineland ou alta terapêutica; custo não relacionável a resultado.
4. **Negativas, NIPs e judicialização direta** — sem status de autorização ou ação judicial por guia; exposição judicial só por proxy (share de reembolso + negociação direta).
5. **Sinistralidade/per capita** — sem denominador de vidas expostas nem receita; só a despesa do procedimento.
6. **Gravidade/CID** — sem nível de suporte TEA; a intensidade não é ajustável por gravidade.
7. **Glosas** — só o valor pago final; sem apresentado vs pago.
8. **Capacidade instalada da rede** — sem agenda/fila; decisões de credenciamento e o simulador de internalização exigem esse dado externo.
9. **Benchmark de preço Brasil** — não existe fonte pública confiável de preço por sessão ABA; referências são internas (Casa R$ 120,00; média da carteira R$ 158,52).
10. **Série 2024** — sem micro-dados oficiais de 2024; a série começa em jan/2025 (a reconstrução 2024 é inferida e fica fora dos gráficos).
11. **Fora de escopo v2** (candidatos a v2.x): matriz de migração de pacientes entre canais e heatmap de coortes (dependem de k-check célula a célula); matriz solicitante × executante (validação política pendente); dark mode; export PDF/CSV do painel.

---

## 11. Perguntas em aberto para o Guilherme

> **Respostas do Guilherme (09–10/07/2026) — perguntas encerradas:**
> **1. Adultos 18+:** perfil detalhado apresentado (11 de 21 são jovens de 18–21 anos em continuidade de cuidado; 10 casos de 22–78 anos com uso pontual, prováveis erros de codificação a validar). Card permanece "em validação com a operadora".
> **2. Prestadores nomeados na cópia pública:** AUTORIZADO ("Pode nomear").
> **3. Matriz solicitante × executante:** APROVADA ("Quero") — implementada na view Prestadores (card "Quem prescreve para quem": gráfico + tabela dos 12 maiores solicitantes, cobertura de 51,0% do custo, concentração ≥80% destacada; bloco `solicitante_executante` no pipeline, sem contagens de pacientes).
> **4. Fila nominal de auditoria:** destinatário é o EVS, por e-mail; teste iniciado com guilherme.thome@unimedgv.com.br e naline.rocha@unimedgv.com.br (emissão de teste enviada pelo csv-mail). Formato/periodicidade a calibrar com o retorno deles.
> **5. Bucket R2 privado:** AUTORIZADO — `csv-dados-sensiveis` criado em 09/07/2026.
> **6. Projeção na cópia pública:** sem objeção manifestada; mantida nas duas variantes até ordem em contrário.

1. **Adultos 18+** (21 pacientes, idades até 78, R$ 37.943,73 num código pediátrico): validar com a Unimed GV se é codificação equivocada ou cobertura legítima **antes** de o painel público rotular como inconsistência — até lá o card usa linguagem neutra ("em validação com a operadora"). Como prefere tratar?
2. **Nomear os prestadores caros na cópia pública com gate** (Pediakids, Ananda Vieira Moraes, Com Affeto, com "economia potencial" em R$): o link circula na diretoria da Unimed e pode chegar à rede. Mantém nominal (recomendação — já é prática do painel atual) ou anonimiza apenas o gráfico de economia na variante pública?
3. **Matriz solicitante × prestador executante** (quem prescreve para quem): os dados existem e os nomes são de profissionais, mas a análise marcou "validar politicamente antes de publicar". Entra na v2, guarda para v2.x, ou descarta?
4. **Fila nominal de auditoria** (`--auditoria`, artefato privado local, fora do repo e do painel): o script deve gerá-la para a equipe de auditoria da operadora? Em caso positivo, quem recebe e por qual canal?
5. **Bucket R2 privado `csv-dados-sensiveis`**: autoriza a criação (backup do bruto) já na F0?
6. **Cenários de projeção na cópia pública**: a projeção 12m (3 cenários) pode constar na versão com gate compartilhada com a Unimed, ou fica restrita à versão interna do hub?

---

*Fim do PRD. Todos os valores citados foram extraídos das análises validadas dos micro-dados oficiais (jan/2025–jun/2026); nenhum número foi recalculado fora do pipeline descrito no §6. Nenhum nome, matrícula ou data de nascimento de beneficiário consta neste documento.*

---

## 12. Camada "Coorte CTE" (implantada em 11/07/2026)

Segunda fonte auditada, incorporada como **seção única com selo** (decisão do Guilherme: universo distinto, mesmo painel — a comparação é o valor).

- **Universo:** coorte fixa de **300 beneficiários** do Centro de Terapias Especiais (Casa Unimed GV), consumo **integral e multidisciplinar**, 2024–fev/2026 (E2: série a partir de 2024, ano-base completo). Fonte: censo EVS/IBRAVS.
- **Pipeline dedicado:** `scripts/build-cte-data.py` (mesma blindagem LGPD: xlsx bruto fora do repo, k=5, anti-vazamento bloqueante, sem cruzamento CID×nível×idade). Saída `unimed/data/cte-agregados.json`, injetada entre `<!-- CTE-DATA:BEGIN/END -->`. Fixture sintética `scripts/tests/cte-fixture-sintetica.csv` + `--selftest`.
- **Conteúdo (E1/E3/E4):** cobertura (o painel principal vê **21,7%** do custo da coorte; R$ 4,0 mi invisível), custo por disciplina + série empilhada mensal (Psicologia, Fono, TO, Psicopedagogia, Nutrição, consultas, exames…), perfil clínico (CID agrupado, **nível de suporte × custo médio** — R$ 17,2 mil no Nível I → R$ 31,6 mil no Nível III, idade média ao diagnóstico 4,2 anos), intensidade multidisciplinar (**65% fazem 3+ terapias**), concentração (Gini 0,45).
- **Selo obrigatório** "Coorte CTE · 300" em banner e em cada card; aviso na Visão Geral aponta para a seção. Nunca somar/comparar com os 840 da psicologia ABA.
- **Escopo da base 840 (decisão):** permanece só ABA-psicologia com aviso de escopo, até a Unimed enviar a base multidisciplinar dos mesmos beneficiários (pedido para o próximo ciclo) — aí o painel inteiro migra para multidisciplinar.

---

## 13. Cópia compartilhável no `/p/` e correção da regra de gate (11/07/2026)

**Decisão do Guilherme:** o painel TEA é ferramenta do **ambiente da Unimed**, então a cópia compartilhável mora no **domínio do hub** via `/p/` (`hub.grupocsv.com/p/painel-tea/`), gerada do repositório (`scripts/build-tea-data.py --emit-p` → `p/painel-tea/index.html`, registrada em `p/registry.json`). Publica **sozinha no deploy do git** — acaba a republicação manual que deixava a Open Page velha. A Open Page `open.grupocsv.com/painel-tea/` foi **aposentada**.

**Correção da regra de gate (a regra de 10/07 estava ampla demais):**
- A proibição *universal* de "gate embutido" foi generalização indevida do agente — a instrução do responsável foi apenas "padronizar o gate". A causa raiz do bug de "Acesso negado" foram dois defeitos concretos: campo `password` (o `csv-open-auth` lê `senha`) e `auth_gate` ausente no KV — não a existência do gate embutido.
- **Regra correta e escopada:** nas **Open Pages** (open.grupocsv.com, com Worker) o gate é do **worker** (`auth_gate:true`, injeção server-side) — não embutir. No mecanismo **`/p/`** (hub, estático via GitHub Pages, **sem worker**) o **gate embutido** (`id="gate"`, POST ao `csv-open-auth` com campo `senha`, botão "olhinho") é o mecanismo **correto e único possível**.
- O pipeline `--emit-p` embute o gate correto; as versões anteriores que abortavam ao encontrar `id="gate"` refletiam a regra ampla demais e foram substituídas.
