/*
 * Memoria del listado de canchas para cuando se entra a una cancha y se
 * vuelve: los filtros finos (amenidades, precio, orden, página, vista) y
 * hasta dónde se había bajado. Vive en sessionStorage, o sea solo en esta
 * pestaña. Se restaura únicamente si se vuelve desde una cancha abierta
 * desde el listado, y en la misma búsqueda (misma URL).
 */

const CLAVE = 'rtc-listado';
const CLAVE_VOLVER = 'rtc-listado-volver';
/** Pasado este tiempo, volver al listado ya no restaura nada. */
const VIGENCIA_MS = 30 * 60 * 1000;

export interface ListadoGuardado {
  url: string;
  amenities: string[];
  minPrice: number;
  maxPrice: number;
  sort: string;
  page: number;
  view: string;
  scroll: number;
}

/* Ojo: se trabaja con la URL que pasa el listado (armada con sus
   searchParams) y no con window.location: al volver con el router, el
   listado se pinta antes de que el navegador cambie la dirección, y ahí
   window.location todavía es la de la cancha. */

function leerCrudo(): ListadoGuardado | null {
  try {
    const g = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
    return g && typeof g.url === 'string' ? g : null;
  } catch {
    return null;
  }
}

/** Lo guardado, si se está volviendo de una cancha a esta misma búsqueda. */
export function leerParaVolver(url: string): ListadoGuardado | null {
  if (typeof window === 'undefined') return null;
  try {
    const marca = Number(sessionStorage.getItem(CLAVE_VOLVER) ?? 0);
    if (!marca || Date.now() - marca > VIGENCIA_MS) return null;
  } catch {
    return null;
  }
  const g = leerCrudo();
  return g && g.url === url ? g : null;
}

/** Se llama al montar el listado: la marca de "volver" se usa una sola vez. */
export function consumirVolver() {
  try {
    sessionStorage.removeItem(CLAVE_VOLVER);
  } catch {
    /* almacenamiento bloqueado */
  }
}

export function guardarListado(url: string, datos: Omit<ListadoGuardado, 'url' | 'scroll'>) {
  try {
    const previo = leerCrudo();
    sessionStorage.setItem(
      CLAVE,
      JSON.stringify({ ...datos, url, scroll: previo?.url === url ? previo.scroll : 0 }),
    );
  } catch {
    /* almacenamiento bloqueado: no se recuerda, nada más */
  }
}

/** Al abrir una cancha desde el listado: guarda el scroll y deja la marca. */
export function marcarSalidaACancha() {
  try {
    // Se llama desde el listado: lo guardado es de esta misma búsqueda.
    const g = leerCrudo();
    if (g) sessionStorage.setItem(CLAVE, JSON.stringify({ ...g, scroll: window.scrollY }));
    sessionStorage.setItem(CLAVE_VOLVER, String(Date.now()));
  } catch {
    /* almacenamiento bloqueado */
  }
}

/** A dónde lleva "Volver" de la ficha: la búsqueda de la que se vino, o el listado. */
export function urlParaVolver(): string {
  try {
    const marca = Number(sessionStorage.getItem(CLAVE_VOLVER) ?? 0);
    const g = leerCrudo();
    if (g && marca && Date.now() - marca < VIGENCIA_MS) return g.url;
  } catch {
    /* almacenamiento bloqueado */
  }
  return '/empresas';
}
