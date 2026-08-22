import { describe, expect, it } from "vitest";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/utils";

describe("normalizeHttpUrl", () => {
  it("antepone https:// cuando no hay ningún esquema", () => {
    expect(normalizeHttpUrl("midominio.com/portada.jpg")).toBe(
      "https://midominio.com/portada.jpg",
    );
    expect(normalizeHttpUrl("www.midominio.com/portada.jpg")).toBe(
      "https://www.midominio.com/portada.jpg",
    );
  });

  it("no toca una URL que ya trae http:// o https://", () => {
    expect(normalizeHttpUrl("http://midominio.com/portada.jpg")).toBe(
      "http://midominio.com/portada.jpg",
    );
    expect(normalizeHttpUrl("https://midominio.com/portada.jpg")).toBe(
      "https://midominio.com/portada.jpg",
    );
  });

  it("no reinterpreta esquemas peligrosos como si fueran un host", () => {
    // Estos deben quedar intactos (no anteponer https://) para que
    // `isHttpUrl` los siga rechazando tal cual, en vez de que la
    // normalización los "arregle" hacia una URL que sí pasa la validación.
    expect(normalizeHttpUrl("javascript:alert(1)")).toBe("javascript:alert(1)");
    expect(normalizeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(
      "data:text/html,<script>alert(1)</script>",
    );
    expect(normalizeHttpUrl("file:///etc/passwd")).toBe("file:///etc/passwd");
  });

  it("el resultado normalizado sigue pasando por isHttpUrl sin abrir agujeros", () => {
    expect(isHttpUrl(normalizeHttpUrl("midominio.com/portada.jpg"))).toBe(true);
    expect(isHttpUrl(normalizeHttpUrl("javascript:alert(1)"))).toBe(false);
    expect(isHttpUrl(normalizeHttpUrl("data:text/html,<script>alert(1)</script>"))).toBe(false);
    expect(isHttpUrl(normalizeHttpUrl("file:///etc/passwd"))).toBe(false);
  });

  it("mantiene el trim y el caso vacío", () => {
    expect(normalizeHttpUrl("  midominio.com/portada.jpg  ")).toBe(
      "https://midominio.com/portada.jpg",
    );
    expect(normalizeHttpUrl("   ")).toBe("");
  });
});
