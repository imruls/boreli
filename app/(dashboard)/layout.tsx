import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/sidebar";
import { TabBar } from "@/components/nav/tab-bar";
import { OfflineBanner } from "@/components/offline-banner";

// Defensa en profundidad: el middleware (lib/supabase/middleware.ts) ya
// protege /(dashboard) redirigiendo a /login sin sesión, pero este chequeo
// evita depender exclusivamente de esa única capa.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  const displayName =
    typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name
      ? user.user_metadata.display_name
      : null;

  // Navegación según HIG: tab bar abajo en mobile (iPhone) y sidebar fijo en
  // ≥ 768px (iPad/Mac). El contenido se centra con el ancho de lectura de
  // iPadOS (672px) dentro del espacio que deja el sidebar. Los
  // `safe-area-inset-left/right` cubren el notch del iPhone en horizontal. El
  // padding inferior deja libre la tab bar (49px + safe area) más 32px de aire.
  return (
    <div className="flex min-h-screen flex-1 flex-col md:pl-[calc(280px+env(safe-area-inset-left))]">
      {/* Link para saltar la navegación con teclado (WCAG 2.4.1): solo se ve
          al recibir foco, antes del sidebar. */}
      <a
        href="#contenido"
        className="sr-only rounded-full bg-tint px-4 py-2 text-subheadline font-semibold text-on-tint focus-visible:not-sr-only focus-visible:fixed focus-visible:top-[calc(env(safe-area-inset-top)+0.5rem)] focus-visible:left-[calc(env(safe-area-inset-left)+0.5rem)] focus-visible:z-50"
      >
        Saltar al contenido
      </a>
      <Sidebar email={user.email ?? ""} displayName={displayName} avatarUrl={avatarUrl} />
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col pr-[env(safe-area-inset-right)] pb-[calc(49px+env(safe-area-inset-bottom)+2rem)] pl-[env(safe-area-inset-left)] outline-none md:pl-0 md:pb-8"
      >
        <OfflineBanner>{children}</OfflineBanner>
      </main>
      <TabBar />
    </div>
  );
}
