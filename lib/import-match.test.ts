import { describe, expect, it } from "vitest";
import { buildMatchQueries, rankCandidates } from "@/lib/import-match";
import type { Book } from "@/types/book";

function book(id: string, title: string, authors: string[], coverUrl: string | null = null): Book {
  return {
    id,
    googleBooksId: id,
    title,
    authors,
    coverUrl,
    pageCount: null,
    description: null,
    publishedDate: null,
  };
}

describe("buildMatchQueries", () => {
  it("tries ISBN first, then title + author", () => {
    expect(
      buildMatchQueries({ title: 'El "Aleph"', authors: ["Borges"], isbn: "9788499089508" }),
    ).toEqual(['isbn:9788499089508', 'intitle:"El Aleph" inauthor:"Borges"', "El Aleph Borges"]);
  });

  it("uses only the title when there is no author", () => {
    expect(buildMatchQueries({ title: "Rayuela", authors: [], isbn: null })).toEqual([
      'intitle:"Rayuela"',
    ]);
  });
});

describe("rankCandidates", () => {
  it("prefers exact title and matching author over Google's order", () => {
    const ranked = rankCandidates({ title: "Rayuela", authors: ["Julio Cortázar"], isbn: null }, [
      book("a", "Guía de lectura de Rayuela", ["Otro"]),
      book("b", "Rayuela", ["Julio Cortazar"], "https://books.google.com/x"),
      book("b", "Rayuela", ["Julio Cortazar"]),
    ]);
    expect(ranked.map((candidate) => candidate.id)).toEqual(["b", "a"]);
  });
});
