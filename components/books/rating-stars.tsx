import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// `rating` solo existe si status === 'read' (data-model.md) — a diferencia
// del mockup, nunca se renderiza para libros de "Quiero leer".
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div
      role="img"
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${rating} de 5 estrellas`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn("size-3", index < rating ? "fill-tint text-tint" : "fill-none text-label-tertiary")}
        />
      ))}
    </div>
  );
}
