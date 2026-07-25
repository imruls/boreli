import { BOOK_TAGS, BOOK_TAG_LABELS } from "@/lib/book-tags";
import type { BookTag, UserBook } from "@/types/book";

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export interface MonthlyPoint {
  monthKey: string; // "YYYY-MM"
  label: string; // "Ene 2026"
  value: number;
}

export interface YearlyPoint {
  year: string; // "YYYY"
  value: number;
}

export interface TagDistributionPoint {
  tag: BookTag;
  label: string;
  count: number;
}

export interface RatingDistributionPoint {
  rating: 1 | 2 | 3 | 4 | 5;
  count: number;
}

function monthLabel(monthKey: string): string {
  const monthIndex = Number(monthKey.slice(5, 7)) - 1;
  const year = monthKey.slice(0, 4);
  return `${MONTH_LABELS[monthIndex]} ${year}`;
}

// Agrupa `items` por mes (o año) de `finishedAt`, sumando `value` para cada
// libro vía `getValue`. Se asume que `items` ya viene filtrado por
// status = 'read' (ver getUserBooksByStatus) — acá solo se ignoran
// defensivamente los libros sin finishedAt, sin volver a chequear el status.
function bucketByMonth(items: UserBook[], getValue: (item: UserBook) => number): MonthlyPoint[] {
  const totals = new Map<string, number>();

  for (const item of items) {
    if (!item.finishedAt) continue;
    const monthKey = item.finishedAt.slice(0, 7);
    totals.set(monthKey, (totals.get(monthKey) ?? 0) + getValue(item));
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, value]) => ({ monthKey, label: monthLabel(monthKey), value }));
}

function bucketByYear(items: UserBook[], getValue: (item: UserBook) => number): YearlyPoint[] {
  const totals = new Map<string, number>();

  for (const item of items) {
    if (!item.finishedAt) continue;
    const year = item.finishedAt.slice(0, 4);
    totals.set(year, (totals.get(year) ?? 0) + getValue(item));
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, value]) => ({ year, value }));
}

export function getMonthlyReadCounts(items: UserBook[]): MonthlyPoint[] {
  return bucketByMonth(items, () => 1);
}

export function getYearlyReadCounts(items: UserBook[]): YearlyPoint[] {
  return bucketByYear(items, () => 1);
}

export function getMonthlyPagesRead(items: UserBook[]): MonthlyPoint[] {
  return bucketByMonth(items, (item) => item.book.pageCount ?? 0);
}

export function getYearlyPagesRead(items: UserBook[]): YearlyPoint[] {
  return bucketByYear(items, (item) => item.book.pageCount ?? 0);
}

// Un libro puede tener varios tags a la vez, así que la suma de counts puede
// superar la cantidad de libros leídos — no es una distribución mutuamente
// excluyente.
export function getTagDistribution(items: UserBook[]): TagDistributionPoint[] {
  const counts = new Map<BookTag, number>(BOOK_TAGS.map((tag) => [tag, 0]));

  for (const item of items) {
    for (const tag of item.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return BOOK_TAGS.map((tag) => ({
    tag,
    label: BOOK_TAG_LABELS[tag],
    count: counts.get(tag) ?? 0,
  }));
}

export function getRatingDistribution(items: UserBook[]): RatingDistributionPoint[] {
  const counts = new Map<number, number>([1, 2, 3, 4, 5].map((rating) => [rating, 0]));

  for (const item of items) {
    if (item.rating === null) continue;
    counts.set(item.rating, (counts.get(item.rating) ?? 0) + 1);
  }

  return [1, 2, 3, 4, 5].map((rating) => ({
    rating: rating as 1 | 2 | 3 | 4 | 5,
    count: counts.get(rating) ?? 0,
  }));
}
