import type { createClient } from "@/lib/supabase/server";
import type { Book, BookStatus, BookTag, ProgressType, UserBook } from "@/types/book";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type BookRow = {
  id: string;
  google_books_id: string | null;
  title: string;
  authors: string[] | null;
  cover_url: string | null;
  page_count: number | null;
  description: string | null;
  published_date: string | null;
};

type UserBookRow = {
  id: string;
  user_id: string;
  book_id: string;
  status: BookStatus;
  tags: BookTag[] | null;
  rating: number | null;
  note: string | null;
  progress_type: ProgressType | null;
  progress_current: number | null;
  progress_total_pages: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  book: BookRow | null;
};

const USER_BOOK_SELECT =
  "id, user_id, book_id, status, tags, rating, note, progress_type, progress_current, " +
  "progress_total_pages, started_at, finished_at, created_at, " +
  "book:books(id, google_books_id, title, authors, cover_url, page_count, description, published_date)";

function mapBook(row: BookRow | null, fallbackBookId: string): Book {
  if (!row) {
    return {
      id: fallbackBookId,
      googleBooksId: null,
      title: "Libro sin datos",
      authors: [],
      coverUrl: null,
      pageCount: null,
      description: null,
      publishedDate: null,
    };
  }

  return {
    id: row.id,
    googleBooksId: row.google_books_id,
    title: row.title,
    authors: row.authors ?? [],
    coverUrl: row.cover_url,
    pageCount: row.page_count,
    description: row.description,
    publishedDate: row.published_date,
  };
}

function mapUserBook(row: UserBookRow): UserBook {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    status: row.status,
    tags: row.tags ?? [],
    rating: row.rating,
    note: row.note,
    progressType: row.progress_type,
    progressCurrent: row.progress_current,
    progressTotalPages: row.progress_total_pages,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    book: mapBook(row.book, row.book_id),
  };
}

export async function getUserBooksByStatus(
  supabase: SupabaseServerClient,
  userId: string,
  status: BookStatus,
): Promise<UserBook[]> {
  const { data, error } = await supabase
    .from("user_books")
    .select(USER_BOOK_SELECT)
    .eq("user_id", userId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as UserBookRow[]).map(mapUserBook);
}

// Sin filtro de status: la usa el export a CSV (Semana 4), que necesita la
// biblioteca completa en una sola pasada en vez de 3 queries por status.
export async function getAllUserBooks(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<UserBook[]> {
  const { data, error } = await supabase
    .from("user_books")
    .select(USER_BOOK_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as UserBookRow[]).map(mapUserBook);
}

// Busca el `UserBook` de un libro de Google Books ya guardado por el
// usuario, para que `/libro/[id]` sepa si debe ofrecer "Editar" (ya está en
// la biblioteca) o "Agregar a biblioteca" (todavía no). `!inner` filtra por
// una columna de la tabla joineada (`google_books_id`), que si no se fuerza
// el join a inner Supabase no permite usar en `.eq(...)`.
export async function getUserBookByGoogleBooksId(
  supabase: SupabaseServerClient,
  userId: string,
  googleBooksId: string,
): Promise<UserBook | null> {
  const { data, error } = await supabase
    .from("user_books")
    .select(
      "id, user_id, book_id, status, tags, rating, note, progress_type, progress_current, " +
        "progress_total_pages, started_at, finished_at, created_at, " +
        "book:books!inner(id, google_books_id, title, authors, cover_url, page_count, description, published_date)",
    )
    .eq("user_id", userId)
    .eq("book.google_books_id", googleBooksId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapUserBook(data as unknown as UserBookRow);
}

export async function getLibraryCounts(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Record<BookStatus, number>> {
  const { data, error } = await supabase.from("user_books").select("status").eq("user_id", userId);

  if (error) throw error;

  const counts: Record<BookStatus, number> = { want_to_read: 0, reading: 0, read: 0 };
  for (const row of (data ?? []) as { status: BookStatus }[]) {
    counts[row.status] += 1;
  }
  return counts;
}
