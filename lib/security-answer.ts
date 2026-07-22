import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

// Server-only (usa node:crypto): no importar desde componentes "use client".
// La pregunta en sí vive en lib/security-question.ts para poder mostrarla
// también desde el cliente sin arrastrar este módulo.
export { SECURITY_QUESTION } from "@/lib/security-question";

const LEGACY_SECURITY_ANSWER_SALT = "boreli-security-answer";
const HASH_PREFIX = "scrypt";
const HASH_VERSION = "v1";
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SALT_BYTES = 16;
const DERIVED_KEY_BYTES = 64;

function normalizeAnswer(answer: string): string {
  return answer.normalize("NFKC").trim().toLocaleLowerCase("es");
}

function hashLegacySecurityAnswer(answer: string): string {
  return createHash("sha256")
    .update(`${LEGACY_SECURITY_ANSWER_SALT}:${answer.trim().toLowerCase()}`)
    .digest("hex");
}

function deriveKey(answer: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      normalizeAnswer(answer),
      salt,
      DERIVED_KEY_BYTES,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
        maxmem: 32 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
}

export async function hashSecurityAnswer(answer: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await deriveKey(answer, salt);

  return [
    HASH_PREFIX,
    HASH_VERSION,
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export type SecurityAnswerVerification = {
  valid: boolean;
  needsRehash: boolean;
};

// Misma carga de scrypt que un verify real, para enmascarar timing cuando no
// hay hash que comparar (email inexistente / sin respuesta configurada).
export async function runDummySecurityAnswerWork(): Promise<void> {
  await deriveKey("timing-dummy", Buffer.alloc(SALT_BYTES));
}

export async function verifySecurityAnswer(
  answer: string,
  storedHash: string,
): Promise<SecurityAnswerVerification> {
  // Compatibilidad con cuentas creadas antes del hardening. Un acierto se
  // migra a scrypt desde la Server Action que ya posee la respuesta en claro.
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const actual = Buffer.from(hashLegacySecurityAnswer(answer), "hex");
    const expected = Buffer.from(storedHash, "hex");
    return {
      valid: actual.length === expected.length && timingSafeEqual(actual, expected),
      needsRehash: true,
    };
  }

  const parts = storedHash.split("$");
  if (parts.length !== 7) {
    await runDummySecurityAnswerWork();
    return { valid: false, needsRehash: false };
  }

  const [prefix, version, costRaw, blockSizeRaw, parallelizationRaw, saltRaw, digestRaw] = parts;
  const cost = Number(costRaw);
  const blockSize = Number(blockSizeRaw);
  const parallelization = Number(parallelizationRaw);
  if (
    prefix !== HASH_PREFIX ||
    version !== HASH_VERSION ||
    cost !== SCRYPT_COST ||
    blockSize !== SCRYPT_BLOCK_SIZE ||
    parallelization !== SCRYPT_PARALLELIZATION
  ) {
    await runDummySecurityAnswerWork();
    return { valid: false, needsRehash: false };
  }

  try {
    const salt = Buffer.from(saltRaw, "base64url");
    const expected = Buffer.from(digestRaw, "base64url");
    if (salt.length !== SALT_BYTES || expected.length !== DERIVED_KEY_BYTES) {
      await runDummySecurityAnswerWork();
      return { valid: false, needsRehash: false };
    }

    const actual = await deriveKey(answer, salt);
    return {
      valid: actual.length === expected.length && timingSafeEqual(actual, expected),
      needsRehash: false,
    };
  } catch {
    await runDummySecurityAnswerWork();
    return { valid: false, needsRehash: false };
  }
}
