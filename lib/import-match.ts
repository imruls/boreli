import { normalizeText } from "@/lib/csv-import";
import type { Book } from "@/types/book";

export const IMPORT_CANDIDATES_MAX = 5;

export interface ImportMatchQuery {
  title: string;
  authors: string[];
  isbn: string | null;
}

// Consultas a Google Books de la más precisa a la más laxa; el matcher corta
// en la primera que devuelve resultados. Las comillas hacen que `intitle:` /
// `inauthor:` apliquen a la frase entera (ver `buildFieldQuery`).
export function buildMatchQueries({ title, authors, isbn }: ImportMatchQuery): string[] {
  const cleanTitle = title.replace(/"/g, "").trim();
  const author = authors[0]?.replace(/"/g, "").trim();
  const queries: string[] = [];
  if (isbn) queries.push(`isbn:${isbn}`);
  if (author) {
    queries.push(`intitle:"${cleanTitle}" inauthor:"${author}"`);
    queries.push(`${cleanTitle} ${author}`);
  } else {
    queries.push(`intitle:"${cleanTitle}"`);
  }
  return queries;
}

// Google ordena por relevancia general, no por parecido con lo que pedimos:
// se reordena priorizando título igual, autor que coincide y portada.
function scoreCandidate(query: ImportMatchQuery, book: Book): number {
  const wantedTitle = normalizeText(query.title);
  const title = normalizeText(book.title);
  let score = 0;
  if (title === wantedTitle) score += 4;
  else if (title.startsWith(wantedTitle) || wantedTitle.startsWith(title)) score += 3;
  else if (title.includes(wantedTitle) || wantedTitle.includes(title)) score += 1;

  const wantedAuthorWords = query.authors
    .flatMap((author) => normalizeText(author).split(" "))
    .filter((word) => word.length > 2);
  const authorText = normalizeText(book.authors.join(" "));
  if (wantedAuthorWords.some((word) => authorText.includes(word))) score += 2;

  if (book.coverUrl) score += 1;
  return score;
}

export function rankCandidates(query: ImportMatchQuery, books: Book[]): Book[] {
  const seen = new Set<string>();
  return books
    .filter((book) => {
      if (seen.has(book.id)) return false;
      seen.add(book.id);
      return true;
    })
    .map((book, index) => ({ book, index, score: scoreCandidate(query, book) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, IMPORT_CANDIDATES_MAX)
    .map(({ book }) => book);
}

// Tamaño de cada tanda: el cliente manda el archivo de a partes para que
// ninguna llamada quede esperando decenas de respuestas de Google Books.
export const MATCH_CHUNK_SIZE = 10;
export const IMPORT_CHUNK_SIZE = 10;
