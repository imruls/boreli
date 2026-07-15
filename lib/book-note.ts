// Límite compartido entre el input (contador en vivo), las server actions
// (validación) y el constraint `note_length` de la DB (data-model.md) —
// mantenerlos en sync si este número cambia.
export const NOTE_MAX_LENGTH = 300;
