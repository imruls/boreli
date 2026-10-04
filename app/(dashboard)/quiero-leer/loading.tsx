import { PageHeader } from "@/components/nav/page-header";
import { BookListSkeleton } from "@/components/books/book-list-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Quiero leer" back={{ href: "/", label: "Inicio" }} />
      <div className="px-(--layout-margin)">
        <BookListSkeleton />
      </div>
    </div>
  );
}
