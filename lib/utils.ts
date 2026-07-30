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
// La descripción de Google Books suele traer HTML simple (<p>, <b>, <i>,
// <br>) mezclado en el texto plano — se muestra como texto, no se inyecta al
// DOM, así que alcanza con sacar las etiquetas y decodificar las entities
// más comunes en vez de sanitizar HTML de verdad.
export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

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
