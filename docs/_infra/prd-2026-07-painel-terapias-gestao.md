# PRD — Painel Terapias Especiais · Reforma de Gestão (v3)

**Produto:** Painel Terapias Especiais — Unimed Governador Valadares
**Escopo desta versão:** reforma analítica e visual completa das telas — o que muda é **o que se mostra e como se mostra**, não a infraestrutura.
**Público do painel:** superintendência médica, diretoria executiva e Escritório de Valor em Saúde da operadora.
**Data:** Julho de 2026 · **Autor:** Grupo CSV / EVS · AxiaCare

---

## 0. Regras Inegociáveis (Herdadas e Reafirmadas)

Estas regras vêm do PRD anterior (`prd-2026-07-painel-terapias-especiais.md`) e permanecem em vigor integral:

1. **LGPD** — Nenhum dado bruto ou identificador de beneficiário no repositório público ou no navegador; somente agregados k-anonimizados; a arquitetura HTML-sem-payload + Worker autenticado + R2 privado **não muda**.
2. **Zero metalinguagem de IA** em qualquer texto visível.
3. **Português do Brasil** com acentuação correta; nomes de prestador/solicitante em CAIXA ALTA sem acento (`dNome`).
4. **Nunca inventar número** — tudo vem do pipeline e é declarado em Método e Fontes.
5. **Não reimplementar** login, gate, `/p/`, hospedagem ou marcas. `meta robots noindex` preservado.
6. Período canônico **2025/01–2026/06**, 17 terapias, população deduplicada — contrato de dados existente é a base; esta reforma **acrescenta** campos (ver §7), não remove os existentes.

---

## 1. O Problema (Por Que Reformar)

O painel atual é tecnicamente sólido — autenticação, privacidade, acessibilidade, contrato de dados — mas **analiticamente fraco**. A avaliação de gestão identificou quatro falhas estruturais:

1. **Gráficos que não respondem pergunta nenhuma.** Exemplos: 79 barras de preço quase iguais sem referência; barras de vínculo solicitante-executante dominadas por uma entidade com dezenas de barras ilegíveis; contagens exibidas como se fossem indicadores.
2. **Modelos de gráfico inadequados à relação mostrada.** Dispersão sem tratamento de outlier (eixo esticado até 70 sessões/paciente-mês por reembolsos individuais, rede esmagada em 0–10); barra usada onde o que importa é o desvio contra uma referência, não o valor absoluto.
3. **Visual inadequado.** Escalas automáticas ao sabor do dado, sem clamp; sem cor de destaque com significado; sem título de ação; listas gigantes sem hierarquia.
4. **Informação errada para o público.** Um gestor de operadora decide sobre **nível, tendência, concentração, desvio e ação** — o painel mostra população, volume e composição, mas quase nada de variação, referência ou priorização.

**Princípio orientador da reforma:** cada visual do painel responde **uma pergunta de gestão explícita, nomeada neste PRD**. Visual sem pergunta é removido. Título de gráfico é **título de ação** (comunica a leitura, não o assunto).

---

## 2. As Perguntas de Gestão (Espinha Dorsal)

Todo o painel se reorganiza em torno de seis perguntas, nesta ordem de prioridade:

| # | Pergunta | Onde é respondida |
|---|----------|-------------------|
| Q1 | Quanto estou gastando, e está acelerando ou desacelerando? | Visão Executiva |
| Q2 | O crescimento vem de preço, de volume ou de mais crianças? | Visão Executiva + Evolução |
| Q3 | Quem concentra o custo e como cada um variou? | Prestadores (Pareto + ranking) |
| Q4 | Onde o preço está fora da faixa — e a diferença é justificada (contrato, canal, mix de serviço) ou não? | Variabilidade |
| Q5 | Onde a intensidade está fora do típico — e o perfil clínico explica? | Variabilidade |
| Q6 | O que devo fazer primeiro, e quanto vale? | Fila de Ação (Visão Executiva) |

