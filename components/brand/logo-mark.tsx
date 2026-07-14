import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoBackground = "cream" | "ink";

// Isotipo real de la marca: libro cerrado + separador/marcador + "B" en serif
// (ver design-system.md). El wordmark de texto "BORELI" se escribe aparte, en
// Roboto Slab (no es parte de este asset) — ver components/nav/app-header.tsx.
const LOGO_SRC: Record<LogoBackground, string> = {
  cream: "/brand/boreli-wordmark-dark.png",
  ink: "/brand/boreli-wordmark-light.png",
};

interface LogoMarkProps {
  className?: string;
  /** Fondo sobre el que se apoya el logo: elige la variante de color correcta. */
  background?: LogoBackground;
}

export function LogoMark({ className, background = "cream" }: LogoMarkProps) {
  return (
    <Image
      src={LOGO_SRC[background]}
      alt="Boreli"
      width={44}
      height={44}
      className={cn("size-11 shrink-0", className)}
      priority
    />
  );
}
