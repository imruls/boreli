"use server";

import { createAdminClient, findUserByEmail } from "@/lib/supabase/admin";
import { verifySecurityAnswer } from "@/lib/security-answer";

export type ForgotPasswordState = {
  error: string | null;
  success: boolean;
};

const GENERIC_ERROR =
  "No se pudo verificar la identidad. Revisá el email, la respuesta y volvé a intentar.";

// Reset de contraseña sin servicio de email: en vez del flujo estándar de
// Supabase (magic link por mail), se verifica identidad con la respuesta a
// la pregunta de seguridad fija (ver lib/security-question.ts) guardada al
// crear la cuenta, y se cambia la contraseña directo con la Service Role Key
// (lib/supabase/admin.ts). El mensaje de error es siempre el mismo genérico
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

  if (newPassword.length < 6) {
    return { error: "La nueva contraseña tiene que tener al menos 6 caracteres.", success: false };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Las contraseñas no coinciden.", success: false };
  }

  const admin = createAdminClient();
  const user = await findUserByEmail(admin, email);

  const storedHash = user?.user_metadata?.security_answer_hash;
  if (!user || typeof storedHash !== "string" || !verifySecurityAnswer(securityAnswer, storedHash)) {
    return { error: GENERIC_ERROR, success: false };
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) {
    return { error: "No se pudo actualizar la contraseña. Intentá de nuevo.", success: false };
  }

  return { error: null, success: true };
}
