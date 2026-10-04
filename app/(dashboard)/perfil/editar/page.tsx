import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/nav/page-header";
import { ProfileForm } from "@/components/auth/profile-form";

export const metadata: Metadata = {
  title: "Editar perfil — Boreli",
};

export default async function EditarPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const displayName =
    typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "";
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Editar perfil" back={{ href: "/perfil", label: "Perfil" }} />

      <div className="flex flex-col px-(--layout-margin) pt-2">
        <ProfileForm email={email} displayName={displayName} avatarUrl={avatarUrl} />
      </div>
    </div>
  );
}
