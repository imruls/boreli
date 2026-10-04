"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/password-policy";

export type ResetPasswordState = {
  error: string | null;
};

// Último paso de la recuperación: el usuario ya tiene la sesión que abrió
// `/auth/recovery` con el link del mail, así que alcanza con updateUser.
export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string" ||
    !newPassword ||
    !confirmPassword
  ) {
    return { error: "Completá ambos campos." };
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return { error: passwordError };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    if (error.code === "same_password") {
      return { error: "La nueva contraseña tiene que ser distinta de la anterior." };
    }
    console.error("[reset-password] No se pudo actualizar la contraseña", error);
    return { error: "No se pudo actualizar la contraseña. Intentá de nuevo." };
  }

  redirect("/");
}
