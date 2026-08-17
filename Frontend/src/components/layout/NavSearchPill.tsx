'use client';

import { Search } from 'lucide-react';

interface Props {
  active: boolean;
  onClick: () => void;
}

/**
 * Buscador compacto que ocupa el centro del navbar cuando el buscador grande de
 * la página ya se fue con el scroll. Se mantiene visible (como píldora activa)
 * mientras el panel está abierto y alterna abrir / cerrar.
 */
export function NavSearchPill({ active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
      aria-expanded={active}
      className={`nav-search-in group flex items-center gap-1 bg-white rounded-full pl-5 pr-2 py-2 max-w-full ${active ? '' : 'hover:shadow-md'}`}
      style={{
        border: `1px solid ${active ? '#86efac' : '#e5e7eb'}`,
        boxShadow: active
          ? '0 0 0 3px rgba(22,163,74,.10), 0 2px 10px rgba(20,30,22,.10)'
          : '0 2px 10px rgba(20,30,22,.08)',
        transition: 'box-shadow .2s, border-color .2s',
      }}
    >
      <span className="text-[13.5px] font-bold text-gray-800 whitespace-nowrap">Busca tu cancha</span>
      <span className="w-px h-4 bg-gray-200 mx-2.5" />
      <span className="text-[13.5px] text-gray-500 whitespace-nowrap">Ciudad</span>
      <span className="w-px h-4 bg-gray-200 mx-2.5 hidden xl:block" />
      <span className="text-[13.5px] text-gray-500 whitespace-nowrap hidden xl:inline">Fecha</span>
      <span className="ml-1.5 w-8 h-8 rounded-full bg-green-600 grid place-items-center flex-none text-white transition-transform group-hover:scale-105">
        <Search className="h-[15px] w-[15px]" />
      </span>
    </button>
  );
}

/**
 * Versión móvil / tablet: ocupa el hueco entre el logo y el botón de menú
 * (`flex-1`), así queda equilibrada en vez de apretada contra el menú, y hay
 * sitio para el resumen de dos líneas en lugar de solo "Buscar".
 */
export function NavSearchPillCompact({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir búsqueda"
      className="nav-search-in lg:hidden flex-1 min-w-0 mx-1 flex items-center gap-2.5 h-11 pl-2 pr-3.5 rounded-full bg-white border border-gray-200 text-left active:scale-[.98] transition-transform"
      style={{ boxShadow: '0 2px 10px rgba(20,30,22,.09)' }}
    >
      <span className="w-8 h-8 rounded-full bg-green-600 grid place-items-center flex-none text-white">
        <Search className="h-4 w-4" />
      </span>
      <span className="flex flex-col min-w-0 leading-tight">
        <span className="text-[13px] font-bold text-gray-900 truncate">Busca tu cancha</span>
        <span className="text-[11px] text-gray-500 truncate">Deporte · Ciudad · Fecha · Hora</span>
      </span>
    </button>
  );
}
