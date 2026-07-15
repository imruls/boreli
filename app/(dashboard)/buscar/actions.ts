"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOTE_MAX_LENGTH } from "@/lib/book-note";
import type { Book, BookStatus, BookTag } from "@/types/book";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// `books` es un catálogo compartido: la policy de RLS solo permite select
// público e insert autenticado, sin policy de update (ver data-model.md).
// Por eso resolvemos el id con "select, y si no existe insert" en vez de un
// upsert real — un upsert con ON CONFLICT DO UPDATE fallaría por RLS al no
// haber permiso de update sobre la fila existente.
async function resolveBookId(supabase: SupabaseServerClient, book: Book): Promise<string> {
  if (book.googleBooksId) {
    const { data: existing, error: selectError } = await supabase
      .from("books")
      .select("id")
      .eq("google_books_id", book.googleBooksId)
      .maybeSingle();
    if (selectError) throw selectError;
    if (existing) return existing.id;
  }

  const { data: inserted, error: insertError } = await supabase
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

  if (insertError) {
    // 23505 = unique_violation: dos altas simultáneas del mismo libro nuevo
    // (misma carrera que resuelve el `unique` de google_books_id).
    if (insertError.code === "23505" && book.googleBooksId) {
      const { data: existing, error: selectError } = await supabase
        .from("books")
        .select("id")
        .eq("google_books_id", book.googleBooksId)
        .single();
      if (selectError) throw selectError;
      return existing.id;
    }
    throw insertError;
  }

  return inserted.id;
}

// Alta de un libro a la biblioteca del usuario desde la búsqueda: resuelve
// (o crea) la fila en `books` y hace upsert en `user_books` por
// (user_id, book_id) — así re-agregar un libro ya existente actualiza el
// status/tags en vez de duplicar la fila.
export async function addBookToLibrary(
  book: Book,
  status: BookStatus,
  tags: BookTag[],
  rating?: number,
  note?: string,
) {
  if (status === "read" && (!rating || rating < 1 || rating > 5)) {
    throw new Error("El rating (1-5) es obligatorio para marcar un libro como leído");
  }
  if (note && note.length > NOTE_MAX_LENGTH) {
    throw new Error(`La reseña no puede superar los ${NOTE_MAX_LENGTH} caracteres`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const bookId = await resolveBookId(supabase, book);

  const { error } = await supabase.from("user_books").upsert(
    {
      user_id: user.id,
      book_id: bookId,
      status,
      tags,
      // Fuera de "leído" no puede quedar rating ni reseña (constraints
      // `rating_requires_read` / `note_requires_read` en data-model.md).
      rating: status === "read" ? (rating as number) : null,
      note: status === "read" ? (note?.trim() || null) : null,
      started_at: status === "reading" ? new Date().toISOString() : null,
      finished_at: status === "read" ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,book_id" },
  );

  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/quiero-leer");
  revalidatePath("/leidos");
}
