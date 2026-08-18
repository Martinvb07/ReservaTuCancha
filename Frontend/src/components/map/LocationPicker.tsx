'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, Crosshair, MapPin, X } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

import { loadLeaflet, TILE_URL, TILE_OPTIONS } from '@/lib/leaflet';
import { cityCenter, COLOMBIA_CENTER, type LatLng } from '@/lib/geo';
import { searchPlaces, reverseGeocode, type GeoResult } from '@/lib/geocode';

/** Datos de dirección que el picker le devuelve al formulario. */
export interface ResolvedAddress {
  address: string;
  city: string;
  department: string;
}

interface Props {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  /** Dirección resuelta al elegir una sugerencia o soltar el pin. */
  onResolve?: (r: ResolvedAddress) => void;
  /** Ciudad ya escrita en el formulario: sirve para centrar antes del primer pin. */
  city?: string;
  className?: string;
}

/* Pin de gota dibujado a mano: evita depender de los PNG de Leaflet, que en
   Next se rompen porque el CSS pide rutas relativas al bundle. */
const PIN_SVG = `
<svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 45s15-16.2 15-27.2C32 8.9 25.3 2 17 2S2 8.9 2 17.8C2 28.8 17 45 17 45z"
        fill="#16a34a" stroke="#fff" stroke-width="3"/>
  <circle cx="17" cy="17.5" r="5.5" fill="#fff"/>
</svg>`;

const DEBOUNCE_MS = 450;

export default function LocationPicker({ value, onChange, onResolve, city, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);
  const markerRef    = useRef<LeafletMarker | null>(null);
  /* El pin movido por el usuario ya está donde toca: recentrar lo haría saltar. */
  const skipCenterRef = useRef(false);
  const boxRef       = useRef<HTMLDivElement>(null);

  const [ready, setReady]         = useState(false);
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]           = useState(false);
  const [locating, setLocating]   = useState(false);
  const [resolving, setResolving] = useState(false);
  /* En táctil el mapa arranca bloqueado: si no, arrastrar el dedo para bajar
     por el formulario movería el mapa en vez de desplazar la página. */
  const [touchLocked, setTouchLocked] = useState(false);

  /* Callbacks frescos dentro de los handlers de Leaflet, que se registran una
     sola vez al crear el mapa. */
  const onChangeRef  = useRef(onChange);
  const onResolveRef = useRef(onResolve);
  useEffect(() => { onChangeRef.current = onChange; onResolveRef.current = onResolve; });

  /** Punto elegido por el usuario (clic, arrastre, sugerencia o GPS). */
  const commit = (lat: number, lng: number, resolved?: ResolvedAddress) => {
    skipCenterRef.current = true;
    onChangeRef.current({ lat, lng });

    if (resolved) { onResolveRef.current?.(resolved); return; }

    setResolving(true);
    reverseGeocode(lat, lng)
      .then((r) => { if (r) onResolveRef.current?.({ address: r.address, city: r.city, department: r.department }); })
      .finally(() => setResolving(false));
  };

  /* ── Crear el mapa ─────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = value ?? cityCenter(city) ?? COLOMBIA_CENTER;
      const zoom  = value ? 16 : cityCenter(city) ? 12 : 5;

      const touch = window.matchMedia('(pointer: coarse)').matches;

      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom,
        dragging: !touch,
      });
      L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
      map.zoomControl.setPosition('bottomright');
      map.on('click', (e: any) => commit(e.latlng.lat, e.latlng.lng));

      mapRef.current = map;
      setTouchLocked(touch);
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // El mapa se crea una vez; `value` y `city` solo definen el encuadre inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Sincronizar el pin con el valor del formulario ────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    loadLeaflet().then((L) => {
      if (!mapRef.current) return;

      if (!markerRef.current) {
        markerRef.current = L.marker([value.lat, value.lng], {
          draggable: true,
          icon: L.divIcon({ className: 'rtc-picker-pin', html: PIN_SVG, iconSize: [34, 46], iconAnchor: [17, 45] }),
        }).addTo(map);

        markerRef.current.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          commit(lat, lng);
        });
      } else {
        markerRef.current.setLatLng([value.lat, value.lng]);
      }

      if (skipCenterRef.current) { skipCenterRef.current = false; return; }
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 16));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, value?.lat, value?.lng]);

  /* ── Buscador de direcciones (con debounce, Nominatim pide ir suave) ── */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) { setResults([]); setSearching(false); return; }

    const controller = new AbortController();
    setSearching(true);
    const t = setTimeout(() => {
      searchPlaces(q, controller.signal)
        .then((r) => { setResults(r); setOpen(true); })
        .finally(() => setSearching(false));
    }, DEBOUNCE_MS);

    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  /* Cerrar la lista de sugerencias al hacer clic fuera */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  const pickResult = (r: GeoResult) => {
    setQuery('');
    setResults([]);
    setOpen(false);
    commit(r.lat, r.lng, { address: r.address, city: r.city, department: r.department });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); commit(pos.coords.latitude, pos.coords.longitude); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Buscador + sugerencias */}
      <div ref={boxRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Busca la dirección en el mapa…"
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-24 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            {query && !searching && (
              <button type="button" onClick={() => { setQuery(''); setResults([]); }}
                className="w-7 h-7 grid place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button type="button" onClick={useMyLocation} title="Usar mi ubicación actual"
              className="w-7 h-7 grid place-items-center rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-600 transition">
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && results.length > 0 && (
          <ul className="absolute z-[1000] top-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <li key={`${r.lat}-${r.lng}-${i}`}>
                <button type="button" onClick={() => pickResult(r)}
                  className="w-full flex items-start gap-2.5 text-left px-3.5 py-2.5 hover:bg-green-50 transition-colors">
                  <MapPin className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-[13px] text-gray-700 leading-snug">{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mapa — `isolate` mantiene los paneles de Leaflet (z-index 400-700)
          dentro de su propio contexto, para que no tapen la barra de guardado. */}
      <div className="relative isolate h-64 sm:h-72 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
        <div ref={containerRef} className="absolute inset-0 z-0" />
        {!ready && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-gray-50">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando mapa…
            </span>
          </div>
        )}
        {ready && !value && !touchLocked && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-gray-900/85 text-white text-xs font-semibold px-3 py-1.5 rounded-full pointer-events-none max-w-[90%] text-center">
            Toca el mapa para marcar la cancha
          </div>
        )}

        {/* Candado táctil: el primer toque activa el mapa, los siguientes ya
            arrastran. Mientras esté puesto, el dedo desplaza la página. */}
        {ready && touchLocked && (
          <button
            type="button"
            onClick={() => { mapRef.current?.dragging.enable(); setTouchLocked(false); }}
            className="absolute inset-0 z-[500] grid place-items-center bg-gray-900/25 active:bg-gray-900/35 transition-colors"
          >
            <span className="bg-white/95 text-gray-900 text-[13px] font-bold px-4 py-2.5 rounded-full shadow-lg">
              Toca para activar el mapa
            </span>
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1.5 min-h-[1rem]">
        {resolving ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Leyendo la dirección del punto…</>
        ) : value ? (
          <><MapPin className="h-3 w-3 text-green-600" /> Punto marcado: {value.lat.toFixed(5)}, {value.lng.toFixed(5)} · arrastra el pin para ajustarlo</>
        ) : (
          <>Opcional, pero sin punto la cancha se ubica solo por ciudad en el mapa público.</>
        )}
      </p>
    </div>
  );
}
