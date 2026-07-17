import { PageHeader } from "@/components/nav/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <PageHeader title="Editar perfil" backHref="/perfil" />

      <div className="flex flex-col items-center gap-2 px-4 sm:px-6">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="flex flex-col gap-4 px-4 sm:px-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
