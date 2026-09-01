<template>
<section class="compass-section">
<h2>1. Introdução e contextualização do cenário regulatório</h2>

<p>A dinâmica de financiamento e a arquitetura de custos da saúde suplementar brasileira encontram-se em um ponto de inflexão crítico no que tange às abordagens cirúrgicas de alta complexidade para a urologia oncológica. Historicamente, a adoção de tecnologias cirúrgicas minimamente invasivas, especificamente a cirurgia robótica, operava sob um modelo de cofinanciamento híbrido e não regulamentado. Neste modelo anterior, as operadoras de planos de saúde possuíam uma "visão cega" do Custo Total de Propriedade (Total Cost of Ownership - TCO) da intervenção. A operadora arcava estritamente com as frações da conta hospitalar codificadas como cirurgia aberta ou videolaparoscópica convencional, enquanto o paciente, mediante desembolso direto (out-of-pocket), assumia os custos inerentes à inovação: a taxa de depreciação do equipamento (taxa de robô) e o kit de instrumentais descartáveis específicos.</p>

<p>Esse paradigma sofreu uma ruptura regulatória definitiva com a publicação da Resolução Normativa (RN) ANS nº 654, de 12 de dezembro de 2025. A normativa alterou os Anexos I e II da RN nº 465/2021, inserindo oficialmente o procedimento "Prostatectomia Radical Assistida por Robô" no Rol de Procedimentos e Eventos em Saúde, com cobertura obrigatória fixada a partir de 1º de abril de 2026. A inclusão é acompanhada pela Diretriz de Utilização (DUT) nº 173, que chancela a obrigatoriedade do custeio integral pelas operadoras para pacientes com diagnóstico de câncer de próstata em estágio localizado ou localmente avançado. [1][2][3][4][5]</p>

<p>Para as operadoras de planos de saúde, a internalização compulsória desses custos impõe um desafio de dimensionamento atuarial agudo. A assimetria de informação, onde apenas os prestadores hospitalares detinham a visão do custo total da linha de cuidado, deve ser superada rapidamente. Estimar o impacto financeiro para o biênio 2025-2026 exige, portanto, uma dissecação exaustiva de múltiplas variáveis inter-relacionadas: a base epidemiológica da doença no Brasil, a transição demográfica específica da carteira de beneficiários, as alterações profundas na codificação e valoração de honorários médicos (CBHPM), e os efeitos compensatórios (custo-offset) gerados pela superioridade dos desfechos clínicos da via robótica. Este Compass&trade; fornece uma modelagem quantitativa e qualitativa rigorosa para balizar o planejamento estratégico e provisionamento financeiro das operadoras de saúde suplementar.</p>
</section>

<section class="compass-section">
<h2>2. Fundamentos epidemiológicos: a magnitude do câncer de próstata no Brasil</h2>

<p>Qualquer projeção atuarial de impacto cirúrgico deve ter como premissa basilar o comportamento epidemiológico da patologia subjacente. O Instituto Nacional de Câncer (INCA) delineia um cenário de saúde pública de proporções crescentes e alarmantes para o país. De acordo com o relatório "Perfil Epidemiológico da Incidência de Câncer no Brasil e Regiões", as estimativas para o triênio 2026-2028 apontam para o registro de 781 mil novos casos anuais de câncer no território nacional. [6][7][8]</p>

<p>Quando excluídos os tumores de pele não melanoma — caracterizados por altíssima incidência, porém baixíssima letalidade —, o volume de novas ocorrências atinge a marca de 518 mil diagnósticos anuais, distribuídos de maneira simétrica entre os sexos (49,4% em homens e 50,6% em mulheres). Neste universo, o perfil oncológico brasileiro é ditado por seis localizações primárias que respondem por cerca de 65% da carga total da doença. O câncer de próstata desponta como a neoplasia maligna mais incidente no sexo masculino, representando 30,5% de todos os tumores diagnosticados em homens, equiparando-se em magnitude apenas ao câncer de mama feminino (30,0% entre as mulheres).</p>

<p>Em números absolutos, o INCA projeta a ocorrência de exatos 77.920 novos casos de câncer de próstata no Brasil para o ano de 2026. Contudo, a análise aprofundada dos dados revela que esta carga de morbidade não se distribui de forma homogênea, sendo profundamente influenciada por determinantes demográficos, longevidade, urbanização e acesso a serviços de rastreamento precoce. O relatório destaca que o país vivencia uma transição epidemiológica complexa, onde convivem tumores associados ao envelhecimento populacional e à adoção de estilos de vida urbanos (como o câncer de próstata e colorretal) e tumores ligados à vulnerabilidade social e infecções. [9][10][11]</p>

<p>A heterogeneidade espacial é evidenciada nas taxas ajustadas de incidência por 100 mil homens. A Região Sudeste, caracterizada por maior Índice de Desenvolvimento Humano (IDH) e maior concentração de infraestrutura médico-hospitalar, lidera as estatísticas com uma taxa ajustada de 64,12 casos por 100 mil homens. Em seguida, observa-se a Região Nordeste com 49,28 casos por 100 mil homens e a Região Norte com 31,38 casos por 100 mil homens. Para refinar a modelagem das operadoras, que possuem suas carteiras primariamente concentradas em grandes centros urbanos, é fundamental observar a distribuição projetada de casos absolutos pelas capitais brasileiras, conforme sistematizado pelo INCA para o ano de 2026:</p>

