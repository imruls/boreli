"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TAB_ITEMS, isNavItemActive } from "@/components/nav/nav-items";

// Tab bar de iOS (mobile, < 768px). En pantallas grandes la navegación vive en
// el Sidebar. Material translúcido con separador superior, 49px + safe area.
// Íconos y labels en px: como en iOS, la tab bar no escala con el tamaño de texto.
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 bg-background/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-0.5px_0_var(--separator)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      <ul className="flex h-[49px] items-stretch pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        {TAB_ITEMS.map((item) => {
          const { href, label, icon: Icon, fillWhenActive } = item;
          const active = isNavItemActive(pathname, item);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] pt-1 text-[11px] leading-[13px] font-medium focus-visible:outline-offset-[-4px] active:opacity-70",
                  active ? "text-tint" : "text-label-secondary",
                )}
              >
                <Icon
                  className="size-[24px]"
                  strokeWidth={active && !fillWhenActive ? 2.5 : 2}
                  fill={active && fillWhenActive ? "currentColor" : "none"}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
