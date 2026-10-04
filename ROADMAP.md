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

## 1 — Fundamentos de diseño + esqueleto técnico

**Objetivo:** tener el proyecto corriendo con auth completo y el sistema visual base definido.

- [x] Configurar Tailwind con la paleta y tipografía de `design-system.md` (proyecto en Tailwind v4: los tokens `cream`/`ink`/`ink-muted`/`ink-border` y las fuentes Inter + Roboto Slab quedaron en `@theme` dentro de `app/globals.css`, no en `tailwind.config.ts`, que ya no existe en v4)
- [x] Wireframes de: home (`app/(dashboard)/page.tsx`), `quiero-leer/page.tsx`, `leidos/page.tsx`, modal de alta
- [ ] Agregar los assets de marca (logotipo/isotipo + isologotipo, en PNG con fondo transparente) en
      `public/brand/` (`boreli-icon-light.png` / `boreli-icon-dark.png` / `boreli-wordmark-light.png` /
      `boreli-wordmark-dark.png`, ver `design-system.md`) y reemplazar el logo de texto placeholder
      (`components/brand/logo-mark.tsx`) por el asset real en header, login/signup y favicon
- [x] Instalar shadcn/ui (`pnpm dlx shadcn@latest init`)
- [x] Crear el proyecto en Supabase y correr el SQL de `data-model.md` (incluye el constraint `rating_requires_read`; verificado vía REST: `books` responde 200 público, `user_books` bloqueada para `anon` como corresponde)
- [x] `lib/supabase/client.ts` y `lib/supabase/server.ts`
- [x] Login/signup con Supabase Auth (email + password) — sin recuperación de contraseña ni verificación de email en el MVP (ver `CLAUDE.md`)
- [x] Verificar RLS con 2 usuarios de prueba: confirmar que ninguno ve datos del otro (verificado vía API con 2 cuentas de prueba: A ve su propia fila de `user_books`, B recibe `[]`, B no puede insertar suplantando a A —403—, y el `update`/`delete` de B sobre la fila de A afecta 0 filas)

**Criterio de aceptación:** un usuario nuevo puede registrarse, loguearse, y ver un dashboard vacío
ya con la paleta y tipografía definidas.

---

## 2 — Alta de libros + búsqueda

**Objetivo:** poder agregar libros a la biblioteca, por búsqueda o carga manual.

- [x] `app/api/books/search/route.ts`: route handler autenticado que llama a Google Books API con el query recibido (proxy server-side con `GOOGLE_BOOKS_API_KEY` + rate limit por usuario, normaliza la respuesta al shape de `Book`; probado end-to-end pero el proyecto de Google Cloud está devolviendo 429 con `quota_limit_value: 0` para `books.googleapis.com` — hay que revisar la cuota/facturación en la consola antes de darlo por verificado con datos reales)
- [x] `components/book-search-modal.tsx`: input + resultados (portada, título, autor) — implementado como página completa (`app/(dashboard)/buscar/page.tsx`, patrón ya usado en Semana 1) en vez de modal; consume `app/api/books/search` con debounce de 400ms, estados de loading/error/sin resultados y portadas reales vía `next/image` (dominios de Google Books agregados a `next.config.ts`). Se sacó el mock de referencia (`lib/mock/search-books.ts`)
- [x] `components/tag-selector.tsx`: chips multi-select para `BookTag[]` (`ToggleGroup type="multiple"`, a diferencia de `tag-filter-chips.tsx` que es de selección única)
- [x] Lógica de alta desde búsqueda: al elegir un resultado → upsert en `books` (por `google_books_id`) → insert en `user_books` con el `status` y tags elegidos (`app/(dashboard)/buscar/actions.ts`). Nota: `books` no tiene policy de `update` en `data-model.md`, así que en vez de un upsert real se hace "select y si no existe insert" (con manejo de la carrera por `unique_violation` en `google_books_id`); el upsert real sí aplica en `user_books` por `(user_id, book_id)`, con `revalidatePath` de home/quiero-leer/leidos
- [x] `components/manual-book-form.tsx`: para cuando la búsqueda no encuentra el libro. Campos: título, autor (split por coma), portada (URL), páginas — ver tabla en `data-model.md`. Implementado como Sheet (no como tab de un Dialog, siguiendo el patrón de página completa ya usado en vez de modal) accesible desde un link debajo del buscador y desde la acción del estado "sin resultados"; al enviarlo abre el mismo `AddToLibrarySheet` de status/tags y reusa `addBookToLibrary`

**Criterio de aceptación:** buscar un libro real, elegirlo, asignarle un tag, y verlo aparecer en la
lista de pendientes. También poder cargar un libro a mano con los 4 campos definidos y que aparezca igual.

---

## 3 — Las 3 vistas + transición de estados

