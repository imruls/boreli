import type { SupabaseClient } from "@supabase/supabase-js";

// RPC SECURITY DEFINER que solo devuelve un booleano al usuario autenticado
// (nunca el hash). Usar desde Server Components / Actions con el cliente
// de sesión, no con Service Role.
export async function userHasSecurityAnswer(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_security_answer");
  if (error) throw error;
  return data === true;
}
