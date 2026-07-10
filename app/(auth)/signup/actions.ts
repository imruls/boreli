"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/app/(auth)/login/actions";

export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Completá email y contraseña." };
  }

  if (password.length < 6) {
    return { error: "La contraseña tiene que tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Ya existe una cuenta con ese email." };
    }
    return { error: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  // Si el proyecto de Supabase tiene "Confirm email" activado, signUp no
  // devuelve sesión hasta que el usuario confirme por mail — el MVP asume
  // esa opción desactivada (ver CLAUDE.md: sin verificación de email).
  if (!data.session) {
    return {
      error:
        "Cuenta creada, pero falta confirmar el email. Revisá la config de Auth en Supabase (Confirm email debería estar desactivado en el MVP).",
    };
  }

  redirect("/");
}
