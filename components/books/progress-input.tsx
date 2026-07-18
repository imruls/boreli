"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { PROGRESS_TYPE_LABELS } from "@/lib/book-progress";
import type { ProgressType } from "@/types/book";

const CHIP_CLASS =
  "rounded-full border border-ink-border px-3.5 text-xs font-semibold text-ink-muted data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-cream";

export interface ProgressValue {
  progressType: ProgressType | null;
  progressCurrent: number | null;
  progressTotalPages: number | null;
}

// Modo de elección libre por libro (percent/pages), sin importar el tag de
// formato — mismo patrón de chips que `tag-selector.tsx`, pero de selección
// única (`type="single"`, deseleccionable tocando el chip activo de nuevo).
// En modo 'pages', si el libro tiene `pageCount` se prellena como total (pero
// queda editable): ese total es propio del progreso, no pisa `book.pageCount`.
export function ProgressInput({
  value,
  onChange,
  bookPageCount,
}: {
  value: ProgressValue;
  onChange: (value: ProgressValue) => void;
  bookPageCount?: number | null;
}) {
  function handleTypeChange(next: string) {
    if (!next) {
      onChange({ progressType: null, progressCurrent: null, progressTotalPages: null });
      return;
    }

    const nextType = next as ProgressType;
    if (nextType === value.progressType) return;

    if (nextType === "pages") {
      onChange({
        progressType: "pages",
        progressCurrent: null,
        progressTotalPages: bookPageCount ?? null,
      });
    } else {
      onChange({ progressType: "percent", progressCurrent: null, progressTotalPages: null });
    }
  }

  function handleNumberChange(field: "progressCurrent" | "progressTotalPages", min: number) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const parsed = raw === "" ? null : Math.max(min, Number(raw));
      onChange({ ...value, [field]: parsed });
    };
  }

  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        type="single"
        value={value.progressType ?? ""}
        onValueChange={handleTypeChange}
        className="flex-wrap justify-start gap-2"
      >
        <ToggleGroupItem value="percent" className={CHIP_CLASS}>
          {PROGRESS_TYPE_LABELS.percent}
        </ToggleGroupItem>
        <ToggleGroupItem value="pages" className={CHIP_CLASS}>
          {PROGRESS_TYPE_LABELS.pages}
        </ToggleGroupItem>
      </ToggleGroup>

      {value.progressType === "percent" ? (
        <div className="flex items-center gap-2 text-sm text-ink">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={value.progressCurrent ?? ""}
            onChange={handleNumberChange("progressCurrent", 0)}
            className="w-20"
            aria-label="Porcentaje leído"
          />
          <span className="text-ink-muted">%</span>
        </div>
      ) : null}

      {value.progressType === "pages" ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={value.progressCurrent ?? ""}
            onChange={handleNumberChange("progressCurrent", 0)}
            className="w-20"
            aria-label="Página actual"
          />
          <span className="text-ink-muted">de</span>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={value.progressTotalPages ?? ""}
            onChange={handleNumberChange("progressTotalPages", 1)}
            className="w-20"
            aria-label="Total de páginas"
          />
          <span className="text-ink-muted">páginas</span>
        </div>
      ) : null}
    </div>
  );
}
