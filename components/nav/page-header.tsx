import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Fila de título de pantalla (mockup: "top-bar" con flecha atrás + título).
// Visible en todos los breakpoints: AppHeader solo tiene navegación de nivel
// superior (Inicio/Buscar/Perfil), no un "volver" real, así que en desktop
// también hace falta este control explícito.
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
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-ink-border/40"
        >
          <ArrowLeft className="size-5" />
        </Link>
      ) : null}
      <h1 className="font-heading text-lg font-bold text-ink">{title}</h1>
    </div>
  );
}
