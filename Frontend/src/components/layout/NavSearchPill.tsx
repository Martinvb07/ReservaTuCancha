'use client';

import { Search } from 'lucide-react';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { getSport } from '@/lib/constants';
import type { Panel } from '@/components/home/HeroSearch';

interface Props {
  active: boolean;
  /** Abre el buscador en el campo tocado (o sin campo, con el botón). */
  onAbrir: (panel: Panel) => void;
}

const a12h = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};

/**
 * Buscador del navbar cuando el grande de la página ya se fue con el scroll
 * (solo PC). Aprovecha el ancho: los cuatro campos a la vista, cada uno abre
 * el buscador directo en ese campo. Muestra lo que ya se está buscando (en
 * /empresas los filtros viven en la URL).
 */
export function NavSearchPill({ active, onAbrir }: Props) {
  const pathname = usePathname();
  const [valores, setValores] = useState({ sport: '', city: '', date: '', start: '' });
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setValores({ sport: q.get('sport') ?? '', city: q.get('city') ?? '', date: q.get('date') ?? '', start: q.get('start') ?? '' });
  }, [pathname]);

  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(valores.date)
    ? format(parse(valores.date, 'yyyy-MM-dd', new Date()), "EEE d 'de' MMM", { locale: es })
    : '';
  const campos: { panel: Exclude<Panel, null>; texto: string; lleno: boolean; soloXl?: boolean }[] = [
    { panel: 'deporte', texto: valores.sport ? getSport(valores.sport).label : 'Cualquier deporte', lleno: !!valores.sport },
    { panel: 'ciudad', texto: valores.city || 'Cualquier ciudad', lleno: !!valores.city },
    { panel: 'fecha', texto: fecha || 'Cualquier fecha', lleno: !!fecha },
    { panel: 'hora', texto: valores.start ? a12h(valores.start) : 'Cualquier hora', lleno: !!valores.start, soloXl: true },
  ];

  return (
    <div
      className={`nav-search-in flex h-12 w-[520px] items-center rounded-full bg-white pl-1.5 pr-1.5 xl:w-[680px] ${active ? '' : 'hover:shadow-md'}`}
      style={{
        border: `1px solid ${active ? '#86efac' : '#e5e7eb'}`,
        boxShadow: active
          ? '0 0 0 3px rgba(22,163,74,.10), 0 2px 10px rgba(20,30,22,.10)'
          : '0 2px 10px rgba(20,30,22,.08)',
        transition: 'box-shadow .2s, border-color .2s',
      }}
    >
      {campos.map((c, i) => (
        <div key={c.panel} className={`min-w-0 flex-1 items-center ${c.soloXl ? 'hidden xl:flex' : 'flex'}`}>
          {i > 0 && <span className="h-5 w-px shrink-0 bg-gray-200" />}
          <button
            type="button"
            onClick={() => onAbrir(c.panel)}
            className={`h-10 min-w-0 flex-1 truncate rounded-full px-3.5 text-left text-[13.5px] transition-colors hover:bg-gray-100 focus:outline-none focus-visible:bg-gray-100 ${
              c.lleno ? 'font-semibold text-gray-900' : i === 0 ? 'font-semibold text-gray-800' : 'text-gray-500'
            }`}
          >
            {c.texto}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onAbrir(null)}
        aria-label={active ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
        aria-expanded={active}
        className="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-600 text-white transition-transform hover:scale-105"
      >
        <Search className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
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
