"use client";

import { UserBookCard } from "@/components/books/user-book-card";
import { BookList } from "@/components/books/book-card";
import { ConfirmationBanner, useConfirmationBanner } from "@/components/ui/confirmation-banner";
import type { UserBook } from "@/types/book";

// Wrapper cliente de la sección "Leyendo actualmente" de Home: Home es un
// Server Component, así que no puede sostener el estado del banner de
// confirmación. Sin este wrapper, cada `UserBookCard` se desmontaría apenas
// se borra su libro (revalidatePath ya sacó la fila antes de que el banner
// llegue a mostrarse) — este componente sobrevive a esa re-renderización
// porque solo cambia el prop `books`, no se remonta.
export function ReadingSection({ books }: { books: UserBook[] }) {
  const { message: confirmation, show: showConfirmation } = useConfirmationBanner();

  // Si se acaba de borrar el último libro "en lectura", `books` ya llega
  // vacío en este render, pero igual queremos que el usuario vea el cierre
  // de la acción antes de que la sección entera desaparezca.
  if (books.length === 0 && !confirmation) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-title-3 text-label">Leyendo actualmente</h2>
      <ConfirmationBanner message={confirmation} />
      {books.length > 0 ? (
        <BookList>
          {books.map((userBook) => (
            <UserBookCard
              key={userBook.id}
              userBook={userBook}
              onDeleted={(title) => showConfirmation(`"${title}" eliminado de tu biblioteca`)}
            />
          ))}
        </BookList>
      ) : null}
    </section>
  );
}
