"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Sheet modal de HIG (ver design-system.md → "Sheets"): sube desde abajo en
// mobile y en ≥ 768px se muestra centrado como "form sheet" de iPad. El
// encabezado es una barra de navegación (`SheetNavBar`: Cancelar · Título ·
// Guardar), sin botón X. No lleva grabber: HIG lo reserva para sheets
// redimensionables (con detents), y estos tienen un solo tamaño.

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content>) {
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        // Los sheets se describen con su título y contenido; sin Description
        // explícita, Radix pide desactivar el aria-describedby automático.
        aria-describedby={undefined}
        className={cn(
          "fixed z-50 flex flex-col overflow-y-auto overscroll-contain bg-background-elevated text-label shadow-2xl outline-none",
          "inset-x-0 bottom-0 max-h-[calc(100dvh-env(safe-area-inset-top)-1.5rem)] rounded-t-[10px] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]",
          "md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[min(720px,calc(100dvh-4rem))] md:w-[540px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[10px] md:p-0",
          "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-open:animate-in data-closed:animate-out data-closed:duration-250",
          "max-md:data-open:slide-in-from-bottom max-md:data-closed:slide-out-to-bottom md:data-open:fade-in-0 md:data-open:zoom-in-95 md:data-closed:fade-out-0 md:data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

// Barra de navegación del sheet: acción de cancelar a la izquierda, título
// `Headline` centrado y acción de confirmación a la derecha. Queda fija al
// scrollear el contenido, con material translúcido.
function SheetNavBar({
  title,
  leading,
  trailing,
  className,
}: {
  title: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-slot="sheet-nav-bar"
      className={cn(
        "sticky top-0 z-10 grid min-h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 bg-background-elevated/85 px-[calc(var(--layout-margin)-0.5rem)] shadow-[0_0.5px_0_var(--separator)] backdrop-blur-xl backdrop-saturate-150",
        className
      )}
    >
      {/* Los botones nunca se recortan: si no entra todo, se trunca el título. */}
      <div className="flex justify-start">{leading}</div>
      <SheetPrimitive.Title className="min-w-0 truncate text-center text-headline text-label">
        {title}
      </SheetPrimitive.Title>
      <div className="flex justify-end">{trailing}</div>
    </div>
  )
}

// Contenido del sheet: secciones agrupadas con el margen de layout.
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("flex flex-col gap-6 px-(--layout-margin) pt-5 pb-8", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetNavBar,
  SheetBody,
}
