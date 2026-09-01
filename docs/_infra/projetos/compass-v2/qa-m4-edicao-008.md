# QA visual manual — Compass™ 008 v2

Data: 2026-08-31

## Fontes verificadas nesta rodada

| Fonte | Evidência |
|---|---|
| Screenshot desktop completo | `/mnt/0udru13lsmh3kbovsi0rfk5dq/ubuntu/repos/grupocsv/hub/.compass-qa/008-final-green/desktop.png` |
| PDF final, páginas 1–4 | `/mnt/0udru13lsmh3kbovsi0rfk5dq/ubuntu/repos/grupocsv/hub/compass/edicoes/2026/008/compass_008_2026.pdf` |
| HTML servido localmente | `http://127.0.0.1:4190/compass/edicoes/2026/008/compass` |

## Achados confirmados

1. A edição 008 está renderizando **23 páginas reais** no DOM, sem escape de HTML como texto literal.
2. A capa está correta e coerente com a hierarquia de marcas definida pelo usuário:
   - **Grupo CSV** em primeiro lugar;
   - **Compass™** como produto;
   - **Responsabilidade editorial: MedValor®**;
   - **Elaboração: AxiaCare®**.
3. O sumário foi renderizado como página editorial normal, com boa hierarquia tipográfica e sem duplicação de capa.
4. A página de síntese e a abertura do Capítulo 1 preservam o layout escuro do modelo 008 com contraste legível.
5. A tabela da página 4 aparece sobre **papel branco**, com linhas e colunas preservadas, sem sofrer recoloração indevida do tema escuro global do Hub.
6. O PDF final tem **23 páginas** e peso abaixo do limite operacional definido no projeto.
7. O relatório automatizado mais recente confirmou:
   - paridade web/PDF: `ok=true`;
   - PDF: `pages=23`, `bytes=1179303`;
   - acessibilidade: `violations=[]`, `blocking=0`.

## Causa raiz confirmada e corrigida nesta rodada

O conteúdo das páginas 008 estava sendo inserido diretamente no Markdown e parte do HTML era escapada ou deixava de herdar corretamente os estilos por causa do uso de `<style scoped>` no invólucro. A correção adotada foi:

1. mover as 23 páginas para um componente Vue dedicado (`Compass008Content.vue`);
2. manter o Markdown apenas como invólucro com frontmatter e montagem editorial;
3. publicar o componente Vue junto com a edição;
4. remover `scoped` do CSS já namespaceado para que os estilos alcancem o componente filho sem contaminar o restante do Hub.

## Conclusão desta rodada

A integração estrutural da edição 008 ao motor Compass™ v2 está validada manualmente nas primeiras páginas e aprovada automaticamente nos gates de qualidade desta fase.

## Complemento da inspeção manual — páginas 5 a 8 do PDF final

Fonte adicional verificada: páginas 5–8 de `/mnt/0udru13lsmh3kbovsi0rfk5dq/ubuntu/repos/grupocsv/hub/compass/edicoes/2026/008/compass_008_2026.pdf`.

### Observações confirmadas

1. A página 5 mantém o padrão de leitura em papel branco, com subtítulos, fórmula destacada e separadores horizontais coerentes.
2. A página 6 abre o Capítulo 2 com tarja escura, número do capítulo em destaque e infográfico horizontal preservado sem quebra estrutural.
3. A página 7 contém quadro tabular com grid íntegro, cabeçalhos legíveis e colunas corretamente alinhadas.
4. A página 8 preserva a tabela de intervalos e o bloco de regra de construção, mantendo hierarquia editorial e contraste adequados.
5. O cabeçalho fino e a paginação superior/direita permanecem consistentes entre as páginas 5–8, sem duplicações ou deslocamentos visuais.

### Conclusão parcial da inspeção manual

As páginas 5–8 confirmam que o motor v2 está preservando corretamente a gramática editorial do Compass 008 também nas seções internas com fórmulas, quadros e abertura de capítulo, e não apenas nas primeiras páginas.

## Complemento da inspeção manual — páginas 9 a 12 do PDF final

Fonte adicional verificada: páginas 9–12 de `/mnt/0udru13lsmh3kbovsi0rfk5dq/ubuntu/repos/grupocsv/hub/compass/edicoes/2026/008/compass_008_2026.pdf`.

### Observações confirmadas

1. As páginas 9–12 mantêm continuidade visual e editorial, sem ruptura de grid entre tabelas, diagramas e texto corrido.
2. Os elementos de jornada e fluxo intermediário permanecem alinhados ao padrão do layout 008, com uso consistente de faixas, destaques e separadores.
3. Não foi observado colapso de colunas, truncamento grosseiro de tabelas nem duplicação de cabeçalho/rodapé nessas páginas.
4. A paginação e os elementos de navegação editorial seguem estáveis nas páginas intermediárias, reforçando a paridade entre HTML e PDF já confirmada pelos gates automatizados.

### Conclusão parcial desta faixa

