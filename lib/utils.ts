import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// La escala tipográfica de HIG (`text-body`, `text-headline`, … en
// app/globals.css) y los roles de color (`text-label`, `bg-fill`, …) son
// nombres custom: sin registrarlos, tailwind-merge confunde `text-body` con
// un color y lo descarta cuando aparece `text-label` en la misma lista.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "large-title",
            "title-1",
            "title-2",
            "title-3",
            "headline",
            "body",
            "callout",
            "subheadline",
            "footnote",
            "caption-1",
            "caption-2",
          ],
        },
      ],
    },
  },
})

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

const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/

// Antepone "https://" únicamente cuando el valor no trae ningún esquema
// (el típo típico es pegar "midominio.com/portada.jpg" sin protocolo). Si ya
// trae un esquema explícito -sea cual sea, incluido uno peligroso como
// `javascript:` o `data:`- no lo tocamos: lo dejamos pasar tal cual a
// `isHttpUrl`, que lo va a rechazar. Nunca hay que "arreglar" un esquema
// existente reinterpretándolo como si fuera parte de un host, porque ahí es
// donde se colaría una URL maliciosa disfrazada de typo.
export function normalizeHttpUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || URL_SCHEME_PATTERN.test(trimmed)) return trimmed
  return `https://${trimmed}`
}
