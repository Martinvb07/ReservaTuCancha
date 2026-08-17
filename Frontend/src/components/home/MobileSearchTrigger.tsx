'use client';

import { Search } from 'lucide-react';
import { useAnimatedDisclosure } from '@/hooks/useAnimatedDisclosure';
import MobileSearchSheet, { SHEET_EXIT_MS, type SearchDefaults } from './MobileSearchSheet';

/* Solo móvil: la píldora "¿Listo para jugar?" del hero abre el buscador
   COMPLETO en un sheet a pantalla completa (tarjetas estilo Airbnb). */
export default function MobileSearchTrigger(props: SearchDefaults) {
  const sheet = useAnimatedDisclosure(SHEET_EXIT_MS);

  return (
    <>
      <button
        type="button"
        onClick={sheet.show}
        className="lg:hidden w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 text-left active:scale-[.99] transition-transform"
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

      {sheet.open && <MobileSearchSheet {...props} closing={sheet.closing} onClose={sheet.hide} />}
    </>
  );
}
