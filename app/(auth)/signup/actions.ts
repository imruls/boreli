"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, upsertSecurityAnswerHash } from "@/lib/supabase/admin";
import { hashSecurityAnswer } from "@/lib/security-answer";
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

export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const securityAnswer = formData.get("securityAnswer");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof securityAnswer !== "string" ||
    !email ||
    !password ||
    !securityAnswer.trim()
  ) {
    return { error: "Completá email, contraseña y la respuesta de seguridad." };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
  }
  if (email.length > 320 || securityAnswer.length > 200) {
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
    // `identities` array, instead of failing. Bail out immediately without
    // touching user_security_answers, or an attacker could sign up with a
    // victim's email and overwrite their security answer / cause the
    // catch-block below to delete the victim's account.
    if (data.user.identities?.length === 0) {
      await consumeSecurityRateLimit(admin, accountKey, SIGNUP_ACCOUNT_LIMIT);
      return { error: GENERIC_ERROR };
    }

    try {
      // El hash va a la tabla privada (solo service_role), nunca a user_metadata/JWT.
      await upsertSecurityAnswerHash(
        admin,
        data.user.id,
        await hashSecurityAnswer(securityAnswer),
      );
    } catch (upsertError) {
      await admin.auth.admin.deleteUser(data.user.id);
      throw upsertError;
    }

    // Si el proyecto de Supabase tiene "Confirm email" activado, signUp no
    // devuelve sesión hasta que el usuario confirme por mail — el MVP asume
    // esa opción desactivada (ver CLAUDE.md: sin verificación de email).
    if (!data.session) {
      return { error: GENERIC_ERROR };
    }
  } catch (error) {
    console.error("[signup] No se pudo crear la cuenta", error);
    return { error: GENERIC_ERROR };
  }

  redirect("/");
}
