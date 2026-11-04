'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import FaqAccordion from '@/components/ui/FaqAccordion';
import HeroSearch from '@/components/home/HeroSearch';
import MobileSearchTrigger from '@/components/home/MobileSearchTrigger';
import { TarjetaGrande, FilaCancha } from '@/components/courts/TarjetasCancha';
import { SEARCH_ANCHOR_ID } from '@/hooks/useSearchDock';
import { courtsApi } from '@/lib/api/courts.api';
import { SPORT_ICONO } from '@/lib/constants';
import type { Court } from '@/types';

/*
 * Inicio: arriba la franja estilo Airbnb (pestañas de deporte con ícono y
 * subrayado, y el buscador en píldora); abajo el diseño de la app móvil:
 * el carrusel "Canchas para hoy", las mejor calificadas, el aviso para
 * clubes y las preguntas frecuentes.
 */

const FAQ = [
  { q: '¿Necesito crear una cuenta para reservar?', a: 'No. Solo ingresas tu nombre, email y teléfono al momento de reservar. Sin contraseñas, sin registro.' },
  { q: '¿Cómo cancelo mi reserva?', a: 'Recibes un link en tu email para soltar tu horario hasta 24 horas antes del turno. El pago ya quedó procesado, así que no hacemos devoluciones: si lo que necesitas es jugar otro día, escríbenos a soporte y te movemos la reserva.' },
  { q: '¿Cuáles son los métodos de pago?', a: 'Aceptamos tarjetas de crédito/débito, Nequi, Daviplata y PSE a través de ePayco, una de las pasarelas más usadas de Colombia. Al precio de la cancha se le suma una tarifa de servicio de $2.000 por reserva, que ves antes de pagar.' },
  { q: '¿Cómo recibo la confirmación?', a: 'Al instante por email. Incluye los datos de la cancha, horario y el link para cancelar si lo necesitas.' },
];

/** Pestañas de arriba, con el ícono ilustrado de cada una. */
const PESTANAS = [
  { key: '', label: 'Todo', icono: SPORT_ICONO[''] },
  { key: 'futbol', label: 'Fútbol', icono: SPORT_ICONO.futbol },
  { key: 'padel', label: 'Pádel', icono: SPORT_ICONO.padel },
  { key: 'voley_playa', label: 'Vóley playa', icono: SPORT_ICONO.voley_playa },
  { key: 'cerca', label: 'Cerca de mí', icono: SPORT_ICONO.cerca },
] as const;

interface PublicStats {
  totalCourts: number;
  totalBookings: number;
  totalCities: number;
  avgRating: number;
  featuredCourts: Court[];
}

