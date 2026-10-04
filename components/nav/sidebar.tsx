"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";
import {
  SIDEBAR_ITEMS,
  SIDEBAR_LIBRARY_ITEMS,
  isNavItemActive,
  type NavItem,
} from "@/components/nav/nav-items";

// Sidebar tipo iPadOS (≥ 768px): reemplaza a la tab bar en pantallas grandes.
// Encabezado con la marca, destinos principales, sección "Mi biblioteca" y el
// usuario al pie como acceso a Perfil.
export function Sidebar({
  email,
  displayName,
  avatarUrl,
}: {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const initial = (displayName ?? email).charAt(0).toUpperCase() || "?";
  const profileActive = pathname === "/perfil" || pathname.startsWith("/perfil/");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[calc(280px+env(safe-area-inset-left))] flex-col border-r border-separator bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] md:flex">
      <Link href="/" className="flex h-16 items-center gap-2.5 px-5">
        <LogoMark className="size-8" decorative />
        <span className="font-brand text-subheadline font-bold tracking-wide text-label uppercase">
          Boreli
        </span>
      </Link>

      <nav aria-label="Principal" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pt-2">
        <SidebarList items={SIDEBAR_ITEMS} pathname={pathname} />
        <div className="flex flex-col gap-1">
          <h2 className="px-3 text-footnote font-semibold text-label-secondary">Mi biblioteca</h2>
          <SidebarList items={SIDEBAR_LIBRARY_ITEMS} pathname={pathname} />
        </div>
      </nav>

      <Link
        href="/perfil"
        aria-current={profileActive ? "page" : undefined}
        className={cn(
          "mx-3 mb-3 flex items-center gap-3 rounded-[10px] px-3 py-2.5 active:opacity-70",
          profileActive ? "bg-fill" : "hover:bg-fill/50",
        )}
      >
        <Avatar>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-fill text-label">{initial}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-subheadline font-semibold text-label">
            {displayName ?? "Perfil"}
          </span>
          <span className="truncate text-footnote text-label-secondary">{email}</span>
        </span>
      </Link>
    </aside>
  );
}

function SidebarList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const { href, label, icon: Icon, fillWhenActive } = item;
        const active = isNavItemActive(pathname, item);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-[10px] px-3 text-body text-label active:opacity-70",
                active ? "bg-fill font-semibold" : "hover:bg-fill/50",
              )}
            >
              <Icon
                className={cn("size-5", active ? "text-tint" : "text-label-secondary")}
                fill={active && fillWhenActive ? "currentColor" : "none"}
                aria-hidden
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