<table class="comparison-table">
<thead>
<tr><th>Capital</th><th>Região</th><th>Estimativa de novos casos de câncer de próstata (2026)</th></tr>
</thead>
<tbody>
<tr><td>São Paulo</td><td>Sudeste</td><td>4.580</td></tr>
<tr><td>Rio de Janeiro</td><td>Sudeste</td><td>3.570</td></tr>
<tr><td>Salvador</td><td>Nordeste</td><td>1.070</td></tr>
<tr><td>Belo Horizonte</td><td>Sudeste</td><td>1.030</td></tr>
<tr><td>Fortaleza</td><td>Nordeste</td><td>670</td></tr>
<tr><td>Goiânia</td><td>Centro-Oeste</td><td>670</td></tr>
<tr><td>Recife</td><td>Nordeste</td><td>490</td></tr>
<tr><td>Porto Alegre</td><td>Sul</td><td>400</td></tr>
<tr><td>Curitiba</td><td>Sul</td><td>370</td></tr>
<tr><td>Campo Grande</td><td>Centro-Oeste</td><td>360</td></tr>
<tr><td>João Pessoa</td><td>Nordeste</td><td>350</td></tr>
<tr><td>Manaus</td><td>Norte</td><td>340</td></tr>
</tbody>
</table>

<p>O conjunto das capitais brasileiras absorverá, isoladamente, 16.340 casos novos em 2026, evidenciando a concentração da demanda especializada nos polos que, coincidentemente, detêm o monopólio das plataformas robóticas instaladas no país. Estados isolados também apresentam números expressivos; o Ceará, por exemplo, projeta 3.050 novos casos, com uma taxa bruta de incidência de 67,58 por 100 mil homens. Esses dados consolidam a premissa de que a pressão assistencial pela prostatectomia robótica será aguda, geograficamente concentrada e sustentada por uma base epidemiológica robusta.</p>
</section>

<section class="compass-section">
<h2>3. Demografia da saúde suplementar: o vetor do envelhecimento</h2>

<p>A transposição direta dos dados epidemiológicos nacionais do INCA para a realidade da saúde suplementar seria um erro metodológico primário. As operadoras de planos de saúde lidam com um subconjunto populacional que apresenta características socioeconômicas e demográficas distintas da média nacional coberta exclusivamente pelo Sistema Único de Saúde (SUS). Para estimar a incidência interna, é necessário analisar o tamanho e a composição da carteira de beneficiários regulada pela ANS.</p>

<p>A evolução histórica da base de usuários indica resiliência e crescimento do setor. Dados da Sala de Situação da ANS demonstram que, ao longo do ano de 2025, o mercado de planos médico-hospitalares oscilou positivamente, alcançando marcas em torno de 52 milhões a 53 milhões de beneficiários. Em abril de 2025, por exemplo, o setor registrou 52.331.258 usuários em assistência médica, configurando um crescimento de quase 1 milhão de beneficiários (996.834) em relação ao mesmo período de 2024. A expansão ocorreu em múltiplos estados, inclusive naqueles de menor densidade populacional, indicando uma capilarização do acesso privado. A título de ilustração do crescimento interanual por unidade federativa, observam-se os seguintes incrementos na assistência médica entre 2024 e 2025: [12][13][14]</p>

<table class="comparison-table">
<thead>
<tr><th>Estado</th><th>Beneficiários (2024)</th><th>Beneficiários (2025)</th><th>Variação absoluta</th></tr>
</thead>
<tbody>
<tr><td>Amazonas</td><td>628.880</td><td>701.983</td><td>+ 73.103</td></tr>
<tr><td>Alagoas</td><td>387.419</td><td>392.470</td><td>+ 5.051</td></tr>
<tr><td>Amapá</td><td>63.540</td><td>66.192</td><td>+ 2.652</td></tr>
<tr><td>Acre</td><td>45.354</td><td>46.987</td><td>+ 1.633</td></tr>
</tbody>
</table>

<p>O fator mais crítico para a projeção da incidência do câncer de próstata, no entanto, não é o volume absoluto da carteira, mas a sua estruturação etária. A saúde suplementar brasileira experimenta um envelhecimento hiperbólico. De acordo com relatórios setoriais, a proporção de beneficiários na faixa etária de 50 anos ou mais — a janela temporal em que se iniciam os protocolos de rastreamento do câncer de próstata (screening) por meio da dosagem do Antígeno Prostático Específico (PSA) e do toque retal — cresceu exponencialmente, saltando de 20% para 26,3% da base total nos anos recentes. [15]</p>

<p>Este fenômeno de longevidade na base privada é extremo em faixas etárias superiores. A ANS registrou um crescimento vertiginoso de 42% no número de beneficiários centenários em um interstício de apenas cinco anos (passando de 7.636 para 10.845). Tal longevidade, combinada com o acesso facilitado a exames diagnósticos de alta sensibilidade (como a Ressonância Magnética Multiparamétrica da próstata e biópsias guiadas por ultrassom), gera um "viés de detecção" significativo. Homens na saúde suplementar são submetidos a rastreamentos mais frequentes e precoces do que os usuários do SUS. Consequentemente, a taxa de diagnóstico de neoplasias prostáticas nas fases assintomáticas (localizadas) é consideravelmente maior no ambiente privado, o que amplia a base de pacientes potencialmente elegíveis para intervenções cirúrgicas com intuito curativo. [16]</p>
</section>

<section class="compass-section">
<h2>4. A trajetória regulatória e a Diretriz de Utilização (DUT 173)</h2>

<p>A inclusão da Prostatectomia Radical Assistida por Robô no Rol da ANS não consistiu em um ato regulatório isolado e espontâneo, mas sim no ápice de uma intensa pressão judicial e de uma reestruturação legislativa dos processos de Avaliação de Tecnologias em Saúde (ATS). Até 2025, o arcabouço normativo obrigava as operadoras a cobrir o tratamento cirúrgico do câncer de próstata, porém as diretrizes não especificavam a via de acesso. Operadoras autorizavam a videolaparoscopia convencional ou a cirurgia aberta. A evolução da técnica, contudo, converteu a cirurgia robótica no padrão-ouro global para o tratamento cirúrgico pélvico.</p>

