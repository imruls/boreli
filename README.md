# Boreli 📖

Boreli es una app web (no PWA, sin instalación) para registrar los libros que leés, querés leer y
ya leíste, con rating, reseña personal y etiquetas de formato (físico / Google Books / Apple Books /
Kindle / PDF). Mobile-first, con soporte desktop. Acceso 100% vía navegador con URL + login — cada
usuario ve solo su propia biblioteca.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) (Postgres + Auth + RLS)
- [Google Books API](https://developers.google.com/books) para búsqueda
- [pnpm](https://pnpm.io) como gestor de paquetes
- Deploy en [Vercel](https://vercel.com)

Ver `tech-stack.md` para el detalle y justificación de cada decisión.

## Empezar

Instalar dependencias:

```bash
pnpm install
```

Configurar las variables de entorno en `.env.local` (ver tabla completa en `tech-stack.md`):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_BOOKS_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Correr el servidor de desarrollo:

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm lint` | Lint |
| `pnpm tsc --noEmit` | Type check |
| `pnpm exec supabase migration new <nombre>` | Crea una migración de DB nueva |
| `pnpm db:login` / `pnpm db:link` | Autenticación y link con el proyecto de Supabase (una vez por máquina) |
| `pnpm db:push` | Aplica las migraciones pendientes al proyecto de Supabase linkeado |

## Documentación del proyecto

Este repo se organiza con documentos de referencia en la raíz, pensados tanto para uso humano como
para agentes de código:

- [`CLAUDE.md`](./CLAUDE.md) — reglas de negocio inquebrantables, stack y comandos.
- [`ROADMAP.md`](./ROADMAP.md) — plan de fases con checklist de progreso.
- [`data-model.md`](./data-model.md) — esquema SQL completo + tipos TypeScript. Fuente de verdad
  del modelo de datos.
- [`tech-stack.md`](./tech-stack.md) — stack, variables de entorno y estructura de carpetas.
- [`design-system.md`](./design-system.md) — paleta, tipografía y logo de la marca Boreli.

## Estructura

Rutas en `/app`, componentes en `/components`, helpers en `/lib`, tipos en `/types`. Detalle
completo en `tech-stack.md`.
