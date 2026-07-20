# PRD — Painel Terapias Especiais (multidisciplinar) · Unimed Governador Valadares

**Versão:** 1.1 · **Data:** 2026-07-20 · **Responsável do produto:** Guilherme (Grupo CSV / Escritório de Valor em Saúde · AxiaCare)
**Status:** em execução · **Painel-alvo:** evolução do atual `unimed/tea.html` (repo público `grupocsv/hub`)

> **Decisão posterior incorporada em 2026-07-20:** o responsável do produto autorizou métricas completas, nomes de prestadores e solicitantes e recortes raros para os usuários autenticados. A supressão k=5 deixou de ser requisito da camada interna. Para que essa decisão não torne os dados públicos, o HTML permanece no Hub sem payload e o JSON completo passa a um R2 privado, servido por Worker que valida a sessão a cada requisição. O bruto e os identificadores de beneficiário continuam fora do Git e do navegador. Esta decisão substitui as referências anteriores a JSON completo embutido ou versionado e a supressão k=5.

> Este documento é **autossuficiente**: contém contexto, hospedagem/acesso, modelo de dados, regras de negócio, especificação de telas, redesign visual, responsividade, método auditável, critérios de aceite e exemplos. Quem executar não precisa de conhecimento prévio da sessão que o gerou.

---

## 0. Princípios inegociáveis (ler antes de tudo)

1. **Zero metalinguagem de IA.** Nada no produto entregue — textos, comentários visíveis, rodapés, tooltips, nomes de arquivo servidos — pode denotar que foi feito com inteligência artificial. O painel é peça profissional para cliente final (operadora de saúde). Nunca escrever "gerado por IA", "assistente", "modelo", "prompt" ou equivalentes na camada visível.
2. **Escrita em português do Brasil, com acentuação e cedilha corretas** em todo o produto. Revisão ortográfica obrigatória.
3. **Nunca inventar.** Todo número exibido nasce de um pipeline reproduzível sobre os dados oficiais. O que os dados não sustentam fica declarado na aba **Método e Fontes** — clara, rastreável e auditável.
4. **Nomes de prestador e solicitante em CAIXA ALTA sem acento** (regra `dNome` já existente no painel), aplicada a rótulos de dados (tabelas, eixos, legendas). Prosa corrida segue pt-BR normal.
5. **Analisar os dados mais de uma vez antes de escrever qualquer linha de código.** O executor deve reconferir cobertura de período, chaves e agregações contra este PRD e contra os arquivos-fonte.
6. **Preservar o que já está certo:** interface, credenciais, localização do painel, logomarcas e gate permanecem como estão. A autorização dos dados é ampliada no servidor apenas para emitir e validar sessão opaca; não se cria um segundo login.

---

## 1. Contexto, hospedagem e acesso (preservar integralmente)

**O que o painel é hoje:** SPA estático (`unimed/tea.html`) servido pelo hub do Grupo CSV, com dados agregados injetados por pipeline Python. Cobre hoje **apenas a Terapia ABA · Psicologia**. Este PRD o transforma na **visão completa de Terapias Especiais** da operadora.

**Hospedagem e domínios (NÃO alterar):**
- **Interno (portal/hub-auth):** `https://hub.grupocsv.com/unimed/tea.html` — servido via GitHub Pages + Fastly a partir do repo `grupocsv/hub`. Deploy automático no push para `main` (workflow `.github/workflows/deploy.yml`, que roda build VitePress + *smoke test*).
- **Cópia compartilhável (gate embutido):** `https://hub.grupocsv.com/p/painel-tea/`, gerada por `scripts/build-tea-data.py --emit-p` e registrada em `p/registry.json`. O gate visual permanece **embutido** (formulário e-mail corporativo + senha, sessão 4h, e-mails `@unimedgv`, botão "olhinho"). O broker privado encaminha a validação ao `csv-open-auth` e devolve token opaco escopado; a interface estática nunca recebe o JSON antes dessa validação.
- **Gate do portal interno:** `<script src="/scripts/hub-auth.js" data-portal="unimed">` — mantido.
- **Dados do painel:** `unimed-te-data` valida a sessão existente e lê a versão ativa do bucket privado `unimed-te-data-private`. O endpoint não substitui os dois logins; apenas autoriza o acesso ao payload.
- **Logomarcas:** Unimed GV (sidebar) e "Escritório de Valor em Saúde · AxiaCare · Grupo CSV" (rodapé/realização), servidas de `assets.grupocsv.com`. Mantidas.
- **`<meta name="robots" content="noindex, nofollow">` é obrigatória** em `unimed/tea.html` — o *smoke test* do deploy falha sem ela. Não remover.

