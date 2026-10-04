import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Activity indicator (ver design-system.md → "Carga"): 20px, `label-secondary`
// por defecto; dentro de un botón toma el color del texto del botón.
export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      role="status"
      aria-label="Cargando"
      className={cn("size-5 animate-spin text-label-secondary motion-reduce:animate-none", className)}
    />
  );
}
