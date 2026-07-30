"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Variante de `PageHeader` con botón "Volver" que usa el historial del
// navegador en vez de un `backHref` fijo — necesario en `/libro/[id]`, que se
// puede abrir desde home, quiero-leer, leídos o buscar, y no tiene un único
// origen posible para hardcodear.
export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Volver"
      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-ink-border/40 md:hidden"
    >
      <ArrowLeft className="size-5" />
    </button>
  );
}
