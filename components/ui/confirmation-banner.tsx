"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_DURATION_MS = 2500;

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

export function ConfirmationBanner({
  message,
  className,
}: {
  message: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-sm text-cream",
        className,
      )}
    >
      <Check className="size-4 shrink-0" />
      {message}
    </div>
  );
}
