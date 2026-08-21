import { headers } from "next/headers";

// En Vercel, `x-real-ip` (idéntico a `x-forwarded-for`) es el IP real del
// cliente: la plataforma sobrescribe cualquier valor entrante para evitar
// spoofing (https://vercel.com/docs/headers/request-headers#x-forwarded-for).
// Fuera de Vercel ese header lo puede setear el propio cliente, así que solo
// se confía en él cuando `process.env.VERCEL` confirma que corremos ahí —
// en cualquier otro entorno (local, otro hosting) se usa un bucket
// compartido para no otorgar un bypass gratis del rate limit por IP.
export async function getRequestIp(): Promise<string> {
  if (!process.env.VERCEL) return "missing-ip";

  const requestHeaders = await headers();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);

  return "missing-ip";
}
