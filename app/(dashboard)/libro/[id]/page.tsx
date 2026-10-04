import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
import { getVolumeById, mapVolumeToDetail } from "@/lib/google-books";
import { getUserBookByGoogleBooksId } from "@/lib/queries/user-books";
import { BOOK_ID_MAX_LENGTH } from "@/lib/book-validation";
import { PageHeader } from "@/components/nav/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { BookDetailView } from "@/components/books/book-detail-view";

// El detalle de un volumen de Google Books no cambia seguido (a diferencia
// de la búsqueda, que sí se revalida cada 6h) — TTL más largo.
const DETAIL_CACHE_SECONDS = 7 * 24 * 60 * 60;
const DETAIL_RATE_LIMIT: RateLimitPolicy = {
  maxAttempts: 60,
  windowSeconds: 60,
  blockSeconds: 5 * 60,
};

const getCachedVolume = unstable_cache(getVolumeById, ["google-books-detail-v1"], {
  revalidate: DETAIL_CACHE_SECONDS,
});

// El middleware ya bloquea acceso sin sesión a `/(dashboard)/*`, así que acá
// no hace falta repetir el chequeo de auth/rate-limit: en el peor caso (ID
// todavía no cacheado) esto agrega una lectura más contra `unstable_cache`,
// no una request nueva a Google Books fuera de la ventana de revalidación.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!id || id.length > BOOK_ID_MAX_LENGTH) return { title: "Libro — Boreli" };

  try {
    const volume = await getCachedVolume(id);
    const title = volume ? mapVolumeToDetail(volume).title : null;
    return { title: title ? `${title} — Boreli` : "Libro — Boreli" };
  } catch {
    return { title: "Libro — Boreli" };
  }
}

function ErrorState() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Libro" back="history" />
      <EmptyState
        icon={WifiOff}
        title="No pudimos cargar este libro"
        description="Hubo un problema al conectar con Google Books. Probá de nuevo en un momento."
      />
    </div>
  );
}

export default async function LibroDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id || id.length > BOOK_ID_MAX_LENGTH) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  let allowed: boolean;
  try {
    const admin = createAdminClient();
    allowed = await consumeSecurityRateLimit(
      admin,
      buildRateLimitKey("books-detail-user", user.id),
      DETAIL_RATE_LIMIT,
    );
  } catch (error) {
    console.error("[libro] No se pudo verificar el límite de uso", error);
    allowed = false;
  }
  if (!allowed) return <ErrorState />;

  let volume;
  let fetchFailed = false;
  try {
    volume = await getCachedVolume(id);
  } catch (error) {
    console.error("[libro] No se pudo conectar con Google Books", error);
    fetchFailed = true;
  }
  if (fetchFailed) return <ErrorState />;
  if (!volume) notFound();

  const detail = mapVolumeToDetail(volume);
  const userBook = await getUserBookByGoogleBooksId(supabase, user.id, id);

  return <BookDetailView detail={detail} userBook={userBook} />;
}