**Conceito central — variabilidade justificada × injustificada:**
- **Justificada:** preço dentro da faixa contratual do canal×terapia; intensidade alta com perfil clínico compatível (crianças menores, linhas de cuidado múltiplas, longa permanência); mix declarado (ex.: assistente terapêutica da Pediakids).
- **Injustificada (sinal de ação):** preço acima da faixa do seu canal×terapia sem contrato que o explique (→ negociar); intensidade de especialista muito acima da mediana clínica sem perfil compatível (→ auditar prontuário e escala profissional).
- O painel **não acusa** — ele **prioriza a verificação**. Linguagem sempre neutra: "acima da faixa", "verificar composição", nunca "irregular".

---

## 3. Diagnóstico Detalhado do Painel Atual (Base da Reforma)

Referências de linha sobre `unimed/tea.html` @ `7db3240`.

### 3.1 Visão Geral (`renderVisao`)
- **KPIs** (crianças, exposições, sessões, pagamento, R$/sessão, cadastros): são **contagens, não indicadores** — nenhum tem comparação com período anterior, referência ou meta. "Cadastros de prestador" e "Exposições" são metadado de método, não decisão. → Reformar (§5.1).
- **`c_vg_cost`** (linha do pagamento mensal): única leitura de tendência do painel, sem média móvel, sem marcação de eventos, sem eixo de variação. **Duplicada** na aba Evolução com os mesmos dados. → Unificar.
- **`c_vg_specialties`** (exposições por especialidade) e **`c_vg_care`** (linhas de cuidado): responderiam Q2 parcialmente, mas sem custo associado — exposição sem R$ não orienta gestão. → Mover para População com custo.

### 3.2 Prestadores
- **Ranking** (`renderProviderTable`): a melhor peça do painel atual — busca, ordenação, paginação (15/pág.), colunas de pagamento/participação/preço/intensidade/AT. Falta: **% acumulado (Pareto), desvio de preço vs faixa do canal×terapia, variação vs período anterior, sparkline**. → Evoluir, não remover.
- **`c_pr_matrix`** (bolha intensidade×preço): sem clamp de eixo — a escala segue o dado bruto (`grace: 8%`); reembolsos individuais com 40–60 sessões/paciente-mês esticam o eixo a 70 e esmagam a rede em 0–10. O IQR "típico" publicado (3,28–8,97) está **contaminado pelos reembolsos** — não é a faixa da rede contratada. → Corrigir população, winsorizar e focar escala (§5.3).
- **`c_pr_disp`** (barras de R$/sessão, ~79 prestadores): barras quase iguais, sem faixa de referência, misturando terapias e canais com precificação estruturalmente diferente. Barra de valor absoluto é o **modelo errado** — a pergunta (Q4) é de **desvio**. → Substituir por desvio vs referência por canal×terapia (§5.3).
- **`c_pr_solic`** (vínculos solicitante-executante): a executante UNIMED GOVERNADOR VALADARES domina a escala e dezenas de solicitantes viram barras ilegíveis de ~0 px; a semântica (executante principal × demais) não sustenta decisão nenhuma na forma atual. → Remover do painel principal; a informação vira **coluna da ficha do prestador** (concentração de solicitante) e tabela paginada em Método/Anexo.
- **Modal do prestador:** corrigido (bug do `</div>`); ganha a decomposição preço×volume×mix (§5.2).

### 3.3 Evolução
- Série mensal de pagamento e sessões **repete** `c_vg_cost` com outra roupagem. Falta o que só uma aba temporal pode dar: **decomposição da variação** (Q2 — preço × volume × população), entradas/saídas de crianças, custo por criança-mês. → Reformar (§5.4).

### 3.4 Especialidades, Pacientes, Canais
- Especialidades: exposições sem custo → juntar custo, preço médio e faixa por terapia (vira a tela de referência de preço).
- Pacientes: distribuição de linhas de cuidado ok como população; faltam **entradas/saídas** (fluxo) e **distribuição de custo por criança** (P25/P50/P75/P90) — a cauda direita é onde mora a gestão de caso.
- Canais: composição por canal ok; reembolso merece leitura própria (é onde o preço mais dispersa — visível no scatter atual).

