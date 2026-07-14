import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

// Cliente con la Service Role Key: bypassa RLS y habilita `auth.admin.*`
// (listar/actualizar usuarios sin su sesión). Se usa exclusivamente en Server
// Actions para el flujo de "olvidé mi contraseña" sin email — nunca se
// importa desde código de cliente ("use client").
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

// No hay filtro por email en `auth.admin.listUsers()`, así que se pagina a
// mano buscando la coincidencia. Alcanza de sobra para la escala de esta app
// (uso personal / pocos usuarios) — se corta en 10 páginas de 200 como tope
// de seguridad para no loopear indefinidamente.
export async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const perPage = 200;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (found) return found;

    if (data.users.length < perPage) break;
  }

  return null;
}
