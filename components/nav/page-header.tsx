import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Fila de título de pantalla (mockup: "top-bar" con flecha atrás + título).
// El botón de volver solo se muestra en mobile: en desktop la navegación ya
// está siempre visible en AppHeader.
export function PageHeader({
  title,
  backHref = "/",
  showBack = true,
}: {
  title: string;
  backHref?: string;
  showBack?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
      {showBack ? (
        <Link
          href={backHref}
          aria-label="Volver"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-ink-border/40 md:hidden"
        >
          <ArrowLeft className="size-5" />
        </Link>
      ) : null}
      <h1 className="font-heading text-lg font-bold text-ink">{title}</h1>
    </div>
  );
}
