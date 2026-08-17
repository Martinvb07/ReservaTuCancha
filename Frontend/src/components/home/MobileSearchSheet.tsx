'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import HeroSearch from './HeroSearch';

export interface SearchDefaults {
  initialSport?: string;
  initialCity?: string;
  initialDate?: string; // yyyy-MM-dd
  initialTime?: string; // HH:mm
}

interface Props extends SearchDefaults {
  closing: boolean;
  onClose: () => void;
}

/** Duración de la animación de salida — debe coincidir con `.mobile-sheet-out`. */
export const SHEET_EXIT_MS = 180;

/**
 * Buscador completo a pantalla completa (solo móvil). Lo usan tanto la píldora
 * del hero como el buscador compacto del navbar, así que vive aparte del botón
 * que lo abre.
 */
export default function MobileSearchSheet({ closing, onClose, ...defaults }: Props) {
  /* Bloquea el scroll del body y esconde los FAB (WhatsApp, campana) mientras
     el sheet está abierto */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('sheet-open');
    return () => { document.body.style.overflow = prev; document.body.classList.remove('sheet-open'); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  /* Portal al body: el disparador vive dentro del hero (`relative z-10`), que es
     un contexto de apilamiento propio. Sin el portal el sheet quedaba encerrado
     ahí y el navbar (z-40) se pintaba encima, tapando la X de cerrar. */
  return createPortal(
    <div className={`fixed inset-0 z-[100] lg:hidden ${closing ? 'mobile-sheet-out' : 'mobile-sheet-in'}`}>
      {/* Fondo: la página detrás, difuminada y atenuada. Tocarlo cierra el sheet. */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-lg" onClick={onClose} />

      {/* Cerrar — arriba, separado del borde */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar búsqueda"
        className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white grid place-items-center text-gray-800 active:scale-95 transition-transform"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,.22)' }}
      >
        <X className="h-[19px] w-[19px]" />
      </button>

      {/* Contenido — con aire arriba para no pegarse al borde/navbar.
          El clic aquí no cierra (solo el fondo). */}
      <div
        className="relative h-full overflow-y-auto no-scrollbar px-4 pt-20 pb-6"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={(e) => e.stopPropagation()}
      >
        <HeroSearch {...defaults} mobile onSearch={onClose} />
      </div>
    </div>,
    document.body,
  );
}
