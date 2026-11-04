'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import FaqAccordion from '@/components/ui/FaqAccordion';
import HeroSearch from '@/components/home/HeroSearch';
import MobileSearchTrigger from '@/components/home/MobileSearchTrigger';
import { TarjetaCuadrada } from '@/components/courts/TarjetasCancha';
import { SEARCH_ANCHOR_ID } from '@/hooks/useSearchDock';
import { useFavoritas } from '@/hooks/useFavoritas';
import { courtsApi } from '@/lib/api/courts.api';
import type { Court } from '@/types';

/*
 * Inicio estilo Airbnb: arriba una franja con las pestañas de deporte
 * (ícono grande, subrayado en la activa) y el buscador en píldora; abajo
 * filas de tarjetas cuadradas que se deslizan de lado: para hoy, por ciudad,
 * las mejor calificadas y las favoritas del visitante.
 */

const FAQ = [
  { q: '¿Necesito crear una cuenta para reservar?', a: 'No. Solo ingresas tu nombre, email y teléfono al momento de reservar. Sin contraseñas, sin registro.' },
  { q: '¿Cómo cancelo mi reserva?', a: 'Recibes un link en tu email para soltar tu horario hasta 24 horas antes del turno. El pago ya quedó procesado, así que no hacemos devoluciones: si lo que necesitas es jugar otro día, escríbenos a soporte y te movemos la reserva.' },
  { q: '¿Cuáles son los métodos de pago?', a: 'Aceptamos tarjetas de crédito/débito, Nequi, Daviplata y PSE a través de ePayco, una de las pasarelas más usadas de Colombia. Al precio de la cancha se le suma una tarifa de servicio de $2.000 por reserva, que ves antes de pagar.' },
  { q: '¿Cómo recibo la confirmación?', a: 'Al instante por email. Incluye los datos de la cancha, horario y el link para cancelar si lo necesitas.' },
];

/** Pestañas de arriba. El ícono es un emoji: se ve ilustrado en cada sistema. */
const PESTANAS = [
  { key: '', label: 'Todo', icono: '🏟️' },
  { key: 'futbol', label: 'Fútbol', icono: '⚽' },
  { key: 'padel', label: 'Pádel', icono: '🎾' },
  { key: 'voley_playa', label: 'Vóley playa', icono: '🏐' },
  { key: 'cerca', label: 'Cerca de mí', icono: '📍' },
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
const textoKm = (d: number) => (d < 1 ? `A ${Math.round(d * 1000)} m de ti` : `A ${d < 10 ? d.toFixed(1) : Math.round(d)} km de ti`);

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

  const { ids: favoritas, esFavorita, alternar } = useFavoritas();
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

  /* Lo que se ve según la pestaña: un deporte filtra todas las filas; "Cerca
     de mí" ordena por distancia. */
  const visibles = useMemo(() => {
    if (pestana === 'cerca' && posicion) {
      return [...canchas].sort((a, b) => (km(posicion, a) ?? Infinity) - (km(posicion, b) ?? Infinity));
    }
    return pestana ? canchas.filter((c) => c.sport === pestana) : canchas;
  }, [canchas, pestana, posicion]);

  const porCiudad = useMemo(() => {
    const grupos = new Map<string, Court[]>();
    for (const c of visibles) {
      const ciudad = c.location?.city;
      if (!ciudad) continue;
      grupos.set(ciudad, [...(grupos.get(ciudad) ?? []), c]);
    }
    return Array.from(grupos.entries()).filter(([, l]) => l.length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 3);
  }, [visibles]);

  const mejores = useMemo(
    () => [...visibles].filter((c) => c.totalReviews > 0).sort((a, b) => b.averageRating - a.averageRating).slice(0, 10),
    [visibles],
  );
  const guardadas = useMemo(() => canchas.filter((c) => favoritas.includes(c._id)), [canchas, favoritas]);

  const tarjeta = (c: Court, detalle?: string) => (
    <TarjetaCuadrada key={c._id} court={c} detalle={detalle} favorita={esFavorita(c._id)} onFavorita={() => alternar(c._id)} />
  );
  const etiquetaDeporte = pestana && pestana !== 'cerca'
    ? PESTANAS.find((p) => p.key === pestana)?.label.toLowerCase()
    : undefined;
  const consulta = pestana && pestana !== 'cerca' ? `?sport=${pestana}` : '';

  return (
    <div className="bg-white">
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
                  <span className={`text-[26px] leading-none transition-transform duration-200 md:text-[30px] ${activa ? 'scale-110' : 'grayscale-[35%] group-hover:scale-110 group-hover:grayscale-0'}`} aria-hidden>
                    {p.key === 'cerca' && ubicando ? <Loader2 className="h-7 w-7 animate-spin text-gray-500" /> : p.icono}
                  </span>
                  <span className="whitespace-nowrap">{p.label}</span>
                  <span className={`absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-gray-900 transition-opacity ${activa ? 'opacity-100' : 'opacity-0 group-hover:opacity-20'}`} />
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      {/* ── Filas ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl space-y-10 pb-16 pt-8 md:space-y-12 md:pt-10">
        {guardadas.length > 0 && !pestana && (
          <Fila titulo="Tus favoritas">{guardadas.map((c) => tarjeta(c))}</Fila>
        )}

        {cargando && visibles.length === 0 ? (
          <FilaEsqueleto />
        ) : visibles.length === 0 ? (
          <div className="mx-5 flex flex-col items-center rounded-3xl border border-gray-200 px-6 py-12 text-center">
            <SearchX className="h-9 w-9 text-gray-300" />
            <p className="mt-3 font-semibold text-gray-900">Aún no hay canchas de {etiquetaDeporte ?? 'este tipo'}</p>
            <p className="mt-1 text-sm text-gray-500">Prueba con otro deporte o mira todas las canchas.</p>
          </div>
        ) : (
          <Fila
            titulo={pestana === 'cerca' ? 'Canchas cerca de ti' : `Canchas${etiquetaDeporte ? ` de ${etiquetaDeporte}` : ''} para jugar hoy`}
            href={`/empresas${consulta}`}
          >
            {visibles.slice(0, 12).map((c) => {
              const d = pestana === 'cerca' && posicion ? km(posicion, c) : null;
              return tarjeta(c, d != null ? textoKm(d) : undefined);
            })}
          </Fila>
        )}

        {pestana !== 'cerca' &&
          porCiudad.map(([ciudad, lista]) => (
            <Fila
              key={ciudad}
              titulo={`Canchas${etiquetaDeporte ? ` de ${etiquetaDeporte}` : ''} en ${ciudad}`}
              href={`/empresas?city=${encodeURIComponent(ciudad)}${pestana ? `&sport=${pestana}` : ''}`}
            >
              {lista.map((c) => tarjeta(c))}
            </Fila>
          ))}

        {mejores.length > 0 && pestana !== 'cerca' && (
          <Fila titulo="Las mejor calificadas" href={`/empresas${consulta}`}>
            {mejores.map((c) => tarjeta(c))}
          </Fila>
        )}

        {/* ── Para clubes ──────────────────────────────────────────── */}
        <div className="px-5">
          <Link href="/para-clubes" className="group flex items-center gap-4 rounded-3xl bg-gray-900 p-5 md:p-7">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white md:text-lg">¿Tienes una cancha?</p>
              <p className="mt-1 text-xs text-gray-400 md:text-sm">Recibe reservas pagadas en línea, sin mensualidad.</p>
            </div>
            <span className="shrink-0 rounded-full bg-lime-400 px-4 py-2.5 text-sm font-bold text-gray-900 transition-transform group-hover:scale-105">
              Publica tu cancha
            </span>
          </Link>
        </div>

        {/* ── Preguntas frecuentes ─────────────────────────────────── */}
        <section className="px-5">
          <h2 className="text-xl font-semibold text-gray-900 md:text-[22px]">Preguntas frecuentes</h2>
          <FaqAccordion
            items={FAQ}
            className="mt-4 grid gap-3 md:grid-cols-2 md:items-start"
            itemClassName="w-full text-left bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-400"
            openItemClassName="border-gray-900"
            questionClassName="font-semibold text-gray-900"
          />
        </section>
      </div>
    </div>
  );
}

