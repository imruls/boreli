import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllUserBooks } from "@/lib/queries/user-books";
import { buildTitleKey } from "@/lib/csv-import";
import { PageHeader } from "@/components/nav/page-header";
import { LibraryImport } from "@/components/books/library-import";

export const metadata: Metadata = {
  title: "Importar biblioteca — Boreli",
};

export default async function ImportarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  // Lo que ya está en la biblioteca, para marcarlo en la vista previa y no
  // importarlo dos veces (por id de Google Books, o título + autor si fue
  // una carga manual).
  const userBooks = await getAllUserBooks(supabase, user.id);
  const existingGoogleIds = userBooks
    .map((userBook) => userBook.book.googleBooksId)
    .filter((id): id is string => Boolean(id));
  const existingTitleKeys = userBooks.map((userBook) =>
    buildTitleKey(userBook.book.title, userBook.book.authors),
  );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Importar biblioteca" back={{ href: "/perfil", label: "Perfil" }} />

      <div className="flex flex-col px-(--layout-margin) pt-2">
        <LibraryImport
          existingGoogleIds={existingGoogleIds}
          existingTitleKeys={existingTitleKeys}
        />
      </div>
    </div>
  );
}
