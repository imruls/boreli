# Sistema de diseño — Boreli

Fuente de verdad de estilo. La UI sigue las **Human Interface Guidelines (HIG) de Apple**, en su
versión iOS 17/18 (barras translúcidas pegadas a los bordes — **no** Liquid Glass de iOS 26), con la
identidad de marca de Boreli (crema + oscuro cálido) aplicada a los roles de color del sistema.
Los agentes deben usar estos tokens y patrones en vez de inventar valores nuevos.

Cuando algo no esté cubierto acá, la regla es: **hacer lo que haría una app nativa de iOS/iPadOS**
(Ajustes, Libros, Notas son las referencias), adaptado a la paleta de abajo.

## Principios (HIG)

- **Claridad**: el texto se lee a cualquier tamaño, los íconos son precisos, la jerarquía es obvia.
- **Deferencia**: la UI se corre del medio — el protagonista es el contenido (portadas, títulos).
  Nada de bordes, sombras o decoración que no aporte.
- **Profundidad**: capas y movimiento comunican jerarquía (sheets que suben, barras translúcidas
  sobre el contenido que scrollea).
- **Consistencia**: un mismo patrón resuelve siempre lo mismo (ver "Componentes").

## Marca

- **Nombre:** Boreli
- **Logo:** ícono de libro cerrado con separador/marcador y una "B" en serif (Roca Two, asset fijo).
  Wordmark "BORELI" en mayúsculas, tracking amplio.
- **Assets:** `public/brand/` — `boreli-icon-{dark,light}.png` y `boreli-wordmark-{dark,light}.png`.
  El sufijo es el color **del logo**: `-dark` va sobre fondo claro, `-light` sobre fondo oscuro. En
  modo oscuro se usa la variante `-light`.
- **Dónde aparece:** pantallas de auth (login/signup/recuperación) y el encabezado del sidebar en
  pantallas grandes. Dentro de la app en mobile **no** hay header global con logo: cada pantalla
  tiene su propia barra de navegación con título (patrón iOS).
- Sin ilustraciones custom en el MVP: el logo es el único asset gráfico de marca.

## Color

HIG define el color por **roles semánticos**, no por valores fijos, y cada rol tiene variante clara
y oscura. Boreli mapea su paleta de marca a esos roles. El modo se elige en **Perfil → Apariencia**: *Sistema* (por defecto,
sigue `prefers-color-scheme`), *Claro* u *Oscuro*. La elección se guarda en la cookie
`boreli-theme` (por navegador) y el servidor la aplica como `data-theme` en `<html>`, así no
hay parpadeo al cargar; el variant `dark:` de Tailwind respeta la misma regla (ver
`lib/theme.ts` y `app/globals.css`).

### Roles

| Rol (token CSS) | Equivalente HIG | Claro | Oscuro | Uso |
|---|---|---|---|---|
| `--background` | `systemGroupedBackground` | `#F1E9D8` (cream) | `#1A1613` | Fondo de toda pantalla |
| `--background-elevated` | grouped background elevado | `#F1E9D8` (cream) | `#221D19` (ink) | Fondo de sheets (en oscuro se "eleva" sobre la pantalla) |
| `--surface` | `secondarySystemGroupedBackground` | `#F6F0E3` | `#2A241F` | Celdas de listas, cards, campos |
| `--surface-elevated` | `tertiarySystemGroupedBackground` | `#F6F0E3` | `#342D27` | Sheets, popovers, menús |
| `--label` | `label` | `#221D19` (ink) | `#F1E9D8` (cream) | Texto principal |
| `--label-secondary` | `secondaryLabel` | `#625B51` | `#BAB2A5` | Autor, metadata, subtítulos |
| `--label-tertiary` | `tertiaryLabel` | `#8C8376` | `#7A7268` | Placeholders, chevrons, deshabilitado |
| `--separator` | `separator` | `#DED4BE` | `#3D352E` | Líneas de 1px entre filas |
| `--fill` | `systemFill` | `rgb(34 29 25 / 8%)` | `rgb(241 233 216 / 12%)` | Fondo de search field, segmented control, track de progreso, chips |
| `--control-selected` | segmento seleccionado | `#F6F0E3` | `#5A5149` | Segmento activo del segmented control |
| `--tint` | `tintColor` / `accentColor` | `#221D19` (ink) | `#F1E9D8` (cream) | Controles interactivos |
| `--on-tint` | — | `#F1E9D8` | `#221D19` | Texto/ícono sobre fondo `tint` |
| `--destructive` | `systemRed` (alto contraste) | `#C4001A` | `#FF6961` | Acciones destructivas, errores |

