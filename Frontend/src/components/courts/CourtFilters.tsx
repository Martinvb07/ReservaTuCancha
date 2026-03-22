'use client';

import { Filter, X, ChevronDown } from 'lucide-react';
import type { CourtFilters } from '@/types';

const SPORTS = [
  { value: '', label: 'Todos los deportes', emoji: '🏟️' },
  { value: 'futbol',      label: 'Fútbol',      emoji: '⚽' },
  { value: 'padel',       label: 'Pádel',       emoji: '🎾' },
  { value: 'voley_playa', label: 'Voley Playa', emoji: '🏐' },
];

const CITIES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Villavicencio', 'Bucaramanga'];

const selectClass = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 transition appearance-none cursor-pointer';
const inputClass  = 'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const labelClass  = 'block text-xs font-black text-gray-600 uppercase tracking-widest mb-2';

import type { Club } from '@/types/club.types';

interface Props {
  filters: CourtFilters;
  onChange: (filters: CourtFilters) => void;
  clubs?: Club[];
}

export default function CourtFilters({ filters, onChange, clubs = [] }: Props) {
  // DEBUG: Mostrar en consola los clubs y la ciudad seleccionada
  console.log('CourtFilters clubs:', clubs, 'city:', filters.city);
  const hasFilters = filters.sport || filters.city || filters.minPrice || filters.maxPrice;

  const reset = () => onChange({ sport: '', city: '', minPrice: '', maxPrice: '', page: 1 });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <Filter className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-black text-gray-900 text-sm uppercase tracking-wide">Filtros</span>
        </div>
        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">

        {/* Deporte */}
        <div>
          <label className={labelClass}>Deporte</label>
          <div className="relative">
            <select
              value={filters.sport || ''}
              onChange={(e) => onChange({ ...filters, sport: e.target.value, page: 1 })}
              className={selectClass}
            >
              {SPORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>


        {/* Ciudad */}
        <div>
          <label className={labelClass}>Ciudad</label>
          <div className="relative">
            <select
              value={filters.city || ''}
              onChange={(e) => onChange({ ...filters, city: e.target.value, page: 1 })}
              className={selectClass}
            >
              <option value="">Todas las ciudades</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Empresas (debajo de ciudad, bloqueado si no hay ciudad) */}
        <div>
          <label className={labelClass}>Empresas</label>
          <select
            className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 cursor-pointer"
            disabled={!filters.city}
          >
            <option value="">{!filters.city ? 'Selecciona una ciudad' : (clubs && clubs.length > 0 ? `${clubs.length} empresas encontradas` : 'No hay empresas en esta ciudad')}</option>
            {filters.city && clubs && clubs.map(club => (
              <option key={club._id} value={club._id}>{club.name}</option>
            ))}
          </select>
        </div>

        {/* Precio */}
        <div>
          <label className={labelClass}>Precio por hora (COP)</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Mín"
              className={inputClass}
              value={filters.minPrice || ''}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value, page: 1 })}
            />
            <input
              type="number"
              placeholder="Máx"
              className={inputClass}
              value={filters.maxPrice || ''}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value, page: 1 })}
            />
          </div>
        </div>

        {/* Botón aplicar */}
        <button
          onClick={() => onChange({ ...filters, page: 1 })}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-sm py-3 rounded-xl transition-colors"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}