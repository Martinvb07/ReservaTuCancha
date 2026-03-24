'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useClubs } from '@/hooks/useClubs';
import { useCourts } from '@/hooks/useCourts';
import ClubCard from '@/components/clubs/ClubCard';
import CourtCard from '@/components/courts/CourtCard';
import { SlidersHorizontal, X, ArrowLeft, Search, ChevronDown, DollarSign, Star, Clock } from 'lucide-react';
import type { CourtFilters as CourtFiltersType } from '@/types';
import type { Club } from '@/types/club.types';

const SPORT_OPTIONS = [
  { value: '',            label: 'Todos',       emoji: '🏟️' },
  { value: 'futbol',      label: 'Fútbol',      emoji: '⚽' },
  { value: 'padel',       label: 'Pádel',       emoji: '🎾' },
  { value: 'voley_playa', label: 'Voley Playa', emoji: '🏐' },
];

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';

// ── Filtros específicos para canchas dentro de un club ──────────
function ClubCourtFilters({
  filters, onChange, sport, onSportChange,
}: {
  filters: CourtFiltersType;
  onChange: (f: CourtFiltersType) => void;
  sport: string;
  onSportChange: (s: string) => void;
}) {
  const hasFilters = sport || filters.minPrice || filters.maxPrice;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
            <SlidersHorizontal className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Filtrar canchas</span>
        </div>
        {hasFilters && (
          <button
            onClick={() => { onSportChange(''); onChange({ ...filters, minPrice: '', maxPrice: '', page: 1 }); }}
            className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">

        {/* Deporte */}
        <div>
          <label className={lbl}>Deporte</label>
          <div className="grid grid-cols-2 gap-2">
            {SPORT_OPTIONS.map(s => (
              <button
                key={s.value}
                onClick={() => onSportChange(s.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                  sport === s.value
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:border-green-300'
                }`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className={lbl}>
            <DollarSign className="inline h-3 w-3 mr-1" />
            Precio por hora (COP)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Mín"
              className={inp}
              value={filters.minPrice || ''}
              onChange={e => onChange({ ...filters, minPrice: e.target.value, page: 1 })}
            />
            <input
              type="number"
              placeholder="Máx"
              className={inp}
              value={filters.maxPrice || ''}
              onChange={e => onChange({ ...filters, maxPrice: e.target.value, page: 1 })}
            />
          </div>
        </div>

        {/* Ordenar por */}
        <div>
          <label className={lbl}>
            <Star className="inline h-3 w-3 mr-1" />
            Ordenar por
          </label>
          <div className="relative">
            <select
              className={inp + " appearance-none pr-8 cursor-pointer"}
              defaultValue="rating"
              onChange={e => onChange({ ...filters, page: 1 })}
            >
              <option value="rating">Mejor calificadas</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => onChange({ ...filters, page: 1 })}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-sm py-3 rounded-xl transition-colors"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function EmpresasPageClient() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [sport, setSport]               = useState(searchParams.get('sport') || '');
  const [city, setCity]                 = useState('');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [courtSport, setCourtSport]     = useState('');
  const [courtFilters, setCourtFilters] = useState<CourtFiltersType>({
    sport: '', city: '', minPrice: '', maxPrice: '', page: 1,
  });

  const { data: clubs, isLoading: loadingClubs, isError: errorClubs } =
    useClubs(sport, city || undefined);

  const { data: courtsData, isLoading: loadingCourts } = useCourts(
    selectedClub
      ? { ...courtFilters, sport: courtSport, ownerId: selectedClub.ownerUserId }
      : { sport: '', city: '', minPrice: '', maxPrice: '', page: 1 }
  );

  const currentPage = courtFilters.page ?? 1;

  const handleSportChange = (val: string) => {
    setSport(val);
    setSelectedClub(null);
    router.push(val ? `/empresas?sport=${val}` : '/empresas');
  };

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCourtSport('');
    setCourtFilters({ sport: '', city: '', minPrice: '', maxPrice: '', page: 1 });
  };

  const handleBack = () => {
    setSelectedClub(null);
    setCourtSport('');
    setCourtFilters({ sport: '', city: '', minPrice: '', maxPrice: '', page: 1 });
  };

  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative bg-gray-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1600&q=80"
          alt="canchas"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-gray-900" />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          {selectedClub && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Volver a empresas
            </button>
          )}

          <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-2">
            <span>✦</span> {selectedClub ? selectedClub.name : 'Encuentra tu cancha'}
          </p>

          <h1 className="text-4xl font-black text-white uppercase mb-2">
            {selectedClub ? 'Canchas disponibles' : 'Empresas y clubes deportivos'}
          </h1>

          <p className="text-gray-400 text-sm">
            {selectedClub
              ? `${courtsData?.total ?? 0} canchas en ${selectedClub.name}`
              : loadingClubs
                ? 'Buscando...'
                : `${clubs?.length ?? 0} empresas registradas en Colombia`}
          </p>

          {/* Sport tabs — solo sin club seleccionado */}
          {!selectedClub && (
            <div className="flex flex-wrap gap-2 mt-6">
              {SPORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleSportChange(s.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                    sport === s.value
                      ? 'bg-lime-400 border-lime-400 text-gray-900'
                      : 'border-white/20 text-white hover:border-white/50'
                  }`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Sport tabs dentro del club */}
          {selectedClub && (
            <div className="flex flex-wrap gap-2 mt-6">
              {SPORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setCourtSport(s.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                    courtSport === s.value
                      ? 'bg-lime-400 border-lime-400 text-gray-900'
                      : 'border-white/20 text-white hover:border-white/50'
                  }`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CONTENIDO ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-10">

        {/* ── VISTA: Lista de clubs ──────────────────────────── */}
        {!selectedClub && (
          <div className="flex flex-col lg:flex-row gap-8">

            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-6 bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                    <SlidersHorizontal className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Filtros</span>
                </div>
                <div>
                  <label className={lbl}>Ciudad</label>
                  <input
                    type="text"
                    placeholder="Ej: Villavicencio"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className={inp}
                  />
                </div>
                {city && (
                  <button
                    onClick={() => setCity('')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="h-3 w-3" /> Limpiar ciudad
                  </button>
                )}
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                  <span className="font-black text-gray-900">{clubs?.length ?? 0}</span> empresas encontradas
                </p>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden flex items-center gap-2 text-sm font-bold text-gray-700 border border-gray-200 px-4 py-2 rounded-xl"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filtros
                </button>
              </div>

              {sidebarOpen && (
                <div className="lg:hidden mb-6 bg-white rounded-2xl border border-gray-100 p-5">
                  <label className={lbl}>Ciudad</label>
                  <input type="text" placeholder="Ej: Villavicencio" value={city}
                    onChange={e => setCity(e.target.value)} className={inp} />
                </div>
              )}

              {loadingClubs && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                      <div className="h-28 bg-gray-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {errorClubs && (
                <div className="text-center py-20">
                  <span className="text-5xl">😕</span>
                  <p className="text-gray-500 mt-4 font-medium">Error cargando empresas</p>
                </div>
              )}

              {!loadingClubs && clubs && clubs.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <span className="text-6xl">🏢</span>
                  <p className="text-xl font-black text-gray-900 uppercase mt-4">No hay empresas</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {sport ? 'No hay empresas con ese deporte' : 'Aún no hay empresas registradas'}
                  </p>
                </div>
              )}

              {!loadingClubs && clubs && clubs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {clubs.map((club) => (
                    <ClubCard key={club._id} club={club} onClick={() => handleSelectClub(club)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VISTA: Canchas del club ────────────────────────── */}
        {selectedClub && (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar con filtros específicos del club */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-6">
                <ClubCourtFilters
                  filters={courtFilters}
                  onChange={setCourtFilters}
                  sport={courtSport}
                  onSportChange={setCourtSport}
                />
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                  <span className="font-black text-gray-900">{courtsData?.total ?? 0}</span> canchas en {selectedClub.name}
                </p>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden flex items-center gap-2 text-sm font-bold text-gray-700 border border-gray-200 px-4 py-2 rounded-xl"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filtros
                </button>
              </div>

              {/* Mobile filtros club */}
              {sidebarOpen && (
                <div className="lg:hidden mb-6">
                  <ClubCourtFilters
                    filters={courtFilters}
                    onChange={(f) => { setCourtFilters(f); setSidebarOpen(false); }}
                    sport={courtSport}
                    onSportChange={setCourtSport}
                  />
                </div>
              )}

              {loadingCourts && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                      <div className="h-48 bg-gray-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingCourts && courtsData && courtsData.data.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                  <span className="text-5xl">🏟️</span>
                  <p className="text-xl font-black text-gray-900 uppercase mt-4">Sin canchas disponibles</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {courtSport || courtFilters.minPrice || courtFilters.maxPrice
                      ? 'Intenta con otros filtros'
                      : 'Esta empresa no tiene canchas registradas aún'}
                  </p>
                  <button
                    onClick={handleBack}
                    className="mt-4 inline-flex items-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" /> Volver a empresas
                  </button>
                </div>
              )}

              {!loadingCourts && courtsData && courtsData.data.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {courtsData.data.map((court) => (
                      <CourtCard key={court._id} court={court} />
                    ))}
                  </div>

                  {courtsData.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12">
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setCourtFilters({ ...courtFilters, page: currentPage - 1 })}
                        className="text-sm font-semibold border border-gray-200 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >← Anterior</button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: courtsData.totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === courtsData.totalPages || Math.abs(p - currentPage) <= 1)
                          .reduce<(number | string)[]>((acc, p, i, arr) => {
                            if (i > 0 && (p as number) - (arr[i-1] as number) > 1) acc.push('...');
                            acc.push(p); return acc;
                          }, [])
                          .map((p, i) => p === '...'
                            ? <span key={`d${i}`} className="px-2 text-gray-400 text-sm">…</span>
                            : <button key={p} onClick={() => setCourtFilters({ ...courtFilters, page: p as number })}
                                className={`w-9 h-9 text-sm font-bold rounded-xl transition-all ${p === currentPage ? 'bg-green-600 text-white shadow-md' : 'border border-gray-200 hover:border-gray-400 text-gray-700'}`}>
                                {p}
                              </button>
                          )}
                      </div>
                      <button
                        disabled={currentPage >= courtsData.totalPages}
                        onClick={() => setCourtFilters({ ...courtFilters, page: currentPage + 1 })}
                        className="text-sm font-semibold border border-gray-200 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >Siguiente →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}