# Runbook de Release e Rollback — Compass™ v2

**Status:** preparado e validado localmente; não executado em produção.

**Escopo:** edições 001–008, Hub CSV, `csv-documents`, downloads públicos e AI Search.
**Hierarquia canônica:** Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®.

> Nenhum push, merge, deploy, migration remota, upload, link público ou ativação pode ser executado sem autorização explícita. O n8n não integra o caminho crítico e não deve ser alterado.

## 1. Princípios de Segurança

O release usa duas camadas independentes. O Git preserva a fonte editorial, as páginas e os PDFs estáticos do Hub. O `csv-documents` preserva documentos, versões, checksums, links públicos versionados e o ponteiro do release ativo. A migration `0021_create_compass_catalog.sql` é aditiva; não altera RLS, roles, buckets, bindings, filas nem registros preexistentes.

| Regra | Aplicação |
|---|---|
| Autorização | Obter autorização explícita antes da primeira mudança remota. |
| Fonte única | Usar apenas a revisão integrada à `main` como `source_revision`. |
| Idempotência | Usar uma `Idempotency-Key` única e estável por operação. |
| Menor privilégio | A ingestão da baseline como `source_type: migration` exige principal de serviço com `documents:publish`. |
| Segredos | Nunca registrar tokens, cookies, chaves, headers de autenticação ou URLs de upload em Git, e-mail ou logs de evidência. |
| Falha fechada | Interromper o release diante de divergência de checksum, tamanho, páginas, catálogo, rota, ponteiro esperado ou autorização. |
| Imutabilidade | Não alterar slugs nem versões existentes; qualquer correção gera nova versão. |

## 2. Artefatos e Fontes Primárias

| Artefato | Fonte |
|---|---|
| Fonte editorial v2 | `compass/edicoes/2026/<nnn>/` |
| Publicação derivada | `docs/compass/edicoes/2026/<nnn>/` |
| Catálogo | `docs/compass/catalog.json` |
| Manifesto PDF | `compass/edicoes/2026/<nnn>/release.json` |
| Baseline congelada | `~/workspace/compass-v2-baseline/2026-08-31/` na VPS-CSV |
| Plano offline | `scripts/compass-v2/release-plan.mjs` |
| Contrato HTTP | `workers/csv-documents/openapi/document-api.json` |
| Migration | `workers/csv-documents/migrations/0021_create_compass_catalog.sql` |
| Workflow do Worker | `.github/workflows/csv-documents-worker-release.yml` no backend |
| Workflow do Hub | `.github/workflows/deploy.yml` no Hub |
| Sincronização semântica | `.github/workflows/sync-r2-ai-search.yml` no Hub |

## 3. Preparação Local Obrigatória

### 3.1 Backend

Na revisão candidata do repositório `grupocsv/backend`:

```bash
cd workers/csv-documents
npm ci --no-fund
npm run ci
```

O gate deve aprovar typecheck, lint, formatação, migrations, testes Workers/Node, varredura sensível e bundle seco. O workflow de release deve exigir a migration `0021_create_compass_catalog.sql` e comprovar a materialização exata de `compass_editions`, `compass_releases` e `compass_release_activations`.

### 3.2 Hub

Na revisão candidata do repositório `grupocsv/hub`:

```bash
npm ci
npm run compass:test
npm run compass:test:pdf
npm run docs:build
```

O build deve permanecer sem deriva em `docs/compass`. O smoke do workflow deve encontrar as páginas e os PDFs 001–008, validar que o catálogo contém exatamente as oito edições e bloquear qualquer PDF acima de 4.194.304 bytes.

### 3.3 Plano Offline

Após o build, gerar o plano sem permitir mutações remotas:

```bash
npm run compass:release-plan -- \
  --repo-root "$PWD" \
  --baseline-root "$HOME/workspace/compass-v2-baseline/2026-08-31" \
  --source-commit "<SHA_COMPLETO_DA_MAIN_DO_HUB>" \
  --baseline-commit "a1534764db5ad5fe5217a4293092ebc8da199ba8" \
  --output "/diretorio-seguro/compass-release-plan.json"
```

O plano deve conter oito edições, `remoteMutationAllowed: false`, `requiresExplicitAuthorization: true` e `n8nImpacted: false`. Para cada edição, deve verificar a baseline congelada e o candidato v2 por SHA-256, tamanho, contagem de páginas, rota canônica e limite de 4 MB.

## 4. Checkpoint de Autorização

Antes da primeira mudança remota, apresentar para autorização:

| Item | Evidência necessária |
|---|---|
| Commits | SHAs completos das revisões candidatas do Hub e backend. |
| Pull requests | URLs, escopo e gates aprovados. |
| Backend | Resultado integral de `npm run ci`. |
| Hub | Resultado de testes, integração PDF, build e smoke 001–008. |
| Release | Hash do plano offline e resumo das 16 versões documentais. |
| Rollback | Resultado do ensaio local de reativação da baseline com links estáveis. |
| Impacto | Confirmação de que RLS e n8n não serão alterados. |