### 3.5 Defeitos Transversais (Inventário Completo)
- **Redundância estrutural (~30% dos visuais são cópias):** distribuição de linhas de cuidado aparece 3× em gráfico (`c_vg_care`, `c_es_care`, `c_pa_care`) e 2× em tabela no Método; especialidades 2× (`c_vg_specialties`, `c_es_specialties`); pagamento mensal 2× (`c_vg_cost`, `c_ev_cost`); série do prestador 2× (card `c_pr_price`/`c_pr_volume` + modal). Cada informação passa a viver em **um** lugar.
- **Bug de estado busca × gráficos:** `pr_search` redesenha só a tabela (linha 1368), mas `providersFiltered` — usado por matriz, dispersão e séries — também lê `providerQuery`: ao re-renderizar por outro gatilho, os gráficos aplicam uma busca "fantasma" sem indicação visual. → A busca passa a redesenhar tabela E gráficos, com chip visível do filtro ativo.
- **Affordance mentirosa:** cabeçalhos de `es_table` herdam `cursor:pointer` sem handler de ordenação.
- **KPI constante:** "Terapias no escopo = 17" é fixado por contrato — não é indicador; sai do slot de KPI.
- **Séries degeneradas:** no recorte "Mês", os gráficos de linha viram um único ponto — exibir valor + Δ textual nesse caso.
- **Faixa etária/intensidade como ordinal embaralhada:** dependem da ordem da API; ordenar sempre pela ordem natural da variável.
- Listas longas sem paginação fora do ranking (solicitantes: tabela completa sem busca/ordenação; dispersão: 79 barras); alturas de gráfico crescendo com N (até 1.040 px) com `autoSkip:false` → colisão matemática de rótulos acima de ~40 linhas. → Toda lista: top-12 no gráfico + "ver todos" em tabela paginada com busca; altura de card fixa.
- **Sem exportação:** um painel que se pretende auditável não permite levar nada para a mesa de negociação. → Botão "Exportar CSV" em toda tabela.

---

## 4. Arquitetura de Informação (Novas Telas)

Mesmas sete entradas de navegação (ordem preservada), com conteúdo reformado:

1. **Visão Executiva** (antes "Visão Geral") — Q1, Q2, Q6.
2. **Evolução** — Q2 em profundidade.
3. **Terapias** (antes "Especialidades/Linhas de cuidado") — referência de preço por terapia×canal.
4. **Prestadores** (âncora) — Q3.
5. **Variabilidade** (antes parte de Prestadores) — Q4, Q5. *Se a restrição de sete abas for mantida, Variabilidade vive como segunda seção da aba Prestadores, abaixo do ranking.*
6. **População** (antes "Pacientes") — contexto clínico das variações.
7. **Método e Fontes** — mantida, com as faixas de referência publicadas.

---

## 5. Especificação Tela a Tela

### 5.1 Visão Executiva

**KPIs (6 cartões, cada um com valor + variação vs período anterior comparável):**
1. **Pagamento do período** + Δ% vs período anterior (mesma duração).
2. **Custo por criança-mês** (pagamento ÷ soma de criança×mês ativo) + Δ% — o indicador de eficiência que neutraliza crescimento populacional.
3. **Crianças ativas** + entradas e saídas no período (fluxo líquido).
4. **R$/sessão médio** + Δ%.
5. **Concentração**: % do pagamento nos 10 maiores prestadores.
6. **Fora de faixa**: % do pagamento em prestadores com preço acima da faixa de referência do seu canal×terapia (definição §7.2).

**Gráfico único de tendência** (`c_vg_cost` reformado): pagamento mensal em barras cinza + média móvel de 3 meses em linha verde + rótulo direto no último ponto. Título de ação dinâmico: "O custo {cresce|recua} {x}% no trimestre contra o anterior". Nenhum outro gráfico nesta tela.

**Fila de Ação (novo, o coração da tela):** tabela de até 8 linhas, ordenada por valor em risco, gerada por regra determinística do pipeline (§7.3):

