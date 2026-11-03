# Identidade e Direção da Interface

Aplicativo operacional do Grupo CSV, para leitura próxima em desktop e celular. Reformulação da área fiscal com preservação de autenticação, hospedagem, noindex e marcas.

- Marca: ativo existente `/assets/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_positive_transparent.png`.
- Tipografia: Inter quando instalada, com fallback para a fonte de interface do sistema, também nos títulos.
- Azul `#196396`, verde `#2DBF7F`, superfície `#F4F6F8`, texto `#1B1E24`.
- Composição: navegação lateral no desktop, menu recolhível no celular e faixa de estatísticas na visão geral. Valores e pendências em primeiro plano, cantos de 4 a 6 px, movimento discreto e cores sem papel exclusivo na transmissão de status.
- Dados: somente API autenticada; captura de validação usa base sintética explicitamente documentada.
- Em celular, tabelas tornam-se linhas com rótulos, preservando empresa, situação e valores.

## Revisão de Usabilidade — 2 de Novembro de 2026

Data de referência: America/Sao_Paulo. A interface reúne navegação por seção, filtros recolhíveis, diálogos com rolagem e retorno de foco. Em telas estreitas, os controles mantêm alvos de toque e os valores permanecem legíveis. O mês de planejamento aparece na visão geral e no calendário. Autenticação, IDs das empresas, payloads e estados fiscais seguem os contratos existentes.

## Logos Oficiais

Usar os arquivos existentes, sem redesenhar, recolorir ou combinar marcas. O Grupo CSV identifica o aplicativo; cada empresa recebe a sua própria marca nas visões de empresa. Os IDs técnicos são preservados, inclusive `theratech`, cuja marca visual oficial é Thera.

| Contexto ou ID | Marca | Caminho Público no Hub |
|---|---|---|
| Aplicativo / todas as empresas | Grupo CSV | `/assets/visual-identity/grupo-csv/logo/png/grupo-csv_logo_horizontal_full-color_positive_transparent.png` |
| `axiacare` | AxiaCare | `/assets/visual-identity/axiacare/logo/webp/axiacare_logo_horizontal_full-color_positive.webp` |
| `medvalor` | MedValor | `/assets/visual-identity/medvalor/logo/webp/medvalor_logo_horizontal_orange_positive.webp` |
| `theratech` | Thera | `/assets/visual-identity/thera/logo/webp/thera_logo_horizontal_purple_positive.webp` |

Os arquivos estão em `docs/public/visual-identity/` e foram conferidos com o [catálogo oficial](https://assets.grupocsv.com/api/meta) e o sistema de identidade do Grupo CSV. Os caminhos públicos responderam HTTP 200, com bytes idênticos aos do repositório. As três marcas de empresa usam WebP para reduzir o peso; o logo do Grupo CSV permanece em PNG. Não usar o selo “Powered by Thera” nem assinaturas promocionais como logo de uma empresa.

Manter a proporção original e a área de respiro. Usar `object-fit: contain` em superfície clara, sem filtros CSS, sombras ou recortes. O nome da empresa continua disponível em texto; quando o logo repetir esse nome ao lado, evitar leitura duplicada por tecnologia assistiva. Em seletores nativos, preservar opções textuais. Para um ID desconhecido, apresentar o nome disponível sem inventar outra marca.
