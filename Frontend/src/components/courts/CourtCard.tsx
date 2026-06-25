import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, ArrowRight } from 'lucide-react';
import type { Court } from '@/types';
import { getSport } from '@/lib/constants';
import { AMEN_ICONS } from '@/lib/amenityIcons';
import SportIcon from '@/components/ui/SportIcon';

interface Props {
  court: Court;
  /** querystring (sin '?') para arrastrar fecha/hora elegida hasta la reserva */
  query?: string;
}

export default function CourtCard({ court, query }: Props) {
  const sport = getSport(court.sport);
  const href = `/canchas/${court._id}${query ? `?${query}` : ''}`;

  // Solo amenidades conocidas (con icono), máx 4.
  const amenities = (court.amenities ?? []).filter((a) => AMEN_ICONS[a]).slice(0, 4);
  const extraAmen = (court.amenities ?? []).filter((a) => AMEN_ICONS[a]).length - amenities.length;

  return (
    <Link
      href={href}
      className="rtc-card group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <Image
          src={court.photos?.[0] || sport.img}
          alt={court.name}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badge deporte */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          <SportIcon sport={court.sport} size={14} /> {sport.label}
        </span>

        {/* Badge rating */}
        {court.totalReviews > 0 && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-gray-900/80 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {court.averageRating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-1 group-hover:text-green-700 transition-colors">
          {court.name}
        </h3>

        <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="truncate">
            {court.location.city}
            {court.location.department ? `, ${court.location.department}` : ''}
          </span>
        </p>

        {/* Amenidades */}
        {amenities.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 mb-4">
            {amenities.map((a) => {
              const Icon = AMEN_ICONS[a];
              return (
                <span key={a} title={a} className="w-7 h-7 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              );
            })}
            {extraAmen > 0 && <span className="text-xs font-semibold text-gray-400">+{extraAmen}</span>}
          </div>
        )}

        {/* Precio + CTA */}
        <div className="flex items-center justify-between mt-auto pt-3.5 border-t border-gray-100">
          <span className="text-gray-900">
            <span className="font-bold text-lg">${court.pricePerHour.toLocaleString('es-CO')}</span>
            <span className="text-gray-400 text-xs font-normal"> COP / hora</span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 group-hover:gap-1.5 transition-all">
            Reservar <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
