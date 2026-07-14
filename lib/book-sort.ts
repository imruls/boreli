import type { UserBook } from "@/types/book";

// Fuente de verdad de las opciones de orden: types/book.ts (a su vez,
// data-model.md). "rating" solo tiene sentido para libros "leídos" — el
// caller decide qué opciones ofrecer según la vista (ver book-list-with-filter.tsx).
export type BookSortOption = "date_added" | "alphabetical" | "rating";

export const BOOK_SORT_LABELS: Record<BookSortOption, string> = {
  date_added: "Fecha de adición",
  alphabetical: "Orden alfabético",
  rating: "Calificación",
};

export function sortUserBooks(items: UserBook[], sort: BookSortOption): UserBook[] {
  const sorted = [...items];
  if (sort === "alphabetical") {
    sorted.sort((a, b) => a.book.title.localeCompare(b.book.title, "es"));
  } else if (sort === "rating") {
    // Libros sin rating (no debería pasar en "leídos", pero por si acaso)
    // quedan al final en vez de mezclados arriba.
    sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return sorted;
}
