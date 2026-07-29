import type { UserBook } from "@/types/book";

// Fuente de verdad de las opciones de orden: types/book.ts (a su vez,
// data-model.md). "rating" y "date_read" solo tienen sentido para libros
// "leídos" — el caller decide qué opciones ofrecer según la vista (ver
// book-list-with-filter.tsx).
export type BookSortOption = "date_added" | "date_read" | "alphabetical" | "rating";

export const BOOK_SORT_LABELS: Record<BookSortOption, string> = {
  date_added: "Fecha de adición",
  date_read: "Fecha de lectura",
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
  } else if (sort === "date_read") {
    // Libros sin finishedAt (marcados leídos antes de que existiera esta
    // columna) quedan al final en vez de mezclados arriba.
    sorted.sort((a, b) => {
      if (!a.finishedAt && !b.finishedAt) return 0;
      if (!a.finishedAt) return 1;
      if (!b.finishedAt) return -1;
      return new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime();
    });
  } else {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return sorted;
}
