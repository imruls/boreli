# Modelo de datos

Fuente de verdad del esquema. Cualquier cambio de modelo empieza acá, no directo en Supabase.

## Esquema SQL (Supabase/Postgres)

```sql
create extension if not exists "uuid-ossp";

create type book_status as enum ('want_to_read', 'reading', 'read');
create type book_tag as enum ('physical', 'google_books', 'apple_books', 'kindle');

-- Catálogo de libros, compartido entre todos los usuarios (evita duplicar datos de la API)
create table books (
  id uuid primary key default uuid_generate_v4(),
  google_books_id text unique,
  title text not null,
  authors text[],
  cover_url text,
  page_count integer,
  description text,
  published_date text,
  created_at timestamptz default now()
);

-- La relación usuario-libro: acá vive el estado, tags y rating
create table user_books (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  book_id uuid references books(id) not null,
  status book_status not null default 'want_to_read',
  tags book_tag[] default '{}',
  rating smallint check (rating between 1 and 5),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, book_id),
  -- el rating solo puede existir si el libro ya está marcado como leído
  constraint rating_requires_read check (rating is null or status = 'read')
);

-- RLS: cada usuario solo puede ver/editar sus propios registros
alter table user_books enable row level security;

create policy "select_own_user_books" on user_books for select using (auth.uid() = user_id);
create policy "insert_own_user_books" on user_books for insert with check (auth.uid() = user_id);
create policy "update_own_user_books" on user_books for update using (auth.uid() = user_id);
create policy "delete_own_user_books" on user_books for delete using (auth.uid() = user_id);

-- books es catálogo compartido: lectura pública, escritura solo autenticada
alter table books enable row level security;
create policy "select_books" on books for select using (true);
create policy "insert_books" on books for insert with check (auth.role() = 'authenticated');

-- Grants a nivel de tabla: RLS controla las filas, pero sin estos grants
-- los roles anon/authenticated no pueden ni intentar la operación (da 401
-- "permission denied" aunque la policy de RLS sea permisiva). Al crear las
-- tablas por SQL Editor (en vez de la UI de Table Editor) hay que otorgarlos
-- a mano.
grant usage on schema public to anon, authenticated;

grant select on public.books to anon, authenticated;
grant insert on public.books to authenticated;

grant select, insert, update, delete on public.user_books to authenticated;
```

### Nota sobre el constraint de rating
`rating_requires_read` bloquea a nivel de base de datos que se guarde un rating en un libro que no
esté en `status = 'read'`. Esto es intencional: la regla de negocio no debe depender únicamente de
que la UI se comporte bien — si en el futuro un agente escribe una migración, un script, o se accede
directo a la API de Supabase, el constraint sigue protegiendo la integridad del dato.

Importante para el flujo de cambio de estado: si un libro pasa de `read` a otro estado (por ejemplo,
si el usuario se equivocó y lo vuelve a `reading`), hay que limpiar el `rating` (`update ... set rating
= null`) en la misma transacción que cambia el `status`, o el update va a fallar por el constraint.

## Tipos TypeScript compartidos

```ts
// types/book.ts
export type BookStatus = 'want_to_read' | 'reading' | 'read';
export type BookTag = 'physical' | 'google_books' | 'apple_books' | 'kindle';

export interface Book {
  id: string;
  googleBooksId: string | null;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
  description: string | null;
  publishedDate: string | null;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: BookStatus;
  tags: BookTag[];
  rating: number | null; // 1-5, solo aplica si status === 'read'
  startedAt: string | null;
  finishedAt: string | null;
  book: Book; // resultado de join con la tabla books
}
```

## Carga manual de libros

Cuando la búsqueda en Google Books no encuentra el libro, el usuario puede cargarlo a mano.
Campos del formulario manual (subset de `Book`):

| Campo | Requerido | Notas |
|---|---|---|
| `title` | Sí | |
| `authors` | Sí | Se puede cargar como un único string y splitear por coma |
| `coverUrl` | No | URL directa a una imagen, no hay upload de archivo en el MVP |
| `pageCount` | No | |

`description`, `publishedDate` y `googleBooksId` quedan `null` para libros cargados a mano —
no se piden en el formulario.