**Objetivo:** el core funcional de la app.

- [x] Home: query de `user_books` filtrando `status = 'reading'` (soporta múltiples resultados) (`getUserBooksByStatus` en `lib/queries/user-books.ts`, consumido desde `app/(dashboard)/page.tsx` con `.map()` sobre el array de resultados)
- [x] `quiero-leer/page.tsx` y `leidos/page.tsx`: mismo patrón, filtrando por su status (mismo `getUserBooksByStatus`, con `EmptyState` cuando no hay resultados y filtro por tag vía `components/books/book-list-with-filter.tsx`)
- [x] Acción de cambio de estado: al mover a "leído", abrir `components/rating-input.tsx` (obligatorio 1-5) antes de confirmar (server action `changeBookStatus` en `app/(dashboard)/actions.ts`; UI en `components/books/change-status-sheet.tsx`, disparada por el botón `⋯` de cada card vía `components/books/book-status-menu-button.tsx` en home/quiero-leer/leidos — la selección de status queda en un estado intermedio del sheet y recién se confirma con el botón "Confirmar", deshabilitado si el destino es "leído" sin rating elegido)
- [x] Al mover a "leyendo" → set `started_at`; al mover a "leído" → set `finished_at` (mismo `changeBookStatus`, un solo `update` con status + fechas + rating juntos)
- [x] Al mover un libro **fuera** de "leído" hacia otro estado → limpiar `rating` (`null`) en la misma operación, por el constraint de `data-model.md` (mismo `update`: `rating` va a `null` salvo que el status destino sea `read`)
- [x] `components/status-filter.tsx` + filtro combinable por tag — no se creó un componente nuevo: la
      arquitectura real (Semana 1) ya resolvió el filtro por status a nivel de página, con 3 rutas fijas
      (home = `reading`, `quiero-leer` = `want_to_read`, `leidos` = `read`) en vez de una sola vista con
      selector de status. El filtro por tag combinable sobre eso ya existe (`components/books/tag-filter-chips.tsx`
      dentro de `book-list-with-filter.tsx`). Un `status-filter.tsx` literal sería redundante — implicaría
      elegir un status dentro de una página que ya está fija a ese status por ruta.

**Criterio de aceptación:** mover un libro de pendiente → leyendo → leído sin que aparezca nunca en
dos listas a la vez, pidiendo rating al finalizarlo, y sin errores de constraint si se revierte el estado.

---

## 4 — Export CSV + pulido responsive

**Objetivo:** cerrar el MVP dejándolo prolijo y accesible 100% vía navegador (sin instalación).

- [x] `lib/csv-export.ts`: arma el CSV desde `UserBook[]` (título, autor, estado, tags, rating, fechas)
      (`buildLibraryCsv` — RFC 4180, BOM UTF-8 para Excel, `\r\n` como separador — y `buildLibraryCsvFilename`
      con fecha del día; se agregó `getAllUserBooks` en `lib/queries/user-books.ts` para traer la biblioteca
      completa sin filtrar por status, que es lo que pide el criterio de aceptación de esta semana)
- [x] Botón de exportar visible (header o configuración) (`components/export-library-button.tsx` en
      `/perfil`, dentro del listado de configuración de cuenta; llama a la server action `exportLibraryCsv`
      —trae `getAllUserBooks` + `buildLibraryCsv`— y dispara la descarga con un Blob desde el navegador)
- [x] Revisión responsive en breakpoints de Tailwind (`sm`, `md`, `lg`) — auditoría de código de todas
      las páginas/componentes (no pude tomar screenshots reales, no tengo un navegador headless
      disponible en este entorno; recomiendo que lo verifiques vos en el navegador en `sm`/`md`/`lg`).
      Único issue real encontrado y corregido: el contenido de una sola columna (listas, forms) se
      estiraba de punta a punta en pantallas grandes sin ningún límite de ancho. Se agregó
      `lg:max-w-2xl` centrado tanto al `<main>` de `app/(dashboard)/layout.tsx` como a la fila interna
      de `components/nav/app-header.tsx` (el fondo del header sigue full-bleed, solo se alinea el
      contenido). El resto ya estaba bien resuelto: `BottomNav` (`md:hidden`) / nav de `AppHeader`
      (`md:flex`) no se solapan, los `Sheet` (bottom) se ven bien en mobile, y `AuthLayout` ya limitaba
      el ancho de login/signup con `max-w-sm`.
