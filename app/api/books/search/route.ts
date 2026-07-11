import { NextResponse } from "next/server";
import type { Book } from "@/types/book";

const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
const MAX_RESULTS = 20;

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
    response = await fetch(url.toString());
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con Google Books." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Google Books devolvió un error." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as GoogleBooksResponse;
  const books = (data.items ?? []).map(mapVolumeToBook);

  return NextResponse.json({ books });
}
