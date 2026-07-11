import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/nav/app-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppHeader userEmail={user?.email} />
      <main className="flex flex-1 flex-col">
        <OfflineBanner>{children}</OfflineBanner>
      </main>
      <BottomNav />
    </div>
  );
}
