# Roadmap — App de registro de libros

**Contexto del proyecto:** dedicación full-time, experiencia básica de código, prioridad en buen
diseño/UX desde el inicio, mobile-first con soporte desktop, estilo minimalista/clean, acceso 100%
vía navegador (sin instalación), meta: versión usable en pocas semanas.

Este archivo es el plan de fases. Para reglas de negocio inquebrantables y stack, ver `CLAUDE.md`.
Para el detalle técnico de cada pieza, ver `data-model.md`, `tech-stack.md` y `design-system.md`.

---

## Antes de arrancar (día 0)

- [x] Crear cuenta en Supabase, GitHub y Vercel
- [x] Conseguir API key de Google Books (Google Cloud Console)
- [x] Definir nombre de la app / dominio (si vas a usar uno propio)
- [x] Crear el repo, correr `pnpm create next-app` (TypeScript + Tailwind + App Router)
- [x] Copiar `CLAUDE.md`, `data-model.md`, `tech-stack.md` y `design-system.md` a la raíz del repo

---

## Semana 1 — Fundamentos de diseño + esqueleto técnico

**Objetivo:** tener el proyecto corriendo con auth completo y el sistema visual base definido.

- [x] Configurar Tailwind con la paleta y tipografía de `design-system.md` (proyecto en Tailwind v4: los tokens `cream`/`ink`/`ink-muted`/`ink-border` y las fuentes Inter + Roboto Slab quedaron en `@theme` dentro de `app/globals.css`, no en `tailwind.config.ts`, que ya no existe en v4)
- [x] Wireframes de: home (`app/(dashboard)/page.tsx`), `quiero-leer/page.tsx`, `leidos/page.tsx`, modal de alta
- [ ] Agregar los assets de marca (logotipo/isotipo + isologotipo, en SVG y PNG con fondo transparente) en
      `public/brand/` (`boreli-icon-light.svg` / `boreli-icon-dark.svg` / `boreli-wordmark-light.svg` /
      `boreli-wordmark-dark.svg`, ver `design-system.md`) y reemplazar el logo de texto placeholder
      (`components/brand/logo-mark.tsx`) por el asset real en header, login/signup y favicon
- [x] Instalar shadcn/ui (`pnpm dlx shadcn@latest init`)
- [x] Crear el proyecto en Supabase y correr el SQL de `data-model.md` (incluye el constraint `rating_requires_read`; verificado vía REST: `books` responde 200 público, `user_books` bloqueada para `anon` como corresponde)
- [x] `lib/supabase/client.ts` y `lib/supabase/server.ts`
- [x] Login/signup con Supabase Auth (email + password) — sin recuperación de contraseña ni verificación de email en el MVP (ver `CLAUDE.md`)
- [x] Verificar RLS con 2 usuarios de prueba: confirmar que ninguno ve datos del otro (verificado vía API con 2 cuentas de prueba: A ve su propia fila de `user_books`, B recibe `[]`, B no puede insertar suplantando a A —403—, y el `update`/`delete` de B sobre la fila de A afecta 0 filas)

**Criterio de aceptación:** un usuario nuevo puede registrarse, loguearse, y ver un dashboard vacío
ya con la paleta y tipografía definidas.

---

## Semana 2 — Alta de libros + búsqueda

**Objetivo:** poder agregar libros a la biblioteca, por búsqueda o carga manual.

- [x] `app/api/books/search/route.ts`: route handler que llama a Google Books API con el query recibido (proxy con `GOOGLE_BOOKS_API_KEY`, normaliza la respuesta al shape de `Book`; probado end-to-end pero el proyecto de Google Cloud está devolviendo 429 con `quota_limit_value: 0` para `books.googleapis.com` — hay que revisar la cuota/facturación en la consola antes de darlo por verificado con datos reales)
- [x] `components/book-search-modal.tsx`: input + resultados (portada, título, autor) — implementado como página completa (`app/(dashboard)/buscar/page.tsx`, patrón ya usado en Semana 1) en vez de modal; consume `app/api/books/search` con debounce de 400ms, estados de loading/error/sin resultados y portadas reales vía `next/image` (dominios de Google Books agregados a `next.config.ts`). Se sacó el mock de referencia (`lib/mock/search-books.ts`)
- [x] `components/tag-selector.tsx`: chips multi-select para `BookTag[]` (`ToggleGroup type="multiple"`, a diferencia de `tag-filter-chips.tsx` que es de selección única)
- [x] Lógica de alta desde búsqueda: al elegir un resultado → upsert en `books` (por `google_books_id`) → insert en `user_books` con el `status` y tags elegidos (`app/(dashboard)/buscar/actions.ts`). Nota: `books` no tiene policy de `update` en `data-model.md`, así que en vez de un upsert real se hace "select y si no existe insert" (con manejo de la carrera por `unique_violation` en `google_books_id`); el upsert real sí aplica en `user_books` por `(user_id, book_id)`, con `revalidatePath` de home/quiero-leer/leidos
- [x] `components/manual-book-form.tsx`: para cuando la búsqueda no encuentra el libro. Campos: título, autor (split por coma), portada (URL), páginas — ver tabla en `data-model.md`. Implementado como Sheet (no como tab de un Dialog, siguiendo el patrón de página completa ya usado en vez de modal) accesible desde un link debajo del buscador y desde la acción del estado "sin resultados"; al enviarlo abre el mismo `AddToLibrarySheet` de status/tags y reusa `addBookToLibrary`

