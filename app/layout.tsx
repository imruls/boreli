import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Roboto_Slab } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { THEME_COLORS, THEME_COOKIE, parseThemePreference } from "@/lib/theme";
import "./globals.css";

// Solo para el wordmark "BORELI" (`font-brand`); el resto de la UI usa la fuente
// del sistema (ver design-system.md).
const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Boreli",
  description: "Registrá los libros que leés, querés leer y ya leíste.",
  appleWebApp: {
    title: "Boreli",
  },
};

async function getThemePreference() {
  return parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
}

// `viewport-fit=cover` habilita `env(safe-area-inset-*)` en iPhone; `themeColor`
// pinta la barra del navegador con el fondo del modo activo (`--background`):
// fijo si se eligió Claro/Oscuro en Perfil, o según el sistema.
export async function generateViewport(): Promise<Viewport> {
  const theme = await getThemePreference();
  return {
    viewportFit: "cover",
    colorScheme: theme === "system" ? "light dark" : theme,
    themeColor:
      theme === "system"
        ? [
            { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
            { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
          ]
        : THEME_COLORS[theme],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemePreference();

  return (
    <html
      lang="es"
      // El servidor ya renderiza con el tema elegido: sin parpadeo al cargar.
      data-theme={theme === "system" ? undefined : theme}
      className={`${robotoSlab.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
