import { PageHeader } from "@/components/nav/page-header";
import { Skeleton } from "@/components/ui/skeleton";

// Solo se ve un instante durante la navegación inicial al segmento
// `/buscar` (mientras `(dashboard)/layout.tsx` resuelve el usuario) — la
// página en sí es un Client Component sin fetch al montar, así que no hace
// falta un `BookListSkeleton` acá, solo la forma de la barra de búsqueda.
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 pb-24 md:pb-8">
      <PageHeader title="Buscar" showBack={false} />
      <div className="flex flex-col gap-3 px-4 sm:px-6">
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-14 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