**Criterio de aceptación:** buscar un libro real, elegirlo, asignarle un tag, y verlo aparecer en la
lista de pendientes. También poder cargar un libro a mano con los 4 campos definidos y que aparezca igual.

---

## Semana 3 — Las 3 vistas + transición de estados

**Objetivo:** el core funcional de la app.

- [ ] Home: query de `user_books` filtrando `status = 'reading'` (soporta múltiples resultados)
- [ ] `quiero-leer/page.tsx` y `leidos/page.tsx`: mismo patrón, filtrando por su status
- [ ] Acción de cambio de estado: al mover a "leído", abrir `components/rating-input.tsx` (obligatorio 1-5) antes de confirmar
- [ ] Al mover a "leyendo" → set `started_at`; al mover a "leído" → set `finished_at`
- [ ] Al mover un libro **fuera** de "leído" hacia otro estado → limpiar `rating` (`null`) en la misma operación, por el constraint de `data-model.md`
- [ ] `components/status-filter.tsx` + filtro combinable por tag

**Criterio de aceptación:** mover un libro de pendiente → leyendo → leído sin que aparezca nunca en
dos listas a la vez, pidiendo rating al finalizarlo, y sin errores de constraint si se revierte el estado.

---

## Semana 4 — Export CSV + pulido responsive

**Objetivo:** cerrar el MVP dejándolo prolijo y accesible 100% vía navegador (sin instalación).

- [ ] `lib/csv-export.ts`: arma el CSV desde `UserBook[]` (título, autor, estado, tags, rating, fechas)
- [ ] Botón de exportar visible (header o configuración)
- [ ] Revisión responsive en breakpoints de Tailwind (`sm`, `md`, `lg`)
- [ ] Favicon, `<title>` y metadata básica en `app/layout.tsx`
- [ ] Estados vacíos y loading states prolijos (ver convenciones en `design-system.md`)
- [ ] Deploy en Vercel + variables de entorno configuradas ahí

**Criterio de aceptación:** desde el celular, abrir la URL de producción, loguearse, y descargar el CSV de la biblioteca completa.

---

## Buffer / semana 5 (si hace falta)

- [ ] Ajustes de UX detectados al usarla vos mismo unos días
- [ ] Revisión final de dominio/deploy
- [ ] Actualizar `CLAUDE.md` con cualquier convención nueva que haya surgido

---

## Backlog post-MVP (no bloquea el lanzamiento)

- Recuperación de contraseña (Supabase Auth ya lo soporta, se activa cuando se priorice)
- Verificación por código de email en cada login/signup (se probó para el MVP y se descartó porque
  requiere conectar un servicio de email propio vía SMTP — el de Supabase por default es solo para
  pruebas, con rate limits muy bajos)
- Import de CSV (para cerrar el círculo de portabilidad de datos)
- Estadísticas (libros leídos por año, por género, páginas totales)
- Notas/reseña personal por libro
- Modo oscuro
- Reordenar manualmente la lista de "quiero leer" (prioridad)

---

## Notas de alcance (para no desviarte)

- El MVP **no** incluye: red social, seguir a otros usuarios, feed público, sincronización
  automática con Kindle/Apple Books (no existen APIs públicas para eso — los tags son manuales),
  ni instalación como PWA — la app es 100% web, se accede con una URL y login desde cualquier navegador.
- Cada fase semanal asume dedicación full-time; si en algún momento baja el ritmo, las semanas se
  estiran pero el orden de las fases se mantiene igual.
