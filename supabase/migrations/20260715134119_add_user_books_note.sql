-- Reseña personal por libro leído (data-model.md): texto libre, opcional,
-- hasta 300 caracteres, y solo permitida cuando el libro está marcado como
-- leído — mismo criterio que `rating`, ver constraint `rating_requires_read`.
alter table user_books
  add column note text,
  add constraint note_length check (note is null or char_length(note) <= 300),
  add constraint note_requires_read check (note is null or status = 'read');
