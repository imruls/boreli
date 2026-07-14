import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserBooksByStatus } from "@/lib/queries/user-books";
import { PageHeader } from "@/components/nav/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { BookListWithFilter } from "@/components/books/book-list-with-filter";

export const metadata: Metadata = {
  title: "Quiero leer — Boreli",
};

export default async function QuieroLeerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const books = await getUserBooksByStatus(supabase, user.id, "want_to_read");

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24 md:pb-8">
      <PageHeader title="Quiero leer" />
      <div className="flex flex-1 flex-col px-4 sm:px-6">
        {books.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Tu lista de Quiero leer está vacía"
            description="Agregá libros para empezar a armar tu colección."
            action={{ label: "Buscar libros", href: "/buscar" }}
          />
        ) : (
          <BookListWithFilter items={books} storageKey="quiero-leer" />
        )}
      </div>
    </div>
  );
}
