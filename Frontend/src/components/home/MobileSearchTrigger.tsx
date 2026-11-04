'use client';

import { Search } from 'lucide-react';
import { useAnimatedDisclosure } from '@/hooks/useAnimatedDisclosure';
import MobileSearchSheet, { SHEET_EXIT_MS, type SearchDefaults } from './MobileSearchSheet';

/* Solo móvil: la píldora "¿Listo para jugar?" del hero abre el buscador
   COMPLETO en un sheet a pantalla completa (tarjetas estilo Airbnb). */
export default function MobileSearchTrigger({ suave = false, pildora = false, ...props }: SearchDefaults & {
  /** Sobre el fondo claro (como en la app): sin la sombra fuerte del hero. */
  suave?: boolean;
  /** La píldora centrada de Airbnb: "Empieza tu búsqueda". */
  pildora?: boolean;
}) {
  const sheet = useAnimatedDisclosure(SHEET_EXIT_MS);

  if (pildora) {
    return (
      <>
        <button
          type="button"
          onClick={sheet.show}
          className="lg:hidden w-full flex items-center justify-center gap-2.5 rounded-full border border-gray-200 bg-white px-5 py-4 active:scale-[.99] transition-transform"
          style={{ boxShadow: '0 3px 12px rgba(0,0,0,.10)' }}
        >
          <Search className="h-[18px] w-[18px] text-gray-900" strokeWidth={2.5} />
          <span className="text-[15px] font-semibold text-gray-900">Empieza tu búsqueda</span>
        </button>
        {sheet.open && <MobileSearchSheet {...props} closing={sheet.closing} onClose={sheet.hide} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={sheet.show}
        className={`lg:hidden w-full flex items-center gap-3 bg-white text-left active:scale-[.99] transition-transform ${
          suave ? 'rounded-3xl px-4 py-4' : 'rounded-2xl px-4 py-3.5'
        }`}
        style={{ boxShadow: suave ? '0 1px 2px rgba(17,24,39,.04)' : '0 10px 30px rgba(0,0,0,.24)' }}
      >
        <span className="w-9 h-9 rounded-full bg-green-600 grid place-items-center flex-none text-white">
          <Search className="h-[17px] w-[17px]" />
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-[14px] font-bold text-gray-900 leading-tight">¿Listo para jugar?</span>
          <span className="text-[12.5px] text-gray-500 leading-tight">Deporte · Ciudad · Fecha · Hora</span>
        </span>
      </button>

      {sheet.open && <MobileSearchSheet {...props} closing={sheet.closing} onClose={sheet.hide} />}
    </>
  );
}
