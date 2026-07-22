"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = {
  error: string | null;
  success: boolean;
};

const MAX_DISPLAY_NAME_LENGTH = 40;
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_BUCKET = "avatars";

// Actualiza `display_name` y, si el usuario elige una foto nueva, sube el
// archivo al bucket `avatars` (path `{user_id}/avatar`, sin extensión —
// Storage sirve el content-type real igual) y guarda su URL pública. Ambos
// campos viven en `user_metadata` (ver data-model.md) — no hay tabla
// `profiles`. La respuesta de seguridad va en `user_security_answers`, no acá.
export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const displayNameRaw = formData.get("displayName");
  const avatar = formData.get("avatar");

  if (typeof displayNameRaw !== "string") {
    return { error: "Nombre de usuario inválido.", success: false };
  }
  const displayName = displayNameRaw.trim();
  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      error: `El nombre de usuario no puede superar los ${MAX_DISPLAY_NAME_LENGTH} caracteres.`,
      success: false,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const metadata: Record<string, unknown> = { display_name: displayName || null };

  const hasNewAvatar = avatar instanceof File && avatar.size > 0;
  if (hasNewAvatar) {
    const file = avatar as File;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return { error: "La foto debe ser JPG, PNG o WEBP.", success: false };
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return { error: "La foto no puede superar los 5MB.", success: false };
    }

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(`${user.id}/avatar`, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      return { error: "No se pudo subir la foto. Intentá de nuevo.", success: false };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(`${user.id}/avatar`);
    // Cache-bust: la key no cambia entre subidas (mismo path), así que sin
    // esto el navegador podría seguir mostrando la foto vieja desde caché.
    metadata.avatar_url = `${publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase.auth.updateUser({ data: metadata });
  if (error) {
    return { error: "No se pudo guardar el perfil. Intentá de nuevo.", success: false };
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
  // El avatar también se muestra en AppHeader, que vive en el layout
  // compartido de todo `(dashboard)` — sin esto, el navbar seguiría
  // mostrando la foto/inicial vieja al navegar a otra pantalla hasta que
  // el Router Cache de esa ruta expire por su cuenta.
  revalidatePath("/", "layout");
  return { error: null, success: true };
}

// Vuelve al fallback de inicial: borra el archivo del bucket y limpia
// `avatar_url` de la metadata. Recibe (prevState, formData) sin usar
// ninguno de los dos porque `useActionState` (profile-form.tsx) llama a
// esta acción directo, sin un <form> propio con campos.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function removeAvatar(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  await supabase.storage.from(AVATAR_BUCKET).remove([`${user.id}/avatar`]);

  const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
  if (error) {
    return { error: "No se pudo quitar la foto. Intentá de nuevo.", success: false };
  }

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
  revalidatePath("/", "layout");
  return { error: null, success: true };
}
