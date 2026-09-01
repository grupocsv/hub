# Compass™ — Publicações Estratégicas

<style>
.copy-bar {
  position: fixed;
  top: 72px;
  right: 24px;
  z-index: 20;
}
.copy-bar-btn {
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
      // Fallback para contextos sem clipboard API
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


## Visão Geral

O Compass™ é a linha editorial estratégica do Grupo CSV para análises técnico-estratégicas em saúde. A fórmula institucional canônica é **“Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®”**. AxiaCare® permanece visível como responsável pela elaboração e pela aplicação prática nas consultorias e assessorias, conforme o contexto de cada edição.

| Campo | Estado Verificado na Transição Local |
|---|---|
| URL Pública | [hub.grupocsv.com/compass/](https://hub.grupocsv.com/compass/) |
| Fonte Canônica | `compass/edicoes/<ano>/<número>/` no repositório `grupocsv/hub` |
| Publicação Web | VitePress, derivada automaticamente em `docs/compass/` |
| PDF | A4 determinístico por Playwright/Chromium em runtime Docker isolado |
| Catálogo | `docs/compass/catalog.json`, derivado dos metadados de cada edição |
| Edição Nativa v2 | 008/2026, integrada e validada localmente na branch de transição |
| Edições Migradas | 001–007, migradas e validadas localmente nos marcos M6–M8 |
| Acervo no Motor v2 | 001–008, com release controlado ainda pendente |
| Backend | Extensão do `csv-documents` implementada e testada localmente; migration e deploy ainda não aplicados |
| n8n | Fora do caminho crítico; nenhuma alteração realizada |

## Fonte Única e Artefatos Derivados

A fonte editorial de uma edição v2 fica em `compass/edicoes/<ano>/<número>/`. O arquivo `metadata.yml` identifica a edição, as marcas, o status e os artefatos. O conteúdo semântico fica em `compass.md` ou em componente Vue namespaceado quando o layout editorial exige estrutura paginada completa. PDF e `release.json` integram a mesma árvore versionada.

O comando `npm run compass:publish` sincroniza apenas edições com schema v2 para `docs/compass/`. Em seguida, `npm run compass:catalog` deriva o catálogo público. A sidebar é construída a partir desse catálogo; não existe uma segunda lista manual de edições.

| Artefato | Origem | Função |
|---|---|---|
| `metadata.yml` | Fonte Git | Contrato editorial e identidade imutável da edição |
| `compass.md` ou componente Vue | Fonte Git | Conteúdo semântico e apresentação web |
| `compass_<número>_<ano>.pdf` | Render determinístico | Download A4 da edição |
| `release.json` | Gate de release | Checksums, versões do motor e procedência |
| `docs/compass/catalog.json` | Derivado | Navegação, Admin e integração do Hub |

## Motor Web e PDF

O componente global `CompassEdition.vue` aplica a moldura editorial comum. A edição 008 usa o modo `paged`, com CSS global namespaceado, para preservar integralmente as 23 páginas editoriais sem duplicar capa ou contracapa. O modo de leitura web permanece responsivo; as regras A4 são ativadas somente na mídia de impressão.

O PDF é renderizado por `scripts/compass-v2/render-pdf.mjs`. O wrapper `pdf-runtime.sh` executa Chromium em container efêmero fixado por digest, sem instalar bibliotecas no host. Os gates verificam conteúdo obrigatório, paridade web/PDF, PDF.js, acessibilidade, contraste, screenshots, quantidade de páginas, tamanho máximo, checksums, overflow documental e distribuição legível das colunas de referências no mobile.

| Comando | Resultado |
|---|---|
| `npm run compass:publish` | Publica a árvore derivada das fontes v2 |
| `npm run compass:catalog` | Regenera o catálogo determinístico |
| `npm run compass:test` | Executa contratos de schema, catálogo, Admin, runtime e tema |
| `npm run compass:test:pdf` | Executa a integração PDF no runtime isolado |
| `npm run compass:release-plan` | Valida baseline, candidatos e rollback e gera um plano offline sem mutações remotas |
| `npm run docs:build` | Publica fontes, atualiza catálogo e compila o Hub |

## Backend e Downloads

O Compass™ estende o Worker documental existente; não cria Worker paralelo. A migration aditiva `0021_create_compass_catalog.sql` introduz as tabelas tenant-first `compass_editions`, `compass_releases` e `compass_release_activations`. Uma edição referencia um documento PDF de `documents`; cada release referencia uma versão imutável de `document_versions`. Os bytes continuam no R2 privado do `csv-documents`, sem duplicação.

A publicação é bifásica. A preparação valida a versão PDF e registra checksums sem mover ponteiros. A ativação atualiza atomicamente `compass_editions.active_release_id` e `documents.current_version_id`, com precondição otimista, idempotência, auditoria, outbox e histórico append-only. O rollback reativa um release anterior pelo mesmo mecanismo.

Os downloads reutilizam `document_public_links` e `GET/HEAD /s/{slug}`. Range, revogação, rate limit, `no-store`, `noindex` e `Content-Disposition` continuam sob o contrato documental. A API Compass™ não retorna `object_key`, token de storage ou credencial de serviço.

> Estado operacional: A migration 0021 não foi aplicada e o Worker não foi publicado. A implementação permanece somente em branches locais até autorização explícita, plano de rollback e execução do workflow protegido.

## Admin do Hub

A aba **Compass™** do Admin lista edições, status, release ativo, versões, checksums e links públicos. O navegador usa somente a sessão humana existente em `csv-auth` para consultar `/v1/compass/*`. Respostas 401, 403, 503 e falhas de rede possuem estados distintos; uma negativa de permissão não encerra uma sessão válida.

As mutações de publicação permanecem indisponíveis no Admin enquanto migration e Worker não estiverem ativos em produção. Nenhuma chave de serviço é enviada ao navegador.

## Compatibilidade e Migração Histórica

As edições 001–007 foram migradas e validadas localmente nos marcos M6–M8; a edição 008 é nativa v2. Cada marco preservou o conteúdo, a URL histórica e o PDF original na proveniência, além de produzir metadados e checksums no contrato v2. A numeração cruzada dos PDFs históricos 005/006 foi detectada a partir dos próprios artefatos, registrada em `migration.numberingCorrection` e corrigida nos PDFs v2 sem alterar os slugs públicos. Os assets históricos da edição 003 também foram incorporados à fonte canônica e permanecem acessíveis na experiência web.

O motor v2 é o caminho ativo para as edições 001–008. O gerador FPDF v1 permanece congelado apenas para reprodutibilidade histórica e rollback documental; não gera nem atualiza releases v2.

## CI, AI Search e Sistemas Relacionados

O workflow de deploy executa os testes Compass™ antes do VitePress, rejeita deriva entre a fonte e `docs/compass/` e verifica a presença das páginas e PDFs 001–008, o catálogo exato, o limite de 4 MB e a aba do Admin no artefato final. O workflow `sync-r2-ai-search.yml` inclui arquivos PDF e aplica o mesmo limite; o smoke do Hub impede que um arquivo acima do teto seja silenciosamente omitido da indexação.

Open Pages permanece dedicado à publicação de HTML e assets independentes. O `csv-gateway` não é necessário para o primeiro release porque o `csv-documents` possui domínio próprio e autenticação existente. A Queue e a DLQ documentais não recebem jobs Compass™ no M5, pois não existe etapa assíncrona necessária. O n8n não integra o caminho crítico e não foi alterado.

## Segurança e Operação

Nenhuma migration, binding, bucket, Queue, rota de gateway, RLS ou dado produtivo deve ser alterado sem autorização explícita. O release do Worker ocorre somente pelo workflow manual e protegido do repositório backend; `wrangler deploy` direto é proibido. O release do Hub ocorre pelo workflow do repositório após revisão dupla e preservação dos caminhos públicos.

## Referências Técnicas

| Documento | Escopo |
|---|---|
| [Central Compass™](/compass/) | Índice público derivado do catálogo e acesso às edições |
| [`docs/_infra/projetos/compass-v2/prd.md`](../projetos/compass-v2/prd.md) | Critérios e marcos M0–M10 |
| [`docs/_infra/projetos/compass-v2/baseline.md`](../projetos/compass-v2/baseline.md) | URLs, hashes e renders históricos congelados |
| [`docs/_infra/projetos/compass-v2/runbook-release-rollback.md`](../projetos/compass-v2/runbook-release-rollback.md) | Autorização, release bifásico, validação pós-deploy e rollback |
| [`docs/_infra/central-documentos.md`](../central-documentos.md) | Control plane documental e links públicos |
| `grupocsv/backend/workers/csv-documents/README.md` | API, schema, release e limites operacionais do Worker |
