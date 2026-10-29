import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
import { searchGoogleBooks, type BookSearchField } from "@/lib/google-books";

const MAX_RESULTS = 20;
const MAX_QUERY_LENGTH = 200;
const SEARCH_CACHE_SECONDS = 6 * 60 * 60;
const SEARCH_RATE_LIMIT: RateLimitPolicy = {
  maxAttempts: 30,
  windowSeconds: 60,
  blockSeconds: 5 * 60,
};
const SEARCH_FIELDS: ReadonlySet<BookSearchField> = new Set(["all", "title", "author"]);

const getCachedBooks = unstable_cache(
  (query: string, field: BookSearchField) => searchGoogleBooks(query, MAX_RESULTS, field),
  ["google-books-search-v2"],
  { revalidate: SEARCH_CACHE_SECONDS },
);

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (isAuthRetryableFetchError(authError)) {
    console.error("[books/search] No se pudo verificar la sesión", authError);
    return NextResponse.json(
      { error: "La búsqueda no está disponible temporalmente." },
      { status: 503 },
    );
  }
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const rawField = searchParams.get("field");
  const field: BookSearchField = SEARCH_FIELDS.has(rawField as BookSearchField)
    ? (rawField as BookSearchField)
    : "all";

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
    const books = await getCachedBooks(query, field);
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
