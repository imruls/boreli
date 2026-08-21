const SIGNATURES: { mime: string; check: (bytes: Uint8Array) => boolean }[] = [
  { mime: "image/jpeg", check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    check: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: "image/webp",
    check: (b) =>
      // "RIFF"....."WEBP"
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

// Detecta el tipo real de una imagen por sus magic bytes en vez de confiar en
// el `Content-Type` declarado por el cliente (spoofeable). Devuelve null si
// no coincide con ningún formato soportado.
export function detectImageMimeType(bytes: Uint8Array): string | null {
  return SIGNATURES.find(({ check }) => check(bytes))?.mime ?? null;
}
