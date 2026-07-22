import { describe, expect, it } from "vitest";
import {
  parseAddBookInput,
  parseBookInput,
  parseUserBookInput,
} from "@/lib/book-validation";

const validBook = {
  id: "google-volume-id",
  googleBooksId: "google-volume-id",
  title: "El nombre del viento",
  authors: ["Patrick Rothfuss"],
  coverUrl: "https://books.google.com/cover.jpg",
  pageCount: 662,
  description: "Novela",
  publishedDate: "2007",
};

describe("book input validation", () => {
  it("normalizes a valid catalog book", () => {
    expect(parseBookInput({ ...validBook, title: "  El nombre del viento  " })).toMatchObject({
      title: "El nombre del viento",
      pageCount: 662,
    });
  });

  it("rejects unsafe cover protocols and duplicate tags", () => {
    expect(() => parseBookInput({ ...validBook, coverUrl: "file:///etc/passwd" })).toThrow(
      "URL de portada inválida",
    );
    expect(() =>
      parseAddBookInput("reading", ["physical", "physical"], undefined, undefined),
    ).toThrow("no pueden repetirse");
  });

  it("rejects rating outside read and malformed progress", () => {
    expect(() => parseAddBookInput("reading", [], 5, undefined)).toThrow(
      "Rating y reseña solo se permiten",
    );
    expect(() =>
      parseUserBookInput({
        status: "reading",
        tags: [],
        progressType: "pages",
        progressCurrent: 80,
        progressTotalPages: 50,
      }),
    ).toThrow("progreso por páginas");
  });

  it("accepts bounded page progress", () => {
    expect(
      parseUserBookInput({
        status: "reading",
        tags: ["physical"],
        progressType: "pages",
        progressCurrent: 80,
        progressTotalPages: 300,
      }),
    ).toMatchObject({
      progressType: "pages",
      progressCurrent: 80,
      progressTotalPages: 300,
    });
  });
});
