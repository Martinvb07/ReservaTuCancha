'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCourts } from '@/hooks/useCourts';
import CourtCard from '@/components/courts/CourtCard';
import HeroSearch from '@/components/home/HeroSearch';
import MobileSearchTrigger from '@/components/home/MobileSearchTrigger';
import { AMENITIES, getSport } from '@/lib/constants';
import { AMEN_ICONS } from '@/lib/amenityIcons';
import { SlidersHorizontal, X, CalendarDays, Search, ChevronDown, Check, Sparkles, Banknote, ArrowUpDown } from 'lucide-react';
import type { Court } from '@/types';

const PAGE_SIZE = 9;

// Filtros desplegables (estilo píldora + dropdown anclado)
type FilterOpen = 'amenidades' | 'precio' | 'sort' | null;

const SORT_LABELS: Record<string, string> = {
  destacados: 'Destacados',
  'precio-asc': 'Menor precio',
  'precio-desc': 'Mayor precio',
};
const SORT_ORDER = ['destacados', 'precio-asc', 'precio-desc'] as const;

/* Rango de precio por hora (COP). El tope del slider equivale a "sin tope". */
const PRICE_MIN = 0;
const PRICE_MAX = 300000;
const PRICE_STEP = 10000;

const PRICE_PICKS: Array<[number, number, string]> = [
  [PRICE_MIN, PRICE_MAX, 'Cualquier precio'],
  [PRICE_MIN, 60000, 'Hasta $60.000'],
  [60000, 120000, '$60K – $120K'],
  [120000, PRICE_MAX, 'Más de $120.000'],
];

function fmtCOP(n: number) {
  return `$${n.toLocaleString('es-CO')}`;
}

