import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Pencil, ShieldCheck, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(dashboard)/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/nav/page-header";
import { ExportLibraryButton } from "@/components/export-library-button";
import { DeleteAccountSheet } from "@/components/auth/delete-account-sheet";

export const metadata: Metadata = {
  title: "Perfil — Boreli",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const displayName =
    typeof user?.user_metadata?.display_name === "string" && user.user_metadata.display_name
      ? user.user_metadata.display_name
      : null;
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const initial = (displayName ?? email).charAt(0).toUpperCase() || "?";
  const hasSecurityAnswer = typeof user?.user_metadata?.security_answer_hash === "string";

  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <PageHeader title="Perfil" showBack={false} />

      <div className="flex flex-col items-center gap-2 px-4 sm:px-6">
        <Avatar size="lg">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-ink-border text-base text-ink">{initial}</AvatarFallback>
        </Avatar>
        {displayName ? <p className="text-sm font-medium text-ink">{displayName}</p> : null}
        <p className="text-sm text-ink-muted">{email}</p>
      </div>

      <div className="flex flex-col px-4 sm:px-6">
        <Link
          href="/perfil/editar"
          className="flex items-center gap-3 border-b border-ink-border py-3 text-sm font-medium text-ink"
        >
          <Pencil className="size-4 text-ink-muted" />
          <span className="flex-1">Editar perfil</span>
          <ChevronRight className="size-4 text-ink-muted" />
        </Link>
        <Link
          href="/perfil/seguridad"
          className="flex items-center gap-3 border-b border-ink-border py-3 text-sm font-medium text-ink"
        >
          <ShieldCheck className="size-4 text-ink-muted" />
          <span className="flex-1">Seguridad</span>
          <ChevronRight className="size-4 text-ink-muted" />
        </Link>
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
        <DeleteAccountSheet hasSecurityAnswer={hasSecurityAnswer} />
      </div>
    </div>
  );
}
