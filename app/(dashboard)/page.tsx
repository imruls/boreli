import { Clock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLibraryCounts, getUserBooksByStatus } from "@/lib/queries/user-books";
import { ReadingSection } from "@/components/books/reading-section";
import { PageHeader } from "@/components/nav/page-header";
import { ListRow, ListSection } from "@/components/ui/list";
import { SearchFieldLink } from "@/components/ui/search-field";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // el middleware ya protege esta ruta

  const [reading, counts] = await Promise.all([
    getUserBooksByStatus(supabase, user.id, "reading"),
    getLibraryCounts(supabase, user.id),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Inicio" />
      <div className="flex flex-col gap-8 px-(--layout-margin)">
        <SearchFieldLink href="/buscar" placeholder="Buscar libros, autores" />

        <ReadingSection books={reading} />

        <section className="flex flex-col gap-2">
          <h2 className="text-title-3 text-label">Mi biblioteca</h2>
          <ListSection>
            <ListRow href="/quiero-leer" icon={Clock} label="Quiero leer" detail={counts.want_to_read} />
            <ListRow href="/leidos" icon={CheckCircle2} label="Leídos" detail={counts.read} />
          </ListSection>
        </section>
      </div>
    </div>
  );
}
