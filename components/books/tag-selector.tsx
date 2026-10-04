"use client";

import { Check } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BOOK_TAGS, BOOK_TAG_LABELS } from "@/lib/book-tags";
import type { BookTag } from "@/types/book";

// Chip seleccionable (ver design-system.md → "Chips de formato"): cápsula
// `fill`; seleccionado, cápsula `tint` con check.
const CHIP_CLASS =
  "group/chip h-[34px] gap-1 rounded-full bg-fill px-3.5 text-subheadline text-label hover:bg-fill active:opacity-70 data-[state=on]:bg-tint data-[state=on]:font-semibold data-[state=on]:text-on-tint focus-visible:ring-2 focus-visible:ring-tint focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// Multi-select: a diferencia de `tag-filter-select.tsx` (selección única para
// filtrar listas), un libro puede tener varios tags de formato a la vez
// (ej. físico + Kindle), por eso `type="multiple"`.
export function TagSelector({
  value,
  onChange,
}: {
  value: BookTag[];
  onChange: (value: BookTag[]) => void;
}) {
  return (
    <ToggleGroup
      type="multiple"
      value={value}
      onValueChange={(next) => onChange(next as BookTag[])}
      className="flex-wrap gap-2"
    >
      {BOOK_TAGS.map((tag) => (
        <ToggleGroupItem key={tag} value={tag} className={CHIP_CLASS}>
          <Check className="hidden size-3.5 group-data-[state=on]/chip:block" strokeWidth={3} aria-hidden />
          {BOOK_TAG_LABELS[tag]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
