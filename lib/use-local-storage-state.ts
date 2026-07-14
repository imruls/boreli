"use client";

import { useCallback, useSyncExternalStore } from "react";

// `useSyncExternalStore` (en vez de leer localStorage en un useEffect) es el
// approach que recomienda React para sincronizar con una API del navegador
// que no existe en el server: usa `getServerSnapshot` (el default) durante
// SSR/hidratación y recién lee el valor real de localStorage en el primer
// render de cliente, sin mismatch de hidratación ni el anti-patrón de
// setState síncrono dentro de un efecto.
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useLocalStorageState<T extends string>(key: string, defaultValue: T) {
  const getSnapshot = useCallback(
    () => window.localStorage.getItem(key) ?? defaultValue,
    [key, defaultValue],
  );
  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) as T;

  function update(next: T) {
    window.localStorage.setItem(key, next);
    // El evento nativo `storage` no dispara en la misma pestaña que hizo el
    // cambio (solo en otras pestañas), así que lo emitimos a mano para que
    // este mismo componente vuelva a leer el snapshot y se re-renderice.
    window.dispatchEvent(new StorageEvent("storage", { key }));
  }

  return [value, update] as const;
}