Sem autorização explícita, o processo termina neste ponto.

## 5. Release do Backend

### 5.1 Integrar a revisão

Integrar o PR do backend em `main` e registrar o SHA completo. Não executar `wrangler deploy` diretamente.

### 5.2 Executar a cadeia protegida

O workflow `csv-documents-worker-release.yml` aceita somente `workflow_dispatch` na `main`. Ele exige:

| Entrada | Valor |
|---|---|
| `source_revision` | SHA completo já integrado à `main` do backend. |
| `auth_release_run_id` | Run aprovado do `csv-auth-release.yml` na mesma revisão. |

O workflow executa os gates, aplica migrations aditivas, comprova chaves estrangeiras e schema, envia a versão sem tráfego, faz smoke versionado e promove. Se o smoke falhar após a promoção, o próprio workflow tenta restaurar a versão anterior do Worker.

### 5.3 Verificações após o Worker

Confirmar por fontes primárias:

1. health e release do `csv-documents` correspondem à revisão aprovada;
2. a OpenAPI publicada contém as operações `/v1/compass/*` e a proveniência `migration` da sessão de upload;
3. a migration 0021 aparece como aplicada;
4. as três tabelas Compass™ existem;
5. nenhum registro Compass™ foi criado antes da fase de ingestão;
6. o link público `/s/{slug}` continua atendendo `GET`, `HEAD`, Range e `Content-Disposition` conforme o contrato existente.

## 6. Ingestão Bifásica das Oito Edições

Executar uma edição por vez, na ordem 001→008. Os payloads devem ser montados exclusivamente a partir do plano offline. IDs retornados pela API devem ser preservados em evidência segura, sem chaves privadas do R2.

### 6.1 Criar o documento PDF

Usar `POST /v1/documents` com `Idempotency-Key` e o `document_id` determinístico do plano, por exemplo `compass-pdf-2026-001`. O documento deve usar classificação `public` e política de indexação `metadata_only`.

### 6.2 Ingerir o golden master

Criar uma sessão por `POST /v1/documents/{documentId}/upload-sessions` com:

- nome, tipo `application/pdf`, tamanho e SHA-256 da baseline;
- `source_type: migration`;
- `source_ref` imutável gerado pelo plano.

Essa operação é exclusiva de serviço publicador. Enviar os bytes pelo endpoint retornado, concluir a sessão e aguardar a versão ficar `uploaded`, `clean` e elegível. Criar o link público versionado da baseline por `POST /v1/documents/{documentId}/public-links`, com o slug do plano e `allow_download: true`.

### 6.3 Registrar a edição

Usar `POST /v1/compass/editions` com `edition_id`, número, ano, slug público estável, rota web canônica terminada em `/compass` e `pdf_document_id`. Sessões humanas também exigem `Origin` autorizado; o procedimento automatizado deve usar o principal de serviço publicador.

### 6.4 Preparar e ativar a baseline

Usar `POST /v1/compass/editions/{editionId}/releases` com o ID da versão baseline e os hashes, versões, commit e páginas do plano. A preparação não pode alterar `active_release_id` nem `documents.current_version_id`.

Ativar a baseline por `POST /v1/compass/editions/{editionId}/releases/{releaseId}/activate` com `expected_active_release_id: null`.

### 6.5 Ingerir e preparar o candidato v2

Repetir o upload do PDF v2 com `source_type: upload`, SHA-256, tamanho e nome do manifesto. Criar seu link público versionado, preparar o release candidato e confirmar novamente que a preparação não moveu o ponteiro ativo.

### 6.6 Ativar o candidato v2

Antes da ativação, validar:

| Verificação | Resultado exigido |
|---|---|
| Web | Rota canônica responde e contém a edição correta. |
| PDF estático | SHA-256, bytes e páginas coincidem com `release.json`. |
| Link baseline | Continua acessível pelo slug versionado original. |
| Link candidato | Acessível, com `allow_download: true`, sem expor `object_key`. |
| Catálogo | Exatamente oito edições, sem duplicações. |
| Admin | Edição, status, versão, checksum e download coerentes. |

Ativar o candidato com `expected_active_release_id` igual ao release baseline. Se houver conflito, interromper; não repetir com ponteiro presumido.

## 7. Release do Hub

Integrar o PR do Hub em `main`. O `deploy.yml` será executado no push e deve aprovar o build antes de publicar no GitHub Pages. Após o deploy, o workflow `sync-r2-ai-search.yml` sincroniza conteúdo estático, incluindo PDFs de até 4 MB, para o bucket de conhecimento. Em seguida, cria um job real com `POST /ai-search/instances/hub-csv/jobs`, consulta `GET /jobs/{JOB_ID}` até `ended_at` e exige estatísticas finais sem itens em fila, execução, erro ou estado desatualizado.

