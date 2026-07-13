import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { Pencil, ShieldCheck, LogOut, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(dashboard)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/nav/page-header";
import { ExportLibraryButton } from "@/components/export-library-button";

export const metadata: Metadata = {
  title: "Perfil — Boreli",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const initial = email ? email.charAt(0).toUpperCase() : "?";

  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <PageHeader title="Perfil" showBack={false} />

      <div className="flex flex-col items-center gap-2 px-4 sm:px-6">
        <Avatar size="lg">
          <AvatarFallback className="bg-ink-border text-base text-ink">{initial}</AvatarFallback>
        </Avatar>
        <p className="text-sm text-ink-muted">{email}</p>
      </div>

      <div className="flex flex-col px-4 sm:px-6">
        <ProfileRow icon={Pencil} label="Editar perfil" />
        <ProfileRow icon={ShieldCheck} label="Seguridad" />
        <ExportLibraryButton />
        <Separator />
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 py-3 text-left text-sm font-medium text-ink"
          >
            <LogOut className="size-4 text-ink-muted" />
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-1 px-4 sm:px-6">
        <p className="text-xs font-bold tracking-wide text-destructive uppercase">Zona peligrosa</p>
        <div className="flex items-center gap-3 py-3 text-sm font-medium text-destructive opacity-70">
          <Trash2 className="size-4" />
          Eliminar cuenta
        </div>
      </div>
    </div>
  );
}

// "Editar perfil" y "Seguridad" quedan solo visuales por ahora (sin destino):
// todavía no hay funcionalidad construida para esas pantallas.
function ProfileRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-ink-border py-3 text-sm font-medium text-ink-muted">
      <Icon className="size-4" />
      {label}
    </div>
  );
}
