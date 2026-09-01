# Comentários do usuário — Compass™ v2

Este arquivo registra observações feitas pelo usuário durante a execução. Os comentários complementam o plano aprovado sem substituir seus objetivos, marcos ou critérios de aceite.

## 2026-08-31

### Segurança e impacto no ecossistema

> Não ativar RLS automaticamente. Isso se aplica a qualquer outra questão que possa impactar no meu ecossistema.

**Aplicação operacional:** nenhuma mudança potencialmente impactante — incluindo RLS, políticas de acesso, migrations em produção, bindings, rotas, Workers, filas, buckets, DNS, autenticação, workflows de produção ou remoção de compatibilidade — será executada sem validação prévia e autorização explícita do usuário. Mudanças reversíveis e isoladas em branch podem ser preparadas e testadas, mas a ativação em produção permanece bloqueada até aprovação.

## 2026-09-01

### Skills operacionais após a estabilização

> Adicionar na lista que a skill `/hub-csv` deverá ser atualizada. Mas, considerando a robustez da v2, criar em separado uma nova skill chamada `compass` usando `/skill-creator`.

**Aplicação operacional:** a atualização da skill `hub-csv` e a criação da skill separada `compass` ocorrerão somente após a conclusão dos gates de produção do Marco M9, sem interromper o release. As skills serão validadas formalmente e não conterão tokens, credenciais ou identificadores privados.
