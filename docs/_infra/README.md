# Grupo CSV | Hub Central de Conhecimento e Governança

Este repositório mantém o **índice canônico da infraestrutura documentada** do Grupo CSV. O código, a configuração publicada e o estado verificado do runtime permanecem as fontes primárias para decisões operacionais.

## Estrutura do Repositório

### 1. Núcleo Estratégico (`/csv-core`)
Contém os princípios fundamentais, definições canônicas e a "Constituição" do ecossistema.
- Definição do Grupo CSV
- Papel da Orquestração Multistakeholder
- Infraestrutura Relacional

### 2. Unidades de Negócio
Estruturas específicas de cada braço do grupo, herdando princípios do núcleo mas com suas especificidades operacionais.

- **`/axiacare`**: Gestão, Consultoria e Governança Clínica.
- **`/medvalor`**: Educação, Cultura e Formação de Lideranças.
- **`/thera`**: Tecnologia, Desenvolvimento e Inteligência Artificial.

### 3. Ferramentas de Execução

- **`/playbooks`**: Guias estratégicos de "como fazer".
- **`/manual-operacional`**: Procedimentos padrão e rotinas.
- **`/frameworks`**: Modelos mentais e estruturas de decisão.
- **`/toolkits`**: Ferramentas práticas e templates.
- **`/ferramentas/compass.md`**: Arquitetura, motor v2, backend, downloads, Admin, release e rollback do Compass™.

### 4. Compass™

A fonte editorial canônica fica em `compass/edicoes/`. A publicação VitePress, o catálogo JSON e o PDF A4 são artefatos derivados e validados. A hierarquia institucional é **“Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®”**; AxiaCare® permanece identificada na elaboração e na aplicação prática das consultorias e assessorias.

O backend reutiliza o `csv-documents` e seus documentos, versões, R2 privado e links públicos. A migration e o Worker permanecem somente preparados até autorização explícita. O n8n não integra o caminho crítico e não foi alterado.

## Governança de Uso

Este repositório é estruturado para consumo por **Agentes de IA** e **Sistemas Automatizados**.
- **Não altere** a estrutura de pastas sem validação arquitetural.
- **Não duplique** conceitos; use referências cruzadas.
- **Mantenha** a neutralidade e precisão técnica em todos os documentos.

---
*Grupo CSV - Cuidados em Saúde com Valor*
