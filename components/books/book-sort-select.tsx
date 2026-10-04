"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOOK_SORT_LABELS, type BookSortOption } from "@/lib/book-sort";

// Dropdown de orden para una lista de libros. Las opciones disponibles las
// decide el caller (ver book-list-with-filter.tsx): "rating" solo aplica en
// "Leídos", por eso no viene hardcodeado acá.
export function BookSortSelect({
  value,
  onChange,
  options,
}: {
  value: BookSortOption;
  onChange: (value: BookSortOption) => void;
  options: BookSortOption[];
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as BookSortOption)}>
      <SelectTrigger
        size="sm"
        aria-label="Ordenar por"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {BOOK_SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
