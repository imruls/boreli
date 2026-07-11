import { Skeleton } from "@/components/ui/skeleton";
import { BookListSkeleton } from "@/components/books/book-list-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-4 pb-24 sm:px-6 md:pb-8">
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <BookListSkeleton rows={1} />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <BookListSkeleton rows={2} />
      </div>
    </div>
  );
}