**Fontes e design tokens atuais (base para evoluir, ver §8):** Source Sans 3 / Source Serif 4; paleta Unimed (`--u-green #00995d`, `--u-green-dark #006b41`, `--u-dark #004e4c`, laranja `#f47920`, âmbar `#b7791f`); Chart.js 4.5.1.

---

## 2. Escopo de dados

### 2.1 Universo novo
A operadora passou a fornecer **todas as terapias especiais** (não só Psicologia ABA). Insumo: **19 planilhas-fonte** (uma por procedimento) + uma **Matriz Analítica consolidada** de referência (2025). Todas as planilhas-fonte compartilham o **mesmo schema de 19 colunas** (ver §3.1).

### 2.2 As 17 terapias do painel (escopo final)
Cada terapia = um **código de procedimento** (SPSADT). A ABA · Psicologia soma dois códigos por regra de negócio (§3.4).

| # | Terapia | Código | Cobertura |
|---|---|---|---|
| 1 | Terapia ABA — Psicologia | **50005103** (+ 50000519 exceção Pediakids) | 2025/01–2026/06 |
| 2 | Terapia ABA — Fonoaudiologia | 50005189 | 2025/01–2026/06 |
| 3 | Terapia ABA — Terapia Ocupacional | 50005170 | 2025/01–2026/06 |
| 4 | Psicopedagogia | 50005278 | 2025/01–2026/06 |
| 5 | Terapias especiais (parecer ANS, centros de referência) | 50005375 | 2025/01–2026/06 |
| 6 | Método Denver — Terapia Ocupacional | 50005235 | 2025/01–2026/06 |
| 7 | Método Denver — Psicologia | 50005227 | 2025/01–2026/06 |
| 8 | Método Denver — Fonoaudiologia | 50005243 | 2025/01–2026/06 |
| 9 | Método TEACCH — Psicologia | 50005138 | 2025/01–2026/06 |
| 10 | Método TEACCH — Fonoaudiologia | 50005219 | 2025/01–2026/06 |
| 11 | Método TEACCH — Terapia Ocupacional | 50005200 | 2025/01–2026/06 |
| 12 | Método Bobath — Terapia Ocupacional Neurológica | 50005197 | 2025/01–2026/06 |
| 13 | Método Bobath — Fonoaudiologia | 50005251 | 2025/01–2026/06 |
| 14 | Integração Sensorial | 50005260 | 2025/01–2026/06 |
| 15 | Terapeuta Ocupacional — TGD | 50005340 | 2025/01–2026/06 |
| 16 | Psicólogo — TGD | 50005286 | 2025/01–2026/06 |
| 17 | Fonoaudiólogo — TGD | 50005308 | 2025/01–2026/06 |

**Dimensões derivadas dos nomes** (para agrupar/filtrar): **Especialidade/profissão** (Psicologia, Fonoaudiologia, Terapia Ocupacional, Psicopedagogia) e **Método/abordagem** (ABA, Denver, TEACCH, Bobath, Integração Sensorial, PECS, TGD, ANS-centros). O executor deve mapear cada código → {especialidade, método} numa tabela explícita no pipeline (não inferir em runtime).

