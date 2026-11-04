import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import type { Court } from '@/types';
import { getSport } from '@/lib/constants';
import { AMEN_ICONS } from '@/lib/amenityIcons';
import SportIcon from '@/components/ui/SportIcon';
import FotoRemota from '@/components/ui/FotoRemota';

interface Props {
  court: Court;
  /** querystring (sin '?') para arrastrar fecha/hora elegida hasta la reserva */
  query?: string;
}

/**
 * La tarjeta del listado, con el diseño de la app: blanca sobre el fondo gris,
 * sin borde, la foto adentro con su propio redondeo y los dos badges encima;
 * abajo nombre, ciudad, amenidades en cuadritos y precio con "Reservar".
 */
export default function CourtCard({ court, query }: Props) {
  const sport = getSport(court.sport);
  const href = `/canchas/${court._id}${query ? `?${query}` : ''}`;

  // Solo amenidades conocidas (con icono), máx 4.
  const conIcono = (court.amenities ?? []).filter((a) => AMEN_ICONS[a]);
  const amenities = conIcono.slice(0, 4);
  const extraAmen = conIcono.length - amenities.length;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-[28px] bg-white p-2 transition-shadow duration-300 hover:shadow-[0_14px_34px_rgba(17,24,39,0.08)] focus:outline-none focus-visible:ring-4 focus-visible:ring-green-500/30 active:scale-[.985]"
    >
      {/* Foto con los dos badges */}
      <div className="relative aspect-[16/11] overflow-hidden rounded-[22px] bg-gray-200">
        <FotoRemota
          src={court.photos?.[0] || sport.img}
          alt={court.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-gray-800">
          <SportIcon sport={court.sport} size={14} /> {sport.label}
        </span>
        {court.totalReviews > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {court.averageRating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col px-3 pb-2 pt-4">
        <h3 className="line-clamp-1 text-lg font-bold leading-snug text-gray-900">{court.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {court.location.city}
            {court.location.department ? `, ${court.location.department}` : ''}
          </span>
        </p>

        {amenities.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {amenities.map((a) => {
              const Icon = AMEN_ICONS[a];
              return (
                <span key={a} title={a} className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-fondo text-gray-800">
                  <Icon className="h-4 w-4" />
                </span>
              );
            })}
            {extraAmen > 0 && <span className="text-xs font-semibold text-gray-500">+{extraAmen}</span>}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="min-w-0 whitespace-nowrap text-gray-900">
            <span className="text-lg font-extrabold">${court.pricePerHour.toLocaleString('es-CO')}</span>
            <span className="text-xs text-gray-500"> /hora</span>
          </span>
          <span className="shrink-0 rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-green-700">
            Reservar
          </span>
        </div>
      </div>
    </Link>
  );
}
