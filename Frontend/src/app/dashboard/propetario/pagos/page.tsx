'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, DollarSign, TrendingUp, Clock, CheckCircle, XCircle,
  Download, Search, CalendarDays,
  Banknote, BarChart3, ChevronLeft, ChevronRight, SlidersHorizontal, Landmark, Save, Loader2,
} from 'lucide-react';
import { format, isThisWeek, isThisMonth, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api/axios';
import CuentaPagosWizard, { type DatosBanco } from '@/components/dashboard/CuentaPagosWizard';
import { useApiAuth } from '@/hooks/useApiAuth';
import { toast } from 'sonner';

// ─── Constantes ───────────────────────────────────────────────────────────────
const STATUS_PILL: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  pending:   'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Completada',
};
const METHOD_LABEL: Record<string, { label: string; color: string }> = {
  wompi:    { label: 'Wompi',   color: 'text-blue-600 bg-blue-50'   },
  efectivo: { label: 'Efectivo', color: 'text-amber-600 bg-amber-50' },
};

type Period = 'hoy' | 'semana' | 'mes' | 'todo';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'hoy',    label: 'Hoy'     },
  { key: 'semana', label: 'Semana'  },
  { key: 'mes',    label: 'Mes'     },
  { key: 'todo',   label: 'Todo'    },
];

