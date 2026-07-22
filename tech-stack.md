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
| `SUPABASE_SERVICE_ROLE_KEY` | Key privada (Settings → API → `service_role` secret). Bypassa RLS y habilita `auth.admin.*` — **solo** server-side vía `lib/supabase/admin.ts` (nunca en cliente). Usos: reset de contraseña, CRUD de `user_security_answers`, borrado de cuenta, y RPCs de rate limit (login/signup/reset/búsqueda) |

Configurarlas en `.env.local` en desarrollo y como env vars del proyecto en Vercel para producción.

## Recuperación de contraseña sin servicio de email

En vez del flujo estándar de Supabase (magic link por mail — descartado por el mismo motivo que la
verificación de email, ver `ROADMAP.md`), la recuperación se resuelve con una **pregunta de seguridad
fija para todos los usuarios**:

- `lib/security-question.ts`: la pregunta (constante, sin dependencias de Node) — importable desde
  componentes de cliente para mostrarla en los formularios.
- `lib/security-answer.ts`: hash/verify versionado de la respuesta (`scrypt` + salt aleatorio y
  comparación constant-time, `node:crypto`) — **server-only**, no importar desde `"use client"`.
  Los hashes legacy SHA-256 se aceptan una vez y se migran automáticamente tras una verificación
  correcta. Incluye trabajo dummy de scrypt para enmascarar timing cuando no hay hash.
- El hash **no** vive en `user_metadata` (iría en el JWT). Se guarda en la tabla privada
  `user_security_answers` (solo `service_role`); la UI autenticada consulta el booleano
  `has_security_answer()` sin ver el hash.
- Al crear la cuenta (`app/(auth)/signup/actions.ts`) se inserta el hash con Service Role tras el
  `signUp`.
- `app/(auth)/forgot-password/`: formulario de un solo paso (email + respuesta + nueva contraseña).
  La action usa `lib/supabase/admin.ts` para rate limit por IP, lookup vía RPC, y
  `auth.admin.updateUserById()`. El rate limit por cuenta solo se cobra tras un **fallo** de
  verificación (un acierto correcto no queda bloqueado por DoS de intentos fallidos). El mensaje
  externo es siempre genérico.
- `/perfil/seguridad`: define/actualiza la respuesta exigiendo la **contraseña actual**; escribe el
  hash con Service Role.
- Login y signup también aplican rate limits por IP (y por cuenta en fallos de login).
- `lib/supabase/middleware.ts` (invocado desde `proxy.ts`): `/forgot-password` está en `AUTH_PATHS`.

La pregunta fija sigue siendo un compromiso del MVP: rate limiting y `scrypt` reducen fuerza bruta
online, pero no reemplazan un segundo factor ni un reset por email. Si la app deja de
ser de uso personal/cerrado, este flujo debe migrarse al mecanismo estándar de Supabase Auth.

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
