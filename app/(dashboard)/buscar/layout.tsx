import type { Metadata } from "next";

// `buscar/page.tsx` es un Client Component ("use client"), así que no puede
// exportar `metadata` directo — Next.js solo lo permite desde Server
// Components. Este layout server-only existe únicamente para eso.
export const metadata: Metadata = {
  title: "Buscar — Boreli",
};

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
