"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
import { getVolumeById, mapVolumeToBook, searchGoogleBooks } from "@/lib/google-books";
import {
  IMPORT_CHUNK_SIZE,
  MATCH_CHUNK_SIZE,
  buildMatchQueries,
  rankCandidates,
  type ImportMatchQuery,
} from "@/lib/import-match";
import {
  BOOK_AUTHOR_MAX_LENGTH,
  BOOK_AUTHORS_MAX_COUNT,
  BOOK_ID_MAX_LENGTH,
  BOOK_TITLE_MAX_LENGTH,
  parseBookStatus,
  parseBookTags,
} from "@/lib/book-validation";
import { NOTE_MAX_LENGTH } from "@/lib/book-note";
import type { Book, BookStatus, BookTag } from "@/types/book";

const GOOGLE_CONCURRENCY = 4;
const MATCH_RESULTS = 10;
const MATCH_CACHE_SECONDS = 6 * 60 * 60;

// Una tanda de emparejado = hasta 10 filas → hasta 600 filas por hora.
const MATCH_RATE_LIMIT: RateLimitPolicy = {
  maxAttempts: 60,
  windowSeconds: 60 * 60,
  blockSeconds: 30 * 60,
};
// Se consume por cada libro que la importación agrega al catálogo
// compartido `books`. Reemplaza al trigger de la DB (30 cada 10 minutos),
// que no aplica a inserts del service role: ver
// supabase/migrations/20261006000000_books_import_service_role.sql.
const NEW_BOOKS_RATE_LIMIT: RateLimitPolicy = {
  maxAttempts: 300,
  windowSeconds: 24 * 60 * 60,
  blockSeconds: 60 * 60,
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISBN_PATTERN = /^(\d{9}[\dX]|\d{13})$/;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTitle(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > BOOK_TITLE_MAX_LENGTH) {
    throw new Error("Título inválido");
  }
  return value.trim();
}

function parseAuthors(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > BOOK_AUTHORS_MAX_COUNT) {
    throw new Error("Autores inválidos");
  }
  return value.map((author) => {
    if (typeof author !== "string" || !author.trim() || author.length > BOOK_AUTHOR_MAX_LENGTH) {
      throw new Error("Autor inválido");
    }
    return author.trim();
  });
}

function parseOptionalDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error("Fecha inválida");
  }
  return value;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

// --- Emparejado con Google Books ---------------------------------------

const getCachedSearch = unstable_cache(
  (query: string) => searchGoogleBooks(query, MATCH_RESULTS, "all"),
  ["google-books-import-match-v1"],
  { revalidate: MATCH_CACHE_SECONDS },
);

async function findCandidates(query: ImportMatchQuery): Promise<Book[]> {
  for (const q of buildMatchQueries(query)) {
    const books = await getCachedSearch(q);
    if (books.length > 0) return rankCandidates(query, books);
  }
  return [];
}

function parseMatchQuery(value: unknown): ImportMatchQuery {
  if (!isRecord(value)) throw new Error("Fila inválida");
  const isbn = value.isbn;
  if (isbn !== null && (typeof isbn !== "string" || !ISBN_PATTERN.test(isbn))) {
    throw new Error("ISBN inválido");
  }
  return {
    title: parseTitle(value.title),
    authors: parseAuthors(value.authors),
    isbn: isbn as string | null,
  };
}

export type MatchResult = { candidates: Book[] } | { error: true };

export type MatchChunkResponse =
  | { ok: true; results: MatchResult[] }
  | { ok: false; error: string };

