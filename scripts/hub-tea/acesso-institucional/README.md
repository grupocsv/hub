# Hub TEA público: prévia e proteção da antiga prancha

Esta entrega preserva a página inicial pública, substitui a prancha integral por uma peça editorial com a marca Caminhos Brilhantes e mantém a mesma navegação para Jornada, Painel e Relatório. O HTML deriva do objeto R2 ativo, conferido contra o HTML servido; scripts de acesso do Relatório permanecem byte a byte.

O Worker é a versão ativa `6cd3fe16-8976-4ae9-8ff1-e0ffce368637`, capturada em 21/09/2026, com uma extensão mínima. Somente `/tea/peca-jornada.webp` e suas variantes normalizadas passam a responder 302 sem cache para o PNG da Jornada protegida em Open Pages. Não há outro formulário, token em URL ou novo provedor de identidade. O restante é delegado ao módulo original sem edição.

## Acervo e limites

O snapshot autenticado está fora do Git, sob `%LOCALAPPDATA%/GrupoCSV/PortaisArquivo/clavs-2026-09-21/hub-unimedgv`. Contém o código original, settings sem segredos, deploy ativo, inventário R2, metadata KV e todos os objetos de `tea/`. As cópias públicas também foram conferidas contra o inventário; o HTML foi normalizado apenas para remover a injeção conhecida do Worker e o beacon de analytics.

O inventário atual tem uma única prancha integral: `tea/peca-jornada.webp`. OG e imagem de e-mail foram inspecionados e não contêm o mapa. A publicação não apaga nem sobrescreve a prancha original; seu acesso público fica desviado para a origem protegida. Arquivos previamente baixados/caches de navegador já existentes não podem ser recolhidos remotamente.

## Construção e testes

```powershell
python scripts/hub-tea/acesso-institucional/build.py --snapshot CAMINHO_PRIVADO --output PACOTE
node --test scripts/hub-tea/acesso-institucional/worker.test.mjs
python -m unittest discover -s scripts/hub-tea/acesso-institucional -p test_release.py
node scripts/hub-tea/acesso-institucional/verify-browser.mjs PACOTE EVIDENCIAS
```

O render reutiliza Playwright instalado, apontado por `JORNADA_RUNTIME_PACKAGE`. A suíte de navegador testa 320, 390, 768 e 1440 pixels, ausência de solicitação da prancha, imagens carregadas, ausência de overflow, destino original do Painel e abertura/fechamento do modal do Relatório. Não envia credenciais ou solicita downloads de relatório real. Os testes do Worker conferem aliases de caminho, GET/HEAD, host alternativo, preservação do código original e delegação das demais rotas.

## Publicação controlada

Não executar `api/upload`: ele substitui o conjunto inteiro da slug. O publicador desta entrega permite apenas o Worker `hub-unimedgv`, o objeto `tea/index.html` e purge pontual da zona `unimedgv.com` resolvida na mesma conta.

1. Ativar a proteção institucional em Open Pages e confirmar 401/no-store na imagem de destino, além do canário institucional autenticado da frente responsável.
2. Conferir `approved-output.json` contra o pacote revisado. O nome indica aprovação técnica dos bytes, não autorização externa adicional.
3. Executar `release.py preflight --package PACOTE --snapshot SNAPSHOT --state ESTADO_PRIVADO`. A credencial é lida por entrada protegida, somente em memória. Pré-requisitos incluem worker/settings/origem intactos e ausência de domínio R2 público.
4. Executar `publish-worker`, depois `publish-page`, com os mesmos argumentos. O Worker passa a proteger a prancha antes da troca da prévia.
5. Executar `purge`, que invalida apenas as URLs canônicas da página e da antiga imagem (incluindo barra final), sem purge geral da zona.
6. Executar `verify`: módulo publicado, settings, bloqueio/redirect anônimo, bytes do HTML servido e do R2, demais objetos e metadata preservados.
7. Conferir visualmente o endereço público, acesso autenticado à Jornada e continuidade do Painel e do Relatório.

Em falha ou resultado incerto, examinar `events.jsonl` e executar `verify-worker`/`verify` antes de repetir qualquer escrita. O script não repete mutações automaticamente. Reverter o HTML exige comparar o estado atual e preservar o bloqueio do recurso antigo; restaurar o Worker antigo isoladamente reabriria a prancha e não é uma reversão segura. O snapshot original permite reconstrução sem perda de material, mas a proteção deve permanecer ativa durante qualquer correção.
