// Carga perezosa de Leaflet.
//
// Leaflet toca `window` apenas se importa, así que no puede entrar al bundle de
// servidor: se importa dentro de un efecto. El módulo queda cacheado para que
// abrir el mapa por segunda vez sea instantáneo.

import type * as LeafletNS from 'leaflet';

export type Leaflet = typeof LeafletNS;

let cached: Leaflet | null = null;
let pending: Promise<Leaflet> | null = null;

export function loadLeaflet(): Promise<Leaflet> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = import('leaflet').then((mod) => {
      cached = ((mod as any).default ?? mod) as Leaflet;
      return cached;
    });
  }
  return pending;
}

/* Tiles.
 *
 * Antes se usaba CARTO Voyager, que era gratis y sin registro. CARTO pasó a
 * exigir API key y ahora devuelve las mismas tiles con "API KEY REQUIRED"
 * estampado encima: siguen llegando con HTTP 200, así que no falla nada, solo
 * se ve mal.
 *
 * El default queda en las tiles estándar de OpenStreetMap, que no piden llave.
 * Son un servicio comunitario, no un CDN con SLA: sirven de sobra para el
 * tráfico de hoy, pero si el sitio crece conviene un proveedor con plan.
 *
 * Para volver a CARTO (o pasar a cualquier otro) no hay que tocar código:
 * poner NEXT_PUBLIC_TILE_URL y NEXT_PUBLIC_TILE_ATTRIBUTION en Frontend/.env
 * con la URL exacta que entregue el proveedor junto con la llave.
 */
const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const TILE_URL = process.env.NEXT_PUBLIC_TILE_URL || OSM_URL;
export const TILE_OPTIONS = {
  // Solo tiene efecto si la URL trae {s}; OSM ya no usa subdominios.
  subdomains: 'abc',
  // OSM no publica zoom 20; con más que esto devuelve tiles en blanco.
  maxZoom: 19,
  attribution: process.env.NEXT_PUBLIC_TILE_ATTRIBUTION || OSM_ATTRIBUTION,
};
