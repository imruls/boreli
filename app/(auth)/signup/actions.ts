"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePassword } from "@/lib/password-policy";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  isSecurityRateLimitBlocked,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
import { getRequestIp } from "@/lib/request-ip";
import type { AuthActionState } from "@/app/(auth)/login/actions";

const SIGNUP_IP_LIMIT: RateLimitPolicy = {
  maxAttempts: 10,
  windowSeconds: 15 * 60,
  blockSeconds: 60 * 60,
};
const SIGNUP_ACCOUNT_LIMIT: RateLimitPolicy = {
  maxAttempts: 5,
  windowSeconds: 15 * 60,
  blockSeconds: 30 * 60,
};
const GENERIC_ERROR = "No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.";

export type SignupActionState = AuthActionState & {
  // La cuenta se creó pero Supabase exige confirmar el email antes de dar sesión.
  pendingConfirmation?: boolean;
};

export async function signup(
  _prevState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Completá email y contraseña." };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
  }
  if (email.length > 320) {
    return { error: GENERIC_ERROR };
  }

  try {
    const admin = createAdminClient();
    const ip = await getRequestIp();
    const ipAllowed = await consumeSecurityRateLimit(
      admin,
      buildRateLimitKey("signup-ip", ip),
      SIGNUP_IP_LIMIT,
    );
    if (!ipAllowed) {
      return { error: GENERIC_ERROR };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const accountKey = buildRateLimitKey("signup-account", normalizedEmail);
    if (await isSecurityRateLimitBlocked(admin, accountKey)) {
      return { error: GENERIC_ERROR };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      return { error: GENERIC_ERROR };
    }

    // Supabase's anti-enumeration behavior: signUp() on an email that's
    // already registered returns the existing user (no error) with an empty
    // `identities` array, instead of failing. Count it against the account
    // rate limit and answer with the same generic error.
    if (data.user.identities?.length === 0) {
      await consumeSecurityRateLimit(admin, accountKey, SIGNUP_ACCOUNT_LIMIT);
      return { error: GENERIC_ERROR };
    }

    // Con "Confirm email" activado en Supabase, signUp no devuelve sesión
    // hasta que el usuario confirme por mail: la cuenta ya existe, solo falta
    // confirmar e ingresar desde /login.
    if (!data.session) {
      return { error: null, pendingConfirmation: true };
    }
  } catch (error) {
    console.error("[signup] No se pudo crear la cuenta", error);
    return { error: GENERIC_ERROR };
  }

  redirect("/");
}
