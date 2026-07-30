// Fuente de verdad: data-model.md. Cualquier cambio de modelo empieza ahí, no acá directo.

export type BookStatus = "want_to_read" | "reading" | "read";
export type BookTag = "physical" | "google_books" | "apple_books" | "kindle" | "pdf";
export type ProgressType = "percent" | "pages";

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

// Detalle enriquecido de Google Books para `/libro/[id]`: a diferencia de
// `Book`, `categories`/`averageRating`/`ratingsCount` se piden on-demand en
// cada visita y no se persisten en la tabla `books`.
export interface GoogleBookDetail {
  googleBooksId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  pageCount: number | null;
  description: string | null;
  publishedDate: string | null;
  categories: string[];
  averageRating: number | null;
  ratingsCount: number | null;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: BookStatus;
  tags: BookTag[];
  rating: number | null; // 1-5, solo aplica si status === 'read'
  note: string | null; // reseña libre, máx 300 caracteres, solo aplica si status === 'read'
  progressType: ProgressType | null; // solo aplica si status === 'reading'
  progressCurrent: number | null; // 0-100 si progressType === 'percent', página actual si === 'pages'
  progressTotalPages: number | null; // solo aplica si progressType === 'pages'
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  book: Book; // resultado de join con la tabla books
}
