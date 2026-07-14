import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Search, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLibraryCounts, getUserBooksByStatus } from "@/lib/queries/user-books";
import { BookCard } from "@/components/books/book-card";
import { BookEditMenuButton } from "@/components/books/book-edit-menu-button";

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
    <div className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-24 sm:px-6 md:pb-8">
      <Link
        href="/buscar"
        className="flex items-center gap-2 rounded-xl border border-ink-border px-3.5 py-2.5 text-sm text-ink-muted"
      >
        <Search className="size-4" />
        Buscar libros, autores…
      </Link>

      {reading.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ink">Leyendo actualmente</h2>
          <div className="flex flex-col gap-3">
            {reading.map((userBook) => (
              <BookCard
                key={userBook.id}
                title={userBook.book.title}
                authors={userBook.book.authors}
                coverUrl={userBook.book.coverUrl}
                trustedCover={Boolean(userBook.book.googleBooksId)}
                coverSize="lg"
                action={
                  <BookEditMenuButton
                    userBookId={userBook.id}
                    bookTitle={userBook.book.title}
                    currentStatus={userBook.status}
                    currentTags={userBook.tags}
                    currentRating={userBook.rating}
                  />
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-ink">Mi biblioteca</h2>
        <div className="flex flex-col gap-2">
          <LibraryLink href="/quiero-leer" icon={Clock} label="Quiero leer" count={counts.want_to_read} />
          <LibraryLink href="/leidos" icon={CheckCircle2} label="Leídos" count={counts.read} />
        </div>
      </section>
    </div>
  );
}

function LibraryLink({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-ink-border px-4 py-3"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-ink">
        <Icon className="size-4 text-ink-muted" />
        {label}
      </span>
      <span className="flex items-center gap-1 text-sm text-ink-muted">
        {count}
        <ChevronRight className="size-4" />
      </span>
    </Link>
  );
}
