"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

// El server no sabe si el navegador va a estar online u offline: asumimos
// que sí, y se corrige en el primer render del cliente (sin desincronizar la
// hidratación, a diferencia de un useState + useEffect manual).
function getServerSnapshot() {
  return true;
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
