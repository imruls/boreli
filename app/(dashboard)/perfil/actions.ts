"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySecurityAnswer } from "@/lib/security-answer";

export type DeleteAccountState = {
  error: string | null;
};

// Borrado definitivo de la cuenta, a pedido del usuario desde /perfil. Como
// no hay AlertDialog en el repo ni confirmación por email, la barrera de
// seguridad es doble: la contraseña actual (reautenticando con
// signInWithPassword) y la respuesta a la pregunta de seguridad fija (mismo
// mecanismo que app/(auth)/forgot-password/actions.ts). A diferencia de ese
// flujo, acá el usuario ya está autenticado — no hay riesgo de enumeración
// de emails, así que los errores son específicos por campo.
export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const securityAnswer = formData.get("securityAnswer");
  const password = formData.get("password");

  if (typeof password !== "string" || !password) {
    return { error: "Ingresá tu contraseña." };
  }
  if (typeof securityAnswer !== "string" || !securityAnswer.trim()) {
    return { error: "Respondé la pregunta de seguridad." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("No autenticado");

  const storedHash = user.user_metadata?.security_answer_hash;
  if (typeof storedHash !== "string") {
    return {
      error: "Todavía no configuraste una pregunta de seguridad. Hacelo desde /perfil/seguridad.",
    };
  }
  if (!verifySecurityAnswer(securityAnswer, storedHash)) {
    return { error: "La respuesta de seguridad no es correcta." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (signInError) {
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

  const admin = createAdminClient();
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteUserError) {
    return { error: "No se pudo eliminar la cuenta. Intentá de nuevo." };
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // La sesión ya puede estar inválida al borrarse el usuario; no bloquea el flujo.
  }

  redirect("/login");
}
