import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span className="font-heading text-sm font-bold tracking-wide text-ink uppercase">
        Boreli
      </span>
      <h1 className="font-heading max-w-xs text-2xl font-bold text-ink sm:text-3xl">
        Sistema visual base
      </h1>
      <p className="max-w-sm text-sm text-ink-muted">
        Tailwind + shadcn/ui configurados con la paleta cream / ink y tipografía Roboto Slab +
        Inter de Boreli.
      </p>
      <div className="flex gap-3">
        <Button>Botón primario</Button>
        <Button variant="outline">Botón secundario</Button>
      </div>
    </div>
  );
}
