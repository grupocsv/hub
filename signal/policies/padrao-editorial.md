# Padrão Editorial: Signal™

> **Propósito:** Definir os princípios, estilo de linguagem, regras e checklist de qualidade para todas as edições do Signal™.

---

## Princípios Fundamentais

1.  **Clareza Executiva:** A informação deve ser apresentada de forma direta, concisa e sem ambiguidades. O público-alvo é a alta gestão, que precisa de insights rápidos e acionáveis.
2.  **Objetividade:** O tom é estritamente neutro e informativo. Evitar adjetivos, opiniões ou qualquer linguagem que sugira juízo de valor.
3.  **Densidade Informacional:** Cada frase deve ter um propósito. Eliminar redundâncias e informações de baixo valor estratégico.
4.  **Consistência Visual:** Todas as edições devem seguir rigorosamente o template visual definido, garantindo o reconhecimento e a previsibilidade da marca Signal™.

---

## Regra de Formato: Uma Única Página

> **REGRA INVIOLÁVEL:** O PDF do Signal™ deve ter **exatamente 1 (uma) página**. Essa restrição é absoluta e não admite exceções. A diagramação (tamanho de fonte, espaçamento, compactação de resumos) deve ser ajustada para que todo o conteúdo caiba em uma única página A4. Se o conteúdo exceder o espaço disponível, os resumos dos fatos estratégicos e das demais movimentações devem ser encurtados até que o limite de uma página seja respeitado. Nunca gerar um PDF com mais de uma página.

---

## Estilo de Linguagem

-   **Voz Ativa:** Preferir a voz ativa sempre que possível ("A equipe decidiu..." em vez de "Foi decidido pela equipe...").
-   **Terminologia Precisa:** Utilizar os termos técnicos e nomes de projetos conforme o **Dicionário Oficial**. Evitar jargões desnecessários.
-   **Abreviações:** Na primeira menção, usar o termo completo seguido da abreviação entre parênteses. Ex: Escritório de Valor em Saúde (EVS). Nas menções seguintes, usar apenas a abreviação.
-   **Números:** Escrever por extenso números de um a nove. Usar algarismos para 10 ou mais. Exceção: métricas e dados tabulares.
-   **Acentuação e Cedilha:** Respeitar rigorosamente as normas ortográficas do Português do Brasil, incluindo acentos gráficos e cedilha.

---

## Escopo editorial da Unimed

O Signal™ sintetiza exclusivamente fatos com vínculo direto e comprovado com a **Unimed Governador Valadares**, o **Hospital Unihealth** ou o **Escritório de Valor em Saúde (EVS)**. A varredura pode consultar fontes amplas, mas o universo de coleta não define o universo de publicação.

Um item só pode entrar quando a fonte confirmar impacto ou decisão assistencial, operacional, financeira, regulatória, contratual, de governança ou de linha de cuidado para essas instituições. Parceiros externos podem ser citados somente quando o fato estiver diretamente ligado a uma iniciativa da Unimed, do Hospital Unihealth ou do EVS.

Assuntos internos do Grupo CSV são excluídos, ainda que apareçam no Gmail ou no Notion do período. Isso inclui CMS-CSV, Compass™, Hub, OpenClaw, Extensio, infraestrutura Cloudflare, GitHub, Workers, deploys, repositórios, agentes e releases técnicos.

Antes da aprovação editorial, cada fato e movimentação deve registrar sua instituição beneficiária e sua fonte. O comando `python3 scripts/validate-signal-scope.py` é obrigatório e bloqueia a publicação quando detectar tema interno proibido, ausência do campo `scope: unimed` nos metadados ou falta de âncora institucional nos fatos estratégicos.

---

## Estrutura do Conteúdo

### Fatos Estratégicos

-   **Título:** Deve ser uma frase nominal curta e impactante que resuma o fato. (e.g., "Aprovação do Piloto Axys-Teller").
-   **Resumo:** Um parágrafo de 2 a 4 frases. Deve responder: O que aconteceu? Quem está envolvido? Qual o impacto ou próximo passo?
-   **Tags de Categoria:** Cada fato deve ser associado a uma das seguintes tags. A cor da tag é definida pelo template.

| Tag | Descrição |
|---|---|
| `ESTRATÉGIA` | Decisões ou apresentações de nível estratégico à Diretoria. |
| `GOVERNANÇA` | Aprovações contratuais, deliberações formais, compliance. |
| `LINHAS DE CUIDADO` | Desenvolvimento, lançamento ou alteração em linhas de cuidado. |
| `ASSISTENCIAL` | Novos ambulatórios, protocolos clínicos, qualidade assistencial. |
| `OPERAÇÕES` | Mudanças em processos, fluxos de trabalho, estrutura organizacional. |
| `IMUNOBIOLÓGICOS` | Decisões, análises ou projetos relacionados a medicamentos biológicos. |
| `DADOS` | Projetos de análise de dados, Business Intelligence e novas plataformas. |
| `FINANCEIRO` | Decisões com impacto orçamentário, novos modelos de remuneração. |
| `REGULATÓRIO` | Mudanças em regulamentação (ANS, ANVISA) com impacto direto. |

### Demais Movimentações

-   Itens de menor impacto estratégico, mas relevantes para o conhecimento geral.
-   Formato de bullet points, com frases curtas e diretas.

---

## Proibições

-   **NÃO** usar emojis ou ícones não-padrão.
-   **NÃO** usar cores fora da paleta canônica do Grupo CSV.
-   **NÃO** alterar a estrutura do layout (posicionamento de logo, fontes, etc.).
-   **NÃO** incluir informações especulativas ou não verificadas.
-   **NÃO** incluir assuntos internos do Grupo CSV sem vínculo direto com Unimed GV, Hospital Unihealth ou EVS.
-   **NÃO** tratar a amplitude da varredura como autorização editorial.
-   **NÃO** ultrapassar uma página no formato PDF (regra inviolável).
-   **NÃO** gerar texto sem acentuação ou cedilha.

---

## Fluxo de Correção

Quando uma edição publicada contiver erro (formato, conteúdo, grafia), o seguinte fluxo deve ser seguido:

1.  Corrigir o PDF e o `signal.md` no repositório, substituindo a versão anterior (sem versionamento da versão incorreta).
2.  Fazer commit com mensagem `fix(signal): corrige edição SNN/AAAA — [descrição breve]`.
3.  Reenviar o e-mail somente quando o usuário não restringir explicitamente a correção ao Hub. Se houver instrução de "somente Hub" ou equivalente, não reenviar.
4.  Quando houver reenvio, usar o assunto `Signal™ SNN/AAAA — Versão pós-correção`; o corpo segue o padrão normal, sem mencionar o erro corrigido.

---

## Checklist de Publicação

-   [ ] O PDF tem exatamente 1 (uma) página?
-   [ ] O título e o resumo de cada fato estão claros e objetivos?
-   [ ] As tags de categoria foram aplicadas corretamente?
-   [ ] O texto foi revisado para erros de gramática, acentuação e digitação?
-   [ ] Todos os nomes de pessoas, projetos e empresas estão corretos (conforme Dicionário Oficial)?
-   [ ] Cada fato e movimentação possui vínculo direto e comprovado com Unimed GV, Hospital Unihealth ou EVS?
-   [ ] O validador `python3 scripts/validate-signal-scope.py` foi executado e aprovado?
-   [ ] A data e o número da semana (SNN) estão corretos no cabeçalho e no nome do arquivo?
-   [ ] O nome do executivo está correto?
-   [ ] O PDF final foi inspecionado visualmente e não contém quebras ou erros de formatação?
