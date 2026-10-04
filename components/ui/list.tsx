import * as React from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Lista "inset grouped" de HIG (ver design-system.md → "Listas"), el patrón
// por defecto para cualquier conjunto de filas: como Ajustes de iOS.
// Los separadores entre filas arrancan donde arranca el texto (con inset) y
// no se dibujan antes de la primera fila.

export function ListSection({
  header,
  footer,
  children,
  className,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-1.5", className)}>
      {header ? <h2 className="px-4 text-footnote text-label-secondary">{header}</h2> : null}
      <ul className="overflow-hidden rounded-[10px] bg-surface">{children}</ul>
      {footer ? <p className="px-4 text-footnote text-label-secondary">{footer}</p> : null}
    </section>
  );
}

// Separador con inset: una línea de 1px arriba de cada fila salvo la primera.
const rowSeparator =
  "relative before:absolute before:top-0 before:right-0 before:h-px before:bg-separator first:before:hidden";

type ListRowProps = {
  label: React.ReactNode;
  // Texto secundario debajo del label (ej. autor de un libro).
  description?: React.ReactNode;
  // Valor a la derecha (ej. un contador), en `label-secondary`.
  detail?: React.ReactNode;
  icon?: LucideIcon;
  // Contenido a la izquierda en lugar del ícono (ej. avatar, portada).
  leading?: React.ReactNode;
  // Check en `tint` a la derecha: selección única dentro de la sección.
  selected?: boolean;
  destructive?: boolean;
  // Por defecto, las filas con `href` muestran chevron.
  chevron?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
} & Pick<React.AriaAttributes, "aria-label" | "aria-current">;

export function ListRow({
  label,
  description,
  detail,
  icon: Icon,
  leading,
  selected,
  destructive = false,
  chevron,
  href,
  onClick,
  disabled,
  className,
  ...aria
}: ListRowProps) {
  const showChevron = chevron ?? Boolean(href);
  const hasLeading = Boolean(Icon || leading);
  const interactive = Boolean(href || onClick);

  const content = (
    <>
      {Icon ? (
        // `mr-1` + gap-3 = 16px entre ícono y texto: el texto arranca a 60px del
        // borde de la celda, justo donde arranca el separador (como Ajustes).
        <span className="mr-1 flex size-7 shrink-0 items-center justify-center">
          <Icon
            className={cn("size-5", destructive ? "text-destructive" : "text-label-secondary")}
            aria-hidden
          />
        </span>
      ) : (
        leading
      )}
      {/* `min-w-min`: el label conserva al menos su palabra más larga; si falta
          lugar, el que se trunca es el valor de la derecha. */}
      <span className="flex min-w-min flex-1 flex-col py-2.5">
        <span
          className={cn(
            "text-body break-words",
            destructive ? "text-destructive" : "text-label",
          )}
        >
          {label}
        </span>
        {description ? (
          <span className="text-subheadline break-words text-label-secondary">{description}</span>
        ) : null}
      </span>
      {detail !== undefined && detail !== null ? (
        <span className="max-w-[50%] min-w-0 truncate text-right text-body text-label-secondary">
          {detail}
        </span>
      ) : null}
      {selected ? <Check className="size-5 shrink-0 text-tint" strokeWidth={2.5} aria-hidden /> : null}
      {showChevron ? (
        <ChevronRight className="-mr-1 size-5 shrink-0 text-label-tertiary" aria-hidden />
      ) : null}
    </>
  );

  const rowClassName = cn(
    "flex min-h-11 w-full items-center gap-3 px-4 text-left",
    interactive &&
      "transition-colors outline-none active:bg-fill focus-visible:bg-fill focus-visible:ring-2 focus-visible:ring-tint focus-visible:ring-inset md:hover:bg-fill/50",
    disabled && "pointer-events-none opacity-40",
    className,
  );

  return (
    <li className={cn(rowSeparator, hasLeading ? "before:left-[3.75rem]" : "before:left-4")}>
      {href ? (
        <Link
          href={href}
          className={rowClassName}
          aria-label={aria["aria-label"]}
          aria-current={aria["aria-current"]}
        >
          {content}
        </Link>
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-pressed={selected === undefined ? undefined : selected}
          aria-label={aria["aria-label"]}
          className={rowClassName}
        >
          {content}
        </button>
      ) : (
        <div className={rowClassName}>{content}</div>
      )}
    </li>
  );
}

// Fila con contenido libre (un control, un campo, texto largo), con el mismo
// separador y padding que `ListRow`.
export function ListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={cn(rowSeparator, "px-4 py-3 before:left-4", className)}>{children}</li>;
}
