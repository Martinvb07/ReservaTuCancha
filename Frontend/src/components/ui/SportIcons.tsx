/**
 * Iconos de deportes en SVG (lucide no trae balones en la versión que usamos).
 * Trazo con `currentColor` y grosor 1.75 para que peguen con el resto de iconos.
 */

import type { ComponentType } from 'react';
import { Trophy } from 'lucide-react';

type Props = { className?: string };

export type SportIcon = ComponentType<{ className?: string }>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function FutbolIcon({ className = 'h-6 w-6' }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      {/* Pentágono central y costuras hacia el borde */}
      <path d="M12 7.2 15.7 9.9 14.3 14.2H9.7L8.3 9.9 12 7.2Z" />
      <path d="M12 2.5v4.7" />
      <path d="m15.7 9.9 4.4-1.5" />
      <path d="m14.3 14.2 2.7 3.9" />
      <path d="m9.7 14.2-2.7 3.9" />
      <path d="M8.3 9.9 3.9 8.4" />
    </svg>
  );
}

export function PadelIcon({ className = 'h-6 w-6' }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      {/* Pala */}
      <path d="M12 2.5c4.1 0 7.4 3.2 7.4 7.2s-3.3 7.2-7.4 7.2-7.4-3.2-7.4-7.2S7.9 2.5 12 2.5Z" />
      {/* Puño */}
      <path d="M12 16.9v3.4" />
      <path d="M10.4 20.8h3.2" />
      {/* Perforaciones */}
      <circle cx="9.8" cy="8" r=".85" fill="currentColor" stroke="none" />
      <circle cx="14.2" cy="8" r=".85" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11.4" r=".85" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function VoleyIcon({ className = 'h-6 w-6' }: Props) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      {/* Costuras del balón de voley */}
      <path d="M12 2.5a13 13 0 0 0 0 9.5 12.6 12.6 0 0 0 8.6 5" />
      <path d="M12 12a12.6 12.6 0 0 1-8.7 5" />
      <path d="M16.8 13.6a16.5 16.5 0 0 1-9 7.4" />
      <path d="M6.5 3.9a16.5 16.5 0 0 0 1.8 11.4" />
      <path d="M11.2 7.1a16.5 16.5 0 0 1 10.8 4" />
    </svg>
  );
}

/** Icono por deporte. Tolera claves sueltas ("voley_playa", "futbol_5"…). */
export function getSportIcon(key?: string): SportIcon {
  if (key?.includes('futbol')) return FutbolIcon;
  if (key?.includes('padel'))  return PadelIcon;
  if (key?.includes('voley'))  return VoleyIcon;
  return Trophy;   // deporte desconocido
}
