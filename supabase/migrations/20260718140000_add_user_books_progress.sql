-- Progreso de lectura por libro (data-model.md): opcional, y solo permitido
-- mientras el libro está en status = 'reading' — mismo criterio que
-- `rating`/`note` con 'read' (ver `rating_requires_read`/`note_requires_read`).
-- El modo (`progress_type`) es de elección libre por libro, independiente del
-- tag de formato: 'percent' guarda un valor 0-100 en `progress_current`;
-- 'pages' guarda la página actual en `progress_current` contra un total en
-- `progress_total_pages`, que es propio del progreso (no toca `books.page_count`,
-- para no pisar el dato del catálogo compartido si el usuario ingresa un total
-- distinto a mano).
alter table user_books
  add column progress_type text check (progress_type in ('percent', 'pages')),
  add column progress_current integer,
  add column progress_total_pages integer,
  add constraint progress_requires_reading check (
    (progress_type is null and progress_current is null and progress_total_pages is null)
    or status = 'reading'
  ),
  add constraint progress_bounds check (
    progress_type is null
    or (progress_type = 'percent' and progress_current between 0 and 100)
    or (
      progress_type = 'pages'
      and progress_total_pages is not null
      and progress_total_pages > 0
      and progress_current between 0 and progress_total_pages
    )
  );