| Prioridade | Prestador/Tema | Sinal | Valor associado | Leitura sugerida |
|---|---|---|---|---|
| 1 | PRESTADOR X | Preço 28% acima da faixa do canal | R$ 000 mil/período | Negociar |
| 2 | PRESTADOR Y | Intensidade 2,3× a mediana clínica | R$ 000 mil | Verificar composição |
| 3 | Reembolso | Preço disperso 3× IQR | R$ 000 mil | Revisar política |

Linguagem neutra obrigatória; cada linha clica para a ficha correspondente.

### 5.2 Prestadores (Âncora)

**Ranking Pareto (evolução do atual):** mantém busca + filtro de especialidade + ordenação + paginação (15/pág.). Colunas novas/alteradas:
- **% acumulado** do pagamento (Pareto) — coluna após participação.
- **Δ preço vs faixa**: R$/sessão − mediana da faixa do seu canal×terapia dominante, em % com sinal e cor (âmbar acima, cinza dentro, sem cor abaixo). Regra de cor: só ganha cor o que pede atenção (máximo ~10% das linhas coloridas).
- **Δ vs período anterior**: variação % do pagamento.
- **Sparkline** de 18 competências (SVG inline por linha, sem biblioteca).
- Colunas atuais preservadas (pagamento, sessões, R$/sessão, pacientes, intensidade, AT).

**Barra de leitura do Pareto** acima da tabela: "Os {n} primeiros prestadores concentram 80% do pagamento" (n calculado).

**Ficha do prestador (modal) — reformada:**
- KPIs atuais +
- **Decomposição da variação** (novo, Q2 no nível do prestador): waterfall com 4 barras — efeito preço, efeito volume, efeito população (pacientes novos/saídos) e efeito mix (composição AT/terapias) somando a variação total do período vs anterior. É a resposta de "por que este prestador cresceu".
- Série mensal de sessões e preço (mantidas), agora **com a mediana da rede como linha de referência** em ambas — sem benchmark, "R$ 180" não diz se é caro ou barato.
- **Concentração de solicitante** (novo): "top solicitante responde por {x}% das sessões" — substitui o gráfico removido `c_pr_solic`.
- Os cards `c_pr_price`/`c_pr_volume` da view (duplicatas do modal) **saem**; a ficha é o único caminho para a série individual.

### 5.3 Variabilidade (Q4 e Q5)

**Matriz intensidade×preço (correção do `c_pr_matrix`):**
- **População**: apenas canais de rede contratada (Rede Credenciada, Negociação Direta, Casa Unimed, Intercâmbio). **Reembolso sai da matriz** — vai para o card próprio na aba Canais.
- **Escala**: X e Y limitados a P5–P95 da população exibida com margem de 10%; pontos além entram **ancorados na borda** com marcador distinto (triângulo) e valor real no tooltip; anotação fixa "n prestadores fora da janela" quando houver.
- Referências: faixa IQR + medianas (mantidas), agora calculadas **só sobre a população exibida**.
- Cor: cinza para todos os canais; **uma cor de destaque** apenas para os pontos fora da faixa em ambas as dimensões (os que interessam). Legenda de canal vira tooltip/filtro, não cor primária.
- Título de ação: "{n} prestadores combinam preço e intensidade acima da faixa típica".

**Desvio de preço por prestador (substitui `c_pr_disp`):**
- Modelo: **barra divergente a partir do zero de desvio** — eixo = distância % da mediana da faixa do canal×terapia dominante do prestador; barras para a direita (acima) em âmbar, para a esquerda em cinza.
- População: prestadores com ≥ 100 sessões (limiar fixo declarado, não mediana móvel).
- Exibição: **top-12 desvios absolutos** + botão "ver todos" que abre tabela paginada com busca (todas as colunas: preço, faixa, desvio, canal, terapia dominante, sessões).
- Faixa sombreada de ±10% em torno do zero = "dentro da faixa".
- Título de ação: "{n} prestadores estão mais de 10% acima da faixa do seu canal".