/** Fila con título (con flecha si lleva a más) y tarjetas que se deslizan de lado. */
function Fila({ titulo, href, children }: { titulo: string; href?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [bordes, setBordes] = useState({ inicio: true, fin: false });
  const leer = () => {
    const el = ref.current;
    if (!el) return;
    setBordes({ inicio: el.scrollLeft < 8, fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(leer, [children]);
  const mover = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3 px-5">
        {href ? (
          <Link href={href} className="group inline-flex min-w-0 items-center gap-2">
            <h2 className="truncate text-xl font-semibold text-gray-900 md:text-[22px]">{titulo}</h2>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-900 transition-colors group-hover:bg-gray-900 group-hover:text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ) : (
          <h2 className="truncate text-xl font-semibold text-gray-900 md:text-[22px]">{titulo}</h2>
        )}
        <div className="hidden shrink-0 gap-2 md:flex">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-label={d < 0 ? 'Anteriores' : 'Siguientes'}
              disabled={d < 0 ? bordes.inicio : bordes.fin}
              onClick={() => mover(d)}
              className="grid h-8 w-8 place-items-center rounded-full border border-gray-300 bg-white text-gray-900 transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:shadow-none"
            >
              {d < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={ref}
        onScroll={leer}
        className="mt-4 grid auto-cols-[46%] grid-flow-col gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 snap-x snap-mandatory [scrollbar-width:none] sm:auto-cols-[30%] md:auto-cols-[23%] lg:auto-cols-[calc((100%-5rem)/6)] [&::-webkit-scrollbar]:hidden [&>*]:snap-start"
      >
        {children}
      </div>
    </section>
  );
}

function FilaEsqueleto() {
  return (
    <div className="px-5">
      <div className="h-6 w-56 animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={i > 1 ? 'hidden sm:block' : ''}>
            <div className="aspect-square animate-pulse rounded-[20px] bg-gray-100" />
            <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
            <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
