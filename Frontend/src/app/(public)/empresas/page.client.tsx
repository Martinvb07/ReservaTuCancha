'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCourts } from '@/hooks/useCourts';
import CourtCard from '@/components/courts/CourtCard';
import HeroSearch from '@/components/home/HeroSearch';
import { AMENITIES } from '@/lib/constants';
import { AMEN_ICONS } from '@/lib/amenityIcons';
import { SlidersHorizontal, X, CalendarDays, Search } from 'lucide-react';
import type { Court } from '@/types';

const PAGE_SIZE = 9;

// "HH:mm" → "7:00 AM" (no militar)
function to12h(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${period}`;
}

export default function EmpresasPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filtros principales viven en la URL → el buscador del hero los actualiza.
  const sport = searchParams.get('sport') || '';
  const city = searchParams.get('city') || '';
  const dateParam = searchParams.get('date') || '';
  const startParam = searchParams.get('start') || '';

  const carryQuery = useMemo(() => {
    const p = new URLSearchParams();
    if (dateParam) p.set('date', dateParam);
    if (startParam) p.set('start', startParam);
    return p.toString();
  }, [dateParam, startParam]);

  // Amenidades y paginación son refinamientos locales (no van a la URL).
  const [amenities, setAmenities] = useState<string[]>([]);
  const [clientPage, setClientPage] = useState(1);

  // Una búsqueda nueva (cambia la URL) vuelve a la página 1.
  useEffect(() => { setClientPage(1); }, [sport, city, dateParam, startParam]);

  const { data, isLoading, isError } = useCourts({ sport, city, minPrice: '', maxPrice: '', page: 1, limit: 48 });

  const sorted = useMemo<Court[]>(() => {
    const list = [...(data?.data ?? [])];
    list.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    return list;
  }, [data]);

  const filtered = useMemo<Court[]>(() => {
    if (amenities.length === 0) return sorted;
    return sorted.filter((c) => amenities.every((a) => (c.amenities ?? []).includes(a)));
  }, [sorted, amenities]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(clientPage, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
    setClientPage(1);
  };
  const clearAll = () => {
    setAmenities([]);
    router.push('/empresas');
  };

  const niceDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? format(parse(dateParam, 'yyyy-MM-dd', new Date()), "EEEE d 'de' MMMM", { locale: es })
      : '';

  return (
    <main className="min-h-screen bg-white">
      {/* ── HERO + BUSCADOR ───────────────────────────────────── */}
      <section className="relative bg-gray-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1600&q=80"
          alt="canchas"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-14">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Encuentra tu cancha</h1>
          <p className="text-gray-300 mt-2 text-sm md:text-base">
            {isLoading ? 'Buscando…' : `${data?.total ?? 0} canchas disponibles en Colombia`}
          </p>

          <div className="mt-6 max-w-3xl">
            <HeroSearch initialSport={sport} initialCity={city} initialDate={dateParam} initialTime={startParam} />
          </div>
        </div>
      </section>

      {/* ── BARRA HORIZONTAL DE AMENIDADES (sticky) ───────────── */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 shrink-0 pr-1">
              <SlidersHorizontal className="h-4 w-4" /> Amenidades
            </span>
            {AMENITIES.map((a) => {
              const Icon = AMEN_ICONS[a] ?? SlidersHorizontal;
              const active = amenities.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all ${
                    active
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {a}
                </button>
              );
            })}
            {amenities.length > 0 && (
              <button
                onClick={() => { setAmenities([]); setClientPage(1); }}
                className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gray-700 pl-1"
              >
                <X className="h-3.5 w-3.5" /> Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-2 pb-10 md:pt-2.5 md:pb-12">
        {/* Banner de fecha/hora elegida */}
        {(niceDate || startParam) && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-2.5 mb-3 text-sm">
            <CalendarDays className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-green-800">
              {niceDate || dateParam
                ? <>Buscando para <strong className="capitalize">{niceDate || dateParam}</strong></>
                : <>Buscando canchas</>}
              {startParam && <> a las <strong>{to12h(startParam)}</strong></>}. El horario se preselecciona al abrir la reserva.
            </p>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-5">
          <span className="font-semibold text-gray-900">{filtered.length}</span> canchas
          {city ? ` en ${city}` : ''}
          {amenities.length > 0 ? ` · ${amenities.length} amenidad${amenities.length > 1 ? 'es' : ''}` : ''}
        </p>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-2xl" />
                <div className="pt-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">Error cargando canchas. Intenta de nuevo.</p>
          </div>
        )}

        {/* Vacío */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-900">Sin canchas para estos filtros</p>
            <p className="text-gray-500 text-sm mt-1">Prueba quitando alguna amenidad o cambiando de deporte o ciudad.</p>
            <button
              onClick={clearAll}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
            >
              <X className="h-4 w-4" /> Limpiar filtros
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !isError && visible.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-8">
              {visible.map((court, i) => (
                <div key={court._id} className="rtc-fade" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                  <CourtCard court={court} query={carryQuery} />
                </div>
              ))}
            </div>

            {pageCount > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setClientPage(safePage - 1)}
                  className="text-sm font-medium border border-gray-200 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setClientPage(p)}
                      className={`w-9 h-9 text-sm font-semibold rounded-xl transition-all ${
                        p === safePage
                          ? 'bg-gray-900 text-white'
                          : 'border border-gray-200 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  disabled={safePage >= pageCount}
                  onClick={() => setClientPage(safePage + 1)}
                  className="text-sm font-medium border border-gray-200 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