**Intensidade vs mediana clínica (novo, Q5):** mesma forma divergente, eixo = razão intensidade/mediana da terapia dominante; destaca > 1,5×; clique → ficha com perfil (idades, linhas de cuidado, permanência) para o gestor julgar se o perfil justifica.

### 5.4 Evolução (Q2)

- **Decomposição da variação** (novo, gráfico principal): waterfall trimestral — pagamento do trimestre anterior → efeito população (± crianças) → efeito volume (sessões/criança) → efeito preço (R$/sessão) → pagamento do trimestre atual. Um waterfall por transição de trimestre, navegável.
- **Entradas e saídas de crianças** por competência (barras espelhadas + linha de ativos) — antecipa pressão de custo.
- **Custo por criança-mês** mensal (linha) — a série de eficiência.
- A série bruta de pagamento **sai desta aba** (já está na Visão Executiva). Nenhuma série repetida entre abas — regra de aceite.

### 5.5 Terapias

- Tabela: terapia × {crianças, sessões, pagamento, R$/sessão mediano, faixa IQR por canal} — **é a publicação da referência de preço** usada em §5.2/§5.3, tornando o método auditável na interface.
- Gráfico: dot plot horizontal por terapia — um ponto por canal na escala de R$/sessão, com segmento ligando mínimo–máximo entre canais. Responde "quanto custa a sessão de cada terapia em cada canal".
- Cobertura de período por terapia (mantida do painel atual).

### 5.6 População

- Linhas de cuidado 1–7 (mantida) + custo médio por linha de cuidado (novo eixo secundário proibido — usar segunda coluna na tabela, não eixo duplo).
- **Distribuição de custo por criança**: barras por faixa de percentil (P0–25, 25–50, 50–75, 75–90, 90–100) com % do custo total em cada faixa — mostra quanto do programa mora na cauda.
- **Idade × custo/intensidade** (novo cruzamento): custo médio por criança-mês por faixa etária — hoje idade, intensidade e custo vivem em gráficos separados que não se cruzam; faixas sempre em ordem etária natural.
- Gênero vira linha de texto (sem card próprio).
- Permanência (meses em tratamento, distribuição).

### 5.7 Canais

- Mix de pagamento por canal por competência (barras empilhadas 100% **ou** small multiples por canal — nunca mais de 6 séries numa área). O gráfico de sessões por canal (`c_ca_sessions`) sai — o mix de sessões está inteiro na tabela.
- **Oportunidade Casa Unimed vs Rede (novo, a conta que a aba não fazia):** diferencial de R$/sessão entre Casa Unimed e cada canal externo × volume tecnicamente deslocável = valor de oportunidade em R$/período, apresentado como cenário de sensibilidade com premissas declaradas (não como meta).
- **Card Reembolso**: R$/sessão disperso (dot strip com IQR), n de beneficiários, custo total — a leitura que saiu da matriz. R$/sessão por canal ganha anotação de n (peso) e linha da média ponderada da rede.
- Migração entre canais (se derivável): variação da participação por canal vs período anterior.

### 5.8 Método e Fontes

- Mantém tudo que existe (manifesto SHA-256, regras, cobertura) e **acrescenta**: tabela das faixas de referência por canal×terapia com data de cálculo; definição formal de cada indicador novo (custo criança-mês, efeito preço/volume/população/mix, desvio de faixa); regra da Fila de Ação por extenso.

---

## 6. Regras de Visualização (Obrigatórias, Valem para Todo Gráfico)

