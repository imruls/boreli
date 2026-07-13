"use client";

import { useMemo, useState } from "react";
import { TagFilterChips, type TagFilterValue } from "@/components/books/tag-filter-chips";
import { BookCard } from "@/components/books/book-card";
import { BookTagBadge } from "@/components/books/book-tag-badge";
import { RatingStars } from "@/components/books/rating-stars";
import { BookStatusMenuButton } from "@/components/books/book-status-menu-button";
import type { UserBook } from "@/types/book";

export function BookListWithFilter({
  items,
  showRating = false,
}: {
  items: UserBook[];
  showRating?: boolean;
}) {
  const [filter, setFilter] = useState<TagFilterValue>("all");

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.tags.includes(filter))),
    [items, filter],
  );

  return (
    <div className="flex flex-col gap-3">
      <TagFilterChips value={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <p className="px-1 py-10 text-center text-sm text-ink-muted">
          No hay libros con ese formato todavía.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((userBook) => (
            <BookCard
              key={userBook.id}
              title={userBook.book.title}
              authors={userBook.book.authors}
              coverUrl={userBook.book.coverUrl}
              trustedCover={Boolean(userBook.book.googleBooksId)}
              meta={
                userBook.tags.length > 0 || (showRating && userBook.rating) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {showRating && userBook.rating ? <RatingStars rating={userBook.rating} /> : null}
                    {userBook.tags.map((tag) => (
                      <BookTagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                ) : undefined
              }
              action={
                <BookStatusMenuButton
                  userBookId={userBook.id}
                  bookTitle={userBook.book.title}
                  currentStatus={userBook.status}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
