import { CheckCircle2, Clock, Home, Search, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  // Si el ícono se rellena (`fill="currentColor"`) cuando está seleccionado, como
  // los SF Symbols `.fill` de la tab bar. La lupa no tiene variante rellena en iOS.
  fillWhenActive: boolean;
  // Rutas hijas que mantienen la tab activa (en iOS se navega "dentro" de la tab).
  childPrefixes?: string[];
}

// Tabs de la tab bar (mobile). Perfil es tab propio; en el sidebar vive al pie.
export const TAB_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Inicio",
    icon: Home,
    fillWhenActive: true,
    childPrefixes: ["/quiero-leer", "/leidos", "/libro"],
  },
  { href: "/buscar", label: "Buscar", icon: Search, fillWhenActive: false },
  { href: "/perfil", label: "Perfil", icon: User, fillWhenActive: true },
];

// Destinos del sidebar (≥ 768px): las listas de la biblioteca tienen fila propia,
// como las secciones del sidebar de una app de iPad.
export const SIDEBAR_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home, fillWhenActive: true, childPrefixes: ["/libro"] },
  { href: "/buscar", label: "Buscar", icon: Search, fillWhenActive: false },
];

export const SIDEBAR_LIBRARY_ITEMS: NavItem[] = [
  { href: "/quiero-leer", label: "Quiero leer", icon: Clock, fillWhenActive: false },
  { href: "/leidos", label: "Leídos", icon: CheckCircle2, fillWhenActive: false },
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isNavItemActive(pathname: string, item: NavItem) {
  const ownMatch = item.href === "/" ? pathname === "/" : matchesPrefix(pathname, item.href);
  return ownMatch || (item.childPrefixes ?? []).some((prefix) => matchesPrefix(pathname, prefix));
}
