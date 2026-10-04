import { BookX } from "lucide-react";
import { PageHeader } from "@/components/nav/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function LibroNotFound() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Libro" back="history" />
      <EmptyState
        icon={BookX}
        title="No encontramos este libro"
        description="El libro que buscás no existe o ya no está disponible en Google Books."
      />
    </div>
  );
}
