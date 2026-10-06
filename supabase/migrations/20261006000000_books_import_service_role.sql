-- La importación de CSV (app/(dashboard)/perfil/importar/actions.ts) puede
-- agregar cientos de libros al catálogo `books` de una vez, muy por encima
-- del límite de este trigger (30 cada 10 minutos por usuario). Esos inserts
-- van con el service role, después de que el server re-validó cada libro
-- contra Google Books y consumió su propio rate limit por usuario
-- (`books-import-new-user`, 300 por día). Con el service role `auth.uid()`
-- es null, así que el trigger además los contaría todos en un único bucket
-- compartido ('books-insert:anon'): se los exceptúa. Los inserts de usuarios
-- autenticados (UI o REST directo con su JWT) siguen igual de limitados.
create or replace function public.enforce_books_insert_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_key text := 'books-insert:' || coalesce(auth.uid()::text, 'anon');
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if not public.consume_security_rate_limit(v_key, 30, 600, 1800) then
    raise exception 'Demasiadas altas de libros en poco tiempo. Esperá unos minutos e intentá de nuevo.';
  end if;
  return new;
end;
$$;
