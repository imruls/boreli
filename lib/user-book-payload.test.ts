import { describe, expect, it } from "vitest";
import { buildUserBookUpsert } from "@/lib/user-book-payload";

const now = "2026-07-21T12:00:00.000Z";

describe("user book upsert payload", () => {
  it("clears progress atomically when a book leaves reading", () => {
    const payload = buildUserBookUpsert(
      "user-id",
      "book-id",
      { status: "read", tags: [], rating: 5, note: "Excelente" },
      now,
    );

    expect(payload).toMatchObject({
      status: "read",
      rating: 5,
      progress_type: null,
      progress_current: null,
      progress_total_pages: null,
      started_at: null,
      finished_at: now,
    });
  });

  it("does not erase existing progress when re-adding as reading", () => {
    const payload = buildUserBookUpsert(
      "user-id",
      "book-id",
      { status: "reading", tags: ["kindle"] },
      now,
    );

    expect(payload).not.toHaveProperty("progress_type");
    expect(payload).not.toHaveProperty("progress_current");
    expect(payload).not.toHaveProperty("progress_total_pages");
    expect(payload.started_at).toBe(now);
  });
});