export async function matchImportRows(rowsValue: unknown): Promise<MatchChunkResponse> {
  if (!Array.isArray(rowsValue) || rowsValue.length === 0 || rowsValue.length > MATCH_CHUNK_SIZE) {
    throw new Error("Tanda inválida");
  }
  const queries = rowsValue.map(parseMatchQuery);
  const { user } = await getAuthenticatedUser();

  try {
    const allowed = await consumeSecurityRateLimit(
      createAdminClient(),
      buildRateLimitKey("books-import-match-user", user.id),
      MATCH_RATE_LIMIT,
    );
    if (!allowed) {
      return {
        ok: false,
        error: "Importaste demasiados libros en poco tiempo. Esperá media hora y probá de nuevo.",
      };
    }
  } catch (error) {
    console.error("[import] No se pudo verificar el límite de uso", error);
    return { ok: false, error: "La importación no está disponible temporalmente." };
  }

  const results = await mapWithConcurrency(queries, GOOGLE_CONCURRENCY, async (query) => {
    try {
      return { candidates: await findCandidates(query) };
    } catch {
      return { error: true as const };
    }
  });
  return { ok: true, results };
}

// --- Guardado en la biblioteca -----------------------------------------

export type ImportItem = {
  // Libro elegido de Google Books, o null para cargarlo como manual con
  // `title`/`authors` del archivo.
  googleBooksId: string | null;
  title: string;
  authors: string[];
  status: BookStatus;
  tags: BookTag[];
  rating: number | null;
  note: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

function parseImportItem(value: unknown): ImportItem {
  if (!isRecord(value)) throw new Error("Libro inválido");

  const googleBooksId = value.googleBooksId;
  if (
    googleBooksId !== null &&
    (typeof googleBooksId !== "string" ||
      !googleBooksId ||
      googleBooksId.length > BOOK_ID_MAX_LENGTH)
  ) {
    throw new Error("Identificador de Google Books inválido");
  }

  const status = parseBookStatus(value.status);
  const isRead = status === "read";

  let rating: number | null = null;
  if (value.rating !== null) {
    if (!isRead || !Number.isInteger(value.rating) || (value.rating as number) < 1 || (value.rating as number) > 5) {
      throw new Error("Rating inválido");
    }
    rating = value.rating as number;
  }

  let note: string | null = null;
  if (value.note !== null) {
    if (!isRead || typeof value.note !== "string" || value.note.trim().length > NOTE_MAX_LENGTH) {
      throw new Error("Reseña inválida");
    }
    note = value.note.trim() || null;
  }

  return {
    googleBooksId: googleBooksId as string | null,
    title: parseTitle(value.title),
    authors: parseAuthors(value.authors),
    status,
    tags: parseBookTags(value.tags),
    rating,
    note,
    startedAt: parseOptionalDate(value.startedAt),
    finishedAt: parseOptionalDate(value.finishedAt),
  };
}

class ImportLimitError extends Error {}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type AdminClient = ReturnType<typeof createAdminClient>;

async function findBookIdByGoogleId(
  supabase: SupabaseServerClient,
  googleBooksId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("books")
    .select("id")
    .eq("google_books_id", googleBooksId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// Los datos del libro se vuelven a pedir a Google por id en el server en vez
// de confiar en lo que manda el cliente: el insert va con el service role al
// catálogo compartido, así que no puede aceptar títulos o portadas arbitrarios.
async function insertBook(
  admin: AdminClient,
  userId: string,
  book: Book,
): Promise<string> {
  const allowed = await consumeSecurityRateLimit(
    admin,
    buildRateLimitKey("books-import-new-user", userId),
    NEW_BOOKS_RATE_LIMIT,
  );
  if (!allowed) throw new ImportLimitError();

  const { data, error } = await admin
    .from("books")
    .insert({
      google_books_id: book.googleBooksId,
      title: book.title,
      authors: book.authors,
      cover_url: book.coverUrl,
      page_count: book.pageCount,
      description: book.description,
      published_date: book.publishedDate,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function resolveImportBookId(
  supabase: SupabaseServerClient,
  admin: AdminClient,
  userId: string,
  item: ImportItem,
): Promise<string | null> {
  if (!item.googleBooksId) {
    return insertBook(admin, userId, {
      id: "",
      googleBooksId: null,
      title: item.title,
      authors: item.authors,
      coverUrl: null,
      pageCount: null,
      description: null,
      publishedDate: null,
    });
  }

  const existing = await findBookIdByGoogleId(supabase, item.googleBooksId);
  if (existing) return existing;

  const volume = await getVolumeById(item.googleBooksId);
  if (!volume) return null;
  try {
    return await insertBook(admin, userId, mapVolumeToBook(volume));
  } catch (error) {
    // 23505: otro usuario agregó el mismo libro entre el select y el insert.
    if (isRecord(error) && error.code === "23505") {
      return findBookIdByGoogleId(supabase, item.googleBooksId);
    }
    throw error;
  }
}

// Mediodía UTC: la fecha del archivo no tiene hora, y así se ve el mismo día
// en cualquier zona horaria.
function toTimestamp(date: string | null): string | null {
  return date ? `${date}T12:00:00.000Z` : null;
}

function buildImportRow(userId: string, bookId: string, item: ImportItem, nowIso: string) {
  return {
    user_id: userId,
    book_id: bookId,
    status: item.status,
    tags: item.tags,
    rating: item.rating,
    note: item.note,
    started_at:
      item.status === "want_to_read" ? null : (toTimestamp(item.startedAt) ?? (item.status === "reading" ? nowIso : null)),
    finished_at: item.status === "read" ? (toTimestamp(item.finishedAt) ?? nowIso) : null,
  };
}

export type ImportItemResult = "imported" | "duplicate" | "not_found" | "error";

export type ImportChunkResponse =
  | { ok: true; results: ImportItemResult[] }
  | { ok: false; error: string; results: ImportItemResult[] };

export async function importBooks(itemsValue: unknown): Promise<ImportChunkResponse> {
  if (
    !Array.isArray(itemsValue) ||
    itemsValue.length === 0 ||
    itemsValue.length > IMPORT_CHUNK_SIZE
  ) {
    throw new Error("Tanda inválida");
  }
  const items = itemsValue.map(parseImportItem);
  const { supabase, user } = await getAuthenticatedUser();
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const results: ImportItemResult[] = new Array(items.length).fill("error");
  let limitReached = false;

  const bookIds = await mapWithConcurrency(items, GOOGLE_CONCURRENCY, async (item) => {
    if (limitReached) return null;
    try {
      return await resolveImportBookId(supabase, admin, user.id, item);
    } catch (error) {
      if (error instanceof ImportLimitError) {
        limitReached = true;
      } else {
        console.error("[import] No se pudo resolver el libro", error);
      }
      return null;
    }
  });

  // Uno por uno (y no un solo upsert) para que un libro que falla no tire
  // abajo al resto de la tanda. `ignoreDuplicates` deja intacto un libro que
  // ya estaba en la biblioteca: importar nunca pisa estado, rating ni reseña.
  for (const [index, item] of items.entries()) {
    const bookId = bookIds[index];
    if (!bookId) {
      results[index] = item.googleBooksId && !limitReached ? "not_found" : "error";
      continue;
    }
    const { data, error } = await supabase
      .from("user_books")
      .upsert(buildImportRow(user.id, bookId, item, nowIso), {
        onConflict: "user_id,book_id",
        ignoreDuplicates: true,
      })
      .select("id");
    if (error) {
      console.error("[import] No se pudo guardar el libro", error);
      results[index] = "error";
    } else {
      results[index] = data.length > 0 ? "imported" : "duplicate";
    }
  }

  if (results.includes("imported")) {
    revalidatePath("/");
    revalidatePath("/quiero-leer");
    revalidatePath("/leidos");
  }

  if (limitReached) {
    return {
      ok: false,
      error: "Llegaste al límite de libros nuevos por día. Podés importar el resto mañana.",
      results,
    };
  }
  return { ok: true, results };
}
