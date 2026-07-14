"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAllUserBooks } from "@/lib/queries/user-books";
import { buildLibraryCsv, buildLibraryCsvFilename } from "@/lib/csv-export";
import type { BookStatus, BookTag } from "@/types/book";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Edita un libro ya en la biblioteca (home / quiero-leer / leidos): status,
// tags y rating juntos, desde el sheet de edición de la card. Ajusta
// started_at/finished_at/rating en la misma operación, en vez de en pasos
// separados, porque el constraint `rating_requires_read` (data-model.md) se
// evalúa sobre la fila ya actualizada: si limpiáramos el rating en un update
// aparte, un update intermedio con status != 'read' y el rating viejo
// todavía puesto violaría el constraint.
//
// A diferencia de la vieja `changeBookStatus`, started_at/finished_at solo
// se pisan cuando el status realmente cambia (se compara contra el status
// actual en la fila) — ahora este sheet también se usa para editar tags o
// corregir el rating sin tocar el status, y no queremos resetear esas
// fechas en ese caso.
export async function updateUserBook(
  userBookId: string,
  input: { status: BookStatus; tags: BookTag[]; rating?: number },
) {
  const { status, tags, rating } = input;
  if (status === "read" && (!rating || rating < 1 || rating > 5)) {
    throw new Error("El rating (1-5) es obligatorio para marcar un libro como leído");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: current } = await supabase
    .from("user_books")
    .select("status")
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .single();
  if (!current) throw new Error("Libro no encontrado");

  const update: {
    status: BookStatus;
    tags: BookTag[];
    rating: number | null;
    started_at?: string;
    finished_at?: string;
  } = {
    status,
    tags,
    // Fuera de "leído" no puede quedar rating (constraint de la DB).
    rating: status === "read" ? (rating as number) : null,
  };
  if (status === "reading" && current.status !== "reading") {
    update.started_at = new Date().toISOString();
  }
  if (status === "read" && current.status !== "read") {
    update.finished_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("user_books")
    .update(update)
    .eq("id", userBookId)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/quiero-leer");
  revalidatePath("/leidos");
}

// Elimina un libro de la biblioteca del usuario. RLS (`data-model.md`) ya
// restringe el delete a las filas del propio usuario; el `.eq("user_id", …)`
// es defensa en profundidad, no la única barrera.
export async function deleteUserBook(userBookId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("id", userBookId)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/quiero-leer");
  revalidatePath("/leidos");
}

// Devuelve el CSV como string (en vez de escribir un archivo en el server,
// que no tendría sentido en Vercel) — el botón cliente es el que arma el
// Blob y dispara la descarga en el navegador.
export async function exportLibraryCsv(): Promise<{ filename: string; csv: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const userBooks = await getAllUserBooks(supabase, user.id);

  return { filename: buildLibraryCsvFilename(), csv: buildLibraryCsv(userBooks) };
}
