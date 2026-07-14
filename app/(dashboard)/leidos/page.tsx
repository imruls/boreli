import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserBooksByStatus } from "@/lib/queries/user-books";
import { PageHeader } from "@/components/nav/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { BookListWithFilter } from "@/components/books/book-list-with-filter";

export const metadata: Metadata = {
  title: "Leídos — Boreli",
};

export default async function LeidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const books = await getUserBooksByStatus(supabase, user.id, "read");

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24 md:pb-8">
      <PageHeader title="Leídos" />
      <div className="flex flex-1 flex-col px-4 sm:px-6">
        {books.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Todavía no marcaste libros como leídos"
            description="Los libros que termines de leer van a aparecer acá, con tu rating."
            action={{ label: "Buscar libros", href: "/buscar" }}
          />
        ) : (
          <BookListWithFilter
            items={books}
            showRating
            storageKey="leidos"
            sortOptions={["date_added", "alphabetical", "rating"]}
          />
        )}
      </div>
    </div>
  );
}
