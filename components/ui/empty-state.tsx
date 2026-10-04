import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

// Estado vacío/error genérico, equivalente a `ContentUnavailableView` de iOS
// (ver design-system.md → "Estados vacíos"): ícono grande en `label-tertiary`,
// título, descripción en `label-secondary` y como mucho una acción. Se reusa
// para biblioteca vacía, sin resultados, sin conexión y errores.
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 px-8 py-16 text-center",
        className,
      )}
    >
      <Icon className="mb-2 size-12 text-label-tertiary" strokeWidth={1.75} aria-hidden />
      <h2 className="text-title-2 text-label">{title}</h2>
      {description ? <p className="max-w-xs text-body text-label-secondary">{description}</p> : null}
      {action ? (
        action.href ? (
          <Button asChild size="sm" className="mt-3">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button size="sm" className="mt-3" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      ) : null}
    </div>
  );
}
