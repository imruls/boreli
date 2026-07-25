-- consume_security_rate_limit() siempre incrementa attempts como efecto
-- secundario de calcular si está bloqueado, así que no sirve para chequear el
-- estado de bloqueo ANTES de intentar una operación sensible (login, signup,
-- actualización de la respuesta de seguridad) sin gastar un intento en el
-- intento. Hasta ahora ningún caller chequeaba el valor de retorno del
-- consumo de la cuenta hecho tras un fallo, así que el bloqueo por cuenta
-- quedaba registrado en la tabla pero nunca impedía el próximo intento —
-- solo el límite por IP (chequeado antes de actuar) frenaba algo en la
-- práctica.
--
-- Esta función es de solo lectura: no modifica security_rate_limits, así que
-- se puede llamar antes de la operación sensible sin afectar el conteo.
create or replace function public.is_security_rate_limit_blocked(p_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  current_blocked_until timestamptz;
begin
  if p_key is null or char_length(p_key) not between 1 and 200 then
    raise exception 'Invalid rate limit key';
  end if;

  select blocked_until
    into current_blocked_until
    from public.security_rate_limits
    where key = p_key;

  return current_blocked_until is not null and current_blocked_until > clock_timestamp();
end;
$$;

revoke all on function public.is_security_rate_limit_blocked(text)
  from public, anon, authenticated;
grant execute on function public.is_security_rate_limit_blocked(text)
  to service_role;
