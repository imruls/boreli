import { LogoutButton } from "@/components/auth/logout-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-ink-border px-6 py-4">
        <span className="font-heading text-sm font-bold tracking-wide text-ink uppercase">
          Boreli
        </span>
        <LogoutButton />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
