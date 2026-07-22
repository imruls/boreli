"use server";

import {
  createAdminClient,
  findUserByEmail,
  upsertSecurityAnswerHash,
} from "@/lib/supabase/admin";
import {
  hashSecurityAnswer,
  runDummySecurityAnswerWork,
  verifySecurityAnswer,
} from "@/lib/security-answer";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
import { getRequestIp } from "@/lib/request-ip";
import { validatePassword } from "@/lib/password-policy";

export type ForgotPasswordState = {
  error: string | null;
  success: boolean;
};

const GENERIC_ERROR =
  "No se pudo verificar la identidad. Revisá el email, la respuesta y volvé a intentar.";
const ACCOUNT_LIMIT: RateLimitPolicy = {
  maxAttempts: 5,
  windowSeconds: 15 * 60,
  blockSeconds: 30 * 60,
};
const IP_LIMIT: RateLimitPolicy = {
  maxAttempts: 20,
  windowSeconds: 15 * 60,
  blockSeconds: 60 * 60,
};

// Reset de contraseña sin servicio de email: en vez del flujo estándar de
// Supabase (magic link por mail), se verifica identidad con la respuesta a
// la pregunta de seguridad fija (ver lib/security-question.ts) guardada en
// la tabla privada `user_security_answers`, y se cambia la contraseña con
// la Service Role Key. El mensaje de error es siempre el mismo genérico
// para no filtrar si el email existe o si fue la respuesta la que falló.
export async function resetPassword(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = formData.get("email");
  const securityAnswer = formData.get("securityAnswer");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof email !== "string" ||
    typeof securityAnswer !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string" ||
    !email ||
    !securityAnswer ||
    !newPassword ||
    !confirmPassword
  ) {
    return { error: "Completá todos los campos.", success: false };
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return { error: passwordError, success: false };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Las contraseñas no coinciden.", success: false };
  }

  if (email.length > 320 || securityAnswer.length > 200) {
    return { error: GENERIC_ERROR, success: false };
  }

  try {
    const admin = createAdminClient();
    const ip = await getRequestIp();
    const ipAllowed = await consumeSecurityRateLimit(
      admin,
      buildRateLimitKey("password-reset-ip", ip),
      IP_LIMIT,
    );
    if (!ipAllowed) {
      return { error: GENERIC_ERROR, success: false };
    }

    const user = await findUserByEmail(admin, email);
    if (!user?.securityAnswerHash) {
      await runDummySecurityAnswerWork();
      return { error: GENERIC_ERROR, success: false };
    }

    const verification = await verifySecurityAnswer(securityAnswer, user.securityAnswerHash);
    if (!verification.valid) {
      // Solo se cobra el bucket de cuenta tras un fallo real de identidad,
      // para no bloquear recovery de emails inexistentes / sin hash.
      // Un acierto correcto sigue permitido aunque el bucket de fallos esté
      // agotado (mitiga DoS de recuperación).
      await consumeSecurityRateLimit(
        admin,
        buildRateLimitKey("password-reset-account", email),
        ACCOUNT_LIMIT,
      );
      return { error: GENERIC_ERROR, success: false };
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (error) {
      throw error;
    }

    if (verification.needsRehash) {
      await upsertSecurityAnswerHash(admin, user.id, await hashSecurityAnswer(securityAnswer));
    }
  } catch (error) {
    console.error("[forgot-password] No se pudo completar el reset", error);
    return { error: GENERIC_ERROR, success: false };
  }

  return { error: null, success: true };
}
