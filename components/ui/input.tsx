import * as React from "react"

import { cn } from "@/lib/utils"

// Campo de texto suelto de HIG: fondo `surface`, sin borde, radio 10px, 44px de
// alto y tamaño Body (17px, que además evita el zoom de Safari iOS al enfocar).
// El foco con teclado se marca con un anillo en `tint`.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[10px] bg-surface px-4 text-body text-label transition-shadow outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-subheadline file:font-semibold file:text-label placeholder:text-label-tertiary focus-visible:ring-2 focus-visible:ring-tint disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:ring-2 aria-invalid:ring-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
