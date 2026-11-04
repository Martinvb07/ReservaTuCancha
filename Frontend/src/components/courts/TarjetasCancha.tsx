import Link from 'next/link';
import { MapPin, Star, ChevronRight, Heart } from 'lucide-react';
import type { Court } from '@/types';
import { getSport } from '@/lib/constants';
import SportIcon from '@/components/ui/SportIcon';
import FotoRemota from '@/components/ui/FotoRemota';

/* Las tarjetas del inicio de la app móvil, para la web. */

const precio = (n: number) => `$${n.toLocaleString('es-CO')}`;

/** Píldora de vidrio esmerilado sobre la foto. */
function Vidrio({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/20 text-white backdrop-blur-md ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Tarjeta alta del carrusel "Canchas para hoy": la foto a todo el alto con
 * deporte y nota arriba, nombre y ciudad, y abajo la píldora "Reservar · precio".
 */
export function TarjetaGrande({ court, distancia }: { court: Court; distancia?: string }) {
  const sport = getSport(court.sport);
  const foto = court.photos?.[0] || sport.img;
  return (
    <Link
      href={`/canchas/${court._id}`}
      className="group relative block h-[400px] md:h-[420px] overflow-hidden rounded-[32px] bg-gray-200 shadow-[0_14px_30px_rgba(0,0,0,0.14)] outline-none focus-visible:ring-4 focus-visible:ring-green-500/40"
    >
      <FotoRemota
        src={foto}
        alt={court.name}
        sizes="(max-width: 768px) 85vw, 360px"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,.55) 0%, transparent 35%, transparent 62%, rgba(0,0,0,.6) 100%)' }}
      />

      <div className="absolute inset-x-5 top-5">
        <div className="flex items-center justify-between gap-2">
          <Vidrio className="px-2.5 py-1.5 text-xs font-semibold">
            <SportIcon sport={court.sport} size={14} /> {sport.label}
          </Vidrio>
          {court.averageRating > 0 && (
            <Vidrio className="px-2.5 py-1.5 text-xs font-bold">
              <Star className="h-3.5 w-3.5 text-lime-400" /> {court.averageRating.toFixed(1)}
            </Vidrio>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 text-2xl font-bold leading-tight text-white">{court.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-white" />
          <span className="truncate">
            {distancia
              ? `${court.location.city} · ${distancia}`
              : `${court.location.city}${court.location.department ? `, ${court.location.department}` : ''}`}
          </span>
        </p>
      </div>

      <div className="absolute inset-x-4 bottom-4">
        <Vidrio className="w-full justify-between px-5 py-3.5 text-sm transition-colors group-hover:bg-white/30">
          <span className="font-semibold">Reservar</span>
          <span>
            <span className="font-bold">{precio(court.pricePerHour)}</span> /h
          </span>
        </Vidrio>
      </div>
    </Link>
  );
}

/** Fila compacta de "Mejor calificadas": foto, nombre, deporte · ciudad, nota y precio. */
export function FilaCancha({ court }: { court: Court }) {
  const sport = getSport(court.sport);
  const foto = court.photos?.[0] || sport.img;
  return (
    <Link
      href={`/canchas/${court._id}`}
      className="group flex items-center gap-3 rounded-3xl bg-white p-2.5 transition-shadow hover:shadow-[0_8px_24px_rgba(17,24,39,0.08)] outline-none focus-visible:ring-4 focus-visible:ring-green-500/30"
    >
      <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[18px] bg-gray-200">
        <FotoRemota src={foto} alt={court.name} sizes="84px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-gray-900">{court.name}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {sport.label} · {court.location.city}
        </p>
        <p className="mt-2 flex items-center gap-3 text-xs">
          {court.averageRating > 0 && (
            <span className="inline-flex items-center gap-1 font-bold text-gray-800">
              <Star className="h-3.5 w-3.5 text-amber-500" /> {court.averageRating.toFixed(1)}
            </span>
          )}
          <span className="text-gray-500">
            <span className="font-bold text-green-700">{precio(court.pricePerHour)}</span> /hora
          </span>
        </p>
      </div>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fondo text-gray-700 transition-colors group-hover:bg-green-600 group-hover:text-white">
        <ChevronRight className="h-[18px] w-[18px]" />
      </span>
    </Link>
  );
}

/**
 * Tarjeta de las filas del inicio, estilo Airbnb: foto cuadrada redondeada
 * con el corazón de favoritas y, si la cancha es de las mejor puntuadas, la
 * etiqueta "Favorita". Debajo, nombre, deporte · ciudad y precio
 * con la nota.
 */
export function TarjetaCuadrada({
  court, detalle, favorita, onFavorita,
}: {
  court: Court;
  /** Reemplaza "deporte · ciudad" (por ejemplo, la distancia). */
  detalle?: string;
  favorita: boolean;
  onFavorita: () => void;
}) {
  const sport = getSport(court.sport);
  const foto = court.photos?.[0] || sport.img;
  const destacada = court.averageRating >= 4.6 && court.totalReviews >= 4;
  return (
    <div className="group relative">
      <Link href={`/canchas/${court._id}`} className="block rounded-[20px] outline-none focus-visible:ring-4 focus-visible:ring-green-500/30">
        <div className="relative aspect-square overflow-hidden rounded-[20px] bg-gray-100">
          <FotoRemota src={foto} alt={court.name} sizes="(max-width: 640px) 45vw, 220px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          {destacada && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm">
              Favorita
            </span>
          )}
        </div>
        <p className="mt-2.5 truncate text-[15px] font-semibold text-gray-900">{court.name}</p>
        <p className="truncate text-[13px] text-gray-500">{detalle ?? `${sport.label} · ${court.location.city}`}</p>
        <p className="mt-0.5 text-[13px] text-gray-500">
          <span className="font-semibold text-gray-900">{precio(court.pricePerHour)}</span> por hora
          {court.averageRating > 0 && (
            <>
              {' · '}
              <span className="inline-flex items-center gap-0.5 text-gray-700">
                <Star className="h-3 w-3 fill-gray-900 text-gray-900" />
                {court.averageRating.toFixed(1).replace('.', ',')}
              </span>
            </>
          )}
        </p>
      </Link>
      <button
        type="button"
        onClick={onFavorita}
        aria-label={favorita ? 'Quitar de favoritas' : 'Guardar en favoritas'}
        aria-pressed={favorita}
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center transition-transform hover:scale-110 active:scale-90"
      >
        <Heart
          className={`h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] ${favorita ? 'fill-red-500 text-white' : 'fill-black/30 text-white'}`}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}