<p>Diante do vácuo regulatório, o Poder Judiciário passou a intervir sistematicamente. Decisões do Superior Tribunal de Justiça (STJ) pacificaram o entendimento de que a negativa de cobertura da via robótica pelas operadoras configurava prática abusiva. Em julgados emblemáticos (como o REsp 2235175/RS), o STJ argumentou que, sendo a robótica o método mais seguro e eficaz, com riscos drasticamente menores de infecção e menores taxas de sequelas funcionais (impotência e incontinência), o plano de saúde estava compelido a custeá-la, independentemente de sua ausência explícita no Rol da ANS. [17][18]</p>

<p>Paralelamente, o próprio ciclo de atualização do Rol sofreu mudanças drásticas. A Lei nº 14.307, de 03 de março de 2022 (que alterou a Lei nº 9.656/1998), impôs prazos severos e reduziu os ciclos de avaliação tecnológica da ANS. A Resolução Normativa nº 555, de dezembro de 2022, estabeleceu o novo rito, obrigando a Agência a incorporar evidências científicas de forma mais ágil, fundamentadas em Relatórios de Análise de Impacto Regulatório (RAIR) e análises de custo-efetividade comparativa. [19][20]</p>

<p>A culminância desse processo ocorreu com a publicação da RN ANS nº 654/2025, que altera as resoluções anteriores (como a RN 465/2021) e estipula a vigência da cobertura a partir de 1º de abril de 2026. Do ponto de vista da auditoria em saúde, o elemento vital desta Resolução é a vinculação da cobertura à <strong>Diretriz de Utilização (DUT) nº 173</strong>. A DUT determina o perímetro de obrigatoriedade jurídica da operadora, estipulando que a prostatectomia assistida por robô possui cobertura mandatória quando indicada para:</p>

<ol>
<li>Tratamento de câncer de próstata em estágio localizado.</li>
<li>Tratamento de câncer de próstata em estágio localmente avançado.</li>
</ol>

<p>O enquadramento nos anexos I e II da RN categoriza a cobertura nos segmentos Hospitalar com Obstetrícia (HCO) e Hospitalar sem cobertura de parto (HSC). É notório que a DUT 173 não incluiu parâmetros restritivos secundários baseados em graduação histológica (como o escore de Gleason ou ISUP) ou expectativas de vida do paciente, transferindo a responsabilidade da modulação da indicação clínica para as auditorias das operadoras e para os protocolos internos dos prestadores. Curiosamente, a trajetória de incorporação na saúde suplementar difere da rede pública; a Comissão Nacional de Incorporação de Tecnologias no SUS (Conitec), em 2021 (Relatório 50), havia recomendado a não incorporação da tecnologia para tumores localizados no sistema público, embora discussões subsequentes em 2025 (Relatório 555) tenham reaberto o debate considerando a eficácia a longo prazo. [21][22][23]</p>
</section>

<section class="compass-section">
<h2>5. Modelagem atuarial: estimativa quantitativa de procedimentos (2025-2026)</h2>

<p>Para que as operadoras de saúde construam provisões financeiras acuradas (IBNR - Incurred But Not Reported / Peona - Provisão para Eventos Ocorridos e Não Avisados), é necessário converter as variáveis epidemiológicas, demográficas e de indicação clínica em estimativas quantitativas tangíveis. O modelo a seguir projeta a incidência de cirurgias de prostatectomia radical assistida por robô na saúde suplementar brasileira.</p>

<h3>5.1. Cálculo da incidência base na saúde suplementar</h3>

<p>Partindo da projeção nacional do INCA de 77.920 novos casos de câncer de próstata para 2026, deve-se aplicar o extrator populacional. A saúde suplementar, com aproximadamente 53 milhões de beneficiários, abrange cerca de 24,6% da população brasileira (estimada em 215 milhões). Uma transposição demográfica linear indicaria cerca de 19.168 casos dentro do sistema privado. Contudo, devido à pirâmide etária majorada (26,3% da carteira com mais de 50 anos) e ao rastreamento ativo e rotineiro (exames de PSA cobertos em massa), o Fator de Correção Epidemiológica eleva esta projeção. Estima-se conservadoramente que o sistema suplementar responda por cerca de 28% a 30% dos diagnósticos absolutos precoces do país. Portanto, a projeção atuarial de diagnósticos incidentes de câncer de próstata nas operadoras é de <strong>22.500 a 23.300 novos casos anuais</strong> no biênio 2025-2026.</p>

<h3>5.2. Taxa de indicação terapêutica curativa (DUT 173)</h3>

<p>De acordo com os protocolos urológicos contemporâneos, uma parcela considerável dos pacientes recém-diagnosticados não possui indicação cirúrgica. Pacientes com doença metastática primária são encaminhados para terapias sistêmicas, como o bloqueio androgênico e o uso de antiandrogênicos de nova geração (ex: enzalutamida), drogas cujo impacto orçamentário médio anual já adiciona de R$ 121 milhões a R$ 291 milhões em despesas para as operadoras, atendendo contingentes restritos de cerca de 2.500 pacientes. Outra parcela expressiva, composta por tumores indolentes de baixíssimo risco em pacientes idosos, é direcionada à Vigilância Ativa (Active Surveillance) ou radioterapia exclusiva.</p>

<p>Dados assistenciais indicam que a taxa de indicação de tratamento cirúrgico radical para pacientes diagnosticados na janela de doença "localizada ou localmente avançada" (os parâmetros exatos da DUT 173) flutua historicamente entre 40% e 45%. Aplicando o teto dessa faixa sobre a base projetada, tem-se um volume potencial de <strong>10.125 a 10.485 indicações para prostatectomia radical</strong> em todas as vias (aberta, laparoscópica e robótica) na saúde suplementar anualmente.</p>

<h3>5.3. Fator de migração e a curva de substituição tecnológica</h3>

