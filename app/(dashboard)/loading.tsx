import { Skeleton } from "@/components/ui/skeleton";
import { BookListSkeleton } from "@/components/books/book-list-skeleton";
import { PageHeader } from "@/components/nav/page-header";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Inicio" />
      <div className="flex flex-col gap-8 px-(--layout-margin)">
        <Skeleton className="h-9 w-full rounded-[10px]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <BookListSkeleton rows={1} />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-[89px] w-full rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
