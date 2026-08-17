'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Debe coincidir con la duración de `.mobile-sheet-out` en globals.css */
export const STACK_SHEET_EXIT_MS = 180;

export interface StackSection<K extends string = string> {
  key: K;
  /** Título grande de la tarjeta cuando la sección está abierta */
  title: string;
  /** Etiqueta de la fila cuando está colapsada */
  label: string;
  /** Valor que se muestra a la derecha al estar colapsada */
  value: string;
  /** Pinta el valor en oscuro (hay algo elegido) en vez de gris */
  filled?: boolean;
  content: ReactNode;
}

interface Props<K extends string> {
  closing: boolean;
  onClose: () => void;
  sections: StackSection<K>[];
  /** Sección abierta; el resto queda colapsada */
  active: K | null;
  onActivate: (key: K) => void;
  /** Barra fija inferior (acciones) */
  footer?: ReactNode;
  /** Clases extra para la raíz, p. ej. `md:hidden` */
  className?: string;
}

const cardShadow = { boxShadow: '0 10px 36px rgba(20,30,22,.16)' };
const rowShadow  = { boxShadow: '0 2px 16px rgba(20,30,22,.10)' };

/**
 * Sheet móvil a pantalla completa con secciones apiladas estilo Airbnb: la
 * sección activa es una tarjeta grande y las demás quedan como filas colapsadas
 * con su valor a la derecha.
 *
 * Es el mismo lenguaje de movimiento que el buscador móvil (entrada escalonada,
 * fade de salida, fondo difuminado), extraído para que filtros y búsqueda no se
 * sientan como dos cosas distintas.
 */
export default function MobileStackSheet<K extends string>({
  closing, onClose, sections, active, onActivate, footer, className = '',
}: Props<K>) {
  /* Bloquea el scroll del body y esconde los FAB mientras el sheet está abierto */
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

  /* Portal al body: el disparador vive dentro de una barra sticky con su propio
     contexto de apilamiento, y ahí el sheet quedaría por debajo del navbar. */
  return createPortal(
    <div className={`fixed inset-0 z-[100] ${closing ? 'mobile-sheet-out' : 'mobile-sheet-in'} ${className}`}>
      {/* Fondo: la página detrás, difuminada. Tocarlo cierra el sheet. */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-lg" onClick={onClose} />

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white grid place-items-center text-gray-800 active:scale-95 transition-transform"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,.22)' }}
      >
        <X className="h-[19px] w-[19px]" />
      </button>

      <div
        className="relative h-full overflow-y-auto no-scrollbar px-4 pt-20 pb-6"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3 mobile-search-stack pb-24 text-left">
          {sections.map((s) => (
            s.key === active ? (
              <div key={s.key} className="bg-white rounded-3xl p-4" style={cardShadow}>
                <h3 className="text-[22px] font-extrabold text-gray-900 mb-3 px-1 leading-tight">{s.title}</h3>
                {s.content}
              </div>
            ) : (
              <button
                key={s.key}
                type="button"
                onClick={() => onActivate(s.key)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-white rounded-2xl text-left active:scale-[.99] transition-transform"
                style={rowShadow}
              >
                <span className="text-[15px] text-gray-500 flex-none">{s.label}</span>
                <span className={`text-[15px] font-bold truncate text-right ${s.filled ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s.value}
                </span>
              </button>
            )
          ))}
        </div>
      </div>

      {footer && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[110] flex items-center justify-between px-5 py-3.5 bg-white border-t border-gray-100"
          style={{ boxShadow: '0 -4px 20px rgba(20,30,22,.07)' }}
        >
          {footer}
        </div>
      )}
    </div>,
    document.body,
  );
}
