"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
import { getRequestIp } from "@/lib/request-ip";

export type AuthActionState = {
  error: string | null;
};

const GENERIC_ERROR = "Email o contraseña incorrectos.";
const LOGIN_IP_LIMIT: RateLimitPolicy = {
  maxAttempts: 30,
  windowSeconds: 15 * 60,
  blockSeconds: 30 * 60,
};
const LOGIN_ACCOUNT_LIMIT: RateLimitPolicy = {
  maxAttempts: 10,
  windowSeconds: 15 * 60,
  blockSeconds: 30 * 60,
};

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Completá email y contraseña." };
  }

  if (email.length > 320) {
    return { error: GENERIC_ERROR };
  }

  try {
    const admin = createAdminClient();
    const ip = await getRequestIp();
    const ipAllowed = await consumeSecurityRateLimit(
      admin,
      buildRateLimitKey("login-ip", ip),
      LOGIN_IP_LIMIT,
    );
    if (!ipAllowed) {
      return { error: GENERIC_ERROR };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      await consumeSecurityRateLimit(
        admin,
        buildRateLimitKey("login-account", email),
        LOGIN_ACCOUNT_LIMIT,
      );
      return { error: GENERIC_ERROR };
    }
  } catch (error) {
    console.error("[login] No se pudo iniciar sesión", error);
    return { error: GENERIC_ERROR };
  }

  redirect("/");
}
