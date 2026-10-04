import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Cápsulas de solo lectura (chips de formato, estados). Ver design-system.md →
// "Chips de formato" y "Estados de lectura".
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-caption-1 whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        // Estado activo ("Leyendo"): cápsula `tint`.
        default: "bg-tint font-semibold text-on-tint",
        // Chip de formato.
        secondary: "bg-fill text-label-secondary",
        // Estado neutro ("Leído"): cápsula `fill` con texto `label`.
        outline: "bg-fill font-semibold text-label",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
