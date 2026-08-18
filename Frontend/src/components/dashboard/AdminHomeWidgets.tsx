'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiAuth } from '@/hooks/useApiAuth';
import Link from 'next/link';
import {
  Users, UserCheck, FileText, Zap,
  ArrowUpRight, TrendingUp, TrendingDown, Minus,
  ChevronRight, Clock, CheckCircle, XCircle, Bell, BarChart3,
  CreditCard, AlertCircle,
} from 'lucide-react';
import {
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api/axios';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
}

const TREND: Record<string, { icon: any; cls: string }> = {
  up:      { icon: TrendingUp,   cls: 'text-green-600' },
  down:    { icon: TrendingDown, cls: 'text-red-500' },
  warn:    { icon: AlertCircle,  cls: 'text-orange-500' },
  neutral: { icon: Minus,        cls: 'text-slate-400' },
};

// ─── Component ───────────────────────────────────────────────────────────────
// Inicio del panel ADMIN (dueño del SaaS): solo métricas de la plataforma
// — clientes/propietarios, solicitudes y suscripciones. NO se muestra info
// privada de los clubes (reservas, canchas, ingresos de los owners).
export function AdminHomeWidgets() {
  const session = useApiAuth();
  const token = (session as any)?.accessToken;

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ['admin-stats'],
    queryFn: async () => { const { data } = await api.get('/analytics/admin'); return data; },
    enabled: !!token,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // ── KPIs — solo plataforma ───────────────────────────────────────────────────
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
      title: 'Clientes activos',
      value: stats.activeOwners ?? 0,
      change: `de ${stats.totalOwners ?? 0} totales`,
      trend: 'neutral',
      icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50',
      href: '/dashboard/admin/usuarios',
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
      title: 'Suscripciones activas',
      value: stats.activeSubs ?? 0,
      change: `${stats.totalOwners ?? 0} clientes`,
      trend: 'neutral',
      icon: Zap, color: 'text-green-600', bg: 'bg-green-50',
      href: '/dashboard/admin/liquidacion',
    },
    {
      title: 'En trial',
      value: stats.trialSubs ?? 0,
      change: 'en periodo de prueba',
      trend: 'neutral',
      icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50',
      href: '/dashboard/admin/liquidacion',
    },
    {
      title: 'Vencidas',
      value: stats.estadoCounts?.vencida ?? 0,
      change: `${stats.estadoCounts?.cancelada ?? 0} canceladas`,
      trend: (stats.estadoCounts?.vencida ?? 0) > 0 ? 'warn' : 'neutral',
      icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50',
      href: '/dashboard/admin/liquidacion',
    },
  ];

  // ── Suscripciones por estado (pie) ───────────────────────────────────────────
  const estadoData = [
    { name: 'Activas',    value: stats.estadoCounts?.activa ?? 0,    color: '#22c55e' },
    { name: 'Trial',      value: stats.estadoCounts?.trial ?? 0,     color: '#eab308' },
    { name: 'Vencidas',   value: stats.estadoCounts?.vencida ?? 0,   color: '#ef4444' },
    { name: 'Canceladas', value: stats.estadoCounts?.cancelada ?? 0, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  // ── Owners por plan ──────────────────────────────────────────────────────────
  const planData = [
    { name: 'Básico',      value: stats.planCounts?.basico ?? 0,      color: '#94a3b8' },
    { name: 'Pro',         value: stats.planCounts?.pro ?? 0,         color: '#3b82f6' },
    { name: 'Empresarial', value: stats.planCounts?.empresarial ?? 0, color: '#a855f7' },
  ].filter(d => d.value > 0);

  // ── Quick actions (navegación) ───────────────────────────────────────────────
  const quickActions = [
    { href: '/dashboard/admin/solicitudes',  label: 'Solicitudes',   desc: `${stats.pendingSolicitudes ?? 0} pendientes`,  icon: FileText,  color: 'bg-lime-400',   text: 'text-gray-900', hot: (stats.pendingSolicitudes ?? 0) > 0 },
    { href: '/dashboard/admin/usuarios',     label: 'Usuarios',      desc: `${stats.activeOwners ?? 0} activos`,           icon: Users,     color: 'bg-blue-600',   text: 'text-white',    hot: false },
    { href: '/dashboard/admin/liquidacion',label: 'Liquidación',   desc: 'Pagos a los clubes',                               icon: CreditCard,color: 'bg-yellow-500', text: 'text-white',    hot: false },
    { href: '/dashboard/admin/cambios',      label: 'Changelog',     desc: 'Notificar a owners',                           icon: Bell,      color: 'bg-purple-600', text: 'text-white',    hot: false },
    { href: '/dashboard/admin/reportes',     label: 'Reportes',      desc: 'Métricas globales',                            icon: BarChart3, color: 'bg-slate-800',  text: 'text-white',    hot: false },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map(k => {
          const t = TREND[k.trend] ?? TREND.neutral;
          return (
            <Link key={k.title} href={k.href}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 p-4 hover:shadow-md hover:border-slate-200 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl ${k.bg} grid place-items-center`}>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight mt-3">{k.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 leading-tight">{k.title}</p>
              <p className={`flex items-center gap-1 text-[10px] font-semibold mt-1.5 ${t.cls}`}>
                <t.icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{k.change}</span>
              </p>
            </Link>
          );
        })}
      </div>

      {/* ── Acciones rápidas ─────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href}
              className={`group relative ${a.color} ${a.text} rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden`}
            >
              {a.hot && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-white rounded-full animate-pulse" />}
              <div className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center shrink-0">
                <a.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-sm leading-tight">{a.label}</p>
                <p className="text-[11px] opacity-80 mt-0.5 leading-tight truncate">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Desglose SaaS: estado · planes · solicitudes ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Suscripciones por estado */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 p-4 sm:p-5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Suscripciones por estado</h3>
          {estadoData.length > 0 ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={estadoData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                      {estadoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [Number(v), '']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
                {estadoData.map(d => (
                  <span key={d.name} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 grid place-items-center text-xs text-slate-400">Aún no hay suscripciones</div>
          )}
        </div>

        {/* Owners por plan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 p-4 sm:p-5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Propietarios por plan</h3>
          {planData.length > 0 ? (
            <div className="space-y-3">
              {planData.map(p => {
                const total = planData.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">{p.name}</span>
                      <span className="text-xs text-slate-400">{p.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 grid place-items-center text-xs text-slate-400">Aún no hay propietarios</div>
          )}
        </div>

        {/* Solicitudes recientes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-50">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Solicitudes recientes</h3>
            <Link href="/dashboard/admin/solicitudes" className="text-[11px] text-green-600 font-bold hover:underline flex items-center gap-1">
              Ver todo <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(stats.recentSolicitudes ?? []).slice(0, 5).map((s: any, i: number) => (
              <div key={`sol-${i}`} className="flex items-start gap-3 px-4 sm:px-5 py-3">
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
                  <p className="text-xs text-slate-700 leading-snug truncate">
                    {s.estado === 'pendiente' ? 'Solicitud' : s.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}: &quot;{s.businessName}&quot;
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />{timeAgo(s.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {(stats.recentSolicitudes ?? []).length === 0 && (
              <div className="px-4 py-10 text-center text-xs text-slate-400">Sin solicitudes recientes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
