"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hashSecurityAnswer } from "@/lib/security-answer";

export type SecurityAnswerState = {
  error: string | null;
  success: boolean;
};

// Permite a un usuario ya logueado definir o actualizar su respuesta de
// seguridad — necesaria para cuentas creadas antes de este flujo, o para
// cambiarla si el usuario quiere. A diferencia del reset sin sesión
// (app/(auth)/forgot-password/actions.ts), acá no hace falta la Service Role
// Key: el propio usuario autenticado puede tocar su `user_metadata`.
export async function updateSecurityAnswer(
  _prevState: SecurityAnswerState,
  formData: FormData,
): Promise<SecurityAnswerState> {
  const securityAnswer = formData.get("securityAnswer");

  if (typeof securityAnswer !== "string" || !securityAnswer.trim()) {
    return { error: "Escribí una respuesta.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase.auth.updateUser({
    data: { security_answer_hash: hashSecurityAnswer(securityAnswer) },
  });

  if (error) {
    return { error: "No se pudo guardar la respuesta. Intentá de nuevo.", success: false };
  }

  revalidatePath("/perfil/seguridad");
  return { error: null, success: true };
}
