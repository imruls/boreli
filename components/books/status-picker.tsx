"use client";

import { ListRow, ListSection } from "@/components/ui/list";
import { BOOK_STATUS_OPTIONS } from "@/lib/book-status";
import type { BookStatus } from "@/types/book";

// Selección única del estado de lectura como lista con check, el patrón de
// HIG para elegir una opción entre pocas (ver design-system.md → "Listas").
// Compartido por `AddToLibrarySheet` y `EditBookSheet`.
export function StatusPicker({
  value,
  onChange,
  currentStatus,
  disabled,
}: {
  value: BookStatus | null;
  onChange: (status: BookStatus) => void;
  // Estado guardado del libro, marcado como "Actual" (solo al editar).
  currentStatus?: BookStatus;
  disabled?: boolean;
}) {
  return (
    <ListSection header="Estado">
      {BOOK_STATUS_OPTIONS.map(({ status, label, icon }) => (
        <ListRow
          key={status}
          icon={icon}
          label={label}
          detail={status === currentStatus ? "Actual" : undefined}
          selected={value === status}
          onClick={() => onChange(status)}
          disabled={disabled}
        />
      ))}
    </ListSection>
  );
}
