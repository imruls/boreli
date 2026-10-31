import Image from "next/image";
import { cn } from "@/lib/utils";

// Isotipo real de la marca: libro cerrado + separador/marcador + "B" en serif
// (ver design-system.md). El wordmark de texto "BORELI" se escribe aparte, con
// la fuente del sistema, no es parte de este asset.
// El sufijo del archivo es el color del logo: `-dark` va sobre fondo claro y
// `-light` sobre fondo oscuro. Se alternan con el variant `dark:`, que sigue la
// apariencia elegida en Perfil (no solo `prefers-color-scheme`).
export function LogoMark({
  className,
  decorative = false,
}: {
  className?: string;
  // Si el nombre "Boreli" ya está escrito al lado (ej. sidebar), el logo es
  // decorativo: alt vacío para que el lector de pantalla no lo lea dos veces.
  decorative?: boolean;
}) {
  const alt = decorative ? "" : "Boreli";
  const common = { width: 44, height: 44, priority: true };

  return (
    <>
      <Image
        {...common}
        alt={alt}
        src="/brand/boreli-wordmark-dark.png"
        className={cn("size-11 shrink-0 dark:hidden", className)}
      />
      <Image
        {...common}
        alt={alt}
        src="/brand/boreli-wordmark-light.png"
        className={cn("hidden size-11 shrink-0 dark:block", className)}
      />
    </>
  );
}