<p>Até 2025, o mercado de prostatectomias dividia-se entre a via aberta (frequentemente coberta de forma integral sem barreiras), a laparoscopia pura e a robótica. O crescimento da robótica era mitigado por uma barreira financeira: o desembolso out-of-pocket do paciente para a taxa do robô (variando de R$ 10.000 a R$ 25.000). A partir de abril de 2026, com a vigência da RN 654/2025, o custo integral migra para a operadora, anulando a barreira financeira para o beneficiário.</p>

<p>A literatura da economia da saúde demonstra que a eliminação de barreiras de co-pagamento para tecnologias percebidas como padrão-ouro gera um fenômeno imediato de "substituição tecnológica" (technology substitution). A projeção é de que, nas regiões onde há capacidade instalada de plataformas robóticas (primariamente capitais e polos do Sul e Sudeste), a via robótica passe a canibalizar a via aberta e a laparoscópica, absorvendo entre 80% a 90% das indicações cirúrgicas de próstata.</p>

<p>A síntese destas variáveis modela o seguinte cenário quantitativo anual para a saúde suplementar:</p>

<table class="comparison-table">
<thead>
<tr><th>Indicador de modelagem atuarial</th><th>Cenário 2025 (regulação anterior)</th><th>Cenário 2026 (pós-vigência RN 654)*</th></tr>
</thead>
<tbody>
<tr><td>Casos totais de câncer de próstata na saúde suplementar</td><td>21.800 a 22.500</td><td>22.500 a 23.300</td></tr>
<tr><td>Total de indicações para prostatectomia radical (todas as vias)</td><td>~ 9.810</td><td>~ 10.125</td></tr>
<tr><td>Market share / adoção da via robótica</td><td>35% a 45%</td><td>80% a 85%</td></tr>
<tr><td><strong>Quantitativo estimado de prostatectomias robóticas (faturadas)</strong></td><td><strong>3.433 a 4.414 cirurgias/ano</strong></td><td><strong>8.100 a 8.606 cirurgias/ano</strong></td></tr>
</tbody>
</table>

<p><em>Nota: A vigência em 01/04/2026 poderá gerar um efeito de demanda reprimida (represamento de cirurgias eletivas não urgentes) no primeiro trimestre, provocando um pico de faturamento e volume no segundo e terceiro trimestres.</em></p>

<p>As operadoras devem estar atentas à distorção que esse represamento pode causar na sinistralidade no meio do ano de 2026. A previsão quantitativa central sugere que o mercado absorverá um choque de demanda, dobrando o volume absoluto de autorizações que exigirão a nova e dispendiosa codificação e valoração em um curto espaço de tempo.</p>
</section>

<section class="compass-section">
<h2>6. A nova estrutura de custos: a revolução da CBHPM e o TCO</h2>

<p>O impacto da RN 654/2025 na sinistralidade não reside apenas na transferência do pagamento da taxa do robô do paciente para a operadora, mas em uma reestruturação profunda de toda a arquitetura de faturamento e valoração médica chancelada pela Associação Médica Brasileira (AMB).</p>

<h3>6.1. A reforma da codificação e a valoração de honorários</h3>

<p>Antes da obrigatoriedade, a falta de padronização permitia que os procedimentos robóticos fossem faturados utilizando códigos correlatos da videolaparoscopia, com honorários limitados aos portes laparoscópicos. Visando corrigir esta defasagem remuneratória, a Sociedade Brasileira de Urologia (SBU) encabeçou um forte movimento institucional junto à Câmara Técnica da Classificação Brasileira Hierarquizada de Procedimentos Médicos (CBHPM). Sob a liderança argumentativa de que a cirurgia robótica detém maior nível de complexidade tecnológica e exige capacitação e demanda assistencial superiores, a SBU evitou que a robótica fosse financeiramente equiparada à laparoscopia. [24][25]</p>

<p>O resultado destas articulações materializou-se na Resolução Normativa AMB nº 71/2026, que concedeu conquistas históricas para a especialidade. O documento estabeleceu a codificação autônoma no âmbito da Terminologia Unificada da Saúde Suplementar (TUSS), inserindo os seguintes procedimentos de forma explícita e majorada:</p>

<ul>
<li><strong>Prostatovesiculectomia radical robótica (Cód. 3.12.01.18-0):</strong> O porte do procedimento saltou de 12C (limite anterior) para 13B, atingindo o patamar máximo de valorização estipulado pelos critérios atuais da CBHPM.</li>
<li><strong>Linfadenectomia pélvica robótica (Cód. 3.09.14.17-5):</strong> Elevação expressiva do porte de 11B para 13B.</li>
</ul>

<p>O impacto financeiro desta reclassificação é direto e significativo: o custo-base dos honorários médicos primários saltou consideravelmente. Ademais, a RN AMB nº 71/2026 introduziu uma inovação estrutural na composição da equipe cirúrgica que encarecerá ainda mais as faturas: o reconhecimento formal da figura do <strong>"auxiliar robótico"</strong> (ou cirurgião robótico atuante ao lado do paciente). Este novo grau de participação não substitui um assistente simples; trata-se de um cirurgião com capacitação técnica integral capaz de assumir o console e conduzir a operação caso ocorra qualquer intercorrência com o cirurgião principal ou falha sistêmica do equipamento, conferindo maior segurança ao paciente, porém gerando a cobrança legítima de um honorário altamente valorizado que deverá ser suportado pela operadora.</p>

<h3>6.2. O Custo Total de Propriedade (TCO), CAPEX e insumos específicos</h3>

<p>Sob a rubrica dos custos hospitalares, as operadoras enfrentarão a transferência integral do TCO do equipamento robótico. A infraestrutura robótica representa uma imobilização de capital (CAPEX) extremamente agressiva. O ecossistema é globalmente dominado pela empresa norte-americana Intuitive Surgical, cujo modelo principal (como o Da Vinci Xi) exige um investimento da ordem de 3 milhões de dólares — cifra que, sob pressões e volatilidades cambiais, converte-se em aproximadamente 15 milhões de reais. Além da aquisição, os prestadores assumem um Custo Operacional (OPEX) fixo na forma de contratos de manutenção preventiva e suporte contínuo, cujo valor transita na média de R$ 80.000 mensais por plataforma instalada. [1][26]</p>

