import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Valida que una URL provista por el usuario (ej. portada de carga manual)
// use http/https antes de guardarla o de intentar cargarla — rechaza
// esquemas como `javascript:`, `data:` o `file:` que no son portadas reales,
// y también userinfo (`https://user:pass@host`) para evitar URL spoofing/SSRF
// vía esa parte de la URL.
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    )
  } catch {
    return false
  }
}
