import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";

// Cliente con la Service Role Key: bypassa RLS y habilita `auth.admin.*`.
// Usos server-only (nunca desde "use client"):
// - borrado de cuenta (`auth.admin.deleteUser`)
// - RPCs de rate limit (`consume_security_rate_limit`) desde search/login/signup/reset
export function createAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno (ver tech-stack.md).",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetchWithTimeout },
  });
}
