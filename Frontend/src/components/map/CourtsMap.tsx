'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Loader2 } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker, Popup as LeafletPopup } from 'leaflet';

import { loadLeaflet, TILE_URL, TILE_OPTIONS } from '@/lib/leaflet';
import { courtPoints, COLOMBIA_CENTER, type CourtPoint } from '@/lib/geo';
import { getSport } from '@/lib/constants';
import type { Court } from '@/types';

interface Props {
  courts: Court[];
  /** querystring (sin '?') para arrastrar fecha/hora elegida hasta la reserva */
  query?: string;
  /** Cancha señalada desde fuera (el cursor sobre su tarjeta en la vista dividida) */
  highlightId?: string | null;
  className?: string;
}

/** 80000 -> "$80K". En el pin no cabe "$80.000". */
function shortPrice(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

function pinHtml(point: CourtPoint, active: boolean): string {
  return `<span class="rtc-pin${active ? ' rtc-pin--active' : ''}">${shortPrice(point.court.pricePerHour)}</span>`;
}

export default function CourtsMap({ courts, query, highlightId = null, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<LeafletMap | null>(null);
  const popupRef     = useRef<LeafletPopup | null>(null);
  const markersRef   = useRef<Map<string, LeafletMarker>>(new Map());
  /** Id del pin resaltado ahora mismo: evita repintar los 48 en cada hover. */
  const activeIdRef  = useRef<string | null>(null);

  const [ready, setReady]         = useState(false);
  const [selected, setSelected]   = useState<CourtPoint | null>(null);
  /* Nodo DOM que Leaflet pone dentro del popup: ahi portamos la ficha React. */
  const [popupHost, setPopupHost] = useState<HTMLElement | null>(null);

  const points = useMemo(() => courtPoints(courts), [courts]);
  const hidden = courts.length - points.length;

  /* ── Crear el mapa una sola vez ────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [COLOMBIA_CENTER.lat, COLOMBIA_CENTER.lng],
        zoom: 6,
      });
      L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
      map.zoomControl.setPosition('bottomright');

      const popup = L.popup({
        className: 'rtc-map-popup',
        closeButton: true,
        minWidth: 248,
        maxWidth: 248,
        offset: [0, -14],
        autoPanPadding: [28, 28],
      });
      popup.on('remove', () => { setSelected(null); setPopupHost(null); });

      mapRef.current = map;
      popupRef.current = popup;
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      popupRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  /* ── Pintar los pines cada vez que cambian los resultados ──────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    // Los pines se recrean sin resaltado; el efecto de abajo vuelve a aplicarlo.
    activeIdRef.current = null;

    loadLeaflet().then((L) => {
      if (!mapRef.current) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.closePopup();

      points.forEach((point) => {
        const marker = L.marker([point.lat, point.lng], {
          icon: L.divIcon({ className: 'rtc-pin-wrap', html: pinHtml(point, false), iconSize: [0, 0] }),
          riseOnHover: true,
          title: point.court.name,
        });
        marker.on('click', () => setSelected(point));
        marker.addTo(map);
        markersRef.current.set(point.court._id, marker);
      });

      if (points.length > 0) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
      } else {
        map.setView([COLOMBIA_CENTER.lat, COLOMBIA_CENTER.lng], 6);
      }
    });
  }, [ready, points]);

  /* ── Resaltar el pin elegido o señalado desde la lista ─────────── */
  /* Solo se repintan el pin que sale y el que entra: recorrer los 48 en cada
     movimiento del cursor sobre la lista hacía parpadear el mapa. */
  useEffect(() => {
    if (!ready) return;

    const nextId = selected?.court._id ?? highlightId ?? null;
    const prevId = activeIdRef.current;
    if (nextId === prevId) return;
    activeIdRef.current = nextId;

    loadLeaflet().then((L) => {
      const paint = (id: string | null, active: boolean) => {
        if (!id) return;
        const marker = markersRef.current.get(id);
        const point  = points.find((p) => p.court._id === id);
        if (!marker || !point) return;
        marker.setIcon(L.divIcon({ className: 'rtc-pin-wrap', html: pinHtml(point, active), iconSize: [0, 0] }));
      };
      paint(prevId, false);
      paint(nextId, true);
    });
  }, [ready, points, selected, highlightId]);

  /* ── Abrir y cerrar el popup ───────────────────────────────────── */
  /* Va aparte del resaltado: si compartieran efecto, pasar el cursor por una
     tarjeta reabriría el popup en cada movimiento. */
  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!ready || !map || !popup) return;

    if (!selected) {
      map.closePopup(popup);
      return;
    }

    const host = document.createElement('div');
    popup.setLatLng([selected.lat, selected.lng]).setContent(host).openOn(map);
    setPopupHost(host);
  }, [ready, selected]);

  /* Leaflet mide el popup en `setContent`, cuando el nodo todavía está vacío:
     sin este recálculo el globo queda del alto equivocado y tapa el pin. */
  useEffect(() => {
    if (!popupHost) return;
    const frame = requestAnimationFrame(() => popupRef.current?.update());
    return () => cancelAnimationFrame(frame);
  }, [popupHost]);

  return (
    /* `isolate`: los paneles de Leaflet van en z-index 400-700 y sin un contexto
       de apilamiento propio se montarían sobre la barra de filtros sticky. */
    <div className={`relative isolate rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 ${className}`}>
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {!ready && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-gray-50">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando mapa…
          </span>
        </div>
      )}

      {ready && points.length === 0 && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white/85 backdrop-blur-sm px-6 text-center">
          <div>
            <MapPin className="h-9 w-9 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">Sin canchas para ubicar en el mapa</p>
            <p className="text-sm text-gray-500 mt-1">Cambia los filtros o vuelve a la vista de lista.</p>
          </div>
        </div>
      )}

      {/* Las canchas sin coordenadas ni ciudad reconocida no se pueden pintar:
          se avisa para que el conteo del mapa no contradiga al de la lista. */}
      {ready && hidden > 0 && (
        <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 shadow-sm max-w-[15rem]">
          {hidden} {hidden === 1 ? 'cancha no tiene' : 'canchas no tienen'} ubicación registrada
        </div>
      )}

      {popupHost && selected && createPortal(<MapCourtCard point={selected} query={query} />, popupHost)}
    </div>
  );
}

/* ── Ficha que se abre sobre el pin ──────────────────────────────── */
function MapCourtCard({ point, query }: { point: CourtPoint; query?: string }) {
  const court = point.court;
  const sport = getSport(court.sport);

  return (
    <Link href={`/canchas/${court._id}${query ? `?${query}` : ''}`} className="block group">
      <div className="relative aspect-[16/10] bg-gray-100">
        <Image src={court.photos?.[0] || sport.img} alt={court.name} fill sizes="248px" className="object-cover" />
        {court.totalReviews > 0 && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-gray-900/80 backdrop-blur text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
            {court.averageRating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-green-700 transition-colors">
          {court.name}
        </p>
        <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
          <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
          <span className="truncate">{court.location?.address || court.location?.city || 'Colombia'}</span>
        </p>
        {point.approx && (
          <p className="text-[11px] text-amber-600 mt-1">Ubicación aproximada (por ciudad)</p>
        )}
        <p className="text-gray-900 mt-2">
          <span className="font-bold">${court.pricePerHour.toLocaleString('es-CO')}</span>
          <span className="text-gray-400 text-[11px] font-normal"> COP / hora</span>
        </p>
      </div>
    </Link>
  );
}
