// Preferencia de apariencia elegida en Perfil (ver design-system.md → "Color").
// "system" sigue a `prefers-color-scheme`; "light"/"dark" la fuerzan con el
// atributo `data-theme` en <html>. Se guarda en una cookie (por navegador, no
// por cuenta) para que el servidor renderice ya con el tema correcto, sin un
// parpadeo del otro modo al cargar.
export type ThemePreference = "system" | "light" | "dark";

export const THEME_COOKIE = "boreli-theme";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Color de la barra del navegador en cada modo (`--background`).
export const THEME_COLORS = { light: "#f1e9d8", dark: "#1a1613" } as const;

export function parseThemePreference(value: string | undefined): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function themeCookieValue(preference: ThemePreference): string {
  return `${THEME_COOKIE}=${preference}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

// Solo en el navegador: guarda la preferencia y la aplica al instante sobre <html>.
export function applyThemePreference(preference: ThemePreference) {
  document.cookie = themeCookieValue(preference);
  if (preference === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = preference;
  }
}
