// Utilidades de ubicación: pasa una cancha a coordenadas usables por el mapa.
//
// El backend guarda `location.coordinates` como [lng, lat] (formato GeoJSON de
// Mongo), pero muchas canchas viejas se crearon sin coordenadas. Para que el
// mapa no las esconda, esas caen al centro de su ciudad y se marcan como
// aproximadas (la ficha lo dice, para no mentirle al jugador).

import type { Court } from '@/types';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CourtPoint extends LatLng {
  court: Court;
  /** true = no tiene coordenadas propias, se ubicó por ciudad */
  approx: boolean;
}

/** Centro geográfico de Colombia: último recurso cuando no reconocemos la ciudad. */
export const COLOMBIA_CENTER: LatLng = { lat: 4.5709, lng: -74.2973 };

/** Centros de ciudad para ubicar canchas sin coordenadas propias. */
const CITY_COORDS: Record<string, LatLng> = {
  villavicencio: { lat: 4.1420, lng: -73.6266 },
  acacias:       { lat: 3.9878, lng: -73.7592 },
  restrepo:      { lat: 4.2611, lng: -73.5600 },
  granada:       { lat: 3.5460, lng: -73.7060 },
  'puerto lopez':{ lat: 4.0847, lng: -72.9553 },
  bogota:        { lat: 4.7110, lng: -74.0721 },
  medellin:      { lat: 6.2442, lng: -75.5812 },
  cali:          { lat: 3.4516, lng: -76.5320 },
  barranquilla:  { lat: 10.9685, lng: -74.7813 },
  bucaramanga:   { lat: 7.1193, lng: -73.1227 },
  cartagena:     { lat: 10.3910, lng: -75.4794 },
  cucuta:        { lat: 7.8939, lng: -72.5078 },
  pereira:       { lat: 4.8133, lng: -75.6961 },
  manizales:     { lat: 5.0689, lng: -75.5174 },
  ibague:        { lat: 4.4389, lng: -75.2322 },
  'santa marta': { lat: 11.2408, lng: -74.1990 },
  neiva:         { lat: 2.9273, lng: -75.2819 },
  armenia:       { lat: 4.5339, lng: -75.6811 },
  popayan:       { lat: 2.4448, lng: -76.6147 },
  pasto:         { lat: 1.2136, lng: -77.2811 },
  monteria:      { lat: 8.7479, lng: -75.8814 },
  valledupar:    { lat: 10.4631, lng: -73.2532 },
  sincelejo:     { lat: 9.3047, lng: -75.3978 },
  tunja:         { lat: 5.5353, lng: -73.3678 },
  yopal:         { lat: 5.3378, lng: -72.3959 },
  soacha:        { lat: 4.5794, lng: -74.2168 },
  bello:         { lat: 6.3380, lng: -75.5540 },
  envigado:      { lat: 6.1667, lng: -75.5833 },
  itagui:        { lat: 6.1719, lng: -75.6117 },
  palmira:       { lat: 3.5394, lng: -76.3036 },
};

/** "Acacías" → "acacias": la clave del mapa de ciudades no lleva tildes. */
export function normalizeCity(city?: string): string {
  return (city ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function cityCenter(city?: string): LatLng | null {
  return CITY_COORDS[normalizeCity(city)] ?? null;
}

/** Hash estable de un string a [0,1). Mismo id → mismo desplazamiento siempre. */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/* Sin este desplazamiento, todas las canchas sin coordenadas de una ciudad
   quedarían apiladas en el mismo pin y solo se vería una. ±0.01° ≈ 1 km. */
function scatter(base: LatLng, seed: string): LatLng {
  const angle = hash01(seed) * Math.PI * 2;
  const radius = 0.004 + hash01(seed + 'r') * 0.008;
  return {
    lat: base.lat + Math.sin(angle) * radius,
    lng: base.lng + Math.cos(angle) * radius,
  };
}

function validCoords(c?: number[] | null): c is [number, number] {
  return (
    Array.isArray(c) &&
    c.length === 2 &&
    Number.isFinite(c[0]) &&
    Number.isFinite(c[1]) &&
    !(c[0] === 0 && c[1] === 0) &&
    Math.abs(c[1]) <= 90 &&
    Math.abs(c[0]) <= 180
  );
}

/**
 * Resuelve unas coordenadas de Mongo ([lng, lat]) a un punto del mapa. Si no
 * hay coordenadas cae al centro de la ciudad; `seed` (normalmente el id) hace
 * que el desplazamiento sea siempre el mismo para la misma cancha.
 * `null` si no hay ni coordenadas ni ciudad reconocida.
 */
export function locationPoint(
  coordinates: number[] | undefined | null,
  city: string | undefined,
  seed: string,
): (LatLng & { approx: boolean }) | null {
  if (validCoords(coordinates)) {
    return { lat: coordinates[1], lng: coordinates[0], approx: false };
  }
  const center = cityCenter(city);
  if (!center) return null;
  return { ...scatter(center, seed), approx: true };
}

/** Coordenadas de una cancha. `null` si no hay ni coords ni ciudad conocida. */
export function courtPoint(court: Court): CourtPoint | null {
  const point = locationPoint(court.location?.coordinates, court.location?.city, court._id);
  return point ? { ...point, court } : null;
}

export function courtPoints(courts: Court[]): CourtPoint[] {
  return courts.map(courtPoint).filter((p): p is CourtPoint => p !== null);
}