/** Distancia en km entre dos puntos (haversine). */
function km(a: { lat: number; lng: number }, c: Court): number | null {
  const co = c.location?.coordinates;
  if (!co || co.length !== 2) return null;
  const [lng, lat] = co;
  const r = Math.PI / 180;
  const h =
    Math.sin(((lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(lat * r) * Math.sin(((lng - a.lng) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
const textoKm = (d: number) => (d < 1 ? `a ${Math.round(d * 1000)} m` : `a ${d < 10 ? d.toFixed(1) : Math.round(d)} km`);

export default function HomeClient({ stats }: { stats: PublicStats }) {
  /* Las destacadas vienen del servidor; se completan con el listado general
     para tener con qué armar las filas por ciudad. */
  const [canchas, setCanchas] = useState<Court[]>(stats.featuredCourts ?? []);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    courtsApi
      .getAll({ limit: 48 })
      .then((r) => {
        setCanchas((ya) => {
          const ids = new Set(ya.map((c) => c._id));
          return [...ya, ...r.data.filter((c: Court) => !ids.has(c._id))];
        });
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const [pestana, setPestana] = useState('');
  const [posicion, setPosicion] = useState<{ lat: number; lng: number } | null>(null);
  const [ubicando, setUbicando] = useState(false);

  const elegir = (key: string) => {
    if (key !== 'cerca') return setPestana(key);
    if (posicion) return setPestana('cerca');
    if (!navigator.geolocation) return toast.error('Tu navegador no deja usar la ubicación');
    setUbicando(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosicion({ lat: p.coords.latitude, lng: p.coords.longitude });
        setPestana('cerca');
        setUbicando(false);
      },
      () => {
        setUbicando(false);
        toast.error('No pudimos ver tu ubicación. Revisa el permiso del navegador.');
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  /* La pestaña filtra el carrusel; "Cerca de mí" lo ordena por distancia. */
  const visibles = useMemo(() => {
    if (pestana === 'cerca' && posicion) {
      return [...canchas].sort((a, b) => (km(posicion, a) ?? Infinity) - (km(posicion, b) ?? Infinity));
    }
    return pestana ? canchas.filter((c) => c.sport === pestana) : canchas;
  }, [canchas, pestana, posicion]);

  const populares = useMemo(
    () => [...canchas].sort((a, b) => b.averageRating - a.averageRating).slice(0, 6),
    [canchas],
  );
  const consulta = pestana && pestana !== 'cerca' ? `?sport=${pestana}` : '';

  return (
    <div>
      {/* ── Franja de arriba: pestañas + buscador ─────────────────── */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-white to-[#f7f7f7]">
        {/* En celular va primero el buscador y debajo las pestañas; en
            escritorio, al revés (como Airbnb). El ancla envuelve los dos
            buscadores: la lee el navbar para acoplar la píldora al bajar. */}
        <div className="mx-auto flex max-w-6xl flex-col px-5 pb-6 pt-4 md:pb-8 md:pt-6">
          <div id={SEARCH_ANCHOR_ID} className="order-1 lg:order-2">
            <MobileSearchTrigger pildora />
            <div className="mx-auto mt-5 hidden max-w-[880px] lg:block">
              <HeroSearch />
            </div>
          </div>

          <nav aria-label="Deportes" className="order-2 mt-4 lg:order-1 flex justify-start gap-6 overflow-x-auto [scrollbar-width:none] sm:justify-center sm:gap-10 md:mt-0 [&::-webkit-scrollbar]:hidden">
            {PESTANAS.map((p) => {
              const activa = pestana === p.key || (p.key === 'cerca' && pestana === 'cerca');
              return (
                <button
                  key={p.key || 'todo'}
                  type="button"
                  onClick={() => elegir(p.key)}
                  aria-pressed={activa}
                  className={`group relative flex shrink-0 items-center gap-2 pb-3 pt-2 text-sm font-semibold transition-colors ${
                    activa ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className={`grid h-8 w-8 place-items-center transition-transform duration-200 md:h-9 md:w-9 ${activa ? 'scale-110' : 'grayscale-[35%] group-hover:scale-110 group-hover:grayscale-0'}`} aria-hidden>
                    {p.key === 'cerca' && ubicando
                      ? <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
                      : <img src={p.icono} alt="" width={36} height={36} className="h-full w-full object-contain" />}
                  </span>
                  <span className="whitespace-nowrap">{p.label}</span>
                  <span className={`absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-gray-900 transition-opacity ${activa ? 'opacity-100' : 'opacity-0 group-hover:opacity-20'}`} />
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      {/* ── Debajo: el diseño de la app (carrusel y lista) ────────── */}
      <div className="mx-auto w-full max-w-6xl pb-16">
        <Titulo texto="Canchas para hoy" href={`/empresas${consulta}`} className="mt-7 md:mt-10" />
        {cargando && visibles.length === 0 ? (
          <div className="mt-3 flex gap-4 overflow-hidden px-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[400px] w-[82%] shrink-0 animate-pulse rounded-[32px] bg-fondo-suave sm:w-[340px]" />
            ))}
          </div>
        ) : visibles.length === 0 ? (
          <div className="mx-5 mt-3 flex flex-col items-center rounded-[28px] bg-white px-6 py-10 text-center">
            <SearchX className="h-9 w-9 text-gray-300" />
            <p className="mt-3 font-bold text-gray-900">Aún no hay canchas de este deporte</p>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro o mira todas las canchas.</p>
          </div>
        ) : (
          <Carrusel>
            {visibles.map((c) => {
              const d = pestana === 'cerca' && posicion ? km(posicion, c) : null;
              return (
                <div key={c._id} className="w-[82%] shrink-0 snap-start sm:w-[340px]">
                  <TarjetaGrande court={c} distancia={d != null ? textoKm(d) : undefined} />
                </div>
              );
            })}
          </Carrusel>
        )}

        {populares.length > 0 && (
          <>
            <Titulo texto="Mejor calificadas" href="/empresas" className="mt-9 md:mt-12" />
            <div className="mt-3 grid gap-3 px-5 md:grid-cols-2">
              {populares.map((c) => (
                <FilaCancha key={c._id} court={c} />
              ))}
            </div>
          </>
        )}

        {/* ── Para clubes ──────────────────────────────────────────── */}
        <div className="mt-6 px-5 md:mt-10">
          <Link href="/para-clubes" className="group flex items-center gap-4 rounded-[28px] bg-gray-900 p-5 md:p-7">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white md:text-lg">¿Tienes una cancha?</p>
              <p className="mt-1 text-xs text-gray-400 md:text-sm">Recibe reservas pagadas en línea, sin mensualidad.</p>
            </div>
            <span className="shrink-0 rounded-full bg-lime-400 px-4 py-2.5 text-sm font-bold text-gray-900 transition-transform group-hover:scale-105">
              Publicar
            </span>
          </Link>
        </div>

        {/* ── Preguntas frecuentes ─────────────────────────────────── */}
        <section className="mt-12 px-5 md:mt-16">
          <h2 className="text-lg font-bold text-gray-900 md:text-2xl">Preguntas frecuentes</h2>
          <FaqAccordion
            items={FAQ}
            className="mt-3 grid gap-3 md:grid-cols-2 md:items-start"
            itemClassName="w-full text-left bg-white rounded-3xl p-5 border border-transparent hover:border-green-200"
            openItemClassName="border-green-300"
            questionClassName="font-semibold text-gray-900"
          />
        </section>
      </div>
    </div>
  );
}

function Titulo({ texto, href, className = '' }: { texto: string; href?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between px-5 ${className}`}>
      <h2 className="text-lg font-bold text-gray-900 md:text-2xl">{texto}</h2>
      {href && (
        <Link href={href} className="py-1 text-sm font-medium text-gray-500 transition-colors hover:text-green-700">
          Ver todas
        </Link>
      )}
    </div>
  );
}

/** Fila con scroll horizontal; en escritorio suma flechas. */
function Carrusel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mover = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });
  return (
    <div className="relative mt-3">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
        <div className="w-1 shrink-0" />
      </div>
      {([-1, 1] as const).map((d) => (
        <button
          key={d}
          type="button"
          aria-label={d < 0 ? 'Anteriores' : 'Siguientes'}
          onClick={() => mover(d)}
          className={`absolute top-[188px] hidden h-11 w-11 place-items-center rounded-full bg-white text-gray-800 shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition-colors hover:bg-green-600 hover:text-white md:grid ${
            d < 0 ? 'left-1' : 'right-1'
          }`}
        >
          {d < 0 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      ))}
    </div>
  );
}
