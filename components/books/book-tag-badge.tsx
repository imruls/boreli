import { Badge } from "@/components/ui/badge";
import { BOOK_TAG_LABELS } from "@/lib/book-tags";
import type { BookTag } from "@/types/book";

export function BookTagBadge({ tag, className }: { tag: BookTag; className?: string }) {
  return (
    <Badge variant="secondary" className={className}>
      {BOOK_TAG_LABELS[tag]}
    </Badge>
  );
}
