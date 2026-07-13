"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAllUserBooks } from "@/lib/queries/user-books";
import { buildLibraryCsv, buildLibraryCsvFilename } from "@/lib/csv-export";
import type { BookStatus } from "@/types/book";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Cambia el status de un libro ya en la biblioteca (home / quiero-leer /
// leidos). Ajusta started_at/finished_at/rating en la misma operación, en
// vez de en pasos separados, porque el constraint `rating_requires_read`
// (data-model.md) se evalúa sobre la fila ya actualizada: si limpiáramos el
// rating en un update aparte, un update intermedio con status != 'read' y el
// rating viejo todavía puesto violaría el constraint.
export async function changeBookStatus(userBookId: string, status: BookStatus, rating?: number) {
  if (status === "read" && (!rating || rating < 1 || rating > 5)) {
    throw new Error("El rating (1-5) es obligatorio para marcar un libro como leído");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const update: {
    status: BookStatus;
    rating: number | null;
    started_at?: string;
    finished_at?: string;
  } = {
    status,
    // Fuera de "leído" no puede quedar rating (constraint de la DB); al
    // entrar a "leído" siempre viene con un rating nuevo elegido en el sheet.
    rating: status === "read" ? (rating as number) : null,
  };
  if (status === "reading") update.started_at = new Date().toISOString();
  if (status === "read") update.finished_at = new Date().toISOString();

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
