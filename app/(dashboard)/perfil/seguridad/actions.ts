"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, upsertSecurityAnswerHash } from "@/lib/supabase/admin";
import { hashSecurityAnswer } from "@/lib/security-answer";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
import { getRequestIp } from "@/lib/request-ip";

export type SecurityAnswerState = {
  error: string | null;
  success: boolean;
};

const UPDATE_IP_LIMIT: RateLimitPolicy = {
  maxAttempts: 20,
  windowSeconds: 15 * 60,
  blockSeconds: 30 * 60,
};
const UPDATE_ACCOUNT_LIMIT: RateLimitPolicy = {
  maxAttempts: 10,
  windowSeconds: 15 * 60,
  blockSeconds: 30 * 60,
};

// Permite a un usuario ya logueado definir o actualizar su respuesta de
// seguridad. Requiere la contraseña actual (mitiga session hijack → cambio
// de respuesta → reset sin email). El hash se guarda en la tabla privada
// vía Service Role; el cliente autenticado solo ve un booleano.
export async function updateSecurityAnswer(
  _prevState: SecurityAnswerState,
  formData: FormData,
): Promise<SecurityAnswerState> {
  const securityAnswer = formData.get("securityAnswer");
  const password = formData.get("password");

  if (
    typeof securityAnswer !== "string" ||
    !securityAnswer.trim() ||
    securityAnswer.length > 200
  ) {
    return { error: "Escribí una respuesta.", success: false };
  }
  if (typeof password !== "string" || !password) {
    return { error: "Ingresá tu contraseña.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("No autenticado");

  try {
    const admin = createAdminClient();
    const ip = await getRequestIp();
    const ipAllowed = await consumeSecurityRateLimit(
      admin,
      buildRateLimitKey("security-answer-update-ip", ip),
      UPDATE_IP_LIMIT,
    );
    if (!ipAllowed) {
      return { error: "Demasiados intentos. Esperá unos minutos.", success: false };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (signInError) {
      await consumeSecurityRateLimit(
        admin,
        buildRateLimitKey("security-answer-update-account", user.id),
        UPDATE_ACCOUNT_LIMIT,
      );
      return { error: "La contraseña es incorrecta.", success: false };
    }

    await upsertSecurityAnswerHash(admin, user.id, await hashSecurityAnswer(securityAnswer));
  } catch (error) {
    console.error("[seguridad] No se pudo guardar la respuesta", error);
    return { error: "No se pudo guardar la respuesta. Intentá de nuevo.", success: false };
  }

  revalidatePath("/perfil/seguridad");
  revalidatePath("/perfil");
  return { error: null, success: true };
}