As páginas 9–12 reforçam que o motor v2 está preservando o comportamento editorial do miolo da edição 008 também em conteúdos analíticos intermediários, sem perda estrutural perceptível nesta amostra manual.

## Complemento da inspeção manual — páginas 13 a 16 do PDF final

Fonte adicional verificada: páginas 13–16 de `/mnt/0udru13lsmh3kbovsi0rfk5dq/ubuntu/repos/grupocsv/hub/compass/edicoes/2026/008/compass_008_2026.pdf`.

### Observações confirmadas

1. A página 13 preserva bem a seção **Da Saída do Paciente ao Leito Ocupado**, com título legível, bloco-resumo superior e lista operacional longa sem colapso de linhas.
2. A página 14 mantém a abertura do Capítulo 4 com contraste forte, tarja escura estável e quadro comparativo inferior corretamente composto.
3. A página 15 apresenta tabela comparativa e subtítulos subsequentes em papel branco, com alinhamento visual consistente e sem desalinhamento de colunas.
4. A página 16 abre o Capítulo 5 de forma coerente com o restante da edição, preservando número grande de capítulo, título, subtítulo e texto corrido sem truncamento perceptível.
5. Nessas quatro páginas, o sistema de paginação, o cabeçalho fino e a assinatura visual do Compass™ permanecem consistentes com as páginas anteriores.

### Conclusão parcial desta faixa

As páginas 13–16 confirmam que o motor v2 está preservando corretamente capítulos tardios e páginas densas do miolo editorial, inclusive com listas extensas e quadros comparativos, sem regressão visual perceptível nesta amostra manual.

## Complemento da inspeção manual — páginas 17 a 20 do PDF final

Fonte adicional verificada: páginas 17–20 de `/mnt/0udru13lsmh3kbovsi0rfk5dq/ubuntu/repos/grupocsv/hub/compass/edicoes/2026/008/compass_008_2026.pdf`.

### Observações confirmadas

1. A página 17 mantém legibilidade em diagrama temporal horizontal, tabela inferior e texto corrido subsequente, sem compressão visual excessiva.
2. A página 18 preserva tabela extensa com várias linhas, legenda inferior e bloco conclusivo sem perda aparente de alinhamento ou contraste.
3. A página 19 abre o Capítulo 6 com o mesmo padrão formal dos capítulos anteriores, reforçando consistência estrutural do motor v2 ao longo da edição.
4. A página 20 mantém diagrama horizontal, legenda, texto explicativo e subtítulo final sem truncamento perceptível nesta inspeção manual.
5. Os capítulos operacionais finais continuam coerentes em espaçamento, paginação e hierarquia tipográfica.

### Conclusão parcial desta faixa

As páginas 17–20 confirmam que o miolo tardio da edição 008, incluindo diagramas e quadros mais densos, permaneceu íntegro após a conversão para o motor Compass™ v2.

## Complemento da inspeção manual — páginas 21 a 23 do PDF final

Fonte adicional verificada: páginas 21–23 de `/mnt/0udru13lsmh3kbovsi0rfk5dq/ubuntu/repos/grupocsv/hub/compass/edicoes/2026/008/compass_008_2026.pdf`.

### Observações confirmadas

1. A página 21 preserva os três blocos de balanceamento, os subtítulos operacionais e o texto analítico sem ruptura de grid.
2. A página 22 apresenta as 13 referências em composição limpa, numerada e integralmente legível.
3. A página 23 preserva avatar, assinatura, marcas Grupo CSV/AxiaCare® e a linha de copyright.
4. **Problema visual detectado manualmente:** o título da síntese da página 23 está em azul-escuro sobre fundo escuro, com contraste visual inadequado, apesar de o gate automatizado não o ter sinalizado. O texto corrido e os demais créditos permanecem legíveis.

### Ação necessária antes de aprovar o Marco 4

Comparar a página 23 com o PDF original anexado e corrigir somente a cor do título da síntese para a versão clara original, adicionando um teste visual/estrutural que impeça regressão. O Marco 4 permanece em andamento até essa correção e uma nova inspeção.

## Confirmação final da contracapa após correção do motor

Fonte verificada: página 23 do PDF regenerado em `/mnt/0udru13lsmh3kbovsi0rfk5dq/ubuntu/repos/grupocsv/hub/compass/edicoes/2026/008/compass_008_2026.pdf`.

A correção foi confirmada visualmente: o título **Sete Marcos, Três Jornadas, Um Titular por Intervalo** está novamente em branco sobre o fundo escuro, reproduzindo a intenção do PDF original.

O auditor passou a medir separadamente tela e mídia de impressão. Resultado final:

| Medição | Resultado |
|---|---:|
| Contraste do título na tela | 17,96:1 |
| Contraste do título no PDF | 17,96:1 |
| Violações de acessibilidade | 0 |
| Bloqueios | 0 |
| Paridade web/PDF | Aprovada |
| Páginas do PDF | 23 |
| Tamanho do PDF | 1.179.294 bytes |

A inspeção manual de todas as 23 páginas foi concluída. O Marco 4 pode avançar após a revisão de diff, suíte integral e commit atômico.
