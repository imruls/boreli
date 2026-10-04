import { describe, expect, it } from "vitest";
import { THEME_COOKIE, parseThemePreference, themeCookieValue } from "@/lib/theme";

describe("parseThemePreference", () => {
  it("acepta las preferencias forzadas", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });

  it("cae a 'system' sin cookie o con un valor desconocido", () => {
    expect(parseThemePreference(undefined)).toBe("system");
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference("sepia")).toBe("system");
  });
});

describe("themeCookieValue", () => {
  it("arma una cookie de un año para todo el sitio", () => {
    expect(themeCookieValue("dark")).toBe(
      `${THEME_COOKIE}=dark; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  });
});