<p>A amortização desse capital intensivo obriga os hospitais a exigirem a taxa de uso do robô. Mais crítico, entretanto, é o custo inerente à matriz de descartáveis específicos. O modelo de negócios da cirurgia robótica baseia-se em consumíveis proprietários. Para realizar uma única prostatectomia radical assistida por robô (o procedimento urológico mais volumoso), o centro cirúrgico utiliza invariavelmente uma cesta padronizada de materiais que engloba:</p>

<ul>
<li><strong>5 Pinças Robóticas:</strong> As pinças possuem microchips internos que limitam o seu uso (frequentemente programadas para inutilização após 10 usos, o que força o hospital a embutir 10% do valor da pinça na conta de cada cirurgia).</li>
<li><strong>1 Trocater descartável especializado.</strong></li>
<li><strong>1 Agulha para punção e clips hemostáticos.</strong></li>
<li><strong>1 Kit estéril para vedação dos braços mecânicos (Drapes):</strong> Fundamentais para a assepsia do equipamento não-esterilizável.</li>
</ul>

<p>A soma do CAPEX diluído, dos R$ 80.000 mensais de manutenção, da cesta de insumos proprietários e dos novos portes médicos (13B) e de auxiliares da AMB estabelece uma nova linha de base (baseline) de custo por sinistro que as operadoras deverão parametrizar em seus modelos de provisionamento.</p>
</section>

<section class="compass-section">
<h2>7. Desfechos clínicos e eficiência: a teoria do custo-offset</h2>

<p>As pressões para a incorporação da cirurgia robótica, refletidas nos Relatórios de Análise de Impacto Regulatório (RAIR) e nos pareceres jurídicos que fundamentaram decisões do STJ, não decorrem de mero fascínio tecnológico, mas de um corpo denso de evidências científicas baseadas na superioridade dos desfechos. Na avaliação econômica em saúde suplementar, não se deve analisar a elevação primária do custo do procedimento sem computar a redução drástica das linhas de cuidado crônicas pós-operatórias — fenômeno conceituado como <strong>custo-offset</strong>. [19][20]</p>

<p>A pesquisa clínica corrobora os argumentos de ganho sistêmico. Um estudo paradigmático conduzido e publicado sobre os desfechos na rede pública (Serviço do Sistema Único de Saúde em Curitiba/PR) entre os anos de 2016 e 2021 avaliou de forma comparativa 367 pacientes submetidos às vias Aberta (RRP), Videolaparoscópica (VLP) e Robótica (RALP). Os resultados desta pesquisa elucidam as variáveis que impactam a economia da saúde das operadoras: [27][28]</p>

<ul>
<li><strong>Tempo de Internação Hospitalar:</strong> O estudo demonstrou que os pacientes da técnica robótica (RALP) apresentaram um tempo de internação significativamente inferior em comparação à cirurgia aberta (p=0.0007). De fato, a literatura secundária ratifica que a alta hospitalar na robótica ocorre, rotineiramente, em até 48 horas após a intervenção. Cada diária evitada reduz o risco das dispendiosas infecções associadas à assistência à saúde (IRAS) e elimina cobranças de hotelaria.</li>
<li><strong>Tempo Cirúrgico:</strong> Embora a robótica traga benefícios pós-operatórios, a pesquisa notou que o tempo de sala cirúrgica tendeu a ser ligeiramente superior à via aberta e laparoscópica (p=0.001), variável que pode exercer pressão sobre as cobranças de taxa de sala e anestesia.</li>
<li><strong>Complicações Evitadas:</strong> A incidência de complicações intra e pós-operatórias na via aberta é proeminente. Eventos cardiovasculares sistêmicos, como infarto do miocárdio, trombose venosa profunda, e embolia pulmonar, além de fístulas anastomóticas e linfoceles, são acentuadamente reduzidos pelo menor sangramento e precisão da robótica. Reduzir reinternações em Unidade de Terapia Intensiva (UTI) para tratamento de sepse ou trombose atua como um dos maiores drivers de custo-offset.</li>
</ul>

<p>Ainda mais relevante para o equilíbrio financeiro atuarial de longo prazo é a preservação da funcionalidade neurovascular. A extirpação cirúrgica da glândula prostática na técnica aberta convencional carrega taxas proibitivas de lesão dos feixes nervosos (nervos cavernosos) e do mecanismo esfincteriano. O estudo comparativo atestou que a prostatectomia robótica está correlacionada a uma taxa estatisticamente inferior de disfunção sexual (impotência) no seguimento de até um ano pós-procedimento (p=0.039). Da mesma forma, a robótica acelera a recuperação da continência urinária.</p>

<p>Para uma operadora de saúde, um paciente que evolui para incontinência urinária severa crônica e disfunção erétil refratária transforma-se em um consumidor de recursos perenes. A reabilitação exige o custeio de extensos ciclos de fisioterapia pélvica, o fornecimento contínuo de materiais absorventes (em contratos corporativos específicos) e acompanhamento urológico ininterrupto. Em cenários graves e persistentes de incontinência, o SUS e as operadoras de saúde são obrigados a arcar com procedimentos cirúrgicos complexos para o implante de dispositivos dispendiosos, como o Esfíncter Urinário Artificial, justificado pelos "significativos benefícios clínicos para a qualidade de vida e a integração social" (vide discussões da Conitec). Semelhantemente, a impotência permanente motiva a indicação cirúrgica e o financiamento de próteses penianas de altíssimo custo (materiais de OPME). A prevenção destas comorbidades no "tempo zero" pela adoção da plataforma robótica consubstancia uma economia invisível que deve ser quantificada nos modelos longitudinais das operadoras. [29]</p>
</section>

