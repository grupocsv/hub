# QA Pré-Release — Marco M9 do Compass™ v2

**Status:** Candidato aprovado para solicitação de autorização; release produtivo não executado.

**Escopo:** Edições 001–008, Hub CSV, `csv-documents`, downloads públicos, Admin e AI Search.

**Hierarquia canônica:** Compass™ — um produto do Grupo CSV | Responsabilidade editorial: MedValor®.

> Nenhum push, merge, deploy, migration remota, upload, link público ou movimento de ponteiro foi executado. RLS e n8n permanecem inalterados.

## 1. Revisões Candidatas

| Repositório | Branch | Revisão Candidata | Estado Remoto |
|---|---|---|---|
| Hub | `feat/compass-v2-transicao` | `b5f2fe20aa871ec24e27dd73e2b3a04d22b8aaa2` | Não enviada e não integrada |
| Backend | `feat/compass-v2-documents` | `db1bfc528cb4e32d540885897ea07dcb39a077b8` | Não enviada e não integrada |
| Baseline Compass™ | Referência imutável | `a1534764db5ad5fe5217a4293092ebc8da199ba8` | Congelada no Marco M0 |

## 2. Método 1 — Revisão Determinística

A revisão determinística cobriu contratos, migrations, autorização, upload, releases, rollback, artefatos, build e segurança.

| Gate | Resultado Verificado |
|---|---|
| Backend — CI completo | Aprovado |
| Backend — Testes Workers | 720 de 720 aprovados, em 135 suítes |
| Backend — Testes Node | 57 de 57 aprovados |
| Backend — Migrations | 21 migrations reconhecidas; migration 0021 validada somente em ambiente local |
| Backend — Segurança | Nenhum padrão sensível detectado |
| Backend — Bundle | Dry-run aprovado; nenhum deploy executado |
| Hub — Suíte Compass™ | 82 de 82 testes aprovados |
| Hub — Integração PDF | 1 de 1 teste aprovado no runtime Chromium isolado |
| Hub — Build VitePress | Aprovado |
| Hub — Smoke | Oito páginas, oito PDFs e catálogo exato 001–008 aprovados |
| Hub — AI Search | Todos os PDFs abaixo dos limites de 4.000.000 bytes do gate de qualidade e 4.194.304 bytes do workflow |
| Hub — Segurança | Nenhum padrão sensível detectado no diff textual |

### 2.1 Contratos Endurecidos no Marco M9

A revisão adversarial do backend encontrou que o contrato inicial de `web_route` aceitava um diretório, enquanto as oito rotas canônicas do Hub terminam em `/compass`. O domínio, a migration local 0021, a OpenAPI e os testes foram alinhados ao caminho real. O formato anterior passou a ser rejeitado explicitamente.

A ingestão dos golden masters recebeu proveniência fechada. `source_type: migration` exige `source_ref` imutável e principal de serviço com `documents:publish`; uploads comuns continuam com `source_type: upload`. Nenhuma credencial de serviço é exposta ao navegador.

Os workflows protegidos do backend passaram a exigir a migration 0021 e a materialização exata de `compass_editions`, `compass_releases` e `compass_release_activations` antes de qualquer promoção. Bindings de produção, gateway, buckets, filas, RLS e dados remotos não foram modificados.

### 2.2 Artefatos e Plano Offline

O gerador `scripts/compass-v2/release-plan.mjs` validou, sem rede, a baseline congelada e os candidatos v2. O plano definitivo foi gerado fora do Git em `/home/ubuntu/work/compass-m9-review/compass-release-plan.json`.

| Propriedade | Resultado Verificado |
|---|---|
| Edições | 8 |
| Versões Documentais | 16 — Uma baseline e um candidato por edição |
| Páginas dos Candidatos | 127 |
| Páginas da Baseline | 94 |
| Bytes dos Candidatos | 5.320.389 |
| Maior PDF Candidato | 1.361.584 bytes |
| Slugs Versionados Distintos | 16 |
| Mutação Remota | `false` |
| Autorização Explícita | Obrigatória |
| n8n Impactado | `false` |
| SHA-256 do Plano | `55664cdab0a6d790e79bc1cb0e712612b803023ccd05a23d50f38e04c7c7229e` |

Os totais de páginas e bytes dos candidatos foram calculados por dois métodos independentes: Redução dos objetos JSON do plano e soma aritmética dos oito manifestos `release.json`. Ambos produziram 127 páginas e 5.320.389 bytes.

### 2.3 Correção do Download da Edição 008

O smoke executado sobre um artefato VitePress limpo identificou que o PDF 008 não era copiado automaticamente, pois a edição paginada não possuía referência de download. A correção foi feita em TDD:

