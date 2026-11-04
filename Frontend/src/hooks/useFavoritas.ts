'use client';

import { useCallback, useEffect, useState } from 'react';

/* Canchas favoritas del visitante, guardadas en este navegador (como en la
   app, que las guarda en el teléfono). No necesita cuenta. */

const CLAVE = 'rtc-favoritas';
const EVENTO = 'rtc-favoritas-cambio';

function leer(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useFavoritas() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(leer());
    sync();
    window.addEventListener(EVENTO, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENTO, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const alternar = useCallback((id: string) => {
    const actual = leer();
    const nuevo = actual.includes(id) ? actual.filter((x) => x !== id) : [id, ...actual];
    try {
      localStorage.setItem(CLAVE, JSON.stringify(nuevo));
    } catch {
      /* Navegación privada o almacenamiento bloqueado: queda solo en memoria. */
    }
    setIds(nuevo);
    window.dispatchEvent(new Event(EVENTO));
  }, []);

  return { ids, esFavorita: (id: string) => ids.includes(id), alternar };
}
