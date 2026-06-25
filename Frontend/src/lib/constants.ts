// Fuente única de verdad para deportes y ciudades.
// Antes estaban duplicados (y desincronizados) en HomeClient, CourtFilters,
// EmpresasPageClient, Navbar y las páginas de detalle.

export interface SportMeta {
  /** valor que viaja al backend (court.sport) */
  key: string;
  label: string;
  emoji: string;
  /** clases tailwind para el chip de deporte */
  chip: string;
  /** imagen de fallback cuando una cancha no tiene fotos */
  img: string;
}

export const SPORTS: SportMeta[] = [
  {
    key: 'futbol',
    label: 'Fútbol',
    emoji: '⚽',
    chip: 'bg-emerald-100 text-emerald-700',
    img: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&q=80',
  },
  {
    key: 'padel',
    label: 'Pádel',
    emoji: '🎾',
    chip: 'bg-sky-100 text-sky-700',
    img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=80',
  },
  {
    key: 'voley_playa',
    label: 'Voley Playa',
    emoji: '🏐',
    chip: 'bg-amber-100 text-amber-700',
    img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
  },
];

/** Lookup rápido por key, con fallback seguro para deportes desconocidos. */
export function getSport(key?: string): SportMeta {
  return (
    SPORTS.find((s) => s.key === key) ?? {
      key: key ?? 'otro',
      label: key ?? 'Otro',
      emoji: '🏟️',
      chip: 'bg-gray-100 text-gray-600',
      img: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80',
    }
  );
}

/** Mapa key -> label, útil para componentes que solo necesitan el nombre. */
export const SPORT_LABELS: Record<string, string> = Object.fromEntries(
  SPORTS.map((s) => [s.key, s.label]),
);

// Ciudades donde hay operación. Una sola lista para buscador, filtros y home.
export const CITIES = [
  'Villavicencio',
  'Acacías',
  'Restrepo',
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Bucaramanga',
];

// Amenidades disponibles (debe coincidir con AMENITIES_OPTIONS del form de creación).
export const AMENITIES = [
  'Luz nocturna',
  'Parqueadero',
  'Duchas',
  'Vestiarios',
  'Cafetería',
  'Graderías',
  'Wi-Fi',
  'Alquiler de equipos',
];

/** Opciones de ordenamiento del listado de canchas (orden cliente). */
export type SortKey = 'rating' | 'price_asc' | 'price_desc';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rating', label: 'Mejor calificadas' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
];
