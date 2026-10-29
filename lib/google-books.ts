import {
  BOOK_AUTHOR_MAX_LENGTH,
  BOOK_AUTHORS_MAX_COUNT,
  BOOK_COVER_URL_MAX_LENGTH,
  BOOK_DESCRIPTION_MAX_LENGTH,
  BOOK_ID_MAX_LENGTH,
  BOOK_PAGE_COUNT_MAX,
  BOOK_PUBLISHED_DATE_MAX_LENGTH,
  BOOK_TITLE_MAX_LENGTH,
} from "@/lib/book-validation";
import type { Book, GoogleBookDetail } from "@/types/book";

export const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
// Google Books devuelve 429 de forma intermitente cuando la cuota del
// proyecto de GCP está al límite; reintentamos con backoff antes de
// rendirnos, en vez de obligar al usuario a repetir la operación a mano.
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 400;
const MAX_RETRY_DELAY_MS = 1500;
const FETCH_TIMEOUT_MS = 5000;
const TOTAL_FETCH_BUDGET_MS = 12_000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const CATEGORY_MAX_LENGTH = 100;
const CATEGORIES_MAX_COUNT = 10;

export interface GoogleBooksVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    pageCount?: number;
    description?: string;
    publishedDate?: string;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
  };
}

export interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
}

// Google sirve las portadas por http; se fuerza https para evitar contenido
// mixto al embeberlas en la app.
export function toSecureUrl(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://").slice(0, BOOK_COVER_URL_MAX_LENGTH);
}

export function truncate(value: string | undefined, maxLength: number): string | null {
  return value ? value.slice(0, maxLength) : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// La señal sigue activa después de recibir los headers, así que el timeout
// también corta la lectura del body (`response.json()`/`text()`), no solo la
// conexión.
function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}

// Reintenta ante 429 (cuota) y errores 5xx con backoff exponencial + jitter.
// Respeta `Retry-After` si Google lo envía.
export async function fetchFromGoogleBooks(url: string): Promise<Response> {
  let lastResponse: Response | null = null;
  const deadline = Date.now() + TOTAL_FETCH_BUDGET_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const remainingBudget = deadline - Date.now();
    if (remainingBudget <= 0) break;

    let response: Response;
    try {
      response = await fetchWithTimeout(url, Math.min(FETCH_TIMEOUT_MS, remainingBudget));
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
      const delay = Math.min(
        BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 200,
        MAX_RETRY_DELAY_MS,
        Math.max(0, deadline - Date.now()),
      );
      if (delay <= 0) throw error;
      await sleep(delay);
      continue;
    }

    if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status)) {
      return response;
    }

    lastResponse = response;
    if (attempt === MAX_ATTEMPTS) break;

    const retryAfterSeconds = Number(response.headers.get("Retry-After"));
    const requestedDelay =
      Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 200;
    const delay = Math.min(
      requestedDelay,
      MAX_RETRY_DELAY_MS,
      Math.max(0, deadline - Date.now()),
    );
    if (delay <= 0) break;
    await sleep(delay);
  }

  if (!lastResponse) {
    throw new Error("Google Books excedió el presupuesto total de espera");
  }
  return lastResponse;
}

function parsePageCount(pageCount: number | undefined): number | null {
  return Number.isInteger(pageCount) && (pageCount as number) > 0 && (pageCount as number) <= BOOK_PAGE_COUNT_MAX
    ? (pageCount as number)
    : null;
}

