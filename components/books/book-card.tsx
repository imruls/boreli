import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookCardProps {
  title: string;
  authors: string[];
  coverUrl?: string | null;
  coverSize?: "sm" | "lg";
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

// Card horizontal reutilizable: cover + título/autor + meta (rating/tag) +
// footer (ej. botón "Continuar") + action (ej. botón "+" de Buscar).
export function BookCard({
  title,
  authors,
  coverUrl,
  coverSize = "sm",
  meta,
  footer,
  action,
  className,
}: BookCardProps) {
  const coverClass = coverSize === "lg" ? "h-20 w-14" : "h-14 w-10";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-ink-border bg-cream p-3",
        className,
      )}
    >
      <div className={cn("shrink-0 overflow-hidden rounded-lg bg-ink-border", coverClass)}>
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            width={80}
            height={112}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-muted">
            <BookOpen className="size-4" />
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
