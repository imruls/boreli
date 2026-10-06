import { NOTE_MAX_LENGTH } from "@/lib/book-note";
import {
  BOOK_AUTHOR_MAX_LENGTH,
  BOOK_AUTHORS_MAX_COUNT,
  BOOK_TITLE_MAX_LENGTH,
} from "@/lib/book-validation";
import type { BookStatus, BookTag } from "@/types/book";

// Contraparte de `lib/csv-export.ts`: lee el CSV que exporta Boreli, pero
// también los de Goodreads y StoryGraph (y listas armadas a mano en Excel o
// Sheets), detectando las columnas por el nombre del encabezado. Solo hace
// falta una columna de título; todo lo demás es opcional.

export const IMPORT_MAX_ROWS = 300;
export const IMPORT_MAX_FILE_BYTES = 1024 * 1024;

export interface ImportRow {
  // Número de línea en el archivo (1 = encabezado), para los mensajes.
  line: number;
  title: string;
  authors: string[];
  isbn: string | null;
  // null: el archivo no lo indica, se usa el estado por defecto que elige el usuario.
  status: BookStatus | null;
  tags: BookTag[];
  rating: number | null;
  note: string | null;
  noteTruncated: boolean;
  startedAt: string | null; // YYYY-MM-DD
  finishedAt: string | null; // YYYY-MM-DD
}

export type CsvImportResult =
  | { ok: true; rows: ImportRow[]; skippedLines: number[]; truncatedRows: number }
  | { ok: false; error: string };

type Field = "title" | "author" | "isbn" | "status" | "tags" | "rating" | "note" | "started" | "finished";

// Encabezados normalizados (sin tildes, minúsculas), en orden de prioridad:
// Goodreads trae `ISBN` e `ISBN13`, y preferimos el de 13 dígitos.
const HEADER_ALIASES: Record<Field, string[]> = {
  title: ["titulo", "title", "libro", "nombre", "book", "book title"],
  author: ["autor", "autores", "autor/es", "author", "authors", "autora"],
  isbn: ["isbn13", "isbn", "isbn/uid", "isbn 13", "isbn-13"],
  status: ["estado", "status", "exclusive shelf", "read status", "shelf", "estanteria"],
  tags: ["tags", "etiquetas", "formato", "format", "formatos"],
  rating: ["rating", "calificacion", "puntuacion", "valoracion", "my rating", "star rating", "estrellas"],
  note: ["resena", "review", "my review", "nota", "notas", "note", "notes", "comentario"],
  started: ["empezado", "started", "date started", "fecha de inicio", "inicio", "last date started"],
  finished: [
    "terminado",
    "finished",
    "date read",
    "date finished",
    "last date read",
    "fecha de lectura",
    "fecha de fin",
    "fin",
  ],
};

const STATUS_ALIASES: Record<string, BookStatus> = {
  "quiero leer": "want_to_read",
  "por leer": "want_to_read",
  pendiente: "want_to_read",
  "want to read": "want_to_read",
  "to-read": "want_to_read",
  "to read": "want_to_read",
  want_to_read: "want_to_read",
  leyendo: "reading",
  "en curso": "reading",
  reading: "reading",
  "currently-reading": "reading",
  "currently reading": "reading",
  leido: "read",
  leida: "read",
  read: "read",
  terminado: "read",
};

