"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListItem, ListRow, ListSection } from "@/components/ui/list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Spinner } from "@/components/ui/spinner";
import { BookCover, COVER_FRAME_CLASS } from "@/components/books/book-card";
import { ImportMatchSheet, type ImportChoice } from "@/components/books/import-match-sheet";
import {
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_ROWS,
  buildTitleKey,
  parseLibraryCsv,
  type ImportRow,
} from "@/lib/csv-import";
import { IMPORT_CHUNK_SIZE, MATCH_CHUNK_SIZE } from "@/lib/import-match";
import { BOOK_STATUS_OPTIONS } from "@/lib/book-status";
import {
  importBooks,
  matchImportRows,
  type ImportItem,
  type ImportItemResult,
} from "@/app/(dashboard)/perfil/importar/actions";
import { cn } from "@/lib/utils";
import type { Book, BookStatus } from "@/types/book";

type ReviewRow = {
  row: ImportRow;
  candidates: Book[];
  choice: ImportChoice;
  included: boolean;
};

type Phase =
  | { name: "select"; error: string | null }
  | { name: "matching"; done: number; total: number }
  | { name: "review"; notices: string[] }
  | { name: "importing"; done: number; total: number }
  | { name: "done"; counts: Record<ImportItemResult, number>; error: string | null };

const STATUS_LABELS = Object.fromEntries(
  BOOK_STATUS_OPTIONS.map(({ status, label }) => [status, label]),
) as Record<BookStatus, string>;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

// Excel guarda los CSV en Windows-1252 si no se elige UTF-8 al exportar:
// si UTF-8 deja caracteres inválidos, se reintenta con esa codificación
// para no romper tildes y eñes.
async function readFileText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder("utf-8").decode(buffer);
  return text.includes("�") ? new TextDecoder("windows-1252").decode(buffer) : text;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// Importación de un CSV en 4 pasos: elegir archivo → emparejar cada fila con
