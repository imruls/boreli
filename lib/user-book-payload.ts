import type { ValidatedUserBookInput } from "@/lib/book-validation";

export function buildUserBookUpsert(
  userId: string,
  bookId: string,
  input: ValidatedUserBookInput,
  nowIso = new Date().toISOString(),
) {
  const { status, tags, rating, note } = input;

  return {
    user_id: userId,
    book_id: bookId,
    status,
    tags,
    rating: status === "read" ? (rating ?? null) : null,
    note: status === "read" ? (note ?? null) : null,
    // Si una fila existente sale de reading hay que limpiar progreso en la
    // misma operación. Al re-agregar como reading se conserva el progreso
    // existente; en un insert nuevo las columnas usan su default null.
    ...(status === "reading"
      ? {}
      : {
          progress_type: null,
          progress_current: null,
          progress_total_pages: null,
        }),
    started_at: status === "reading" ? nowIso : null,
    finished_at: status === "read" ? nowIso : null,
  };
}