### 2.3 Normalização de período (regra dura)
- **Período canônico do painel:** `2025/01 → 2026/06` (18 competências), que é a cobertura comum a todas as terapias mantidas.
- **Descarte por cobertura incompleta:** qualquer terapia que **não cubra o período canônico inteiro** é **excluída** do painel. Hoje isso atinge **exatamente uma**: **Método PECS — Fonoaudiologia (50005146)** — só 13 de 18 meses (faltam 2025/04, 06, 07, 10 e 2026/04), 20 registros, 3 pacientes. Excluída por cobertura incompleta.
- A regra é **programática, não hardcoded por nome**: o pipeline mede a cobertura mensal de cada terapia e descarta as que não têm todas as competências do período canônico, **listando no relatório de build** o que foi descartado e por quê (auditável).
- **Fisioterapia** ainda não vem nos dados; entrará depois. **Não** deixar observação hardcoded sobre isso no produto — o painel simplesmente reflete as terapias presentes.

> Observação factual importante (para o executor): a **Matriz Analítica consolidada** que acompanha o insumo está restrita a **2025**; os **arquivos-fonte** vão até **2026/06**. O painel usa os **arquivos-fonte** (granularidade mensal, 18 competências), não os agregados 2025 da Matriz. A Matriz serve como **conferência cruzada** (os agregados 2025 do painel devem bater com os dela).

### 2.4 Números de referência do universo (18 competências, PECS descartada)
Para calibrar KPIs e detectar regressões (o executor deve reproduzi-los ±0):
- **Crianças únicas (dedup Nome+Nascimento, entre terapias): 1.416**
- Exposições beneficiário-terapia clínica (17 terapias, AT incorporada à ABA · Psicologia): **2.620**. A leitura técnica por código registra **2.664 componentes**.
- **Prestadores na origem: 161 nomes** · **prestadores consolidados: 160 entidades** após a regra de mudança de CNPJ.
- Sessões totais: **81.217** · Pagamento total: **R$ 13.919.882,74**
- **Linhas de cuidado clínicas** (17 terapias, AT incorporada): 1 terapia 730 · 2 terapias 330 · 3 terapias 248 · 4 terapias 71 · 5 terapias 22 · 6 terapias 13 · 7 terapias 2. **48,4% das crianças fazem 2+ terapias.**
- **Reconciliação técnica por código:** 1 componente 716 · 2 componentes 332 · 3 componentes 246 · 4 componentes 81 · 5 componentes 26 · 6 componentes 13 · 7 componentes 2. Essa leitura reproduz os 2.664 componentes e os 49,4% originais, mas não deve contar o código de assistente terapêutica como uma 18ª terapia clínica.

---

## 3. Modelo de dados e pipeline

### 3.1 Schema das planilhas-fonte (19 colunas, idêntico em todas)
`Ano/Mês · Matrícula Beneficiário · Nome Beneficiário · Data Nascimento · Gênero Beneficiário · Numero Guia Principal · Data Atendimento · Código Solicitante · Nome Solicitante · CBOS Solicitante · Tipo Guia · Código Procedimento · Nome Procedimento · Tipo Procedimento GA · Código Prestador · Nome Prestador · Tipo Prestador · Quantidade Procedimento · Pagamento/Despesa`
A aba de dados é a que tem cabeçalho começando em `Ano/Mês` (algumas planilhas têm uma aba `LEIA-ME` antes; ignorá-la — usar sempre a aba de dados).

### 3.2 Chaves e consolidações (regras oficiais do LEIA-ME — manter)
- **Paciente único = Nome + Data de Nascimento** (nunca matrícula; há crianças com múltiplas carteirinhas).
- **Consolidação de prestador:** `ANA CAROLINA OLIVEIRA FARIA FALCAO LTDA` + `CRIAR E CRESCER TEEN LTDA` = mesmo prestador (mudança de CNPJ).
- **Idade** em anos completos na data de corte.

### 3.3 Rede e canal (mudança-chave deste PRD)
- **Sai o corte "recurso próprio / centros de terapias especiais" como eixo estruturante.** O painel passa a ser **visão de rede única, com todos os prestadores** tratados no mesmo plano. Não haverá mais "própria vs externa" como recorte principal de topo.
- **Permanece a classificação de canal** (forma de pagamento), agora como **atributo** do prestador/registro, não como divisor de mundo:

| Tipo Prestador | Canal |
|---|---|
| ATENDIMENTO ESPECIALIZADO | Casa Unimed |
| ATENDIMENTOS FORNECEDORES | Negociação Direta |
| CLINICA ESPECIALIZADA | Rede Credenciada |
| OUTRAS ESPEC. EXCETO MEDICO | Negociação Direta (P.F.) |
| REEMBOLSO | Reembolso |
| UNIMED NACIONAL / UNIMED REGIONAL | Intercâmbio |

- **Regras de Rede Credenciada e Intercâmbio permanecem** e são preservadas em todos os gráficos com legenda de canal.
- **Reclassificações vigentes de credenciamento** já aplicadas no pipeline atual (override para "Rede Credenciada"): `RESINTO`, `PSICONEURO`, `ANIMA`, `CUIDARIM`, `AURORA`. Manter e permitir ampliar por lista.

### 3.4 Exceção ABA · Psicologia (Pediakids / código de AT) — manter rastreável
- O código **50000519** (assistente terapêutica, valor menor) lançado pela **PEDIAKIDS** é **incorporado à Terapia ABA · Psicologia** por acordo interno, preservando a origem para auditoria.
- Por prestador, manter os campos `at_sessoes`/`at_pct` (parcela de sessões faturadas como AT) e o **selo "AT %"** onde o prestador aparece. Método explica que um R$/sessão menor pode ser **composição** (AT), não só negociação.

### 3.5 Objeto orientador = paciente; três perspectivas
O dado é sempre organizado a partir do **paciente** (criança). O que muda entre menus é a **lente**:
- **População** (visão geral): agregação sobre o conjunto de crianças únicas (dedup entre terapias) — quantas crianças, perfil etário, quantas terapias por criança (linhas de cuidado), custo por criança.
- **Prestador:** agregação por prestador (intensidade, preço, canal, especialidades atendidas) — **é a aba diferencial do painel** (§5).
- **Paciente/terapia:** recorte por terapia/especialidade/linha de cuidado, sempre filtrando sobre o objeto-paciente.

> Ponto de modelagem crítico: a Matriz consolidada **não deduplica** pacientes entre terapias ("exposições beneficiário-terapia"). O painel **deve** oferecer as duas leituras e nunca somar beneficiários por terapia para obter população — a população é o **conjunto dedup** de crianças (1.416).

### 3.6 Métricas (definições auditáveis — replicar no Método)
- **Intensidade** = soma de `Quantidade de Procedimento` por beneficiário dentro do recorte (terapia/rede/período). Média e mediana das sessões acumuladas por beneficiário.
- **Custo/sessão** = `Pagamento` ÷ sessões; sessões com pagamento zero são excluídas **apenas do denominador** do custo unitário.
- **Custo/beneficiário** = pagamento ÷ beneficiários do recorte.
- **Completude interna:** contagens, custos, sessões e nomes de prestadores e solicitantes são exibidos sem supressão, inclusive quando o recorte contém menos de cinco pacientes.
- **Limite de identificação:** nome, matrícula, nascimento e guia de beneficiário **não** integram o JSON do painel. A chave Nome+Nascimento é usada apenas dentro do pipeline para relacionar os eventos à mesma criança e calcular a população deduplicada.

### 3.7 Pipeline técnico (arquitetura de execução)
- Evoluir `scripts/build-tea-data.py` mantendo o padrão: **insumo bruto fora do repo** (o script aborta se o insumo estiver dentro de um Git), `--selftest` com *fixture* sintética, relatório de build, hashes SHA-256 e terapias descartadas.
- **Artefato privado:** o build real exige `--saida` fora de qualquer Git e emite um único JSON completo. O pipeline não escreve dados no HTML nem em `unimed/data/`.
- **Entrega autenticada:** versões imutáveis do JSON ficam em R2 privado; o Worker valida sessão Unimed ou sessão escopada do gate antes de ler a versão ativa. Respostas usam `private, no-store`.
- **`--emit-p`:** regenera somente a interface e o gate, sem dados. A aparência e as credenciais existentes são preservadas; o broker emite token opaco de quatro horas após validar no `csv-open-auth`.
- **CI/deploy público:** o *smoke test* roda a fixture e falha se encontrar payload, recortes, nomes provenientes das fontes ou o antigo JSON no repositório, no HTML interno ou no `/p/`.

---