/* ─── Slider de rango de precio (dos thumbs superpuestos) ─── */
function PriceSlider({ lo, hi, onLo, onHi }: { lo: number; hi: number; onLo: (v: number) => void; onHi: (v: number) => void }) {
  const pct = (v: number) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  return (
    <div className="relative h-6 flex items-center mx-1">
      <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />
      <div className="absolute h-1.5 bg-green-600 rounded-full"
        style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }} />
      <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={lo}
        onChange={(e) => onLo(Math.min(+e.target.value, hi - PRICE_STEP))}
        className="price-thumb" style={{ zIndex: lo > PRICE_MAX * 0.7 ? 5 : 3 }} aria-label="Precio mínimo" />
      <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={hi}
        onChange={(e) => onHi(Math.max(+e.target.value, lo + PRICE_STEP))}
        className="price-thumb" style={{ zIndex: 4 }} aria-label="Precio máximo" />
    </div>
  );
}

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

  // Amenidades, precio, orden y paginación son refinamientos locales (no van a la URL).
  const [amenities, setAmenities] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [sort, setSort] = useState<(typeof SORT_ORDER)[number]>('destacados');
  const [clientPage, setClientPage] = useState(1);

  // Sheet de filtros en móvil (acordeón: una sección abierta a la vez)
  const [filterSheet, setFilterSheet] = useState(false);
  const [fSection, setFSection] = useState<'amenidades' | 'precio' | 'sort' | null>('amenidades');
  useEffect(() => {
    if (!filterSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [filterSheet]);

  // Dropdown de filtro abierto (uno a la vez) + cierre al hacer clic fuera.
  const [openFilter, setOpenFilter] = useState<FilterOpen>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setOpenFilter(null);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  // En desktop el buscador vive colapsado en una píldora resumen; solo se
  // expande a la barra completa cuando el usuario quiere editar la búsqueda.
  const [searchOpen, setSearchOpen] = useState(false);

  // Una búsqueda nueva (cambia la URL) o un filtro nuevo vuelve a la página 1.
  useEffect(() => { setClientPage(1); }, [sport, city, dateParam, startParam, minPrice, maxPrice, sort]);

  const { data, isLoading, isError } = useCourts({ sport, city, minPrice: '', maxPrice: '', page: 1, limit: 48 });

  const sorted = useMemo<Court[]>(() => {
    const list = [...(data?.data ?? [])];
    if (sort === 'precio-asc') list.sort((a, b) => (a.pricePerHour ?? 0) - (b.pricePerHour ?? 0));
    else if (sort === 'precio-desc') list.sort((a, b) => (b.pricePerHour ?? 0) - (a.pricePerHour ?? 0));
    else list.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    return list;
  }, [data, sort]);

  const priceActive = minPrice > PRICE_MIN || maxPrice < PRICE_MAX;

  const filtered = useMemo<Court[]>(() => {
    let list = sorted;
    if (amenities.length > 0) list = list.filter((c) => amenities.every((a) => (c.amenities ?? []).includes(a)));
    if (priceActive) {
      // El tope del slider significa "sin tope": no descarta canchas más caras.
      list = list.filter((c) => {
        const p = c.pricePerHour ?? 0;
        return p >= minPrice && (maxPrice >= PRICE_MAX || p <= maxPrice);
      });
    }
    return list;
  }, [sorted, amenities, priceActive, minPrice, maxPrice]);

  // Nº de filtros activos (para el chip de limpiar de la barra)
  const activeFilters = amenities.length + (priceActive ? 1 : 0) + (sort !== 'destacados' ? 1 : 0);
  const clearFilters = () => {
    setAmenities([]); setMinPrice(PRICE_MIN); setMaxPrice(PRICE_MAX); setSort('destacados'); setClientPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(clientPage, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
    setClientPage(1);
  };
  const clearAll = () => {
    clearFilters();
    router.push('/empresas');
  };

  const niceDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? format(parse(dateParam, 'yyyy-MM-dd', new Date()), "EEEE d 'de' MMMM", { locale: es })
      : '';

  // Píldora de filtro: verde sólido cuando tiene algo activo (estética Rently → RTC)
  const filterBtn = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold border whitespace-nowrap transition-all ${
      active
        ? 'bg-green-600 border-green-600 text-white'
        : 'border-gray-200 text-gray-600 hover:border-green-400 hover:bg-green-50'
    }`;
  const dropCls = 'rtc-drop absolute top-[calc(100%+8px)] left-0 z-50 bg-white rounded-2xl overflow-hidden';
  const dropStyle = { border: '1.5px solid #e5e7eb', boxShadow: '0 20px 48px rgba(0,0,0,.14)' };

  // ── Contenidos compartidos entre los dropdowns de desktop y el sheet móvil ──
  const precioInner = (
    <>
      <div className="flex justify-between mb-1">
        <div className="text-center">
          <p className="text-[11px] text-gray-500 font-medium mb-1">Mínimo</p>
          <p className="text-lg font-extrabold text-green-700">{fmtCOP(minPrice)}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-gray-500 font-medium mb-1">Máximo</p>
          <p className="text-lg font-extrabold text-green-700">{maxPrice >= PRICE_MAX ? 'Sin tope' : fmtCOP(maxPrice)}</p>
        </div>
      </div>
      <div className="py-3">
        <PriceSlider lo={minPrice} hi={maxPrice} onLo={setMinPrice} onHi={setMaxPrice} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {PRICE_PICKS.map(([mn, mx, lbl]) => {
          const act = mn === minPrice && mx === maxPrice;
          return (
            <button key={lbl} type="button"
              onClick={() => { setMinPrice(mn); setMaxPrice(mx); }}
              className={`py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-all text-center ${
                act ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}>
              {lbl}
            </button>
          );
        })}
      </div>
    </>
  );

  const amenTiles = (cols: string) => (
    <div className={`grid ${cols} gap-2`}>
      {AMENITIES.map((a, i) => {
        const Icon = AMEN_ICONS[a] ?? SlidersHorizontal;
        const active = amenities.includes(a);
        return (
          <button key={a} type="button" onClick={() => toggleAmenity(a)}
            className={`rtc-item flex flex-col items-center gap-2 p-3 rounded-2xl transition-all text-center ${
              active ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
            style={{ animationDelay: `${i * 25}ms` }}>
            <span className={`w-10 h-10 rounded-xl grid place-items-center ${active ? 'bg-white/20' : 'bg-white'}`}>
              <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-green-600'}`} />
            </span>
            <span className="text-[11px] font-semibold leading-tight">{a}</span>
          </button>
        );
      })}
    </div>
  );

  const sortRows = (afterPick?: () => void) => SORT_ORDER.map((s, i) => (
    <button key={s} type="button" onClick={() => { setSort(s); afterPick?.(); }}
      className={`rtc-item flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
        sort === s ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
      }`}
      style={{ animationDelay: `${i * 30}ms` }}>
      {SORT_LABELS[s]}
      {sort === s && <Check className="h-3.5 w-3.5 text-green-600 check-in" />}
    </button>
  ));

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

          {/* Desktop: píldora resumen → clic para expandir la barra completa */}
          <div className="mt-6 hidden md:block">
            {searchOpen ? (
              <div className="max-w-5xl flex items-start gap-3">
                <div className="flex-1">
                  <HeroSearch initialSport={sport} initialCity={city} initialDate={dateParam} initialTime={startParam}
                    onSearch={() => setSearchOpen(false)} />
                </div>
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Cerrar buscador"
                  className="mt-3 w-10 h-10 rounded-full border border-white/25 text-white grid place-items-center hover:bg-white/15 transition-colors flex-none">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setSearchOpen(true)}
                className="inline-flex items-center gap-2.5 bg-white rounded-full pl-5 pr-2 py-2 text-sm text-left hover:shadow-xl transition-shadow"
                style={{ boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>
                <span className={sport ? 'font-semibold text-gray-900' : 'text-gray-500'}>{sport ? getSport(sport).label : 'Deporte'}</span>
                <span className="text-gray-300">·</span>
                <span className={city ? 'font-semibold text-gray-900' : 'text-gray-500'}>{city || 'Ciudad'}</span>
                <span className="text-gray-300">·</span>
                <span className={`capitalize ${dateParam ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                  {dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
                    ? format(parse(dateParam, 'yyyy-MM-dd', new Date()), "EEE d 'de' MMM", { locale: es })
                    : 'Fecha'}
                </span>
                <span className="text-gray-300">·</span>
                <span className={startParam ? 'font-semibold text-gray-900' : 'text-gray-500'}>{startParam ? to12h(startParam) : 'Hora'}</span>
                <span className="ml-1.5 w-9 h-9 rounded-full bg-green-600 text-white grid place-items-center flex-none">
                  <Search className="h-4 w-4" />
                </span>
              </button>
            )}
          </div>
          <div className="mt-6">
            <MobileSearchTrigger initialSport={sport} initialCity={city} initialDate={dateParam} initialTime={startParam} />
          </div>
        </div>
      </section>

      {/* ── BARRA DE FILTROS (sticky, desplegables estilo Rently) ───────────── */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">

          {/* DESKTOP: píldoras con dropdown anclado */}
          <div ref={filterRef} className="hidden md:flex items-center gap-2 py-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">

              {/* Amenidades — cuadrícula de tiles */}
              <div className="relative">
                <button type="button" className={filterBtn(amenities.length > 0)}
                  onClick={() => setOpenFilter(openFilter === 'amenidades' ? null : 'amenidades')}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {amenities.length > 0 ? `Amenidades (${amenities.length})` : 'Amenidades'}
                  <ChevronDown className={`h-3 w-3 transition-transform ${openFilter === 'amenidades' ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === 'amenidades' && (
                  <div className={`${dropCls} w-[480px]`} style={dropStyle}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[13px] font-extrabold text-gray-800">Amenidades</p>
                        {amenities.length > 0 && (
                          <button type="button" onClick={() => { setAmenities([]); setClientPage(1); }}
                            className="text-xs font-bold text-green-700 hover:underline">
                            Limpiar ({amenities.length})
                          </button>
                        )}
                      </div>
                      {amenTiles('grid-cols-4')}
                    </div>
                  </div>
                )}
              </div>

              {/* Precio por hora — quick picks */}
              <div className="relative">
                <button type="button" className={filterBtn(priceActive)}
                  onClick={() => setOpenFilter(openFilter === 'precio' ? null : 'precio')}>
                  <Banknote className="h-3.5 w-3.5" />
                  {priceActive
                    ? `${fmtCOP(minPrice)} – ${maxPrice >= PRICE_MAX ? 'sin tope' : fmtCOP(maxPrice)}`
                    : 'Precio'}
                  <ChevronDown className={`h-3 w-3 transition-transform ${openFilter === 'precio' ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === 'precio' && (
                  <div className={`${dropCls} w-[360px]`} style={dropStyle}>
                    <div className="p-5">
                      <p className="text-[15px] font-extrabold text-gray-900 mb-1">Precio por hora</p>
                      <p className="text-[13px] text-gray-500 mb-4">Rango en pesos colombianos</p>
                      {precioInner}
                      <button type="button" onClick={() => setOpenFilter(null)}
                        className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-white bg-green-600 hover:bg-green-700 active:scale-[.98] transition-all"
                        style={{ boxShadow: '0 4px 14px rgba(22,163,74,.3)' }}>
                        Aplicar filtro
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DERECHA — limpiar, contador y orden */}
            <div className="flex items-center gap-2 flex-none border-l border-gray-100 pl-3 ml-1">
              {activeFilters > 0 && (
                <button type="button" onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11.5px] font-bold bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 transition-all whitespace-nowrap flex-none">
                  {activeFilters} <X className="h-3 w-3" />
                </button>
              )}
              <span className="text-gray-500 text-[13px] whitespace-nowrap">
                <span className="font-semibold text-gray-900">{filtered.length}</span> {filtered.length === 1 ? 'cancha' : 'canchas'}
              </span>

              <div className="relative">
                <button type="button" className={filterBtn(sort !== 'destacados')}
                  onClick={() => setOpenFilter(openFilter === 'sort' ? null : 'sort')}>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  {SORT_LABELS[sort]}
                  <ChevronDown className={`h-3 w-3 transition-transform ${openFilter === 'sort' ? 'rotate-180' : ''}`} />
                </button>
                {openFilter === 'sort' && (
                  <div className={`${dropCls} left-auto right-0 w-[220px]`} style={dropStyle}>
                    <div className="p-2">
                      <p className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide px-3 pt-1 pb-2">Ordenar por</p>
                      {sortRows(() => setOpenFilter(null))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MÓVIL: botón Filtros (abre sheet) + contador */}
          <div className="md:hidden flex items-center justify-between gap-3 py-3">
            <button
              type="button"
              onClick={() => setFilterSheet(true)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-all ${
                activeFilters > 0
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-green-400'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros {activeFilters > 0 && `(${activeFilters})`}
            </button>
            <span className="text-gray-500 text-[13px] whitespace-nowrap">
              <span className="font-semibold text-gray-900">{filtered.length}</span> {filtered.length === 1 ? 'cancha' : 'canchas'}
            </span>
          </div>
        </div>
      </div>

      {/* ── SHEET DE FILTROS MÓVIL (acordeón + barra Limpiar/Ver) ── */}
      {filterSheet && (
        <div className="fixed inset-0 z-[100] md:hidden mobile-sheet-in">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setFilterSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl rtc-sheet-up flex flex-col" style={{ maxHeight: '85vh' }}>
            {/* Cabecera */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 flex-none">
              <h3 className="text-lg font-extrabold text-gray-900">Filtros</h3>
              <button type="button" onClick={() => setFilterSheet(false)} aria-label="Cerrar filtros"
                className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Secciones (acordeón, una a la vez) */}
            <div className="overflow-y-auto no-scrollbar px-5 py-2 flex-1">
              {([
                { key: 'amenidades' as const, label: 'Amenidades', value: amenities.length > 0 ? `${amenities.length} elegida${amenities.length > 1 ? 's' : ''}` : 'Todas' },
                { key: 'precio' as const, label: 'Precio por hora', value: priceActive ? `${fmtCOP(minPrice)} – ${maxPrice >= PRICE_MAX ? 'sin tope' : fmtCOP(maxPrice)}` : 'Cualquiera' },
                { key: 'sort' as const, label: 'Ordenar por', value: SORT_LABELS[sort] },
              ]).map(({ key, label, value }) => (
                <div key={key} className="border-b border-gray-100 last:border-0">
                  <button type="button" onClick={() => setFSection(fSection === key ? null : key)}
                    className="w-full flex items-center justify-between gap-3 py-4 text-left">
                    <span className="text-[15px] font-bold text-gray-900">{label}</span>
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-[13px] font-semibold text-green-700 truncate">{value}</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform flex-none ${fSection === key ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {fSection === key && (
                    <div className="pb-4">
                      {key === 'amenidades' && amenTiles('grid-cols-3')}
                      {key === 'precio' && precioInner}
                      {key === 'sort' && <div className="-mx-3">{sortRows()}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Barra inferior: limpiar + ver resultados */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-none"
              style={{ boxShadow: '0 -4px 20px rgba(20,14,30,.06)' }}>
              <button type="button" onClick={clearFilters} className="text-[15px] font-bold text-gray-900 underline">
                Limpiar
              </button>
              <button type="button" onClick={() => setFilterSheet(false)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl text-white font-bold text-[15px] bg-green-600 active:scale-[.98] transition-transform"
                style={{ boxShadow: '0 8px 22px rgba(22,163,74,.42)' }}>
                Ver {filtered.length} {filtered.length === 1 ? 'cancha' : 'canchas'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {city && (
          <p className="text-sm text-gray-500 mb-5 md:hidden">
            Canchas en <span className="font-semibold text-gray-900">{city}</span>
          </p>
        )}

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
