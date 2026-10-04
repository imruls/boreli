import { getProgressLabel, getProgressPercent } from "@/lib/book-progress";
import { cn } from "@/lib/utils";
import type { ProgressType } from "@/types/book";

// Barra de solo lectura para el progreso de un libro "leyendo" — se
// normaliza a 0-100 sin importar el modo (`getProgressPercent`), pero el
// texto sí distingue porcentaje de páginas (`getProgressLabel`).
export function ProgressBar({
  progressType,
  progressCurrent,
  progressTotalPages,
  className,
}: {
  progressType: ProgressType | null;
  progressCurrent: number | null;
  progressTotalPages: number | null;
  className?: string;
}) {
  const userBook = { progressType, progressCurrent, progressTotalPages };
  const percent = getProgressPercent(userBook);
  const label = getProgressLabel(userBook);

  if (percent === null) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-label="Progreso de lectura"
        aria-valuetext={label ?? undefined}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-fill"
      >
        <div className="h-full rounded-full bg-tint" style={{ width: `${percent}%` }} />
      </div>
      {label ? <span className="shrink-0 text-footnote text-label-secondary">{label}</span> : null}
    </div>
  );
}
