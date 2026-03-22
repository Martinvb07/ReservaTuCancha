'use client';

import { useState } from 'react';
import { CreditCard, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, ChevronRight, Download } from 'lucide-react';

const MOCK_PAGOS = [
  { id: '1', cancha: 'SuperCampeones', cliente: 'Juan Pérez',     fecha: '19 Mar 2026', hora: '10:00 AM', monto: 100000, estado: 'pagado'    },
  { id: '2', cancha: 'SuperCampeones', cliente: 'María López',    fecha: '18 Mar 2026', hora: '3:00 PM',  monto: 100000, estado: 'pagado'    },
  { id: '3', cancha: 'SuperCampeones', cliente: 'Carlos Gómez',   fecha: '17 Mar 2026', hora: '6:00 PM',  monto: 100000, estado: 'pagado'    },
  { id: '4', cancha: 'SuperCampeones', cliente: 'Ana Rodríguez',  fecha: '16 Mar 2026', hora: '8:00 AM',  monto: 100000, estado: 'pendiente' },
  { id: '5', cancha: 'SuperCampeones', cliente: 'Luis Martínez',  fecha: '15 Mar 2026', hora: '4:00 PM',  monto: 100000, estado: 'reembolso' },
];

const STATS = [
  { label: 'Ingresos del mes',    value: '$300.000',  sub: '3 reservas pagadas',    icon: DollarSign,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Pendiente de cobro',  value: '$100.000',  sub: '1 reserva pendiente',   icon: Clock,       color: 'text-yellow-600',  bg: 'bg-yellow-50'  },
  { label: 'Reembolsado',         value: '$100.000',  sub: '1 cancelación',         icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50'     },
  { label: 'Total acumulado',     value: '$300.000',  sub: 'Desde el inicio',       icon: TrendingUp,  color: 'text-blue-600',    bg: 'bg-blue-50'    },
];

const ESTADO_STYLES: Record<string, string> = {
  pagado:    'bg-green-100 text-green-700',
  pendiente: 'bg-yellow-100 text-yellow-700',
  reembolso: 'bg-red-100 text-red-600',
};

export default function OwnerPagosPage() {
  const [tab, setTab] = useState<'todos' | 'pagado' | 'pendiente' | 'reembolso'>('todos');

  const filtered = tab === 'todos' ? MOCK_PAGOS : MOCK_PAGOS.filter(p => p.estado === tab);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
            <span>✦</span> Panel Propietario
          </p>
          <h1 className="text-3xl font-black text-gray-900 uppercase">Pagos</h1>
          <p className="text-gray-500 text-sm mt-1">Historial de cobros y estado de tus reservas</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Aviso retiro */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-black text-gray-900">Saldo disponible para retiro</p>
            <p className="text-sm text-gray-500">Los pagos se acreditan 1-3 días hábiles después de la reserva</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-green-700">$300.000</p>
          <button className="mt-1 text-xs font-bold text-green-700 hover:underline flex items-center gap-1 ml-auto">
            Solicitar retiro <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['todos', 'pagado', 'pendiente', 'reembolso'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all capitalize ${
              tab === t
                ? 'bg-gray-900 border-gray-900 text-white'
                : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {t === 'todos' ? 'Todos' : t === 'pagado' ? '✅ Pagados' : t === 'pendiente' ? '⏳ Pendientes' : '↩️ Reembolsos'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{filtered.length} transacciones</p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-black text-gray-400 uppercase text-sm">No hay transacciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  p.estado === 'pagado' ? 'bg-green-100' : p.estado === 'pendiente' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {p.estado === 'pagado'
                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                    : p.estado === 'pendiente'
                    ? <Clock className="h-4 w-4 text-yellow-600" />
                    : <XCircle className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{p.cliente}</p>
                  <p className="text-xs text-gray-400">{p.cancha} · {p.fecha} {p.hora}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-gray-900">${p.monto.toLocaleString('es-CO')}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_STYLES[p.estado]}`}>
                    {p.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}