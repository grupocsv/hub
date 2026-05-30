# GSD Plan — Hub CSV: Senhas + Menus Dinâmicos

## Frente 1: Sistema de Senha para Usuários Parceiros

### Tarefa 1.1: Criar tabela password_reset_tokens no D1
- Campos: token (PK), user_email, expires_at, used (boolean), created_at
- Migração via Cloudflare MCP (D1 execute)

### Tarefa 1.2: Novos endpoints no Worker csv-auth
- POST /admin/reset-user-password — Admin define senha para um usuário
  - Body: { email, new_password? }
  - Se new_password fornecida: atualiza direto + envia e-mail com senha
  - Se não: gera token + envia e-mail com link para definir
- POST /set-password — Usuário define senha via token
  - Body: { token, password }
  - Valida token (não expirado, não usado) → atualiza user.password
- POST /forgot-password — Solicita reset de senha
  - Body: { email }
  - Gera token + envia e-mail com link

### Tarefa 1.3: Atualizar handleApprove
- Sempre gerar token de definição de senha ao aprovar
- E-mail de aprovação inclui link para definir senha (não mais só "Acessar Hub")

### Tarefa 1.4: Painel Admin — Botão "Redefinir Senha"
- Na tabela de usuários, adicionar botão "Redefinir"
- Modal: opção de definir senha manualmente OU enviar link de reset

### Tarefa 1.5: hub-auth.js — Tela de definição de senha
- Detectar parâmetro ?set-password=TOKEN na URL
- Mostrar tela de definição de senha (nova senha + confirmar)
- POST /set-password com token + nova senha

### Tarefa 1.6: hub-auth.js — "Esqueci minha senha"
- Link abaixo do botão Login
- Tela: digitar e-mail → POST /forgot-password → mensagem de sucesso

## Frente 2: Menus Dinâmicos na Página Principal

### Tarefa 2.1: Reescrever blocos partner-tools no index.md
- Substituir HTML hardcoded por containers vazios com IDs
- No script setup, fetch tools.json de cada portal
- Renderizar dinamicamente na ordem do JSON (mais recente primeiro)

### Tarefa 2.2: Remover max-height fixo
- Substituir max-height: 600px por max-height adequado (ou usar JS para calcular)

## Frente 3: Correção Mobile Landing Pages

### Tarefa 3.1: Verificar e corrigir CSS mobile
- Garantir que grid-template-columns: 1fr em mobile
- Verificar se não há overflow:hidden cortando cards
- Testar com viewport mobile no browser

## Ordem de Execução
1. Frente 1 (Tarefas 1.1 → 1.6) — Worker + Admin + hub-auth.js
2. Frente 2 (Tarefa 2.1 → 2.2) — index.md
3. Frente 3 (Tarefa 3.1) — landing pages
4. Deploy Worker csv-auth (wrangler deploy)
5. Deploy Hub (git push → GitHub Actions)
6. Testes
