"use client";

import { useState } from "react";
import { Clock, BookOpen, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TagSelector } from "@/components/books/tag-selector";
import type { BookStatus, BookTag } from "@/types/book";

const OPTIONS: { status: BookStatus; label: string; icon: LucideIcon }[] = [
  { status: "want_to_read", label: "Agregar a Quiero leer", icon: Clock },
  { status: "reading", label: "Marcar como Leyendo", icon: BookOpen },
  { status: "read", label: "Marcar como Leído", icon: CheckCircle2 },
];

// Mapea directo a los 3 status reales del modelo (want_to_read / reading /
// read) en vez de una "Biblioteca" ambigua. El tag de formato es opcional y
// multi-select (`tags` es un array en el modelo). El cierre del sheet lo
// decide el padre (`onOpenChange`) recién cuando el alta real termina bien.
// El estado de `tags` se reinicia por remount: el padre debe pasar una
// `key` distinta por libro (ej. `key={book?.id}`) en vez de resetearlo acá
// con un efecto.
export function AddToLibrarySheet({
  open,
  onOpenChange,
  bookTitle,
  onSelect,
  isSaving = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
  onSelect?: (status: BookStatus, tags: BookTag[]) => void;
  isSaving?: boolean;
}) {
  const [tags, setTags] = useState<BookTag[]>([]);

  return (
    <Sheet open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <SheetContent side="bottom" className="rounded-t-2xl border-ink-border">
        <SheetHeader>
          <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Agregar a…
          </SheetTitle>
          {bookTitle ? <p className="text-sm font-medium text-ink">{bookTitle}</p> : null}
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted">Formato (opcional)</span>
            <TagSelector value={tags} onChange={setTags} />
          </div>

          <div className="flex flex-col gap-1">
            {OPTIONS.map(({ status, label, icon: Icon }) => (
              <button
                key={status}
                type="button"
                disabled={isSaving}
                onClick={() => onSelect?.(status, tags)}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-ink hover:bg-ink-border/40 disabled:opacity-50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-ink-border bg-cream">
                  <Icon className="size-4 text-ink" />
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
