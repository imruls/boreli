import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
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
import type { Book } from "@/types/book";

const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
const MAX_RESULTS = 20;
const MAX_QUERY_LENGTH = 200;
// Google Books devuelve 429 de forma intermitente cuando la cuota del
// proyecto de GCP está al límite; reintentamos con backoff antes de
// rendirnos, en vez de obligar al usuario a repetir la búsqueda a mano.
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 400;
const MAX_RETRY_DELAY_MS = 1500;
const FETCH_TIMEOUT_MS = 5000;
const TOTAL_FETCH_BUDGET_MS = 12_000;
const SEARCH_CACHE_SECONDS = 6 * 60 * 60;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const SEARCH_RATE_LIMIT: RateLimitPolicy = {
  maxAttempts: 30,
  windowSeconds: 60,
  blockSeconds: 5 * 60,
};

interface GoogleBooksVolume {
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
  };
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
}

// Google sirve las portadas por http; se fuerza https para evitar contenido
// mixto al embeberlas en la app.
function toSecureUrl(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://").slice(0, BOOK_COVER_URL_MAX_LENGTH);
}

function truncate(value: string | undefined, maxLength: number): string | null {
  return value ? value.slice(0, maxLength) : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// Reintenta ante 429 (cuota) y errores 5xx con backoff exponencial + jitter.
// Respeta `Retry-After` si Google lo envía.
async function fetchFromGoogleBooks(url: string): Promise<Response> {
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

function mapVolumeToBook(volume: GoogleBooksVolume): Book {
  const info = volume.volumeInfo ?? {};
  const title = truncate(info.title, BOOK_TITLE_MAX_LENGTH) || "Título desconocido";
  const pageCount =
    Number.isInteger(info.pageCount) &&
    (info.pageCount as number) > 0 &&
    (info.pageCount as number) <= BOOK_PAGE_COUNT_MAX
      ? (info.pageCount as number)
      : null;
  return {
    id: volume.id.slice(0, BOOK_ID_MAX_LENGTH),
    googleBooksId: volume.id.slice(0, BOOK_ID_MAX_LENGTH),
    title,
    authors: (info.authors ?? [])
      .slice(0, BOOK_AUTHORS_MAX_COUNT)
      .map((author) => author.trim().slice(0, BOOK_AUTHOR_MAX_LENGTH))
      .filter(Boolean),
    coverUrl: toSecureUrl(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    pageCount,
    description: truncate(info.description, BOOK_DESCRIPTION_MAX_LENGTH),
    publishedDate: truncate(info.publishedDate, BOOK_PUBLISHED_DATE_MAX_LENGTH),
  };
}

async function searchGoogleBooks(query: string): Promise<Book[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = new URL(GOOGLE_BOOKS_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(MAX_RESULTS));
  url.searchParams.set("printType", "books");
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  let response: Response;
  try {
    response = await fetchFromGoogleBooks(url.toString());
  } catch (error) {
    console.error("[books/search] No se pudo conectar con Google Books", error);
    throw error;
  }

  if (!response.ok) {
    // Se loguea server-side para poder diagnosticar cuota/facturación en GCP
    // sin exponer detalles internos al cliente.
    const body = await response.text().catch(() => "");
    console.error(
      `[books/search] Google Books respondió ${response.status} tras reintentos. Body: ${body.slice(0, 500)}`,
    );
    throw new Error(`Google Books respondió ${response.status}`);
  }

  const data = (await response.json()) as GoogleBooksResponse;
  return (data.items ?? []).map(mapVolumeToBook);
}

const getCachedBooks = unstable_cache(searchGoogleBooks, ["google-books-search-v1"], {
  revalidate: SEARCH_CACHE_SECONDS,
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ books: [] });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "La búsqueda es demasiado larga." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const allowed = await consumeSecurityRateLimit(
      admin,
      buildRateLimitKey("books-search-user", user.id),
      SEARCH_RATE_LIMIT,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Hiciste demasiadas búsquedas. Esperá unos minutos." },
        { status: 429, headers: { "Retry-After": String(SEARCH_RATE_LIMIT.blockSeconds) } },
      );
    }
  } catch (error) {
    console.error("[books/search] No se pudo verificar el límite de uso", error);
    return NextResponse.json(
      { error: "La búsqueda no está disponible temporalmente." },
      { status: 503 },
    );
  }

  try {
    const books = await getCachedBooks(query);
    return NextResponse.json(
      { books },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con Google Books." },
      { status: 502 },
    );
  }
}
