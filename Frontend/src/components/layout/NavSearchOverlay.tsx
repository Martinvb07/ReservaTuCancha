'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import HeroSearch from '@/components/home/HeroSearch';

/** Debe coincidir con la duración de `.rtc-search-out` en globals.css */
export const NAV_SEARCH_EXIT_MS = 260;

const NAV_HEIGHT = 64; // h-16

interface Props {
  closing: boolean;
  onClose: () => void;
}

/**
 * Buscador desplegado desde el navbar (solo desktop). No es una banda blanca
 * pegada a la barra: la página se atenúa por debajo del navbar y la búsqueda cae
 * como tarjeta flotante, separada por un gap.
 */
export default function NavSearchOverlay({ closing, onClose }: Props) {
  /* Prellenar con lo que ya está buscando (en /empresas los filtros viven en la
     URL). Se lee de window en lugar de useSearchParams porque el navbar vive en
     el layout: el hook obligaría a envolverlo en Suspense y desactivaría el
     render estático de todas las páginas públicas. */
  const [defaults] = useState(() => {
    if (typeof window === 'undefined') return {};
    const q = new URLSearchParams(window.location.search);
    return {
      initialSport: q.get('sport') ?? undefined,
      initialCity:  q.get('city')  ?? undefined,
      initialDate:  q.get('date')  ?? undefined,
      initialTime:  q.get('start') ?? undefined,
    };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  /* Portal al body: así el velo cubre la página completa sin quedar limitado por
     el contexto de apilamiento del header. z-[35] queda entre la barra de
     filtros sticky de /empresas (z-30) y el navbar (z-40), que debe seguir
     visible y clickeable encima del velo. */
  return createPortal(
    <div className="hidden lg:block fixed inset-0 z-[35]">
      {/* Velo — arranca bajo el navbar para no taparlo */}
      <div
        className={closing ? 'rtc-scrim-out' : 'rtc-scrim-in'}
        style={{ position: 'absolute', inset: `${NAV_HEIGHT}px 0 0 0`, background: 'rgba(12,20,14,.44)' }}
        onClick={onClose}
      />
      {/* Tarjeta flotante, separada del navbar por un gap */}
      <div
        className="absolute inset-x-0 flex justify-center px-4"
        style={{ top: NAV_HEIGHT + 18 }}
        onClick={onClose}
      >
        <div
          className={`w-full max-w-[980px] ${closing ? 'rtc-search-out' : 'rtc-search-expand'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <HeroSearch {...defaults} onSearch={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
