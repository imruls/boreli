import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BarChart3, FileUp, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListRow, ListSection } from "@/components/ui/list";
import { PageHeader } from "@/components/nav/page-header";
import { ExportLibraryButton } from "@/components/export-library-button";
import { DeleteAccountSheet } from "@/components/auth/delete-account-sheet";
import { LogoutRow } from "@/components/auth/logout-row";
import { AppearancePicker } from "@/components/auth/appearance-picker";
import { THEME_COOKIE, parseThemePreference } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Perfil — Boreli",
};

// Pantalla tipo Ajustes de iOS: encabezado con avatar y secciones agrupadas;
// las acciones de cuenta (cerrar sesión, eliminar) van al final, en rojo.
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
  const theme = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Perfil" />

      <div className="flex flex-col gap-8 px-(--layout-margin)">
        <div className="flex flex-col items-center gap-1 text-center">
          <Avatar className="mb-2 size-20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-fill text-title-1 text-label-secondary">
              {initial}
            </AvatarFallback>
          </Avatar>
          {displayName ? <p className="text-title-2 text-label">{displayName}</p> : null}
          <p className="text-subheadline text-label-secondary">{email}</p>
        </div>

        <ListSection>
          <ListRow href="/perfil/editar" icon={Pencil} label="Editar perfil" />
          <ListRow href="/perfil/estadisticas" icon={BarChart3} label="Estadísticas" />
        </ListSection>

        <AppearancePicker initial={theme} />

        <ListSection footer="Descarga todos tus libros con su estado, etiquetas, calificación, reseña y fechas de lectura, o importa una lista desde un CSV (de Boreli, Goodreads o StoryGraph).">
          <ExportLibraryButton />
          <ListRow href="/perfil/importar" icon={FileUp} label="Importar biblioteca (CSV)" />
        </ListSection>

        <ListSection>
          <LogoutRow />
        </ListSection>

        <ListSection footer="Borra tu biblioteca completa y tu cuenta. No se puede deshacer.">
          <DeleteAccountSheet />
        </ListSection>
      </div>
    </div>
  );
}