1. a fonte canônica e o importador passaram a gerar a ação “Baixar PDF da edição 008”;
2. a ação é visível na contracapa web, com contraste e espaçamento aprovados;
3. a ação permanece oculta na mídia de impressão;
4. o workflow copia explicitamente os oito PDFs da árvore publicada para o artefato final;
5. o smoke reprova se qualquer página ou PDF 001–008 estiver ausente ou acima de 4 MiB.

O PDF 008 foi rerenderizado e revalidado com 23 páginas, 1.179.294 bytes, paridade completa, zero violações bloqueantes, contraste de 17,96:1 na contracapa e zero pixel de overflow mobile.

## 3. Método 2 — Revisão Visual e Adversarial

O segundo método revisou de forma independente os PDFs, as capturas desktop e as capturas mobile das oito edições. Os laudos cobriram 127 páginas de candidatos. Sete edições foram aprovadas diretamente. A edição 003 recebeu um alerta sobre a navegação “002/2026 — Prostatectomia Robótica”.

A reconciliação manual, por três segmentos finais da captura e pela fonte canônica, comprovou que o elemento é a navegação editorial intencional para a edição anterior, com destino histórico correto e `aria-label="Navegação entre edições"`. Os controles automáticos do VitePress estão desativados por `prev: false` e `next: false`. O alerta foi classificado como falso positivo, não como defeito bloqueante.

Depois da correção do download 008, os dois segmentos finais da nova captura desktop foram inspecionados novamente. Síntese, assinatura, Grupo CSV, AxiaCare® e ação de download estão íntegros e sem sobreposição. O gate completo da edição 008 foi repetido após o rerender.

| Edição | Páginas Revisadas | Resultado Final |
|---|---:|---|
| 001 | 11 | Aprovada |
| 002 | 15 | Aprovada |
| 003 | 18 | Aprovada após reconciliação do falso positivo |
| 004 | 24 | Aprovada |
| 005 | 18 | Aprovada |
| 006 | 6 | Aprovada |
| 007 | 12 | Aprovada |
| 008 | 23 | Aprovada e revalidada após a correção do download |

## 4. Ensaio de Rollback

O ensaio local usa D1 e R2 em memória e simula baseline, candidato e reativação da baseline. O contrato aprovado comprova que:

1. preparar o candidato não altera `active_release_id` nem `documents.current_version_id`;
2. ativar exige `expected_active_release_id` e falha fechado diante de concorrência;
3. o rollback reativa um release `superseded` pelo mesmo endpoint de ativação;
4. o movimento de ponteiro é atômico e auditável;
5. os links versionados baseline e candidato permanecem imutáveis e acessíveis antes e depois do rollback;
6. cada slug continua entregando seus próprios bytes;
7. respostas administrativas e públicas não expõem `object_key` nem caminhos privados do R2.

A migration 0021 é aditiva. O rollback do Worker restaura a versão anterior, que ignora as tabelas novas; não existe down migration destrutiva. O rollback web ocorre por novo commit de reversão na `main`, preservando os mesmos caminhos históricos.

## 5. Condições para Autorizar o Release

O candidato está tecnicamente preparado, mas o Marco M9 permanece em andamento até a validação produtiva. A autorização deve abranger explicitamente:

| Ação Remota | Impacto Esperado |
|---|---|
| Publicar as branches e abrir PRs | Nenhuma mudança produtiva imediata |
| Integrar o backend | Habilita o workflow protegido; não autoriza deploy direto |
| Executar o release protegido do Worker | Aplica a migration 0021 aditiva e publica as rotas Compass™ |
| Ingerir 16 versões documentais | Cria oito documentos, oito baselines e oito candidatos no control plane |
| Criar 16 links versionados | Mantém baseline e candidato acessíveis por slugs imutáveis |
| Ativar oito candidatos | Move ponteiros apenas após validação individual |
| Integrar e publicar o Hub | Publica Admin, catálogo, páginas e PDFs 001–008 |
| Sincronizar o AI Search | Reindexa os artefatos públicos do Hub |

O release deve seguir `runbook-release-rollback.md`. Qualquer divergência de checksum, páginas, catálogo, rota, autorização, ponteiro, download, schema, acessibilidade, mobile ou reindexação interrompe o processo.

## 6. Impactos Excluídos

Não faz parte do release alterar RLS, `csv-gateway`, bindings, buckets, filas, DLQ, cron jobs, domínio, n8n ou `csv-open-pages`. O n8n não participa do caminho crítico do Compass™ e não foi modificado.
