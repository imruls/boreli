import { Clock, BookOpen, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BookStatus } from "@/types/book";

// Fuente de verdad de los status: types/book.ts (a su vez, data-model.md).
export const BOOK_STATUS_OPTIONS: { status: BookStatus; label: string; icon: LucideIcon }[] = [
  { status: "want_to_read", label: "Quiero leer", icon: Clock },
  { status: "reading", label: "Leyendo", icon: BookOpen },
  { status: "read", label: "Leído", icon: CheckCircle2 },
];
