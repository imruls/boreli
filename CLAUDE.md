# Boreli — App de registro de libros

## Qué es
**Boreli**: app web (no PWA, sin instalación) para registrar libros que leo, quiero leer
y ya leí, con rating y tags de formato (físico / Google Books / Apple Books / Kindle / PDF).
Mobile-first, con soporte desktop. Acceso 100% vía navegador con URL + login.

## Cómo usar los documentos de este repo
- **`CLAUDE.md`** (este archivo) → reglas de negocio inquebrantables, stack, comandos. Se lee automáticamente en cada sesión de Claude Code.
- **`ROADMAP.md`** → plan de fases semanales con checklist. Referenciar explícitamente al arrancar una sesión (ej: *"Lee ROADMAP.md y arranquemos con la Semana 2"*).
- **`data-model.md`** → esquema SQL completo + tipos TypeScript. Fuente de verdad del modelo de datos.
- **`tech-stack.md`** → stack, variables de entorno, estructura de carpetas.
- **`design-system.md`** → paleta, tipografía y logo de la marca Boreli (crema + oscuro cálido, sin acentos de color, sin ilustraciones en el MVP).

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- Google Books API para búsqueda
- pnpm como gestor de paquetes
- Deploy en Vercel

Ver `tech-stack.md` para el detalle de cada decisión.

## Comandos
- Instalar: `pnpm install`
- Desarrollo: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Type check: `pnpm tsc --noEmit`
- Migraciones de DB (ver `data-model.md`): `pnpm exec supabase migration new <nombre>` para crear una,
  `pnpm db:push` para aplicar las pendientes al proyecto de Supabase linkeado (`pnpm db:login` +
  `pnpm db:link` una sola vez por máquina)

## Reglas de negocio clave (no romper)
- `status` es un único valor por libro (`want_to_read` | `reading` | `read`) — nunca simultáneo.
- Puede haber múltiples libros con `status = 'reading'` al mismo tiempo.
- `rating` (1-5) solo puede existir cuando `status = 'read'` — **forzado con un CHECK constraint en la DB**, no solo en la UI (ver `data-model.md`).
- `note` (reseña personal, texto libre, hasta 300 caracteres) es **opcional** y solo puede existir cuando `status = 'read'` — mismo criterio que `rating`, también forzado con un CHECK constraint en la DB (`note_requires_read` en `data-model.md`). A diferencia del rating, no es obligatoria para marcar un libro como leído. Se edita junto al rating en `AddToLibrarySheet`/`EditBookSheet`, y se puede volver a leer tocando la card del libro (`BookDetailSheet`), que también muestra estado y etiquetas con un botón "Editar".
- `tags` es un array — un libro puede tener varios tags de formato a la vez.
- No hay progreso de lectura (% o página) en el modelo — se descartó a propósito.
- La app NO es PWA ni instalable — 100% navegador con URL + login.
- Sin funciones sociales — cada usuario ve solo su propia data (RLS en Supabase).
- Auth del MVP es login/signup básico (email + password) — la verificación de email queda para post-MVP.
- Recuperación de contraseña: implementada **sin servicio de email**, con pregunta de seguridad fija para todos los usuarios (`lib/security-question.ts`). La respuesta se guarda hasheada en `user_metadata` (`lib/security-answer.ts`) y el reset (`app/(auth)/forgot-password/`) usa la Service Role Key de Supabase (`lib/supabase/admin.ts`, variable `SUPABASE_SERVICE_ROLE_KEY`) para cambiar la contraseña sin el flujo de magic link por mail. Cuentas creadas antes de este cambio configuran su respuesta desde `/perfil/seguridad`.
- La carga manual de libros (cuando no aparecen en la búsqueda de Google Books) pide: título, autor, portada (URL) y cantidad de páginas. No pide descripción ni fecha de publicación.
- Nombre de usuario (`display_name`) y foto de perfil (`avatar_url`) se editan desde `/perfil/editar` (`app/(dashboard)/perfil/editar/`) y viven en `user_metadata` de Supabase Auth — mismo criterio que `security_answer_hash`, sin tabla `profiles` nueva, porque no hay funciones sociales que necesiten consultarlos por otro lado. La foto se sube al bucket público `avatars` de Supabase Storage, con la convención de path `{user_id}/avatar` (ver `data-model.md`).

## Fuera de alcance del MVP
- Red social, seguir a otros usuarios, feed público
- Sincronización automática con Kindle/Apple Books (no existen APIs públicas — los tags son manuales)
- Instalación como PWA
- Progreso de lectura (% o página actual)
- Import de CSV, estadísticas, modo oscuro, reordenar manualmente "quiero leer" → todo esto es backlog post-MVP, ver `ROADMAP.md`

## Estructura
Rutas en `/app`, componentes en `/components`, helpers en `/lib`, tipos en `/types`.
Detalle completo en `tech-stack.md`.

## Convenciones
- Componentes en PascalCase, archivos en kebab-case.
- Tipado estricto: evitar `any`.
- Usar los tipos de `types/book.ts` para todo lo relacionado a libros.
- Seguir la paleta y tipografía de `design-system.md` en vez de inventar valores nuevos.
