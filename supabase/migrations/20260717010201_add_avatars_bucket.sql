-- Bucket público para fotos de perfil. Público (a diferencia de una alternativa
-- con URLs firmadas) por el mismo criterio que `cover_url` en `books`: se
-- resuelve con una URL directa, sin lógica extra de firma/expiración.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Convención de path: cada usuario sube su foto a `{user_id}/avatar` (sin
-- extensión — Storage sirve el `content-type` real del objeto en la
-- respuesta igual, así que no hace falta parsearla del nombre). `upsert:
-- true` desde la Server Action pisa el archivo anterior en vez de acumular
-- huérfanos.
create policy "select_avatars" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "insert_own_avatar" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "update_own_avatar" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "delete_own_avatar" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
