import { BackButton } from "@/components/nav/back-button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
        <BackButton />
      </div>

      <div className="flex flex-col gap-4 px-4 sm:px-6">
        <div className="flex gap-4">
          <Skeleton className="h-40 w-28 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