- [x] Favicon, `<title>` y metadata básica en `app/layout.tsx` (favicon vía `app/icon.svg` — convención de
      Next.js, sin tocar `layout.tsx` para esto —, un placeholder consistente con el mark de texto de
      `logo-mark.tsx` (fondo `ink`, "B" en `cream`) hasta que estén los SVG de marca reales, momento en el
      que este archivo se reemplaza directo. `app/layout.tsx` ya tenía `title`/`description` básicos desde
      antes; se agregó `title` por página en `quiero-leer`, `leidos` y `perfil` (siguiendo el patrón
      "— Boreli" ya usado en login/signup) y un `layout.tsx` server-only en `buscar/` solo para poder
      exportar su `metadata`, porque esa página es Client Component y no puede exportarla directo)
- [x] Estados vacíos y loading states prolijos (ver convenciones en `design-system.md`) — auditoría de
      todos los `EmptyState`/`loading.tsx` existentes: ya seguían la convención (ícono + texto corto en
      `ink-muted` + CTA en botón `ink` sólido; skeletons en tono `ink-border`). Único gap real: `/perfil`
      y `/buscar` no tenían `loading.tsx` propio, así que durante la navegación caían en el skeleton de
      `/` (home) sin relación con su contenido real — se agregaron `app/(dashboard)/perfil/loading.tsx`
      y `app/(dashboard)/buscar/loading.tsx`, cada uno con la forma real de su página.
- [x] Deploy en Vercel + variables de entorno configuradas ahí

**Criterio de aceptación:** desde el celular, abrir la URL de producción, loguearse, y descargar el CSV de la biblioteca completa.

---

## Buffer / 5 (si hace falta)

- [x] Ajustes de UX detectados al usarla vos mismo unos días
- [x] Revisión final de dominio/deploy
- [x] Actualizar `CLAUDE.md` con cualquier convención nueva que haya surgido
- [x] Recuperación de contraseña con el flujo de email de Supabase: `/forgot-password` (link desde
      el login) → `/auth/recovery` → `/reset-password`. Reemplazó a la pregunta de seguridad, que se
      eliminó del proyecto. Ver detalle en `tech-stack.md`
- [x] Mostrar/ocultar contraseña (`components/ui/password-input.tsx`) en login, signup y el campo
      de nueva contraseña de `/reset-password`
- [x] Reseña personal por libro leído (`note` en `user_books`, texto libre hasta 300 caracteres,
      opcional, solo aplica si `status = 'read'` — constraint `note_requires_read` en
      `data-model.md`, mismo criterio que `rating` pero sin ser obligatoria). Se edita junto al
      rating en `AddToLibrarySheet`/`EditBookSheet` (`components/books/note-input.tsx`, con
      contador de caracteres). Se agregó además `components/books/book-detail-sheet.tsx`, que se
      abre al tocar cualquier card de la biblioteca (Home/Quiero leer/Leídos) y muestra estado,
      etiquetas, rating y reseña de solo lectura con un botón "Editar" que abre el sheet de
      edición. Esto reemplazó a `components/books/book-edit-menu-button.tsx` por
      `components/books/user-book-card.tsx`, que ahora administra ambos sheets (detalle + edición)
      desde un solo componente por card.
- [x] Progreso de lectura para libros "Leyendo" (`progress_type`/`progress_current`/`progress_total_pages`
      en `user_books`, opcional, solo aplica si `status = 'reading'` — constraints
      `progress_requires_reading` y `progress_bounds` en `data-model.md`, mismo criterio que
      rating/nota con "leído"). Esto revierte la decisión previa de "sin progreso de lectura" (ver
      `CLAUDE.md`). El modo (porcentaje o página) es de elección libre por libro, sin atarlo al tag
      de formato (`components/books/progress-input.tsx`); en modo página, el total es propio del
      progreso y no pisa el `pageCount` del libro. Se edita junto al resto en `EditBookSheet`, se
      muestra de solo lectura en `BookDetailSheet` (`components/books/progress-bar.tsx`), y además
      tiene un acceso rápido desde la card de "Leyendo actualmente" en home
      (`components/books/update-progress-sheet.tsx`) para no tener que abrir el sheet completo cada
      vez que se quiere anotar el avance.

---

## Backlog post-MVP (no bloquea el lanzamiento)

- Verificación por código de email en cada login/signup (se probó para el MVP y se descartó porque
  requiere conectar un servicio de email propio vía SMTP — el de Supabase por default es solo para
  pruebas, con rate limits muy bajos)
- Import de CSV (para cerrar el círculo de portabilidad de datos)
- Estadísticas (libros leídos por año, por género, páginas totales)
- Modo oscuro
- Reordenar manualmente la lista de "quiero leer" (prioridad)

---

## Notas de alcance (para no desviarte)

- El MVP **no** incluye: red social, seguir a otros usuarios, feed público, sincronización
  automática con Kindle/Apple Books (no existen APIs públicas para eso — los tags son manuales),
  ni instalación como PWA — la app es 100% web, se accede con una URL y login desde cualquier navegador.
