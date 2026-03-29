'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CalendarDays, Clock, User, Phone, Mail, Eye, X, CheckCircle, Search, Filter } from 'lucide-react';
import api from '@/lib/api/axios';
import { toast } from 'sonner';
import type { Booking } from '@/types/booking.types';

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  pending:   { pill: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-400'  },
  confirmed: { pill: 'bg-green-100 text-green-700',    dot: 'bg-green-500'   },
  cancelled: { pill: 'bg-red-100 text-red-600',        dot: 'bg-red-400'     },
  completed: { pill: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400'    },
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada',
};

export default function ReservasOwnerPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected]   = useState<Booking | null>(null);
  const [filterStatus, setFilter] = useState('all');
  const [search, setSearch]       = useState('');

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['owner-bookings'],
    queryFn: async () => { const { data } = await api.get('/bookings/owner'); return data; },
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      setSelected(null);
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  const filtered = bookings
    .filter(b => filterStatus === 'all' || b.status === filterStatus)
    .filter(b => !search || b.guestName?.toLowerCase().includes(search.toLowerCase()) || b.guestEmail?.toLowerCase().includes(search.toLowerCase()));

  const pendientes  = bookings.filter(b => b.status === 'pending').length;
  const confirmadas = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
            <span>✦</span> Panel Propietario
          </p>
          <h1 className="text-3xl font-black text-gray-900 uppercase">Reservas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {bookings.length} reservas ·{' '}
            <span className="text-yellow-600 font-semibold">{pendientes} pendientes</span> ·{' '}
            <span className="text-green-600 font-semibold">{confirmadas} confirmadas</span>
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                filterStatus === s
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {s === 'all' ? 'Todas' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-black text-gray-400 uppercase text-sm">Sin reservas</p>
          <p className="text-gray-400 text-xs mt-1">
            {search || filterStatus !== 'all' ? 'Intenta con otros filtros' : 'Las reservas de tus canchas aparecerán aquí'}
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map(booking => {
          const court = typeof booking.courtId === 'object' ? booking.courtId : null;
          const st    = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;
          return (
            <div
              key={booking._id}
              className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-4"
            >
              <div className="flex items-center gap-4">
                {/* Bloque fecha */}
                <div className="bg-green-50 rounded-xl p-3 text-center min-w-[60px] shrink-0">
                  <p className="text-[10px] text-green-600 font-bold uppercase">
                    {format(new Date(booking.date), 'MMM', { locale: es })}
                  </p>
                  <p className="text-xl font-black text-green-700 leading-none">
                    {format(new Date(booking.date), 'd')}
                  </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {court && <span className="font-black text-gray-900 text-sm">{court.name}</span>}
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${st.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.startTime} – {booking.endTime}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{booking.guestName}</span>
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{booking.guestEmail}</span>
                  </div>
                </div>

                {/* Precio + botones */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="font-black text-green-700">${booking.totalPrice?.toLocaleString('es-CO')}</p>
                    <p className="text-[10px] text-gray-400">COP</p>
                  </div>
                  {/* Botón ver — mismo estilo que imagen */}
                  <button
                    onClick={() => setSelected(booking)}
                    title="Ver detalles"
                    className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  {/* Confirmar — amarillo */}
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => changeStatus.mutate({ id: booking._id, status: 'confirmed' })}
                      title="Confirmar"
                      className="w-9 h-9 rounded-full border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-500 hover:bg-amber-100 transition-all"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {/* Cancelar — rojo */}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      onClick={() => changeStatus.mutate({ id: booking._id, status: 'cancelled' })}
                      title="Cancelar reserva"
                      className="w-9 h-9 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal detalles */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-gray-900">Detalle de reserva</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_STYLES[selected.status]?.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[selected.status]?.dot}`} />
                {STATUS_LABELS[selected.status]}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><CalendarDays className="h-4 w-4 text-green-600" />{format(new Date(selected.date), 'PPP', { locale: es })}</div>
                <div className="flex items-center gap-2 text-gray-600"><Clock className="h-4 w-4 text-green-600" />{selected.startTime} – {selected.endTime}</div>
                <div className="flex items-center gap-2 text-gray-600"><User className="h-4 w-4 text-green-600" />{selected.guestName}</div>
                <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 text-green-600" />{selected.guestEmail}</div>
                <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-green-600" />{selected.guestPhone}</div>
                {selected.notes && <div className="text-gray-500 pt-1 border-t border-gray-100">📝 {selected.notes}</div>}
              </div>
              <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-600 font-semibold">Total</span>
                <span className="font-black text-green-700 text-lg">${selected.totalPrice?.toLocaleString('es-CO')} COP</span>
              </div>
              {/* Cambiar estado */}
              {(selected.status === 'pending' || selected.status === 'confirmed') && (
                <div className="flex gap-2">
                  {selected.status === 'pending' && (
                    <button
                      onClick={() => changeStatus.mutate({ id: selected._id, status: 'confirmed' })}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" /> Confirmar
                    </button>
                  )}
                  <button
                    onClick={() => changeStatus.mutate({ id: selected._id, status: 'cancelled' })}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 hover:bg-red-50 text-red-500 font-bold text-sm py-2.5 rounded-xl transition-colors"
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setSelected(null)} className="w-full border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm py-2.5 rounded-xl transition-all">
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}