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

// Card horizontal reutilizable: cover + título/autor + meta (rating/tag) +
// footer (ej. botón "Continuar") + action (ej. botón "+" de Buscar).
export function BookCard({
  title,
  authors,
  coverUrl,
  trustedCover = false,
  coverSize = "sm",
  meta,
  footer,
  action,
  className,
  onClick,
}: BookCardProps) {
  // `object-contain` (en vez de `object-cover`) para que la portada se vea
  // completa siempre, sin recortar bordes por ajustarse al contenedor —
  // aunque su relación de aspecto no sea exactamente 2:3, se ve entera con
  // el fondo `bg-ink-border` como "marco" en vez de cropearla.
  const coverClass = coverSize === "lg" ? "h-28 w-20" : "h-20 w-14";
  const placeholderIconClass = coverSize === "lg" ? "size-6" : "size-5";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-ink-border bg-cream p-3",
        onClick && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ink/50 focus-visible:outline-none",
        className,
      )}
    >
      <div className={cn("shrink-0 overflow-hidden rounded-lg bg-ink-border", coverClass)}>
        {coverUrl ? (
          trustedCover ? (
            <Image
              src={coverUrl}
              alt={title}
              width={96}
              height={144}
              className="size-full object-contain"
            />
          ) : (
            // Portada de URL arbitraria (carga manual): la carga el
            // navegador, no nuestro servidor, para no exponer el proxy de
            // next/image a un SSRF contra una URL que no controlamos.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="size-full object-contain"
            />
          )
        ) : (
          <div className="flex size-full items-center justify-center text-ink-muted">
            <BookOpen className={placeholderIconClass} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        {authors.length > 0 ? (
          <p className="truncate text-xs text-ink-muted">{authors.join(", ")}</p>
        ) : null}
        {meta ? <div className="mt-1.5">{meta}</div> : null}
        {footer ? <div className="mt-2">{footer}</div> : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
