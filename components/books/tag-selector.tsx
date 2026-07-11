"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BOOK_TAGS, BOOK_TAG_LABELS } from "@/lib/book-tags";
import type { BookTag } from "@/types/book";

const CHIP_CLASS =
  "rounded-full border border-ink-border px-3.5 text-xs font-semibold text-ink-muted data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-cream";

// Multi-select: a diferencia de `tag-filter-chips.tsx` (selección única para
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
          {BOOK_TAG_LABELS[tag]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
