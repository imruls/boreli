"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
import { getRequestIp } from "@/lib/request-ip";

export type ForgotPasswordState = {
  error: string | null;
  success: boolean;
};

const SEND_ERROR = "No se pudo enviar el mail. Intentá de nuevo en unos minutos.";
const IP_LIMIT: RateLimitPolicy = {
  maxAttempts: 10,
  windowSeconds: 15 * 60,
  blockSeconds: 60 * 60,
};

async function getAppOrigin(): Promise<string> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

// Reset de contraseña con el flujo de email de Supabase: manda un link de
// recuperación que vuelve a `/auth/recovery` (canjea el código PKCE por una
// sesión) y de ahí a `/reset-password`. La respuesta es la misma exista o no
// el email, para no filtrar qué cuentas están registradas.
export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email) {
    return { error: "Ingresá tu email.", success: false };
  }
  if (email.length > 320) {
    return { error: SEND_ERROR, success: false };
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
      return { error: SEND_ERROR, success: false };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${await getAppOrigin()}/auth/recovery`,
    });
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("[forgot-password] No se pudo enviar el mail de recuperación", error);
    return { error: SEND_ERROR, success: false };
  }

  return { error: null, success: true };
}
