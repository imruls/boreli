import { NextResponse } from "next/server";
import type { Book } from "@/types/book";

const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
const MAX_RESULTS = 20;
// Google Books devuelve 429 de forma intermitente cuando la cuota del
// proyecto de GCP está al límite; reintentamos con backoff antes de
// rendirnos, en vez de obligar al usuario a repetir la búsqueda a mano.
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 400;
const FETCH_TIMEOUT_MS = 8000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

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
  return url.replace(/^http:\/\//, "https://");
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

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
      await sleep(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 200);
      continue;
    }

    if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status)) {
      return response;
    }

    lastResponse = response;
    if (attempt === MAX_ATTEMPTS) break;

    const retryAfterHeader = Number(response.headers.get("Retry-After"));
    const delay = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : BASE_RETRY_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 200;
    await sleep(delay);
  }

  return lastResponse as Response;
}

function mapVolumeToBook(volume: GoogleBooksVolume): Book {
  const info = volume.volumeInfo ?? {};
  return {
    id: volume.id,
    googleBooksId: volume.id,
    title: info.title ?? "Título desconocido",
    authors: info.authors ?? [],
    coverUrl: toSecureUrl(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    pageCount: info.pageCount ?? null,
    description: info.description ?? null,
    publishedDate: info.publishedDate ?? null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ books: [] });
  }

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
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con Google Books." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    // Se loguea server-side para poder diagnosticar cuota/facturación en GCP
    // sin exponer detalles internos al cliente.
    const body = await response.text().catch(() => "");
    console.error(
      `[books/search] Google Books respondió ${response.status} tras reintentos. Body: ${body.slice(0, 500)}`,
    );
    return NextResponse.json(
      { error: "Google Books devolvió un error." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as GoogleBooksResponse;
  const books = (data.items ?? []).map(mapVolumeToBook);

  return NextResponse.json({ books });
}
