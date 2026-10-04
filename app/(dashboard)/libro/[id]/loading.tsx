import { PageHeader } from "@/components/nav/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Libro" back="history" />

      <div className="flex flex-col gap-8 px-(--layout-margin)">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-48 w-32" />
          <div className="flex w-full flex-col items-center gap-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-44 w-full rounded-[10px]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
