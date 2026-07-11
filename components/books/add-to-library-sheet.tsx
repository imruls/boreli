"use client";

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
import type { BookStatus } from "@/types/book";

const OPTIONS: { status: BookStatus; label: string; icon: LucideIcon }[] = [
  { status: "want_to_read", label: "Agregar a Quiero leer", icon: Clock },
  { status: "reading", label: "Marcar como Leyendo", icon: BookOpen },
  { status: "read", label: "Marcar como Leído", icon: CheckCircle2 },
];

// Mapea directo a los 3 status reales del modelo (want_to_read / reading /
// read) en vez de una "Biblioteca" ambigua. Solo UI por ahora: el alta real
// (upsert en `books` + insert en `user_books`) es trabajo de la Semana 2.
export function AddToLibrarySheet({
  open,
  onOpenChange,
  bookTitle,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
  onSelect?: (status: BookStatus) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-ink-border">
        <SheetHeader>
          <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Agregar a…
          </SheetTitle>
          {bookTitle ? <p className="text-sm font-medium text-ink">{bookTitle}</p> : null}
        </SheetHeader>

        <div className="flex flex-col gap-1 px-4">
          {OPTIONS.map(({ status, label, icon: Icon }) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                onSelect?.(status);
                onOpenChange(false);
              }}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-ink hover:bg-ink-border/40"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-ink-border bg-cream">
                <Icon className="size-4 text-ink" />
              </span>
              {label}
            </button>
          ))}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
