"use client";

import * as React from "react";
import Link from "next/link";
import { Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldClassName =
  "flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-[10px] bg-fill px-2 text-label-secondary has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-tint";

// Search field de HIG (ver design-system.md → "Search field"): fondo `fill`,
// lupa, botón para borrar el texto y `Cancelar` a la derecha mientras está
// enfocado, que limpia la búsqueda y quita el foco.
export function SearchField({
  value,
  onValueChange,
  placeholder = "Buscar",
  className,
  autoFocus,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label className={fieldClassName}>
        <Search className="size-[1.1rem] shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          className="h-full min-w-0 flex-1 truncate bg-transparent text-body text-label outline-none placeholder:text-label-secondary [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value ? (
          <button
            type="button"
            // `onMouseDown` + preventDefault: borrar sin sacarle el foco al campo.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onValueChange("");
              inputRef.current?.focus();
            }}
            aria-label="Borrar búsqueda"
            className="-mr-1 flex size-8 shrink-0 items-center justify-center text-label-tertiary"
          >
            <XCircle className="size-[1.1rem] fill-current stroke-surface" aria-hidden />
          </button>
        ) : null}
      </label>
      {focused ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onValueChange("");
            inputRef.current?.blur();
          }}
          className="h-9 shrink-0 text-body text-tint active:opacity-70"
        >
          Cancelar
        </button>
      ) : null}
    </div>
  );
}

// Variante de solo navegación (ej. en Inicio): se ve igual que el campo pero
// es un link a la pantalla de búsqueda.
export function SearchFieldLink({
  href,
  placeholder = "Buscar",
  className,
}: {
  href: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(fieldClassName, "flex-none text-body active:opacity-70", className)}>
      <Search className="size-[1.1rem] shrink-0" aria-hidden />
      <span className="truncate">{placeholder}</span>
    </Link>
  );
}
