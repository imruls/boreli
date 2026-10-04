import { Badge } from "@/components/ui/badge";
import { BOOK_STATUS_OPTIONS } from "@/lib/book-status";
import { cn } from "@/lib/utils";
import type { BookStatus } from "@/types/book";

// Tratamiento de cada estado según design-system.md → "Estados de lectura":
// "Leyendo" es el de máxima jerarquía (cápsula `tint`), "Leído" una cápsula
// `fill` y "Quiero leer" solo texto secundario. Siempre ícono + texto, nunca
// solo color.
export function BookStatusBadge({ status, className }: { status: BookStatus; className?: string }) {
  const option = BOOK_STATUS_OPTIONS.find((item) => item.status === status);
  if (!option) return null;
  const { label, icon: Icon } = option;

  if (status === "want_to_read") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-footnote text-label-secondary", className)}>
        <Icon className="size-3.5" aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <Badge variant={status === "reading" ? "default" : "outline"} className={className}>
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}
