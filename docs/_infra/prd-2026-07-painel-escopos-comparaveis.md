# PRD v4 — Painel Terapias Especiais · Escopos Comparáveis

**Complementa:** `prd-2026-07-painel-terapias-gestao.md` (v3, vigente no que este documento não altera).
**Motivação:** o painel atual analisa todas as terapias juntas — compara preço de fonoaudiologia com preço de ABA, intensidade de terapia ocupacional com intensidade de psicologia. Não é uma visão justa. **Só se compara o que é comparável**: prestadores dentro da mesma disciplina, pacientes submetidos às mesmas combinações de terapia.
**Data:** Julho de 2026 · **Autor:** Grupo CSV / EVS · AxiaCare

---

## 1. Fundamentação Clínica (Pesquisa Verificada)

Síntese de pesquisa multi-fonte com verificação adversarial (SBP, Ministério da Saúde — Linha de Cuidado TEA 2025, SOPERJ, SBNI 2025, material técnico TJPR 2018, normativos ANS). Achados que sustentam o desenho:

1. **O núcleo do cuidado multidisciplinar no TEA é o "tripé": psicologia/ABA + fonoaudiologia + terapia ocupacional** — convergência unânime das cinco fontes técnicas. Psicopedagogia, psicomotricidade, fisioterapia e terapia mediada por música entram como complementares caso a caso; equoterapia e hidroterapia ficam fora dos pilares e fora da cobertura obrigatória.
2. **Não existe "kit" único obrigatório**: o MS afirma que revisões sistemáticas não demonstram superioridade de um modelo sobre outro; a SBNI define a combinação como plano terapêutico individualizado. → Kits no painel são **cortes descritivos de comparabilidade**, nunca padrão normativo.
3. **ABA é o eixo com maior evidência** segundo as sociedades brasileiras; a intensidade típica de referência (material de apoio, não norma): ABA focado 10–25h/semana, abrangente 30–40h/semana (reservado a nível de suporte 3), ESDM 15–30h/semana até 48 meses; complementares 1–5x/semana.
4. **Nenhuma diretriz brasileira fixa dose por terapia** — a intensidade é do plano terapêutico individual, com trajetória esperada de **redução gradual** conforme evolução. Sub e sobreutilização são condenadas simetricamente pela SBNI ("intensidade baixa e inadequada" e "cargas horárias exorbitantes sem base científica").
5. **Regulação ANS**: RN 469/2021 — sessões **ilimitadas** de psicologia, TO e fonoaudiologia para CID F84; RN 539/2022 — a operadora deve ofertar prestador apto ao método indicado pelo médico (base da cobertura de ABA); RN 541/2022 — fim dos limites estendido (inclui fisioterapia). **Fora da cobertura obrigatória** (Pareceres 39/2024 e 25/2024, STJ out/2025): atendimento domiciliar/escolar, profissionais não-saúde (ex.: acompanhante terapêutico) e equoterapia/hidroterapia. → Intensidade alta **não é** violação regulatória; o código de assistente terapêutica é acordo específico da operadora, não rol.
6. **Intervenção precoce é padrão-ouro** e deve iniciar na suspeita, sem aguardar diagnóstico conclusivo (neuroplasticidade da primeira infância).
7. **Lacunas honestas da literatura**: não há benchmark verificado de preço por sessão no mercado brasileiro por terapia, nem metodologia formal publicada de case-mix para comparar prestadores dessas terapias. Princípios extraíveis: comparar **dentro da mesma disciplina**, ajustar por **gravidade e idade**, e ler a **trajetória de redução de carga** como marcador de evolução. → As referências de preço e intensidade do painel são **internas à carteira, por disciplina** — e declaradas como tal.

Todas as afirmações acima entram em **Método e Fontes** com as fontes nomeadas.

---

## 2. Princípio Arquitetural

> **Um escopo assistencial selecionado na entrada governa o painel inteiro.**

Selecionado o escopo "Fonoaudiologia", todas as abas — indicadores, evolução, prestadores, matriz, desvios, pacientes, canais — refletem apenas fonoaudiologia. Selecionado "Rede completa", o painel apresenta o retrato populacional (quem faz o quê), mas **não compara preço nem intensidade entre disciplinas diferentes** — as leituras comparativas ficam reservadas aos escopos comparáveis.

## 3. A Home ("Início")

Nova primeira entrada de navegação, antes da Visão Geral:

1. **Sobre o painel** — o que consolida, população, período, método em um parágrafo (evolução do card atual).
2. **Como usar** — passo a passo curto: escolher escopo, escolher período, navegar; toda tabela busca/ordena/exporta; ficha por clique.
3. **Seleção de escopo assistencial** (persistida em sessão, badge visível no topo em todas as abas):
   - **Rede completa** — retrato populacional e financeiro; sem comparações entre disciplinas.
   - **Por disciplina** — Psicologia/ABA · Fonoaudiologia · Terapia Ocupacional · Fisioterapia · Psicopedagogia · Psicomotricidade · Musicoterapia · demais (agrupadas quando pequenas).
   - **Por grupo comparável de pacientes (kit)** — cortes descritivos: **Tripé** (psicologia/ABA + fono + TO), **Tripé ampliado** (tripé + 1 ou mais complementares), **Duas terapias**, **Terapia única**. Rotulados como cortes de gestão, com a nota de que o plano terapêutico é individual.
4. **Seleção de período** (o seletor atual, apresentado e explicado).
5. **Mapa de comparabilidade** — quadro "quem faz o quê": prestadores × disciplinas (quais fazem quais terapias, volume em cada), com a classificação de comparabilidade do §5.

## 4. Efeito do Escopo em Cada Aba

