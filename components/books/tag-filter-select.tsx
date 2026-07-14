"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOOK_TAGS, BOOK_TAG_LABELS } from "@/lib/book-tags";
import type { BookTag } from "@/types/book";

export type TagFilterValue = BookTag | "all";

// Dropdown de filtro por formato para una lista de libros. Mismo patrón que
// book-sort-select.tsx (ambos son Select de shadcn en vez de chips, para que
// la fila de controles de book-list-with-filter.tsx quede compacta).
export function TagFilterSelect({
  value,
  onChange,
}: {
  value: TagFilterValue;
  onChange: (value: TagFilterValue) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as TagFilterValue)}>
      <SelectTrigger
        size="sm"
        className="border-ink-border bg-cream text-xs font-semibold text-ink-muted"
        aria-label="Filtrar por formato"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="all">Todos</SelectItem>
        {BOOK_TAGS.map((tag) => (
          <SelectItem key={tag} value={tag}>
            {BOOK_TAG_LABELS[tag]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
