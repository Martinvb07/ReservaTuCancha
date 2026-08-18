// Geocodificación con Nominatim (OpenStreetMap): sin API key ni facturación.
//
// La política de uso de Nominatim pide máximo 1 petición por segundo, así que
// quien llame a `searchPlaces` debe hacerlo con debounce (ver LocationPicker).

export interface GeoResult {
  /** Texto completo para mostrar en la lista de sugerencias */
  label: string;
  lat: number;
  lng: number;
  /** Calle + número, ya limpio para el campo "Dirección" */
  address: string;
  city: string;
  department: string;
}

const BASE = 'https://nominatim.openstreetmap.org';

/** Campos de Nominatim que pueden traer el nombre del municipio. */
type NominatimAddress = Record<string, string | undefined>;

function pickCity(a: NominatimAddress): string {
  return (
    a.city || a.town || a.village || a.municipality ||
    a.city_district || a.county || ''
  );
}

function pickStreet(a: NominatimAddress, fallback: string): string {
  const road = a.road || a.pedestrian || a.footway || a.residential;
  if (!road) return fallback.split(',')[0] ?? '';
  return a.house_number ? `${road} #${a.house_number}` : road;
}

function toResult(raw: any): GeoResult {
  const a: NominatimAddress = raw.address ?? {};
  const display: string = raw.display_name ?? '';
  return {
    label: display,
    lat: parseFloat(raw.lat),
    lng: parseFloat(raw.lon),
    address: pickStreet(a, raw.name || display),
    city: pickCity(a),
    department: a.state ?? '',
  };
}

/** Busca direcciones en Colombia. Devuelve [] si la búsqueda se cancela o falla. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'co',
    'accept-language': 'es',
    limit: '6',
  });

  try {
    const res = await fetch(`${BASE}/search?${params}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(toResult) : [];
  } catch {
    return [];
  }
}

/** Coordenada → dirección. `null` si no se pudo resolver. */
export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<GeoResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'es',
  });

  try {
    const res = await fetch(`${BASE}/reverse?${params}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.error) return null;
    // El reverse devuelve la coordenada del punto encontrado, no la que pedimos:
    // conservamos la del usuario para que el pin no salte al soltarlo.
    return { ...toResult(data), lat, lng };
  } catch {
    return null;
  }
}
