'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, Pause, Play, Trash2, UserPlus, UsersRound, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Persona {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40';

const errorDe = (e: any, porDefecto: string) => {
  const msg = e?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || porDefecto;
};

export default function EquipoPage() {
  const session = useApiAuth();
  const esStaff = !!(session as any)?.user?.esStaff;
  const queryClient = useQueryClient();
  const [nuevo, setNuevo] = useState({ name: '', email: '', phone: '' });
  const [aQuitar, setAQuitar] = useState<Persona | null>(null);

  const { data: equipo = [], isLoading } = useQuery<Persona[]>({
    queryKey: ['equipo'],
    queryFn: async () => (await api.get('/equipo')).data,
    enabled: !!(session as any)?.accessToken && !esStaff,
  });
  const refrescar = () => queryClient.invalidateQueries({ queryKey: ['equipo'] });

  const invitar = useMutation({
    mutationFn: async () => (await api.post('/equipo', {
      name: nuevo.name.trim(), email: nuevo.email.trim(), phone: nuevo.phone.trim() || undefined,
    })).data,
    onSuccess: () => {
      toast.success('Listo: le enviamos el acceso por correo');
      setNuevo({ name: '', email: '', phone: '' });
      refrescar();
    },
    onError: (e) => toast.error(errorDe(e, 'No se pudo dar el acceso')),
  });

  const acceso = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => api.patch(`/equipo/${id}/acceso`, { activo }),
    onSuccess: (_, v) => { toast.success(v.activo ? 'Acceso reactivado' : 'Acceso pausado'); refrescar(); },
    onError: (e) => toast.error(errorDe(e, 'No se pudo cambiar el acceso')),
  });

  const clave = useMutation({
    mutationFn: (id: string) => api.post(`/equipo/${id}/clave`),
    onSuccess: () => toast.success('Le enviamos una clave nueva por correo'),
    onError: (e) => toast.error(errorDe(e, 'No se pudo generar la clave')),
  });

  const quitar = useMutation({
    mutationFn: (id: string) => api.delete(`/equipo/${id}`),
    onSuccess: () => { toast.success('Persona quitada del equipo'); refrescar(); },
    onError: (e) => toast.error(errorDe(e, 'No se pudo quitar')),
  });

  if (esStaff) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <ShieldCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="font-black text-gray-500 text-sm">Solo el dueño del club gestiona el equipo</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <p className="text-lime-600 font-semibold text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          Panel Propietario
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Equipo</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-2xl">
          Dale acceso al panel a quien te ayuda en el club. Cada persona entra con su correo y puede ver y anotar
          reservas, bloquear horarios y escanear los QR. No puede ver tus pagos, cambiar tu cuenta de ePayco, borrar
          canchas ni tocar el equipo.
        </p>
      </div>

      <form
        className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-3"
        onSubmit={(e) => { e.preventDefault(); if (nuevo.name.trim().length >= 2 && nuevo.email.includes('@')) invitar.mutate(); }}
      >
        <p className="flex items-center gap-2 font-black text-gray-900 text-sm">
          <UserPlus className="h-4 w-4 text-green-600" /> Dar acceso
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          <input className={inp} placeholder="Nombre" value={nuevo.name} onChange={(e) => setNuevo({ ...nuevo, name: e.target.value })} />
          <input className={inp} type="email" placeholder="Correo" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} />
          <input className={inp} type="tel" placeholder="Celular (opcional)" value={nuevo.phone} onChange={(e) => setNuevo({ ...nuevo, phone: e.target.value })} />
        </div>
        <button type="submit" disabled={invitar.isPending}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
          {invitar.isPending ? 'Enviando…' : 'Enviar acceso'}
        </button>
        <p className="text-[11px] text-gray-500">Le llega un correo con una clave temporal. Hasta 10 personas por club.</p>
      </form>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : equipo.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <UsersRound className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-black text-gray-500 text-xs">Todavía no hay nadie en tu equipo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {equipo.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-gray-900 text-sm">{p.name}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Activo' : 'Pausado'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>
                <p className="text-[11px] text-gray-500">
                  {p.lastLoginAt ? `Último ingreso: ${new Date(p.lastLoginAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Aún no ha entrado'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => acceso.mutate({ id: p._id, activo: !p.isActive })} title={p.isActive ? 'Pausar acceso' : 'Reactivar'}
                  className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl">
                  {p.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {p.isActive ? 'Pausar' : 'Reactivar'}
                </button>
                <button onClick={() => clave.mutate(p._id)} title="Enviar clave nueva"
                  className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl">
                  <KeyRound className="h-3.5 w-3.5" /> Clave
                </button>
                <button onClick={() => setAQuitar(p)} title="Quitar" aria-label={`Quitar a ${p.name}`}
                  className="flex items-center border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-xl">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!aQuitar} onOpenChange={(v) => { if (!v) setAQuitar(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar a {aQuitar?.name} del equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Ya no podrá entrar al panel del club. Si cambias de idea, tendrás que volver a darle acceso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { if (aQuitar) quitar.mutate(aQuitar._id); setAQuitar(null); }}
            >
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
