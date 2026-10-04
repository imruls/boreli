"use client";

import { Textarea } from "@/components/ui/textarea";
import { NOTE_MAX_LENGTH } from "@/lib/book-note";
import { cn } from "@/lib/utils";

// Reseña opcional (a diferencia de `RatingInput`, que es obligatorio para
// marcar un libro como leído): el usuario puede guardar sin escribir nada.
// El límite de caracteres se corta acá mismo (no solo se avisa) para que
// nunca se pueda intentar guardar algo que la DB va a rechazar por el
// constraint `note_length` (data-model.md).
export function NoteInput({
  value,
  onChange,
  className,
  textareaClassName,
}: {
  value: string;
  onChange: (note: string) => void;
  className?: string;
  textareaClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, NOTE_MAX_LENGTH))}
        placeholder="¿Qué te pareció el libro?"
        rows={3}
        maxLength={NOTE_MAX_LENGTH}
        aria-label="Reseña"
        className={textareaClassName}
      />
      <span className="self-end text-caption-1 text-label-tertiary">
        {value.length}/{NOTE_MAX_LENGTH}
      </span>
    </div>
  );
}
