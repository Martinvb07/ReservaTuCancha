'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users, UserCheck, Zap, FileText, ArrowUpRight,
  TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import api from '@/lib/api/axios';

const TREND: Record<string, { icon: any; cls: string }> = {
  up:      { icon: TrendingUp,   cls: 'text-green-600' },
  down:    { icon: TrendingDown, cls: 'text-red-500' },
  warn:    { icon: AlertCircle,  cls: 'text-orange-500' },
  neutral: { icon: Minus,        cls: 'text-slate-400' },
};

export default function AdminReportesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reportes'],
    queryFn: async () => {
      const [global, monthly] = await Promise.all([
        api.get('/analytics/admin'),
        api.get('/analytics/admin/monthly'),
      ]);
      return { global: global.data, monthly: monthly.data };
    },
  });

  const g       = data?.global  ?? {};
  const monthly = data?.monthly ?? [];

  const KPIS = [
    { label: 'Propietarios',          value: g.totalOwners ?? 0,        change: `+${g.newOwnersThisMonth ?? 0} este mes`, trend: (g.newOwnersThisMonth ?? 0) > 0 ? 'up' : 'neutral', icon: Users,     color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { label: 'Clientes activos',      value: g.activeOwners ?? 0,       change: `de ${g.totalOwners ?? 0} totales`,       trend: 'neutral',                                          icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Suscripciones activas', value: g.activeSubs ?? 0,         change: `${g.trialSubs ?? 0} en trial`,           trend: 'neutral',                                          icon: Zap,       color: 'text-green-600',   bg: 'bg-green-50'   },
    { label: 'Solicitudes pendientes',value: g.pendingSolicitudes ?? 0, change: `${g.totalSolicitudes ?? 0} totales`,     trend: (g.pendingSolicitudes ?? 0) > 0 ? 'warn' : 'neutral', icon: FileText,  color: 'text-orange-600',  bg: 'bg-orange-50'  },
  ];

  const estadoData = [
    { name: 'Activas',    value: g.estadoCounts?.activa ?? 0,    color: '#22c55e' },
    { name: 'Trial',      value: g.estadoCounts?.trial ?? 0,     color: '#eab308' },
    { name: 'Vencidas',   value: g.estadoCounts?.vencida ?? 0,   color: '#ef4444' },
    { name: 'Canceladas', value: g.estadoCounts?.cancelada ?? 0, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const planData = [
    { name: 'Básico',      value: g.planCounts?.basico ?? 0,      color: '#94a3b8' },
    { name: 'Pro',         value: g.planCounts?.pro ?? 0,         color: '#3b82f6' },
    { name: 'Empresarial', value: g.planCounts?.empresarial ?? 0, color: '#a855f7' },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Administración
        </p>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Reportes</h1>
        <p className="text-slate-500 text-sm mt-1">Métricas de la plataforma — clientes y reservas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map(k => {
          const t = TREND[k.trend] ?? TREND.neutral;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 p-5 hover:shadow-md hover:border-slate-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${k.bg} grid place-items-center`}>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{isLoading ? '—' : k.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{k.label}</p>
              <p className={`flex items-center gap-1 text-[10px] font-semibold mt-1.5 ${t.cls}`}>
                <t.icon className="h-3 w-3 shrink-0" />
                <span className="truncate">{k.change}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Nuevos propietarios por mes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nuevos propietarios por mes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Crecimiento de clientes en la plataforma</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-green-50 grid place-items-center">
            <BarChart3 className="h-4 w-4 text-green-600" />
          </div>
        </div>
        {isLoading ? (
          <div className="h-56 bg-slate-50 rounded-xl animate-pulse" />
        ) : monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="monthShort" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                cursor={{ fill: '#f8fafc' }}
                formatter={(v: any) => [Number(v), 'Propietarios']}
              />
              <Bar dataKey="owners" fill="#22c55e" radius={[6, 6, 0, 0]} name="Propietarios" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-56 grid place-items-center text-slate-400 text-sm">No hay datos suficientes aún</div>
        )}
      </div>

      {/* Suscripciones por estado + Propietarios por plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Estado */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 p-4 sm:p-6">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Suscripciones por estado</h2>
          {estadoData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={estadoData} cx="50%" cy="50%" innerRadius={42} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {estadoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [Number(v), '']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {estadoData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 grid place-items-center text-slate-400 text-sm">Aún no hay suscripciones</div>
          )}
        </div>

        {/* Plan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 p-4 sm:p-6">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Propietarios por plan</h2>
          {planData.length > 0 ? (
            <div className="space-y-4 pt-1">
              {planData.map(p => {
                const total = planData.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-700">{p.name}</span>
                      <span className="text-xs text-slate-400">{p.value} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-44 grid place-items-center text-slate-400 text-sm">Aún no hay propietarios</div>
          )}
        </div>
      </div>

    </div>
  );
}
