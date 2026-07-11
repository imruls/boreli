import { cn } from "@/lib/utils";

// El SVG de marca real todavía está pendiente de exportar (ver design-system.md).
// Mientras tanto, se mantiene este mark de texto ya usado en login/signup/header.
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink font-heading text-lg font-bold text-cream",
        className,
      )}
    >
      B
    </span>
  );
}
