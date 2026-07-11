"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BOOK_TAGS, BOOK_TAG_LABELS } from "@/lib/book-tags";
import type { BookTag } from "@/types/book";

export type TagFilterValue = BookTag | "all";

const CHIP_CLASS =
  "rounded-full border border-ink-border px-3.5 text-xs font-semibold text-ink-muted data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-cream";

export function TagFilterChips({
  value,
  onChange,
}: {
  value: TagFilterValue;
  onChange: (value: TagFilterValue) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as TagFilterValue);
      }}
      className="flex-nowrap gap-2 overflow-x-auto pb-1"
    >
      <ToggleGroupItem value="all" className={CHIP_CLASS}>
        Todos
      </ToggleGroupItem>
      {BOOK_TAGS.map((tag) => (
        <ToggleGroupItem key={tag} value={tag} className={CHIP_CLASS}>
          {BOOK_TAG_LABELS[tag]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
