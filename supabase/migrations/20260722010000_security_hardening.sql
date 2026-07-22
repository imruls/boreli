-- Endurecimiento del catálogo compartido y de los flujos públicos que usan
-- Service Role. Idempotente: seguro para re-aplicar o para un remoto que
-- ya tenga parte del SQL de data-model.md. Los constraints se agregan
-- NOT VALID para no bloquear el deploy si el catálogo remoto ya contiene
-- datos legacy; igualmente se aplican a toda fila nueva o modificada.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'books_title_bounds' and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_title_bounds
        check (char_length(btrim(title)) between 1 and 500) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'books_google_id_bounds' and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_google_id_bounds
        check (google_books_id is null or char_length(google_books_id) <= 200) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'books_authors_bounds' and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_authors_bounds
        check (authors is null or cardinality(authors) <= 20) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'books_cover_url_bounds' and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_cover_url_bounds
        check (
          cover_url is null
          or (
            char_length(cover_url) <= 2048
            and cover_url ~* '^https?://'
          )
        ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'books_page_count_bounds' and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_page_count_bounds
        check (page_count is null or page_count between 1 and 100000) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'books_description_bounds' and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_description_bounds
        check (description is null or char_length(description) <= 50000) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'books_published_date_bounds' and conrelid = 'public.books'::regclass
  ) then
    alter table public.books
      add constraint books_published_date_bounds
        check (published_date is null or char_length(published_date) <= 50) not valid;
  end if;
end
$$;

-- No contiene PII: las keys se hashean en el servidor antes de persistirse.
create table if not exists public.security_rate_limits (
  key text primary key,
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  constraint security_rate_limits_key_bounds check (char_length(key) between 1 and 200)
);

alter table public.security_rate_limits enable row level security;
revoke all on table public.security_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.security_rate_limits to service_role;

create index if not exists security_rate_limits_updated_at_idx
  on public.security_rate_limits (updated_at);

-- Consume un intento de forma atómica. El advisory lock serializa requests
-- concurrentes para la misma key sin bloquear otras cuentas/IPs.
create or replace function public.consume_security_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_row public.security_rate_limits%rowtype;
  as_of timestamptz := clock_timestamp();
begin
  if p_key is null
    or char_length(p_key) not between 1 and 200
    or p_max_attempts not between 1 and 1000
    or p_window_seconds not between 1 and 86400
    or p_block_seconds not between 1 and 604800
  then
    raise exception 'Invalid rate limit parameters';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

  select *
    into current_row
    from public.security_rate_limits
    where key = p_key
    for update;

  if not found then
    insert into public.security_rate_limits (
      key,
      attempts,
      window_started_at,
      blocked_until,
      updated_at
    )
    values (p_key, 1, as_of, null, as_of);
    return true;
  end if;

  if current_row.blocked_until is not null
    and current_row.blocked_until > as_of
  then
    update public.security_rate_limits
      set updated_at = as_of
      where key = p_key;
    return false;
  end if;

  if current_row.window_started_at
    <= as_of - make_interval(secs => p_window_seconds)
  then
    update public.security_rate_limits
      set attempts = 1,
          window_started_at = as_of,
          blocked_until = null,
          updated_at = as_of
      where key = p_key;
    return true;
  end if;

  if current_row.attempts >= p_max_attempts then
    update public.security_rate_limits
      set blocked_until = as_of + make_interval(secs => p_block_seconds),
          updated_at = as_of
      where key = p_key;
    return false;
  end if;

  update public.security_rate_limits
    set attempts = attempts + 1,
        blocked_until = null,
        updated_at = as_of
    where key = p_key;

  return true;
end;
$$;

revoke all on function public.consume_security_rate_limit(text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, integer, integer, integer)
  to service_role;

-- Evita auth.admin.listUsers(): la función solo expone el id y el hash
-- estrictamente necesarios, y solo puede invocarse con Service Role.
-- `user_metadata` se incluye para poder migrar hashes legacy sin un segundo
-- round-trip a Auth Admin.
create or replace function public.find_password_recovery_user(p_email text)
returns table (
  user_id uuid,
  security_answer_hash text,
  user_metadata jsonb
)
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select
    users.id,
    users.raw_user_meta_data ->> 'security_answer_hash',
    coalesce(users.raw_user_meta_data, '{}'::jsonb)
  from auth.users
  where lower(users.email) = lower(btrim(p_email))
  limit 1;
$$;

revoke all on function public.find_password_recovery_user(text)
  from public, anon, authenticated;
grant execute on function public.find_password_recovery_user(text)
  to service_role;
