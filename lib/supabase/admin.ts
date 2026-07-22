import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente con la Service Role Key: bypassa RLS y habilita `auth.admin.*`.
// Usos server-only (nunca desde "use client"):
// - reset de contraseña sin email (`forgot-password`)
// - lectura/escritura de `user_security_answers`
// - borrado de cuenta (`auth.admin.deleteUser`)
// - RPCs de rate limit (`consume_security_rate_limit`) desde search/login/reset
export function createAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno (ver tech-stack.md).",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type PasswordRecoveryUser = {
  id: string;
  securityAnswerHash: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// La RPC es SECURITY DEFINER y solo tiene EXECUTE para service_role. Evita
// listar todos los usuarios de Auth y solo expone id + hash de la tabla
// privada `user_security_answers` (nunca metadata completa).
export async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<PasswordRecoveryUser | null> {
  const { data, error } = await admin.rpc("find_password_recovery_user", {
    p_email: email.trim().toLowerCase(),
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : null;
  if (!isRecord(row) || typeof row.user_id !== "string") {
    return null;
  }

  return {
    id: row.user_id,
    securityAnswerHash:
      typeof row.security_answer_hash === "string" ? row.security_answer_hash : null,
  };
}

export async function getSecurityAnswerHash(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("user_security_answers")
    .select("answer_hash")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return typeof data?.answer_hash === "string" ? data.answer_hash : null;
}

export async function upsertSecurityAnswerHash(
  admin: SupabaseClient,
  userId: string,
  answerHash: string,
): Promise<void> {
  const { error } = await admin.from("user_security_answers").upsert(
    {
      user_id: userId,
      answer_hash: answerHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
