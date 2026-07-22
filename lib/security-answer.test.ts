import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashSecurityAnswer, runDummySecurityAnswerWork, verifySecurityAnswer } from "@/lib/security-answer";

function legacyHash(answer: string): string {
  return createHash("sha256")
    .update(`boreli-security-answer:${answer.trim().toLowerCase()}`)
    .digest("hex");
}

describe("security answers", () => {
  it("uses a random salt and verifies the correct answer", async () => {
    const firstHash = await hashSecurityAnswer("Firulais");
    const secondHash = await hashSecurityAnswer("Firulais");

    expect(firstHash).not.toBe(secondHash);
    await expect(verifySecurityAnswer(" firulais ", firstHash)).resolves.toEqual({
      valid: true,
      needsRehash: false,
    });
    await expect(verifySecurityAnswer("otra", firstHash)).resolves.toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it("accepts a legacy hash once and marks it for migration", async () => {
    await expect(
      verifySecurityAnswer("Mi Mascota", legacyHash("mi mascota")),
    ).resolves.toEqual({
      valid: true,
      needsRehash: true,
    });
  });

  it("rejects malformed or attacker-controlled hash parameters", async () => {
    await expect(verifySecurityAnswer("respuesta", "scrypt$v1$999999$8$1$a$b")).resolves.toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it("exposes dummy scrypt work for timing padding", async () => {
    await expect(runDummySecurityAnswerWork()).resolves.toBeUndefined();
  });
});
