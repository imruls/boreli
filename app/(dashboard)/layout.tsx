import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppHeader userEmail={user?.email} avatarUrl={avatarUrl} />
      {/* El header y el bottom nav quedan full-bleed; el contenido se centra
          y se limita en ancho a partir de `lg` para que las listas de una
          sola columna no se estiren de punta a punta en pantallas grandes. */}
      <main className="mx-auto flex w-full flex-1 flex-col lg:max-w-2xl">
        <OfflineBanner>{children}</OfflineBanner>
      </main>
      <BottomNav />
    </div>
  );
}