1. **Pergunta declarada**: todo gráfico nasce de uma Q deste PRD; o código referencia a Q em comentário curto.
2. **Título de ação** dinâmico (comunica a leitura: "X concentra Y%", nunca só "Pagamento por prestador").
3. **Barra sempre em base zero**; desvios usam barra divergente a partir do zero de desvio.
4. **Dispersões**: população definida explicitamente (sem misturar reembolso com rede), clamp P5–P95 com outliers ancorados na borda + contagem visível, referências calculadas só sobre a população exibida.
5. **Cinza é a cor base**; uma única cor de destaque por gráfico, no ponto da história; cor nunca é o único codificador (forma/rótulo redundante).
6. **Máximo 12 elementos** por gráfico categórico; o resto vive em tabela paginada com busca ("ver todos"). Altura de card fixa — nada de gráficos de 1.000 px.
7. **Rótulo direto** no dado quando N ≤ 12; legenda só quando há mais de uma série.
8. **Sem** pizza, rosca, 3D, eixo Y duplo, texto diagonal.
9. Tooltip sempre com o valor exato e o nome completo (`dNome`).
10. Toda lista/tabela longa: paginação (15/pág.), busca com filtro instantâneo, ordenação por qualquer coluna, contador de resultados.
11. Acessibilidade preservada: `role="img"` + `aria-label` por canvas, foco visível, alvos 44×44.

---

## 7. Mudanças no Contrato de Dados (Pipeline `build-tea-data.py`)

O JSON por recorte **ganha** (nada é removido — retrocompatível):

### 7.1 Comparação com Período Anterior
Para cada recorte não-`tudo`: bloco `anterior` com {pagamento, sessoes, pacientes, custo_sessao, custo_crianca_mes} do período imediatamente anterior de mesma duração, + `delta` percentual de cada um. Para `tudo`: nulo.

### 7.2 Faixas de Referência
`referencias.preco[canal][terapia] = {mediana, p25, p75, n_prestadores}` — calculadas sobre prestadores com ≥ 100 sessões no canal×terapia; publicadas também em Método. `referencias.intensidade[terapia] = {mediana, p25, p75}` sobre a população clínica (sem reembolso). Prestador ganha `faixa_delta_pct` (desvio do preço vs mediana da sua faixa dominante) e `intensidade_razao` (vs mediana da terapia).

### 7.3 Fila de Ação
`fila_acao`: lista ordenada por `valor_associado` desc, com `{tipo: preco_acima_faixa | intensidade_alta | reembolso_disperso, prestador?, sinal, valor_associado, leitura}`. Regras determinísticas: preço > P75 + 10% da faixa e pagamento ≥ R$ 50 mil → `preco_acima_faixa`; intensidade_razao ≥ 1,5 e pagamento ≥ R$ 50 mil → `intensidade_alta`; IQR do reembolso > 3× IQR da rede → `reembolso_disperso`. Limiares declarados em Método.

### 7.4 Decomposição da Variação
Por recorte com `anterior`: `decomposicao = {efeito_populacao, efeito_volume, efeito_preco, efeito_mix, residuo}` em R$, com a identidade `soma = pagamento − pagamento_anterior` (residuo < 1% ou o build falha). Mesma estrutura por prestador (para o waterfall da ficha).

### 7.5 Novos Agregados
`custo_crianca_mes` (por recorte e por competência); `entradas`/`saidas` de crianças por competência; `pareto` (lista acumulada); `custo_por_percentil` (5 faixas); `solicitante_top_pct` por prestador; `sparkline` (18 valores de sessões) por prestador.

**Validações novas do build:** identidade da decomposição; faixas com n ≥ 5 prestadores (senão a faixa não publica — k-anonimato de referência); fila de ação determinística e reproduzível; nenhum campo novo com nome de beneficiário (varredura anti-vazamento estendida aos campos novos).

---

## 8. O Que É Removido (Explicitamente)

| Item atual | Motivo | Destino da informação |
|---|---|---|
| `c_pr_solic` (barras solicitante-executante) | Ilegível (sem ordenação, escala absoluta dominada por uma entidade); a variável de decisão (% no principal) estava na cor, não no eixo | % de concentração na ficha do prestador + tabela paginada, ordenável por "% no principal", em anexo |
| `c_pr_disp` (79 barras de preço) | Modelo errado para pergunta de desvio | Barra divergente top-12 + tabela "ver todos" (§5.3) |
| `c_pr_price`/`c_pr_volume` (série do prestador na view) | Duplicata do modal | Ficha do prestador (único caminho) |
| Série de pagamento duplicada na Evolução | Redundância | Só na Visão Executiva |
| `c_es_specialties`, `c_es_care`, `c_pa_care` | 2ª e 3ª cópias das mesmas séries | Uma ocorrência de cada (Visão/População) |
| `c_ca_sessions` (sessões por canal) | Não muda decisão; conteúdo integral na tabela de canais | Tabela `ca_table` |
| `c_pa_gender` (card de gênero com 2 barras) | Descritivo, sem decisão associada | Linha de texto/chip na População |
| KPIs "Exposições", "Cadastros de prestador" e "Terapias no escopo" | Metadado/constante, não decisão | Método e Fontes / População |
| Reembolso dentro da matriz de dispersão | Contamina escala e referências | Card próprio na aba Canais |

