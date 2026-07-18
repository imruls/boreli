# Modelo de datos

Fuente de verdad del esquema. Cualquier cambio de modelo empieza acá, no directo en Supabase.

## Esquema SQL (Supabase/Postgres)

```sql
create extension if not exists "uuid-ossp";

create type book_status as enum ('want_to_read', 'reading', 'read');
create type book_tag as enum ('physical', 'google_books', 'apple_books', 'kindle', 'pdf');

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
  note text,
  progress_type text check (progress_type in ('percent', 'pages')),
  progress_current integer,
  progress_total_pages integer,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, book_id),
  -- el rating solo puede existir si el libro ya está marcado como leído
  constraint rating_requires_read check (rating is null or status = 'read'),
  -- la reseña es opcional y de hasta 300 caracteres, y (mismo criterio que el
  -- rating) solo puede existir si el libro ya está marcado como leído
  constraint note_length check (note is null or char_length(note) <= 300),
  constraint note_requires_read check (note is null or status = 'read'),
  -- el progreso solo puede existir mientras el libro está "leyendo" (mismo
  -- criterio que rating/note con 'read')
  constraint progress_requires_reading check (
    (progress_type is null and progress_current is null and progress_total_pages is null)
    or status = 'reading'
  ),
  -- 'percent' guarda 0-100 en progress_current; 'pages' guarda la página
  -- actual contra un total propio del progreso (progress_total_pages)
  constraint progress_bounds check (
    progress_type is null
    or (progress_type = 'percent' and progress_current between 0 and 100)
    or (
      progress_type = 'pages'
      and progress_total_pages is not null
      and progress_total_pages > 0
      and progress_current between 0 and progress_total_pages
    )
  )
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

### Nota sobre el constraint de reseña (`note`)
`note` es una reseña personal de texto libre, opcional, de hasta 300 caracteres (`note_length`) y —
mismo criterio que `rating` — solo puede tener valor si el libro está en `status = 'read'`
(`note_requires_read`). A diferencia del rating, no es obligatoria al marcar un libro como leído.

Aplica la misma regla que con el rating: al mover un libro **fuera** de `read`, hay que limpiar
`note` (`= null`) en la misma operación que cambia el `status`, o el update falla por el constraint.

### Nota sobre el progreso de lectura (`progress_type` / `progress_current` / `progress_total_pages`)
El progreso es opcional y de elección libre por libro entre dos modos (`progress_type`),
independiente de los `tags` de formato — un libro físico puede seguirse por porcentaje igual que uno
digital, y viceversa:
- `'percent'`: `progress_current` guarda un valor entre 0 y 100.
- `'pages'`: `progress_current` guarda la página actual, contra un total en `progress_total_pages`.
  Este total es **propio del progreso**, no el `page_count` del catálogo (`books`): si el usuario
  ingresa un total distinto a mano (ej. porque `page_count` no está cargado), no se pisa el dato
  compartido del libro.

Mismo criterio que `rating`/`note`: el progreso solo puede existir mientras `status = 'reading'`
(`progress_requires_reading`), y al mover un libro **fuera** de `reading` hay que limpiar los 3
campos (`= null`) en la misma operación que cambia el `status`, o el update falla por el constraint.
`progress_bounds` valida los rangos según el modo elegido.

## Tipos TypeScript compartidos

```ts
// types/book.ts
export type BookStatus = 'want_to_read' | 'reading' | 'read';
export type BookTag = 'physical' | 'google_books' | 'apple_books' | 'kindle' | 'pdf';
export type ProgressType = 'percent' | 'pages';

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
  note: string | null; // reseña libre, máx 300 caracteres, solo aplica si status === 'read'
  progressType: ProgressType | null; // solo aplica si status === 'reading'
  progressCurrent: number | null; // 0-100 si progressType === 'percent', página actual si === 'pages'
  progressTotalPages: number | null; // solo aplica si progressType === 'pages'
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

## Migraciones aplicadas después del setup inicial

El `create type book_tag as enum (...)` de más arriba ya incluye `'pdf'`, pero eso solo describe
el estado deseado para un Supabase nuevo. Sobre una base ya creada (`create type` corrido una sola
vez en el setup inicial), agregar un valor a un enum existente requiere `alter type`, no volver a
correr el `create type`:

```sql
alter type book_tag add value 'pdf';
```

Esta se corrió a mano en el SQL Editor de Supabase (como statement propio — no se puede usar el
valor nuevo en la misma transacción en la que se agrega), antes de que el repo tuviera CLI de
migraciones.

### Reseña personal (`note`) en `user_books`

El `create table user_books` de más arriba ya incluye la columna `note` y sus constraints, pero eso
solo describe el estado deseado para un Supabase nuevo. Esta sí quedó versionada como migración del
Supabase CLI (ver sección siguiente): `supabase/migrations/20260715134119_add_user_books_note.sql`.

```sql
alter table user_books
  add column note text,
  add constraint note_length check (note is null or char_length(note) <= 300),
  add constraint note_requires_read check (note is null or status = 'read');
```

## Foto de perfil y nombre de usuario

A diferencia de los libros (que tienen su propia tabla), el nombre de usuario y la foto de perfil
son datos de la cuenta, no del dominio de libros — y la app no tiene funciones sociales que
necesiten consultarlos por otro lado (join, búsqueda, unicidad). Por eso, **no viven en una tabla
`profiles` nueva**: siguen el mismo criterio que `security_answer_hash` (`lib/security-answer.ts`)
y se guardan directo en `user_metadata` de Supabase Auth, actualizados con
`supabase.auth.updateUser({ data: {...} })`:

- `display_name`: string, opcional, hasta 40 caracteres. Si no está seteado, la UI cae al email
  (mismo fallback que ya existía).
- `avatar_url`: string (URL pública), opcional. Apunta a un archivo en el bucket `avatars` de
  Supabase Storage.

### Bucket `avatars`

Creado en `supabase/migrations/20260717010201_add_avatars_bucket.sql`. Público (mismo criterio que
`cover_url` en `books`: se resuelve con una URL directa, sin signed URLs) pero con policies en
`storage.objects` que solo permiten a cada usuario escribir/borrar su propio archivo, con la
convención de path `{user_id}/avatar` (sin extensión — Storage sirve el `content-type` real del
objeto igual):

```sql
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "select_avatars" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "insert_own_avatar" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "update_own_avatar" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "delete_own_avatar" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
```

Cada subida usa `upsert: true` sobre la misma key, así que al cambiar de foto se pisa la anterior en
vez de acumular archivos huérfanos.

## Supabase CLI y migraciones versionadas

A partir de la migración de `note`, el repo usa el [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
(`supabase` como devDependency, ver `package.json`) en vez de correr SQL a mano — así los cambios de
esquema quedan versionados en `supabase/migrations/` junto con el resto del código.

Flujo para una migración nueva:

```bash
pnpm exec supabase migration new nombre_de_la_migracion   # crea supabase/migrations/<timestamp>_nombre.sql vacío
# escribir el SQL en ese archivo
pnpm db:push                                              # aplica las migraciones pendientes al proyecto linkeado
```

`pnpm db:link` (una sola vez por máquina, requiere haber corrido `pnpm db:login` antes para
autenticarse) y `pnpm db:push` están en `package.json` como scripts cortos sobre `supabase link` /
`supabase db push`. Requieren la contraseña de la base (Settings → Database en el dashboard de
Supabase) la primera vez — no está en `.env.local` a propósito, hay que ingresarla a mano en el
prompt del CLI.
