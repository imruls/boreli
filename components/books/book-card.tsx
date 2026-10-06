import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCardProps {
  title: string;
  authors: string[];
  coverUrl?: string | null;
  // Portadas de Google Books (dominio fijo, en la whitelist de
  // `next.config.ts`) son confiables y se optimizan con `next/image`. Las de
  // carga manual vienen de una URL arbitraria del usuario: para esas NO
  // queremos que nuestro servidor haga el fetch (riesgo de SSRF si la URL
  // apunta a infraestructura interna), así que se renderizan con un `<img>`
  // nativo, que el navegador del usuario resuelve directo. Default `false`
  // (seguro por default) — los call-sites que sepan que el libro viene de
  // Google Books deben pasar `true` explícitamente.
  trustedCover?: boolean;
  coverSize?: "sm" | "lg";
  // "list" (default): fila horizontal cover+texto, como siempre. "grid":
  // card vertical con la portada arriba a todo el ancho — usado por las
  // vistas en grilla (ej. Leídos).
  layout?: "list" | "grid";
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  // Si se pasa, toda la card (salvo `action`, que gestiona su propio click)
  // se vuelve tocable — usado por `UserBookCard` para abrir el detalle del
  // libro. Sin esto la card es puramente presentacional (ej. resultados de
  // Buscar, que solo reaccionan al botón "+" de `action`).
  onClick?: () => void;
}

// Marco de portada (ver design-system.md → "Portadas"): radio 6px y un borde
// interior de 0.5px que separa la portada del fondo en los dos modos.
export const COVER_FRAME_CLASS =
  "relative overflow-hidden rounded-[6px] bg-fill after:pointer-events-none after:absolute after:inset-0 after:rounded-[6px] after:ring-[0.5px] after:ring-black/10 after:ring-inset dark:after:ring-white/10";

export function BookCover({
  title,
  coverUrl,
  trustedCover,
  placeholderIconClass,
}: {
  title: string;
  coverUrl?: string | null;
  trustedCover: boolean;
  placeholderIconClass: string;
}) {
  if (!coverUrl) {
    return (
      <div className="flex size-full items-center justify-center bg-fill text-label-tertiary">
        <BookOpen className={placeholderIconClass} aria-hidden />
      </div>
    );
  }

  // `object-contain` (en vez de `object-cover`) para que la portada se vea
  // completa siempre, sin recortar bordes por ajustarse al contenedor —
  // aunque su relación de aspecto no sea exactamente 2:3, se ve entera con
  // el fondo `bg-fill` como "marco" en vez de cropearla.
  if (trustedCover) {
    return (
      <Image src={coverUrl} alt={title} width={96} height={144} className="size-full object-contain" />
    );
  }

  // Portada de URL arbitraria (carga manual): la carga el navegador, no
  // nuestro servidor, para no exponer el proxy de next/image a un SSRF
  // contra una URL que no controlamos.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={coverUrl}
      alt={title}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="size-full object-contain"
    />
  );
}

// Contenedor de una lista de `BookCard`: lista agrupada (filas) o grilla de
// portadas sin card, como la biblioteca de Apple Books.
export function BookList({
  layout = "list",
  className,
  children,
}: {
  layout?: "list" | "grid";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ul
      className={cn(
        layout === "grid"
          ? "grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4"
          : "overflow-hidden rounded-[10px] bg-surface",
        className,
      )}
    >
      {children}
    </ul>
  );
}

// Libro dentro de un `BookList`: cover + título/autor + meta (rating/tag) +
// footer (ej. progreso) + action (ej. "⋯" o "+"). En lista es una fila de
// lista agrupada (separador con inset alineado al texto); en grilla, portada
// con título y autor debajo.
export function BookCard({
  title,
  authors,
  coverUrl,
  trustedCover = false,
  coverSize = "sm",
  layout = "list",
  meta,
  footer,
  action,
  className,
  onClick,
}: BookCardProps) {
  const isGrid = layout === "grid";

  // Patrón "stretched link": el título es el botón principal y su área táctil
  // (`::after`) cubre toda la celda, mientras "⋯"/"+"/footer quedan por encima
  // como hermanos (`relative z-10`) en vez de anidados dentro de otro control
  // interactivo, que los lectores de pantalla no manejan bien.
  const titleText = (
    <span
      className={cn(
        "line-clamp-2 text-label",
        isGrid ? "text-footnote font-semibold" : "text-headline",
      )}
    >
      {title}
    </span>
  );
  const titleElement = onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full cursor-pointer text-left outline-none",
        "after:absolute after:inset-0 after:content-[''] after:transition-colors active:after:bg-fill md:hover:after:bg-fill/50",
        "focus-visible:after:ring-2 focus-visible:after:ring-tint focus-visible:after:ring-inset",
        isGrid && "after:rounded-[6px] active:after:bg-transparent md:hover:after:bg-transparent",
      )}
    >
      {titleText}
    </button>
  ) : (
    titleText
  );
  const authorsText =
    authors.length > 0 ? (
      <p
        className={cn(
          "truncate text-label-secondary",
          isGrid ? "text-caption-1" : "text-subheadline",
        )}
      >
        {authors.join(", ")}
      </p>
    ) : null;

  if (isGrid) {
    return (
      <li className={cn("relative flex min-w-0 flex-col gap-2", className)}>
        <div
          className={cn(
            COVER_FRAME_CLASS,
            "aspect-[2/3] w-full",
            // En grilla el feedback de toque va sobre la portada (como Apple Books).
            onClick && "has-[~div_button:active]:opacity-70",
          )}
        >
          <BookCover
            title={title}
            coverUrl={coverUrl}
            trustedCover={trustedCover}
            placeholderIconClass="size-8"
          />
        </div>
        <div className="min-w-0">
          {titleElement}
          {authorsText}
        </div>
        {meta || action ? (
          // El "⋯" va en la fila de meta (estrellas/chips) para que el título
          // use todo el ancho de la celda.
          <div className="-mt-1 flex items-start justify-between gap-1">
            <div className="min-w-0 pt-2.5">{meta}</div>
            {action ? <div className="relative z-10 -mr-2 shrink-0">{action}</div> : null}
          </div>
        ) : null}
        {footer ? <div className="relative z-10">{footer}</div> : null}
      </li>
    );
  }

  // En px: las imágenes no escalan con el tamaño de texto (como en Dynamic Type),
  // así un texto grande no le quita el ancho al título.
  const coverClass = coverSize === "lg" ? "h-[112px] w-[76px]" : "h-[84px] w-[56px]";
  const placeholderIconClass = coverSize === "lg" ? "size-6" : "size-5";

  return (
    <li
      className={cn(
        "relative flex items-center gap-3 py-3 pr-2 pl-4",
        "before:absolute before:top-0 before:right-0 before:h-px before:bg-separator first:before:hidden",
        coverSize === "lg" ? "before:left-[calc(76px+1.75rem)]" : "before:left-[calc(56px+1.75rem)]",
        className,
      )}
    >
      <div className={cn(COVER_FRAME_CLASS, "shrink-0", coverClass)}>
        <BookCover
          title={title}
          coverUrl={coverUrl}
          trustedCover={trustedCover}
          placeholderIconClass={placeholderIconClass}
        />
      </div>

      <div className="min-w-0 flex-1">
        {titleElement}
        {authorsText}
        {meta ? <div className="mt-1.5">{meta}</div> : null}
        {footer ? <div className="relative z-10 mt-2">{footer}</div> : null}
      </div>

      {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
    </li>
  );
}
