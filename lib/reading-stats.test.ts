import { describe, expect, it } from "vitest";
import {
  getMonthlyPagesRead,
  getMonthlyReadCounts,
  getRatingDistribution,
  getTagDistribution,
  getYearlyPagesRead,
  getYearlyReadCounts,
} from "@/lib/reading-stats";
import type { UserBook } from "@/types/book";

function makeUserBook(overrides: Partial<UserBook> = {}): UserBook {
  return {
    id: "ub-1",
    userId: "user-1",
    bookId: "book-1",
    status: "read",
    tags: [],
    rating: null,
    note: null,
    progressType: null,
    progressCurrent: null,
    progressTotalPages: null,
    startedAt: null,
    finishedAt: "2026-03-15T12:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    book: {
      id: "book-1",
      googleBooksId: "gb-1",
      title: "Libro de prueba",
      authors: ["Autora Ejemplo"],
      coverUrl: null,
      pageCount: 300,
      description: null,
      publishedDate: null,
    },
    ...overrides,
  };
}

describe("reading-stats", () => {
  it("returns empty arrays for no books", () => {
    expect(getMonthlyReadCounts([])).toEqual([]);
    expect(getYearlyReadCounts([])).toEqual([]);
    expect(getMonthlyPagesRead([])).toEqual([]);
    expect(getYearlyPagesRead([])).toEqual([]);
    expect(getTagDistribution([])).toHaveLength(5);
    expect(getTagDistribution([]).every((point) => point.count === 0)).toBe(true);
    expect(getRatingDistribution([])).toHaveLength(5);
    expect(getRatingDistribution([]).every((point) => point.count === 0)).toBe(true);
  });

  it("buckets a single book by month and year", () => {
    const books = [makeUserBook()];
    expect(getMonthlyReadCounts(books)).toEqual([
      { monthKey: "2026-03", label: "Mar 2026", value: 1 },
    ]);
    expect(getYearlyReadCounts(books)).toEqual([{ year: "2026", value: 1 }]);
    expect(getMonthlyPagesRead(books)).toEqual([
      { monthKey: "2026-03", label: "Mar 2026", value: 300 },
    ]);
  });

  it("sums across multiple months and years chronologically", () => {
    const books = [
      makeUserBook({ id: "a", finishedAt: "2025-12-01T00:00:00.000Z" }),
      makeUserBook({ id: "b", finishedAt: "2026-01-10T00:00:00.000Z" }),
      makeUserBook({ id: "c", finishedAt: "2026-01-20T00:00:00.000Z" }),
    ];
    expect(getMonthlyReadCounts(books)).toEqual([
      { monthKey: "2025-12", label: "Dic 2025", value: 1 },
      { monthKey: "2026-01", label: "Ene 2026", value: 2 },
    ]);
    expect(getYearlyReadCounts(books)).toEqual([
      { year: "2025", value: 1 },
      { year: "2026", value: 2 },
    ]);
  });

  it("treats null pageCount as zero for pages read", () => {
    const books = [
      makeUserBook({ book: { ...makeUserBook().book, pageCount: null } }),
      makeUserBook({ id: "b" }),
    ];
    expect(getMonthlyPagesRead(books)).toEqual([
      { monthKey: "2026-03", label: "Mar 2026", value: 300 },
    ]);
    expect(getYearlyPagesRead(books)).toEqual([{ year: "2026", value: 300 }]);
  });

  it("ignores books without finishedAt defensively", () => {
    const books = [makeUserBook({ finishedAt: null })];
    expect(getMonthlyReadCounts(books)).toEqual([]);
    expect(getYearlyReadCounts(books)).toEqual([]);
  });

  it("counts a book toward every tag it has, not mutually exclusive", () => {
    const books = [makeUserBook({ tags: ["physical", "kindle"] }), makeUserBook({ id: "b", tags: ["kindle"] })];
    const distribution = getTagDistribution(books);
    expect(distribution.find((p) => p.tag === "kindle")?.count).toBe(2);
    expect(distribution.find((p) => p.tag === "physical")?.count).toBe(1);
    expect(distribution.find((p) => p.tag === "pdf")?.count).toBe(0);
  });

  it("counts ratings across all five buckets, ignoring null ratings", () => {
    const books = [1, 2, 3, 4, 5, 5].map((rating, index) =>
      makeUserBook({ id: `r${index}`, rating }),
    );
    books.push(makeUserBook({ id: "unrated", rating: null }));
    const distribution = getRatingDistribution(books);
    expect(distribution).toEqual([
      { rating: 1, count: 1 },
      { rating: 2, count: 1 },
      { rating: 3, count: 1 },
      { rating: 4, count: 1 },
      { rating: 5, count: 2 },
    ]);
  });
});
