import { describe, expect, it } from "vitest";
import { buildRateLimitKey } from "@/lib/security-rate-limit";

describe("security rate-limit keys", () => {
  it("normalizes identifiers without storing raw PII", () => {
    const first = buildRateLimitKey("password-reset-account", " User@Example.com ");
    const second = buildRateLimitKey("password-reset-account", "user@example.com");

    expect(first).toBe(second);
    expect(first).toMatch(/^password-reset-account:[a-f0-9]{64}$/);
    expect(first).not.toContain("user@example.com");
  });

  it("keeps namespaces isolated", () => {
    expect(buildRateLimitKey("password-reset-ip", "127.0.0.1")).not.toBe(
      buildRateLimitKey("books-search-user", "127.0.0.1"),
    );
  });
});
