import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

// Estilos de botón de HIG (ver design-system.md → "Botones"). El tint es el
// mismo color que el texto, así que todos los botones van en semibold para
// distinguirse de texto no interactivo. Presionado: opacidad 70%, como iOS.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold whitespace-nowrap transition-opacity outline-none select-none active:opacity-70 focus-visible:ring-2 focus-visible:ring-tint focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15em]",
  {
    variants: {
      variant: {
        // Filled: la acción principal de la pantalla o del sheet (una sola).
        default: "bg-tint text-on-tint",
        // Tinted: acción secundaria destacada.
        tinted: "bg-tint/12 text-tint",
        // Gray: acción secundaria neutra.
        secondary: "bg-fill text-label",
        // Alias de `secondary` para los usos heredados de shadcn.
        outline: "bg-fill text-label",
        // Plain: botones de barra y de sheet (`Cancelar`, `Editar`).
        ghost: "text-tint hover:opacity-80",
        link: "text-tint underline-offset-4 hover:underline",
        // Destructivo plain (filas, acciones de sheet) y filled (confirmación final).
        destructive: "text-destructive hover:opacity-80",
        "destructive-filled": "bg-destructive text-white",
      },
      size: {
        // Grande: 50px, ancho completo en formularios.
        lg: "h-[50px] rounded-[12px] px-5 text-body",
        // Mediano: 44px.
        default: "h-11 rounded-[10px] px-4 text-body",
        // Chico: 34px, cápsula.
        sm: "h-[34px] rounded-full px-3.5 text-subheadline",
        icon: "size-11 rounded-full",
        "icon-sm": "size-[34px] rounded-full",
      },
    },
    compoundVariants: [
      // Los botones plain no llevan padding lateral propio en barras/sheets.
      { variant: ["ghost", "destructive", "link"], className: "px-2" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  pending = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    // Acción en curso: el label se reemplaza por un spinner y el botón
    // conserva su ancho (no aplica con `asChild`).
    pending?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }), pending && "relative")}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending && !asChild ? (
        <>
          <span className="invisible contents">{children}</span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner className="text-current" />
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
