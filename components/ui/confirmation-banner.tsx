"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_DURATION_MS = 2000;

// Patrón único de confirmación de éxito para toda la app (guardar libro,
// progreso, perfil, respuesta de seguridad, agregar a biblioteca): mismo
// look y mismo tiempo de auto-dismiss en todos los flujos, en vez de que
// cada pantalla resuelva el "esto se guardó" a su manera.
export function useConfirmationBanner(durationMs = DEFAULT_DURATION_MS) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const show = useCallback(
    (next: string) => {
      setMessage(next);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  return { message, show };
}

// HUD de HIG (ver design-system.md → "Feedback de acciones"): cápsula flotante
// arriba al centro, sin desplazar el layout. Se monta en <body> con un portal
// para que `fixed` no quede atrapado en un contenedor transformado (sheets).
export function ConfirmationBanner({
  message,
  className,
}: {
  message: string | null;
  className?: string;
}) {
  if (!message || typeof document === "undefined") return null;
  return createPortal(
    <div
      role="status"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] flex justify-center px-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 rounded-full bg-surface-elevated px-4 py-2.5 text-subheadline font-semibold text-label shadow-[0_8px_30px_rgb(0_0_0/18%)] ring-1 ring-separator/60 animate-in fade-in-0 slide-in-from-top-2 duration-300 motion-reduce:slide-in-from-top-0">
        <Check className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
        {message}
      </div>
    </div>,
    document.body,
  );
}
