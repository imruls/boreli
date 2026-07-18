import type { ProgressType, UserBook } from "@/types/book";

// Límites compartidos entre el input, la server action (validación) y los
// constraints `progress_bounds`/`progress_requires_reading` de la DB
// (data-model.md) — mantenerlos en sync si estos números cambian.
export const PROGRESS_PERCENT_MIN = 0;
export const PROGRESS_PERCENT_MAX = 100;

export const PROGRESS_TYPE_LABELS: Record<ProgressType, string> = {
  percent: "Porcentaje",
  pages: "Páginas",
};

// Progreso normalizado a 0-100 para renderizar la barra, sin importar el
// modo elegido. `null` si no hay progreso guardado o si faltan datos para
// calcularlo (ej. 'pages' sin total todavía).
export function getProgressPercent(userBook: {
  progressType: ProgressType | null;
  progressCurrent: number | null;
  progressTotalPages: number | null;
}): number | null {
  if (userBook.progressType === "percent" && userBook.progressCurrent !== null) {
    return userBook.progressCurrent;
  }
  if (
    userBook.progressType === "pages" &&
    userBook.progressCurrent !== null &&
    userBook.progressTotalPages
  ) {
    return Math.round((userBook.progressCurrent / userBook.progressTotalPages) * 100);
  }
  return null;
}

// Texto corto para mostrar junto a la barra (ej. "57%" o "165 / 288 páginas").
export function getProgressLabel(userBook: {
  progressType: ProgressType | null;
  progressCurrent: number | null;
  progressTotalPages: number | null;
}): string | null {
  if (userBook.progressType === "percent" && userBook.progressCurrent !== null) {
    return `${userBook.progressCurrent}%`;
  }
  if (userBook.progressType === "pages" && userBook.progressCurrent !== null) {
    return userBook.progressTotalPages
      ? `${userBook.progressCurrent} / ${userBook.progressTotalPages} páginas`
      : `${userBook.progressCurrent} páginas`;
  }
  return null;
}

export function hasProgress(userBook: Pick<UserBook, "progressType" | "progressCurrent">): boolean {
  return userBook.progressType !== null && userBook.progressCurrent !== null;
}
