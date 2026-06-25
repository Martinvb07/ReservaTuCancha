'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, CheckCircle, XCircle, Clock, Crown, AlertCircle, X } from 'lucide-react';
import api from '@/lib/api/axios';
import { toast } from 'sonner';

type Plan = 'basico' | 'pro' | 'empresarial';
type Estado = 'activa' | 'vencida' | 'trial' | 'cancelada';

const PLANES: Record<Plan, { label: string; price: string; pill: string; accent: string }> = {
  basico:      { label: 'Básico',      price: 'Gratis',    pill: 'bg-slate-100 text-slate-600',     accent: 'text-slate-500'  },
  pro:         { label: 'Pro',         price: '$149.000',  pill: 'bg-blue-100 text-blue-700',       accent: 'text-blue-600'   },
  empresarial: { label: 'Empresarial', price: 'A medida',  pill: 'bg-purple-100 text-purple-700',   accent: 'text-purple-600' },
};

const ESTADOS: Record<Estado, { label: string; icon: any; pill: string; ring: string }> = {
  activa:    { label: 'Activa',    icon: CheckCircle, pill: 'bg-green-100 text-green-700',   ring: 'border-green-500 bg-green-50 text-green-700'    },
  vencida:   { label: 'Vencida',   icon: XCircle,     pill: 'bg-red-100 text-red-600',       ring: 'border-red-500 bg-red-50 text-red-600'          },
  trial:     { label: 'Trial',     icon: Clock,       pill: 'bg-orange-100 text-orange-700', ring: 'border-orange-500 bg-orange-50 text-orange-700' },
  cancelada: { label: 'Cancelada', icon: XCircle,     pill: 'bg-slate-100 text-slate-500',   ring: 'border-slate-400 bg-slate-50 text-slate-600'    },
};

const PLAN_FILTERS: { key: string; label: string }[] = [
  { key: '',            label: 'Todos'       },
  { key: 'basico',      label: 'Básico'      },
  { key: 'pro',         label: 'Pro'         },
  { key: 'empresarial', label: 'Empresarial' },
];

// ─── Modal: gestionar suscripción ────────────────────────────────────────────
function CambiarPlanModal({ user, onClose, onSave, saving }: { user: any; onClose: () => void; onSave: (plan: Plan, estado: Estado) => void; saving: boolean }) {
  const [plan, setPlan]     = useState<Plan>(user.plan ?? 'basico');
  const [estado, setEstado] = useState<Estado>(user.estado ?? user.subscriptionEstado ?? 'activa');

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Gestionar suscripción</h2>
            <p className="text-slate-500 text-sm mt-0.5 truncate">{user.name} · {user.email}</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Plan */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plan</label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(PLANES) as [Plan, typeof PLANES[Plan]][]).map(([key, p]) => {
              const active = plan === key;
              return (
                <button key={key} type="button" onClick={() => setPlan(key)}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 transition-all ${active ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <Crown className={`h-4 w-4 ${active ? 'text-green-600' : p.accent}`} />
                  <span className="text-xs font-black text-slate-800">{p.label}</span>
                  <span className="text-[10px] text-slate-400">{p.price}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(ESTADOS) as [Estado, typeof ESTADOS[Estado]][]).map(([key, e]) => {
              const active = estado === key;
              const Icon = e.icon;
              return (
                <button key={key} type="button" onClick={() => setEstado(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${active ? e.ring : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? '' : 'text-slate-400'}`} />
                  {e.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3 rounded-xl transition-all">
            Cancelar
          </button>
          <button onClick={() => onSave(plan, estado)} disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-3 rounded-xl transition-colors">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminSuscripcionesPage() {
  const [search, setSearch]     = useState('');
  const [planFilter, setPlan]   = useState('');
  const [selected, setSelected] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-suscripciones'],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { role: 'owner', limit: 100 } });
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: ({ id, plan, estado }: { id: string; plan: string; estado: string }) =>
      api.patch(`/users/${id}/subscription`, { plan, estado }),
    onSuccess: () => {
      toast.success('Suscripción actualizada');
      queryClient.invalidateQueries({ queryKey: ['admin-suscripciones'] });
      setSelected(null);
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const users: any[] = Array.isArray(data) ? data : (data?.data ?? []);

  const norm = (u: any): Estado => (u.estado ?? u.subscriptionEstado ?? 'activa') as Estado;

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter ? u.plan === planFilter : true;
    return matchSearch && matchPlan;
  });

  const kpis = [
    { label: 'Plan Pro',    value: users.filter(u => u.plan === 'pro').length,         icon: Crown,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Empresarial', value: users.filter(u => u.plan === 'empresarial').length, icon: Crown,       color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'En trial',    value: users.filter(u => norm(u) === 'trial').length,      icon: Clock,       color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Vencidas',    value: users.filter(u => norm(u) === 'vencida').length,    icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50'    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Administración
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Suscripciones</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona los planes de todos los propietarios</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{k.label}</p>
              <div className={`w-8 h-8 rounded-lg ${k.bg} grid place-items-center`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-2">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre o email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/15" />
        </div>
        <div className="flex flex-wrap gap-2">
          {PLAN_FILTERS.map(f => {
            const active = planFilter === f.key;
            return (
              <button key={f.key} onClick={() => setPlan(f.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                  active ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Zap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-black text-slate-400 uppercase text-sm">No hay resultados</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((user: any) => {
            const plan   = PLANES[user.plan as Plan] ?? PLANES.basico;
            const estado = ESTADOS[norm(user)] ?? ESTADOS.activa;
            const EstadoIcon = estado.icon;
            return (
              <div key={user._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 hover:border-green-200 hover:shadow-md transition-all p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-green-600 grid place-items-center text-white font-black text-sm shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-sm">{user.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${plan.pill}`}>
                        {plan.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${estado.pill}`}>
                        <EstadoIcon className="h-2.5 w-2.5" />{estado.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
                    {user.subscriptionEndsAt && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Vence: {new Date(user.subscriptionEndsAt).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>

                  {/* Precio + acción */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-black text-slate-900 text-sm">{plan.price}</p>
                      <p className="text-[10px] text-slate-400">/ mes</p>
                    </div>
                    <button onClick={() => setSelected(user)}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all">
                      <Zap className="h-3.5 w-3.5" /> Gestionar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <CambiarPlanModal
            key="sub-modal"
            user={selected}
            saving={mutation.isPending}
            onClose={() => setSelected(null)}
            onSave={(plan, estado) => mutation.mutate({ id: selected._id, plan, estado })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
