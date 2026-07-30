import { BookX } from "lucide-react";
import { BackButton } from "@/components/nav/back-button";
import { EmptyState } from "@/components/ui/empty-state";

export default function LibroNotFound() {
  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
        <BackButton />
        <h1 className="font-heading text-lg font-bold text-ink">Libro</h1>
      </div>
      <EmptyState
        icon={BookX}
        title="No encontramos este libro"
        description="El libro que buscás no existe o ya no está disponible en Google Books."
      />
    </div>
  );
}
