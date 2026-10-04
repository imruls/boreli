import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Destino del link de recuperación de Supabase (`redirectTo` en
// app/(auth)/forgot-password/actions.ts). Canjea el código PKCE por una
// sesión — el code verifier vive en una cookie, por eso el link tiene que
// abrirse en el mismo navegador donde se pidió — y manda a elegir la nueva
// contraseña.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/reset-password", request.url));
    }
    console.error("[auth/recovery] No se pudo canjear el código", error);
  }

  return NextResponse.redirect(new URL("/forgot-password?error=link-expired", request.url));
}
