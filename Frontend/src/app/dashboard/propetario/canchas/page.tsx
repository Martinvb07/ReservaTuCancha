'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Star, Eye, Building2, Search, Filter, Plus, Edit, Power, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api/axios';

const SPORT_LABELS: Record<string, { label: string; emoji: string }> = {
  futbol:      { label: 'Fútbol',      emoji: '⚽' },
  padel:       { label: 'Pádel',       emoji: '🎾' },
  voley_playa: { label: 'Voley Playa', emoji: '🏐' },
};

export default function OwnerCanchasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch]         = useState('');
  const [sport, setSport]           = useState('');
  const [deleteCancha, setDelete]   = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-courts'],
    queryFn: async () => {
      const { data } = await api.get('/courts/owner/my-courts');
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/courts/${id}`, { isActive: undefined }), // toggle
    onSuccess: () => { toast.success('Estado actualizado'); queryClient.invalidateQueries({ queryKey: ['my-courts'] }); },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/courts/${id}`),
    onSuccess: () => { toast.success('Cancha eliminada'); queryClient.invalidateQueries({ queryKey: ['my-courts'] }); setDelete(null); },
    onError: () => toast.error('Error al eliminar'),
  });

  const courts  = data?.data ?? data ?? [];
  const filtered = courts.filter((c: any) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.location?.city?.toLowerCase().includes(search.toLowerCase());
    const matchSport  = sport ? c.sport === sport : true;
    return matchSearch && matchSport;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
            <span>✦</span> Panel Propietario
          </p>
          <h1 className="text-3xl font-black text-gray-900 uppercase">Mis canchas</h1>
          <p className="text-gray-500 text-sm mt-1">{courts.length} canchas registradas</p>
        </div>
        <Link
          href="/dashboard/propetario/canchas/nueva"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Nueva cancha
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o ciudad..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
        </div>
        <div className="relative">
          <select value={sport} onChange={e => setSport(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition appearance-none pr-10 cursor-pointer">
            <option value="">Todos los deportes</option>
            <option value="futbol">⚽ Fútbol</option>
            <option value="padel">🎾 Pádel</option>
            <option value="voley_playa">🏐 Voley Playa</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Skeletons */}
      {isLoading && <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-black text-gray-400 uppercase text-sm">No hay canchas</p>
          <p className="text-sm text-gray-400 mt-1">{search || sport ? 'Intenta con otros filtros' : 'Agrega tu primera cancha'}</p>
          <Link href="/dashboard/propetario/canchas/nueva"
            className="inline-flex items-center gap-2 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors">
            <Plus className="h-4 w-4" /> Nueva cancha
          </Link>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map((court: any) => {
          const s = SPORT_LABELS[court.sport] ?? { label: court.sport, emoji: '🏟️' };
          return (
            <div key={court._id} className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl shrink-0">{s.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-gray-900">{court.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${court.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {court.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{s.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{court.location?.city}, {court.location?.department}</span>
                    {court.totalReviews > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {court.averageRating?.toFixed(1)} ({court.totalReviews} reseñas)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="font-black text-green-700 text-base">${court.pricePerHour?.toLocaleString('es-CO')}</p>
                    <p className="text-[10px] text-gray-400">COP/hora</p>
                  </div>

                  {/* Ver — gris */}
                  <Link href={`/canchas/${court._id}`} target="_blank" title="Ver cancha pública"
                    className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
                    <Eye className="h-3.5 w-3.5" />
                  </Link>

                  {/* Editar — gris claro */}
                  <Link href={`/dashboard/propetario/canchas/${court._id}/editar`} title="Editar cancha"
                    className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
                    <Edit className="h-3.5 w-3.5" />
                  </Link>

                  {/* Activar/Desactivar — amarillo */}
                  <button onClick={() => toggleMutation.mutate(court._id)} disabled={toggleMutation.isPending}
                    title={court.isActive ? 'Desactivar' : 'Activar'}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                      court.isActive
                        ? 'border-amber-200 bg-amber-50 text-amber-500 hover:bg-amber-100'
                        : 'border-green-200 bg-green-50 text-green-500 hover:bg-green-100'
                    }`}>
                    <Power className="h-3.5 w-3.5" />
                  </button>

                  {/* Eliminar — rojo */}
                  <button onClick={() => setDelete(court)} title="Eliminar cancha"
                    className="w-9 h-9 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal confirmar eliminar */}
      <Dialog open={!!deleteCancha} onOpenChange={open => { if (!open) setDelete(null); }}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-gray-900">¿Eliminar cancha?</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              Vas a eliminar <strong>{deleteCancha?.name}</strong>. Esta acción no se puede deshacer y se perderán todas las reservas asociadas.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setDelete(null)}
              className="flex-1 border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm py-3 rounded-xl transition-all">
              Cancelar
            </button>
            <button onClick={() => deleteMutation.mutate(deleteCancha._id)} disabled={deleteMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3 rounded-xl transition-colors disabled:opacity-60">
              {deleteMutation.isPending ? 'Eliminando...' : <><Trash2 className="h-4 w-4" /> Eliminar</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}