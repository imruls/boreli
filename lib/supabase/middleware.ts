import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = ["/login", "/signup", "/forgot-password"];
// Accesibles con o sin sesión: el link de recuperación de contraseña llega
// sin sesión y es justamente el que la crea.
const PUBLIC_PATHS = ["/auth/recovery"];

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";

// style-src-attr permite 'unsafe-inline': components/books/progress-bar.tsx,
// toggle-group.tsx y recharts (gráficos de perfil/estadisticas) dependen del
// atributo `style` inline de React para porcentajes/colores dinámicos, que
// un CSP estricto (nonce/hash) rompería visualmente sin ningún error en
// consola — un nonce no sirve para el atributo `style` (solo para <style>/
// <link>) y un hash no funciona porque el valor cambia por request.
// style-src-elem sí queda en 'self': la app nunca renderiza un <style> propio
// (todo el CSS sale del stylesheet compilado por Tailwind), así que no hace
// falta relajarlo — si algún día una inyección lograra insertar un <style>
// tag, esto lo bloquea igual, aunque el atributo siga permitido.
// React usa eval() en modo desarrollo para Fast Refresh / reconstrucción de
// stack traces (nunca en producción) — sin 'unsafe-eval' acá, `pnpm dev`
// tira una pantalla de error apenas se carga cualquier página.
// Mismo criterio para style-src-elem: el indicador/overlay de Next en
// desarrollo inyecta <style> inline en su shadow DOM; sin 'unsafe-inline'
// queda sin estilos y se dibuja como una caja/línea suelta arriba a la
// izquierda. En producción ese indicador no existe y la directiva sigue en 'self'.
const isDev = process.env.NODE_ENV !== "production";

function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? ` 'unsafe-eval'` : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `style-src-elem 'self'${isDev ? ` 'unsafe-inline'` : ""}`,
    `style-src-attr 'unsafe-inline'`,
    `img-src 'self' https://books.google.com https://books.googleusercontent.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""} data:`,
    `font-src 'self' data:`,
    `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  return response;
}

// Refresca la sesión de Supabase en cada request, protege las rutas del
// dashboard (sin sesión → /login, con sesión → saca de /login y /signup) y
// aplica headers de seguridad (CSP con nonce, HSTS, etc.) a toda respuesta.
export async function updateSession(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const matchesPath = (path: string) =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`);

  if (PUBLIC_PATHS.some(matchesPath)) {
    return applySecurityHeaders(supabaseResponse, csp);
  }

  const isAuthPath = AUTH_PATHS.some(matchesPath);

  if (!user && !isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return applySecurityHeaders(NextResponse.redirect(url), csp);
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return applySecurityHeaders(NextResponse.redirect(url), csp);
  }

  return applySecurityHeaders(supabaseResponse, csp);
}
