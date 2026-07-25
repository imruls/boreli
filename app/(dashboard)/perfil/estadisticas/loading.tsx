import { PageHeader } from "@/components/nav/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <PageHeader title="Estadísticas" backHref="/perfil" />

      <div className="flex flex-col gap-4 px-4 sm:px-6">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}