const ITEMS_PER_PAGE = 12;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtCOP(n: number) {
  return `$${n.toLocaleString('es-CO')}`;
}
function fmtBig(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return fmtCOP(n);
}
function formatTime12h(time24h: string): string {
  const [hours, minutes] = time24h.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function inPeriod(dateStr: string, period: Period): boolean {
  const d = parseISO(dateStr);
  if (period === 'hoy')    return isToday(d);
  if (period === 'semana') return isThisWeek(d, { weekStartsOn: 1 });
  if (period === 'mes')    return isThisMonth(d);
  return true;
}

function downloadCSV(bookings: any[]) {
  const headers = ['Código', 'Cliente', 'Email', 'Fecha', 'Hora', 'Estado', 'Método', 'Total COP'];
  const rows = bookings.map(b => [
    b.bookingCode ?? '',
    b.guestName ?? '',
    b.guestEmail ?? '',
    b.date ? format(parseISO(b.date), 'dd/MM/yyyy') : '',
    `${b.startTime ? formatTime12h(b.startTime) : ''} – ${b.endTime ? formatTime12h(b.endTime) : ''}`,
    STATUS_LABEL[b.status] ?? b.status,
    METHOD_LABEL[b.paymentMethod]?.label ?? b.paymentMethod ?? 'Wompi',
    b.totalPrice ?? 0,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `pagos-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function OwnerPagosPage() {
  const queryClient = useQueryClient();
  useApiAuth();

  const [tab, setTab]                   = useState<'historial' | 'liquidaciones' | 'cuenta'>('historial');
  const [period, setPeriod]             = useState<Period>('todo');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch]             = useState('');
  const [currentPage, setCurrentPage]   = useState(1);

  // ── Queries ──
  const { data: clubInfo, isLoading: loadingClub, isError } = useQuery({
    queryKey: ['club-info'],
    queryFn: async () => { const { data } = await api.get('/clubs/my-club'); return data; },
    retry: 1,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['owner-bookings'],
    queryFn: async () => { const { data } = await api.get('/bookings/owner'); return data; },
  });

  /* Liquidaciones semanales: lo que ReservaTuCancha le gira al club cada lunes,
     ya con la comision descontada. */
  const { data: liquidaciones, isLoading: loadingLiq } = useQuery({
    queryKey: ['mis-liquidaciones'],
    queryFn: async () => { const { data } = await api.get('/liquidaciones/mias'); return data; },
  });

  // ── Cuenta donde el club recibe su giro semanal ──
  const saveBanco = useMutation({
    mutationFn: async (formData: DatosBanco) => {
      const clubId = clubInfo?._id || clubInfo?.id;
      if (!clubId) throw new Error('ID del club no detectado. Recarga la página.');
      return api.patch(`/clubs/${clubId}/banco`, formData);
    },
    onSuccess: () => { toast.success('Cuenta de pagos guardada'); queryClient.invalidateQueries({ queryKey: ['club-info'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar la cuenta'),
  });

  // ── Filtrado ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().replace('#', '');
    return bookings
      .filter((b: any) => inPeriod(b.date, period))
      .filter((b: any) => filterStatus === 'all' || b.status === filterStatus)
      .filter((b: any) => !q ||
        b.guestName?.toLowerCase().includes(q) ||
        b.guestEmail?.toLowerCase().includes(q) ||
        b.bookingCode?.toLowerCase().includes(q)
      )
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings, period, filterStatus, search]);

  // ── KPIs del período filtrado ──
  const revenue     = useMemo(() => filtered.filter((b: any) => ['confirmed', 'completed'].includes(b.status)).reduce((s: number, b: any) => s + (b.totalPrice || 0), 0), [filtered]);
  const pendingRev  = useMemo(() => filtered.filter((b: any) => b.status === 'pending').reduce((s: number, b: any) => s + (b.totalPrice || 0), 0), [filtered]);
  const cancelledCt = useMemo(() => filtered.filter((b: any) => b.status === 'cancelled').length, [filtered]);
  const confirmedCt = useMemo(() => filtered.filter((b: any) => ['confirmed', 'completed'].includes(b.status)).length, [filtered]);

  // ── Paginación ──
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetPage = () => setCurrentPage(1);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-14 px-1 sm:px-0">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-lime-600 font-semibold text-xs uppercase tracking-widest flex items-center gap-2 mb-1">
            <span>✦</span> Panel Propietario
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Pagos</h1>
          <p className="text-gray-500 text-sm mt-1">Historial de cobros, liquidaciones semanales y tu cuenta</p>
        </div>
        <button
          onClick={() => downloadCSV(filtered)}
          className="flex items-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'historial', label: 'Historial de pagos', icon: BarChart3 },
          { key: 'liquidaciones', label: 'Mis liquidaciones', icon: Banknote },
          { key: 'cuenta',        label: 'Cuenta de pagos',   icon: Landmark },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
              tab === key ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════ TAB: HISTORIAL ════════════════════════════════ */}
      {tab === 'historial' && (
        <div className="space-y-5">

          {/* ── Filtro período ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="h-4 w-4 text-gray-400 shrink-0" />
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => { setPeriod(p.key); resetPage(); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                    period === p.key
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 font-medium shrink-0">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {/* ── KPIs del período ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Ingresos confirmados', value: fmtBig(revenue),    sub: `${confirmedCt} reserva${confirmedCt !== 1 ? 's' : ''}`, icon: DollarSign,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Pendiente de cobro',   value: fmtBig(pendingRev), sub: `${filtered.filter((b: any) => b.status === 'pending').length} pendiente${filtered.filter((b: any) => b.status === 'pending').length !== 1 ? 's' : ''}`, icon: Clock, color: 'text-amber-600',   bg: 'bg-amber-50'   },
              { label: 'Total reservas',        value: filtered.length,    sub: period === 'todo' ? 'Historial completo' : `En este ${period === 'hoy' ? 'día' : period}`, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Canceladas',            value: cancelledCt,        sub: `${confirmedCt > 0 ? Math.round(cancelledCt / (filtered.length || 1) * 100) : 0}% del período`, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight pr-2">{k.label}</p>
                  <div className={`w-8 h-8 shrink-0 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <k.icon className={`h-4 w-4 ${k.color}`} />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{loadingBookings ? '—' : k.value}</p>
                <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Buscador + filtro estado ── */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, email o código (#XXXXXXXX)..."
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage(); }}
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all',       label: 'Todos'      },
                { key: 'confirmed', label: 'Confirmadas' },
                { key: 'pending',   label: 'Pendientes'  },
                { key: 'completed', label: 'Completadas' },
                { key: 'cancelled', label: 'Canceladas'  },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => { setFilterStatus(s.key); resetPage(); }}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                    filterStatus === s.key
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Resumen saldo confirmado ── */}
          {revenue > 0 && (
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-wide">Ingresos del período</p>
                  <p className="text-green-100 text-xs">{confirmedCt} reservas confirmadas / completadas</p>
                </div>
              </div>
              <p className="text-3xl font-black">{fmtBig(revenue)}</p>
            </div>
          )}

          {/* ── Tabla / lista ── */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header tabla */}
            <div className="hidden sm:grid grid-cols-[1fr_1.4fr_120px_110px_100px] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
              {['Cliente', 'Fecha / Hora', 'Método', 'Total', 'Estado'].map(h => (
                <p key={h} className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</p>
              ))}
            </div>

            {loadingBookings && (
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-pulse flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="h-5 w-20 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            )}

            {!loadingBookings && filtered.length === 0 && (
              <div className="text-center py-16">
                <DollarSign className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="font-black text-gray-400 uppercase text-sm">Sin resultados</p>
                <p className="text-gray-400 text-xs mt-1">
                  {search || filterStatus !== 'all' ? 'Intenta con otros filtros' : 'No hay pagos en este período'}
                </p>
              </div>
            )}

            {!loadingBookings && paginated.length > 0 && (
              <div className="divide-y divide-gray-50">
                {paginated.map((b: any) => {
                  const isConfirmed  = ['confirmed', 'completed'].includes(b.status);
                  const isPending    = b.status === 'pending';
                  const method       = METHOD_LABEL[b.paymentMethod] ?? METHOD_LABEL.wompi;
                  const court        = typeof b.courtId === 'object' ? b.courtId : null;

                  return (
                    <div key={b._id} className="flex sm:grid sm:grid-cols-[1fr_1.4fr_120px_110px_100px] gap-3 sm:gap-4 items-center px-4 sm:px-6 py-3.5 hover:bg-gray-50 transition-colors">

                      {/* Cliente */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isConfirmed ? 'bg-green-100' : isPending ? 'bg-amber-100' : 'bg-red-100'
                        }`}>
                          {isConfirmed
                            ? <CheckCircle className="h-4 w-4 text-green-600" />
                            : isPending
                              ? <Clock className="h-4 w-4 text-amber-600" />
                              : <XCircle className="h-4 w-4 text-red-500" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{b.guestName}</p>
                          <p className="text-[11px] text-gray-400 truncate">{b.guestEmail}</p>
                          {court && <p className="text-[10px] text-gray-300 truncate">{court.name}</p>}
                        </div>
                      </div>

                      {/* Fecha / Hora */}
                      <div className="hidden sm:block min-w-0">
                        <p className="text-sm font-semibold text-gray-700">
                          {b.date ? format(parseISO(b.date), 'dd MMM yyyy', { locale: es }) : '—'}
                        </p>
                        <p className="text-xs text-gray-400">{formatTime12h(b.startTime)} – {formatTime12h(b.endTime)}</p>
                        {b.bookingCode && (
                          <p className="text-[10px] font-mono text-gray-300 mt-0.5">#{b.bookingCode}</p>
                        )}
                      </div>

                      {/* Método */}
                      <div className="hidden sm:block">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${method.color}`}>
                          {b.paymentMethod === 'efectivo'
                            ? <Banknote className="h-3 w-3" />
                            : <CreditCard className="h-3 w-3" />
                          }
                          {method.label}
                        </span>
                      </div>

                      {/* Total */}
                      <div className="text-right sm:text-left shrink-0">
                        <p className="font-black text-gray-900 text-sm">{fmtCOP(b.totalPrice ?? 0)}</p>
                        <p className="text-[10px] text-gray-400">COP</p>
                      </div>

                      {/* Estado */}
                      <div className="hidden sm:block">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_PILL[b.status] ?? STATUS_PILL.pending}`}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Paginación ── */}
          {!loadingBookings && filtered.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs sm:text-sm text-gray-500">
                Mostrando <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>–<strong>{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> de <strong>{filtered.length}</strong>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    const show = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    const dots = !show && (page === 2 || page === totalPages - 1);
                    if (!show && !dots) return null;
                    if (dots) return <span key={page} className="px-1 text-gray-400 self-center">…</span>;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                          page === currentPage ? 'bg-green-600 text-white' : 'border border-gray-200 text-gray-700 hover:border-green-400'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-all"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════ TAB: WOMPI ════════════════════════════════ */}
      {/* ════════════════ TAB: LIQUIDACIONES ════════════════ */}
      {tab === 'liquidaciones' && (
        <div className="space-y-5">
          {loadingLiq ? (
            <>
              <div className="h-40 bg-gray-100 rounded-3xl animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            </>
          ) : !liquidaciones?.semanas?.length ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
              <Banknote className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Todavía no hay liquidaciones</p>
              <p className="text-gray-500 text-sm mt-1">Aparecen apenas recibas tu primera reserva pagada en línea.</p>
            </div>
          ) : (() => {
            /* La primera semana es la que está corriendo: va destacada arriba
               porque es la plata que el club está esperando. El resto es
               historial y va en filas compactas. */
            const [proxima, ...anteriores] = liquidaciones.semanas;
            const comision = liquidaciones.comisionPorcentaje ?? 9;

            return (
              <>
                {/* ── Próximo giro ── */}
                <div className="rounded-3xl bg-gray-900 text-white p-5 md:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-widest text-green-400">
                        {proxima.enCurso ? 'Semana en curso' : 'Próximo giro'}
                      </p>
                      <p className="text-3xl md:text-5xl font-black mt-1.5">
                        ${(proxima.neto ?? 0).toLocaleString('es-CO')}
                      </p>
                      <p className="text-gray-400 text-sm mt-1.5">
                        {proxima.etiqueta} · {proxima.reservas} {proxima.reservas === 1 ? 'reserva' : 'reservas'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-2.5 shrink-0">
                      <CalendarDays className="h-4 w-4 text-green-400 shrink-0" />
                      <div className="text-xs leading-tight">
                        <p className="text-gray-400">Te llega el</p>
                        <p className="font-bold capitalize">
                          {format(parseISO(proxima.giro), "EEEE d 'de' MMM", { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
                    {[
                      { l: 'Recaudado', v: proxima.bruto ?? 0 },
                      { l: `Comisión ${comision}%`, v: -(proxima.comision ?? 0) },
                      { l: 'Te giramos', v: proxima.neto ?? 0 },
                    ].map((c) => (
                      <div key={c.l} className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 truncate">{c.l}</p>
                        <p className={`font-black text-sm md:text-base mt-0.5 ${c.v < 0 ? 'text-red-400' : 'text-white'}`}>
                          {c.v < 0 ? '−' : ''}${Math.abs(c.v).toLocaleString('es-CO')}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
                    La semana cierra el domingo al mediodía y giramos el lunes a las 2:00 PM.
                    Lo que se agende después del corte entra a la semana siguiente.
                  </p>
                </div>

                {/* ── Historial ── */}
                {anteriores.length > 0 && (
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2.5">
                      Semanas anteriores
                    </p>
                    <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100 bg-white">
                      {anteriores.map((sem: any) => {
                        const girada = sem.estado === 'girada';
                        return (
                          <div key={sem.inicio} className="flex items-center justify-between gap-3 px-4 py-3.5">
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{sem.etiqueta}</p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {sem.reservas} {sem.reservas === 1 ? 'reserva' : 'reservas'}
                                {girada
                                  ? ` · girada el ${format(parseISO(sem.giradaAt), "d 'de' MMM", { locale: es })}`
                                  : sem.reservas > 0 ? ' · pendiente de giro' : ' · sin movimiento'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-right">
                                <span className="block font-black text-gray-900 text-sm">
                                  ${(sem.neto ?? 0).toLocaleString('es-CO')}
                                </span>
                                <span className="block text-[10px] text-gray-400">
                                  de ${(sem.bruto ?? 0).toLocaleString('es-CO')}
                                </span>
                              </span>
                              {girada
                                ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                : <span className="w-4 shrink-0" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ════════════════ TAB: CUENTA DE PAGOS ════════════════ */}
      {tab === 'cuenta' && (
        <div className="max-w-2xl">
          {loadingClub ? (
            <div className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
          ) : (
            <CuentaPagosWizard
              key={clubInfo?.banco?.metodo ?? 'sin-cuenta'}
              actual={clubInfo?.banco}
              guardando={saveBanco.isPending}
              onGuardar={(datos) => saveBanco.mutate(datos)}
            />
          )}
        </div>
      )}

    </div>
  );
}
