'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, CalendarDays, DollarSign, Building2, TrendingUp,
  CheckCircle2, Clock, XCircle, Award, ArrowUpRight, Users,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '@/lib/api/axios';

// ─── Colores ─────────────────────────────────────────────────────────────────
const STATUS_COLORS = ['#16a34a', '#f59e0b', '#ef4444', '#3b82f6'];
const BAR_COLOR     = '#16a34a';
const LINE_COLOR    = '#10b981';
const HOUR_COLOR    = '#6366f1';
const DAY_COLOR     = '#f59e0b';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon: Icon, color, bg, sub,
}: {
  label: string; value: string | number; icon: any;
  color: string; bg: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight pr-2">{label}</p>
        <div className={`w-8 h-8 shrink-0 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Chart wrapper ────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, icon: Icon, iconBg, iconColor, children }: {
  title: string; subtitle?: string; icon?: any; iconBg?: string; iconColor?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-black text-gray-900 uppercase text-xs sm:text-sm tracking-widest">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${iconBg ?? 'bg-gray-50'} flex items-center justify-center shrink-0`}>
            <Icon className={`h-4 w-4 ${iconColor ?? 'text-gray-500'}`} />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,.08)' },
  cursor: { fill: '#f9fafb' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OwnerAnalyticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['owner-analytics'],
    queryFn: async () => {
      const [g, m] = await Promise.all([
        api.get('/analytics/owner'),
        api.get('/analytics/owner/monthly'),
      ]);
      return { global: g.data, monthly: m.data };
    },
  });

  const g       = stats?.global  ?? {};
  const monthly = stats?.monthly ?? [];

  const confirmedBookings  = g.confirmedBookings  ?? 0;
  const pendingBookings    = g.pendingBookings    ?? 0;
  const cancelledBookings  = g.cancelledBookings  ?? 0;
  const completedBookings  = g.completedBookings  ?? 0;
  const totalBookings      = g.totalBookings      ?? 0;
  const totalRevenue       = g.totalRevenue       ?? 0;
  const confirmRate        = g.confirmRate        ?? 0;
  const avgRevenue         = g.avgRevenue         ?? 0;
  const totalCourts        = g.totalCourts        ?? 0;
  const courtStats: any[]  = g.courtStats         ?? [];
  const dayStats: any[]    = g.dayStats           ?? [];
  const hourStats: any[]   = g.hourStats          ?? [];

  const statusData = [
    { name: 'Confirmadas', value: confirmedBookings },
    { name: 'Pendientes',  value: pendingBookings   },
    { name: 'Canceladas',  value: cancelledBookings },
    { name: 'Completadas', value: completedBookings },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-14 px-1 sm:px-0">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-xs uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Panel Propietario
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Rendimiento e ingresos de tus canchas</p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 sm:h-28" />)
        ) : (
          <>
            <KpiCard label="Reservas totales"   value={totalBookings}      icon={CalendarDays}  color="text-blue-600"    bg="bg-blue-50"   />
            <KpiCard label="Confirmadas"         value={confirmedBookings}  icon={CheckCircle2}  color="text-green-600"   bg="bg-green-50"  />
            <KpiCard label="Ingresos totales"    value={fmt(totalRevenue)}  icon={DollarSign}    color="text-emerald-600" bg="bg-emerald-50" />
            <KpiCard label="Canchas activas"     value={totalCourts}        icon={Building2}     color="text-purple-600"  bg="bg-purple-50" />
            <KpiCard label="Pendientes"          value={pendingBookings}    icon={Clock}         color="text-amber-600"   bg="bg-amber-50"  />
            <KpiCard label="Canceladas"          value={cancelledBookings}  icon={XCircle}       color="text-red-500"     bg="bg-red-50"    />
            <KpiCard label="Tasa confirmación"   value={`${confirmRate}%`}  icon={TrendingUp}    color="text-indigo-600"  bg="bg-indigo-50" sub={`${confirmedBookings + completedBookings} de ${totalBookings}`} />
            <KpiCard label="Ingreso por reserva" value={fmt(avgRevenue)}    icon={Award}         color="text-pink-600"    bg="bg-pink-50"   sub="promedio confirmadas" />
          </>
        )}
      </div>

      {/* ── Reservas por mes ── */}
      <ChartCard title="Reservas por mes" subtitle="Últimos 12 meses" icon={BarChart3} iconBg="bg-blue-50" iconColor="text-blue-600">
        {isLoading ? <Skeleton className="h-52" /> : monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="monthShort" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Reservas']} labelFormatter={(l) => `Mes: ${l}`} />
              <Bar dataKey="bookings" fill={BAR_COLOR} radius={[6, 6, 0, 0]} name="Reservas" />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyChart height={220} />}
      </ChartCard>

      {/* ── Ingresos + Estado ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard title="Ingresos (COP)" subtitle="Últimos 12 meses" icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600">
          {isLoading ? <Skeleton className="h-44" /> : monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={monthly} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="monthShort" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => fmt(v)} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: any) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ingresos']}
                  labelFormatter={(l) => `Mes: ${l}`}
                />
                <Line dataKey="revenue" stroke={LINE_COLOR} strokeWidth={2.5} dot={{ fill: LINE_COLOR, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart height={190} />}
        </ChartCard>

        <ChartCard title="Estado de reservas" subtitle="Distribución total" icon={Users} iconBg="bg-purple-50" iconColor="text-purple-600">
          {isLoading ? <Skeleton className="h-44" /> : statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%" cy="48%"
                  innerRadius={50} outerRadius={78}
                  paddingAngle={3} dataKey="value"
                >
                  {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                </Pie>
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>}
                />
                <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [v, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart height={190} />}
        </ChartCard>
      </div>

      {/* ── Días populares + Horas populares ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard title="Días más populares" subtitle="Reservas activas por día de semana" icon={CalendarDays} iconBg="bg-amber-50" iconColor="text-amber-600">
          {isLoading ? <Skeleton className="h-44" /> : dayStats.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={dayStats} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Reservas']} />
                <Bar dataKey="count" fill={DAY_COLOR} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart height={190} />}
        </ChartCard>

        <ChartCard title="Horas más reservadas" subtitle="Franja horaria de inicio" icon={Clock} iconBg="bg-indigo-50" iconColor="text-indigo-600">
          {isLoading ? <Skeleton className="h-44" /> : hourStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={hourStats} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Reservas']} />
                <Bar dataKey="count" fill={HOUR_COLOR} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart height={190} />}
        </ChartCard>
      </div>

      {/* ── Ranking de canchas ── */}
      {(isLoading || courtStats.length > 0) && (
        <ChartCard title="Rendimiento por cancha" subtitle="Ordenado por ingresos" icon={Award} iconBg="bg-pink-50" iconColor="text-pink-600">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {courtStats.map((c, i) => {
                const pct = courtStats[0]?.revenue > 0 ? Math.round(c.revenue / courtStats[0].revenue * 100) : 0;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-300 w-5 text-right shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-sm font-bold text-gray-800 truncate">{c.name}</span>
                        <span className="text-xs font-black text-emerald-600 shrink-0">{fmt(c.revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-lime-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-gray-400">{c.bookings} reservas</span>
                        <span className="text-[10px] text-green-500">{c.confirmed} confirmadas</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      )}

    </div>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div className={`flex items-center justify-center text-gray-300 text-sm`} style={{ height }}>
      Sin datos suficientes aún
    </div>
  );
}