export function mapVolumeToBook(volume: GoogleBooksVolume): Book {
  const info = volume.volumeInfo ?? {};
  const title = truncate(info.title, BOOK_TITLE_MAX_LENGTH) || "Título desconocido";
  return {
    id: volume.id.slice(0, BOOK_ID_MAX_LENGTH),
    googleBooksId: volume.id.slice(0, BOOK_ID_MAX_LENGTH),
    title,
    authors: (info.authors ?? [])
      .slice(0, BOOK_AUTHORS_MAX_COUNT)
      .map((author) => author.trim().slice(0, BOOK_AUTHOR_MAX_LENGTH))
      .filter(Boolean),
    coverUrl: toSecureUrl(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    pageCount: parsePageCount(info.pageCount),
    description: truncate(info.description, BOOK_DESCRIPTION_MAX_LENGTH),
    publishedDate: truncate(info.publishedDate, BOOK_PUBLISHED_DATE_MAX_LENGTH),
  };
}

// Detalle enriquecido para la página `/libro/[id]`: agrega género/rating
// promedio de Google, que a diferencia de `Book` no se persisten en la DB
// (se piden on-demand en cada visita), por eso viven en un tipo aparte.
export function mapVolumeToDetail(volume: GoogleBooksVolume): GoogleBookDetail {
  const book = mapVolumeToBook(volume);
  const info = volume.volumeInfo ?? {};
  const averageRating =
    typeof info.averageRating === "number" && info.averageRating >= 0 && info.averageRating <= 5
      ? info.averageRating
      : null;
  const ratingsCount =
    Number.isInteger(info.ratingsCount) && (info.ratingsCount as number) >= 0
      ? (info.ratingsCount as number)
      : null;

  return {
    googleBooksId: book.googleBooksId as string,
    title: book.title,
    authors: book.authors,
    coverUrl: book.coverUrl,
    pageCount: book.pageCount,
    description: book.description,
    publishedDate: book.publishedDate,
    categories: (info.categories ?? [])
      .slice(0, CATEGORIES_MAX_COUNT)
      .map((category) => category.trim().slice(0, CATEGORY_MAX_LENGTH))
      .filter(Boolean),
    averageRating,
    ratingsCount,
  };
}

function buildVolumesUrl(params: Record<string, string>): string {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL(GOOGLE_BOOKS_ENDPOINT);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }
  return url.toString();
}

// Google Books soporta restringir la búsqueda a un campo con un prefijo en
// `q` (`intitle:`, `inauthor:`). No incluye `inpublisher:` a propósito: ese
// campo está indexado de forma muy inconsistente en Google Books y filtrar
// por editorial suele devolver pocos o ningún resultado incluso para
// editoriales conocidas, así que no se ofrece como categoría en la UI.
export type BookSearchField = "all" | "title" | "author";

const SEARCH_FIELD_PREFIX: Record<Exclude<BookSearchField, "all">, string> = {
  title: "intitle:",
  author: "inauthor:",
};

// Envolver en comillas hace que el prefijo aplique a la frase completa: sin
// comillas, Google solo restringe la primera palabra al campo y el resto
// queda como búsqueda libre (ej. "harry potter" con intitle: sin comillas
// busca "harry" en el título y "potter" en cualquier parte).
function buildFieldQuery(query: string, field: BookSearchField): string {
  if (field === "all") return query;
  const sanitized = query.replace(/"/g, "");
  return `${SEARCH_FIELD_PREFIX[field]}"${sanitized}"`;
}

export async function searchGoogleBooks(
  query: string,
  maxResults: number,
  field: BookSearchField = "all",
): Promise<Book[]> {
  const url = buildVolumesUrl({
    q: buildFieldQuery(query, field),
    maxResults: String(maxResults),
    printType: "books",
  });

  let response: Response;
  try {
    response = await fetchFromGoogleBooks(url);
  } catch (error) {
    console.error("[google-books] No se pudo conectar con Google Books", error);
    throw error;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      `[google-books] Google Books respondió ${response.status} tras reintentos. Body: ${body.slice(0, 500)}`,
    );
    throw new Error(`Google Books respondió ${response.status}`);
  }

  const data = (await response.json()) as GoogleBooksResponse;
  return (data.items ?? []).map(mapVolumeToBook);
}

// Detalle de un único volumen (`GET /volumes/{id}`) para la página de
// detalle: a diferencia de la búsqueda, no hay `q` — se pega directo por id.
export async function getVolumeById(id: string): Promise<GoogleBooksVolume | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL(`${GOOGLE_BOOKS_ENDPOINT}/${encodeURIComponent(id)}`);
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  let response: Response;
  try {
    response = await fetchFromGoogleBooks(url.toString());
  } catch (error) {
    console.error("[google-books] No se pudo conectar con Google Books", error);
    throw error;
  }

  if (response.status === 404) return null;

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      `[google-books] Google Books respondió ${response.status} tras reintentos. Body: ${body.slice(0, 500)}`,
    );
    throw new Error(`Google Books respondió ${response.status}`);
  }

  return (await response.json()) as GoogleBooksVolume;
}
