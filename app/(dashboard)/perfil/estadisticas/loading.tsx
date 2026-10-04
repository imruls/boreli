import { PageHeader } from "@/components/nav/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Estadísticas" back={{ href: "/perfil", label: "Perfil" }} />

      <div className="flex flex-col gap-6 px-(--layout-margin)">
        <Skeleton className="h-56 w-full rounded-[12px]" />
        <Skeleton className="h-56 w-full rounded-[12px]" />
        <Skeleton className="h-56 w-full rounded-[12px]" />
        <Skeleton className="h-56 w-full rounded-[12px]" />
      </div>
    </div>
  );
}
