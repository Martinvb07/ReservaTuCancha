'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Ban, CalendarX2, Crown, Phone, Search, ShieldCheck, Users, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PillTabs from '@/components/ui/PillTabs';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Cliente {
  clave: string;
  nombre: string;
  telefono: string;
  email: string;
  reservas: number;
  gastado: number;
  noShows: number;
  primeraReserva: string;
  ultimaReserva: string;
  bloqueado: boolean;
  bloqueoId?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const errorDe = (e: any, porDefecto: string) => {
  const msg = e?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || porDefecto;
};

/** Frecuente: 5 reservas o más. */
const FRECUENTE = 5;
const TABS = ['Todos', 'Frecuentes', 'Con faltas', 'Bloqueados'];

export default function ClientesPage() {
  const session = useApiAuth();
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState('Todos');
  const [buscar, setBuscar] = useState('');
  const [aBloquear, setABloquear] = useState<Cliente | null>(null);

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['owner-clientes'],
    queryFn: async () => (await api.get('/bookings/owner/clientes')).data,
    enabled: !!(session as any)?.accessToken,
  });
  const refrescar = () => queryClient.invalidateQueries({ queryKey: ['owner-clientes'] });

  const bloquear = useMutation({
    mutationFn: (c: Cliente) => api.post('/bookings/owner/clientes/bloqueos', {
      telefono: c.telefono || undefined,
      email: c.email || undefined,
      nombre: c.nombre || undefined,
      motivo: c.noShows > 0 ? `No llegó ${c.noShows} ${c.noShows === 1 ? 'vez' : 'veces'}` : undefined,
    }),
    onSuccess: () => { toast.success('Cliente bloqueado: ya no puede reservarte en línea'); refrescar(); },
    onError: (e) => toast.error(errorDe(e, 'No se pudo bloquear')),
  });
  const desbloquear = useMutation({
    mutationFn: (id: string) => api.delete(`/bookings/owner/clientes/bloqueos/${id}`),
    onSuccess: () => { toast.success('Bloqueo quitado'); refrescar(); },
    onError: (e) => toast.error(errorDe(e, 'No se pudo quitar el bloqueo')),
  });

  const resumen = useMemo(() => ({
    total: clientes.filter((c) => c.reservas > 0).length,
    frecuentes: clientes.filter((c) => c.reservas >= FRECUENTE).length,
    conFaltas: clientes.filter((c) => c.noShows > 0).length,
    ingresos: clientes.reduce((acc, c) => acc + c.gastado, 0),
  }), [clientes]);

  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return clientes
      .filter((c) =>
        tab === 'Frecuentes' ? c.reservas >= FRECUENTE
        : tab === 'Con faltas' ? c.noShows > 0
        : tab === 'Bloqueados' ? c.bloqueado
        : true)
      .filter((c) => !q || c.nombre.toLowerCase().includes(q) || c.telefono.includes(q.replace(/\D/g, '') || '§') || c.email.includes(q));
  }, [clientes, tab, buscar]);

  const TARJETAS = [
    { icon: Users,      label: 'Clientes',        valor: String(resumen.total),      color: 'bg-green-50 text-green-600' },
    { icon: Crown,      label: 'Frecuentes',      valor: String(resumen.frecuentes), color: 'bg-amber-50 text-amber-600' },
    { icon: CalendarX2, label: 'Con faltas',      valor: String(resumen.conFaltas),  color: 'bg-red-50 text-red-500' },
    { icon: Wallet,     label: 'Te han dejado',   valor: cop(resumen.ingresos),      color: 'bg-blue-50 text-blue-600' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <p className="text-lime-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-1">Panel Propietario</p>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Clientes</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-2xl">
          Quiénes te reservan, cuánto te han dejado y quién no llegó a su turno. Las faltas las marcas desde
          Reservas, abriendo la reserva.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TARJETAS.map((t, i) => (
          <motion.div
            key={t.label}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
            className="bg-white rounded-2xl border border-gray-100 p-4"
          >
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${t.color}`}><t.icon className="h-4 w-4" /></span>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">{t.label}</p>
            {isLoading
              ? <Skeleton className="mt-1 h-7 w-20 rounded-lg" />
              : <p className="text-xl sm:text-2xl font-black text-gray-900 tabular-nums">{t.valor}</p>}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <PillTabs id="clientes-tabs" tabs={TABS} active={tab} onChange={setTab} className="!justify-start" />
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre, celular o correo"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : visibles.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-black text-gray-500 text-xs">
            {clientes.length === 0 ? 'Aún no tienes clientes: aparecen con la primera reserva' : 'Nadie coincide con ese filtro'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {visibles.map((c, i) => (
              <motion.div
                key={c.clave}
                layout={!reduce}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03, ease: EASE }}
                className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors duration-200 ${
                  c.bloqueado ? 'border-red-200' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black ${
                  c.bloqueado ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-700'
                }`}>
                  {(c.nombre || '?').trim().charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-gray-900 text-sm">{c.nombre || 'Sin nombre'}</span>
                    {c.reservas >= FRECUENTE && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        <Crown className="h-3 w-3" /> Frecuente
                      </span>
                    )}
                    {c.noShows > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
                        No llegó {c.noShows} {c.noShows === 1 ? 'vez' : 'veces'}
                      </span>
                    )}
                    {c.bloqueado && (
                      <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-bold text-white">Bloqueado</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {[c.telefono, c.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {c.reservas > 0 ? `Última reserva: ${fecha(c.ultimaReserva)}` : 'Sin reservas registradas'}
                  </p>
                </div>

                <div className="flex items-center gap-5 sm:gap-6">
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Reservas</p>
                    <p className="font-black text-gray-900 tabular-nums">{c.reservas}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Te dejó</p>
                    <p className="font-black text-green-700 tabular-nums">{cop(c.gastado)}</p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {c.telefono && (
                    <a href={`tel:${c.telefono}`} title="Llamar" aria-label={`Llamar a ${c.nombre}`}
                      className="flex items-center border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {c.bloqueado ? (
                    <button onClick={() => c.bloqueoId && desbloquear.mutate(c.bloqueoId)} disabled={desbloquear.isPending}
                      className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                      <ShieldCheck className="h-3.5 w-3.5" /> Desbloquear
                    </button>
                  ) : (c.telefono || c.email) ? (
                    <button onClick={() => setABloquear(c)}
                      className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                      <Ban className="h-3.5 w-3.5" /> Bloquear
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AlertDialog open={!!aBloquear} onOpenChange={(v) => { if (!v) setABloquear(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Bloquear a {aBloquear?.nombre || 'este cliente'}?</AlertDialogTitle>
            <AlertDialogDescription>
              No podrá reservar en línea en tus canchas con ese celular o correo. Tú sí puedes seguir anotándole
              reservas a mano, y puedes quitar el bloqueo cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { if (aBloquear) bloquear.mutate(aBloquear); setABloquear(null); }}
            >
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
