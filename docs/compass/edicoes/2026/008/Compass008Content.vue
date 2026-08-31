<template>
<section class="compass-page compass-page--cover">
  <img class="logo" src="/compass/edicoes/2026/008/assets/csv-neg.png" alt="Grupo CSV">
  <div style="position:absolute;right:18mm;top:19mm;text-align:right">
    <div style="font-family:var(--f-txt);font-size:10.5pt;font-weight:700;color:#B9C0C9;letter-spacing:.02em">Compass™</div>
    <div class="compass-brand-credits" aria-label="Créditos editoriais"><span>Compass™ — um produto do Grupo CSV</span><span>Responsabilidade editorial: MedValor®</span><span>Elaboração: AxiaCare®</span></div>
    <div style="font-size:6.4pt;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.42);margin-top:.6mm">Editorial</div>
  </div>

  <svg style="position:absolute;left:20mm;right:18mm;top:98mm;width:172mm;opacity:.55" viewBox="0 0 1000 54" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="6" y1="34" x2="994" y2="34" stroke="#5B7A93" stroke-opacity="0.5" stroke-width="1.2"/>
    <circle cx="6"   cy="34" r="5.5" fill="none" stroke="#5B7A93" stroke-width="2"/>
    <circle cx="170" cy="34" r="5.5" fill="none" stroke="#5B7A93" stroke-width="2"/>
    <circle cx="368" cy="34" r="6.5" fill="#4F90BE"/>
    <circle cx="500" cy="34" r="5.5" fill="none" stroke="#4F90BE" stroke-width="2"/>
    <circle cx="632" cy="34" r="6.5" fill="#4F90BE"/>
    <circle cx="812" cy="34" r="5.5" fill="none" stroke="#2DBF7F" stroke-width="2"/>
    <circle cx="994" cy="34" r="6.5" fill="#2DBF7F"/>
    <g font-family="JetBrains Mono" font-size="13.5" fill="#7C93A6" text-anchor="middle">
      <text x="6" y="16">T0</text><text x="170" y="16">Tp</text><text x="368" y="16">T1</text>
      <text x="500" y="16">Td</text><text x="632" y="16">T2</text><text x="812" y="16">T3</text>
      <text x="994" y="16">T4</text>
    </g>
  </svg>

  <div class="bloco">
    <div class="k">Manual · Gestão de leitos</div>
    <h1 class="t">Marcos Temporais do<br>Processo de Alta e da<br>Substituição do Leito</h1>
    <p class="s">O intervalo entre a decisão de alta e a chegada do próximo paciente ao leito: o que medir, quem responde por cada etapa e por onde começar.</p>
    <div style="display:flex;gap:14mm;margin-top:8mm;border-top:.5pt solid rgba(255,255,255,.16);padding-top:4.4mm">
      <div><div style="font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.42)">Edição</div><div style="font-family:var(--f-mono);font-size:9pt;color:rgba(255,255,255,.85);margin-top:1.4mm">008/2026</div></div>
      <div><div style="font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.42)">Data de publicação</div><div style="font-family:var(--f-mono);font-size:9pt;color:rgba(255,255,255,.85);margin-top:1.4mm">Agosto 2026</div></div>
      <div><div style="font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.42)">Status</div><div style="font-family:var(--f-mono);font-size:9pt;color:rgba(255,255,255,.85);margin-top:1.4mm">Minuta para revisão</div></div>
    </div>
  </div>

  <div class="base">
    <div>
      <div class="l1">Aplicação</div>
      <div class="l2">Hospitais gerais de média e alta complexidade<br>Operadoras com recurso próprio</div>
    </div>
    <div style="text-align:right">
      <div class="l1">Elaboração</div>
      <img src="/compass/edicoes/2026/008/assets/axia-neg.png" alt="AxiaCare®" style="height:9.2mm">
    </div>
  </div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">Sumário e perímetro</span><span class="r">Compass 008/2026</span></div>
  <style>.pg-sum .toc{margin-top:6mm}.pg-sum .toc .it{padding:4.2mm 0}.pg-sum .h-sec{margin-top:10mm}</style>
  <div class="pad pg-sum">
    <div class="kick">Conteúdo</div>
    <h2 class="h-cap">Sumário</h2>

    <div class="toc">
      <div class="it"><span class="no">1</span><span class="tt">O problema de medição<span>Por que os horários das áreas não batem e o que o número único esconde</span></span><span class="pg">4</span></div>
      <div class="it"><span class="no">2</span><span class="tt">Definição operacional dos marcos<span>Os sete pontos do caminho, as regras por tipo de saída e os erros de registro mais comuns</span></span><span class="pg">6</span></div>
      <div class="it"><span class="no">3</span><span class="tt">As três jornadas<span>Quem faz o quê da admissão ao leito ocupado, e onde os atrasos nascem</span></span><span class="pg">9</span></div>
      <div class="it"><span class="no">4</span><span class="tt">Titularidade e base normativa<span>O que só o médico pode fazer, o que é dever dele e o que a equipe assume</span></span><span class="pg">14</span></div>
      <div class="it"><span class="no">5</span><span class="tt">O corpo clínico aberto<span>Como trabalhar bem quando o médico assistente decide fora da rotina da unidade</span></span><span class="pg">16</span></div>
      <div class="it"><span class="no">6</span><span class="tt">Indicadores<span>Seis medidas que cabem em uma tela e as três que protegem contra o ganho de fachada</span></span><span class="pg">19</span></div>
      <div class="it"><span class="no">7</span><span class="tt">Referências<span>Normas, fichas técnicas e estudos citados</span></span><span class="pg">22</span></div>
    </div>

    <h3 class="h-sec" style="margin-top:6mm">O que este manual cobre</h3>
    <p class="ni">O caminho tratado aqui vai da internação até a reocupação do leito, em unidade de internação clínica e cirúrgica. Terapia intensiva, pronto-socorro e hospital-dia ficam fora do foco principal; os mesmos pontos de medição valem para essas unidades com nomes ajustados. A operadora aparece no desenho onde o processo depende dela: autorização de remoção, de atenção domiciliar e de prorrogação.</p>
    <p>Os números citados vêm de estudos publicados e servem como referência de ordem de grandeza. Linha de partida e meta de cada hospital saem da medição local, feita antes de qualquer intervenção no processo. Os códigos T0 a T4 designam os pontos do caminho do leito, definidos no capítulo 2, e mantêm o mesmo significado em todos os capítulos, quadros e figuras.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">2</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">Síntese</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <div class="kick">O essencial</div>
    <h2 class="h-cap" style="font-size:22pt">Três Intervalos, Três Titulares</h2>

    <p class="lede" style="margin-top:8mm;font-size:11.4pt;line-height:1.62">Quando o hospital mede o tempo entre a alta e o próximo paciente no leito com um número único, três trabalhos diferentes entram na mesma conta: a decisão do médico, o preparo da saída pela equipe e a virada do leito pela operação. Cada um tem seu responsável, suas causas de atraso e seu jeito de melhorar. O número único mistura os três — e meses de medição passam sem dizer onde o tempo se perde.</p>

    <p class="ni" style="margin-top:4.5mm">A saída, recorrente nos guias de fluxo hospitalar reunidos nas referências, é separar o caminho em três jornadas, com pontos de registro automático de data e hora entre elas. A divisa entre a primeira e a segunda fica no ato que a lei reserva ao médico: a decisão de alta (Lei nº 12.842/2013, art. 4º, XI). Algumas entregas do médico — sumário, receita, atestado — acontecem depois da decisão e por isso ganham um ponto de medição só delas.</p>

    <p style="margin-top:4.5mm">Separar muda três leituras. Primeira: o indicador mais usado no mercado — da alta médica até a saída do paciente — enxerga só o preparo da saída. O horário em que a decisão acontece fica de fora, e um hospital bate essa meta mesmo registrando todas as altas às 17h. Segunda: as causas de atraso mais frequentes na casuística brasileira, família e remoção, se resolvem com providências tomadas antes da decisão, em uma etapa que esse indicador nem alcança. Terceira: boa parte do atraso vem de exigências administrativas herdadas, e regra de processo se muda sem investir em obra, equipe ou sistema.</p>

    <div class="ld" style="margin:9mm 0">
      <div style="padding-top:4mm;padding-bottom:4mm">
        <div class="r">Atraso após a alta</div>
        <div class="v">31,9%</div>
        <div class="f">Das 25.388 internações de 2015 na maior casuística brasileira publicada, 8.104 tiveram liberação do leito mais de 1 hora após a alta médica.<sup>1</sup></div>
      </div>
      <div>
        <div class="r">Redesenho de processo</div>
        <div class="v destq">36&ndash;83%</div>
        <div class="f">Faixa de redução, por setor, do intervalo até a liberação administrativa do leito ao retirar a documentação do caminho crítico.<sup>2</sup></div>
      </div>
      <div>
        <div class="r">Antecipação da ordem</div>
        <div class="v">8,7%<span class="seta">&rarr;</span>22,2%</div>
        <div class="f">Proporção de altas com ordem emitida antes das 10h ao longo de 41 meses de trabalho continuado sobre o processo.<sup>3</sup></div>
      </div>
    </div>

    <p class="ni" style="margin-top:4.5mm">Com a separação, cada jornada ganha um titular, um gatilho, uma entrega e um indicador que esse titular consegue mover. A soma dos trechos devolve o total, e a investigação de um desvio começa na etapa em que ele nasceu.</p>

    <div class="fnote" style="margin-top:6mm"><sup>1</sup> Dissertação FGV EAESP, rede hospitalar privada, 2015&ndash;2016 (ref. 5). &nbsp;<sup>2</sup> HCFMRP-USP, série 2011&ndash;2018; o marco medido é administrativo e a intervenção alterou a própria definição do evento (ref. 6 e cap. 3). &nbsp;<sup>3</sup> Projeto de melhoria de 41 meses, 2019&ndash;2022 (ref. 8).</div>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">3</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">1 · O problema de medição</span><span class="r">Compass 008/2026</span></div>
  <div class="pad pad--cap">
    <div class="cap-open">
      <div class="num">1</div>
      <div class="k">Capítulo 1</div>
      <h2 class="t">O Problema de Medição</h2>
      <p class="d">Cada área registra a saída do paciente no momento que faz sentido para o próprio trabalho — e a conversa sobre fluxo trava antes de começar.</p>
    </div>

    <h3 class="h-sec">O mesmo dia, quatro horários</h3>
    <p class="ni">Pergunte a três áreas do mesmo hospital a que horas o paciente do leito 12 saiu ontem. A enfermagem responde 14h, hora em que ele deixou o quarto. O faturamento responde 16h20, hora em que a conta fechou. O relatório do sistema responde 10h40, hora em que o médico lançou a alta. As três respostas estão certas — cada uma descreve um momento diferente do mesmo dia.</p>
    <p>O desencontro vem de antes do sistema de informação: falta combinar qual evento vale como marco. Sem esse combinado, cada área segue medindo pelo instante que importa para a própria rotina, e nenhum indicador fecha com o do vizinho.</p>

    <div class="qcap"><b>Quadro 1.1</b> — <i>Quatro leituras do mesmo dia de um mesmo paciente (horários ilustrativos)</i></div>
    <table>
      <thead><tr><th style="width:28mm">Área</th><th style="width:34mm">Marco adotado</th><th>Lógica de quem registra</th><th style="width:15mm">Hora</th></tr></thead>
      <tbody>
        <tr><td class="k">Corpo clínico</td><td>Registro da alta em prontuário</td><td>A decisão está tomada e documentada; o trabalho clínico se encerra ali</td><td class="mono">10:40</td></tr>
        <tr><td class="k">Enfermagem</td><td>Saída física do paciente</td><td>O leito ficou livre; é o que muda a rotina da unidade</td><td class="mono">14:05</td></tr>
        <tr><td class="k">Operações</td><td>Leito liberado no sistema</td><td>O leito passa a existir para a gestão quando está disponível para uso</td><td class="mono">15:10</td></tr>
        <tr><td class="k">Faturamento</td><td>Encerramento da conta</td><td>A internação termina quando deixa de gerar lançamento</td><td class="mono">16:20</td></tr>
      </tbody>
    </table>
    <p class="tn">A dispersão entre a primeira e a última leitura, de 5h40, é o intervalo em disputa quando não há definição operacional única.</p>

    <h3 class="h-sec">Alta e saída no vocabulário oficial</h3>
    <p class="ni">A nomenclatura oficial do censo hospitalar (Ministério da Saúde, 2002) separa as duas coisas que o mercado mistura. <strong>Alta</strong> é o &ldquo;ato médico que determina a finalização da modalidade de assistência que vinha sendo prestada ao paciente&rdquo; — uma decisão. <strong>Saída</strong> é o paciente deixando a unidade, por alta, evasão, desistência, transferência ou óbito — um acontecimento físico. Um detalhe de nível importa: no censo da unidade, transferência interna conta como saída daquela unidade; para o hospital, o paciente segue internado.</p>
    <p>O par que circula no mercado — alta médica e alta hospitalar — fica fora da padronização do censo, e a Política Nacional de Atenção Hospitalar (Portaria GM/MS nº 3.390/2013) usa &ldquo;alta hospitalar responsável&rdquo; para outra coisa: a qualidade da transição do cuidado. Indicador montado sobre termo ambíguo herda a ambiguidade, e a reunião que deveria discutir desempenho gasta a pauta discutindo definição.</p>
    <p class="nota"><strong>Na prática —</strong> duas unidades do mesmo hospital reportam intervalos médios de 4 e de 9 horas sem que nenhuma esteja errada: uma carimba a saída quando o paciente deixa o quarto, a outra quando o registro fecha no sistema. Antes de comparar números, compare definições.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">4</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">1 · O problema de medição</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <h3 class="h-sec">O que o número único esconde</h3>
    <p class="ni">Imagine um hospital cujo intervalo médio entre a decisão de alta e o próximo paciente no leito é de 7 horas. Duas histórias muito diferentes produzem esse mesmo número. Na primeira, o médico registrou a alta cedo e o paciente esperou a família até o fim da tarde: o problema pede serviço social e logística de transporte. Na segunda, a família esperava desde as 8h e a alta só saiu depois da última cirurgia do dia: o problema pede governança do corpo clínico. O número único trata as duas histórias como iguais — e o plano de ação construído sobre ele tem boa chance de mirar a etapa errada.</p>

    <h3 class="h-sec" style="margin-top:8mm">Duas medidas com nomes parecidos</h3>
    <p class="ni">Antes de seguir, vale desfazer uma confusão comum: o tempo de virada do leito e o intervalo de substituição da estatística hospitalar clássica medem coisas diferentes, embora os nomes se pareçam.</p>
    <p>O intervalo de substituição (IS) é um cálculo de censo, em dias, feito a partir da taxa de ocupação e da média de permanência do período:</p>

    <div class="destaque" style="margin:6mm 0;padding-top:4mm;padding-bottom:4mm">
      <p style="font-family:var(--f-mono);font-size:9pt;color:var(--azul);margin-bottom:2mm">IS = Média de Permanência &times; (1 &minus; Taxa de Ocupação) &divide; Taxa de Ocupação</p>
      <p style="font-size:8.2pt;color:var(--cinza)">Resultado em dias. A formulação equivale, por construção, à razão entre leitos-dia ociosos e número de saídas do período, o que permite conferir o valor por duas vias independentes a partir do próprio censo.</p>
    </div>

    <p class="ni">O IS diz quanto tempo, em média, um leito fica vazio entre uma saída e a admissão seguinte — e inclui na conta o leito vazio por falta de demanda e, conforme a ficha técnica adotada, o leito bloqueado; leitos desativados saem do denominador. O tempo de virada é outra coisa: um cronômetro por evento, da saída do paciente até o leito pronto para uso, medindo só a parcela que a operação controla. Um hospital com ocupação baixa mostra IS alto mesmo com virada rápida. Quem confunde as duas medidas termina elogiando o hospital errado.</p>

    <h3 class="h-sec" style="margin-top:8mm">O que muda ao separar</h3>
    <p class="ni">Dividir o caminho em três jornadas dá a cada trecho um dono capaz de movê-lo: um gatilho abre a jornada, uma entrega a fecha e um indicador mede só aquele trecho. Para a divisão funcionar, cada ponto de medição precisa de definição própria — qual evento o dispara, em que campo é registrado e quem registra. É o assunto do capítulo 2.</p>

    <p class="nota" style="margin-top:8mm"><strong>Na prática —</strong> a maior parte dos sistemas hospitalares em uso no Brasil já registra a alta, a saída e a liberação do leito; o campo de previsão de alta e o marco de documentação costumam exigir configuração. Levantar o que o sistema local captura sem desenvolvimento é a primeira tarefa da implantação.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">5</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">2 · Definição operacional dos marcos</span><span class="r">Compass 008/2026</span></div>
  <div class="pad pad--cap">
    <div class="cap-open">
      <div class="num">2</div>
      <div class="k">Capítulo 2</div>
      <h2 class="t">Definição Operacional dos Marcos</h2>
      <p class="d">Sete pontos de registro no mesmo caminho: cada um dispara em um evento observável, com data e hora automáticas e um único responsável.</p>
    </div>

    <p class="ni">O caminho do leito começa na internação e termina quando o próximo paciente é admitido. Três jornadas o dividem. A primeira divisa é a decisão de alta, que só o médico pode tomar; a segunda é a saída física do paciente — o único ponto que pertence a duas jornadas ao mesmo tempo e, por isso, o que mais sofre com registro divergente.</p>

    <figure style="width:94%;margin-left:auto;margin-right:auto">
      <svg viewBox="0 0 1000 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linha do tempo dos marcos e das três jornadas">
        <defs><style>
          .mk2{font-family:'JetBrains Mono';font-size:14px;fill:#196396}
          .nm3{font-family:Inter;font-size:15px;font-weight:700;fill:#1b1e24}
          .ds3{font-family:Inter;font-size:12.5px;fill:#6B7480}
          .jl{font-family:Inter;font-size:12.5px;font-weight:600;fill:#1b1e24;letter-spacing:.4px}
        </style></defs>

        <!-- rótulos superiores -->
        <g>
          <g transform="translate(16,0)"><text class="mk2" y="24">T0</text><text class="nm3" y="48">Admissão</text><text class="ds3" y="66">Internação</text><text class="ds3" y="82">efetivada</text></g>
          <g transform="translate(160,0)"><text class="mk2" y="24">Tp</text><text class="nm3" y="48">Previsão</text><text class="ds3" y="66">Data provável e</text><text class="ds3" y="82">critérios de alta</text></g>
          <g transform="translate(345,0)"><text class="mk2" y="24" fill="#B4491E">T1</text><text class="nm3" y="48">Alta médica</text><text class="ds3" y="66">Registro em</text><text class="ds3" y="82">prontuário</text></g>
          <g transform="translate(492,0)"><text class="mk2" y="24">Td</text><text class="nm3" y="48">Documentação</text><text class="ds3" y="66">Sumário e receita</text><text class="ds3" y="82">concluídos</text></g>
          <g transform="translate(650,0)"><text class="mk2" y="24">T2</text><text class="nm3" y="48">Saída</text><text class="ds3" y="66">Paciente deixa</text><text class="ds3" y="82">o leito</text></g>
          <g transform="translate(790,0)"><text class="mk2" y="24">T3</text><text class="nm3" y="48">Leito pronto</text><text class="ds3" y="66">Higienizado e</text><text class="ds3" y="82">liberado</text></g>
          <g transform="translate(918,0)"><text class="mk2" y="24">T4</text><text class="nm3" y="48">Ocupado</text><text class="ds3" y="66">Admissão do</text><text class="ds3" y="82">seguinte</text></g>
        </g>

        <!-- eixo -->
        <line x1="18" y1="116" x2="982" y2="116" stroke="#1b1e24" stroke-opacity="0.28" stroke-width="1"/>
        <g>
          <circle cx="20"  cy="116" r="6" fill="#fff" stroke="#196396" stroke-width="2.2"/>
          <circle cx="164" cy="116" r="6" fill="#fff" stroke="#196396" stroke-width="2.2"/>
          <circle cx="349" cy="116" r="7" fill="#196396"/>
          <circle cx="496" cy="116" r="6" fill="#fff" stroke="#196396" stroke-width="2.2"/>
          <circle cx="654" cy="116" r="7" fill="#196396"/>
          <circle cx="794" cy="116" r="6" fill="#fff" stroke="#2DBF7F" stroke-width="2.2"/>
          <circle cx="962" cy="116" r="7" fill="#2DBF7F"/>
        </g>
        <!-- fronteira -->
        <line x1="349" y1="100" x2="349" y2="196" stroke="#B4491E" stroke-width="1.2" stroke-dasharray="4 3"/>
        <text x="349" y="212" text-anchor="middle" font-family="Inter" font-size="12" font-style="italic" fill="#B4491E">Fronteira do ato de decisão</text>

        <!-- barras de jornada -->
        <g>
          <text class="jl" x="20" y="152">Jornada 1A · Decisão clínica</text>
          <rect x="20" y="160" width="329" height="4" fill="#196396"/>
          <text class="jl" x="360" y="152">Jornada 1B · Execução</text>
          <rect x="360" y="160" width="294" height="4" fill="#6FA3C6"/>
          <text class="jl" x="665" y="152">Jornada 2 · Substituição</text>
          <rect x="665" y="160" width="297" height="4" fill="#2DBF7F"/>
        </g>

        <!-- descrições -->
        <g>
          <text class="ds3" x="20" y="188">Titular: Médico assistente</text>
          <text class="ds3" x="360" y="188">Titular: Equipe multidisciplinar</text>
          <text class="ds3" x="665" y="188">Titular: Enfermagem, higienização e NIR</text>
          <text class="ds3" x="20" y="248">Td é marco complementar: registra a conclusão das entregas documentais médicas que sucedem a decisão (cap. 4)</text>
          <text class="ds3" x="20" y="268">e permite separar, dentro da execução, a espera por documentação da espera por preparo, conta e transporte.</text>
        </g>
      </svg>
      <figcaption><b>Figura 2.1</b> — <i>Cadeia de liberação do leito: sete marcos, três jornadas e a fronteira do ato de decisão</i></figcaption>
    </figure>

    <p class="ni">A jornada 1A pede uma medida diferente das outras, porque a duração dela é o próprio tempo de internação — encurtá-la por meta de fluxo seria dar alta antes da hora. O que se gerencia é outra coisa: a que horas do dia a decisão acontece e com quanta antecedência ela foi anunciada. Duração como medida fica para as jornadas 1B e 2.</p>

    <h3 class="h-sec">O que faz um marco valer</h3>
    <p class="ni">Um marco entra na medição quando passa em três testes simples. Existe um evento observável que o dispara? Existe um campo que registra data e hora sem digitação manual? Existe um único papel responsável por acionar esse registro? Falhou em um dos três, a série produzida cai na primeira contestação de área.</p>

    <p class="nota" style="margin-top:3mm"><strong>Marco complementar —</strong> Td marca a conclusão do sumário e da receita, entregas do médico que acontecem depois da decisão. Ele separa, dentro do preparo da saída, a espera pela documentação da espera pelo resto — conta, família, transporte. O porquê dessa separação está no capítulo 4.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">6</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">2 · Definição operacional dos marcos</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <div class="qcap"><b>Quadro 2.1</b> — <i>Ficha dos marcos</i></div>
    <table>
      <thead><tr><th style="width:11mm">Código</th><th style="width:26mm">Marco</th><th>Evento gerador</th><th style="width:30mm">Registro</th></tr></thead>
      <tbody>
        <tr><td class="mono">T0</td><td class="k">Admissão</td><td>Efetivação da internação e ocupação do leito</td><td>Recepção ou NIR</td></tr>
        <tr><td class="mono">Tp</td><td class="k">Previsão de alta</td><td>Registro, em campo estruturado, da data provável e dos critérios que autorizam a alta</td><td>Médico assistente</td></tr>
        <tr><td class="mono">T1</td><td class="k">Alta médica</td><td>Registro da alta em prontuário, com carimbo automático de data e hora</td><td>Médico assistente</td></tr>
        <tr><td class="mono">Td</td><td class="k">Documentação concluída</td><td>Sumário de alta e receituário assinados e liberados no sistema</td><td>Médico assistente</td></tr>
        <tr><td class="mono">T2</td><td class="k">Saída</td><td>Paciente deixa fisicamente o leito, independentemente da situação da conta</td><td>Enfermagem da unidade</td></tr>
        <tr><td class="mono">T3</td><td class="k">Leito pronto</td><td>Limpeza terminal concluída, leito conferido e liberado no sistema</td><td>Higienização e enfermagem</td></tr>
        <tr><td class="mono">T4</td><td class="k">Leito ocupado</td><td>Admissão do paciente seguinte no mesmo leito</td><td>NIR</td></tr>
      </tbody>
    </table>
    <p class="tn">T2 pertence ao encerramento da jornada 1B e à abertura da jornada 2 ao mesmo tempo. Quando as duas áreas o registram cada uma à sua maneira, os dois indicadores deixam de fechar e a soma das partes não reproduz o total — a conciliação do carimbo de T2 entre enfermagem e gestão de leitos é requisito da implantação.</p>

    <h3 class="h-sec">Regras por tipo de saída</h3>
    <p class="ni">A jornada 2 mede toda vacância de leito, venha de onde vier; as jornadas 1A e 1B medem apenas as saídas por alta. Essas regras precisam estar escritas antes da primeira extração — sem elas, duas equipes de TI constroem duas medições diferentes com o mesmo nome.</p>
    <ul class="li">
      <li>Óbito, evasão e desistência do tratamento não entram em T2&nbsp;&minus;&nbsp;T1 nem nos indicadores da 1A; geram vacância e entram na virada (T3&nbsp;&minus;&nbsp;T2) como estrato próprio.</li>
      <li>Alta a pedido, quando formalizada em termo de responsabilidade e registrada pelo médico, entra em T2&nbsp;&minus;&nbsp;T1 com marcação distinta; costuma ter execução curta e desloca a mediana se misturada sem estrato.</li>
      <li>Transferência interna (por exemplo, para terapia intensiva) gera vacância sem alta: entra na jornada 2 e não nas anteriores.</li>
      <li>Transferência externa segue as três jornadas, com o transporte inter-hospitalar como dependência externa registrada.</li>
    </ul>

    <p class="nota" style="margin-top:3mm"><strong>Aplicação a outras unidades —</strong> em terapia intensiva, o análogo de T1 é a prescrição de transferência para a enfermaria, e o intervalo até a efetivação mede a retenção de leito crítico por indisponibilidade de leito de destino. No pronto-socorro, T4 corresponde à admissão do paciente que aguardava internação. Os marcos se aplicam; os nomes das etapas mudam com a unidade.</p>

    <p class="nota"><strong>Unidade de medida —</strong> os intervalos da execução e da virada são expressos em horas e minutos; horário de alta, em hora do dia; antecedência da previsão, em horas completas. Misturar dias e horas na mesma série é fonte recorrente de erro de leitura em comitê.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">7</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">2 · Definição operacional dos marcos</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <h3 class="h-sec">Os intervalos que os marcos produzem</h3>
    <p class="ni">Com os sete pontos registrados, os intervalos entre eles ficam disponíveis. Nem todos merecem lugar no painel do comitê; todos merecem existir na base, prontos para a investigação de um desvio.</p>

    <div class="qcap"><b>Quadro 2.2</b> — <i>Intervalos e leitura de cada um</i></div>
    <table>
      <thead><tr><th style="width:17mm">Intervalo</th><th style="width:40mm">O que mede</th><th>Leitura</th><th style="width:21mm">Uso</th></tr></thead>
      <tbody>
        <tr><td class="mono">T1 &minus; Tp</td><td class="k">Antecedência da previsão</td><td>Tempo de preparação disponível para a equipe antes da decisão; o corte de leitura do painel é 24 horas</td><td>Diagnóstico de 1A</td></tr>
        <tr><td class="mono">Td &minus; T1</td><td class="k">Conclusão documental</td><td>Espera pelas entregas médicas posteriores à decisão; separa a dependência médica do trabalho da equipe</td><td>Painel</td></tr>
        <tr><td class="mono">T2 &minus; T1</td><td class="k">Execução da alta</td><td>O indicador clássico de mercado; mede a jornada 1B e apenas ela</td><td>Painel</td></tr>
        <tr><td class="mono">T3 &minus; T2</td><td class="k">Virada do leito</td><td>Sob controle da operação; independe de demanda e de decisão clínica</td><td>Painel</td></tr>
        <tr><td class="mono">T4 &minus; T3</td><td class="k">Alocação</td><td>Depende de demanda e de regulação; a leitura correta condiciona o intervalo à existência de fila (cap. 6)</td><td>Painel</td></tr>
        <tr><td class="mono">T4 &minus; T2</td><td class="k">Leito fora de uso</td><td>Soma virada e alocação; serve a estudos de capacidade e dispensa titular</td><td>Capacidade</td></tr>
      </tbody>
    </table>

    <div class="destaque">
      <p><strong>Regra de construção —</strong> virada e alocação não se fundem em indicador único. Somados, um mês de ocupação baixa melhora o resultado sem mudança alguma no processo, e um mês de ocupação alta piora o resultado de uma equipe que operou bem — porque a alocação carrega a demanda do período, e a virada, o desempenho da operação.</p>
    </div>

    <h3 class="h-sec">Cinco defeitos que estragam a medição</h3>
    <p class="ni">Os cinco defeitos abaixo aparecem na primeira extração de quase toda implantação. Nenhum deles se resolve com treinamento — todos pedem ajuste de configuração ou de regra.</p>

    <div class="qcap"><b>Quadro 2.3</b> — <i>Defeitos frequentes e correção</i></div>
    <table>
      <thead><tr><th style="width:40mm">Defeito</th><th>Como aparece na base</th><th style="width:38mm">Correção</th></tr></thead>
      <tbody>
        <tr><td class="k">Horário digitado manualmente</td><td>Concentração artificial de registros em horas cheias e meias horas</td><td>Carimbo automático no lançamento</td></tr>
        <tr><td class="k">Lançamento em lote no fim do plantão</td><td>Carimbos de T2 e T3 agrupados no mesmo minuto, distantes do evento</td><td>Lançamento no posto ou em dispositivo móvel; auditoria amostral registro contra evento</td></tr>
        <tr><td class="k">T2 registrado no encerramento da conta</td><td>Execução sistematicamente alta e sem variação entre unidades</td><td>Separar o marco de saída do marco de faturamento</td></tr>
        <tr><td class="k">Leito liberado antes da conferência</td><td>Virada curta convivendo com reclamação recorrente de leito não preparado</td><td>Liberação condicionada a inspeção registrada</td></tr>
        <tr><td class="k">Previsão sem campo próprio</td><td>Previsão presente na evolução em texto livre e ausente de qualquer relatório</td><td>Campo estruturado, com data e critérios separados</td></tr>
      </tbody>
    </table>
    <p class="tn">O carimbo automático registra o momento do lançamento. Para T2 e T3, cuja natureza é física, a distância entre o lançamento e o evento é ela própria um dado de qualidade a acompanhar por amostragem.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">8</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">3 · As três jornadas</span><span class="r">Compass 008/2026</span></div>
  <div class="pad pad--cap">
    <div class="cap-open">
      <div class="num">3</div>
      <div class="k">Capítulo 3</div>
      <h2 class="t">As Três Jornadas</h2>
      <p class="d">Da admissão ao próximo paciente no leito: quem faz o quê, em que momento, e onde o trabalho de uma área espera pela entrega de outra.</p>
    </div>

    <figure>
      <svg viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de responsabilidades por marco">
        <defs><style>
          .lb2{font-family:Inter;font-size:14px;font-weight:700;fill:#1b1e24}
          .lbs2{font-family:Inter;font-size:11.5px;font-style:italic;fill:#6B7480}
          .bx2{font-family:Inter;font-size:12.3px;fill:#1b1e24}
          .mk3{font-family:'JetBrains Mono';font-size:13px;fill:#196396}
          .blocoA{fill:#E8F0F6}
          .blocoB{fill:#EDF3F8}
          .blocoC{fill:#EAF6F0}
          .blocoG{fill:#EFF1F3}
        </style></defs>

        <!-- colunas de marcos -->
        <g class="mk3" text-anchor="middle">
          <text x="150" y="18">T0</text><text x="320" y="18">Tp</text>
          <text x="470" y="18" fill="#B4491E">T1</text><text x="588" y="18">Td</text>
          <text x="700" y="18">T2</text><text x="850" y="18">T3</text><text x="988" y="18">T4</text>
        </g>
        <g stroke="#1b1e24" stroke-opacity="0.10">
          <line x1="150" y1="26" x2="150" y2="472"/><line x1="320" y1="26" x2="320" y2="472"/>
          <line x1="588" y1="26" x2="588" y2="472"/><line x1="700" y1="26" x2="700" y2="472"/>
          <line x1="850" y1="26" x2="850" y2="472"/>
        </g>
        <line x1="470" y1="26" x2="470" y2="490" stroke="#B4491E" stroke-width="1.1" stroke-dasharray="4 3"/>

        <!-- raia 1: medico -->
        <g>
          <text class="lb2" x="0" y="52">Médico assistente</text>
          <text class="lbs2" x="0" y="69">Decisão indelegável</text>
          <rect x="150" y="80" width="316" height="44" class="blocoA" stroke="#196396" stroke-width="1"/>
          <text class="bx2" x="162" y="98">Avaliação, plano terapêutico, previsão de alta</text>
          <text class="bx2" x="162" y="115">e critérios · visita diária</text>
          <rect x="476" y="80" width="114" height="44" fill="none" stroke="#B4491E" stroke-width="1.2" stroke-dasharray="4 3"/>
          <text class="bx2" x="486" y="98" fill="#B4491E">Sumário, receita,</text>
          <text class="bx2" x="486" y="115" fill="#B4491E">atestado, pedidos</text>
        </g>
        <line x1="0" y1="140" x2="1000" y2="140" stroke="#1b1e24" stroke-opacity="0.12"/>

        <!-- raia 2: enfermagem -->
        <g>
          <text class="lb2" x="0" y="166">Enfermagem</text>
          <text class="lbs2" x="0" y="183">Conduz a execução</text>
          <rect x="326" y="192" width="140" height="44" class="blocoB" stroke="#4F90BE" stroke-width="1"/>
          <text class="bx2" x="336" y="210">Preparo antecipado,</text>
          <text class="bx2" x="336" y="227">barreiras sinalizadas</text>
          <rect x="476" y="192" width="218" height="44" class="blocoB" stroke="#4F90BE" stroke-width="1"/>
          <text class="bx2" x="486" y="210">Dispositivos, orientação de alta,</text>
          <text class="bx2" x="486" y="227">acompanhamento da saída</text>
          <rect x="706" y="192" width="138" height="44" class="blocoB" stroke="#4F90BE" stroke-width="1"/>
          <text class="bx2" x="716" y="210">Sinalização da</text>
          <text class="bx2" x="716" y="227">vacância, materiais</text>
        </g>
        <line x1="0" y1="252" x2="1000" y2="252" stroke="#1b1e24" stroke-opacity="0.12"/>

        <!-- raia 3: apoio -->
        <g>
          <text class="lb2" x="0" y="278">Apoio clínico</text>
          <text class="lbs2" x="0" y="295">Farmácia, serviço social,</text>
          <text class="lbs2" x="0" y="310">reabilitação, nutrição</text>
          <rect x="150" y="288" width="316" height="44" class="blocoB" stroke="#4F90BE" stroke-width="1"/>
          <text class="bx2" x="162" y="306">Destino, vaga externa, equipamentos,</text>
          <text class="bx2" x="162" y="323">preparo da família</text>
          <rect x="476" y="288" width="150" height="44" class="blocoB" stroke="#4F90BE" stroke-width="1"/>
          <text class="bx2" x="486" y="306">Conciliação e</text>
          <text class="bx2" x="486" y="323">dispensação</text>
        </g>
        <line x1="0" y1="348" x2="1000" y2="348" stroke="#1b1e24" stroke-opacity="0.12"/>

        <!-- raia 4: administrativo -->
        <g>
          <text class="lb2" x="0" y="374">Administrativo</text>
          <text class="lbs2" x="0" y="391">Conta, autorização</text>
          <rect x="326" y="384" width="140" height="44" class="blocoG" stroke="#8A919A" stroke-width="1"/>
          <text class="bx2" x="336" y="402">Pré-conferência,</text>
          <text class="bx2" x="336" y="419">autorização</text>
          <rect x="476" y="384" width="150" height="44" class="blocoG" stroke="#8A919A" stroke-width="1"/>
          <text class="bx2" x="486" y="402">Encerramento fora</text>
          <text class="bx2" x="486" y="419">do caminho crítico</text>
        </g>
        <line x1="0" y1="444" x2="1000" y2="444" stroke="#1b1e24" stroke-opacity="0.12"/>

        <!-- raia 5: operações -->
        <g>
          <text class="lb2" x="0" y="470">Operações e NIR</text>
          <text class="lbs2" x="0" y="487">Higienização, hotelaria,</text>
          <text class="lbs2" x="0" y="502">regulação interna</text>
          <rect x="706" y="456" width="142" height="44" class="blocoC" stroke="#2DBF7F" stroke-width="1"/>
          <text class="bx2" x="712" y="474">Limpeza terminal,</text>
          <text class="bx2" x="712" y="491">conferência, liberação</text>
          <rect x="856" y="456" width="138" height="44" fill="#2DBF7F"/>
          <text class="bx2" x="866" y="474" fill="#0F3D2B">Regulação, alocação</text>
          <text class="bx2" x="866" y="491" fill="#0F3D2B">e admissão</text>
        </g>

        <!-- barras inferiores -->
        <g>
          <text class="jl" x="150" y="530" font-family="Inter" font-size="12.5" font-weight="600" fill="#1b1e24">Jornada 1A</text>
          <rect x="150" y="537" width="316" height="4" fill="#196396"/>
          <text x="476" y="530" font-family="Inter" font-size="12.5" font-weight="600" fill="#1b1e24">Jornada 1B</text>
          <rect x="476" y="537" width="218" height="4" fill="#6FA3C6"/>
          <text x="706" y="530" font-family="Inter" font-size="12.5" font-weight="600" fill="#1b1e24">Jornada 2</text>
          <rect x="706" y="537" width="288" height="4" fill="#2DBF7F"/>
        </g>
      </svg>
      <figcaption><b>Figura 3.1</b> — <i>Responsabilidades por marco; o bloco tracejado marca as entregas médicas posteriores à decisão</i></figcaption>
    </figure>

    <p class="ni">Duas posições na figura 3.1 merecem atenção. Quase todo o trabalho que encurta a saída está à esquerda de T1 — acontece antes de a alta existir. E o bloco tracejado na linha do médico, já dentro da jornada 1B, corresponde à documentação que fica pendente depois da decisão: é essa espera que o marco Td mede.</p>

    <div class="qcap" style="margin-top:4mm"><b>Quadro 3.0</b> — <i>Síntese das três jornadas</i></div>
    <table>
      <thead><tr><th style="width:14mm">Jornada</th><th style="width:30mm">Titular</th><th style="width:24mm">Entrega</th><th>Alavanca principal</th><th style="width:20mm">Indicador</th></tr></thead>
      <tbody>
        <tr><td class="k">1A</td><td>Médico assistente</td><td>Alta registrada</td><td>Antecipação: previsão e critérios lançados desde a admissão</td><td class="mono">hora de T1</td></tr>
        <tr><td class="k">1B</td><td>Equipe multidisciplinar</td><td>Leito vago</td><td>Pré-execução e retirada das exigências administrativas do caminho crítico</td><td class="mono">T2 &minus; T1<br>Td &minus; T1</td></tr>
        <tr><td class="k">2</td><td>Operações e NIR</td><td>Leito ocupado</td><td>Sincronia: comunicação imediata, fila priorizada, alocação antecipada</td><td class="mono">T3 &minus; T2<br>T4 &minus; T3</td></tr>
      </tbody>
    </table>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">9</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">3 · As três jornadas</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <div class="kick">Jornada 1A</div>
    <h2 class="h-cap">Da Admissão à Decisão de Alta</h2>

    <p class="lede" style="margin-top:4mm">Tudo o que encurta as jornadas seguintes começa aqui, enquanto o paciente ainda evolui. A jornada 1A é a da preparação: previsão anunciada, critérios definidos, família avisada. Quando ela funciona, a alta chega como confirmação; quando falha, chega como surpresa.</p>

    <div class="verbete" style="margin-top:3mm">
      <div class="vh"><span class="cod">T0 &rarr; T1</span><span class="tt">Decisão clínica de alta</span></div>
      <div class="vr"><span class="l">Titular</span><span class="v">Médico assistente; corresponsável institucional: coordenação clínica ou diretoria técnica, quando o assistente não é vinculado à equipe da unidade</span></div>
      <div class="vr"><span class="l">Gatilho</span><span class="v">Internação do paciente</span></div>
      <div class="vr"><span class="l">Entrega</span><span class="v">Alta médica registrada em prontuário, com carimbo automático de data e hora</span></div>
      <div class="vr"><span class="l">Natureza</span><span class="v">Decisão; gerencia-se o horário do dia em que ocorre e a antecedência com que foi anunciada</span></div>
    </div>

    <h3 class="h-sec">Processos</h3>
    <ul class="li">
      <li>Avaliação inicial e definição do plano terapêutico, com trajetória e desfecho esperados.</li>
      <li>Registro da previsão de alta na primeira avaliação, revisado a cada evolução, assumindo recuperação sem intercorrência e sem embutir demora administrativa esperada.</li>
      <li>Registro dos critérios clínicos de alta — o mínimo fisiológico, terapêutico e funcional que o paciente precisa alcançar. Com o alvo registrado, a equipe prepara a alta durante a evolução, em vez de aguardar a visita seguinte.</li>
      <li>Visita diária por profissional com autoridade para decidir a liberação.</li>
      <li>Solicitação e acompanhamento de exames, pareceres e procedimentos que condicionam a alta, com atenção ao horário do pedido.</li>
      <li>Alinhamento entre especialidades quando há mais de um médico no caso, com responsável clínico único definido.</li>
      <li>Comunicação da expectativa de alta ao paciente e à família com antecedência suficiente para organizar transporte e destino.</li>
    </ul>

    <p class="nota"><strong>Na prática —</strong> um parecer pedido às 11h e o mesmo parecer pedido às 16h produzem tempos de permanência diferentes, porque o segundo costuma ser respondido só no dia seguinte. O horário do pedido importa tanto quanto o pedido.</p>

    <div class="g2" style="margin-top:3mm">
      <div>
        <h4 class="h-sub">Pontos de falha</h4>
        <p class="ni mut" style="font-size:8.6pt">Visita em horário tardio ou variável. Previsão ausente ou registrada em texto livre, sem extração possível. Critérios de alta inexistentes, o que converte preparação em espera. Solicitações condicionantes emitidas no fim do turno. Vários especialistas no mesmo caso sem responsável clínico único.</p>
      </div>
      <div>
        <h4 class="h-sub">Indicadores</h4>
        <p class="ni mut" style="font-size:8.6pt">Mediana do horário de registro da alta médica. Proporção de internações com previsão registrada com pelo menos 24 horas de antecedência. Proporção de internações com critérios clínicos registrados. Acurácia da previsão (data prevista contra data realizada).</p>
      </div>
    </div>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">10</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">3 · As três jornadas</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <div class="kick">Jornada 1B</div>
    <h2 class="h-cap">Da Alta Médica à Saída do Paciente</h2>

    <p class="lede" style="margin-top:4mm">Com a alta registrada, começa a correr o relógio que o mercado mede. O tamanho deste intervalo depende menos da velocidade da equipe e mais do que foi preparado na véspera — e de quanto papel ainda prende o leito.</p>

    <div class="verbete" style="margin-top:3mm">
      <div class="vh"><span class="cod">T1 &rarr; T2</span><span class="tt">Execução da alta</span></div>
      <div class="vr"><span class="l">Titular</span><span class="v">Equipe multidisciplinar da unidade, conduzida pela enfermagem, com farmácia, serviço social, reabilitação, nutrição, faturamento e hotelaria</span></div>
      <div class="vr"><span class="l">Gatilho</span><span class="v">Registro da alta médica</span></div>
      <div class="vr"><span class="l">Entrega</span><span class="v">Leito vago, com o paciente em segurança e a documentação de transição concluída</span></div>
      <div class="vr"><span class="l">Dependências</span><span class="v">Entregas documentais médicas (medidas por Td &minus; T1) e autorizações da operadora, registradas como dependências externas com marco de solicitação e de resposta</span></div>
    </div>

    <h3 class="h-sec">Processos sob titularidade da equipe</h3>
    <ul class="li">
      <li>Recepção da alta e disparo do fluxo: sinalização à unidade, ao NIR e às áreas de apoio.</li>
      <li>Preparo assistencial: retirada de dispositivos, última administração de medicamento, curativo, checagem das condições de deambulação e transporte.</li>
      <li>Conciliação medicamentosa e dispensação pela farmácia clínica.</li>
      <li>Orientação de alta ao paciente e ao acompanhante, com verificação de compreensão.</li>
      <li>Serviço social: acionamento da família, definição de destino, vaga em instituição de longa permanência, atenção domiciliar, oxigenoterapia e equipamentos.</li>
      <li>Solicitação de autorização à operadora quando o destino a exige — remoção, atenção domiciliar, oxigenoterapia —, com data e hora da solicitação e da resposta registradas.</li>
      <li>Transporte: acionamento da família ou da remoção, com horário pactuado.</li>
      <li>Encerramento administrativo: conferência de conta, termos e assinaturas.</li>
      <li>Encerramento do atendimento no sistema e acompanhamento da saída, eventualmente por sala de espera de alta.</li>
    </ul>

    <p class="nota"><strong>Na prática —</strong> a liberação do leito deixa de esperar papel: nem tramitação de documentação, nem fechamento de conta. A conta ganha processo próprio depois da liberação, com responsável, prazo e o índice de glosa acompanhado como contrapartida. Sem essa contrapartida, a controladoria tem razão em resistir.</p>

    <h3 class="h-sec">Indicador</h3>
    <p class="ni">Mediana de T2&nbsp;&minus;&nbsp;T1, aberta por unidade, turno, dia da semana e destino, sempre lida ao lado de Td&nbsp;&minus;&nbsp;T1. A média não serve aqui: poucos casos extremos puxam o resultado para cima, e são justamente esses casos que pedem investigação um a um, fora da conta.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">11</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">3 · As três jornadas</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <h3 class="h-sec">De onde vêm os atrasos: o que a casuística brasileira mostra</h3>
    <p class="ni">A maior casuística brasileira publicada sobre o tema acompanhou uma rede hospitalar privada por dois anos: 25.388 internações em 2015 e 23.130 em 2016. Em quase um terço delas — 8.104 casos no primeiro ano (31,9%) e 6.627 no segundo (28,7%) — o leito só foi desocupado mais de 1 hora depois da alta médica, com atrasos que chegaram a 22 horas.</p>

    <div class="qcap"><b>Quadro 3.1</b> — <i>Causa principal registrada nos casos com atraso superior a 1 hora, 2015</i></div>
    <table>
      <thead><tr><th style="width:38mm">Causa</th><th style="width:22mm">Participação</th><th>Providência associada e etapa em que ela cabe</th></tr></thead>
      <tbody>
        <tr><td class="k">Família</td><td class="mono">34,02%</td><td>Comunicação antecipada da previsão e pactuação do horário de retirada — jornada 1A</td></tr>
        <tr><td class="k">Alta decidida no próprio dia</td><td class="mono">29,00%</td><td>Previsão registrada na véspera e critérios clínicos definidos — jornada 1A</td></tr>
        <tr><td class="k">Remoção</td><td class="mono">27,00%</td><td>Acionamento do transporte e solicitação de autorização antes da decisão — jornada 1A, com dependência da operadora</td></tr>
        <tr><td class="k">Demais causas</td><td class="mono">9,98%</td><td>Documentação, conta e preparo assistencial — jornadas 1B e dependência documental (Td)</td></tr>
      </tbody>
    </table>
    <p class="tn">Distribuição por causa principal de cada caso, como reportada pela fonte. Em 2016 o padrão se manteve: família e remoção somaram 68,66% dos casos com atraso. Fonte: dissertação de mestrado profissional, FGV EAESP (ref. 5).</p>

    <p class="ni" style="margin-top:3mm">A coluna de providências é uma hipótese de desenho: o estudo registrou a causa de cada atraso, sem testar o efeito de nenhuma antecipação. Três cuidados de leitura acompanham o quadro. O percentual conta casos — uma causa frequente e curta pesa o mesmo que uma rara e longa. Parte dos atrasos de família e de remoção resiste até à melhor antecipação, porque depende do familiar disponível, da empresa de remoção e do prazo da operadora. E &ldquo;alta decidida no próprio dia&rdquo; descreve, no fundo, a falta de previsão — exatamente o que a jornada 1A ataca.</p>

    <h3 class="h-sec">Uma regra mudada, quatro horas recuperadas</h3>
    <p class="ni">Um hospital universitário brasileiro mudou uma única regra: em vez de esperar a documentação chegar ao setor de controle, o atendimento passou a ser encerrado assim que a enfermagem sinalizava que o paciente estava pronto para sair. A mediana entre a alta médica e o encerramento administrativo, que oscilava entre 5,32 e 7,12 horas de 2011 a 2016, caiu para a faixa de 2,20 a 2,55 horas em 2017 e 2018. A redução por setor foi de 36% a 83%, e o processo ficou mais estável: a variação entre as medianas mensais caiu de 1,8 para 0,35 hora.</p>
    <p>Dois cuidados de leitura. O relógio desse estudo media o encerramento administrativo, e a mudança alterou a própria definição do evento — que passou a acontecer na sinalização da enfermagem. Os números mostram a antecipação da liberação administrativa do leito; a saída física do paciente ficou sem medição. Ainda assim, o caso vale pelo que ensina: uma regra de processo, sem contratação, obra ou tecnologia, sustentou o ganho por dois anos.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">12</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">3 · As três jornadas</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <div class="kick">Jornada 2</div>
    <h2 class="h-cap">Da Saída do Paciente ao Leito Ocupado</h2>

    <p class="lede" style="margin-top:4mm">Depois que o paciente sai, o leito passa por várias mãos: enfermagem, limpeza, hotelaria, regulação. Nenhuma etapa é longa por natureza — o tempo se perde entre elas, quando o aviso demora e a fila anda sem prioridade.</p>

    <div class="verbete" style="margin-top:3mm">
      <div class="vh"><span class="cod">T2 &rarr; T3 &rarr; T4</span><span class="tt">Substituição do leito</span></div>
      <div class="vr"><span class="l">Titular</span><span class="v">Enfermagem da unidade, higienização, hotelaria, manutenção e regulação interna (NIR)</span></div>
      <div class="vr"><span class="l">Gatilho</span><span class="v">Saída física do paciente — por alta ou por qualquer outro tipo de saída (cap. 2)</span></div>
      <div class="vr"><span class="l">Entrega</span><span class="v">Leito ocupado pelo paciente seguinte</span></div>
      <div class="vr"><span class="l">Divisão</span><span class="v">Virada operacional (T2 a T3), sob controle da operação; alocação (T3 a T4), dependente de demanda e de regulação</span></div>
    </div>

    <h3 class="h-sec">Processos</h3>
    <ul class="li">
      <li>Sinalização imediata da vacância no sistema de gestão de leitos.</li>
      <li>Baixa administrativa e encerramento definitivo do registro, sem tramitação de papel.</li>
      <li>Retirada de resíduos, roupa e materiais; devolução de medicamentos à farmácia; recolhimento de bombas, monitores e equipamentos para processamento.</li>
      <li>Acionamento da higienização, com fila priorizada pela criticidade do leito.</li>
      <li>Limpeza terminal conforme procedimento operacional, com o tempo de contato do desinfetante respeitado.</li>
      <li>Conferência, inspeção e liberação do leito no sistema.</li>
      <li>Preparo do leito: enxoval, montagem, insumos, checagem de gases e equipamentos.</li>
      <li>Manutenção e conservação quando houver bloqueio.</li>
      <li>Regulação e alocação pelo NIR, com fila priorizada entre pronto-socorro, recuperação pós-anestésica, terapia intensiva, transferência externa e eletivo, respeitando perfil, especialidade, sexo e precaução de contato.</li>
      <li>Comunicação à unidade, transporte, passagem de plantão e admissão de enfermagem.</li>
    </ul>

    <h3 class="h-sec">Pontos de falha</h3>
    <p class="ni">Comunicação tardia à higienização. Ausência de rastreamento eletrônico do status do leito, que converte a fila em negociação verbal. Cobertura de turno da equipe de limpeza em intervalos de refeição concentrados. Leito em precaução de contato tratado como exceção em vez de estrato próprio. Fila sem prioridade, em que o leito pronto atende à ordem de chegada mesmo havendo espera em condição mais crítica.</p>

    <p class="nota"><strong>Na prática —</strong> a escolha do próximo paciente pode acontecer antes da saída do atual. Quando o NIR trabalha com a previsão de alta em vez de esperar o aviso de leito vago, parte da jornada 2 corre em paralelo à 1B. É o único ganho que nenhuma das jornadas consegue sozinha.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">13</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">4 · Titularidade e base normativa</span><span class="r">Compass 008/2026</span></div>
  <div class="pad pad--cap">
    <div class="cap-open">
      <div class="num">4</div>
      <div class="k">Capítulo 4</div>
      <h2 class="t">Titularidade e Base Normativa</h2>
      <p class="d">O que só o médico pode fazer, o que é dever dele mesmo depois da decisão, e o que a equipe pode assumir desde já.</p>
    </div>

    <p class="ni">Duas coisas neste processo pertencem ao médico por força de lei. A Lei nº 12.842/2013 lista as atividades privativas da medicina, e duas tocam diretamente o caminho do leito: a <strong>indicação de internação e alta médica</strong> (art. 4º, XI) e a <strong>atestação de condições de saúde</strong> (art. 4º, XIII). Nenhum protocolo institucional transfere a decisão de alta ou o atestado para outra categoria profissional.</p>
    <p>As demais entregas de papel são de outra natureza. O sumário de alta é dever documental do médico assistente: vem das normas de prontuário (Resolução CFM nº 1.638/2002) e do Código de Ética Médica, e faz parte da alta responsável da Política Nacional de Atenção Hospitalar. A prescrição sequer aparece na lista de atividades privativas. Essas peças admitem apoio na elaboração — mas exigem a assinatura do responsável, e é por isso que continuam penduradas no mesmo profissional depois que a decisão já foi tomada.</p>
    <p>Essa distinção define a divisa das jornadas: ela fica no ato que só o médico pratica, a decisão (T1). O sumário, a receita e o atestado vêm depois da decisão e invadem a jornada da equipe — por isso ganham ponto de medição próprio (Td) e linha própria no painel.</p>

    <figure style="margin-top:4mm">
      <svg viewBox="0 0 1000 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Três categorias de titularidade">
        <defs><style>
          .ct{font-family:Inter;font-size:13.5px;font-weight:700;fill:#1b1e24}
          .cs{font-family:Inter;font-size:11.5px;font-style:italic;fill:#6B7480}
          .ci{font-family:Inter;font-size:12.3px;fill:#1b1e24}
          .cb{font-family:Inter;font-size:11px;fill:#6B7480}
        </style></defs>

        <!-- coluna 1 -->
        <rect x="0" y="8" width="4" height="292" fill="#196396"/>
        <text class="ct" x="16" y="24">Privativo por lei</text>
        <text class="cs" x="16" y="42">Não se transfere</text>
        <line x1="16" y1="56" x2="300" y2="56" stroke="#1b1e24" stroke-opacity=".7" stroke-width="1"/>
        <text class="ci" x="16" y="80" font-weight="700">Decisão de alta</text>
        <text class="cb" x="16" y="97">Lei nº 12.842/2013, art. 4º, XI</text>
        <line x1="16" y1="112" x2="300" y2="112" stroke="#1b1e24" stroke-opacity=".14"/>
        <text class="ci" x="16" y="136" font-weight="700">Atestado</text>
        <text class="cb" x="16" y="153">Art. 4º, XIII</text>
        <line x1="16" y1="168" x2="300" y2="168" stroke="#1b1e24" stroke-opacity=".14"/>
        <text class="ci" x="16" y="192" font-weight="700">Registro da alta (T1)</text>
        <text class="cb" x="16" y="209">Carimbo que abre a jornada 1B</text>

        <!-- coluna 2 -->
        <rect x="348" y="8" width="4" height="292" fill="#B4491E"/>
        <text class="ct" x="364" y="24">Dever do assistente</text>
        <text class="cs" x="364" y="42">Admite apoio; exige assinatura</text>
        <line x1="364" y1="56" x2="648" y2="56" stroke="#1b1e24" stroke-opacity=".7" stroke-width="1"/>
        <text class="ci" x="364" y="80" font-weight="700">Sumário de alta</text>
        <text class="cb" x="364" y="97">Res. CFM nº 1.638/2002 · alta responsável</text>
        <line x1="364" y1="112" x2="648" y2="112" stroke="#1b1e24" stroke-opacity=".14"/>
        <text class="ci" x="364" y="136" font-weight="700">Receituário e pedidos</text>
        <text class="cb" x="364" y="153">Responsabilidade prescricional</text>
        <line x1="364" y1="168" x2="648" y2="168" stroke="#1b1e24" stroke-opacity=".14"/>
        <text class="ci" x="364" y="192" font-weight="700">Resposta a pendências</text>
        <text class="cb" x="364" y="209">Levantadas após o registro da alta</text>
        <line x1="364" y1="224" x2="648" y2="224" stroke="#1b1e24" stroke-opacity=".14"/>
        <text class="ci" x="364" y="248" font-weight="700">Critérios clínicos de alta</text>
        <text class="cb" x="364" y="265">Definição médica; verificação delegável</text>

        <!-- coluna 3 -->
        <rect x="696" y="8" width="4" height="292" fill="#2DBF7F"/>
        <text class="ct" x="712" y="24">Trabalho da equipe</text>
        <text class="cs" x="712" y="42">Delegável e pré-executável</text>
        <line x1="712" y1="56" x2="996" y2="56" stroke="#1b1e24" stroke-opacity=".7" stroke-width="1"/>
        <text class="ci" x="712" y="80" font-weight="700">Preparo assistencial</text>
        <text class="cb" x="712" y="97">Enfermagem</text>
        <line x1="712" y1="112" x2="996" y2="112" stroke="#1b1e24" stroke-opacity=".14"/>
        <text class="ci" x="712" y="136" font-weight="700">Conciliação e orientação</text>
        <text class="cb" x="712" y="153">Farmácia clínica e enfermagem</text>
        <line x1="712" y1="168" x2="996" y2="168" stroke="#1b1e24" stroke-opacity=".14"/>
        <text class="ci" x="712" y="192" font-weight="700">Destino e transporte</text>
        <text class="cb" x="712" y="209">Serviço social</text>
        <line x1="712" y1="224" x2="996" y2="224" stroke="#1b1e24" stroke-opacity=".14"/>
        <text class="ci" x="712" y="248" font-weight="700">Conta e encerramento</text>
        <text class="cb" x="712" y="265">Administrativo, fora do caminho crítico</text>

        <!-- intervalo td -->
        <line x1="348" y1="312" x2="652" y2="312" stroke="#B4491E" stroke-width="1"/>
        <text x="500" y="328" text-anchor="middle" font-family="'JetBrains Mono'" font-size="12" fill="#B4491E">Intervalo Td &minus; T1 no painel</text>
      </svg>
      <figcaption><b>Figura 4.1</b> — <i>Três categorias de titularidade nas entregas da alta; a coluna central é a dependência que trava a execução quando o assistente já deixou o hospital</i></figcaption>
    </figure>

    <h3 class="h-sec">Quando o médico já foi embora e o papel ficou</h3>
    <p class="ni">A cena é conhecida: o médico registra a alta, segue para o consultório, e o sumário e a receita ficam para depois. A equipe, pronta para liberar o paciente, espera por alguém que já saiu do prédio. Se o painel mostrar só o intervalo da alta à saída, essa espera cai na conta da equipe — que aparece na reunião como responsável por um atraso que ela mesma sofreu. Basta uma reunião assim para o indicador perder a credibilidade.</p>
    <p>O marco Td desfaz a injustiça. Td&nbsp;&minus;&nbsp;T1 mede a espera pela documentação, com o corpo clínico como titular; lido ao lado, o intervalo da equipe mostra quanto foi papel e quanto foi preparo, conta, família ou transporte. Duas linhas no painel, cada uma com o seu dono.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">14</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">4 · Titularidade e base normativa</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <h3 class="h-sec">O que dá para importar do modelo britânico</h3>
    <p class="ni">Nos programas britânicos de fluxo hospitalar, os critérios de alta são definidos nas primeiras horas da internação, um profissional sênior revisa os pacientes antes do meio-dia e a própria equipe executa a alta quando os critérios são atingidos, sem nova avaliação presencial. Como escola de antecipação, o desenho é sólido — e está incorporado aos mecanismos do capítulo 5.</p>
    <p>Copiar tudo, porém, esbarra no ordenamento brasileiro. A leitura consolidada dos conselhos profissionais entende que a formalização da alta, por ser privativa, fica com o médico mesmo diante de critérios pré-firmados — interpretação assentada, ainda que a norma seja silenciosa sobre o momento do ato. O que atravessa a fronteira sem atrito é a antecipação: com critérios registrados, tudo o que a lei permite delegar corre enquanto o paciente evolui, e o registro da alta encontra o trabalho pronto.</p>

    <div class="qcap" style="margin-top:4mm"><b>Quadro 4.1</b> — <i>Efeito operacional do registro de critérios</i></div>
    <table>
      <thead><tr><th style="width:36mm">Etapa</th><th>Sem critérios registrados</th><th>Com critérios registrados</th></tr></thead>
      <tbody>
        <tr><td class="k">Início do trabalho da equipe</td><td>Depois do registro da alta</td><td>Desde a véspera, contra alvo objetivo</td></tr>
        <tr><td class="k">Transporte e destino</td><td>Acionados após a decisão</td><td>Pactuados antes, com horário confirmado</td></tr>
        <tr><td class="k">Conta e autorização</td><td>Conferência iniciada na alta</td><td>Pré-conferida, pendente apenas de fechamento</td></tr>
        <tr><td class="k">Papel do registro da alta</td><td>Gatilho de todo o processo</td><td>Confirmação de processo concluído</td></tr>
      </tbody>
    </table>

    <h3 class="h-sec">Como escrever critérios que funcionam</h3>
    <p class="ni">O teste de um bom critério é simples: uma enfermeira à beira do leito consegue responder sim ou não, sem chamar ninguém? O campo funciona com três a cinco condições assim, verificáveis por quem não tomou a decisão.</p>

    <div class="qcap"><b>Quadro 4.2</b> — <i>Dimensões do campo e formato do enunciado</i></div>
    <table>
      <thead><tr><th style="width:26mm">Dimensão</th><th>O que registra</th><th style="width:52mm">Formato do enunciado</th></tr></thead>
      <tbody>
        <tr><td class="k">Fisiológica</td><td>Parâmetros objetivos que precisam estar estabilizados</td><td>Condição mensurável, com limite e janela de tempo</td></tr>
        <tr><td class="k">Terapêutica</td><td>Transição de via, retirada de dispositivo ou conclusão de esquema</td><td>Evento verificável, com marco de conclusão</td></tr>
        <tr><td class="k">Funcional</td><td>Capacidade necessária para o destino previsto</td><td>Tarefa observável, com ou sem apoio</td></tr>
        <tr><td class="k">De transição</td><td>Condição externa que o destino exige</td><td>Recurso confirmado, com responsável nomeado</td></tr>
      </tbody>
    </table>
    <p class="tn">O quadro padroniza a estrutura do registro. O conteúdo clínico de cada critério pertence à equipe assistencial da instituição e varia por linha de cuidado.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">15</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">5 · O corpo clínico aberto</span><span class="r">Compass 008/2026</span></div>
  <div class="pad pad--cap">
    <div class="cap-open">
      <div class="num">5</div>
      <div class="k">Capítulo 5</div>
      <h2 class="t">O Corpo Clínico Aberto</h2>
      <p class="d">Quando o médico assistente decide fora da rotina da unidade, a alta chega sem aviso — e todo o preparo que poderia ter começado ontem começa agora.</p>
    </div>

    <p class="lede">No hospital privado e filantrópico brasileiro, o especialista costuma trabalhar por fora da equipe da unidade: visita no horário que a agenda permite, decide sozinho e segue para o consultório ou para o centro cirúrgico. Esse arranjo tem razões econômicas conhecidas e nenhuma portaria interna o desfaz. Um bom desenho de fluxo aceita essa realidade e funciona apesar dela.</p>

    <h3 class="h-sec">O que a decisão sem aviso provoca</h3>
    <p class="ni">O efeito se espalha pelas três jornadas. Na 1A, o hospital não sabe a hora da visita, não recebe previsão e não tem critérios registrados — a equipe descobre a alta pronta e corre atrás. Na 1B, sumário e receita ficam pendentes de quem já foi embora, e a espera cai no relógio da equipe. Na jornada 2, as altas desembocam juntas no fim da tarde, na troca de turno da limpeza e no pico do pronto-socorro. Parte do que parece falta de leito é leito liberado na pior hora do dia.</p>

    <h3 class="h-sec">Pedir prioridade não bastou: o teste que falhou</h3>
    <p class="ni">A ideia mais intuitiva já foi testada com rigor. Um ensaio randomizado em três hospitais acadêmicos, com 61 médicos, orientou metade deles a examinar primeiro os pacientes com alta prevista. Resultado: a ordem de alta saiu às 13h03 no grupo orientado e às 13h11 no grupo de rotina — empate técnico. A alta efetiva, 15h22 contra 15h21. A permanência, 75 contra 78 horas. Mesmo entre os médicos que de fato aderiram, a ordem saiu 37 minutos mais cedo (12h34, p&nbsp;=&nbsp;0,001) e a permanência seguiu igual. As horas entre a ordem e a saída ficaram sem investigação — exatamente a jornada 1B.</p>
    <p>A lição para o desenho: pedir prioridade, sem mexer no processo que sustenta a decisão nem no preparo que vem depois, moveu o ponteiro dentro do ruído. O que sustentou resultado na literatura foi estrutura — previsão registrada, critérios objetivos, trabalho pré-executado e caminho de escalonamento (cap. 6).</p>

    <h3 class="h-sec">Três sinais de que a casa opera no modo reativo</h3>
    <p class="ni">Uma manhã de observação na enfermaria basta para o diagnóstico. Três sinais entregam o modo reativo:</p>
    <ul class="li">
      <li>a enfermagem toma conhecimento da alta ao encontrar a prescrição no prontuário;</li>
      <li>a família é avisada no mesmo dia em que precisa buscar o paciente;</li>
      <li>o pedido de remoção só é aberto depois do registro da alta.</li>
    </ul>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">16</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">5 · O corpo clínico aberto</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <h3 class="h-sec">Dois jeitos de viver o mesmo dia</h3>
    <p class="ni">Nas duas linhas do tempo abaixo, ninguém trabalha mais depressa. A única diferença é a hora em que a equipe recebe permissão para começar.</p>

    <figure>
      <svg viewBox="0 0 1000 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Comparação entre rotina reativa e antecipada ao longo do dia">
        <defs><style>
          .hr3{font-family:'JetBrains Mono';font-size:11.5px;fill:#8A919A}
          .md3{font-family:Inter;font-size:14px;font-weight:700;fill:#1b1e24}
          .ms3{font-family:Inter;font-size:11.5px;font-style:italic;fill:#6B7480}
          .bk3{font-family:Inter;font-size:12.3px;fill:#1b1e24}
          .an3{font-family:'JetBrains Mono';font-size:12px;fill:#B4491E}
        </style></defs>

        <g class="hr3" text-anchor="middle">
          <text x="130" y="20">07h</text><text x="261" y="20">09h</text><text x="392" y="20">11h</text>
          <text x="522" y="20">13h</text><text x="653" y="20">15h</text><text x="784" y="20">17h</text>
          <text x="915" y="20">19h</text>
        </g>
        <line x1="130" y1="30" x2="975" y2="30" stroke="#9AA2AB" stroke-width="0.8"/>
        <g stroke="#DFE3E7" stroke-width="0.8">
          <line x1="261" y1="30" x2="261" y2="330"/><line x1="392" y1="30" x2="392" y2="330"/>
          <line x1="522" y1="30" x2="522" y2="330"/><line x1="653" y1="30" x2="653" y2="330"/>
          <line x1="784" y1="30" x2="784" y2="330"/><line x1="915" y1="30" x2="915" y2="330"/>
        </g>

        <text class="md3" x="0" y="86">Rotina reativa</text>
        <text class="ms3" x="0" y="104">Decisão assíncrona</text>
        <g>
          <rect x="130" y="72" width="501" height="42" fill="#EFF1F3" stroke="#C7CCD2" stroke-width="0.8"/>
          <text class="bk3" x="146" y="90" fill="#4A5260">Paciente clinicamente pronto;</text>
          <text class="bk3" x="146" y="107" fill="#8A919A">a equipe aguarda a visita para iniciar o preparo</text>
          <rect x="631" y="72" width="164" height="42" fill="#196396"/>
          <text class="bk3" x="645" y="97" fill="#fff">Execução comprimida</text>
          <rect x="795" y="72" width="136" height="42" fill="#EAF6F0" stroke="#7FD9AE" stroke-width="0.8"/>
          <text class="bk3" x="808" y="90" fill="#1E5A41">Virada no turno</text>
          <text class="bk3" x="808" y="107" fill="#1E5A41">da noite</text>
          <circle cx="631" cy="60" r="4" fill="#B4491E"/>
          <line x1="631" y1="64" x2="631" y2="72" stroke="#B4491E" stroke-width="1.2"/>
          <text class="an3" x="640" y="58">T1 14h40</text>
          <circle cx="931" cy="93" r="3.6" fill="#1E8A5C"/>
          <text x="942" y="97" font-family="'JetBrains Mono'" font-size="12" fill="#1b1e24">19h15</text>
        </g>

        <text class="md3" x="0" y="222">Rotina antecipada</text>
        <text class="ms3" x="0" y="240">Critérios registrados</text>
        <g>
          <rect x="196" y="208" width="196" height="42" fill="#E8F0F6" stroke="#4F90BE" stroke-width="0.8"/>
          <text class="bk3" x="210" y="233" fill="#124B73">Preparação em paralelo</text>
          <rect x="392" y="208" width="65" height="42" fill="#196396"/>
          <rect x="457" y="208" width="82" height="42" fill="#2DBF7F"/>
          <circle cx="392" cy="196" r="4" fill="#B4491E"/>
          <line x1="392" y1="200" x2="392" y2="208" stroke="#B4491E" stroke-width="1.2"/>
          <text class="an3" x="401" y="194">T1 11h00</text>
          <circle cx="539" cy="229" r="3.6" fill="#1E8A5C"/>
          <text x="550" y="233" font-family="'JetBrains Mono'" font-size="12" fill="#1b1e24">13h15</text>
          <line x1="424" y1="250" x2="424" y2="268" stroke="#9AA2AB" stroke-width="0.8"/>
          <text x="418" y="283" text-anchor="end" font-family="Inter" font-size="11.5" fill="#6B7480">Execução</text>
          <line x1="498" y1="250" x2="498" y2="268" stroke="#9AA2AB" stroke-width="0.8"/>
          <text x="506" y="283" font-family="Inter" font-size="11.5" fill="#6B7480">Virada e alocação</text>
        </g>

        <g>
          <line x1="539" y1="318" x2="931" y2="318" stroke="#2DBF7F" stroke-width="1.2"/>
          <line x1="539" y1="312" x2="539" y2="324" stroke="#2DBF7F" stroke-width="1.2"/>
          <line x1="931" y1="312" x2="931" y2="324" stroke="#2DBF7F" stroke-width="1.2"/>
          <text x="735" y="342" text-anchor="middle" font-family="Inter" font-size="12.5" font-weight="600" fill="#1E8A5C">6 horas de leito recuperadas no exemplo</text>
        </g>

        <text x="0" y="372" font-family="Inter" font-size="11.5" font-style="italic" fill="#8A919A">Mesmo paciente, mesma equipe e mesma capacidade instalada; muda o instante em que o trabalho começa.</text>
      </svg>
      <figcaption><b>Figura 5.1</b> — <i>Esquema ilustrativo de um dia de trabalho nos dois modos</i></figcaption>
    </figure>

    <p class="ni">Na rotina reativa, todo o preparo e toda a virada acontecem depois da decisão — espremidos contra o fim do expediente, quando a limpeza troca de turno e o pronto-socorro enche. Na rotina antecipada, o preparo corre enquanto o paciente evolui, a alta confirma o que já está pronto e o leito vira em horário de operação plena.</p>

    <div class="qcap" style="margin-top:4mm"><b>Quadro 5.1</b> — <i>A mesma equipe nos dois modos</i></div>
    <table>
      <thead><tr><th style="width:24mm">Momento</th><th>Rotina reativa</th><th>Rotina antecipada</th></tr></thead>
      <tbody>
        <tr><td class="k">Véspera</td><td>Nenhuma ação ligada à alta do dia seguinte</td><td>Previsão registrada, família avisada, transporte pactuado</td></tr>
        <tr><td class="k">Início da manhã</td><td>Equipe aguarda a visita para saber quem sai</td><td>Lista de altas previstas circula na passagem de plantão</td></tr>
        <tr><td class="k">Meio da manhã</td><td>Sem ação possível sobre conta, farmácia ou destino</td><td>Conta pré-conferida, medicação separada, destino confirmado</td></tr>
        <tr><td class="k">Registro da alta</td><td>Início de todo o trabalho</td><td>Confirmação do que já está pronto</td></tr>
        <tr><td class="k">Fim da tarde</td><td>Pico de saídas com higienização em troca de turno</td><td>Leitos reocupados; a tarde absorve o pronto-socorro</td></tr>
      </tbody>
    </table>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">17</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">5 · O corpo clínico aberto</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <h3 class="h-sec">Sete mecanismos para reconectar o médico ao fluxo</h3>
    <p class="ni">Nenhum dos sete mecanismos tira a alta das mãos do médico. Todos fazem outra coisa: transformam um evento imprevisível em informação antecipada, para a equipe trabalhar antes de a decisão existir.</p>

    <div class="qcap"><b>Quadro 5.2</b> — <i>Mecanismos, efeito e etapa de aplicação</i></div>
    <table>
      <thead><tr><th style="width:42mm">Mecanismo</th><th>O que resolve</th><th style="width:17mm">Etapa</th></tr></thead>
      <tbody>
        <tr><td class="k">Previsão de alta em campo estruturado</td><td>Converte texto solto em dado extraível; sem campo próprio, a previsão registrada na evolução fica invisível para a gestão</td><td class="mono">1A</td></tr>
        <tr><td class="k">Critérios clínicos registrados</td><td>Estabelecem alvo objetivo e permitem pré-executar tudo o que não é privativo nem dever documental enquanto o paciente evolui</td><td class="mono">1A · 1B</td></tr>
        <tr><td class="k">Pré-alta documental na véspera</td><td>Sumário e receituário elaborados antes, revisados e assinados no ato; retira as entregas médicas do caminho crítico e encurta Td&nbsp;&minus;&nbsp;T1</td><td class="mono">1B</td></tr>
        <tr><td class="k">Médico de referência da unidade (diarista ou hospitalista)</td><td>Cobre o intervalo entre visitas e resolve pendências do paciente cujo assistente já deixou o hospital; o custo do posto se avalia contra o custo dos dias de leito recuperados</td><td class="mono">1A · 1B</td></tr>
        <tr><td class="k">Visita multiprofissional diária com roteiro</td><td>Reúne previsão, pendências e destino em um momento único, com registro; exige representação clínica com autoridade quando o assistente não participa</td><td class="mono">1A</td></tr>
        <tr><td class="k">Canal único de pendências ao assistente</td><td>Substitui a busca individual por caminho assíncrono com prazo e escalonamento definidos</td><td class="mono">1B</td></tr>
        <tr><td class="k">Governança do corpo clínico</td><td>Inscreve previsão de alta e prazo de entrega documental no regimento interno e nas regras de credenciamento</td><td class="mono">1A · 1B</td></tr>
      </tbody>
    </table>

    <div class="destaque">
      <p><strong>Condição de sustentação —</strong> os seis primeiros mecanismos dependem do sétimo. Sem previsão e prazo documental inscritos na regra formal do corpo clínico, o desenho se apoia em adesão individual — e a experiência mostra que adesão individual cede na primeira semana de ocupação alta. A alteração de regimento tem ciclo próprio, de meses, e por isso precisa começar cedo, em paralelo à implantação da medição.</p>
    </div>

    <h3 class="h-sec">O represamento de sexta a segunda</h3>
    <p class="ni">O fim de semana tem regras próprias de atraso: visita reduzida, instituição de longa permanência que não recebe no sábado, atenção domiciliar em escala mínima, remoção escassa, operadora em plantão. O paciente que atinge os critérios na sexta à noite e só sai na segunda de manhã carrega dois diários de permanência que ninguém precisava pagar. Duas regras seguram esse represamento: para as altas de sexta e sábado, previsão registrada e transporte confirmado até quinta; e alguém formalmente escalado para formalizar a alta no fim de semana — o próprio assistente ou o médico de referência, com isso escrito no regimento.</p>

    <h3 class="h-sec">A visita multiprofissional só funciona com autoridade na sala</h3>
    <p class="ni">Os procedimentos brasileiros de referência já desenham bem essa reunião: medicina, enfermagem, serviço social, nutrição e farmácia, todo dia, com roteiro padronizado por paciente e formulário próprio. O médico conduz e define o plano, incluída a previsão de alta; o NIR levanta as altas possíveis do dia.</p>
    <p>O ponto frágil aparece quando o assistente falta: sem ninguém com poder de decidir, a visita vira leitura de prontuário em voz alta. O antídoto é um representante com mandato clínico — o médico de referência — que leve as pendências ao assistente e volte com respostas, para a equipe sair da sala com decisão tomada ou com prazo e responsável definidos.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">18</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">6 · Indicadores</span><span class="r">Compass 008/2026</span></div>
  <div class="pad pad--cap">
    <div class="cap-open">
      <div class="num">6</div>
      <div class="k">Capítulo 6</div>
      <h2 class="t">Indicadores</h2>
      <p class="d">Seis medidas que cabem em uma tela, cada uma com um titular capaz de movê-la — e três medidas de proteção contra o ganho de fachada.</p>
    </div>

    <p class="ni">Painel de fluxo costuma morrer de dois males. De excesso: dezenas de medidas que ninguém acompanha, e a reunião inteira vira disputa sobre qual número está certo. Ou de falta de recorte: um número só para o hospital inteiro, que nunca aponta onde agir. O painel abaixo cabe em uma tela, e cada linha tem um dono capaz de movê-la.</p>

    <div class="qcap"><b>Quadro 6.1</b> — <i>Painel mínimo</i></div>
    <table>
      <thead><tr><th style="width:37mm">Indicador</th><th style="width:20mm">Cálculo</th><th style="width:26mm">Estatística</th><th>Titular</th></tr></thead>
      <tbody>
        <tr><td class="k">Horário da alta médica</td><td class="mono">hora de T1</td><td>Mediana</td><td>Corpo clínico, por especialidade</td></tr>
        <tr><td class="k">Antecedência da previsão</td><td class="mono">T1 &minus; Tp</td><td>Proporção &ge; 24h</td><td>Corpo clínico</td></tr>
        <tr><td class="k">Conclusão documental</td><td class="mono">Td &minus; T1</td><td>Mediana</td><td>Corpo clínico</td></tr>
        <tr><td class="k">Execução da alta</td><td class="mono">T2 &minus; T1</td><td>Mediana</td><td>Equipe multidisciplinar da unidade</td></tr>
        <tr><td class="k">Virada do leito</td><td class="mono">T3 &minus; T2</td><td>Mediana</td><td>Higienização e hotelaria</td></tr>
        <tr><td class="k">Alocação com fila</td><td class="mono">T4 &minus; T3</td><td>Mediana, condicionada</td><td>NIR</td></tr>
      </tbody>
    </table>
    <p class="tn">A mediana é obrigatória em toda medida de tempo do painel: a distribuição é assimétrica à direita e a média é deslocada pelos casos extremos — que devem seguir para investigação individual. A alocação é medida apenas nos períodos com paciente aguardando leito; sem fila registrada, o intervalo reflete o nível de demanda do período e deixa de informar sobre a regulação.</p>

    <h3 class="h-sec">Abrir o número antes de publicar</h3>
    <p class="ni">Nenhuma linha do painel se publica sem recorte, porque número fechado compara equipes que vivem realidades diferentes. O preparo da saída abre por unidade, turno, dia da semana (fim de semana à parte) e destino; a virada abre por precaução de contato, turno e tipo de acomodação; o horário da alta abre por especialidade e complexidade. Recorte com menos de 20 saídas no mês se junta a outro ou entra em janela móvel de 3 meses — mediana de célula pequena oscila por sorteio e queima a confiança na série.</p>
    <p class="nota"><strong>Comparação entre especialidades —</strong> horário de alta comparado sem considerar a complexidade do caso penaliza quem trata o paciente mais grave. A comparação legítima é da especialidade com a própria história ou entre casuísticas pareadas.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">19</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">6 · Indicadores</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <h3 class="h-sec">Dois hospitais, o mesmo número, realidades opostas</h3>
    <p class="ni">O esquema abaixo compara dois hospitais com o mesmo resultado no indicador de preparo da saída. A diferença entre eles mora no que esse indicador deixa de registrar.</p>

    <figure>
      <svg viewBox="0 0 1000 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dois hospitais com a mesma execução e horários de decisão distintos">
        <defs><style>
          .hr4{font-family:'JetBrains Mono';font-size:11.5px;fill:#8A919A}
          .nm4{font-family:Inter;font-size:14px;font-weight:700;fill:#1b1e24}
          .sm4{font-family:Inter;font-size:11.5px;font-style:italic;fill:#6B7480}
          .tx4{font-family:Inter;font-size:12.3px;fill:#1b1e24}
          .an4{font-family:'JetBrains Mono';font-size:12px;fill:#B4491E}
        </style></defs>

        <g class="hr4" text-anchor="middle">
          <text x="120" y="18">08h</text><text x="251" y="18">10h</text><text x="382" y="18">12h</text>
          <text x="512" y="18">14h</text><text x="643" y="18">16h</text><text x="774" y="18">18h</text>
          <text x="905" y="18">20h</text>
        </g>
        <line x1="120" y1="28" x2="965" y2="28" stroke="#9AA2AB" stroke-width="0.8"/>
        <g stroke="#DFE3E7" stroke-width="0.8">
          <line x1="251" y1="28" x2="251" y2="238"/><line x1="382" y1="28" x2="382" y2="238"/>
          <line x1="512" y1="28" x2="512" y2="238"/><line x1="643" y1="28" x2="643" y2="238"/>
          <line x1="774" y1="28" x2="774" y2="238"/><line x1="905" y1="28" x2="905" y2="238"/>
        </g>

        <text class="nm4" x="0" y="68">Hospital A</text>
        <text class="sm4" x="0" y="85">Decisão cedo</text>
        <g>
          <circle cx="284" cy="48" r="4" fill="#B4491E"/>
          <text class="an4" x="272" y="42" text-anchor="end">T1 10h30</text>
          <rect x="284" y="56" width="163" height="40" fill="#196396"/>
          <text class="tx4" x="297" y="80" fill="#fff">Execução · 2h30</text>
          <rect x="447" y="56" width="458" height="40" fill="#EAF6F0" stroke="#7FD9AE" stroke-width="0.8"/>
          <text class="tx4" x="461" y="80" fill="#1E5A41">Leito disponível no turno da manhã e reocupado no mesmo dia</text>
        </g>

        <text class="nm4" x="0" y="158">Hospital B</text>
        <text class="sm4" x="0" y="175">Decisão tarde</text>
        <g>
          <rect x="120" y="146" width="556" height="40" fill="#EFF1F3" stroke="#C7CCD2" stroke-width="0.8"/>
          <text class="tx4" x="134" y="170" fill="#6B7480">Paciente clinicamente pronto desde a manhã, aguardando a visita</text>
          <circle cx="676" cy="138" r="4" fill="#B4491E"/>
          <text class="an4" x="664" y="132" text-anchor="end">T1 16h30</text>
          <rect x="676" y="146" width="163" height="40" fill="#196396"/>
          <text class="tx4" x="689" y="170" fill="#fff">Execução · 2h30</text>
          <rect x="839" y="146" width="126" height="40" fill="#EAF6F0" stroke="#7FD9AE" stroke-width="0.8"/>
          <text class="tx4" x="851" y="170" fill="#1E5A41">Virada na noite</text>
        </g>

        <g>
          <line x1="120" y1="222" x2="965" y2="222" stroke="#1b1e24" stroke-opacity=".7" stroke-width="1"/>
          <text class="tx4" x="120" y="248" font-weight="700">T2 &minus; T1 idêntico nos dois hospitais.</text>
          <text class="tx4" x="120" y="270" fill="#4A5260">O que o indicador não registra: 6 horas de leito ocupado por um paciente pronto no hospital B — visíveis apenas na mediana do horário de T1.</text>
        </g>
      </svg>
      <figcaption><b>Figura 6.1</b> — <i>Esquema ilustrativo da limitação do indicador único de execução</i></figcaption>
    </figure>

    <p class="ni">O indicador continua necessário; o risco está em lê-lo sozinho. Sozinho, ele premia o hospital que decide tarde e corre, e pune o que decide cedo e enfrenta a manhã cheia de altas simultâneas. A correção custa pouco: o horário da alta médica acompanha o intervalo na mesma tela, e qualquer melhora de um às custas do outro aparece na hora.</p>
    <p class="nota"><strong>Parâmetro de referência —</strong> programas internacionais de fluxo hospitalar adotam como premissa que nenhuma progressão de paciente entre unidades acumule espera superior a 2 horas depois de atingidos os critérios de prontidão. Serve como referência de desenho; a definição de meta exige a medição própria de cada instituição.</p>

    <h3 class="h-sec">Cruzando as duas medidas: quatro situações</h3>
    <p class="ni">Cruzar o horário da decisão com o tempo de preparo encaixa cada unidade em uma de quatro situações — e cada situação tem um plano de ação diferente.</p>

    <div class="qcap"><b>Quadro 6.2</b> — <i>Matriz de diagnóstico</i></div>
    <table>
      <thead><tr><th style="width:30mm">Estado</th><th style="width:33mm">Configuração</th><th>Leitura</th><th style="width:44mm">Plano de ação</th></tr></thead>
      <tbody>
        <tr><td class="k">Fluxo regular</td><td>Decisão cedo, execução curta</td><td>Restrição remanescente, se houver, está na jornada 2</td><td>Sustentar; acompanhar virada e alocação</td></tr>
        <tr><td class="k">Restrição na decisão</td><td>Decisão tarde, execução curta</td><td>Execução eficiente encobrindo alta tardia; o indicador único não capta este estado</td><td>Previsão, critérios e horário de visita</td></tr>
        <tr><td class="k">Restrição na execução</td><td>Decisão cedo, execução longa</td><td>Antecipação desperdiçada por exigência administrativa, documentação ou transporte</td><td>Retirar a conta do caminho crítico; ler Td &minus; T1</td></tr>
        <tr><td class="k">Cadeia comprometida</td><td>Decisão tarde, execução longa</td><td>Nenhuma ação isolada produz efeito mensurável</td><td>Medir a linha de base e atacar decisão e execução em conjunto</td></tr>
      </tbody>
    </table>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">20</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">6 · Indicadores</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <h3 class="h-sec">Três proteções contra o ganho de fachada</h3>
    <p class="ni">Meta de horário sem contrapeso cria dois vícios previsíveis: antecipar saída que ainda precisava de um dia de leito e empurrar para amanhã cedo a alta que sairia hoje à tarde. Três medidas andam junto com o painel para expor esses desvios, com o critério de ajuste sempre declarado — porte e linha de cuidado no mínimo; DRG onde estiver implantado.</p>

    <div class="ld">
      <div>
        <div class="r">Balanceamento 1</div>
        <div class="v" style="font-size:12.5pt;line-height:1.2">Tempo de permanência</div>
        <div class="f">Ajustado por complexidade; capta tanto o represamento de altas quanto a antecipação indevida.</div>
      </div>
      <div>
        <div class="r">Balanceamento 2</div>
        <div class="v" style="font-size:12.5pt;line-height:1.2">Readmissão em 30 dias</div>
        <div class="f">Ajustada por complexidade; capta alta precoce induzida por pressão de indicador.</div>
      </div>
      <div>
        <div class="r">Balanceamento 3</div>
        <div class="v" style="font-size:12.5pt;line-height:1.2">Retorno ao pronto-socorro</div>
        <div class="f">Em até 72 horas; capta falha de transição que a readmissão formal não registra. Exige base do próprio hospital ou cessão da operadora.</div>
      </div>
    </div>

    <h3 class="h-sec">O que sustentou resultado por 41 meses</h3>
    <p class="ni">O melhor contraste com o ensaio que falhou vem de um projeto que durou 41 meses, de janeiro de 2019 a maio de 2022, atravessando a pandemia. As altas com ordem emitida antes das 10h subiram de 8,7% para 22,2%; as concluídas até o meio-dia, de 9,5% para 26,8% — ambas com significância estatística e correlação de 0,76 entre si. As três proteções acompanhadas no período — permanência, readmissão e mortalidade ajustadas — seguiram estáveis.</p>
    <p>O que esse projeto fez foi estrutura, do começo ao fim: reunião multidisciplinar diária e curta, alinhamento matinal entre equipes, roteiro padronizado de troca de turno, sinalização de prontidão de alta e caminho de escalonamento para as barreiras de radiologia, reabilitação e coordenação do cuidado. A correlação entre as duas medidas não prova causa — mas mostra as duas pontas andando juntas. Um painel que só olha o preparo da saída perde de vista a etapa onde o resultado começa, e essa é a razão prática de medir a jornada 1A.</p>

    <h3 class="h-sec">A rotina que mantém o painel vivo</h3>
    <p class="ni">Indicador sem rotina de leitura vira arquivo em poucos meses. A cadência mínima tem três níveis, cada um com a sua decisão.</p>

    <div class="qcap"><b>Quadro 6.3</b> — <i>Cadência de leitura do painel</i></div>
    <table>
      <thead><tr><th style="width:22mm">Frequência</th><th style="width:44mm">Instância</th><th>O que se decide</th></tr></thead>
      <tbody>
        <tr><td class="k">Diária</td><td>Unidade e NIR</td><td>Altas previstas do dia, barreiras identificadas, escalonamento de pendências</td></tr>
        <tr><td class="k">Semanal</td><td>Coordenação clínica, enfermagem e operações</td><td>Casos acima do limite de espera, com investigação individual</td></tr>
        <tr><td class="k">Mensal</td><td>Diretoria técnica e comitê de qualidade</td><td>Tendência das medianas por estrato e comportamento do balanceamento</td></tr>
      </tbody>
    </table>
    <p class="tn">Os casos extremos entram na reunião semanal com identificação do que travou e de quem destravou; a discussão nominal segue as regras de acesso e sigilo da instituição, com o painel publicado apenas em forma agregada.</p>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">21</span></div>
</section>

<section class="compass-page">
  <div class="rh"><span class="l">7 · Referências</span><span class="r">Compass 008/2026</span></div>
  <div class="pad">
    <div class="kick">Capítulo 7</div>
    <h2 class="h-cap">Referências</h2>

    <div class="refs" style="margin-top:5mm">
      <div class="r"><span class="n">1</span><span>BRASIL. <em>Lei nº 12.842, de 10 de julho de 2013.</em> Dispõe sobre o exercício da Medicina. Diário Oficial da União, 11 jul. 2013.</span></div>
      <div class="r"><span class="n">2</span><span>BRASIL. Ministério da Saúde. <em>Padronização da Nomenclatura do Censo Hospitalar.</em> 2ª edição revista. Brasília: Ministério da Saúde, 2002.</span></div>
      <div class="r"><span class="n">3</span><span>BRASIL. Ministério da Saúde. <em>Portaria GM/MS nº 3.390, de 30 de dezembro de 2013.</em> Institui a Política Nacional de Atenção Hospitalar (PNHOSP).</span></div>
      <div class="r"><span class="n">4</span><span>CONSELHO FEDERAL DE MEDICINA. <em>Resolução CFM nº 1.638, de 10 de julho de 2002.</em> Define prontuário médico e torna obrigatória a criação da Comissão de Revisão de Prontuários.</span></div>
      <div class="r"><span class="n">5</span><span>FUNDAÇÃO GETULIO VARGAS, Escola de Administração de Empresas de São Paulo. <em>Fatores que interferem na desocupação do leito hospitalar após alta hospitalar.</em> Dissertação de mestrado profissional. São Paulo: FGV EAESP.</span></div>
      <div class="r"><span class="n">6</span><span>HOSPITAL DAS CLÍNICAS DA FACULDADE DE MEDICINA DE RIBEIRÃO PRETO, USP. <em>Impacto da informatização do processo de alta hospitalar.</em> Revista Qualidade HC, Ribeirão Preto.</span></div>
      <div class="r"><span class="n">7</span><span>BURDEN, M. et al. Discharge in the a.m.: a randomized controlled trial of physician rounding styles to improve hospital throughput and length of stay. <em>Journal of Hospital Medicine</em>, 2023. DOI 10.1002/jhm.13060.</span></div>
      <div class="r"><span class="n">8</span><span>Increasing and sustaining discharges by noon: a multi-year process improvement project. <em>BMC Health Services Research</em>, 2024. DOI 10.1186/s12913-024-10960-x.</span></div>
      <div class="r"><span class="n">9</span><span>NATIONAL HEALTH SERVICE. <em>The SAFER Patient Flow Bundle</em> e <em>Rapid Improvement Guide to Expected Date of Discharge and Clinical Criteria for Discharge.</em> NHS England.</span></div>
      <div class="r"><span class="n">10</span><span>INSTITUTE FOR HEALTHCARE IMPROVEMENT. <em>Achieving Hospital-wide Patient Flow.</em> White Paper, 2ª edição. Boston: IHI.</span></div>
      <div class="r"><span class="n">11</span><span>COMPROMISSO COM A QUALIDADE HOSPITALAR (CQH). <em>Caderno de Indicadores — Roteiro.</em> Ficha técnica do índice de intervalo de substituição. São Paulo.</span></div>
      <div class="r"><span class="n">12</span><span>EMPRESA BRASILEIRA DE SERVIÇOS HOSPITALARES. <em>Manual de Normas e Rotinas do Núcleo Interno de Regulação (NIR).</em> Hospitais universitários federais.</span></div>
      <div class="r"><span class="n">13</span><span>RIOSAÚDE. <em>Procedimento Operacional Padrão — Round Multiprofissional.</em> Rio de Janeiro.</span></div>
    </div>
  </div>
  <div class="ft"><span class="c">© Grupo CSV</span><span class="n">22</span></div>
</section>

<section class="compass-page compass-page--back">
  <div class="mi">
    <div class="kick" style="color:#2DBF7F">Síntese</div>
    <h2 class="t">Sete Marcos, Três Jornadas,<br>Um Titular por Intervalo</h2>
    <p>As normas e os estudos reunidos aqui convergem para um mesmo desenho de medição: intervalos delimitados por marcos de registro automático, cada um sob responsabilidade de uma área com capacidade de alterá-lo. A aplicação começa pela medição da linha de base, antes de qualquer intervenção no processo.</p>
    <p>Nos casos documentados, a primeira redução relevante veio da retirada da tramitação de documentos do caminho crítico da liberação do leito — sem contratação, obra ou tecnologia adicional. A sustentação do resultado, nos estudos de maior duração, esteve associada à formalização da previsão de alta e do prazo documental nas regras do corpo clínico; iniciativas apoiadas apenas em adesão voluntária não produziram efeito comparável.</p>
  </div>

  <div class="assin">
    <img class="av" src="/compass/edicoes/2026/008/assets/avatar-md.png" alt="Guilherme Thomé">
    <div>
      <img class="sig" src="/compass/edicoes/2026/008/assets/signature-branca-md.png" alt="Assinatura">
      <div class="nm">Dr. Guilherme Thomé</div>
      <div class="cg">Grupo CSV — Cuidados em Saúde com Valor</div>
      <div class="ct">grupocsv.com &nbsp;·&nbsp; guilherme@grupocsv.com</div>
    </div>
  </div>

  <div class="base">
    <div style="display:flex;align-items:flex-end;gap:9mm">
      <img class="csv" src="/compass/edicoes/2026/008/assets/csv-neg.png" alt="Grupo CSV">
      <img class="axia" src="/compass/edicoes/2026/008/assets/axia-neg.png" alt="AxiaCare®">
    </div>
    <div class="cop">© 2026 Grupo CSV &nbsp;·&nbsp; Compass&#8482; 008/2026</div>
  </div>
</section>
</template>
