"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Destino del botón atrás: una ruta fija con el nombre de la pantalla anterior
// (`‹ Inicio`), o "history" para pantallas que se abren desde varios lugares
// (detalle de libro) y vuelven con el historial del navegador.
export type PageHeaderBack = { href: string; label: string } | "history";

// Barra de navegación de iOS (ver design-system.md → "Barra de navegación"):
// - Sin `back` (pantallas de nivel superior): Large Title debajo de la barra,
//   que al pasar por debajo de ella colapsa a un título inline centrado.
// - Con `back` (pantallas hijas): título inline centrado + botón atrás.
// La barra es transparente arriba de todo y pasa a material translúcido con
// separador cuando el contenido scrollea por debajo, como en iOS.
// Tiene que ser hijo directo del contenedor de la pantalla: `sticky` solo
// funciona dentro de los límites de su padre.
export function PageHeader({
  title,
  back,
  actions,
}: {
  title: string;
  back?: PageHeaderBack;
  actions?: React.ReactNode;
}) {
  const isTopLevel = !back;
  const barRef = useRef<HTMLElement>(null);
  const largeTitleRef = useRef<HTMLHeadingElement>(null);
  const [scrolledUnder, setScrolledUnder] = useState(false);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const bar = barRef.current;
      const largeTitle = largeTitleRef.current;
      if (!bar) return;
      setScrolledUnder(
        largeTitle
          ? largeTitle.getBoundingClientRect().bottom <= bar.getBoundingClientRect().bottom
          : window.scrollY > 0,
      );
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <header
        ref={barRef}
        className={cn(
          "sticky top-0 z-30 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-200",
          scrolledUnder
            ? "bg-background/80 shadow-[0_0.5px_0_var(--separator)] backdrop-blur-xl backdrop-saturate-150"
            : "bg-background",
        )}
      >
        {/* 3 columnas: el título centrado nunca se superpone con los botones
            de los costados, aunque el texto sea grande. */}
        <div className="grid min-h-11 grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] items-center gap-1 pr-[calc(var(--layout-margin)-0.5rem)] pl-2">
          <div className="flex min-w-0 items-center">
            {back ? <BackButton back={back} /> : null}
          </div>
          {isTopLevel ? (
            // Duplicado visual del Large Title: el h1 real es el de abajo.
            <span
              aria-hidden
              className={cn(
                "min-w-0 truncate text-center text-headline text-label transition-opacity duration-200",
                scrolledUnder ? "opacity-100" : "opacity-0",
              )}
            >
              {title}
            </span>
          ) : (
            <h1 className="min-w-0 truncate text-center text-headline text-label">
              {title}
            </h1>
          )}
          <div className="flex min-w-0 items-center justify-end">{actions}</div>
        </div>
      </header>
      {isTopLevel ? (
        <h1 ref={largeTitleRef} className="-mt-2 px-(--layout-margin) text-large-title text-label">
          {title}
        </h1>
      ) : null}
    </>
  );
}

function BackButton({ back }: { back: PageHeaderBack }) {
  const router = useRouter();
  const className =
    "flex h-11 max-w-full min-w-11 items-center gap-0.5 pr-2 text-body text-tint active:opacity-70";
  const content = (
    <>
      <ChevronLeft className="size-7 shrink-0" strokeWidth={2.25} aria-hidden />
      <span className="truncate">{back === "history" ? "Atrás" : back.label}</span>
    </>
  );

  if (back === "history") {
    return (
      <button type="button" onClick={() => router.back()} className={className}>
        {content}
      </button>
    );
  }
  return (
    <Link href={back.href} className={className}>
      {content}
    </Link>
  );
}