const TAG_ALIASES: Record<string, BookTag> = {
  fisico: "physical",
  physical: "physical",
  papel: "physical",
  paperback: "physical",
  hardcover: "physical",
  "tapa blanda": "physical",
  "tapa dura": "physical",
  kindle: "kindle",
  "apple books": "apple_books",
  ibooks: "apple_books",
  apple_books: "apple_books",
  "google books": "google_books",
  "google play books": "google_books",
  google_books: "google_books",
  pdf: "pdf",
};

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Elige el separador más frecuente en la primera línea: Excel en español
// exporta con `;` porque la coma es el separador decimal.
function detectDelimiter(text: string): string {
  const firstLine = text.slice(0, text.search(/\r?\n/) === -1 ? undefined : text.search(/\r?\n/));
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

// Parser RFC 4180: campos entre comillas con `""` como comilla escapada y
// saltos de línea dentro de comillas (reseñas de varias líneas).
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Revierte el `'` que `csv-export.ts` antepone para que Excel no tome el
// campo como fórmula, y limpia el `="..."` con el que Goodreads exporta ISBN.
function cleanCell(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^'[=+\-@\t\r]/.test(trimmed)) return trimmed.slice(1);
  const formulaString = trimmed.match(/^="(.*)"$/);
  return formulaString ? formulaString[1].trim() : trimmed;
}

function parseAuthors(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((author) => author.trim().slice(0, BOOK_AUTHOR_MAX_LENGTH))
    .filter(Boolean)
    .slice(0, BOOK_AUTHORS_MAX_COUNT);
}

function parseIsbn(value: string): string | null {
  const isbn = value.replace(/[^0-9Xx]/g, "").toUpperCase();
  return isbn.length === 10 || isbn.length === 13 ? isbn : null;
}

function parseStatus(value: string): BookStatus | null {
  return STATUS_ALIASES[normalizeText(value)] ?? null;
}

function parseTags(value: string): BookTag[] {
  const tags = value
    .split(/[,;|]/)
    .map((tag) => TAG_ALIASES[normalizeText(tag)])
    .filter((tag): tag is BookTag => Boolean(tag));
  return [...new Set(tags)];
}

// Goodreads usa 0 para "sin calificar" y StoryGraph permite medias
// estrellas (3.5): se redondea al entero más cercano.
function parseRating(value: string): number | null {
  const rating = Math.round(Number(value.replace(",", ".")));
  return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

// Reseñas de Goodreads vienen con HTML (`<br/>`); se dejan como texto plano.
function parseNote(value: string): { note: string | null; truncated: boolean } {
  const plain = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return { note: null, truncated: false };
  if (plain.length <= NOTE_MAX_LENGTH) return { note: plain, truncated: false };
  return { note: `${plain.slice(0, NOTE_MAX_LENGTH - 1).trimEnd()}…`, truncated: true };
}

function toIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    year < 1900 ||
    year > 2100
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

// `2024-05-14` / `2024/05/14` (Boreli, Goodreads, StoryGraph) o
// `14/05/2024` (día primero, como se escribe en español).
export function parseImportDate(value: string): string | null {
  const ymd = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) return toIsoDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
  const dmy = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) return toIsoDate(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  return null;
}

function mapHeaders(headers: string[]): Partial<Record<Field, number>> {
  const normalized = headers.map((header) => normalizeText(cleanCell(header)));
  const columns: Partial<Record<Field, number>> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [Field, string[]][]) {
    for (const alias of aliases) {
      const index = normalized.indexOf(alias);
      if (index !== -1) {
        columns[field] = index;
        break;
      }
    }
  }
  return columns;
}

export function parseLibraryCsv(text: string): CsvImportResult {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const [headers, ...dataRows] = rows;
  if (!headers) {
    return { ok: false, error: "El archivo está vacío." };
  }

  const columns = mapHeaders(headers);
  if (columns.title === undefined) {
    return {
      ok: false,
      error: "No encontramos una columna de título. La primera fila tiene que tener los nombres de las columnas (por ejemplo, “Título” y “Autor”).",
    };
  }

  const cell = (row: string[], field: Field) =>
    columns[field] === undefined ? "" : cleanCell(row[columns[field] as number]);

  const parsed: ImportRow[] = [];
  const skippedLines: number[] = [];
  let truncatedRows = 0;

  dataRows.forEach((row, index) => {
    const line = index + 2;
    if (row.every((value) => !value.trim())) return;

    const title = cell(row, "title").slice(0, BOOK_TITLE_MAX_LENGTH);
    if (!title) {
      skippedLines.push(line);
      return;
    }
    if (parsed.length >= IMPORT_MAX_ROWS) {
      truncatedRows++;
      return;
    }

    const rating = parseRating(cell(row, "rating"));
    // Sin estado pero con calificación: solo puede ser un libro leído.
    const status = parseStatus(cell(row, "status")) ?? (rating !== null ? "read" : null);
    const { note, truncated } = parseNote(cell(row, "note"));

    parsed.push({
      line,
      title,
      authors: parseAuthors(cell(row, "author")),
      isbn: parseIsbn(cell(row, "isbn")),
      status,
      tags: parseTags(cell(row, "tags")),
      rating,
      note,
      noteTruncated: truncated,
      startedAt: parseImportDate(cell(row, "started")),
      finishedAt: parseImportDate(cell(row, "finished")),
    });
  });

  if (parsed.length === 0) {
    return { ok: false, error: "El archivo no tiene libros para importar." };
  }

  return { ok: true, rows: parsed, skippedLines, truncatedRows };
}

// Clave para detectar libros que ya están en la biblioteca cuando no hay
// id de Google Books (carga manual): título + primer autor normalizados.
export function buildTitleKey(title: string, authors: string[]): string {
  return `${normalizeText(title)}|${normalizeText(authors[0] ?? "")}`;
}
