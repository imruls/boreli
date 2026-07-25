-- El límite de 5MB y los mime-types permitidos solo se validaban en la
-- Server Action (app/(dashboard)/perfil/editar/actions.ts). Como el bucket
-- es público y las policies de RLS solo restringen el path (no el tamaño ni
-- el tipo de archivo), cualquier usuario autenticado podía subir un archivo
-- arbitrario directo contra la Storage API con su propio browser client
-- (anon key + sesión), sin pasar por esa validación. Estos límites son
-- defensa en profundidad a nivel de base de datos, con los mismos valores
-- que ya exige la Server Action.
update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';