## 4. Navegação e menus (revisar/enxugar)

A aba **Prestadores** é o grande diferencial (acompanhamento de prestadores) e deve ser aprofundada. Revisar o menu atual e enxugar redundâncias. Estrutura proposta (validar com o responsável antes de cortar):

| Menu | Perspectiva | Papel |
|---|---|---|
| **Visão Geral** | População | Quantas crianças, custo total, evolução, linhas de cuidado, distribuição por especialidade — tudo sobre crianças únicas. |
| **Evolução** | População/tempo | Séries mensais (sessões, custo, crianças ativas, preço médio) com o seletor de período. |
| **Especialidades / Linhas de cuidado** *(novo)* | Paciente×terapia | Comparação entre as 17 terapias e as **combinações** de terapias por criança (o mapa multidisciplinar). |
| **Prestadores** | Prestador | Aba-âncora: ranking, matriz estratégica, dispersão de preço, evolução, quem prescreve, ficha por prestador (com especialidades que atende e selo AT). |
| **Pacientes** | Paciente | Perfil etário, intensidade, permanência, custo por criança, distribuição de linhas de cuidado. |
| **Canais de Pagamento** | Prestador/rede | Distribuição por canal (Casa Unimed, Rede Credenciada, Negociação Direta, Intercâmbio, Reembolso). |
| **Método e Fontes** | — | Definições, fontes, limitações, período, descartes — auditável (§6). |

Candidatos a enxugar (avaliar): fundir gráficos redundantes dentro de Prestadores; remover recortes "recurso próprio vs externo" que deixam de fazer sentido na visão de rede. **Não** remover a ficha de prestador nem o ranking.

---

## 5. Aba Prestadores (o diferencial) — especificação

Deve permitir **acompanhar prestadores** em profundidade, agora multi-especialidade:
- **Ranking** de prestadores (paginado, 27/página como hoje) com custo, participação, sessões, R$/sessão, pacientes, canal, **especialidades atendidas** e **selo AT** quando aplicável.
- **Matriz estratégica** — manter o desenho corrigido: **intensidade (média de sessões por paciente·mês) × preço (R$/sessão)**, escala focada na faixa onde a rede vive, **faixa central** (IQR/mediana) como referência do meio, bolha = custo, cor = canal. **É gráfico de alvo, não de outlier**; sem rótulos de conduta ("auditar", "negociar", "prioridade"). O meio é o ideal. Agora com **filtro por especialidade**.
- **Dispersão de preço** por prestador (≥ N sessões), com referências internas (média da carteira, mediana). Nota de comparabilidade AT permanece.
- **Evolução do preço/volume** por prestador.
- **Quem prescreve para quem** (solicitante × executante), barra empilhada (principal × demais), âmbar quando concentração ≥ 80%.
- **Ficha do prestador (modal):** custo, sessões, R$/sessão, pacientes, split especialista/AT, **quais especialidades atende** e a série mensal.

---

## 6. Método e Fontes (auditável — nunca inventar)

Reescrever a aba de forma clara, rastreável e auditável, cobrindo no mínimo:
- **Unidade:** "sessão faturada"; códigos por terapia (tabela §2.2); ABA · Psicologia = 50005103 + exceção 50000519 (Pediakids), origem preservada.
- **Período canônico** 2025/01–2026/06 e **terapias descartadas** por cobertura incompleta (hoje: PECS — Fonoaudiologia), com o motivo.
- **Paciente** = Nome + Nascimento; **população** = conjunto dedup entre terapias; **exposições** = soma por terapia (não é população).
- **Canais** (tabela §3.3) e **reclassificações** de credenciamento vigentes.
- **Métricas** (§3.6), completude dos recortes autenticados e separação entre interface pública e dados privados.
- **Fontes:** origem oficial da operadora (guias SPSADT), 18 meses. Sem benchmark público inventado.
- **Limitações** declaradas (ex.: uma sessão faturada não equivale a uma hora de terapia; Fisioterapia ainda não presente — dito de forma neutra, sem promessa).

---

## 7. Seleção de período

