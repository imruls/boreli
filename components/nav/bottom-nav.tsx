"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "@/components/nav/nav-items";

// Navegación principal en mobile. En desktop la misma info vive en AppHeader.
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-ink-border bg-cream px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-4 py-1 text-[11px] font-medium",
              active ? "text-ink" : "text-ink-muted",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
