import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, ChevronRight } from 'lucide-react';
import type { Court } from '@/types';

const SPORT_LABELS: Record<string, { label: string; emoji: string }> = {
  futbol:      { label: 'Fútbol',      emoji: '⚽' },
  padel:       { label: 'Pádel',       emoji: '🎾' },
  voley_playa: { label: 'Voley Playa', emoji: '🏐' },
};

interface Props { court: Court }

export default function CourtCard({ court }: Props) {
  const sport = SPORT_LABELS[court.sport] ?? { label: court.sport, emoji: '🏟️' };

  return (
    <Link
      href={`/empresas/${court._id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-green-300 hover:shadow-xl transition-all duration-300"
    >
      {/* Imagen */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {court.photos?.[0] ? (
          <Image
            src={court.photos[0]}
            alt={court.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl bg-gradient-to-br from-gray-800 to-gray-900">
            {sport.emoji}
          </div>
        )}
        {/* Overlay gradiente bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badge deporte */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {sport.emoji} {sport.label}
          </span>
        </div>

        {/* Rating encima de la imagen */}
        {court.totalReviews > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {court.averageRating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Precio encima del gradiente */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-green-600 text-white text-sm font-black px-3 py-1 rounded-full shadow-lg">
            ${court.pricePerHour.toLocaleString('es-CO')}
            <span className="text-green-200 font-normal text-xs ml-1">/h</span>
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-2">
        <h3 className="font-black text-gray-900 text-base leading-tight line-clamp-1 group-hover:text-green-700 transition-colors">
          {court.name}
        </h3>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
          <span className="truncate">{court.location.city}, {court.location.department}</span>
        </div>

        {/* Amenities */}
        {court.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {court.amenities.slice(0, 3).map((a) => (
              <span key={a} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {a}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
          {court.totalReviews > 0 ? (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {court.averageRating.toFixed(1)} · {court.totalReviews} reseñas
            </span>
          ) : (
            <span className="text-xs text-gray-400">Sin reseñas aún</span>
          )}
          <span className="flex items-center gap-1 text-xs font-bold text-green-700 group-hover:gap-2 transition-all">
            Ver cancha <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}