-- Baseline idempotente del esquema previo a las migraciones incrementales.
-- Tiene un timestamp anterior a note/avatars/progress para que una base vacía
-- pueda reconstruirse únicamente desde `supabase/migrations`.

do $$
begin
  create type public.book_status as enum ('want_to_read', 'reading', 'read');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.book_tag as enum (
    'physical',
    'google_books',
    'apple_books',
    'kindle',
    'pdf'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  google_books_id text unique,
  title text not null,
  authors text[],
  cover_url text,
  page_count integer,
  description text,
  published_date text,
  created_at timestamptz default now()
);

create table if not exists public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  book_id uuid references public.books(id) not null,
  status public.book_status not null default 'want_to_read',
  tags public.book_tag[] default '{}',
  rating smallint check (rating between 1 and 5),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, book_id),
  constraint rating_requires_read check (rating is null or status = 'read')
);

alter table public.user_books enable row level security;
alter table public.books enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_books'
      and policyname = 'select_own_user_books'
  ) then
    create policy "select_own_user_books"
      on public.user_books for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_books'
      and policyname = 'insert_own_user_books'
  ) then
    create policy "insert_own_user_books"
      on public.user_books for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_books'
      and policyname = 'update_own_user_books'
  ) then
    create policy "update_own_user_books"
      on public.user_books for update
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_books'
      and policyname = 'delete_own_user_books'
  ) then
    create policy "delete_own_user_books"
      on public.user_books for delete
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'books'
      and policyname = 'select_books'
  ) then
    create policy "select_books"
      on public.books for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'books'
      and policyname = 'insert_books'
  ) then
    create policy "insert_books"
      on public.books for insert
      with check (auth.role() = 'authenticated');
  end if;
end
$$;

grant usage on schema public to anon, authenticated;
grant select on public.books to anon, authenticated;
grant insert on public.books to authenticated;
grant select, insert, update, delete on public.user_books to authenticated;
