import { PageHeader } from "@/components/nav/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Importar biblioteca" back={{ href: "/perfil", label: "Perfil" }} />

      <div className="flex flex-col gap-8 px-(--layout-margin) pt-2">
        <Skeleton className="h-11 w-full rounded-[10px]" />
        <Skeleton className="h-16 w-full rounded-[10px]" />
      </div>
    </div>
  );
}