| Aba | Rede completa | Disciplina | Kit |
|---|---|---|---|
| Visão Geral | KPIs totais + mix por disciplina + mapa de quem faz o quê | KPIs da disciplina + Δ | KPIs da coorte do kit |
| Evolução | Séries totais + decomposição | Séries e decomposição da disciplina | Séries da coorte |
| Terapias | Tabela de referência por disciplina | Detalhe da disciplina (códigos, canais, faixas) | Composição do kit |
| Prestadores | Ranking descritivo **sem** colunas de desvio (não comparável) | Ranking comparativo completo (desvio de faixa, intensidade, matriz de quadrantes) — **apenas prestadores da disciplina, com os números da disciplina** | Prestadores que atendem a coorte |
| Pacientes | População total + distribuição por kit | Crianças da disciplina (idade, intensidade, permanência) | Perfil da coorte (a comparação mais justa de pacientes) |
| Canais | Mix total | Mix e faixas do canal **dentro da disciplina** | Mix da coorte |
| Sinais do recorte | Somente sinais estruturais (reembolso) | Sinais de desvio da disciplina | — |

**Regra de ouro:** desvio de preço, razão de intensidade, quadrantes e sinais **só existem dentro de um escopo comparável** (disciplina, e por canal dentro dela). Na rede completa, essas leituras são substituídas pelo mapa de comparabilidade.

## 5. Classificação de Comparabilidade de Prestadores

Publicada no mapa e como badge na ficha:

- **Mono-disciplina** — 90%+ das sessões em uma disciplina: comparável dentro dela sem ressalva.
- **Multidisciplinar integrada** — oferece o tripé (ou mais): comparável com as demais integradas, disciplina a disciplina, pelo corte por disciplina do contrato v4.
- **Mista** — 2+ disciplinas sem o tripé completo: comparável apenas nos cortes por disciplina.

Nenhuma classe recebe juízo — a classificação define **com quem** cada prestador pode ser comparado, não se é bom ou ruim.

## 6. Contrato de Dados v4 (Pipeline — Requer os Brutos)

Acréscimos retrocompatíveis ao contrato atual, por recorte:

1. **`prestador_disciplina`**: por prestador × disciplina — pagamento, sessões, pacientes, custo/sessão, intensidade (sessões da disciplina por criança-mês), meses ativos. É o corte que torna a comparação por disciplina exata (hoje os números do prestador são totais).
2. **`referencias.preco_disciplina[disciplina][canal]`** e **`referencias.intensidade_disciplina[disciplina]`** — mediana/IQR sobre prestadores com ≥ 100 sessões **na disciplina** (k ≥ 5 por célula, senão não publica).
3. **`kits`**: por kit — crianças, pagamento, sessões, custo por criança-mês, idade mediana, permanência; e por criança×kit para os recortes de pacientes (agregado, nunca individual).
4. **`prestador_comparabilidade`**: classe do §5 por prestador + % de sessões por disciplina.
5. **`disciplina_serie`**: série mensal por disciplina (pagamento, sessões, crianças) para Evolução re-escopada.
6. Validações: soma dos cortes por disciplina = total do prestador (tolerância de centavos); anti-vazamento estendido; k-anonimato nas células de kit.

## 7. Implementação Interina (Client-Side, Antes do Contrato v4)

O que o front entrega já, com limitação declarada:

- Home com sobre/como usar/seleção de escopo e período; escopo por **especialidade** usando o atributo atual dos prestadores e as terapias por especialidade dos agregados (aproximação: os números de prestadores multidisciplinares permanecem totais — badge "valores totais do prestador; corte exato por disciplina chega com o contrato v4").
- Kits derivados de `linhas_cuidado.combinacoes` (já publicado): distribuição de crianças por combinação, com o tripé destacado como referência clínica.
- Mapa de quem faz o quê a partir de prestador×especialidades (presença e volume total).
- Ocultação das leituras comparativas (desvios, quadrantes, sinais de prestador) no escopo Rede completa.

## 8. Método e Fontes (Acréscimos)

- Seção "Fundamentação clínica e regulatória" com o §1 e as fontes (SBP, MS 2025, SOPERJ, SBNI 2025, TJPR 2018, RN 469/539/541, Pareceres 39 e 25/2024).
- Nota sobre intensidade: sem dose normativa; referências internas por disciplina; sessões ilimitadas por regulação — intensidade alta não é, por si, irregularidade; trajetória esperada de redução gradual.
- Nota sobre o código de assistente terapêutica: acordo específico da operadora, fora do rol obrigatório.
- Declaração de que kits são cortes descritivos de gestão.

## 9. Critérios de Aceite

1. Home é a entrada; escopo selecionado persiste e aparece como badge em todas as abas.
2. Nenhuma leitura comparativa (desvio, quadrante, sinal de prestador) renderiza fora de escopo comparável.
3. No escopo de disciplina com contrato v4, os números de cada prestador são os da disciplina (soma dos cortes = total, validado no build).
4. Kits reproduzem as combinações publicadas; célula com menos de 5 crianças não publica.
5. Mapa de comparabilidade lista 100% dos prestadores do recorte com classe e disciplinas.
6. Método contém a fundamentação e as fontes; zero recomendações de conduta em qualquer tela.
7. Aceites v3 preservados (LGPD, noindex, sem metalinguagem, render limpo, /p/ regenerado).

## 10. Fases

1. **F1 — Contrato v4 no pipeline** (máquina com os brutos; AGENTS.md orienta).
2. **F2 — Home + seletor de escopo** (client-side interino do §7).
3. **F3 — Re-escopo das abas** conforme §4 (interino por especialidade; exato quando F1 publicar).
4. **F4 — Kits e mapa de comparabilidade**.
5. **F5 — Método, varreduras, render real, /p/, deploy, verificação no link real.**