<section class="compass-section">
<h2>8. Recomendações estratégicas para o enfrentamento regulatório e assistencial</h2>

<p>Diante da materialização quantitativa da demanda — projetando-se de <strong>8.100 a 8.600 procedimentos no ano de 2026</strong> [conforme modelo atuarial da seção 5] — e do incremento substancial do custo primário atrelado ao modelo da AMB/CBHPM e à matriz de TCO da Intuitive Surgical, a passividade gerencial culminará em uma deterioração severa do Índice de Sinistralidade (Loss Ratio) das operadoras a partir do segundo trimestre de 2026. A adoção de ferramentas de gestão em saúde baseada em valor (Value-Based Healthcare - VBHC) e governança clínica rigorosa faz-se imperativa.</p>

<h3>A. Regulamentação e auditoria baseada na DUT 173</h3>

<p>As áreas de regulação prévia das operadoras deverão instaurar trilhas de auditoria estritas fundamentadas no texto normativo. A RN 654/2025 assegura a cobertura exclusivamente para a neoplasia de próstata em estágios "localizado ou localmente avançado". As juntas médicas devem auditar os estadiamentos clínicos (avaliações por Ressonância Magnética Multiparamétrica, cintilografias ósseas, tomografias computadorizadas e biópsias) para evitar o fenômeno da <strong>Demanda Induzida</strong>.</p>

<p>A demanda induzida é o risco mais grave neste novo cenário. Hospitais que investiram 15 milhões de reais em plataformas robóticas buscarão alavancar agressivamente seus volumes cirúrgicos para obter retorno sobre o investimento (ROI). Isso pode gerar a pressão para indicar a cirurgia robótica em casos muito iniciais ou indolentes (como o câncer de próstata Grau Grupo 1 de ISUP em pacientes idosos), onde a literatura médica baseada em evidência e as sociedades de urologia preconizariam a "Vigilância Ativa" sem nenhuma intervenção cirúrgica curativa imediata. Proteger a carteira de excessos cirúrgicos (overuse) será vital. Além disso, a auditoria deve certificar as credenciais médicas. É imprescindível garantir documentalmente que o cirurgião principal e o "auxiliar robótico" estejam plenamente certificados para operar especificamente no sistema instalado (seja ele Da Vinci, Hugo RAS ou Versius), evitando falhas catastróficas por incompetência técnica e a consequente responsabilização civil e financeira da operadora. [30]</p>

<h3>B. Transição de modelo de pagamento: DRG e pacotes globais</h3>

<p>A negociação baseada no modelo analógico de <em>fee-for-service</em> (conta aberta) resultará no fracionamento abusivo de itens (unbundling), tornando o custo da cirurgia indomável. As operadoras devem aproveitar a previsibilidade da cesta de descartáveis (pinças restritas por chip, kits de assepsia padronizados) para formatar, até abril de 2026, modelos de remuneração prospectivos baseados em <strong>Pacotes Globais ou Grupos de Diagnósticos Relacionados (DRG)</strong>.</p>

<p>O pacote (bundled payment) deve precificar e englobar os honorários médicos (novo porte 13B e auxiliar), as taxas de locação ou depreciação da sala inteligente, as diárias de internação e toda a estrutura de insumos e medicamentos essenciais. Ao alinhar os incentivos, o hospital de alta complexidade assumirá o risco operacional por ineficiências (como desperdício de insumos ou prolongamento excessivo do tempo de sala).</p>

<h3>C. Direcionamento de rede (Network Steering) e economia de escala</h3>

<p>Diluir a imensa carga fixa da depreciação do CAPEX e do OPEX de manutenção preventiva (R$ 80.000 mensais) requer escala. O custo marginal de uma prostatectomia robótica declina substancialmente quanto mais a máquina é utilizada. Consequentemente, as operadoras de saúde suplementar devem restringir estrategicamente suas redes credenciadas para procedimentos robóticos, canalizando o volume projetado de 8.600 cirurgias [conforme seção 5] para centros de excelência de alto volume (high-volume centers).</p>

<p>Estudos globais em cirurgia oncológica demonstram que cirurgiões e hospitais de alto volume possuem não apenas economias de escala que permitem precificações de pacotes mais agressivas, mas também uma proficiência técnica superior que neutraliza a curva de aprendizado, resultando em menor tempo de permanência e taxas de complicações significativamente mais baixas do que em hospitais periféricos. O direcionamento de pacientes (network steering) para redes verticalizadas ou polos hospitalares parceiros protegerá o teto orçamentário da instituição.</p>
</section>

<section class="compass-section">
<h2>9. Conclusão final e projeções estruturais</h2>

<p>O ciclo temporal delimitado pela ANS (aprovado em dezembro de 2025 para vigência em abril de 2026) estipulou uma janela exígua para a adequação técnico-financeira do ecossistema de saúde suplementar. A introdução da Prostatectomia Radical Assistida por Robô no Rol consubstancia uma vitória do avanço tecnológico e da qualidade assistencial; todavia, encerra o período de proteção artificial do qual as operadoras usufruíam ao não arcarem com os componentes nucleares do TCO da inovação.</p>

<p>O volume projetado de até <strong>8.600 cirurgias</strong> apenas em 2026 (potencializado por represamentos pregressos e uma base envelhecida crescente de mais de 53 milhões de beneficiários) forçará uma reprecificação imediata da cobertura cirúrgica urológica. As organizações que não executarem uma transição ágil para o desenho de pacotes de remuneração em DRG, acompanhada por diretrizes estritas de auditoria (DUT 173) e direcionamento de rede para mitigação de custos de capital hospitalar, estarão expostas a abalos substanciais na estabilidade atuarial de suas carteiras corporativas e familiares. Em contrapartida, as que calibrarem seus processos e aproveitarem as vantagens indiretas inerentes aos melhores desfechos funcionais (como a queda na demanda por fisioterapias e insumos crônicos devido a sequelas evitadas) não apenas assimilarão a inovação, mas a transformarão em um diferencial estratégico na prestação do cuidado longitudinal oncológico de alto valor. [31]</p>
</section>

