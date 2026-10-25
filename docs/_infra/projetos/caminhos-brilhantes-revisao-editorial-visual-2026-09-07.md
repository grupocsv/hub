# Caminhos Brilhantes — Revisão Editorial e Visual

## Modo

Redesign · Preserve. A rota, os arquivos, os links, a arquitetura de informação, as marcas e os recursos documentais permanecem.

## Preservar

A página continua apresentando a estratégia Caminhos Brilhantes, seus três eixos, as instituições parceiras, a Jornada TEA, a apresentação executiva, o relatório técnico, o Hub TEA e a identificação institucional da Unimed Governador Valadares.

## Remover

Serão removidas as expressões de metalinguagem editorial e temporal, incluindo “mais recente”, datas usadas como classificação de materiais, a afirmação de que a estratégia foi concebida em maio de 2026, a narrativa “da estratégia à execução” e o texto que descreve datas de produção ou atualização dos materiais. A seção cronológica “Marcos de 2026” será substituída por uma seção estável sobre frentes estruturantes, sem datas e sem inferir a origem temporal da estratégia.

A descrição da Unimed Federação Minas será reescrita sem datas. A sigla “FEMG” não será usada como rótulo principal.

## Melhorar

A hierarquia visual será aprimorada com elevação discreta, bordas com maior refinamento, transições de entrada ativadas por rolagem, feedback de hover e foco, profundidade sutil no hero, melhor ritmo entre seções e tratamento mais consistente dos cards. O movimento respeitará `prefers-reduced-motion`.

## Logo do Escritório de Valor em Saúde

O selo atual em verde sobre fundo verde escuro será substituído pela variante oficial negativa, branca e transparente, publicada em:

`https://assets.grupocsv.com/logos/evs/selo-white-footer-240.png`

## Contratos Protegidos

Permanecem inalterados:

- slug `caminhos-brilhantes`;
- links para `apresentacao.pdf`, `relatorio.pdf`, Jornada TEA e Hub TEA;
- metadados de compartilhamento e `og.png`;
- arquivos adicionais da slug;
- conteúdo factual que não dependa de uma cronologia presumida;
- identificação de Guilherme Thomé e da Unimed Governador Valadares.

## Parâmetros de Design

| Dimensão | Direção |
|---|---|
| Linguagem visual | Institucional Unimed, calor humano e precisão executiva |
| Variação visual | 5/10 |
| Intensidade de movimento | 4/10 |
| Densidade de informação | 6/10 |
| Dependência de assets | 8/10 |
| Fidelidade de marca | 10/10 |

## Risco Principal e Rollback

O maior risco é remover fatos operacionais junto com a cronologia indevida. As mudanças serão feitas por script determinístico com asserts sobre os trechos esperados. Antes da publicação, o objeto atual será preservado em um novo backup no R2. Se qualquer validação funcional, visual ou de conteúdo falhar, o backup será restaurado.
