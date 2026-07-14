import { createHash } from "node:crypto";

// Server-only (usa node:crypto): no importar desde componentes "use client".
// La pregunta en sí vive en lib/security-question.ts para poder mostrarla
// también desde el cliente sin arrastrar este módulo.
export { SECURITY_QUESTION } from "@/lib/security-question";

// Salt fijo a nivel app (no es un secreto de alta sensibilidad: protege una
// respuesta de recuperación, no la contraseña en sí) para que el hash no sea
// un SHA-256 plano de la respuesta normalizada.
const SECURITY_ANSWER_SALT = "boreli-security-answer";

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export function hashSecurityAnswer(answer: string): string {
  return createHash("sha256")
    .update(`${SECURITY_ANSWER_SALT}:${normalizeAnswer(answer)}`)
    .digest("hex");
}

export function verifySecurityAnswer(answer: string, hash: string): boolean {
  return hashSecurityAnswer(answer) === hash;
}
