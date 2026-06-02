-- 1. Remove a política recursiva que causava "infinite recursion"
drop policy if exists "household profiles read" on profiles;

-- 2. Cria função auxiliar com security definer (executa sem RLS, quebra o loop)
create or replace function get_my_household_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select household_id from profiles where id = auth.uid()
$$;

-- 3. Recria a política de leitura de perfis do mesmo lar — sem recursão
create policy "household profiles read" on profiles
  for select
  using (
    id = auth.uid()
    OR household_id = get_my_household_id()
  );
