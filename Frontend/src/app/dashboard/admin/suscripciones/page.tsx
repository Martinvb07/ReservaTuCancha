'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Zap, CheckCircle, XCircle, Clock, ChevronDown, Crown } from 'lucide-react';
import api from '@/lib/api/axios';
import { toast } from 'sonner';

type Plan = 'basico' | 'pro' | 'empresarial';
type Estado = 'activa' | 'vencida' | 'trial' | 'cancelada';

const PLANES: Record<Plan, { label: string; color: string; bg: string; price: string }> = {
  basico:      { label: 'Básico',      color: 'text-gray-600',   bg: 'bg-gray-100',    price: 'Gratis'    },
  pro:         { label: 'Pro',         color: 'text-blue-700',   bg: 'bg-blue-100',    price: '$149.000'  },
  empresarial: { label: 'Empresarial', color: 'text-purple-700', bg: 'bg-purple-100',  price: 'A medida'  },
};

const ESTADOS: Record<Estado, { label: string; color: string; bg: string; icon: any }> = {
  activa:    { label: 'Activa',    color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  vencida:   { label: 'Vencida',   color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle     },
  trial:     { label: 'Trial',     color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock       },
  cancelada: { label: 'Cancelada', color: 'text-gray-500',   bg: 'bg-gray-100',   icon: XCircle     },
};

// Modal para cambiar plan
function CambiarPlanModal({ user, onClose, onSave }: { user: any; onClose: () => void; onSave: (plan: Plan, estado: Estado) => void }) {
  const [plan, setPlan]     = useState<Plan>(user.plan ?? 'basico');
  const [estado, setEstado] = useState<Estado>(user.estado ?? 'activa');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase">Gestionar suscripción</h2>
          <p className="text-gray-500 text-sm mt-1">{user.name} · {user.email}</p>
        </div>

        {/* Plan */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Plan</label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(PLANES) as [Plan, any][]).map(([key, p]) => (
              <button key={key} type="button" onClick={() => setPlan(key)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${plan === key ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
              >
                <Crown className={`h-4 w-4 ${plan === key ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-xs font-black text-gray-800">{p.label}</span>
                <span className="text-[10px] text-gray-400">{p.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Estado</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(ESTADOS) as [Estado, any][]).map(([key, e]) => (
              <button key={key} type="button" onClick={() => setEstado(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${estado === key ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'}`}
              >
                <e.icon className="h-4 w-4 shrink-0" />
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl transition-all">
            Cancelar
          </button>
          <button onClick={() => onSave(plan, estado)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-colors">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSuscripcionesPage() {
  const [search, setSearch]   = useState('');
  const [planFilter, setPlan] = useState('');
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

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter ? u.plan === planFilter : true;
    return matchSearch && matchPlan;
  });

  // Stats rápidos
  const totalPro         = users.filter(u => u.plan === 'pro').length;
  const totalEmpresarial = users.filter(u => u.plan === 'empresarial').length;
  const totalTrial       = users.filter(u => u.estado === 'trial').length;
  const totalVencidas    = users.filter(u => u.estado === 'vencida').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Administración
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Suscripciones</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona los planes de todos los propietarios</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Plan Pro',         value: totalPro,         color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Empresarial',      value: totalEmpresarial, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'En trial',         value: totalTrial,       color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Vencidas',         value: totalVencidas,    color: 'text-red-600',    bg: 'bg-red-50'    },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-3xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
        </div>
        <div className="relative">
          <select value={planFilter} onChange={e => setPlan(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 appearance-none pr-10 cursor-pointer">
            <option value="">Todos los planes</option>
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
            <option value="empresarial">Empresarial</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Zap className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-black text-gray-400 uppercase text-sm">No hay resultados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user: any) => {
            const plan   = PLANES[user.plan as Plan] ?? PLANES.basico;
            const estado = ESTADOS[user.estado as Estado] ?? ESTADOS.activa;
            const EstadoIcon = estado.icon;
            return (
              <div key={user._id} className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-lime-400 flex items-center justify-center text-gray-900 font-black text-sm shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-gray-900 text-sm">{user.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${plan.bg} ${plan.color}`}>
                        {plan.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${estado.bg} ${estado.color}`}>
                        <EstadoIcon className="h-2.5 w-2.5" />{estado.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
                    {user.subscriptionEndsAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Vence: {new Date(user.subscriptionEndsAt).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>

                  {/* Precio + acción */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-black text-gray-900 text-sm">{plan.price}</p>
                      <p className="text-[10px] text-gray-400">/ mes</p>
                    </div>
                    <button onClick={() => setSelected(user)}
                      className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">
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
      {selected && (
        <CambiarPlanModal
          user={selected}
          onClose={() => setSelected(null)}
          onSave={(plan, estado) => mutation.mutate({ id: selected._id, plan, estado })}
        />
      )}
    </div>
  );
}