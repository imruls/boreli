// `fetch` con timeout para los clientes de Supabase del servidor (pasado como
// `global.fetch`). Sin esto, si Supabase tarda o no responde (ej. proyecto
// free tier pausado), la request queda colgada hasta que Vercel corta la
// función, y en el cliente se ve como un skeleton cargando para siempre.
// Con timeout, supabase-js devuelve un error (`AuthRetryableFetchError` en
// auth) que cada llamador puede manejar.
const SUPABASE_FETCH_TIMEOUT_MS = 10_000;

export const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
  return fetch(input, { ...init, signal });
};
