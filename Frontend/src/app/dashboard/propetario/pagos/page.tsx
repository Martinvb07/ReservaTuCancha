'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, DollarSign, TrendingUp, Clock, CheckCircle, XCircle,
  Download, Lock, AlertCircle, Eye, EyeOff, Search, CalendarDays,
  Banknote, BarChart3, ChevronLeft, ChevronRight, SlidersHorizontal,
} from 'lucide-react';
import { format, isThisWeek, isThisMonth, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';
import { toast } from 'sonner';
import { UpgradePlanModal, extractUpgradeError } from '@/components/dashboard/UpgradePlanModal';

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
    `${b.startTime ?? ''} – ${b.endTime ?? ''}`,
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

  const [tab, setTab]                   = useState<'historial' | 'wompi'>('historial');
  const [period, setPeriod]             = useState<Period>('todo');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch]             = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [wompiForm, setWompiForm]       = useState({
    wompiPublicKey: '', wompiIntegritySecret: '', wompiEventsSecret: '',
  });
  const [upgradeError, setUpgradeError] = useState<ReturnType<typeof extractUpgradeError> | null>(null);

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

  useEffect(() => {
    if (clubInfo) setWompiForm({ wompiPublicKey: clubInfo.wompiPublicKey || '', wompiIntegritySecret: '', wompiEventsSecret: '' });
  }, [clubInfo?.wompiPublicKey]);

  // ── Mutación Wompi ──
  const saveWompi = useMutation({
    mutationFn: async (formData: typeof wompiForm) => {
      const clubId = clubInfo?._id || clubInfo?.id;
      if (!clubId) throw new Error('ID del club no detectado. Recarga la página.');
      return api.patch(`/clubs/${clubId}/wompi`, formData);
    },
    onSuccess: () => { toast.success('Credenciales de Wompi guardadas'); queryClient.invalidateQueries({ queryKey: ['club-info'] }); },
    onError: (e: any) => {
      const ue = extractUpgradeError(e);
      if (ue.isUpgrade) { setUpgradeError(ue); }
      else { toast.error(e.response?.data?.message || 'Error al guardar credenciales'); }
    },
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
          <p className="text-gray-500 text-sm mt-1">Historial de cobros y configuración de Wompi</p>
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
          { key: 'wompi',     label: 'Configurar Wompi',   icon: Lock      },
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
                        <p className="text-xs text-gray-400">{b.startTime} – {b.endTime}</p>
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
      {tab === 'wompi' && (
        <div className="space-y-5">

          {/* Estado Wompi */}
          <div className={`rounded-2xl border p-5 flex items-center gap-4 ${
            clubInfo?.wompiConfigured
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              clubInfo?.wompiConfigured ? 'bg-green-600' : 'bg-amber-500'
            }`}>
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">
                {clubInfo?.wompiConfigured ? 'Wompi configurado correctamente' : 'Wompi no configurado'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {clubInfo?.wompiConfigured
                  ? 'Tu club puede recibir pagos online. Actualiza las credenciales si cambian.'
                  : 'Agrega tus credenciales para activar los pagos online con Wompi.'
                }
              </p>
            </div>
          </div>

          {loadingClub && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          )}

          {isError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-red-900 text-sm">Error al cargar el club</p>
                <p className="text-xs text-red-700 mt-1">No pudimos cargar la información. Recarga la página.</p>
              </div>
            </div>
          )}

          {clubInfo && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
                <p className="font-bold text-sm">¿Dónde encuentro estos datos?</p>
                <p className="text-xs text-blue-700">Dashboard de Wompi → <strong>Developers</strong> → <strong>Llaves del API</strong> y <strong>Secretos para integración técnica</strong></p>
              </div>

              <FormField
                label="Llave pública"
                hint="pub_test_... o pub_prod_..."
                placeholder="pub_test_xxxxxxxxxxxxxx"
                value={wompiForm.wompiPublicKey}
                onChange={v => setWompiForm(f => ({ ...f, wompiPublicKey: v }))}
                type="text"
              />
              <FormField
                label="Secreto de integridad"
                hint={clubInfo?.wompiConfigured ? 'Deja vacío para mantener el actual' : 'Secretos → Integridad'}
                placeholder={clubInfo?.wompiConfigured ? '••••••••• (sin cambios)' : 'Pega el secreto de integridad'}
                value={wompiForm.wompiIntegritySecret}
                onChange={v => setWompiForm(f => ({ ...f, wompiIntegritySecret: v }))}
                type={showPassword ? 'text' : 'password'}
                toggleShow={() => setShowPassword(s => !s)}
                showPassword={showPassword}
              />
              <FormField
                label="Secreto de eventos"
                hint={clubInfo?.wompiConfigured ? 'Deja vacío para mantener el actual' : 'Secretos → Eventos'}
                placeholder={clubInfo?.wompiConfigured ? '••••••••• (sin cambios)' : 'Pega el secreto de eventos'}
                value={wompiForm.wompiEventsSecret}
                onChange={v => setWompiForm(f => ({ ...f, wompiEventsSecret: v }))}
                type={showPassword ? 'text' : 'password'}
                toggleShow={() => setShowPassword(s => !s)}
                showPassword={showPassword}
              />

              <button
                onClick={() => saveWompi.mutate(wompiForm)}
                disabled={saveWompi.isPending || !wompiForm.wompiPublicKey.trim() || (!clubInfo?.wompiConfigured && !wompiForm.wompiIntegritySecret.trim())}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-green-100 disabled:shadow-none text-sm"
              >
                {saveWompi.isPending ? 'Guardando...' : clubInfo?.wompiConfigured ? 'Actualizar credenciales' : 'Guardar credenciales'}
              </button>
            </div>
          )}
        </div>
      )}

      <UpgradePlanModal
        open={!!upgradeError?.isUpgrade}
        onClose={() => setUpgradeError(null)}
        code={upgradeError?.code}
        message={upgradeError?.message}
        currentPlan={upgradeError?.currentPlan}
      />
    </div>
  );
}

// ─── Sub-componente campo formulario ─────────────────────────────────────────
function FormField({ label, hint, placeholder, value, onChange, type, toggleShow, showPassword }: {
  label: string; hint?: string; placeholder: string; value: string;
  onChange: (v: string) => void; type: string;
  toggleShow?: () => void; showPassword?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-1">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm pr-10"
        />
        {toggleShow && (
          <button type="button" onClick={toggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
