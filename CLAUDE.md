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
- **`design-system.md`** → sistema de diseño basado en las Human Interface Guidelines de Apple (estilo iOS 17/18, sidebar tipo iPadOS en pantallas grandes) con la marca Boreli: roles de color en claro y oscuro derivados de crema + oscuro cálido, sin acentos de color, fuente del sistema, sin ilustraciones en el MVP.

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
- Progreso de lectura (`progressType`/`progressCurrent`/`progressTotalPages` en `UserBook`) es **opcional** y solo puede existir cuando `status = 'reading'` — mismo criterio que `rating`/`note`, forzado con CHECK constraints en la DB (`progress_requires_reading` y `progress_bounds` en `data-model.md`). El modo (porcentaje o páginas) es de elección libre por libro, independiente del tag de formato: en modo páginas, el total (`progressTotalPages`) es propio del progreso, no pisa el `pageCount` del catálogo. Se edita junto a estado/tags/rating en `EditBookSheet`, se muestra de solo lectura en `BookDetailSheet`, y además tiene un acceso rápido (`UpdateProgressSheet`) desde la card de "Leyendo actualmente" en home, sin pasar por el sheet completo — ese acceso rápido solo se muestra mientras el libro todavía no tiene progreso cargado (nudge inicial "Agregar progreso"); una vez cargado, la card pasa a mostrar solo la barra de progreso de solo lectura y la actualización sigue por `EditBookSheet` (botón "⋯").
- La app NO es PWA ni instalable — 100% navegador con URL + login.
- Sin funciones sociales — cada usuario ve solo su propia data (RLS en Supabase).
- Auth del MVP es login/signup básico (email + password). La confirmación de email depende de la opción "Confirm email" del proyecto de Supabase (sin SMTP propio ni callback en la app): si está activada, el signup crea la cuenta y muestra "revisá tu mail" en vez de redirigir; tras confirmar, el usuario ingresa desde `/login`.
- Recuperación de contraseña: flujo de email por defecto de Supabase (`resetPasswordForEmail`). `/forgot-password` manda el link, `/auth/recovery` canjea el código PKCE por una sesión (el link tiene que abrirse en el mismo navegador) y `/reset-password` guarda la nueva contraseña. **No hay pregunta de seguridad** (se eliminó del proyecto). Eliminar la cuenta pide solo la contraseña actual.
  El reset/login/signup/borrado de cuenta están limitados por IP (y por cuenta donde aplica) mediante RPCs de Postgres exclusivas de `service_role`
  (`lib/supabase/admin.ts`, variable `SUPABASE_SERVICE_ROLE_KEY`); esas migraciones deben aplicarse antes de desplegar el código.
- La carga manual de libros (cuando no aparecen en la búsqueda de Google Books) pide: título, autor, portada (URL) y cantidad de páginas. No pide descripción ni fecha de publicación.
- Importar CSV (`/perfil/importar`): el archivo se lee en el navegador (`lib/csv-import.ts`, que reconoce el CSV de Boreli, Goodreads, StoryGraph o una lista armada a mano; solo exige una columna de título). Cada fila se empareja con Google Books (`matchImportRows`, por ISBN y después por título + autor, ranking en `lib/import-match.ts`) y el usuario revisa la vista previa antes de guardar: puede cambiar la coincidencia, buscar el libro a mano en Google Books (mismo `/api/books/search` y rate limit que Buscar) si el emparejado automático no lo encontró, cargarla como manual o desmarcarla. Importar **nunca pisa** un libro que ya está en la biblioteca (`ignoreDuplicates`). Los libros nuevos se insertan en `books` con el service role tras volver a pedirlos a Google por id, con límite propio de 300 por usuario y por día (ver `data-model.md`).
- Nombre de usuario (`display_name`) y foto de perfil (`avatar_url`) se editan desde `/perfil/editar` (`app/(dashboard)/perfil/editar/`) y viven en `user_metadata` de Supabase Auth — sin tabla `profiles` nueva, porque no hay funciones sociales que necesiten consultarlos por otro lado. La foto se sube al bucket público `avatars` de Supabase Storage, con la convención de path `{user_id}/avatar` (ver `data-model.md`).

## Fuera de alcance del MVP
- Red social, seguir a otros usuarios, feed público
- Sincronización automática con Kindle/Apple Books (no existen APIs públicas — los tags son manuales)
- Instalación como PWA
- Historial/estadísticas de progreso de lectura a lo largo del tiempo (solo se guarda el valor actual)
- Reordenar manualmente "quiero leer" → backlog post-MVP, ver `ROADMAP.md`

## Estructura
Rutas en `/app`, componentes en `/components`, helpers en `/lib`, tipos en `/types`.
Detalle completo en `tech-stack.md`.

## Convenciones
- Componentes en PascalCase, archivos en kebab-case.
- Tipado estricto: evitar `any`.
- Usar los tipos de `types/book.ts` para todo lo relacionado a libros.
- Seguir los tokens de color, la escala tipográfica y los patrones de componentes de `design-system.md` en vez de inventar valores nuevos. Todo color tiene variante clara y oscura: el modo lo elige el usuario en Perfil → Apariencia (Sistema/Claro/Oscuro, cookie `boreli-theme` → `data-theme` en `<html>`); para estilos por modo usar el variant `dark:`, nunca `@media (prefers-color-scheme)` directo.
