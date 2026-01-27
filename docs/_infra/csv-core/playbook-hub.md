# Playbook do Hub Central
**Infraestrutura Cognitiva e Operacional do Grupo CSV**

## 1. O Conceito
O **Hub Central** (`hub.grupocsv.com`) não é apenas um site de documentação. É a **Fonte Única da Verdade (SSOT)** para todo o ecossistema do Grupo CSV.

Ele serve a dois mestres simultaneamente:
1.  **Humanos:** Executivos, colaboradores e parceiros que precisam acessar políticas, assets e diretrizes de forma rápida e visual.
2.  **Máquinas (IA):** Agentes autônomos que consomem a estrutura de pastas e arquivos Markdown para entender "quem somos", "o que fazemos" e "quais são as regras".

## 2. Arquitetura da Informação
A estrutura de pastas reflete a organização jurídica e operacional:

*   `/csv-core`: O "cérebro". Contém definições canônicas, compliance, identidade visual e assets. É o que une todas as empresas.
*   `/axiacare`: Mandatos e documentos específicos da operação de consultoria e gestão.
*   `/medvalor`: Conteúdo educacional e diretrizes da escola de negócios.
*   `/thera`: Documentação técnica e de produto da fábrica de software.

## 3. Tecnologia (VitePress)
Escolhemos o **VitePress** por ser:
*   **Static-First:** Gera HTML puro, extremamente rápido e seguro.
*   **Markdown-Based:** Todo o conteúdo é escrito em texto simples (`.md`), garantindo portabilidade e leitura por IA.
*   **Git-Driven:** A atualização é feita via commit no GitHub, garantindo versionamento e auditoria de cada mudança.

## 4. Como Operar
### Adicionar Novo Documento
1.  Crie um arquivo `.md` na pasta correspondente (ex: `/axiacare/novo-processo.md`).
2.  Adicione o link no arquivo de configuração `.vitepress/config.mts` (se quiser que apareça no menu lateral).
3.  Faça o commit e push para a branch `main`.
4.  O deploy é automático (1-2 minutos).

### Atualizar Assets
1.  Adicione a imagem na pasta `/public/assets/`.
2.  Referencie no Markdown usando o caminho absoluto (ex: `![Logo](/assets/logo.png)`).

## 5. Governança
*   **Owner:** Guilherme Thomé (@guithome).
*   **Acesso:** Público para leitura (transparência radical), restrito para escrita (governança).
*   **Manutenção:** Revisão trimestral dos mandatos e compliance.
