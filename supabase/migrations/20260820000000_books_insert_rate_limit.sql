-- `books` es un catálogo compartido: la policy `insert_books` solo exige
-- `auth.role() = 'authenticated'`, sin límite de volumen. Un usuario
-- autenticado puede insertar filas arbitrarias llamando directo a la REST
-- API de Supabase (POST /rest/v1/books) con su JWT, sin pasar por
-- `buscar/actions.ts` — el Server Action es el camino de la UI, no una
-- barrera de seguridad. Este trigger cierra ese hueco a nivel DB, reusando
-- el mismo mecanismo atómico de rate limit que login/signup/forgot-password
-- (`consume_security_rate_limit`, ver 20260722010000_security_hardening.sql).
create or replace function public.enforce_books_insert_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_key text := 'books-insert:' || coalesce(auth.uid()::text, 'anon');
begin
  if not public.consume_security_rate_limit(v_key, 30, 600, 1800) then
    raise exception 'Demasiadas altas de libros en poco tiempo. Esperá unos minutos e intentá de nuevo.';
  end if;
  return new;
end;
$$;

drop trigger if exists books_insert_rate_limit on public.books;
create trigger books_insert_rate_limit
  before insert on public.books
  for each row
  execute function public.enforce_books_insert_rate_limit();
