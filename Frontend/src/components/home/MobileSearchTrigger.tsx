'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import HeroSearch from './HeroSearch';

/* Solo móvil: la píldora "¿Listo para jugar?" del hero abre el buscador
   COMPLETO en un sheet a pantalla completa (tarjetas estilo Airbnb). El sheet
   entra con fade + tarjetas escalonadas y sale con fade. */
interface Props {
  initialSport?: string;
  initialCity?: string;
  initialDate?: string; // yyyy-MM-dd
  initialTime?: string; // HH:mm
}

export default function MobileSearchTrigger(props: Props) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSheet = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setClosing(false);
    setOpen(true);
  };
  /* Cierra reproduciendo la salida y desmonta al terminar (≈ duración del CSS) */
  const closeSheet = () => {
    if (closing) return;
    setClosing(true);
    timer.current = setTimeout(() => { setOpen(false); setClosing(false); timer.current = null; }, 200);
  };

  /* Bloquea el scroll del body mientras el sheet está abierto */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* Cerrar con Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSheet(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closing]);

  /* Limpia el timer al desmontar */
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="md:hidden w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 text-left"
        style={{ boxShadow: '0 10px 30px rgba(0,0,0,.24)' }}
      >
        <span className="w-9 h-9 rounded-full bg-green-600 grid place-items-center flex-none text-white">
          <Search className="h-[17px] w-[17px]" />
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-[14px] font-bold text-gray-900 leading-tight">¿Listo para jugar?</span>
          <span className="text-[12.5px] text-gray-500 leading-tight">Deporte · Ciudad · Fecha · Hora</span>
        </span>
      </button>

      {open && (
        <div className={`fixed inset-0 z-[100] md:hidden ${closing ? 'mobile-sheet-out' : 'mobile-sheet-in'}`}>
          {/* Fondo: la página detrás, difuminada y atenuada. Tocarlo cierra el sheet. */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-lg" onClick={closeSheet} />

          {/* Cerrar — arriba, separado del borde */}
          <button
            type="button"
            onClick={closeSheet}
            aria-label="Cerrar búsqueda"
            className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white grid place-items-center text-gray-800"
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
            <HeroSearch {...props} mobile onSearch={closeSheet} />
          </div>
        </div>
      )}
    </>
  );
}
