"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  // Si se pasa, el segmento muestra solo el ícono y `label` queda como aria-label.
  icon?: LucideIcon;
}

// Segmented control de HIG (ver design-system.md → "Segmented control"):
// selección única entre 2 a 5 opciones, siempre con una opción activa.
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  "aria-label": string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      // Radix permite deseleccionar tocando el segmento activo (valor ""):
      // un segmented control siempre tiene una opción elegida, así que se ignora.
      onValueChange={(next) => next && onValueChange(next as T)}
      aria-label={ariaLabel}
      className={cn("flex h-8 w-full items-stretch rounded-[9px] bg-fill p-0.5", className)}
    >
      {options.map(({ value: optionValue, label, icon: Icon }) => (
        <ToggleGroupPrimitive.Item
          key={optionValue}
          value={optionValue}
          aria-label={Icon ? label : undefined}
          className="flex min-w-0 flex-1 items-center justify-center rounded-[7px] px-3 text-subheadline text-label transition-[background-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-tint data-[state=on]:bg-control-selected data-[state=on]:font-semibold data-[state=on]:shadow-[0_1px_4px_rgb(0_0_0/16%),0_0_0_0.5px_rgb(0_0_0/8%)]"
        >
          {Icon ? <Icon className="size-4" aria-hidden /> : <span className="truncate">{label}</span>}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
