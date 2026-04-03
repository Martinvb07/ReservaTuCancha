'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiAuth } from '@/hooks/useApiAuth';
import Link from 'next/link';
import {
  Users, Building2, CalendarDays, DollarSign, FileText, Zap,
  ArrowUpRight, TrendingUp, TrendingDown, Minus,
  ChevronRight, Clock, CheckCircle, XCircle, Bell, BarChart3,
  CreditCard, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api/axios';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtCOP(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString('es-CO')}`;
}

function timeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada', completed: 'Completada',
};
const STATUS_DOT: Record<string, string> = {
  confirmed: 'bg-green-500', pending: 'bg-yellow-400', cancelled: 'bg-red-400', completed: 'bg-blue-400',
};

const SPORT_LABEL: Record<string, string> = {
  futbol: 'Futbol', padel: 'Padel', voley_playa: 'Voley Playa',
};

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6'];

// ─── Component ───────────────────────────────────────────────────────────────
export function AdminHomeWidgets() {
  const session = useApiAuth();
  const token = (session as any)?.accessToken;

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ['admin-stats'],
    queryFn: async () => { const { data } = await api.get('/analytics/admin'); return data; },
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  const { data: monthly = [] } = useQuery<any[]>({
    queryKey: ['admin-monthly'],
    queryFn: async () => { const { data } = await api.get('/analytics/admin/monthly'); return data; },
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="xl:col-span-2 h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = [
    {
      title: 'Propietarios',
      value: stats.totalOwners ?? 0,
      change: `+${stats.newOwnersThisMonth ?? 0} este mes`,
      trend: (stats.newOwnersThisMonth ?? 0) > 0 ? 'up' : 'neutral',
      icon: Users, color: 'text-blue-600', bg: 'bg-blue-50',
      href: '/dashboard/admin/usuarios',
    },
    {
      title: 'Canchas activas',
      value: stats.activeCourts ?? 0,
      change: `${stats.totalCourts ?? 0} totales`,
      trend: 'neutral',
      icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50',
      href: '/dashboard/admin/reportes',
    },
    {
      title: 'Reservas totales',
      value: stats.totalBookings ?? 0,
      change: stats.bookingsGrowth > 0 ? `+${stats.bookingsGrowth}% vs mes anterior` : stats.bookingsGrowth < 0 ? `${stats.bookingsGrowth}% vs mes anterior` : 'Sin cambio vs mes anterior',
      trend: stats.bookingsGrowth > 0 ? 'up' : stats.bookingsGrowth < 0 ? 'down' : 'neutral',
      icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50',
      href: '/dashboard/admin/reportes',
    },
    {
      title: 'Ingresos totales',
      value: fmtCOP(stats.totalRevenue ?? 0),
      change: stats.revenueGrowth > 0 ? `+${stats.revenueGrowth}% vs mes anterior` : stats.revenueGrowth < 0 ? `${stats.revenueGrowth}% vs mes anterior` : 'Sin cambio',
      trend: stats.revenueGrowth > 0 ? 'up' : stats.revenueGrowth < 0 ? 'down' : 'neutral',
      icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50',
      href: '/dashboard/admin/reportes',
    },
    {
      title: 'Solicitudes pendientes',
      value: stats.pendingSolicitudes ?? 0,
      change: `${stats.totalSolicitudes ?? 0} totales`,
      trend: (stats.pendingSolicitudes ?? 0) > 0 ? 'warn' : 'neutral',
      icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50',
      href: '/dashboard/admin/solicitudes',
    },
    {
      title: 'Suscripciones',
      value: stats.activeSubs ?? 0,
      change: `${stats.trialSubs ?? 0} en trial`,
      trend: 'neutral',
      icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50',
      href: '/dashboard/admin/suscripciones',
    },
  ];

  // ── Status pie data ────────────────────────────────────────────────────────
  const statusData = [
    { name: 'Confirmadas', value: stats.confirmedBookings ?? 0 },
    { name: 'Pendientes',  value: stats.pendingBookings ?? 0 },
    { name: 'Canceladas',  value: stats.cancelledBookings ?? 0 },
    { name: 'Completadas', value: stats.completedBookings ?? 0 },
  ].filter(d => d.value > 0);

  // ── Plan distribution ──────────────────────────────────────────────────────
  const planData = [
    { name: 'Basico', value: stats.planCounts?.basico ?? 0, color: '#9ca3af' },
    { name: 'Pro', value: stats.planCounts?.pro ?? 0, color: '#3b82f6' },
    { name: 'Empresarial', value: stats.planCounts?.empresarial ?? 0, color: '#a855f7' },
  ].filter(d => d.value > 0);

  // ── Quick actions ──────────────────────────────────────────────────────────
  const quickActions = [
    { href: '/dashboard/admin/solicitudes',  label: 'Solicitudes',   desc: `${stats.pendingSolicitudes ?? 0} pendientes`,  icon: FileText,  color: 'bg-lime-400',   text: 'text-gray-900', hot: (stats.pendingSolicitudes ?? 0) > 0 },
    { href: '/dashboard/admin/usuarios',     label: 'Usuarios',      desc: `${stats.activeOwners ?? 0} activos`,           icon: Users,     color: 'bg-blue-600',   text: 'text-white',    hot: false },
    { href: '/dashboard/admin/suscripciones',label: 'Suscripciones', desc: 'Planes y pagos',                               icon: CreditCard,color: 'bg-yellow-500', text: 'text-white',    hot: false },
    { href: '/dashboard/admin/cambios',      label: 'Changelog',     desc: 'Notificar a owners',                           icon: Bell,      color: 'bg-purple-600', text: 'text-white',    hot: false },
    { href: '/dashboard/admin/reportes',     label: 'Reportes',      desc: 'Metricas globales',                            icon: BarChart3, color: 'bg-gray-800',   text: 'text-white',    hot: false },
  ];

  return (
    <div className="space-y-6">

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map(k => (
          <Link key={k.title} href={k.href}
            className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 hover:shadow-md hover:border-green-200 transition-all group"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${k.color}`} />
              </div>
              <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-300 group-hover:text-green-500 transition-colors" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-gray-900">{k.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5 sm:mt-1 leading-tight">{k.title}</p>
            <p className={`text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 font-semibold ${
              k.trend === 'warn' ? 'text-orange-500' : k.trend === 'down' ? 'text-red-500' : k.trend === 'up' ? 'text-green-600' : 'text-gray-400'
            }`}>
              {k.change}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Grid: Acciones + Actividad ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

        {/* Acciones rapidas */}
        <div className="xl:col-span-2 space-y-3 sm:space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Acciones rapidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickActions.map(a => (
              <Link key={a.href} href={a.href}
                className={`${a.color} ${a.text} rounded-2xl p-3 sm:p-4 flex flex-col gap-2 hover:opacity-90 hover:scale-[1.02] transition-all shadow-sm relative overflow-hidden`}
              >
                {a.hot && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-white rounded-full animate-pulse" />}
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <a.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-black text-xs sm:text-sm">{a.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Actividad reciente — REAL */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Actividad reciente</h2>
            <Link href="/dashboard/admin/reportes" className="text-xs text-green-600 font-bold hover:underline flex items-center gap-1">
              Ver todo <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {/* Recent solicitudes */}
            {(stats.recentSolicitudes ?? []).slice(0, 3).map((s: any, i: number) => (
              <div key={`sol-${i}`} className="flex items-start gap-3 p-3 sm:p-4">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  s.estado === 'aprobada' ? 'bg-green-100 text-green-600' :
                  s.estado === 'rechazada' ? 'bg-red-100 text-red-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {s.estado === 'aprobada' ? <CheckCircle className="h-3.5 w-3.5" /> :
                   s.estado === 'rechazada' ? <XCircle className="h-3.5 w-3.5" /> :
                   <FileText className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 leading-snug truncate">
                    {s.estado === 'pendiente' ? 'Solicitud' : s.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}: &quot;{s.businessName}&quot;
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />{timeAgo(s.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {/* Recent bookings */}
            {(stats.recentBookings ?? []).slice(0, 4).map((b: any, i: number) => {
              const court = typeof b.courtId === 'object' ? b.courtId : null;
              return (
                <div key={`bk-${i}`} className="flex items-start gap-3 p-3 sm:p-4">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                    b.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                    b.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[b.status]}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-700 leading-snug truncate">
                      {b.guestName} — {court?.name ?? 'Cancha'} · {fmtCOP(b.totalPrice ?? 0)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{timeAgo(b.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            {(stats.recentBookings ?? []).length === 0 && (stats.recentSolicitudes ?? []).length === 0 && (
              <div className="p-6 text-center text-xs text-gray-400">Sin actividad reciente</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">

        {/* Ingresos mensuales */}
        {monthly.length > 0 && (
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Ingresos mensuales</h3>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="monthShort" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tickFormatter={(v: number) => fmtCOP(v)} tick={{ fontSize: 10, fill: '#9ca3af' }} width={60} />
                  <Tooltip
                    formatter={(v) => [`$${Number(v).toLocaleString('es-CO')} COP`, 'Ingresos']}
                    labelFormatter={(l) => `Mes: ${l}`}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Reservas por estado + planes */}
        <div className="space-y-4 sm:space-y-6">
          {/* Status pie */}
          {statusData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Reservas por estado</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [Number(v), '']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
                {statusData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Plan distribution */}
          {planData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Owners por plan</h3>
              <div className="space-y-2.5">
                {planData.map(p => {
                  const total = planData.reduce((s, x) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-700">{p.name}</span>
                        <span className="text-xs text-gray-400">{p.value} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Reservas por deporte ──────────────────────────────── */}
      {(stats.bookingsBySport ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Reservas por deporte</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(stats.bookingsBySport ?? []).map((s: any) => (
              <div key={s._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 sm:p-4">
                <div>
                  <p className="text-sm font-black text-gray-900">{SPORT_LABEL[s._id] ?? s._id}</p>
                  <p className="text-xs text-gray-400">{s.count} reservas</p>
                </div>
                <span className="text-sm font-black text-green-700">{fmtCOP(s.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Resumen del mes ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Reservas este mes', value: stats.bookingsThisMonth ?? 0, prev: stats.bookingsLastMonth ?? 0, fmt: (v: number) => String(v) },
          { label: 'Ingresos este mes', value: stats.revenueThisMonth ?? 0, prev: stats.revenueLastMonth ?? 0, fmt: fmtCOP },
          { label: 'Confirmadas', value: stats.confirmedBookings ?? 0, prev: null, fmt: (v: number) => String(v) },
          { label: 'Canceladas', value: stats.cancelledBookings ?? 0, prev: null, fmt: (v: number) => String(v) },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">{item.fmt(item.value)}</p>
            {item.prev !== null && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                vs {item.fmt(item.prev)} mes anterior
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
