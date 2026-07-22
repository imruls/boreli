import { headers } from "next/headers";

// En Vercel, `x-real-ip` es el IP del cliente que confía la plataforma.
// Preferirlo evita que un atacante rote el primer hop de `x-forwarded-for`.
// Si no hay IP (proxy mal configurado / local), se usa un bucket compartido
// para no saltarse el rate limit por IP.
export async function getRequestIp(): Promise<string> {
  const requestHeaders = await headers();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);

  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor.split(",").map((part) => part.trim()).filter(Boolean);
    const clientIp = hops.at(-1);
    if (clientIp) return clientIp.slice(0, 128);
  }

  return "missing-ip";
}
