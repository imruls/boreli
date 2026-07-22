-- La respuesta de seguridad no puede vivir en user_metadata: Supabase la
-- incluye en el JWT y el cliente puede leerla para cracking offline.
-- Tabla privada (solo service_role) + RPC booleana para la UI autenticada.

create table if not exists public.user_security_answers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  answer_hash text not null,
  updated_at timestamptz not null default now(),
  constraint user_security_answers_hash_bounds check (char_length(answer_hash) between 1 and 500)
);

alter table public.user_security_answers enable row level security;
revoke all on table public.user_security_answers from public, anon, authenticated;
grant select, insert, update, delete on table public.user_security_answers to service_role;

-- Migra hashes legacy desde Auth y los saca del JWT/user_metadata.
insert into public.user_security_answers (user_id, answer_hash, updated_at)
select
  users.id,
  users.raw_user_meta_data ->> 'security_answer_hash',
  now()
from auth.users as users
where coalesce(btrim(users.raw_user_meta_data ->> 'security_answer_hash'), '') <> ''
on conflict (user_id) do nothing;

update auth.users
set raw_user_meta_data = raw_user_meta_data - 'security_answer_hash'
where raw_user_meta_data ? 'security_answer_hash';

-- Lookup de recovery: solo id + hash (sin metadata completa).
-- Hay que DROP primero: Postgres no permite CREATE OR REPLACE si cambia
-- el row type de OUT (la versión anterior devolvía también user_metadata).
drop function if exists public.find_password_recovery_user(text);

create function public.find_password_recovery_user(p_email text)
returns table (
  user_id uuid,
  security_answer_hash text
)
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select
    users.id,
    answers.answer_hash
  from auth.users as users
  left join public.user_security_answers as answers on answers.user_id = users.id
  where lower(users.email) = lower(btrim(p_email))
  limit 1;
$$;

revoke all on function public.find_password_recovery_user(text)
  from public, anon, authenticated;
grant execute on function public.find_password_recovery_user(text)
  to service_role;

-- Solo expone un booleano al usuario autenticado (nunca el hash).
create or replace function public.has_security_answer()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_security_answers
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.has_security_answer()
  from public, anon;
grant execute on function public.has_security_answer()
  to authenticated;