- Seletor único, aplicado **consistentemente a todas as terapias** ao mesmo tempo: **mês**, **trimestre**, **semestre**, **ano** e **período inteiro** (2025/01–2026/06).
- Toda métrica recalcula para o recorte escolhido; a série mensal destaca o recorte ativo.
- Terapias que não cobrem o período canônico completo já foram descartadas no build (§2.3), então o seletor nunca mostra "buracos" por especialidade.
- Persistir a escolha do usuário na navegação entre abas (estado do período é global).

---

## 8. Redesign visual

Alguns gráficos atuais não representam bem o dado (o executor deve revisar cada um e escolher a melhor forma). Diretrizes:
- **Manter o padrão de design Unimed** (tokens §1) e a linguagem já corrigida da matriz estratégica.
- **Trocar gráficos que não comunicam** por formas mais adequadas (ex.: preferir barras ordenadas a pizza; ranqueáveis a nuvens; evitar eixos que escondem a variação real). Cada gráfico precisa de um objetivo claro e um título que diz o que ler.
- **Nova dimensão multidisciplinar:** visualizar **linhas de cuidado** (combinações de terapias por criança) — ex.: barras de "1 / 2 / 3+ terapias", e um mapa das combinações mais frequentes de especialidades.
- **Consistência:** uma só paleta, legendas claras, tudo com rótulo pt-BR. Sem metalinguagem.
- Antes de finalizar qualquer gráfico, validar num render real (desktop e mobile).

---

## 9. Responsividade (desktop + mobile como duas versões)

- **Duas experiências**, com o sistema **detectando o dispositivo** (breakpoint + capacidades de toque) e servindo o layout adequado: desktop (sidebar + grids largos) e mobile (navegação compacta, cards empilhados, tabelas com rolagem horizontal contida, gráficos que reescalam).
- Nada de rolagem horizontal na página; conteúdo largo (tabelas, matriz) rola dentro do próprio contêiner.
- Alvos de toque adequados, tipografia legível, gráficos com densidade reduzida no mobile.
- Testar ambos via render real (a verificação de layout é critério de aceite, §12).

---

## 10. LGPD e segurança (manter rigor atual)

- Repo é **público**: planilha bruta (nomes/nascimento de menores + condição de saúde) **jamais** entra na árvore do repo; o pipeline aborta se o insumo, a Matriz ou a saída estiverem dentro de um Git. Nenhum agregado operacional é versionado.
- Backup do bruto no bucket privado R2 `csv-dados-sensiveis`.
- Varredura anti-vazamento no build: nenhum nome de beneficiário, matrícula, nascimento ou guia no JSON privado, no HTML ou no `/p/`.
- R2 do painel sem domínio público; endpoint autenticado com CORS restrito, `private, no-store`, token fora da URL e registro de acesso sem payload.
- Gate e interfaces preservados (§1); uma expiração gravada apenas no navegador não autoriza dados.

---

## 11. Não-metalinguagem (reforço)

Proibido, em qualquer parte visível do produto: menção a IA, "assistente", "modelo", "prompt", "gerado automaticamente", assinaturas de ferramenta, comentários explicativos de processo de IA no HTML servido. O produto se apresenta como entrega profissional do Escritório de Valor em Saúde para a Unimed GV.

---

## 12. Critérios de aceite (QA)

O executor só considera pronto quando **todos** passam:
1. **Escopo:** 17 terapias presentes; PECS — Fonoaudiologia ausente e listada como descartada no Método e no relatório de build.
2. **Números de referência (§2.4) reproduzidos** (±0 ou justificados): 1.416 crianças únicas, 161 nomes de prestador na origem/160 entidades consolidadas, 81.217 sessões, R$ 13.919.882,74; distribuição clínica e reconciliação técnica das linhas de cuidado.
3. **Conferência cruzada com a Matriz 2025:** agregados 2025 do painel batem com a Matriz Analítica (Resumo_Executivo, Mensal, Rede_por_Terapia).
4. **Período** selecionável (mês/trimestre/semestre/ano/tudo), consistente entre abas.
5. **Visão de rede** sem corte "recurso próprio"; canais preservados; reclassificações de credenciamento aplicadas.
6. **Prestadores** funcional (ranking paginado, matriz de alvo, dispersão, quem prescreve, ficha com especialidades e selo AT).
7. **População vs exposições** nunca confundidas; perspectivas paciente/prestador/população presentes.
8. **Responsivo** desktop e mobile, verificado em render real; sem rolagem horizontal de página; sem erros de console.
9. **Método e Fontes** completo, auditável, sem invenção.
10. **Zero metalinguagem de IA**; pt-BR correto com acentuação/cedilha.
11. **Proteção dos dados:** anti-vazamento aprovado; bruto, Matriz e JSON completo fora do Git; HTML e `/p/` sem payload; endpoint nega requisição sem sessão; `meta robots noindex` presente; `--emit-p` regenera `/p/` com o gate preservado.
12. **Deploy** verde (build + smoke test) e **verificação no link real** (não de memória) de que a versão nova está no ar.