O release do Hub deve ocorrer somente depois que o backend estiver saudável e os candidatos estiverem preparados. A ativação dos candidatos pode ocorrer imediatamente antes ou depois do deploy do Hub, desde que as verificações cruzadas sejam concluídas e o intervalo seja tratado como janela controlada.

## 8. Validação Pós-Deploy

### 8.1 Web e Catálogo

Validar por dois métodos: requisição HTTP sem cache e navegador real.

1. Central Compass™;
2. catálogo JSON com 001–008;
3. oito rotas web históricas terminadas em `/compass`;
4. oito PDFs nos caminhos históricos `compass_<nnn>_2026.pdf`;
5. Admin Compass™ autenticado;
6. hierarquia de marcas em web e PDF;
7. ausência de overflow em mobile.

### 8.2 Backend e Downloads

Para cada edição:

1. consultar detalhe e releases;
2. confirmar um único release ativo;
3. comparar SHA-256, tamanho e páginas;
4. testar `HEAD` e download completo do link baseline e do candidato;
5. testar Range em pelo menos uma edição;
6. confirmar `Content-Disposition: attachment` quando `allow_download: true`;
7. confirmar ausência de `object_key`, caminhos privados e credenciais nas respostas.

### 8.3 AI Search

Aguardar a conclusão do workflow de sincronização, confirmar pela API oficial que o job terminou sem `end_reason` e validar `GET /stats` com `queued=0`, `running=0`, `error=0` e `outdated=0`. Depois, validar busca por termos distintos de ao menos três edições, incluindo 008 e uma edição histórica. A resposta deve recuperar arquivos Compass™ atuais. Se o job ou a recuperação falhar, não remover o conteúdo anterior; registrar o incidente e executar o rollback do Hub conforme a seção seguinte.

## 9. Rollback

### 9.1 Release editorial e downloads

Para cada edição afetada, reativar o release baseline pelo mesmo endpoint de ativação, informando `expected_active_release_id` igual ao candidato atual. O rollback altera somente os ponteiros `active_release_id` e `documents.current_version_id`.

Os dois slugs versionados continuam imutáveis e acessíveis. Não revogar, renomear nem recriar links durante o rollback. O teste local do backend deve comprovar que, após a reativação, o link baseline ainda entrega os bytes originais e o link candidato continua entregando seus próprios bytes.

### 9.2 Hub

Reverter o commit do release por novo commit em `main` e executar novamente o workflow protegido do Hub. O rollback restaura o conteúdo anterior nos mesmos caminhos; não cria URLs alternativas nem apaga os artefatos v2 do histórico Git.

### 9.3 Worker

Se o workflow do Worker falhar durante o smoke, usar primeiro o rollback automático já incorporado. Se a falha ocorrer após a conclusão do workflow, promover a versão anterior registrada na evidência do release. A migration 0021 permanece aplicada porque é aditiva; a versão anterior do Worker ignora as tabelas novas. Não executar down migration destrutiva.

### 9.4 AI Search

Após o rollback do Hub, aguardar ou disparar manualmente `sync-r2-ai-search.yml` na `main` restaurada. Revalidar as consultas e registrar a revisão reindexada.

## 10. Condições de Interrupção

Interromper imediatamente diante de qualquer uma destas condições:

- checksum, tamanho ou páginas divergentes;
- catálogo diferente de 001–008;
- link histórico ou versionado indisponível;
- ponteiro ativo diferente do valor esperado;
- falha de autenticação, autorização, Origin ou idempotência;
- vazamento de chave R2, token ou caminho privado;
- PDF acima de 4 MB;
- erro de migration, chave estrangeira ou materialização de schema;
- regressão visual bloqueante, acessibilidade bloqueante ou overflow mobile;
- falha do deploy do Hub, do Worker ou da reindexação sem rollback comprovado.

## 11. Evidências de Encerramento

Arquivar, sem segredos:

| Evidência | Conteúdo |
|---|---|
| Plano offline | Hash, revisão-fonte, baseline e resumo das 16 versões. |
| Backend | Run do workflow, migration aplicada, versão anterior/nova e smoke. |
| Hub | Run de build/deploy e SHA publicado. |
| Compass™ | Catálogo, checksums, páginas e links das oito edições. |
| Rollback | Ponteiros antes/depois e prova de estabilidade dos slugs. |
| AI Search | Run de sincronização e consultas de verificação. |
| Segurança | Varredura de segredos, ausência de RLS alterado e n8n não impactado. |

Somente após todas as evidências pós-deploy o Marco M9 pode ser concluído.
