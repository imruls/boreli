// Fuente de verdad: data-model.md. Cualquier cambio de modelo empieza ahí, no acá directo.

export type BookStatus = "want_to_read" | "reading" | "read";
export type BookTag = "physical" | "google_books" | "apple_books" | "kindle" | "pdf";

export interface Book {
  id: string;
  googleBooksId: string | null;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
  description: string | null;
  publishedDate: string | null;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: BookStatus;
  tags: BookTag[];
  rating: number | null; // 1-5, solo aplica si status === 'read'
  note: string | null; // reseña libre, máx 300 caracteres, solo aplica si status === 'read'
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  book: Book; // resultado de join con la tabla books
}
