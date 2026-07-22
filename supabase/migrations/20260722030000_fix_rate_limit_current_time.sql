-- Fix: en PL/pgSQL el identificador `current_time` resuelve al built-in
-- CURRENT_TIME (time with time zone), no a la variable local timestamptz.
-- Eso rompía login/signup/reset/search al llamar consume_security_rate_limit.

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
