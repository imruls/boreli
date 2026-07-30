import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
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
import { BackButton } from "@/components/nav/back-button";
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

function ErrorState() {
  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
        <BackButton />
        <h1 className="font-heading text-lg font-bold text-ink">Libro</h1>
      </div>
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
