"use client";

import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PROGRESS_TYPE_LABELS } from "@/lib/book-progress";
import type { ProgressType } from "@/types/book";

const NO_PROGRESS = "none";
type ProgressMode = ProgressType | typeof NO_PROGRESS;

export interface ProgressValue {
  progressType: ProgressType | null;
  progressCurrent: number | null;
  progressTotalPages: number | null;
}

// Modo de elección libre por libro (percent/pages), sin importar el tag de
// formato, con un segmented control. Como un segmented control siempre tiene
// una opción elegida, "Ninguno" es un segmento más (borra el progreso).
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
  function handleTypeChange(next: ProgressMode) {
    if (next === NO_PROGRESS) {
      onChange({ progressType: null, progressCurrent: null, progressTotalPages: null });
      return;
    }

    const nextType = next;
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
    <div className="flex flex-col gap-3">
      <SegmentedControl<ProgressMode>
        aria-label="Modo de progreso"
        value={value.progressType ?? NO_PROGRESS}
        onValueChange={handleTypeChange}
        options={[
          { value: NO_PROGRESS, label: "Ninguno" },
          { value: "percent", label: PROGRESS_TYPE_LABELS.percent },
          { value: "pages", label: PROGRESS_TYPE_LABELS.pages },
        ]}
      />

      {value.progressType === "percent" ? (
        <div className="flex items-center gap-2 text-body text-label">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={value.progressCurrent ?? ""}
            onChange={handleNumberChange("progressCurrent", 0)}
            className="w-24 bg-fill text-center"
            aria-label="Porcentaje leído"
          />
          <span className="text-label-secondary">%</span>
        </div>
      ) : null}

      {value.progressType === "pages" ? (
        <div className="flex flex-wrap items-center gap-2 text-body text-label">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={value.progressCurrent ?? ""}
            onChange={handleNumberChange("progressCurrent", 0)}
            className="w-24 bg-fill text-center"
            aria-label="Página actual"
          />
          <span className="text-label-secondary">de</span>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={value.progressTotalPages ?? ""}
            onChange={handleNumberChange("progressTotalPages", 1)}
            className="w-24 bg-fill text-center"
            aria-label="Total de páginas"
          />
          <span className="text-label-secondary">páginas</span>
        </div>
      ) : null}
    </div>
  );
}
