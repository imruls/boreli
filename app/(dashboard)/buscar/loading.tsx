import { PageHeader } from "@/components/nav/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Solo se ve un instante durante la navegación inicial al segmento
// `/buscar` (mientras `(dashboard)/layout.tsx` resuelve el usuario) — la
// página en sí es un Client Component sin fetch al montar, así que no hace
// falta un `BookListSkeleton` acá, solo la forma de la barra de búsqueda.
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Buscar" />
      <div className="flex flex-col gap-3 px-(--layout-margin)">
        <Skeleton className="h-9 w-full rounded-[10px]" />
        <Skeleton className="h-8 w-full rounded-[9px]" />
      </div>
    </div>
  );
}
