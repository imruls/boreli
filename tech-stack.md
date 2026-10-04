# Stack técnico

## Decisiones y por qué

| Capa | Recomendación | Por qué |
|---|---|---|
| Gestor de paquetes | **pnpm** | Más rápido y eficiente en disco que npm/yarn, buen soporte en todo el ecosistema Next.js |
| Frontend | **Next.js (App Router) + TypeScript + Tailwind CSS** | Mobile-first fácil, gran comunidad, mucha documentación para nivel básico/intermedio |
| Componentes UI | **shadcn/ui** | Componentes prearmados, minimalistas, 100% personalizables — buen diseño desde el día 1 sin diseñar cada botón desde cero |
| Backend + Auth + DB | **Supabase** (Postgres) | Auth multi-usuario lista para usar (login/signup con email + password en el MVP), reglas de acceso por fila (RLS) para que cada usuario vea solo su data, sin escribir backend propio |
| Migraciones de DB | **Supabase CLI** (`supabase` como devDependency) | Versiona los cambios de esquema en `supabase/migrations/` junto con el código, en vez de correr SQL a mano en el dashboard — ver `data-model.md` |
| API de libros | **Google Books API** | Gratuita, sin OAuth para búsquedas simples |
| Hosting | **Vercel** (free tier) | Deploy directo desde GitHub, pensado para Next.js |

## Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key pública, segura para el cliente (protegida por RLS) |
| `GOOGLE_BOOKS_API_KEY` | Key para búsquedas contra Google Books API |
| `SUPABASE_SERVICE_ROLE_KEY` | Key privada (Settings → API → `service_role` secret). Bypassa RLS y habilita `auth.admin.*` — **solo** server-side vía `lib/supabase/admin.ts` (nunca en cliente). Usos: borrado de cuenta y RPCs de rate limit (login/signup/reset/búsqueda) |

Configurarlas en `.env.local` en desarrollo y como env vars del proyecto en Vercel para producción.

## Recuperación de contraseña

Usa el flujo de email por defecto de Supabase Auth (sin SMTP propio — el servicio incluido solo
envía a miembros de la organización del proyecto y tiene un límite bajo de envíos por hora):

- `app/(auth)/forgot-password/`: pide el email, aplica rate limit por IP y llama a
  `resetPasswordForEmail` con `redirectTo` a `/auth/recovery`. La respuesta es la misma exista o
  no la cuenta.
- `app/auth/recovery/route.ts`: canjea el código PKCE por una sesión (`exchangeCodeForSession`).
  El code verifier vive en una cookie, así que el link tiene que abrirse en el mismo navegador.
  Si falla, vuelve a `/forgot-password?error=link-expired`.
- `app/(auth)/reset-password/`: con esa sesión, `updateUser({ password })` y redirige a `/`.
- `lib/supabase/middleware.ts` (invocado desde `proxy.ts`): `/forgot-password` está en
  `AUTH_PATHS`, `/auth/recovery` en `PUBLIC_PATHS` (con o sin sesión) y `/reset-password` requiere
  sesión como cualquier ruta del dashboard.
- Requiere que la URL de la app (ej. `http://localhost:3000/**`) esté en **Authentication → URL
  Configuration → Redirect URLs** del dashboard de Supabase; si no, Supabase redirige a la Site URL
  y el código se pierde.
- Login, signup y borrado de cuenta aplican rate limits por IP (y por cuenta en fallos).

## Estructura de carpetas

```
app-libros/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Home: "leyendo ahora"
│   │   ├── quiero-leer/page.tsx
│   │   └── leidos/page.tsx
│   ├── api/
│   │   └── books/search/route.ts # proxy a Google Books API
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── book-card.tsx
│   ├── book-search-modal.tsx
│   ├── manual-book-form.tsx      # carga manual (ver data-model.md)
│   ├── tag-selector.tsx
│   ├── rating-input.tsx
│   └── status-filter.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # cliente para Client Components
│   │   └── server.ts              # cliente para Server Components/Actions
│   ├── google-books.ts
│   └── csv-export.ts
├── public/
│   └── brand/                    # logo Boreli en PNG, ver design-system.md
│       ├── boreli-icon.png
│       └── boreli-wordmark.png
├── types/
│   └── book.ts
├── CLAUDE.md
├── ROADMAP.md
├── data-model.md
├── tech-stack.md
├── design-system.md
└── .env.local
```

## Notas de integración

- El route handler `app/api/books/search/route.ts` actúa de proxy hacia Google Books API para no
  exponer la key en el cliente y para poder normalizar la respuesta al shape de `Book` antes de
  devolverla al front.
- El alta de un libro hace **upsert** en `books` por `google_books_id` (o inserta directo si viene
  de carga manual, sin `google_books_id`) y después un **insert** en `user_books` con
  `status: 'want_to_read'`.
