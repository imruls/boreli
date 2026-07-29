import { describe, expect, it } from "vitest";
import { filterUserBooksByQuery } from "@/lib/book-search";
import type { Book, UserBook } from "@/types/book";

function makeBook(overrides: Partial<Book>): Book {
  return {
    id: "book-1",
    googleBooksId: null,
    title: "Sin título",
    authors: [],
    coverUrl: null,
    pageCount: null,
    description: null,
    publishedDate: null,
    ...overrides,
  };
}

function makeUserBook(book: Partial<Book>): UserBook {
  return {
    id: `user-book-${book.title}`,
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
    finishedAt: null,
    createdAt: new Date().toISOString(),
    book: makeBook(book),
  };
}

describe("filterUserBooksByQuery", () => {
  const items = [
    makeUserBook({ title: "Cien años de soledad", authors: ["Gabriel García Márquez"] }),
    makeUserBook({ title: "El nombre del viento", authors: ["Patrick Rothfuss"] }),
    makeUserBook({ title: "México profundo", authors: ["Guillermo Bonfil Batalla"] }),
  ];

  it("returns everything when the query is empty", () => {
    expect(filterUserBooksByQuery(items, "")).toHaveLength(3);
    expect(filterUserBooksByQuery(items, "   ")).toHaveLength(3);
  });

  it("matches by title, case-insensitive", () => {
    const result = filterUserBooksByQuery(items, "nombre del viento");
    expect(result).toHaveLength(1);
    expect(result[0].book.title).toBe("El nombre del viento");
  });

  it("matches by author", () => {
    const result = filterUserBooksByQuery(items, "rothfuss");
    expect(result).toHaveLength(1);
    expect(result[0].book.title).toBe("El nombre del viento");
  });

  it("ignores accents in both the query and the data", () => {
    expect(filterUserBooksByQuery(items, "anos de soledad")).toHaveLength(1);
    expect(filterUserBooksByQuery(items, "méxico")).toHaveLength(1);
    expect(filterUserBooksByQuery(items, "garcia marquez")).toHaveLength(1);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterUserBooksByQuery(items, "no existe este libro")).toHaveLength(0);
  });
});
