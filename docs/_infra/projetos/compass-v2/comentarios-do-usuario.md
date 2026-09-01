# Comentários do usuário — Compass™ v2

Este arquivo registra observações feitas pelo usuário durante a execução. Os comentários complementam o plano aprovado sem substituir seus objetivos, marcos ou critérios de aceite.

## 2026-08-31

### Segurança e impacto no ecossistema

> Não ativar RLS automaticamente. Isso se aplica a qualquer outra questão que possa impactar no meu ecossistema.

**Aplicação operacional:** nenhuma mudança potencialmente impactante — incluindo RLS, políticas de acesso, migrations em produção, bindings, rotas, Workers, filas, buckets, DNS, autenticação, workflows de produção ou remoção de compatibilidade — será executada sem validação prévia e autorização explícita do usuário. Mudanças reversíveis e isoladas em branch podem ser preparadas e testadas, mas a ativação em produção permanece bloqueada até aprovação.
