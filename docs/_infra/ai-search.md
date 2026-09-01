---
layout: page
title: AI Search — Ponto Neural do Hub CSV
---

<style scoped>
.VPPage { padding: 0 !important; }

.dark .dark .copy-bar-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all .2s ease;
  font-family: inherit;
  line-height: 1.2;
}
.copy-bar-btn:hover { background: #e5e7eb; color: #111827; border-color: #9ca3af; }
.copy-bar-btn.copied { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
.dark .copy-bar-btn { background: #1f2937; color: #d1d5db; border-color: #4b5563; }
.dark .copy-bar-btn:hover { background: #374151; color: #f3f4f6; border-color: #6b7280; }
.dark .copy-bar-btn.copied { background: #064e3b; color: #6ee7b7; border-color: #065f46; }
</style>

<div class="copy-bar">
<button class="copy-bar-btn" id="copy-page-btn">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
Copiar página
</button>
</div>

# AI Search — Ponto Neural do Hub CSV

::: tip Ponto Neural
O Hub CSV agora possui uma API de busca semântica que indexa automaticamente todo o conteúdo do repositório. Qualquer agente, automação ou SaaS pode consultar o arsenal completo do Hub em linguagem natural.

::: warning Escopo desta busca
AI Search indexa conteúdo estático do repositório do Hub. Não é o catálogo privado da [Central de Documentos](/_infra/central-documentos), não substitui seu RBAC/ACL e não deve receber originais do R2 `csv-documents-private`. A busca documental permanece desabilitada no frontend até a promoção separada do Panta v2.
:::
:::

## O que é

O **Cloudflare AI Search** transforma o conteúdo estático do Hub CSV (markdown, HTML, JSON, CSV, PDF) em uma base de conhecimento vetorial consultável via API REST. A cada push no repositório, o conteúdo é sincronizado automaticamente para o bucket R2 e re-indexado.

Não é uma interface de chat. É uma **API robusta** projetada para ser o ponto de conexão entre o Hub e o restante do ecossistema digital: agentes, automações, SaaS e, em especial, o **Extensio**.

## Arquitetura

```
Hub CSV (GitHub) → GitHub Actions → R2 (hub-csv-knowledge) → AI Search (hub-csv) → API REST
                                                                                      ↓
                                                              Extensio / LLMs / Make / Agentes
```

| Componente | Recurso | Detalhes |
|---|---|---|
| Repositório | GitHub `grupocsv/hub` | Fonte primária de todo o conteúdo |
| Armazenamento | R2 `hub-csv-knowledge` | Fonte externa sincronizada; contagens atuais devem ser consultadas em `GET /stats` |
| Instância AI Search | `hub-csv` | O gate de publicação exige zero erro e zero item desatualizado após cada job |
| Embedding | `qwen3-embedding-0.6b` | 2048 tokens por chunk, 10% overlap |
| AI Gateway | `default` | Valor retornado pela API da instância em 1º de setembro de 2026 |
| Índice vetorial | Gerenciado pelo AI Search | 1.024 dimensões, conforme `GET /stats` |

## Endpoints

A API AutoRAG anterior não é mais recomendada pela Cloudflare. Os consumidores novos devem usar a API `ai-search/instances` com mensagens no formato compatível com a API da OpenAI.

### Endpoint 1 — Search

Retorna os trechos mais relevantes, sem geração de texto. É o endpoint preferencial para agentes que fazem a própria síntese.

```http
POST /client/v4/accounts/da0c29123f448f3c3892f784cd9f7cac/ai-search/instances/hub-csv/search
Host: api.cloudflare.com
Authorization: Bearer SEU_AI_SEARCH_TOKEN
Content-Type: application/json
```

**Body:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Qual o mandato da AxiaCare®?"
    }
  ]
}
```

**Resposta:** JSON com os trechos recuperados, scores e metadados dos itens de origem.

### Endpoint 2 — Chat completions

Recupera o contexto e gera uma resposta em uma única chamada.

```http
POST /client/v4/accounts/da0c29123f448f3c3892f784cd9f7cac/ai-search/instances/hub-csv/chat/completions
Host: api.cloudflare.com
Authorization: Bearer SEU_AI_SEARCH_TOKEN
Content-Type: application/json
```

**Body:**

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Responda em Português do Brasil e cite as fontes recuperadas."
    },
    {
      "role": "user",
      "content": "O que é o Signal™?"
    }
  ]
}
```

### Parâmetros principais

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `messages` | array | Mensagens de sistema e usuário em formato compatível com a API da OpenAI |
| `stream` | boolean | Streaming da resposta por SSE no endpoint de chat |
| `ai_search_options` | object | Opções específicas de recuperação quando suportadas pelo endpoint |

## System Prompt Recomendado

Ao usar `chat/completions`, inclua este texto como mensagem de sistema para contextualizar as respostas:

```text
Você é o assistente do Hub CSV, a base de conhecimento pessoal
de Guilherme Thomé, médico executivo e fundador do Grupo CSV.
O Hub contém: mandatos institucionais (AxiaCare, Thera, MedValor, ICDS),
boletins estratégicos (Signal, Compass), dashboards operacionais
(Unimed GV, Unihealth), calculadoras clínicas, identidade visual
e documentação técnica. Responda sempre em português do Brasil,
com precisão e citando as fontes quando disponíveis.
```

## Sincronização Automática

O fluxo de atualização é totalmente automatizado:

```
Push em main → deploy.yml → GitHub Pages → sync-r2-ai-search.yml → R2 → POST /jobs → polling do job → GET /stats
```

O workflow `sync-r2-ai-search.yml` roda automaticamente após cada deploy bem-sucedido. Também pode ser disparado manualmente via `workflow_dispatch`. Depois do `rclone sync`, o workflow cria um job real com `POST /ai-search/instances/hub-csv/jobs`, consulta `GET /jobs/{JOB_ID}` até `ended_at` e, como a finalização dos arquivos pode continuar após o encerramento formal do job, consulta `GET /stats` até `queued=0` e `running=0`. O gate falha diante de `end_reason`, timeout, erro HTTP, `error>0` ou `outdated>0`.

**Arquivos sincronizados:** `.md`, `.html`, `.json`, `.csv`, `.txt`, `.pdf` (até 4 MB cada).

**Excluídos:** `.git/`, `node_modules/`, cache do VitePress, `package-lock.json`.

## Pontos de Conexão

O AI Search foi projetado para ser consumido por múltiplos canais:

| Canal | Como conectar |
|---|---|
| LLMs (Manus, Claude, ChatGPT) | Chamar a API REST diretamente como tool/function |
| Make (automações) | Módulo HTTP com POST para o endpoint |
| Agentes | Function calling apontando para `/ai-search` |
| SaaS diversos | Webhook ou integração HTTP |
| Extensio (segundo cérebro) | Ponto neural dedicado — lê Hub via API |
| MCP (Model Context Protocol) | Endpoint `/mcp` quando disponível |

### Extensio

O Extensio é o segundo cérebro digital que concentra diversos pontos neurais. O AI Search do Hub CSV é um desses pontos. O Extensio já lê e-mails, WhatsApp, Notion e GitHub. Com o AI Search, ele passa a ter acesso semântico a todo o conteúdo do Hub: mandatos, boletins, dashboards, identidade visual e documentação técnica.

## Exemplo de Integração (Python)

```python
import requests

ACCOUNT_ID = "da0c29123f448f3c3892f784cd9f7cac"
TOKEN = "SEU_AI_SEARCH_TOKEN"

def search_hub(query: str) -> dict:
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{ACCOUNT_ID}/ai-search/instances/hub-csv/search"
    )
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    body = {"messages": [{"role": "user", "content": query}]}
    response = requests.post(url, json=body, headers=headers, timeout=30)
    response.raise_for_status()
    return response.json()

resultado = search_hub("Quais são os portais do Hub CSV?")
print(resultado)
```

## Exemplo de Integração (cURL)

```bash
curl --request POST \
  "https://api.cloudflare.com/client/v4/accounts/da0c29123f448f3c3892f784cd9f7cac/ai-search/instances/hub-csv/search" \
  --header "Authorization: Bearer SEU_AI_SEARCH_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{"messages":[{"role":"user","content":"O que é o Signal™?"}]}'
```

## Exemplo de Integração (Make)

Para conectar no Make, use o módulo **HTTP > Make a request**:

- **URL:** `https://api.cloudflare.com/client/v4/accounts/da0c29123f448f3c3892f784cd9f7cac/ai-search/instances/hub-csv/search`
- **Method:** POST
- **Headers:** `Authorization: Bearer SEU_TOKEN` e `Content-Type: application/json`
- **Body type:** Raw (JSON)
- **Body:** `{"messages":[{"role":"user","content":"SUA_PERGUNTA"}]}`

## Infraestrutura e Credenciais

| Recurso | Valor |
|---|---|
| Account ID | `da0c29123f448f3c3892f784cd9f7cac` |
| Instância | `hub-csv` |
| Bucket R2 | `hub-csv-knowledge` |
| AI Gateway | `default` |
| Token API | Armazenado no Arsenal Técnico e em GitHub Secrets |
| Endpoint base | `https://api.cloudflare.com/client/v4/accounts/.../ai-search/instances/hub-csv/` |

## Testes Realizados

| Query | Qualidade | Observação |
|---|---|---|
| Marcos temporais T0, Tp, T1, Td, T2, T3 e T4 no processo de alta | Excelente | Recuperou a edição 008 e o PDF v2 após o job de 1º de setembro de 2026 |
| Fototerapia neonatal, idade gestacional e via de parto | Excelente | Recuperou a edição histórica 003 e seus artefatos atuais |
| Metas quantitativas, ACO e orçamento global | Excelente | Recuperou a edição histórica 001 e seus artefatos atuais |
| Neurodesenvolvimento | Ruim | Termo ambíguo, sem contexto suficiente |

## Ciclo Virtuoso

O design do sistema cria um ciclo de retroalimentação positiva:

1. Quanto mais conteúdo é adicionado ao Hub, mais rica fica a base vetorial.
2. Quanto mais rica a base, mais útil é a API para os agentes e automações.
3. Quanto mais útil a API, maior o incentivo para alimentar o Hub.

O Hub deixa de ser apenas um repositório de páginas e se torna o **núcleo de conhecimento operacional** do Grupo CSV.

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const btn = document.getElementById('copy-page-btn')
  if (!btn) return
  btn.addEventListener('click', () => {
    const content = document.querySelector('.vp-doc') || document.querySelector('.VPPage') || document.querySelector('main')
    if (!content) return

    function htmlToMd(el) {
      let md = ''
      function walk(node) {
        if (node.nodeType === 3) { md += node.textContent; return }
        if (node.nodeType !== 1) return
        const tag = node.tagName.toLowerCase()
        if (node.classList && (node.classList.contains('copy-bar-btn') || node.classList.contains('copy-bar'))) return
        if (['style','script','nav','aside'].includes(tag)) return
        if (tag === 'h1') { md += '\n# '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h2') { md += '\n## '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h3') { md += '\n### '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'h4') { md += '\n#### '; node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'p') { node.childNodes.forEach(walk); md += '\n\n'; return }
        if (tag === 'br') { md += '\n'; return }
        if (tag === 'strong' || tag === 'b') { md += '**'; node.childNodes.forEach(walk); md += '**'; return }
        if (tag === 'em' || tag === 'i') { md += '*'; node.childNodes.forEach(walk); md += '*'; return }
        if (tag === 'code' && node.parentElement.tagName.toLowerCase() !== 'pre') {
          md += '`' + node.textContent + '`'; return
        }
        if (tag === 'pre') { md += '\n```\n' + node.textContent + '\n```\n\n'; return }
        if (tag === 'a') { md += '['; node.childNodes.forEach(walk); md += '](' + (node.href || '') + ')'; return }
        if (tag === 'li') { md += '- '; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'ul' || tag === 'ol') { md += '\n'; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'table') {
          const rows = node.querySelectorAll('tr')
          rows.forEach((row, i) => {
            const cells = row.querySelectorAll('th, td')
            md += '| ' + Array.from(cells).map(c => c.textContent.trim()).join(' | ') + ' |\n'
            if (i === 0) md += '|' + Array.from(cells).map(() => '---').join('|') + '|\n'
          })
          md += '\n'
          return
        }
        if (tag === 'hr') { md += '\n---\n\n'; return }
        if (tag === 'blockquote') { md += '> '; node.childNodes.forEach(walk); md += '\n'; return }
        if (tag === 'img') return
        node.childNodes.forEach(walk)
      }
      walk(el)
      return md.replace(/\n{3,}/g, '\n\n').trim()
    }

    const md = htmlToMd(content)
    navigator.clipboard.writeText(md).then(() => {
      btn.classList.add('copied')
      const origHTML = btn.innerHTML
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!'
      setTimeout(() => {
        btn.classList.remove('copied')
        btn.innerHTML = origHTML
      }, 3000)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = md
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      btn.classList.add('copied')
      const origHTML = btn.innerHTML
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado!'
      setTimeout(() => {
        btn.classList.remove('copied')
        btn.innerHTML = origHTML
      }, 3000)
    })
  })
})
</script>
