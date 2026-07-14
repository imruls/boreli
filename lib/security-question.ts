// Constante compartida entre componentes cliente (para mostrar la pregunta)
// y `lib/security-answer.ts` (server-only, hashea/verifica la respuesta).
// Separada en su propio archivo para no arrastrar `node:crypto` a bundles
// de cliente. Pregunta fija para todos los usuarios — ver nota de
// compatibilidad hacia atrás en `lib/security-answer.ts` si se cambia.
export const SECURITY_QUESTION = "¿Cómo se llamó tu primera mascota?";
