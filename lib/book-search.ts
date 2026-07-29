import type { UserBook } from "@/types/book";

// Sin tildes ni mayúsculas, así "mexico" encuentra "México" y viceversa.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function filterUserBooksByQuery(items: UserBook[], query: string): UserBook[] {
  const trimmed = query.trim();
  if (!trimmed) return items;

  const needle = normalize(trimmed);
  return items.filter((item) => {
    const haystack = normalize([item.book.title, ...item.book.authors].join(" "));
    return haystack.includes(needle);
  });
}
