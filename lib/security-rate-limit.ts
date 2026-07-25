import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitPolicy = {
  maxAttempts: number;
  windowSeconds: number;
  blockSeconds: number;
};

export function buildRateLimitKey(namespace: string, identifier: string): string {
  const digest = createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex");
  return `${namespace}:${digest}`;
}

export async function consumeSecurityRateLimit(
  admin: SupabaseClient,
  key: string,
  policy: RateLimitPolicy,
): Promise<boolean> {
  const { data, error } = await admin.rpc("consume_security_rate_limit", {
    p_key: key,
    p_max_attempts: policy.maxAttempts,
    p_window_seconds: policy.windowSeconds,
    p_block_seconds: policy.blockSeconds,
  });
  if (error) throw error;

  return data === true;
}

// A diferencia de consumeSecurityRateLimit, no incrementa el contador: sirve
// para rechazar una cuenta ya bloqueada ANTES de intentar la operación
// sensible, sin gastar un intento en el chequeo.
export async function isSecurityRateLimitBlocked(
  admin: SupabaseClient,
  key: string,
): Promise<boolean> {
  const { data, error } = await admin.rpc("is_security_rate_limit_blocked", { p_key: key });
  if (error) throw error;

  return data === true;
}
