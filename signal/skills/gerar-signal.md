# Guia Operacional: Gerar Signal™

> **Propósito:** Gerar e publicar uma nova edição do Signal™, o resumo semanal de inteligência estratégica do Grupo CSV.

---

## Regras Invioláveis

1. **O PDF do Signal™ deve ter exatamente 1 (uma) página.** Essa restrição é absoluta. Ajustar diagramação, tamanho de fonte e comprimento dos resumos para garantir que todo o conteúdo caiba em uma única página A4.
2. **Acentuação e cedilha** devem ser rigorosamente respeitadas em todo o conteúdo (PDF, Markdown, metadados).
3. **Consultar o Dicionário Oficial** antes de gerar qualquer texto para garantir grafias corretas.
4. **Nunca usar `replace_content` para edições pontuais no Notion.** Para correções de grafia ou atualizações parciais, usar exclusivamente o comando `update_content` com `content_updates`. O comando `replace_content` substitui TODO o conteúdo da página e só deve ser usado para reescrita total intencional. Violação desta regra causa perda de dados (incidente S11/2026).
5. **Escopo editorial exclusivo da Unimed.** A varredura pode alcançar fontes amplas, mas só podem ser publicados fatos ligados diretamente à Unimed Governador Valadares, ao Hospital Unihealth ou ao Escritório de Valor em Saúde. CMS-CSV, Compass™, Hub, OpenClaw, Extensio, Cloudflare, GitHub, Workers, deploys, repositórios, agentes e releases técnicos são proibidos no Signal.

---

## Workflow de Geração

Este processo é executado semanalmente, tipicamente às segundas-feiras, para cobrir a semana anterior (D-7 a D-1).

### Fase 1: Coleta de Sinais

1.  **Varredura Notion:** Buscar por todas as páginas criadas ou editadas na última semana que contenham palavras-chave relevantes (`RADAR`, `EVS`, `Axys`, `decisão`, `estratégia`, `projeto`, etc.).
2.  **Varredura Gmail:** Buscar por todas as threads de e-mail no mesmo período com os mesmos critérios de palavra-chave.
3.  **Consolidação Bruta:** Agregar todo o conteúdo textual (páginas do Notion e corpos de e-mail) em um único arquivo de trabalho (e.g., `varredura_sNN.md`). Classificar cada item como `escopo_editorial: unimed` ou `escopo_editorial: fora_do_signal`.

### Fase 2: Análise e Síntese

1.  **Identificação de Fatos:** Ler o conteúdo consolidado e identificar os 5 a 7 acontecimentos mais relevantes da semana. Um "fato" pode ser uma reunião importante, uma decisão tomada, o avanço de um projeto, uma nova parceria, ou uma movimentação de mercado.
2.  **Categorização:** Atribuir a cada fato uma tag de categoria, conforme o `padrão-editorial.md`.
3.  **Síntese:** Para cada fato, escrever um título claro e um resumo de 2 a 4 frases que capture o essencial do acontecimento.
4.  **Outras Movimentações:** Listar outros pontos relevantes, mas de menor impacto estratégico, em formato de bullet points.
5.  **Gate de Escopo:** Registrar instituição beneficiária e fonte de cada item. Rejeitar qualquer conteúdo sem vínculo explícito com Unimed GV, Hospital Unihealth ou EVS. Executar `python3 scripts/validate-signal-scope.py`; falha bloqueia PDF, publicação e e-mail.

### Fase 3: Criação da Edição

1.  **Criar Estrutura de Pastas:** No diretório `signal/edicoes/AAAA/`, criar uma nova pasta `SNN` (e.g., `S08`). Dentro dela, criar a subpasta `assets`.
2.  **Criar `signal.md`:** Usar o `templates/signal_template.md` para criar o arquivo `signal/edicoes/AAAA/SNN/signal.md`. Preencher com os fatos e movimentações sintetizados na Fase 2.
3.  **Criar `metadata.yml`:** Usar o `templates/metadata_template.yml` para criar o arquivo `signal/edicoes/AAAA/SNN/metadata.yml`. Preencher todos os campos.

### Fase 4: Geração do PDF

1.  **Atualizar Script:** Atualizar o script `tools/signal-pdf/signal-pdf-gen.py` com o conteúdo da nova edição.
2.  **Executar Script:** Rodar o script para gerar o PDF.
    ```bash
    python3 tools/signal-pdf/signal-pdf-gen.py
    ```
3.  **Validar 1 Página:** Confirmar que o PDF gerado tem exatamente 1 página. Se ultrapassar, reduzir resumos e reexecutar.
4.  **Mover PDF:** Mover o arquivo PDF gerado (e.g., `Signal_S08_2026.pdf`) para a pasta `signal/edicoes/AAAA/SNN/assets/`.

### Fase 5: Publicação no Repositório

1.  **Espelhar Arquivos:** Copiar a pasta da nova edição (`signal/edicoes/AAAA/SNN/`) para o diretório `docs/signal/edicoes/AAAA/SNN/`.
2.  **Atualizar Índice:** Editar o arquivo `signal/README.md` e `docs/signal/index.md`, adicionando a nova edição à tabela de "Edições publicadas".
3.  **Atualizar Sidebar:** Editar o arquivo `docs/.vitepress/config.mts` para adicionar a nova edição na barra lateral do Signal™.
4.  **Commit e Push:**
    ```bash
    git add .
    git commit -m "signal: publica Signal SNN/AAAA (DD-DD/MMM)"
    git push
    ```