// Google Books (de a tandas) → revisar y corregir la vista previa → guardar
// (de a tandas). El archivo se lee en el navegador; al server solo viajan
// título/autor/ISBN para buscar y, al final, los libros elegidos.
export function LibraryImport({
  existingGoogleIds,
  existingTitleKeys,
}: {
  existingGoogleIds: string[];
  existingTitleKeys: string[];
}) {
  const [phase, setPhase] = useState<Phase>({ name: "select", error: null });
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [defaultStatus, setDefaultStatus] = useState<BookStatus>("want_to_read");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  const googleIds = useMemo(() => new Set(existingGoogleIds), [existingGoogleIds]);
  const titleKeys = useMemo(() => new Set(existingTitleKeys), [existingTitleKeys]);

  function isInLibrary(reviewRow: ReviewRow): boolean {
    const { row, choice } = reviewRow;
    if (titleKeys.has(buildTitleKey(row.title, row.authors))) return true;
    if (choice.kind === "manual") return false;
    return (
      (choice.book.googleBooksId !== null && googleIds.has(choice.book.googleBooksId)) ||
      titleKeys.has(buildTitleKey(choice.book.title, choice.book.authors))
    );
  }

  async function handleFile(file: File) {
    if (file.size > IMPORT_MAX_FILE_BYTES) {
      setPhase({ name: "select", error: "El archivo es demasiado grande (máximo 1 MB)." });
      return;
    }

    const parsed = parseLibraryCsv(await readFileText(file));
    if (!parsed.ok) {
      setPhase({ name: "select", error: parsed.error });
      return;
    }

    const notices: string[] = [];
    if (parsed.truncatedRows > 0) {
      notices.push(
        `El archivo tiene más de ${IMPORT_MAX_ROWS} libros: se toman los primeros ${IMPORT_MAX_ROWS}. Importá el resto en otro archivo.`,
      );
    }
    if (parsed.skippedLines.length > 0) {
      notices.push(`${pluralize(parsed.skippedLines.length, "fila sin título se ignoró", "filas sin título se ignoraron")}.`);
    }
    const truncatedNotes = parsed.rows.filter((row) => row.noteTruncated).length;
    if (truncatedNotes > 0) {
      notices.push(
        `${pluralize(truncatedNotes, "reseña se recortó", "reseñas se recortaron")} a 300 caracteres.`,
      );
    }

    cancelledRef.current = false;
    const total = parsed.rows.length;
    const matched: ReviewRow[] = [];
    setPhase({ name: "matching", done: 0, total });

    for (const rowsChunk of chunk(parsed.rows, MATCH_CHUNK_SIZE)) {
      if (cancelledRef.current) return;

      let response: Awaited<ReturnType<typeof matchImportRows>>;
      try {
        response = await matchImportRows(
          rowsChunk.map(({ title, authors, isbn }) => ({ title, authors, isbn })),
        );
      } catch {
        response = { ok: false, error: "Se cortó la conexión mientras buscábamos los libros." };
      }

      if (!response.ok) {
        // Lo que no se llegó a buscar queda sin coincidencia: se puede
        // importar igual (como carga manual) o desmarcar.
        notices.unshift(`${response.error} Los libros que faltaban quedaron sin coincidencia.`);
        const pending = parsed.rows.slice(matched.length);
        matched.push(...pending.map((row) => ({ row, candidates: [], choice: { kind: "manual" as const }, included: true })));
        break;
      }

      rowsChunk.forEach((row, index) => {
        const result = response.results[index];
        const candidates = result && "candidates" in result ? result.candidates : [];
        matched.push({
          row,
          candidates,
          choice: candidates[0] ? { kind: "google", book: candidates[0] } : { kind: "manual" },
          included: true,
        });
      });
      setPhase({ name: "matching", done: matched.length, total });
    }

    if (cancelledRef.current) return;
    setRows(matched.map((reviewRow) => ({ ...reviewRow, included: !isInLibrary(reviewRow) })));
    setPhase({ name: "review", notices });
  }

  function effectiveStatus(row: ImportRow): BookStatus {
    return row.status ?? defaultStatus;
  }

  function toImportItem({ row, choice }: ReviewRow): ImportItem {
    const status = effectiveStatus(row);
    const isRead = status === "read";
    return {
      googleBooksId: choice.kind === "google" ? choice.book.googleBooksId : null,
      title: row.title,
      authors: row.authors.length > 0 ? row.authors : ["Autor desconocido"],
      status,
      tags: row.tags,
      rating: isRead ? row.rating : null,
      note: isRead ? row.note : null,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
    };
  }

  async function handleImport() {
    const items = rows.filter((reviewRow) => reviewRow.included).map(toImportItem);
    const counts: Record<ImportItemResult, number> = {
      imported: 0,
      duplicate: 0,
      not_found: 0,
      error: 0,
    };
    let error: string | null = null;
    let done = 0;
    setPhase({ name: "importing", done, total: items.length });

    for (const itemsChunk of chunk(items, IMPORT_CHUNK_SIZE)) {
      try {
        const response = await importBooks(itemsChunk);
        for (const result of response.results) counts[result]++;
        done += itemsChunk.length;
        setPhase({ name: "importing", done, total: items.length });
        if (!response.ok) {
          error = response.error;
          break;
        }
      } catch {
        error = "Se cortó la conexión mientras guardábamos los libros.";
        break;
      }
    }

    counts.error += items.length - done;
    setPhase({ name: "done", counts, error });
  }

  function reset() {
    cancelledRef.current = true;
    setRows([]);
    setPhase({ name: "select", error: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (phase.name === "select") {
    return (
      <div className="flex flex-col gap-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <ListSection
          footer={
            phase.error ? (
              <span className="text-destructive">{phase.error}</span>
            ) : (
              "Funciona con el CSV que exporta Boreli y con los de Goodreads o StoryGraph. Solo hace falta una columna de título; si están, también se leen autor, ISBN, estado, formato, calificación, reseña y fechas."
            )
          }
        >
          <ListRow
            icon={FileUp}
            label="Elegir archivo CSV"
            onClick={() => fileInputRef.current?.click()}
          />
        </ListSection>
        <ListSection footer="Cada libro se busca en Google Books para traer portada, páginas y descripción. Antes de guardar vas a poder revisar y corregir las coincidencias.">
          <ListItem>
            <p className="text-subheadline text-label-secondary">
              Hasta {IMPORT_MAX_ROWS} libros por archivo. Los que ya están en tu biblioteca no se
              modifican.
            </p>
          </ListItem>
        </ListSection>
      </div>
    );
  }

  if (phase.name === "matching" || phase.name === "importing") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Spinner />
        <p className="text-body text-label">
          {phase.name === "matching" ? "Buscando en Google Books…" : "Guardando en tu biblioteca…"}
        </p>
        <p className="text-subheadline text-label-secondary">
          {phase.done} de {phase.total}
        </p>
        {phase.name === "matching" ? (
          <Button variant="ghost" className="font-normal" onClick={reset}>
            Cancelar
          </Button>
        ) : null}
      </div>
    );
  }

  if (phase.name === "done") {
    const { counts, error } = phase;
    return (
      <div className="flex flex-col gap-8">
        <ListSection footer={error ? <span className="text-destructive">{error}</span> : undefined}>
          <ListRow label="Importados" detail={counts.imported} />
          {counts.duplicate > 0 ? (
            <ListRow label="Ya estaban en tu biblioteca" detail={counts.duplicate} />
          ) : null}
          {counts.not_found > 0 ? (
            <ListRow label="No disponibles en Google Books" detail={counts.not_found} />
          ) : null}
          {counts.error > 0 ? <ListRow label="No se pudieron importar" detail={counts.error} /> : null}
        </ListSection>
        <div className="flex flex-col gap-3">
          <Button size="lg" asChild>
            <Link href="/">Ir a mi biblioteca</Link>
          </Button>
          <Button size="lg" variant="ghost" onClick={reset}>
            Importar otro archivo
          </Button>
        </div>
      </div>
    );
  }

  const includedCount = rows.filter((reviewRow) => reviewRow.included).length;
  const matchedCount = rows.filter((reviewRow) => reviewRow.choice.kind === "google").length;
  const unmatchedCount = rows.length - matchedCount;
  const inLibraryCount = rows.filter(isInLibrary).length;
  const hasRowsWithoutStatus = rows.some((reviewRow) => reviewRow.row.status === null);
  const editingRow = editingIndex !== null ? rows[editingIndex] : null;

  function updateRow(index: number, update: Partial<ReviewRow>) {
    setRows((current) =>
      current.map((reviewRow, i) => (i === index ? { ...reviewRow, ...update } : reviewRow)),
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      <ListSection
        footer={[
          `${pluralize(matchedCount, "libro encontrado", "libros encontrados")} en Google Books.`,
          unmatchedCount > 0
            ? `${pluralize(unmatchedCount, "sin coincidencia", "sin coincidencia")}: se cargan solo con título y autor.`
            : null,
          inLibraryCount > 0
            ? `${pluralize(inLibraryCount, "ya está", "ya están")} en tu biblioteca y ${inLibraryCount === 1 ? "quedó desmarcado" : "quedaron desmarcados"}.`
            : null,
          ...phase.notices,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <ListRow
          label={includedCount === rows.length ? "Desmarcar todos" : "Marcar todos"}
          onClick={() => {
            const included = includedCount !== rows.length;
            setRows((current) => current.map((reviewRow) => ({ ...reviewRow, included })));
          }}
        />
      </ListSection>

      {hasRowsWithoutStatus ? (
        <ListSection
          header="Estado"
          footer="Para los libros que no indican estado en el archivo."
        >
          <ListItem>
            <SegmentedControl
              aria-label="Estado por defecto"
              value={defaultStatus}
              onValueChange={setDefaultStatus}
              options={BOOK_STATUS_OPTIONS.map(({ status, label }) => ({ value: status, label }))}
            />
          </ListItem>
        </ListSection>
      ) : null}

      <ul className="overflow-hidden rounded-[10px] bg-surface">
        {rows.map((reviewRow, index) => (
          <ImportReviewItem
            key={reviewRow.row.line}
            reviewRow={reviewRow}
            status={effectiveStatus(reviewRow.row)}
            inLibrary={isInLibrary(reviewRow)}
            onToggle={() => updateRow(index, { included: !reviewRow.included })}
            onEdit={() => setEditingIndex(index)}
          />
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <Button size="lg" disabled={includedCount === 0} onClick={() => void handleImport()}>
          {includedCount === 0
            ? "Importar"
            : `Importar ${pluralize(includedCount, "libro", "libros")}`}
        </Button>
        <Button size="lg" variant="ghost" className="font-normal" onClick={reset}>
          Cancelar
        </Button>
      </div>

      <ImportMatchSheet
        key={editingIndex ?? "closed"}
        open={editingRow !== null}
        onOpenChange={(open) => !open && setEditingIndex(null)}
        row={editingRow?.row ?? null}
        candidates={editingRow?.candidates ?? []}
        choice={editingRow?.choice ?? { kind: "manual" }}
        onChoose={(choice) => {
          if (editingIndex === null || !editingRow) return;
          // Un libro elegido desde la búsqueda pasa a ser una coincidencia más
          // de la fila, para que siga apareciendo (con check) al reabrirla.
          const candidates =
            choice.kind === "google" &&
            !editingRow.candidates.some((book) => book.id === choice.book.id)
              ? [choice.book, ...editingRow.candidates]
              : editingRow.candidates;
          updateRow(editingIndex, { choice, candidates, included: true });
          setEditingIndex(null);
        }}
      />
    </div>
  );
}

// Fila de la vista previa: check de inclusión a la izquierda (como el modo
// edición de las listas de iOS) y el resto de la fila abre el selector de
// coincidencia.
function ImportReviewItem({
  reviewRow,
  status,
  inLibrary,
  onToggle,
  onEdit,
}: {
  reviewRow: ReviewRow;
  status: BookStatus;
  inLibrary: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { row, choice, included } = reviewRow;
  const book = choice.kind === "google" ? choice.book : null;
  const title = book?.title ?? row.title;
  const authors = book?.authors.length ? book.authors : row.authors;
  const details = [
    STATUS_LABELS[status],
    status === "read" && row.rating ? `${row.rating}★` : null,
    inLibrary ? "Ya en tu biblioteca" : book ? null : "Sin coincidencia",
  ].filter(Boolean);

  return (
    <li className="relative flex items-center gap-3 py-3 pr-2 pl-4 before:absolute before:top-0 before:right-0 before:left-[calc(22px+56px+2.5rem)] before:h-px before:bg-separator first:before:hidden">
      <button
        type="button"
        role="checkbox"
        aria-checked={included}
        aria-label={`Importar ${title}`}
        onClick={onToggle}
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-tint focus-visible:ring-offset-2",
          included ? "bg-tint text-on-tint" : "ring-[1.5px] ring-label-tertiary ring-inset",
        )}
      >
        {included ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : null}
      </button>

      <button
        type="button"
        onClick={onEdit}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-tint",
          !included && "opacity-50",
        )}
      >
        <div className={cn(COVER_FRAME_CLASS, "h-[84px] w-[56px] shrink-0")}>
          <BookCover
            title={title}
            coverUrl={book?.coverUrl}
            trustedCover
            placeholderIconClass="size-5"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-headline text-label">{title}</p>
          {authors.length > 0 ? (
            <p className="truncate text-subheadline text-label-secondary">{authors.join(", ")}</p>
          ) : null}
          <p className="mt-1 text-footnote text-label-secondary">{details.join(" · ")}</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-label-tertiary" aria-hidden />
      </button>
    </li>
  );
}
