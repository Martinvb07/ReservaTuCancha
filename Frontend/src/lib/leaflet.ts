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

/** Tiles de CARTO Voyager: gratuitos, look claro y legible (requieren atribución). */
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const TILE_OPTIONS = {
  subdomains: 'abcd',
  maxZoom: 20,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
};
