-- Tighten ud_clients RLS so only members of ud_user_profiles (i.e. users of
-- the UD module) can read / insert as authenticated. Public form-submit still
-- works via the form-submit edge function, which uses service_role and
-- bypasses RLS. Admin policy and (already-removed) anon-insert policy are
-- left as-is.

-- Idempotent guard: ensure the anon-insert vector stays closed even if a
-- future hand-edit recreates it.
drop policy if exists "ud_clients_anon_insert" on public.ud_clients;

create or replace function public.is_ud_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ud_user_profiles
    where id = auth.uid()
  );
$$;

revoke all on function public.is_ud_user() from public;
grant execute on function public.is_ud_user() to authenticated;

drop policy if exists "ud_clients_auth_select" on public.ud_clients;
create policy "ud_clients_auth_select"
  on public.ud_clients
  for select
  to authenticated
  using (public.is_ud_user());

drop policy if exists "ud_clients_auth_insert" on public.ud_clients;
create policy "ud_clients_auth_insert"
  on public.ud_clients
  for insert
  to authenticated
  with check (public.is_ud_user());
