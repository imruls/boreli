import * as React from "react"

import { cn } from "@/lib/utils"

// Mismo tratamiento que `Input` (ver design-system.md → "Campos de texto").
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-[10px] bg-surface px-4 py-3 text-body text-label transition-shadow outline-none placeholder:text-label-tertiary focus-visible:ring-2 focus-visible:ring-tint disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:ring-2 aria-invalid:ring-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
