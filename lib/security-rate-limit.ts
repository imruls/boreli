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
