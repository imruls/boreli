import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

// Estado vacío/error genérico: ícono + título + descripción corta en
// ink-muted + CTA en botón ink sólido (design-system.md). Se reusa para
// biblioteca vacía, sin resultados, sin conexión y error de login.
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full border border-ink-border text-ink-muted">
        <Icon className="size-6" />
      </div>
      <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
      {description ? <p className="max-w-xs text-sm text-ink-muted">{description}</p> : null}
      {action ? (
        action.href ? (
          <Button asChild className="mt-1">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button className="mt-1" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      ) : null}
    </div>
  );
}