---

## 13. Roadmap de fases sugerido

- **F0 — Dados:** pipeline multi-terapia, normalização de período, exceção Pediakids, dedup população, tabela código→{especialidade,método}; artefato privado, relatório de build + selftest. Conferência cruzada com a Matriz.
- **F1 — Estrutura:** visão de rede única (remover corte recurso próprio), seletor de período global, menus revisados.
- **F2 — Prestadores:** aba diferencial aprofundada (multi-especialidade).
- **F3 — Multidisciplinar:** aba Especialidades/Linhas de cuidado + visual de combinações.
- **F4 — Visual/responsivo:** redesign de gráficos fracos, mobile+desktop, render real.
- **F5 — Método/QA/publicação:** Método auditável, Worker e R2 privados, critérios de aceite, `--emit-p`, deploy em ordem backend→interface e verificação live.

---

## 14. Anexos

### 14.1 Exemplo — cálculo de intensidade e custo (auditável)
Para a terapia T, rede R, período P: `sessões = Σ Quantidade`; `intensidade_média = média_por_beneficiário(Σ Quantidade)`; `custo/sessão = Σ Pagamento ÷ Σ Quantidade(pagto>0)`. Sempre reproduzível linha a linha a partir da planilha-fonte.

### 14.2 Exemplo — shape sugerido do JSON agregado (ilustrativo)
```
{
  "meta": { "periodo": {"inicio":"2025/01","fim":"2026/06"}, "gerado_em":"AAAA-MM-DD",
            "terapias_descartadas": [{"terapia":"Método PECS — Fonoaudiologia","codigo":"50005146","motivo":"cobertura incompleta (13/18 meses)"}] },
  "populacao": { "criancas_unicas": 1416, "linhas_de_cuidado": {"1":716,"2":332,"3":246,"4":81,"5":26,"6":13,"7":2} },
  "terapias": [ {"terapia":"Terapia ABA — Psicologia","codigo":"50005103","especialidade":"Psicologia","metodo":"ABA", "sessoes": 0, "pagamento": 0, "beneficiarios": 0, "por_mes":[...], "por_canal":[...]} ],
  "prestadores": [ {"nome":"...","canal":"...","especialidades":["Psicologia","Fonoaudiologia"],"custo":0,"sessoes":0,"custo_sessao":0,"pacientes":1,"at_pct":0} ],
  "series_mensais": { "2025/01": {"sessoes":0,"custo":0,"criancas_ativas":0}, "...": {} }
}
```

### 14.3 Terapias descartadas hoje
- **Método PECS — Fonoaudiologia (50005146):** cobertura incompleta (13/18 meses), 20 registros, 3 pacientes → fora do painel; documentado no Método.

### 14.4 Conferência cruzada disponível
A Matriz Analítica consolidada (abas `Resumo_Executivo`, `Rede_por_Terapia`, `Prestadores`, `Formas_Pagamento`, `Qualidade_Dados`, `Mensal`, `Metodologia`, `Excecao_ABA_Psicologia`) é a referência 2025 para validar o pipeline. Os agregados 2025 do painel devem coincidir com ela.

---

*Fim do PRD. Autossuficiente para execução. Em caso de dúvida sobre regra de negócio (canal, exceção, descarte), a fonte de verdade é a operadora; nada é inventado.*
