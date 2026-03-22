'use client';

import { MapPin, Building2, ChevronRight } from 'lucide-react';
import type { Club } from '@/types/club.types';

const SPORT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  futbol:      { label: 'Fútbol',      emoji: '⚽', color: 'bg-green-100 text-green-700'  },
  padel:       { label: 'Pádel',       emoji: '🎾', color: 'bg-blue-100 text-blue-700'    },
  voley_playa: { label: 'Voley Playa', emoji: '🏐', color: 'bg-orange-100 text-orange-700'},
};

interface Props { club: Club; onClick?: () => void; }

export default function ClubCard({ club, onClick }: Props) {
  const initial = club.name.charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-lime-400 hover:shadow-xl transition-all duration-300"
    >
      {/* Header oscuro */}
      <div className="relative h-28 bg-gray-900 flex items-center justify-center overflow-hidden">
        {club.logo ? (
          <img src={club.logo} alt={club.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="relative z-10 w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center">
          {club.logo ? (
            <img src={club.logo} alt={club.name} className="w-full h-full object-contain rounded-2xl" />
          ) : (
            <span className="text-2xl font-black text-lime-600">{initial}</span>
          )}
        </div>

        {(club.totalCourts ?? 0) > 0 && (
          <div className="absolute top-3 right-3 bg-lime-400 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-full">
            {club.totalCourts} {club.totalCourts === 1 ? 'cancha' : 'canchas'}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-black text-gray-900 text-base leading-tight truncate group-hover:text-lime-600 transition-colors">
              {club.name}
            </h3>
            {(club.city || club.address) && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{club.city || club.address}</span>
              </p>
            )}
          </div>
          <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-lime-400 group-hover:bg-lime-50 transition-all">
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-lime-600 transition-colors" />
          </div>
        </div>

        {/* Deportes */}
        {club.sports && club.sports.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {club.sports.map((sport) => {
              const s = SPORT_LABELS[sport] ?? { label: sport, emoji: '🏟️', color: 'bg-gray-100 text-gray-600' };
              return (
                <span key={sport} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${s.color}`}>
                  {s.emoji} {s.label}
                </span>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Building2 className="h-3 w-3" />
            <span>Ver canchas disponibles</span>
          </div>
          {club.contactEmail && (
            <span className="text-[10px] text-gray-300 truncate max-w-[120px]">{club.contactEmail}</span>
          )}
        </div>
      </div>
    </button>
  );
}