import { NOTE_MAX_LENGTH } from "@/lib/book-note";
import type { Book, BookStatus, BookTag, ProgressType } from "@/types/book";

export const BOOK_TITLE_MAX_LENGTH = 500;
export const BOOK_ID_MAX_LENGTH = 200;
export const BOOK_AUTHOR_MAX_LENGTH = 200;
export const BOOK_AUTHORS_MAX_COUNT = 20;
export const BOOK_COVER_URL_MAX_LENGTH = 2048;
export const BOOK_PAGE_COUNT_MAX = 100_000;
export const BOOK_DESCRIPTION_MAX_LENGTH = 50_000;
export const BOOK_PUBLISHED_DATE_MAX_LENGTH = 50;

const BOOK_STATUSES = new Set<BookStatus>(["want_to_read", "reading", "read"]);
const BOOK_TAGS = new Set<BookTag>([
  "physical",
  "google_books",
  "apple_books",
  "kindle",
  "pdf",
]);
const PROGRESS_TYPES = new Set<ProgressType>(["percent", "pages"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UnknownRecord = Record<string, unknown>;

export type ValidatedUserBookInput = {
  status: BookStatus;
  tags: BookTag[];
  rating?: number;
  note?: string;
  progressType?: ProgressType;
  progressCurrent?: number;
  progressTotalPages?: number;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new Error(`${field} inválido`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new Error(`${field} inválido`);
  }
  return normalized;
}

function nullableString(value: unknown, field: string, maxLength: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    throw new Error(`${field} inválido`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new Error(`${field} inválido`);
  }
  return normalized || null;
}

function nullableInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`${field} inválido`);
  }
  return value as number;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function parseBookStatus(value: unknown): BookStatus {
  if (typeof value !== "string" || !BOOK_STATUSES.has(value as BookStatus)) {
    throw new Error("Estado de libro inválido");
  }
  return value as BookStatus;
}

export function parseUserBookId(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error("Identificador de biblioteca inválido");
  }
  return value;
}

export function parseBookTags(value: unknown): BookTag[] {
  if (!Array.isArray(value) || value.length > BOOK_TAGS.size) {
    throw new Error("Etiquetas de libro inválidas");
  }
  const tags = value.map((tag) => {
    if (typeof tag !== "string" || !BOOK_TAGS.has(tag as BookTag)) {
      throw new Error("Etiqueta de libro inválida");
    }
    return tag as BookTag;
  });
  if (new Set(tags).size !== tags.length) {
    throw new Error("Las etiquetas de libro no pueden repetirse");
  }
  return tags;
}

export function parseBookInput(value: unknown): Book {
  if (!isRecord(value)) {
    throw new Error("Libro inválido");
  }

  const id = requiredString(value.id, "Identificador", BOOK_ID_MAX_LENGTH);
  const googleBooksId = nullableString(
    value.googleBooksId,
    "Identificador de Google Books",
    BOOK_ID_MAX_LENGTH,
  );
  const title = requiredString(value.title, "Título", BOOK_TITLE_MAX_LENGTH);

  if (!Array.isArray(value.authors) || value.authors.length > BOOK_AUTHORS_MAX_COUNT) {
    throw new Error("Autores inválidos");
  }
  const authors = value.authors.map((author) =>
    requiredString(author, "Autor", BOOK_AUTHOR_MAX_LENGTH),
  );

  const coverUrl = nullableString(value.coverUrl, "URL de portada", BOOK_COVER_URL_MAX_LENGTH);
  if (coverUrl && !isHttpUrl(coverUrl)) {
    throw new Error("URL de portada inválida");
  }

  return {
    id,
    googleBooksId,
    title,
    authors,
    coverUrl,
    pageCount: nullableInteger(value.pageCount, "Cantidad de páginas", 1, BOOK_PAGE_COUNT_MAX),
    description: nullableString(
      value.description,
      "Descripción",
      BOOK_DESCRIPTION_MAX_LENGTH,
    ),
    publishedDate: nullableString(
      value.publishedDate,
      "Fecha de publicación",
      BOOK_PUBLISHED_DATE_MAX_LENGTH,
    ),
  };
}

function parseRating(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 5) {
    throw new Error("El rating debe ser un entero entre 1 y 5");
  }
  return value as number;
}

function parseNote(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new Error("Reseña inválida");
  }
  const note = value.trim();
  if (note.length > NOTE_MAX_LENGTH) {
    throw new Error(`La reseña no puede superar los ${NOTE_MAX_LENGTH} caracteres`);
  }
  return note || undefined;
}

export function parseUserBookInput(value: unknown): ValidatedUserBookInput {
  if (!isRecord(value)) {
    throw new Error("Datos de biblioteca inválidos");
  }

  const status = parseBookStatus(value.status);
  const tags = parseBookTags(value.tags);
  const note = parseNote(value.note);
  const rating =
    status === "read"
      ? parseRating(value.rating)
      : undefined;

  if (status !== "read" && (value.rating !== undefined || note !== undefined)) {
    throw new Error("Rating y reseña solo se permiten en libros leídos");
  }

  if (status !== "reading") {
    if (
      value.progressType !== undefined ||
      value.progressCurrent !== undefined ||
      value.progressTotalPages !== undefined
    ) {
      throw new Error("El progreso solo se permite en libros en lectura");
    }
    return { status, tags, rating, note };
  }

  if (value.progressType === undefined || value.progressType === null) {
    if (value.progressCurrent !== undefined || value.progressTotalPages !== undefined) {
      throw new Error("El progreso está incompleto");
    }
    return { status, tags, rating, note };
  }

  if (
    typeof value.progressType !== "string" ||
    !PROGRESS_TYPES.has(value.progressType as ProgressType)
  ) {
    throw new Error("Tipo de progreso inválido");
  }
  const progressType = value.progressType as ProgressType;
  const progressCurrent = nullableInteger(
    value.progressCurrent,
    "Progreso actual",
    0,
    progressType === "percent" ? 100 : BOOK_PAGE_COUNT_MAX,
  );
  if (progressCurrent === null) {
    throw new Error("Falta el valor de progreso");
  }

  if (progressType === "percent") {
    if (value.progressTotalPages !== undefined && value.progressTotalPages !== null) {
      throw new Error("El porcentaje no usa un total de páginas");
    }
    return { status, tags, rating, note, progressType, progressCurrent };
  }

  const progressTotalPages = nullableInteger(
    value.progressTotalPages,
    "Total de páginas",
    1,
    BOOK_PAGE_COUNT_MAX,
  );
  if (progressTotalPages === null || progressCurrent > progressTotalPages) {
    throw new Error("El progreso por páginas es inválido");
  }

  return {
    status,
    tags,
    rating,
    note,
    progressType,
    progressCurrent,
    progressTotalPages,
  };
}

export function parseAddBookInput(
  statusValue: unknown,
  tagsValue: unknown,
  ratingValue: unknown,
  noteValue: unknown,
): ValidatedUserBookInput {
  return parseUserBookInput({
    status: statusValue,
    tags: tagsValue,
    rating: ratingValue,
    note: noteValue,
  });
}
