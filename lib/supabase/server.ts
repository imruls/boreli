import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente para Server Components y Server Actions. Lee/escribe las cookies
// de sesión de la request actual para que auth.uid() esté disponible en RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se puede ignorar si se llama desde un Server Component: el
            // middleware de sesión (próximo paso, junto con login/signup)
            // es el que se encarga de refrescar las cookies.
          }
        },
      },
    },
  );
}
