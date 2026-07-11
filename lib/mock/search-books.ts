import type { Book } from "@/types/book";

// Datos de ejemplo para la pantalla de Buscar. `app/api/books/search/route.ts`
// (proxy a Google Books API) todavía no existe — es un ítem de la Semana 2
// del ROADMAP. Hasta entonces, esta pantalla es solo la referencia visual del
// flujo de búsqueda + alta.
export const MOCK_SEARCH_BOOKS: Book[] = [
  {
    id: "mock-1",
    googleBooksId: "mock-1",
    title: "Hábitos Atómicos",
    authors: ["James Clear"],
    coverUrl: null,
    pageCount: 320,
    description: null,
    publishedDate: null,
  },
  {
    id: "mock-2",
    googleBooksId: "mock-2",
    title: "El monje que vendió su Ferrari",
    authors: ["Robin Sharma"],
    coverUrl: null,
    pageCount: 208,
    description: null,
    publishedDate: null,
  },
  {
    id: "mock-3",
    googleBooksId: "mock-3",
    title: "Los 7 hábitos de la gente altamente efectiva",
    authors: ["Stephen R. Covey"],
    coverUrl: null,
    pageCount: 372,
    description: null,
    publishedDate: null,
  },
  {
    id: "mock-4",
    googleBooksId: "mock-4",
    title: "Sapiens: de animales a dioses",
    authors: ["Yuval Noah Harari"],
    coverUrl: null,
    pageCount: 496,
    description: null,
    publishedDate: null,
  },
];