Contrastes verificados (WCAG): `label` ≥ 12.7:1 en los dos modos; `label-secondary` ≥ 4.5:1 sobre
todos los fondos donde aparece, incluido `fill` encima de `surface`/`surface-elevated` (chips,
search field) — el caso más exigente; `destructive` ≥ 5:1; `label-tertiary` ≥ 3:1 (solo placeholders/estados
deshabilitados, que WCAG exime). Cualquier color nuevo tiene que pasar la misma verificación.

### Tint sin color de acento

La marca no tiene color de acento: el tint es `ink` (claro) / `cream` (oscuro), el mismo tono que
el texto. Como HIG pide que lo interactivo se distinga de lo que no lo es, se compensa con
**forma y peso**, nunca con un color inventado:

- Botones de texto (`Editar`, `Cancelar`, `Guardar`) en **semibold**; el texto no interactivo
  nunca usa semibold en tamaño Body salvo `Headline`.
- Filas navegables siempre con chevron (`›`) en `label-tertiary`.
- Acciones principales con fondo (`filled` / `tinted`, ver Botones), no como texto suelto.
- Links dentro de texto corrido: subrayados.

### Estados de lectura

| Status | Tratamiento |
|---|---|
| `want_to_read` | Texto `label-secondary` + ícono de reloj, sin fondo |
| `reading` | Cápsula `tint` con texto `on-tint` (máxima jerarquía — es el estado "activo") |
| `read` | Cápsula `fill` con texto `label` + ícono de check |

## Tipografía

**Fuente del sistema** en toda la UI: en dispositivos Apple es SF Pro (la de HIG); en Android,
Windows y Linux cae a la fuente del sistema de cada uno. SF Pro **no** se autohospeda (su licencia
no lo permite en web).

