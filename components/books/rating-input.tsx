"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Selector interactivo 1-5, a diferencia de `rating-stars.tsx` (solo lectura).
// Se usa exclusivamente al mover un libro a "Leído": el rating es obligatorio
// en ese momento (ver `rating_requires_read` en data-model.md), por eso no
// tiene opción de "sin rating".
export function RatingInput({
  value,
  onChange,
  className,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="radiogroup" aria-label="Calificación">
      {Array.from({ length: 5 }).map((_, index) => {
        const star = index + 1;
        const isFilled = value !== null && star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} de 5 estrellas`}
            onClick={() => onChange(star)}
            className="p-0.5"
          >
            <Star className={cn("size-6", isFilled ? "fill-ink text-ink" : "fill-none text-ink-border")} />
          </button>
        );
      })}
    </div>
  );
}