<section class="compass-section">
<h2>Referências citadas</h2>

<table class="ref-table ref-table--indexed">
<thead>
<tr><th>#</th><th>Referência</th></tr>
</thead>
<tbody>
<tr><td>1</td><td>Quanto custa uma cirurgia robótica? — <a href="https://www.institutodecirurgiarobotica.com/blog/quanto-custa-uma-cirurgia-robotica/">institutodecirurgiarobotica.com</a></td></tr>
<tr><td>2</td><td>Cirurgia robótica para câncer de próstata entra no rol da ANS em 2026: impactos para empresas e planos de saúde — <a href="https://blog.copplasa.com.br/cirurgia-robotica-para-cancer-de-prostata/">blog.copplasa.com.br</a></td></tr>
<tr><td>3</td><td>Resolução Normativa ANS nº 654, de 12.12.2025 — <a href="https://legismap.com.br/leis-e-normas/resolucao-normativa-ans-n-654-de-12-12-2025">legismap.com.br</a></td></tr>
<tr><td>4</td><td>Legislação — CREMESP — <a href="https://cremesp.org.br/?siteAcao=PesquisaLegislacao&dif=a&ficha=1&id=22763&tipo=RESOLU%C3%87%C3%83O%20NORMATIVA&orgao=Ag%C3%AAncia%20Nacional%20de%20Sa%C3%BAde%20Suplementar&numero=654&situacao=VIGENTE&data=12-12-2025&vide=sim">cremesp.org.br</a></td></tr>
<tr><td>5</td><td>Resolução normativa ANS nº 654 de 12 de dezembro de 2025 — <a href="https://www.elosaude.com.br/wp-content/uploads/2025/12/RN-654.pdf">elosaude.com.br</a></td></tr>
<tr><td>6</td><td>INCA projeta 781 mil novos casos de câncer por ano no Brasil para o triênio 2026-2028 — <a href="https://sboc.org.br/noticias/3902-inca-projeta-781-mil-novos-casos-de-cancer-por-ano-no-brasil-para-o-trienio-2026-2028/">sboc.org.br</a></td></tr>
<tr><td>7</td><td>Perfil Epidemiológico da Incidência de Câncer no Brasil e Regiões: Estimativas para o Triênio 2026-2028 — <a href="https://www.scielo.br/j/rbcan/a/ZgsGr7Dw4sKrKYSnLKHk5KF/">SciELO</a></td></tr>
<tr><td>8</td><td>INCA estima 781 mil novos casos de câncer por ano no Brasil entre 2026 e 2028 — <a href="https://www.gov.br/inca/pt-br/assuntos/noticias/2026/inca-estima-781-mil-novos-casos-de-cance-r-por-ano-no-brasil-entre-2026-e-2028">gov.br/inca</a></td></tr>
<tr><td>9</td><td>Brasil — estimativa dos casos novos — Instituto Nacional de Câncer — INCA — <a href="https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa/estado-capital/brasil">gov.br/inca</a></td></tr>
<tr><td>10</td><td>Perfil Epidemiológico da Incidência de Câncer no Brasil e Regiões: Estimativas para o Triênio 2026-2028 — Revista Brasileira de Cancerologia — <a href="https://rbc.inca.gov.br/index.php/revista/article/view/5587/4403">rbc.inca.gov.br</a></td></tr>
<tr><td>11</td><td>Estimativa 2026 — Repositório Institucional — INCA — <a href="https://ninho.inca.gov.br/jspui/bitstream/123456789/17914/1/Estima2026_completo%20%281%29.pdf">ninho.inca.gov.br</a></td></tr>
<tr><td>12</td><td>Planos de saúde batem 53 milhões de beneficiários; veja qual estado liderou a alta em 2025 — <a href="https://timesbrasil.com.br/empresas-e-negocios/planos-de-saude-batem-53-milhoes-de-beneficiarios-veja-qual-estado-liderou-a-alta-em-2025/">Times Brasil</a></td></tr>
<tr><td>13</td><td>ANS divulga dados de beneficiários referentes a abril de 2025 — <a href="https://www.federacaodasaude.org.br/noticia-interna/22172">Federação da Saúde</a></td></tr>
<tr><td>14</td><td>ANS divulga dados de beneficiários referentes a abril de 2025 — <a href="https://www.paranacooperativo.coop.br/noticias-economia/ans-divulga-dados-de-beneficiarios-referentes-a-abril-de-2025">Sistema Ocepar</a></td></tr>
<tr><td>15</td><td>Beneficiários 50+ em planos de saúde crescem de 20% para 26,3% — <a href="https://medicinasa.com.br/planos-envelhecimento-iess/">Medicina SA</a></td></tr>
<tr><td>16</td><td>Número de centenários com plano de saúde cresce 42% em cinco anos, diz ANS — <a href="https://www.otempo.com.br/economia/2025/3/8/numero-de-centenarios-com-plano-de-saude-cresce-42-em-cinco-anos-diz-ans">O Tempo</a></td></tr>
<tr><td>17</td><td>Câncer de próstata mata 48 homens por dia no Brasil; atendimento por causa da doença cresce entre jovens — <a href="https://tjcc.com.br/noticias/cancer-de-prostata-mata-48-homens-por-dia-no-brasil-atendimento-por-causa-da-doenca-cresce-entre-jovens/">TJCC</a></td></tr>
<tr><td>18</td><td>STJ: plano de saúde deverá custear cirurgia robótica não prevista no rol da ANS — <a href="https://www.jota.info/saude/stj-plano-de-saude-devera-custear-cirurgia-robotica-nao-prevista-no-rol-da-ans">JOTA</a></td></tr>
<tr><td>19</td><td>Relatório de Análise de Impacto Regulatório — RAIR — <a href="https://www.gov.br/ans/pt-br/acesso-a-informacao/transparencia-e-prestacao-de-contas/CP_143_RAIR.pdf">gov.br/ans</a></td></tr>
<tr><td>20</td><td>Relatório de análise de impacto regulatório — RAIR — <a href="https://www.gov.br/ans/pt-br/acesso-a-informacao/transparencia-e-prestacao-de-contas/RN611_Relatorio_de_Analise_de_Impacto_Regulatorio___RAIR_5.pdf">gov.br/ans</a></td></tr>
<tr><td>21</td><td>Prostatectomia radical assistida por robô em pacientes com câncer de próstata localizado — Conitec — <a href="https://www.gov.br/conitec/pt-br/midias/consultas/relatorios/2021/Sociedade/20210906_resoc278_prostectomia_cancer_final.pdf">gov.br/conitec</a></td></tr>
<tr><td>22</td><td>Relatório para sociedade nº 555 — Prostatectomia radical assistida por robô — <a href="https://www.gov.br/conitec/pt-br/midias/consultas/relatorios/2025/sociedade/relatorio-para-sociedade-no-555-prostatectomia-radical-assistida-por-robo">gov.br/conitec</a></td></tr>
<tr><td>23</td><td>Relatório para a sociedade com decisão final nº 555 — <a href="https://www.gov.br/conitec/pt-br/midias/relatorios/2025/sociedade/relatorio-para-a-sociedade-com-decisao-final-no-555">gov.br/conitec</a></td></tr>
<tr><td>24</td><td>SBU conquista codificação própria, aumento de porte e reconhecimento do auxiliar robótico na CBHPM — <a href="https://portaldaurologia.org.br/download?arquivo=ZmlsZWE3YzRiMzhmNmFhMmI1ZTEyNzljNWQwMWE1ZWE3OGYyLnBkZjtDaXJ1cmdpYSBSb2LDs3RpY2EgYXVtZW50byBkZSBwb3J0ZSBlIHJlY29uaGVjaW1lbnRvIGRvIGF1eGlsaWFyIHJvYsOzdGljbyBuYSBDQkhQTS5wZGY7YXJxdWl2b3M7YWJyaXI=">Portal da Urologia</a></td></tr>
<tr><td>25</td><td>Cirurgia Robótica aumento de porte e reconhecimento do auxiliar robótico na CBHPM — <a href="https://portaldaurologia.org.br/sbu-no-consultorio/notas-tecnicas/cirurgia-robotica-aumento-de-porte-e-reconhecimento-do-auxiliar-robotico-na-cbhpm">Portal da Urologia</a></td></tr>
<tr><td>26</td><td>Quanto custa uma cirurgia robótica? — Dr. Eduardo Selbach Urologista — <a href="https://dreduardoselbach.com.br/quanto-custa-uma-cirurgia-robotica/">dreduardoselbach.com.br</a></td></tr>
<tr><td>27</td><td>Prostatectomia Radical Aberta, Videolaparoscópica e Robótica — <a href="https://revistas.usp.br/rmrp/article/view/210394">Revista de Medicina (USP)</a></td></tr>
<tr><td>28</td><td>Comparação dos desfechos funcionais entre prostatectomia aberta e robótica no tratamento do câncer de próstata — <a href="https://revistaft.com.br/comparacao-dos-desfechos-funcionais-entre-prostatectomia-aberta-e-robotica-no-tratamento-do-cancer-de-prostata/">Revista FT</a></td></tr>
<tr><td>29</td><td>Prostatectomia radical assistida por robô em pacientes com câncer de próstata localizado — Conitec (Relatório 50) — <a href="http://antigo-conitec.saude.gov.br/images/Consultas/Relatorios/2021/20210602_Relatorio_Prostatectomia_radical_CP_50.pdf">conitec.saude.gov.br</a></td></tr>
<tr><td>30</td><td>SUS e Planos são obrigados a pagar a Robótica da Próstata? — <a href="https://www.youtube.com/watch?v=Hc014s-UpVk">YouTube</a></td></tr>
<tr><td>31</td><td>Relatório para sociedade com decisão final nº 573 — <a href="https://www.gov.br/conitec/pt-br/midias/relatorios/2026/sociedade/relatorio-para-sociedade-com-decisao-final-no-573">gov.br/conitec</a></td></tr>
<tr><td>32</td><td>MAGISTER CONECTA — Webinar: Incorporação da Cirurgia Robótica de Próstata no ROL ANS — RN 654/2025 — <a href="https://www.youtube.com/watch?v=9V1_JjOKCaE">YouTube</a></td></tr>
</tbody>
</table>
</section>

<aside class="compass-scope" aria-label="Nota de escopo">
<strong>Nota de escopo.</strong> Esta edição do Compass&trade; é um documento técnico-estratégico de uso interno, destinado à educação continuada e ao apoio à tomada de decisão dos integrantes do Grupo CSV. Quando o tema envolver aspectos jurídicos, regulatórios ou contratuais, recomenda-se avaliação complementar por profissional especializado.
</aside>

<div class="compass-download-actions">
<div class="compass-download">
<a href="/compass/edicoes/2026/002/compass_002_2026.pdf" download>
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z"/></svg>
    Download PDF com timbrado
  </a>
</div>

<nav class="compass-nav" aria-label="Navegação entre edições">
<a href="/compass/" class="nav-primary">&larr; Central Compass&trade;</a>
  <a href="/compass/edicoes/2026/001/compass" class="nav-secondary">001/2026 &mdash; Metas ACO</a>
</nav>
</div>
</template>
