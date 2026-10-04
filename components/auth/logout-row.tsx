"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { ListRow } from "@/components/ui/list";
import { logout } from "@/app/(dashboard)/actions";

// "Cerrar sesión" como fila de lista (va dentro de una `ListSection`), en rojo
// como en Ajustes de iOS. Llama a la server action directo: `redirect` dentro
// de una transición navega a /login igual que desde un <form>.
export function LogoutRow() {
  const [isPending, startTransition] = useTransition();

  return (
    <ListRow
      icon={LogOut}
      label={isPending ? "Cerrando sesión…" : "Cerrar sesión"}
      destructive
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
    />
  );
}
