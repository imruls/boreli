"use client";

import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export interface ActionSheetAction {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

// Action sheet de HIG para confirmar acciones destructivas (ver
// design-system.md → "Confirmaciones destructivas"): título y mensaje cortos,
// acciones en un grupo y `Cancelar` separado abajo en semibold. En ≥ 768px se
// muestra centrado. Usa AlertDialog: el foco arranca en Cancelar y tocar
// afuera no confirma nada.
export function ActionSheet({
  open,
  onOpenChange,
  title,
  message,
  actions,
  cancelLabel = "Cancelar",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}) {
  const group = "overflow-hidden rounded-[13px] bg-surface-elevated";
  const button =
    "flex h-14 w-full items-center justify-center px-4 text-title-3 font-normal transition-colors outline-none active:bg-fill focus-visible:bg-fill";

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed right-[calc(env(safe-area-inset-right)+0.5rem)] bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] left-[calc(env(safe-area-inset-left)+0.5rem)] z-50 flex flex-col gap-2 outline-none",
            "md:right-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-80 md:-translate-x-1/2 md:-translate-y-1/2",
            "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-open:animate-in data-closed:animate-out",
            "max-md:data-open:slide-in-from-bottom max-md:data-closed:slide-out-to-bottom md:data-open:fade-in-0 md:data-open:zoom-in-95 md:data-closed:fade-out-0",
          )}
        >
          <div className={group}>
            <div className="flex flex-col gap-1 px-4 py-3.5 text-center">
              <AlertDialogPrimitive.Title className="text-footnote font-semibold text-label-secondary">
                {title}
              </AlertDialogPrimitive.Title>
              {message ? (
                <AlertDialogPrimitive.Description className="text-footnote text-label-secondary">
                  {message}
                </AlertDialogPrimitive.Description>
              ) : null}
            </div>
            {actions.map(({ label, onSelect, destructive }) => (
              <AlertDialogPrimitive.Action
                key={label}
                onClick={onSelect}
                className={cn(
                  button,
                  "border-t border-separator",
                  destructive ? "text-destructive" : "text-tint",
                )}
              >
                {label}
              </AlertDialogPrimitive.Action>
            ))}
          </div>
          <AlertDialogPrimitive.Cancel className={cn(group, button, "font-semibold text-tint")}>
            {cancelLabel}
          </AlertDialogPrimitive.Cancel>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
