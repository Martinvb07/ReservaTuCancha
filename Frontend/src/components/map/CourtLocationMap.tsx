'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';

import { loadLeaflet, TILE_URL, TILE_OPTIONS } from '@/lib/leaflet';
import { locationPoint } from '@/lib/geo';

interface Props {
  /** Coordenadas tal como las guarda Mongo: [lng, lat] */
  coordinates?: number[] | null;
  city?: string;
  address?: string;
  /** Id de la cancha: mantiene estable la ubicación aproximada por ciudad */
  seed: string;
  name: string;
}

/* Pin de gota dibujado a mano: no dependemos de los PNG de Leaflet, cuyas rutas
   relativas se rompen al pasar por el bundle de Next. */
const PIN_SVG = `
<svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 45s15-16.2 15-27.2C32 8.9 25.3 2 17 2S2 8.9 2 17.8C2 28.8 17 45 17 45z"
        fill="#16a34a" stroke="#fff" stroke-width="3"/>
  <circle cx="17" cy="17.5" r="5.5" fill="#fff"/>
</svg>`;

export default function CourtLocationMap({ coordinates, city, address, seed, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);

  const point = locationPoint(coordinates, city, seed);

  useEffect(() => {
    if (!point) return;
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      /* En pantalla táctil el arrastre con un dedo se comería el scroll de la
         página: ahí el mapa queda fijo (se sigue haciendo zoom con dos dedos)
         y para explorar está el botón "Cómo llegar". */
      const touch = window.matchMedia('(pointer: coarse)').matches;

      const map = L.map(containerRef.current, {
        center: [point.lat, point.lng],
        zoom: point.approx ? 13 : 16,
        // La rueda del ratón debe seguir desplazando la página, no el mapa.
        scrollWheelZoom: false,
        dragging: !touch,
      });
      L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
      map.zoomControl.setPosition('bottomright');

      L.marker([point.lat, point.lng], {
        icon: L.divIcon({ className: 'rtc-picker-pin', html: PIN_SVG, iconSize: [34, 46], iconAnchor: [17, 45] }),
        title: name,
        keyboard: false,
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // El mapa es fijo: se crea una vez con el punto de la cancha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point?.lat, point?.lng]);

  if (!point) {
    return (
      <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-500">
          Esta cancha aún no tiene ubicación registrada en el mapa.
          {address ? <> Dirección: <span className="font-medium text-gray-700">{address}</span>.</> : null}
        </p>
      </div>
    );
  }

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;

  return (
    <div className="space-y-3">
      {/* Dirección + botón de ruta. En móvil el botón baja a su propia línea. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <p className="flex items-start gap-2 text-sm text-gray-600 min-w-0">
          <MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <span className="min-w-0">
            {[address, city].filter(Boolean).join(', ') || 'Colombia'}
            {point.approx && (
              <span className="block text-xs text-amber-600 mt-0.5">
                Ubicación aproximada: el club aún no marcó el punto exacto.
              </span>
            )}
          </span>
        </p>

        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
        >
          <Navigation className="h-4 w-4" /> Cómo llegar
        </a>
      </div>

      {/* `isolate`: los paneles de Leaflet van en z-index 400-700 y sin contexto
          propio se montarían sobre la tarjeta de reserva sticky. */}
      <div className="relative isolate h-60 sm:h-72 lg:h-80 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
        <div ref={containerRef} className="absolute inset-0 z-0" />
        {!ready && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-gray-50">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando mapa…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