```css
font-family: -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

**Roboto Slab** (Bold, mayúsculas, `tracking-wide`) queda **solo** para el wordmark "BORELI" en
texto. Inter se elimina.

### Escala (Dynamic Type, tamaño "Large" por defecto de iOS)

En `rem` (1rem = 16px) para que respete el tamaño de fuente que el usuario configuró en el
navegador — el equivalente web de Dynamic Type.

| Estilo HIG | Utility | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|---|
| Large Title | `text-large-title` | 34 / 41 | Bold | Título de pantalla de nivel superior (Inicio, Buscar, Perfil) |
| Title 1 | `text-title-1` | 28 / 34 | Bold | Título de pantalla de detalle de libro |
| Title 2 | `text-title-2` | 22 / 28 | Bold | Encabezado de sección destacada, título de estado vacío |
| Title 3 | `text-title-3` | 20 / 25 | Semibold | Encabezado de sección ("Leyendo actualmente") |
| Headline | `text-headline` | 17 / 22 | Semibold | Título inline de la barra de navegación, título de sheet, título de libro en filas |
| Body | `text-body` | 17 / 22 | Regular | Texto por defecto, filas de listas, inputs |
| Callout | `text-callout` | 16 / 21 | Regular | Descripciones dentro de cards |
| Subheadline | `text-subheadline` | 15 / 20 | Regular | Autor del libro, texto secundario de filas |
| Footnote | `text-footnote` | 13 / 18 | Regular | Pies de sección, ayudas bajo inputs, metadata |
| Caption 1 | `text-caption-1` | 12 / 16 | Regular | Chips de formato, timestamps |
| Caption 2 | `text-caption-2` | 11 / 13 | Medium | Labels de la tab bar |

Reglas:
- Los inputs usan **Body (17px)**: además de ser lo que pide HIG, evita que Safari iOS haga zoom
  al enfocar un campo (lo hace con < 16px).
- Énfasis con peso (semibold), no con mayúsculas. Nada de `uppercase` en la UI salvo el wordmark.
- Truncar títulos de libro a 2 líneas (`line-clamp-2`), nunca achicar la fuente para que entren.

## Layout

- **Unidad base:** 8pt (se permite 4pt para ajustes finos). Espaciados válidos: 4, 8, 12, 16, 20,
  24, 32, 44.
- **Márgenes de layout** (`layoutMargins` de UIKit): **16px** en iPhone estándar y **20px** desde
  414px (iPhone Plus/Pro Max) y en iPad. Una sola fuente de verdad: la variable
  `--layout-margin` de `app/globals.css` (`px-(--layout-margin)`); no repetir `px-4 sm:px-5`.
- **Alineaciones** (medidas en la app real con `~/.cache/boreli-qa/measure*.cjs`):
  - Título grande, encabezados de sección (`Title 3`), search field, listas y textos sueltos
    arrancan en el margen de layout.
  - Dentro de una celda, el texto va a 16px del borde; con ícono, a **60px** (ícono de 28px +
    16px), y el separador arranca exactamente ahí. Encabezados y pies de sección (`Footnote`)
    se alinean con el texto de la celda (16px).
  - Barra de navegación: chevron atrás a **8px** del borde; botones de la derecha en el margen.
  - Campos sueltos (auth): labels, ayudas y errores alineados con el texto del campo (16px
    adentro), también a la derecha ("¿Olvidaste tu contraseña?").
  - Espacio inferior en mobile: tab bar (49px) + safe area + **32px** de aire, definido una vez
    en el `<main>` del dashboard.
- **Ancho de lectura:** el contenido de una pantalla no supera **672px** (`max-w-[42rem]`),
  centrado — el "readable content guide" de iPadOS.
- **Áreas táctiles:** mínimo **44×44px** para todo lo tocable, aunque el ícono sea más chico.
- **Safe areas:** respetar `env(safe-area-inset-*)` (requiere `viewport-fit=cover`) en la tab bar,
  la barra de navegación y los sheets.
- **Grillas de libros:** 3 columnas en mobile, 4 en `sm`, 5–6 en `lg`; portadas en proporción 2:3.

### Navegación por tamaño de pantalla

| Ancho | Patrón | Equivalente |
|---|---|---|
| < 768px (`md`) | Tab bar abajo + barra de navegación arriba por pantalla | iPhone |
| ≥ 768px | Sidebar fijo a la izquierda (≈ 280px) + contenido; sin tab bar | iPad / Mac |

## Materiales y profundidad

- **Barras (navegación, tab bar):** material translúcido — fondo `--background` al 80% +
  `backdrop-blur-xl` + `backdrop-saturate-150`, con un separador de 0.5px (`--separator`) en el
  borde que toca el contenido. El separador de la barra de navegación solo aparece cuando el
  contenido scrolleó por debajo (como en iOS).
- **Sheets:** fondo `--background-elevated` con secciones en `--surface`, esquinas superiores de
  **10px**. Sin grabber: HIG lo reserva para sheets redimensionables (con detents) y los de Boreli
  tienen un solo tamaño. Overlay `rgb(0 0 0 / 40%)` sin blur.
- **Sombras:** casi nunca. HIG separa capas con color de fondo y translucidez; solo los popovers y
  menús llevan una sombra suave.
- **Radios:** 10px celdas/secciones agrupadas y search field; 12px botones grandes y cards;
  8px controles chicos; cápsula (`rounded-full`) chips y botones pequeños; 6px portadas de libros.

## Íconos

SF Symbols no se puede usar en web (su licencia lo limita a apps de plataformas Apple). Se usa
**Lucide** con estilo cercano a SF:
- `strokeWidth` 2 en tamaños ≤ 20px; 1.75 en tamaños mayores.
- El ícono toma el tamaño del texto al que acompaña (≈ 1.1 × el tamaño de fuente) y su color.
- Íconos de la tab bar y sidebar: 24px; íconos de fila de lista: 20px dentro de un área de 28px.
- Íconos rellenos (`fill="currentColor"`) solo para el estado seleccionado de la tab bar/sidebar.

## Componentes

Base: shadcn/ui, restilizado con los tokens de arriba. Si un componente de shadcn no tiene
equivalente en HIG, se adapta al patrón nativo más cercano en vez de mantener el look de shadcn.

### Barra de navegación (`PageHeader`)
- Pantallas de nivel superior (Inicio, Buscar, Perfil): **Large Title** alineado a la izquierda,
  que al scrollear colapsa a un título inline `Headline` centrado en la barra translúcida.
- Pantallas hijas (Quiero leer, Leídos, Editar perfil, Estadísticas, Libro): título inline
  `Headline` centrado + **botón atrás**: chevron izquierdo + nombre de la pantalla anterior
  (`‹ Inicio`), en `tint`. Nunca una flecha `←` suelta.
- Acciones de la pantalla a la derecha de la barra, como botones de texto semibold o íconos.

### Tab bar (mobile)
- 3 tabs: Inicio, Buscar, Perfil. Ícono 24px + label `Caption 2`.
- Seleccionado: `tint` con ícono relleno. No seleccionado: `label-secondary`.
- Altura 49px + safe area inferior. Material translúcido.

### Sidebar (≥ 768px)
- Encabezado con logo + wordmark. Lista de destinos (ícono 20px + label `Body`), alto de fila 44px.
- Seleccionado: fondo `fill`, radio 10px, texto semibold. Sin hover agresivo: `fill` al 50%.
- Avatar + nombre del usuario al pie, como acceso a Perfil.

### Listas (inset grouped)
El patrón por defecto para cualquier conjunto de filas (Mi biblioteca, Perfil, formularios de
sheets) — como Ajustes de iOS.
- Sección: fondo `--surface`, radio 10px, margen lateral de layout.
- Fila: alto mínimo 44px, padding horizontal 16px, texto `Body`. Valor secundario a la derecha en
  `label-secondary`; chevron `›` en `label-tertiary` si navega.
- Separadores de 1px `--separator` **con inset**: arrancan donde arranca el texto (no debajo del
  ícono) y no se dibujan después de la última fila.
- Ícono de fila opcional a la izquierda (20px, `label-secondary`).
- Encabezado de sección: `Footnote` en `label-secondary`, sin mayúsculas, 16px de inset.
  Pie de sección: `Footnote` en `label-secondary` (ayudas, explicaciones).
- Fila destructiva ("Eliminar cuenta", "Cerrar sesión"): texto `destructive`, centrado o alineado
  a la izquierda, sin chevron.

### Botones
| Estilo HIG | Variante | Apariencia | Uso |
|---|---|---|---|
| Filled | `default` | Fondo `tint`, texto `on-tint` semibold | La acción principal de la pantalla/sheet (una sola) |
| Tinted | `tinted` | Fondo `tint` al 12%, texto `tint` semibold | Acciones secundarias destacadas ("Agregar progreso") |
| Gray | `secondary` | Fondo `fill`, texto `label` semibold | Acciones secundarias neutras |
| Plain | `ghost` / `link` | Sin fondo, texto `tint` semibold | Botones de barra y de sheet (`Cancelar`, `Editar`) |
| Destructive | `destructive` | Texto `destructive` (plain) o fondo `destructive` con texto blanco (solo en confirmaciones) | Eliminar |

Tamaños: grande 50px de alto (radio 12px, ancho completo en formularios), mediano 44px, chico 34px
(cápsula). Estado presionado: opacidad 70% (como iOS), sin desplazamiento. Deshabilitado:
`label-tertiary` sobre `fill`.

### Campos de texto
- Dentro de una lista agrupada (forms de sheets/perfil): sin borde, la fila es el campo, label a la
  izquierda o placeholder.
- Sueltos (login/signup): fondo `--surface`, sin borde, radio 10px, alto 44px, `Body`.
- Placeholder en `label-tertiary`. Foco: anillo de 2px en `tint` (visible solo con teclado,
  `focus-visible`).
- Errores: texto `Footnote` en `destructive` debajo del campo, no cajas con ícono de candado.

### Search field
- Fondo `fill`, radio 10px, alto 36px, ícono lupa `label-secondary`, placeholder "Buscar".
- Al enfocar aparece un botón `Cancelar` (plain) a la derecha que limpia y desenfoca.
- En Buscar va debajo del Large Title, como en iOS.

### Segmented control
Reemplaza a toggle groups y selects cortos (filtro de estado, período de estadísticas, modo de
progreso % / páginas).
- Track `fill`, radio 9px, alto 32px. Segmento seleccionado: `--control-selected`, radio 7px,
  sombra mínima. Texto `Subheadline`, semibold el seleccionado.
- Máximo 5 segmentos; si hay más opciones, usar un menú (pop-up button).

### Menús y selects
Pop-up button: texto del valor actual + chevron arriba/abajo, abre un menú contextual (lista con
check en la opción activa). Reemplaza al `Select` con caja de shadcn.

### Sheets (modales)
- Siempre desde abajo en mobile; en ≥ 768px, sheet centrado tipo "form sheet" (ancho 540px, radio
  10px en las 4 esquinas).
- Encabezado como barra de navegación: `Cancelar` (plain) a la izquierda, título `Headline`
  centrado, acción de confirmación (`Guardar`, semibold) a la derecha. **Sin botón X**.
- Sheets de solo lectura (detalle): `Listo` a la derecha en vez de Cancelar/Guardar.
- Contenido en listas agrupadas: fondo `--background-elevated`, secciones en `--surface`.
- Se cierran con `Cancelar`/`Listo`, tocando el overlay o con Escape.

### Confirmaciones destructivas (action sheet)
Eliminar un libro o la cuenta pide confirmación con un **action sheet**: título corto, mensaje en
`Footnote`, botón destructivo en `destructive` y `Cancelar` separado abajo en semibold.

### Chips de formato (tags)
Cápsula `fill`, texto `Caption 1` en `label-secondary`, sin borde. Seleccionables (en el editor):
seleccionado = fondo `tint` + texto `on-tint` + check.

### Progreso
Barra de 4px, radio completo, track `fill`, relleno `tint`. Porcentaje o "pág. X de Y" en
`Footnote` `label-secondary` a la derecha.

### Rating
Estrellas rellenas en `tint`, vacías en `label-tertiary`. 28px en el editor (con área táctil de
44px por estrella), 12px en las filas.

### Portadas
Radio 6px, borde interior de 0.5px `rgb(0 0 0 / 10%)` (claro) / `rgb(255 255 255 / 10%)`
(oscuro) para separarlas del fondo. Sin portada: fondo `fill` + ícono de libro `label-tertiary`.

### Gráficos (Estadísticas)
Una sola serie en `tint`, grilla en `separator`, ejes y etiquetas en `label-secondary` (12px).
Columnas para series en el tiempo; **barras horizontales** con la etiqueta a la izquierda para
categorías con nombres largos (formatos), que en columnas no entran en mobile. Cada gráfico va en
una card `surface` con radio 12px y, si aplica, un segmented control para el período.

### Estados vacíos (`ContentUnavailableView`)
Centrado: ícono 48px `label-tertiary`, título `Title 2` (o `Title 3` si está dentro de una
sección), descripción `Body` en `label-secondary`, y como mucho un botón (filled o plain).

### Carga
- Listas: placeholders con la forma del contenido (fila con rectángulos `fill`), pulso suave.
- Acciones: spinner nativo (`activity indicator`, 20px, `label-secondary`) dentro del botón,
  reemplazando el label; el botón mantiene su ancho.

### Feedback de acciones
Confirmaciones breves ("Cambios guardados") como un HUD: cápsula `--surface-elevated` con sombra
suave, ícono + texto `Subheadline` semibold, centrada arriba, 2 segundos. Sin banners que
desplacen el layout.

## Movimiento

- Curvas: `cubic-bezier(0.32, 0.72, 0, 1)` para sheets y transiciones de pantalla (≈ spring de
  iOS); duración 300–350ms al abrir, 250ms al cerrar.
- Feedback de toque inmediato (opacidad 70% en `:active`), sin delays.
- Con `prefers-reduced-motion: reduce`: sin deslizamientos — solo fundidos de 150ms.

## Accesibilidad

Verificado con axe-core (WCAG 2.2 AA + best practices) en todas las pantallas, en claro y oscuro,
mobile y desktop, con sheets y action sheet abiertos.

- **Contraste:** los de la tabla de color (mínimo 4.5:1 en texto, 3:1 en íconos/controles),
  incluido texto secundario sobre `fill` (chips, search field).
- **Nombres accesibles:** toda acción con ícono solo lleva `aria-label`; las barras de progreso y
  las estrellas tienen nombre (`aria-label` / `role="img"`). Si el nombre ya está escrito al lado
  de una imagen (logo + "BORELI"), la imagen es decorativa (`alt=""`).
- **Sin controles anidados:** en las filas de libro el título es el botón principal y su área
  táctil cubre la fila (patrón "stretched link"); "⋯", "+" y "Agregar progreso" son hermanos por
  encima, no hijos.
- **Foco con teclado:** anillo de 2px en `tint` con offset de 2px (`:focus-visible` global, el
  patrón de iPadOS/macOS); dentro de listas agrupadas, anillo hacia adentro (el contenedor recorta).
  Link "Saltar al contenido" como primer elemento enfocable (solo visible con foco).
- **Landmarks:** un `<main>` por pantalla (dashboard y auth), `<nav>` para tab bar y sidebar.
- **Color:** no transmitir información solo con color (los estados usan ícono + texto, ver
  "Estados de lectura").
- **Tamaño de texto (Dynamic Type):** todo el texto en `rem`, así respeta el tamaño de fuente del
  navegador. Verificado al 150% en mobile (≈ el tamaño estándar más grande de iOS) y al 200% en
  desktop (WCAG 1.4.4). Como en iOS, **no escalan** con el texto las portadas ni la tab bar (en
  px); las filas dejan que el texto ocupe varias líneas y, si falta lugar, se trunca el valor de
  la derecha o el título de la barra, nunca los botones.
- **Movimiento reducido:** con `prefers-reduced-motion: reduce`, regla global en
  `app/globals.css` que anula deslizamientos y zooms y deja fundidos de 150ms. El spinner sigue
  girando (indica progreso).
- **Safe areas:** `env(safe-area-inset-*)` en barras, tab bar, sidebar, sheets, action sheet, HUD,
  contenido y auth, incluidos los insets laterales del iPhone en horizontal (verificado con
  emulación de insets).