### Fase 6: Envio por E-mail e Entrega

> **Obrigatório:** O envio do Signal™ deve ser realizado exclusivamente pela skill `/csv-mail` (`/home/ubuntu/skills/csv-mail/SKILL.md`). Ler a skill antes de executar o envio.

1.  **Enviar E-mail via csv-mail:** Usar a API `POST /send-template` (template institucional) com o PDF anexo em base64. O header `User-Agent: csv-mail-client/1.0` é obrigatório para evitar bloqueio Cloudflare 1010.
    -   **Endpoint:** `https://mail-api.grupocsv.com/send-template`
    -   **Lista de distribuição:**
        -   `guilherme@grupocsv.com`
        -   `guilherme.thome@unimedgv.com.br`
        -   `naline@grupocsv.com`
        -   `naline.rocha@unimedgv.com.br`
    -   **Tags obrigatórias:** `source:manus`, `project:signal`
    -   **from_name:** `Guilherme Thomé`
    -   **reply_to:** `guilherme@grupocsv.com`
2.  **Assunto do E-mail:** `Signal™ SNN/AAAA — Resumo Semanal Estratégico (DD a DD de mês)`
3.  **Corpo HTML:** Parágrafo breve indicando a edição, o período, o número de fatos estratégicos e os destaques principais.
4.  **Confirmar e Entregar:** Após a confirmação do envio (verificar `success: true` e `id` retornado), o PDF é disponibilizado ao usuário para download.

---

## Fluxo de Correção

Quando uma edição publicada contiver erro (formato, conteúdo, grafia), seguir este fluxo:

1.  **Corrigir** o PDF e o `signal.md` no repositório, substituindo a versão anterior. Não versionar a versão incorreta.
2.  **Commit** com mensagem: `fix(signal): corrige edição SNN/AAAA — [descrição breve]`
3.  **Reenviar e-mail** somente quando o usuário não restringir explicitamente a correção ao Hub. Se houver instrução de "somente Hub" ou equivalente, não reenviar.
4.  Quando houver reenvio, usar o assunto `Signal™ SNN/AAAA — Versão pós-correção`; o corpo segue o padrão normal, sem mencionar o erro.
5.  **Entregar** o PDF corrigido ao usuário quando solicitado.

---

## Salvaguardas para Edição no Notion (MCP)

Esta seção documenta o uso correto dos comandos de edição de conteúdo do MCP Notion, após incidente de perda de dados em S11/2026.

### Comandos de Edição de Conteúdo

| Comando | Uso correto | Parâmetros | Risco |
|---------|-------------|------------|-------|
| `update_content` | Edições pontuais (search-and-replace) | `content_updates`: array de `{old_str, new_str, replace_all_matches}` | Baixo — altera apenas o trecho encontrado |
| `replace_content` | Reescrita total da página | `new_str`: conteúdo completo novo | ALTO — apaga todo o conteúdo existente |

### Exemplo Correto — Correção de Grafia

```json
{
  "page_id": "2fcdc8a9-...",
  "command": "update_content",
  "content_updates": [
    {
      "old_str": "Relay",
      "new_str": "Relay™",
      "replace_all_matches": true
    }
  ]
}
```

### Exemplo ERRADO — Nunca Fazer

```json
{
  "page_id": "2fcdc8a9-...",
  "command": "replace_content",
  "old_str": "Relay",
  "new_str": "Relay™"
}
```

Este comando apaga todo o conteúdo da página e substitui por "Relay™". O parâmetro `old_str` não pertence ao comando `replace_content`.

### Regra Geral

- Para **correções de grafia, adição de termos ou atualizações parciais**: sempre `update_content`.
- Para **reescrita total intencional** (raro): `replace_content` com `new_str` contendo o conteúdo completo.
- Antes de qualquer edição no Dicionário, fazer `fetch` da página para confirmar o conteúdo atual.

---

## Checklist de Qualidade

- [ ] O PDF tem exatamente 1 (uma) página? (REGRA INVIOLÁVEL)
- [ ] Acentuação e cedilha estão corretas em todo o conteúdo?
- [ ] O PDF foi gerado em alta qualidade e revisado visualmente?
- [ ] O nome do arquivo PDF segue o padrão `Signal_SNN_AAAA.pdf`?
- [ ] O arquivo `signal.md` está preenchido e formatado corretamente?
- [ ] O arquivo `metadata.yml` está completo e válido?
- [ ] A nova edição foi adicionada aos dois arquivos de índice (`README.md` e `index.md`)?
- [ ] A sidebar do VitePress (`config.mts`) foi atualizada?
- [ ] Todos os links funcionam como esperado?
- [ ] Todos os nomes conferem com o Dicionário Oficial?
- [ ] Cada fato e movimentação possui vínculo direto e comprovado com Unimed GV, Hospital Unihealth ou EVS?
- [ ] `python3 scripts/validate-signal-scope.py` foi executado e aprovado?
