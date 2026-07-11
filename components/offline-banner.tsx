"use client";

import { WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { EmptyState } from "@/components/ui/empty-state";

// Reemplaza el contenido de la pantalla por el estado "Sin conexión" del
// mockup cuando el navegador detecta que se perdió la conexión.
export function OfflineBanner({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const router = useRouter();

  if (!isOnline) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Sin conexión a Internet"
        description="Revisá tu conexión e intentá de nuevo."
        action={{ label: "Reintentar", onClick: () => router.refresh() }}
      />
    );
  }

  return <>{children}</>;
}
