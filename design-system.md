# Sistema de diseño — Boreli

Basado en el branding real de la marca (logo + paleta + tipografía provistos). Reemplaza cualquier
propuesta anterior. Es la fuente de verdad de estilo — los agentes deben usar estos valores en vez
de inventar otros.

## Marca

- **Nombre:** Boreli
- **Logo:** ícono de libro cerrado con separador/marcador, con una "B" en serif dentro. Wordmark
  "BORELI" en mayúsculas, tracking amplio.
- **Assets necesarios (pendientes):** exportar el logo en **SVG**, en versión ícono solo y versión
  ícono + wordmark, cada una en las dos variantes de color (para fondo claro y fondo oscuro — el
  brand kit ya trae ambas). Los PNG que se compartieron tienen el fondo de color incluido; para uso
  en la web conviene tener versiones con fondo transparente.
- Ubicación sugerida en el repo: `public/brand/` (`boreli-icon.svg`, `boreli-wordmark.svg`, cada una
  con sufijo `-light` / `-dark` según la variante de color de fondo donde se use).

## Paleta

Marca de dos tonos: crema cálido y un oscuro casi negro con matiz cálido (no negro puro ni gris frío).

| Uso | Token | Hex |
|---|---|---|
| Fondo claro (modo default) | `cream` | `#F1E9D8` |
| Texto / superficies sobre fondo oscuro | `cream` (mismo tono, invertido) | `#F1E9D8` |
| Fondo oscuro (secciones invertidas, footer, etc.) | `ink` | `#221D19` |
| Texto principal sobre fondo claro | `ink` | `#221D19` |
| Texto secundario / metadata | `ink-muted` | `#6B6459` (mezcla de `ink` con `cream`) |
| Borde sutil | `ink-border` | `#DED4BE` |

La marca no define colores de acento adicionales (no hay un "color de marca" tipo caramelo o azul —
es estrictamente blanco-y-negro cálido). Para la UI de la app, que sí necesita distinguir estados
visualmente, la propuesta es **no inventar colores nuevos** y resolverlo con variaciones de `ink` +
forma/ícono, para mantener la identidad fiel a la marca:

| Status | Tratamiento |
|---|---|
| `want_to_read` | Badge con borde `ink-border`, texto `ink-muted`, sin relleno |
| `reading` | Badge con relleno `ink`, texto `cream` (máxima jerarquía — es el estado "activo") |
| `read` | Badge con relleno `ink-border` (claro), texto `ink`, ícono de check |

Si más adelante la marca suma un color de acento, esta tabla es lo primero que se actualiza.

### Config de Tailwind

```ts
// tailwind.config.ts (extend.colors)
colors: {
  cream: '#F1E9D8',
  ink: { DEFAULT: '#221D19', muted: '#6B6459', border: '#DED4BE' },
}
```

## Tipografía

La tipografía de marca (Roca Two, usada en el diseño del logo) tiene licencia de Canva que no cubre
uso web autohospedado — ver nota más abajo. Por eso, para todo lo que sea texto real en el código
(títulos, wordmark en texto) se usa **Roboto Slab** como alternativa, que tiene licencia libre y
está disponible en Google Fonts. El logo en sí (imagen/SVG) sigue usando Roca Two tal cual fue
diseñado, ya que ahí no aplica la restricción de web embedding. Para UI/cuerpo se mantiene Inter.

| Elemento | Fuente | Estilo |
|---|---|---|
| Isotipo "B" + wordmark del logo (imagen) | Roca Two | Asset fijo (imagen/SVG), no se retipea |
| Wordmark / nombre de marca en texto (fuera del logo) | **Roboto Slab**, Bold | Mayúsculas, tracking amplio (`tracking-wide`) |
| Título de página (h1) | Roboto Slab | Bold, `text-2xl` a `text-3xl` |
| Título de libro (card) | Inter | Medium, `text-base` |
| Texto de cuerpo, labels de botones | Inter | Normal, `text-sm` |
| Metadata (autor, fecha) | Inter | Normal, `text-xs`, color `ink-muted` |

Roboto Slab se carga con `next/font/google`, sin archivos locales ni licencia que gestionar.

> **Nota:** el logo (imagen fija) sigue siendo Roca Two porque así se diseñó — eso no cambia. Lo que
> cambia es que ningún texto vivo del sitio (títulos, headers, etc.) usa Roca Two, para no depender
> de una licencia de web embedding que no está confirmada.

## Layout y espaciado

- Mobile-first: diseñar primero para `375px` de ancho, expandir con los breakpoints `sm` / `md` / `lg` de Tailwind.
- Grillas de libros: 2 columnas en mobile, 3-4 en `md`/`lg`.
- Espaciado consistente en múltiplos de 4 (`gap-4`, `p-4`, `p-6` para contenedores principales).
- El logo usa esquinas redondeadas (`rounded-2xl` en el contenedor del ícono) — mantener esa curvatura
  en cards y botones principales para consistencia con la marca.

## Componentes (shadcn/ui)

- Usar los componentes de shadcn/ui como base (`Button`, `Dialog`, `Badge`, `Input`, `Select`) y
  personalizarlos con la paleta `cream` / `ink` de arriba en vez de crear componentes visuales desde cero.
- Botón primario: fondo `ink`, texto `cream`, `rounded-xl`. Botón secundario: borde `ink-border`,
  fondo `cream`, texto `ink`.
- Header de la app: logo Boreli (ícono + wordmark) en `ink` sobre fondo `cream`, o invertido
  (fondo `ink`, logo en `cream`) si se usa una topbar oscura.
- `book-search-modal.tsx` y `manual-book-form.tsx` usan `Dialog` con tabs (`Tabs` de shadcn),
  fondo `cream`, bordes redondeados consistentes con el logo.
- Estados vacíos: texto corto en `ink-muted` + CTA en botón `ink` sólido.
- Loading states: skeletons de shadcn (`Skeleton`) en tono `ink-border` sobre `cream`.

## Sin ilustraciones en el MVP

Sigue sin haber ilustraciones custom en el alcance del MVP (decisión previa) — el logo es el único
asset gráfico de marca a incorporar por ahora.
