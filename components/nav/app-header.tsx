"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "@/components/nav/nav-items";

export function AppHeader({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-30 border-b border-ink-border bg-cream px-4 py-3 sm:px-6">
      {/* El fondo del header queda full-bleed; esta fila interna se alinea
          al mismo ancho máximo que el contenido (ver dashboard layout) para
          que logo/nav/avatar no queden desperdigados en pantallas grandes. */}
      <div className="mx-auto flex w-full items-center justify-between lg:max-w-2xl">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="size-7 rounded-lg text-sm" />
          <span className="font-heading text-sm font-bold tracking-wide text-ink uppercase">
            Boreli
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                  active ? "bg-ink-border text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <Link href="/perfil" aria-label="Ir a Perfil">
          <Avatar>
            <AvatarFallback className="bg-ink-border text-ink">{initial}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
