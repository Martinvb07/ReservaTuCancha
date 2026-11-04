'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import FaqAccordion from '@/components/ui/FaqAccordion';
import HeroSearch from '@/components/home/HeroSearch';
import MobileSearchTrigger from '@/components/home/MobileSearchTrigger';
import ExploraCiudades from '@/components/home/ExploraCiudades';
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

  const deporteBuscador = pestana && pestana !== 'cerca' ? pestana : '';

  /* Posición del subrayado de la pestaña activa. */
  const navRef = useRef<HTMLElement>(null);
  const [raya, setRaya] = useState<{ left: number; width: number } | null>(null);
  useEffect(() => {
    const medir = () => {
      const el = navRef.current?.querySelector<HTMLElement>(`[data-pestana="${pestana || 'todo'}"]`);
      if (el) setRaya({ left: el.offsetLeft, width: el.offsetWidth });
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [pestana]);

  return (
    <div>
      {/* ── Franja de arriba: pestañas + buscador ─────────────────── */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-white to-[#f7f7f7]">
        {/* En celular va primero el buscador y debajo las pestañas; en
            escritorio, al revés (como Airbnb). El ancla envuelve los dos
            buscadores: la lee el navbar para acoplar la píldora al bajar. */}
        <div className="mx-auto flex max-w-6xl flex-col px-5 pb-6 pt-4 md:pb-8 md:pt-6">
          <div id={SEARCH_ANCHOR_ID} className="order-1 lg:order-2">
            <MobileSearchTrigger pildora initialSport={deporteBuscador} />
            <div className="mx-auto mt-5 hidden max-w-[880px] lg:block">
              {/* La pestaña y el campo Deporte van sincronizados en los dos sentidos. */}
              <HeroSearch initialSport={deporteBuscador} onSportChange={(v) => setPestana(v)} />
            </div>
          </div>

          <nav ref={navRef} aria-label="Deportes" className="relative order-2 mt-4 lg:order-1 flex justify-start gap-6 overflow-x-auto [scrollbar-width:none] sm:justify-center sm:gap-10 md:mt-0 [&::-webkit-scrollbar]:hidden">
            {PESTANAS.map((p) => {
              const activa = pestana === p.key || (p.key === 'cerca' && pestana === 'cerca');
              return (
                <button
                  key={p.key || 'todo'}
                  data-pestana={p.key || 'todo'}
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
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-gray-900 opacity-0 transition-opacity group-hover:opacity-20" />
                </button>
              );
            })}
            {/* Un solo subrayado que se desliza a la pestaña activa. */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 h-[3px] rounded-full bg-gray-900"
              style={{
                left: raya?.left ?? 0,
                width: raya?.width ?? 0,
                opacity: raya ? 1 : 0,
                transition: 'left .35s cubic-bezier(.2,.8,.2,1), width .35s cubic-bezier(.2,.8,.2,1), opacity .2s',
              }}
            />
          </nav>
        </div>
      </section>

      {/* ── Debajo: el diseño de la app (carrusel y lista) ────────── */}
      <div className="w-full pb-16">
        {/* El carrusel corre de borde a borde de la ventana: en pantallas
            anchas la primera tarjeta se alinea con el contenido y las demás
            se pierden en el borde de la ventana, no a mitad de página. */}
        <Carrusel titulo="Canchas para hoy" href={`/empresas${consulta}`}>
          {cargando && visibles.length === 0
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[400px] w-[82%] shrink-0 animate-pulse rounded-[32px] bg-fondo-suave sm:w-[340px] md:w-[calc((100%-2rem)/3)] lg:h-[380px] lg:w-[calc((100%-3rem)/4)]" />
              ))
            : visibles.map((c) => {
                const d = pestana === 'cerca' && posicion ? km(posicion, c) : null;
                return (
                  <div key={c._id} className="w-[82%] shrink-0 snap-start sm:w-[340px] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
                    <TarjetaGrande court={c} distancia={d != null ? textoKm(d) : undefined} />
                  </div>
                );
              })}
        </Carrusel>
        {!cargando && visibles.length === 0 && (
          <div className="mx-auto max-w-6xl px-5">
            <div className="mt-3 flex flex-col items-center rounded-[28px] bg-white px-6 py-10 text-center">
              <SearchX className="h-9 w-9 text-gray-300" />
              <p className="mt-3 font-bold text-gray-900">Aún no hay canchas de este deporte</p>
              <p className="mt-1 text-sm text-gray-500">Prueba con otro o mira todas las canchas.</p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl">
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

        <ExploraCiudades />

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

/** Título con "Ver todas" y flechas, y la fila de tarjetas que se desliza. */
function Carrusel({ titulo, href, children }: { titulo: string; href?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [bordes, setBordes] = useState({ inicio: true, fin: false });
  const leer = () => {
    const el = ref.current;
    if (!el) return;
    setBordes({ inicio: el.scrollLeft < 8, fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(() => {
    leer();
    window.addEventListener('resize', leer);
    return () => window.removeEventListener('resize', leer);
  }, [children]);
  const mover = (dir: 1 | -1) => {
    const el = ref.current;
    /* En tablet/PC pasa una página entera (las tarjetas caben exactas). */
    if (el) el.scrollBy({ left: dir * (el.clientWidth + 16), behavior: 'smooth' });
  };

  return (
    <section className="mt-7 md:mt-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5">
        <h2 className="text-lg font-bold text-gray-900 md:text-2xl">{titulo}</h2>
        <div className="flex shrink-0 items-center gap-3">
          {href && (
            <Link href={href} className="py-1 text-sm font-medium text-gray-500 transition-colors hover:text-green-700">
              Ver todas
            </Link>
          )}
          <div className="hidden gap-2 md:flex">
            {([-1, 1] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-label={d < 0 ? 'Anteriores' : 'Siguientes'}
                disabled={d < 0 ? bordes.inicio : bordes.fin}
                onClick={() => mover(d)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-gray-800 transition-colors hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-800"
              >
                {d < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Dentro del mismo ancho que el resto: en tablet caben 3 tarjetas y en
          PC 4, enteras; las flechas pasan de a una página. El pb grande con
          -mb deja respirar la sombra, que el scroll horizontal recortaría. */}
      <div className="mx-auto max-w-6xl md:px-5">
        <div
          ref={ref}
          onScroll={leer}
          className="-mb-10 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-12 pt-1 scroll-px-5 [scrollbar-width:none] md:px-0 md:scroll-px-0 [&::-webkit-scrollbar]:hidden"
        >
          {children}
          <div className="w-1 shrink-0 md:hidden" />
        </div>
      </div>
    </section>
  );
}

