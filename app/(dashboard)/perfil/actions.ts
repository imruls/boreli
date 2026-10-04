"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRateLimitKey,
  consumeSecurityRateLimit,
  isSecurityRateLimitBlocked,
  type RateLimitPolicy,
} from "@/lib/security-rate-limit";
import { getRequestIp } from "@/lib/request-ip";

export type DeleteAccountState = {
  error: string | null;
};

const DELETE_IP_LIMIT: RateLimitPolicy = {
  maxAttempts: 20,
  windowSeconds: 15 * 60,
  blockSeconds: 30 * 60,
};
const DELETE_ACCOUNT_LIMIT: RateLimitPolicy = {
  maxAttempts: 10,
  windowSeconds: 15 * 60,
  blockSeconds: 30 * 60,
};

// Borrado definitivo de la cuenta, a pedido del usuario desde /perfil. La
// barrera de seguridad es la contraseña actual (reautenticando con
// signInWithPassword), con rate limit por IP y por usuario. Acá el usuario
// ya está autenticado — no hay riesgo de enumeración de emails, así que los
// errores son específicos.
export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const password = formData.get("password");

  if (typeof password !== "string" || !password) {
    return { error: "Ingresá tu contraseña." };
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
      buildRateLimitKey("delete-account-ip", ip),
      DELETE_IP_LIMIT,
    );
    if (!ipAllowed) {
      return { error: "Demasiados intentos. Esperá unos minutos." };
    }

    const accountKey = buildRateLimitKey("delete-account-user", user.id);
    if (await isSecurityRateLimitBlocked(admin, accountKey)) {
      return { error: "Demasiados intentos. Esperá unos minutos." };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (signInError) {
      await consumeSecurityRateLimit(admin, accountKey, DELETE_ACCOUNT_LIMIT);
      return { error: "La contraseña es incorrecta." };
    }

    // Sin ON DELETE CASCADE de user_books hacia auth.users (data-model.md):
    // hay que borrar la biblioteca del usuario antes de poder borrar su
    // cuenta de Auth, o la foreign key rechaza el borrado. `books` es catálogo
    // compartido y no se toca.
    const { error: deleteBooksError } = await supabase
      .from("user_books")
      .delete()
      .eq("user_id", user.id);
    if (deleteBooksError) {
      return { error: "No se pudo eliminar tu biblioteca. Intentá de nuevo." };
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      return { error: "No se pudo eliminar la cuenta. Intentá de nuevo." };
    }
  } catch (error) {
    console.error("[delete-account] No se pudo eliminar la cuenta", error);
    return { error: "No se pudo eliminar la cuenta. Intentá de nuevo." };
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // La sesión ya puede estar inválida al borrarse el usuario; no bloquea el flujo.
  }

  redirect("/login");
}
