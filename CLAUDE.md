# Boreli — App de registro de libros

## Qué es
**Boreli**: app web (no PWA, sin instalación) para registrar libros que leo, quiero leer
y ya leí, con rating y tags de formato (físico / Google Books / Apple Books / Kindle).
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

## Reglas de negocio clave (no romper)
- `status` es un único valor por libro (`want_to_read` | `reading` | `read`) — nunca simultáneo.
- Puede haber múltiples libros con `status = 'reading'` al mismo tiempo.
- `rating` (1-5) solo puede existir cuando `status = 'read'` — **forzado con un CHECK constraint en la DB**, no solo en la UI (ver `data-model.md`).
- `tags` es un array — un libro puede tener varios tags de formato a la vez.
- No hay progreso de lectura (% o página) en el modelo — se descartó a propósito.
- La app NO es PWA ni instalable — 100% navegador con URL + login.
- Sin funciones sociales — cada usuario ve solo su propia data (RLS en Supabase).
- Auth del MVP es solo login/signup básico (email + password) — recuperación de contraseña y verificación de email quedan para post-MVP.
- La carga manual de libros (cuando no aparecen en la búsqueda de Google Books) pide: título, autor, portada (URL) y cantidad de páginas. No pide descripción ni fecha de publicación.

## Fuera de alcance del MVP
- Red social, seguir a otros usuarios, feed público
- Sincronización automática con Kindle/Apple Books (no existen APIs públicas — los tags son manuales)
- Instalación como PWA
- Progreso de lectura (% o página actual)
- Import de CSV, estadísticas, notas/reseña personal, modo oscuro, reordenar manualmente "quiero leer" → todo esto es backlog post-MVP, ver `ROADMAP.md`

## Estructura
Rutas en `/app`, componentes en `/components`, helpers en `/lib`, tipos en `/types`.
Detalle completo en `tech-stack.md`.

## Convenciones
- Componentes en PascalCase, archivos en kebab-case.
- Tipado estricto: evitar `any`.
- Usar los tipos de `types/book.ts` para todo lo relacionado a libros.
- Seguir la paleta y tipografía de `design-system.md` en vez de inventar valores nuevos.
