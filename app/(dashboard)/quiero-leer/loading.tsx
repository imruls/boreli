import { PageHeader } from "@/components/nav/page-header";
import { BookListSkeleton } from "@/components/books/book-list-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 pb-24 md:pb-8">
      <PageHeader title="Quiero leer" />
      <div className="px-4 sm:px-6">
        <BookListSkeleton />
      </div>
    </div>
  );
}
