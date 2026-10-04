import { PageHeader } from "@/components/nav/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Perfil" />

      <div className="flex flex-col gap-8 px-(--layout-margin)">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-[89px] w-full rounded-[10px]" />
        <Skeleton className="h-11 w-full rounded-[10px]" />
        <Skeleton className="h-11 w-full rounded-[10px]" />
      </div>
    </div>
  );
}
