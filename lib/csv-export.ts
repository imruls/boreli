import { BOOK_TAG_LABELS } from "@/lib/book-tags";
import type { BookStatus, UserBook } from "@/types/book";

const STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: "Quiero leer",
  reading: "Leyendo",
  read: "Leído",
};

const HEADERS = ["Título", "Autor", "Estado", "Tags", "Rating", "Empezado", "Terminado"];

// RFC 4180: solo hace falta entrecomillar (y escapar `"` duplicándola) si el
// campo tiene coma, comilla o salto de línea — evita citar todo el archivo.
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function userBookToRow(userBook: UserBook): string[] {
  return [
    userBook.book.title,
    userBook.book.authors.join(", "),
    STATUS_LABELS[userBook.status],
    userBook.tags.map((tag) => BOOK_TAG_LABELS[tag]).join(", "),
    userBook.rating !== null ? String(userBook.rating) : "",
    formatDate(userBook.startedAt),
    formatDate(userBook.finishedAt),
  ];
}

// Arma el CSV completo (con BOM UTF-8, para que Excel no rompa los acentos)
// a partir de la biblioteca del usuario. `\r\n` como separador de línea por
// ser el que espera RFC 4180 y con el que Excel es más consistente.
export function buildLibraryCsv(userBooks: UserBook[]): string {
  const rows = [HEADERS, ...userBooks.map(userBookToRow)];
  const body = rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
  return `\uFEFF${body}`;
}

export function buildLibraryCsvFilename(date: Date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `boreli-biblioteca-${isoDate}.csv`;
}
