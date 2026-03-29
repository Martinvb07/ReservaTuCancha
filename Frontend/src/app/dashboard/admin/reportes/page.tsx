'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarDays, DollarSign, Building2, Users, TrendingUp, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '@/lib/api/axios';

export default function AdminReportesPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [global, monthly] = await Promise.all([
        api.get('/analytics/admin'),
        api.get('/analytics/admin/monthly'),
      ]);
      return { global: global.data, monthly: monthly.data };
    },
  });

  const global  = stats?.global  ?? {};
  const monthly = stats?.monthly ?? [];

  const KPIS = [
    { label: 'Total reservas',     value: global.totalBookings  ?? 0,   icon: CalendarDays, color: 'text-blue-600',    bg: 'bg-blue-50',    change: '+12%' },
    { label: 'Ingresos totales',   value: `$${((global.totalRevenue ?? 0)/1000).toFixed(0)}K`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', change: '+8%' },
    { label: 'Propietarios',       value: global.totalOwners    ?? 0,   icon: Users,        color: 'text-purple-600',  bg: 'bg-purple-50',  change: `+${global.newOwners ?? 0}` },
    { label: 'Canchas activas',    value: global.totalCourts    ?? 0,   icon: Building2,    color: 'text-orange-600',  bg: 'bg-orange-50',  change: 'activas' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Administración
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Métricas globales de la plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">{k.label}</p>
              <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{isLoading ? '—' : k.value}</p>
            <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />{k.change}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfica reservas por mes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Reservas por mes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        {isLoading ? (
          <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
        ) : monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                cursor={{ fill: '#f9fafb' }}
              />
              <Bar dataKey="bookings" fill="#16a34a" radius={[6, 6, 0, 0]} name="Reservas" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            No hay datos suficientes aún
          </div>
        )}
      </div>

      {/* Gráfica ingresos por mes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-black text-gray-900 uppercase text-sm tracking-widest">Ingresos por mes (COP)</h2>
            <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
        {isLoading ? (
          <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
        ) : monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                formatter={(v: any) => [`$${Number(v).toLocaleString('es-CO')}`, 'Ingresos']}
              />
              <Line dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Ingresos" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            No hay datos suficientes aún
          </div>
        )}
      </div>

    </div>
  );
}