---

## 9. Critérios de Aceite

1. Cada gráfico do painel tem uma Q declarada e título de ação — auditável por inspeção.
2. A matriz nunca exibe eixo além de P95 × 1,1 da população exibida; outliers ancorados com contagem visível.
3. Nenhuma lista com mais de 15 itens sem paginação + busca; nenhum card com altura > 560 px.
4. Nenhuma série repetida entre abas.
5. KPIs da Visão Executiva todos com Δ vs período anterior (quando existir anterior comparável).
6. Fila de Ação reproduzível a partir das regras de §7.3 (mesmo insumo → mesma fila).
7. Identidade da decomposição fecha (resíduo < 1%) em todos os recortes com anterior.
8. Faixas de referência publicadas em Método com n ≥ 5 por célula.
9. Modal abre e fecha pelos três caminhos (X, clique fora, Esc) — regressão do bug corrigido em `7db3240`.
10. Todos os aceites do PRD anterior seguem valendo (17 terapias, 1.416 crianças, 161/160 prestadores, 81.217 sessões, R$ 13.919.882,74, Matriz 2025, anti-vazamento, noindex, `/p/` regenerado).
11. Render real desktop (1440×900) e mobile (390×844) sem erro de console; linguagem neutra em todos os textos (varredura por termos acusatórios: "irregular", "fraude", "abuso" — proibidos).
12. A busca de prestadores redesenha tabela E gráficos em conjunto, com indicação visível do filtro ativo — fim do filtro "fantasma".
13. Toda tabela tem "Exportar CSV" funcional (agregados exibidos, nunca microdado).
14. Nenhum cabeçalho com `cursor:pointer` sem ordenação real; nenhuma série de linha renderizada com um único ponto (recorte mensal mostra valor + Δ textual).
15. Nenhuma informação duplicada entre views (cada série/distribuição vive em exatamente um lugar).

---

## 10. Fases de Execução

1. **F1 — Pipeline** (§7): campos novos + validações + selftest estendido. Critério: build verde com contrato v3.
2. **F2 — Visão Executiva + Fila de Ação** (§5.1): a tela que muda a percepção de valor primeiro.
3. **F3 — Prestadores** (§5.2): colunas novas do ranking + ficha com waterfall.
4. **F4 — Variabilidade** (§5.3): matriz corrigida + desvios divergentes.
5. **F5 — Evolução, Terapias, População, Canais** (§5.4–5.7).
6. **F6 — Método** (§5.8) + varreduras + render real + `/p/` + PR + deploy + verificação no link real.

Cada fase termina com os aceites parciais verificados; F1 é pré-requisito de todas.

---

## 11. Anexo — Referência Rápida de Modelos por Pergunta

| Relação | Modelo |
|---|---|
| Nível + tendência | Barras mensais cinza + média móvel em linha destacada |
| Desvio vs referência | Barra divergente do zero de desvio, faixa ±10% sombreada |
| Concentração | Ranking com % acumulado + frase-Pareto |
| Duas dimensões de risco | Dispersão com clamp P5–P95, destaque só no fora-de-faixa |
| Composição de variação | Waterfall com identidade validada |
| Preço por categoria×canal | Dot plot horizontal por categoria |
| Fluxo populacional | Barras espelhadas (entradas/saídas) + linha de ativos |
| Distribuição de custo | Barras por faixa de percentil com % do total |
