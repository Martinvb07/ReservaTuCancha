'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, parseISO, subDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle, Clock, AlertCircle, Calendar, User,
  TrendingUp, Banknote, CreditCard, ArrowRight, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts';
import Link from 'next/link';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';
import { toast } from 'sonner';

// ─── helpers ─────────────────────────────────────────────────────────────────
function to12h(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function fmtCOP(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STATUS_BORDER: Record<string, string> = {
  confirmed: 'border-green-200 bg-green-50',
  pending:   'border-amber-200 bg-amber-50',
  cancelled: 'border-red-100 bg-red-50',
  completed: 'border-blue-200 bg-blue-50',
};
const STATUS_TIME: Record<string, string> = {
  confirmed: 'text-green-700',
  pending:   'text-amber-700',
  cancelled: 'text-red-500',
  completed: 'text-blue-700',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  pending:   'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function OwnerHomeWidgets() {
  const session = useApiAuth();
  const token = (session as any)?.accessToken;
  const queryClient = useQueryClient();

  // ── Plan info ──
  const { data: planInfo } = useQuery<any>({
    queryKey: ['my-plan'],
    queryFn: async () => { const { data } = await api.get('/users/my-plan'); return data; },
    enabled: !!token,
    retry: 1,
  });

  // ── Bookings ──
  const { data: bookings = [], isLoading } = useQuery<any[]>({
    queryKey: ['owner-bookings'],
    queryFn: async () => { const { data } = await api.get('/bookings/owner'); return data; },
    enabled: !!token,
  });

  // ── Club info (Wompi status + slug) ──
  const { data: clubInfo } = useQuery<any>({
    queryKey: ['club-info'],
    queryFn: async () => {
      const { data } = await api.get('/clubs/my-club');
      // Si no tiene slug, generarlo
      if (data && !data.slug) {
        try {
          const { data: slugData } = await api.get('/clubs/my-club/ensure-slug');
          data.slug = slugData.slug;
        } catch {}
      }
      return data;
    },
    enabled: !!token,
    retry: 1,
  });

  // ── Confirmar reserva ──
  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/status`, { status: 'confirmed' }),
    onSuccess: () => {
      toast.success('Reserva confirmada');
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
    },
    onError: () => toast.error('Error al confirmar'),
  });

  // ── Datos derivados ──
  const pending       = bookings.filter(b => b.status === 'pending');
  const todayBookings = bookings
    .filter(b => { try { return isToday(parseISO(b.date)); } catch { return false; } })
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  // ── Gráfica últimos 7 días ──
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayB = bookings.filter(b => { try { return isSameDay(parseISO(b.date), day); } catch { return false; } });
    const revenue = dayB
      .filter(b => ['confirmed', 'completed'].includes(b.status))
      .reduce((s, b) => s + (b.totalPrice || 0), 0);
    return {
      day:      format(day, 'EEE', { locale: es }),
      reservas: dayB.length,
      ingresos: revenue,
      isToday:  isToday(day),
    };
  });

  const weekRevTotal  = weekData.reduce((s, d) => s + d.ingresos, 0);
  const weekBookTotal = weekData.reduce((s, d) => s + d.reservas, 0);

  return (
    <div className="space-y-5">

      {/* ── Banner suscripción vencida ── */}
      {planInfo?.isExpired && (
        <Link href="/dashboard/propetario/suscripcion" className="block group">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:bg-red-100 transition-all">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-red-900 text-sm">Tu suscripción venció</p>
              <p className="text-xs text-red-700 mt-0.5 leading-snug">
                Algunas funciones están bloqueadas. Contáctanos para renovar tu plan.
              </p>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-200 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 group-hover:bg-red-300 transition-colors">
              Ver plan <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      )}

      {/* ── Banner vencimiento próximo ── */}
      {planInfo?.isExpiringSoon && !planInfo?.isExpired && (
        <Link href="/dashboard/propetario/suscripcion" className="block group">
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:bg-orange-100 transition-all">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-orange-900 text-sm">
                Tu plan vence en {planInfo.daysLeft} día{planInfo.daysLeft !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-orange-700 mt-0.5 leading-snug">
                Renueva antes de que expire para mantener el acceso a todas tus funciones.
              </p>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-200 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 group-hover:bg-orange-300 transition-colors">
              Renovar <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      )}

      {/* ── Alerta Wompi ── */}
      {clubInfo && !clubInfo.wompiConfigured && (
        <Link href="/dashboard/propetario/pagos" className="block group">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4 hover:bg-amber-100 hover:border-amber-300 transition-all">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-amber-900 text-sm">Wompi no configurado</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-snug">
                Tus clientes no pueden pagar online. Agrega tus credenciales para activar los pagos.
              </p>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-200 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 group-hover:bg-amber-300 transition-colors">
              Configurar <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      )}

      {/* ── Mi página pública ── */}
      {clubInfo?.slug && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-lime-400 rounded-xl flex items-center justify-center shrink-0 text-xl">
            🔗
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm">Tu página pública</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              reservatucancha.site/club/{clubInfo.slug}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://reservatucancha.site/club/${clubInfo.slug}`);
                toast.success('Link copiado');
              }}
              className="text-xs font-bold text-gray-900 bg-lime-400 hover:bg-lime-300 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              Copiar link
            </button>
            <Link
              href={`/club/${clubInfo.slug}`}
              target="_blank"
              className="text-xs font-bold text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              Ver página
            </Link>
          </div>
        </div>
      )}

      {/* ── Gráfica semana + Pendientes ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Gráfica – ocupa 2 columnas en xl */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-widest">
                Últimos 7 días
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {weekBookTotal} reserva{weekBookTotal !== 1 ? 's' : ''} ·{' '}
                <span className="text-green-600 font-semibold">{fmtCOP(weekRevTotal)} COP</span>
              </p>
            </div>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </div>

          {isLoading ? (
            <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weekData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}
                  cursor={{ fill: '#f9fafb' }}
                  formatter={(v: any) => [v, 'Reservas']}
                />
                <Bar dataKey="reservas" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {weekData.map((entry, i) => (
                    <Cell key={i} fill={entry.isToday ? '#16a34a' : '#bbf7d0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Leyenda */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-3 h-3 rounded bg-green-600 shrink-0" /> Hoy
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-3 h-3 rounded bg-green-200 shrink-0" /> Otros días
            </span>
          </div>
        </div>

        {/* Pendientes – 1 columna */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 flex flex-col min-h-[260px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-widest">
                Por confirmar
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isLoading ? '—' : `${pending.length} pendiente${pending.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              pending.length > 0 ? 'bg-amber-100' : 'bg-gray-100'
            }`}>
              {pending.length > 0
                ? <Clock className="h-4 w-4 text-amber-600" />
                : <CheckCircle className="h-4 w-4 text-gray-400" />
              }
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2 flex-1">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : pending.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-sm font-black text-gray-400">Todo al día</p>
              <p className="text-xs text-gray-300 mt-0.5">Sin reservas pendientes</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 flex-1">
              {pending.slice(0, 5).map((b: any) => {
                const court = typeof b.courtId === 'object' ? b.courtId : null;
                const method = b.paymentMethod === 'efectivo';
                return (
                  <div
                    key={b._id}
                    className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{b.guestName}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {b.date ? format(parseISO(b.date), 'dd MMM', { locale: es }) : ''} · {to12h(b.startTime)}
                        {court ? ` · ${court.name}` : ''}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${
                        method ? 'bg-amber-200 text-amber-800' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {method ? <Banknote className="h-2.5 w-2.5" /> : <CreditCard className="h-2.5 w-2.5" />}
                        {method ? 'Efectivo' : 'Wompi'}
                      </span>
                    </div>
                    <button
                      onClick={() => confirmMutation.mutate(b._id)}
                      disabled={confirmMutation.isPending}
                      title="Confirmar"
                      className="w-8 h-8 bg-green-500 hover:bg-green-600 active:scale-95 disabled:bg-gray-300 rounded-lg flex items-center justify-center transition-all shrink-0"
                    >
                      <CheckCircle className="h-4 w-4 text-white" />
                    </button>
                  </div>
                );
              })}

              {pending.length > 5 && (
                <Link
                  href="/dashboard/propetario/reservas"
                  className="flex items-center justify-center gap-1 text-xs text-green-600 font-bold hover:underline pt-1"
                >
                  Ver {pending.length - 5} más <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Reservas de hoy ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-widest">
              Reservas de hoy
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            todayBookings.length > 0 ? 'bg-blue-50' : 'bg-gray-100'
          }`}>
            <Calendar className={`h-4 w-4 ${todayBookings.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
              <Calendar className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-black text-gray-400">Sin reservas para hoy</p>
            <p className="text-xs text-gray-300 mt-1">Las reservas del día aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {todayBookings.map((b: any) => {
              const court = typeof b.courtId === 'object' ? b.courtId : null;
              return (
                <div
                  key={b._id}
                  className={`border-2 rounded-xl p-3.5 ${STATUS_BORDER[b.status] ?? STATUS_BORDER.pending}`}
                >
                  {/* Hora + precio */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-sm font-black ${STATUS_TIME[b.status] ?? STATUS_TIME.pending}`}>
                      {to12h(b.startTime)} – {to12h(b.endTime)}
                    </span>
                    <span className="text-xs font-bold text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
                      ${b.totalPrice?.toLocaleString('es-CO')}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="h-3 w-3 text-gray-400 shrink-0" />
                    <p className="text-xs font-semibold text-gray-800 truncate">{b.guestName}</p>
                  </div>

                  {/* Cancha */}
                  {court && (
                    <p className="text-[11px] text-gray-400 truncate mb-1.5">{court.name}</p>
                  )}

                  {/* Footer: estado + código */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/60">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/70`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                    {b.bookingCode && (
                      <span className="text-[10px] font-mono text-gray-300">#{b.bookingCode}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {todayBookings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              <span className="font-bold text-gray-700">{todayBookings.length}</span> reserva{todayBookings.length !== 1 ? 's' : ''} hoy ·{' '}
              <span className="text-green-600 font-semibold">
                {fmtCOP(todayBookings.filter(b => ['confirmed', 'completed'].includes(b.status)).reduce((s: number, b: any) => s + (b.totalPrice || 0), 0))} confirmados
              </span>
            </p>
            <Link
              href="/dashboard/propetario/reservas"
              className="flex items-center gap-1 text-xs text-green-600 font-bold hover:underline"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
