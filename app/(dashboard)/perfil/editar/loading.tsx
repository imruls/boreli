import { PageHeader } from "@/components/nav/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Editar perfil" back={{ href: "/perfil", label: "Perfil" }} />

      <div className="flex flex-col gap-8 px-(--layout-margin) pt-2">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-11 w-full rounded-[10px]" />
        <Skeleton className="h-[50px] w-full rounded-[12px]" />
      </div>
    </div>
  );
}
