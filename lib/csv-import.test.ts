import { describe, expect, it } from "vitest";
import { buildLibraryCsv } from "@/lib/csv-export";
import { parseCsv, parseImportDate, parseLibraryCsv } from "@/lib/csv-import";
import type { UserBook } from "@/types/book";

function expectOk(result: ReturnType<typeof parseLibraryCsv>) {
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe("parseCsv", () => {
  it("handles quotes, escaped quotes and newlines inside fields", () => {
    expect(parseCsv('a,b\r\n"x, y","di ""hola""\nchau"\r\n')).toEqual([
      ["a", "b"],
      ["x, y", 'di "hola"\nchau'],
    ]);
  });

  it("detects semicolon as delimiter (Excel en español)", () => {
    expect(parseCsv("Título;Autor\nRayuela;Cortázar")).toEqual([
      ["Título", "Autor"],
      ["Rayuela", "Cortázar"],
    ]);
  });
});

describe("parseLibraryCsv", () => {
  it("round-trips the Boreli export", () => {
    const userBook: UserBook = {
      id: "1",
      userId: "u",
      bookId: "b",
      status: "read",
      tags: ["kindle", "physical"],
      rating: 4,
      note: "=Muy bueno, \"recomendado\"",
      progressType: null,
      progressCurrent: null,
      progressTotalPages: null,
      startedAt: "2024-01-02T10:00:00Z",
      finishedAt: "2024-02-03T10:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      book: {
        id: "b",
        googleBooksId: null,
        title: "Rayuela",
        authors: ["Julio Cortázar"],
        coverUrl: null,
        pageCount: null,
        description: null,
        publishedDate: null,
      },
    };

    const [row] = expectOk(parseLibraryCsv(buildLibraryCsv([userBook]))).rows;
    expect(row).toMatchObject({
      title: "Rayuela",
      authors: ["Julio Cortázar"],
      status: "read",
      tags: ["kindle", "physical"],
      rating: 4,
      note: '=Muy bueno, "recomendado"',
      startedAt: "2024-01-02",
      finishedAt: "2024-02-03",
    });
  });

  it("reads a Goodreads export", () => {
    const csv = [
      "Book Id,Title,Author,ISBN,ISBN13,My Rating,Date Read,Exclusive Shelf,My Review",
      '1,The Hobbit,J.R.R. Tolkien,="0618260307",="9780618260300",5,2023/05/14,read,Great<br/>book',
      '2,Dune,Frank Herbert,="",="",0,,to-read,',
    ].join("\n");

    const { rows } = expectOk(parseLibraryCsv(csv));
    expect(rows[0]).toMatchObject({
      isbn: "9780618260300",
      rating: 5,
      status: "read",
      finishedAt: "2023-05-14",
      note: "Great book",
    });
    expect(rows[1]).toMatchObject({ isbn: null, rating: null, status: "want_to_read" });
  });

  it("accepts a plain list with only titles and infers read from a rating", () => {
    const { rows, skippedLines } = expectOk(
      parseLibraryCsv("titulo,puntuación\nFicciones,5\n,3\nEl Aleph,"),
    );
    expect(rows.map((row) => [row.title, row.status])).toEqual([
      ["Ficciones", "read"],
      ["El Aleph", null],
    ]);
    expect(skippedLines).toEqual([3]);
  });

  it("fails without a title column", () => {
    expect(parseLibraryCsv("Autor\nBorges").ok).toBe(false);
  });

  it("truncates long notes", () => {
    const { rows } = expectOk(parseLibraryCsv(`Título,Reseña\nX,${"a".repeat(400)}`));
    expect(rows[0].note).toHaveLength(300);
    expect(rows[0].noteTruncated).toBe(true);
  });
});

describe("parseImportDate", () => {
  it("parses year-first and day-first dates", () => {
    expect(parseImportDate("2024-05-14")).toBe("2024-05-14");
    expect(parseImportDate("14/05/2024")).toBe("2024-05-14");
    expect(parseImportDate("31/02/2024")).toBeNull();
    expect(parseImportDate("ayer")).toBeNull();
  });
});
