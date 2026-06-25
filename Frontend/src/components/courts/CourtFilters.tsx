'use client';

import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import type { CourtFilters } from '@/types';
import { SPORTS, CITIES, SORT_OPTIONS } from '@/lib/constants';

const selectClass =
  'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition appearance-none cursor-pointer';
const inputClass =
  'w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition';
const labelClass = 'block text-xs font-semibold text-gray-500 mb-2';

interface Props {
  filters: CourtFilters;
  onChange: (filters: CourtFilters) => void;
}

export default function CourtFilters({ filters, onChange }: Props) {
  const hasFilters =
    filters.sport || filters.city || filters.minPrice || filters.maxPrice;

  const reset = () =>
    onChange({ sport: '', city: '', minPrice: '', maxPrice: '', sort: 'rating', page: 1 });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-700" />
          <span className="font-semibold text-gray-900 text-sm">Filtros</span>
        </div>
        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
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
              <option value="">Todos los deportes</option>
              {SPORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
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
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className={labelClass}>Precio por hora (COP)</label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Mín"
              className={inputClass}
              value={filters.minPrice || ''}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value, page: 1 })}
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Máx"
              className={inputClass}
              value={filters.maxPrice || ''}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value, page: 1 })}
            />
          </div>
        </div>

        {/* Ordenar */}
        <div>
          <label className={labelClass}>Ordenar por</label>
          <div className="relative">
            <select
              value={filters.sort || 'rating'}
              onChange={(e) =>
                onChange({ ...filters, sort: e.target.value as CourtFilters['sort'] })
              }
              className={selectClass}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
