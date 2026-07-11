import type { BookTag } from "@/types/book";

// Fuente de verdad de los tags: types/book.ts (a su vez, data-model.md).
export const BOOK_TAG_LABELS: Record<BookTag, string> = {
  physical: "Físico",
  google_books: "Google Books",
  apple_books: "Apple Books",
  kindle: "Kindle",
};

export const BOOK_TAGS: BookTag[] = ["physical", "google_books", "apple_books", "kindle"];
