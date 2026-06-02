-- Remove a política genérica que bloqueava o INSERT
drop policy if exists "household members" on households;

-- Qualquer usuário autenticado pode criar um household
create policy "create household" on households
  for insert
  to authenticated
  with check (true);

-- Só pode ver/editar/deletar se já for membro
create policy "read own household" on households
  for select
  using (id in (select household_id from profiles where id = auth.uid()));

create policy "update own household" on households
  for update
  using (id in (select household_id from profiles where id = auth.uid()));

create policy "delete own household" on households
  for delete
  using (id in (select household_id from profiles where id = auth.uid()));

-- Garantir que o perfil pode ser criado no onboarding (upsert)
drop policy if exists "own profile" on profiles;

create policy "own profile" on profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());
