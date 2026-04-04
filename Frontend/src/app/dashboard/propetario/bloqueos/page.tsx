'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Ban, Plus, Trash2, Clock, CalendarDays, AlertTriangle } from 'lucide-react';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';

function formatTime12h(time24h: string): string {
  const [hours, minutes] = time24h.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function BloqueosPage() {
  const session = useApiAuth();
  const token = (session as any)?.accessToken;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [courtId, setCourtId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  // Mis canchas
  const { data: courts = [] } = useQuery<any[]>({
    queryKey: ['my-courts'],
    queryFn: async () => { const { data } = await api.get('/courts/owner/my-courts'); return data; },
    enabled: !!token,
  });

  // Mis bloqueos
  const { data: blocks = [], isLoading } = useQuery<any[]>({
    queryKey: ['my-blocked-slots'],
    queryFn: async () => { const { data } = await api.get('/courts/blocked-slots/my'); return data; },
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/courts/blocked-slots', { courtId, date, startTime, endTime, reason });
      return data;
    },
    onSuccess: () => {
      toast.success('Horario bloqueado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['my-blocked-slots'] });
      setShowForm(false);
      setCourtId(''); setDate(''); setStartTime(''); setEndTime(''); setReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al bloquear'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { data } = await api.delete(`/courts/blocked-slots/${slotId}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Bloqueo eliminado');
      queryClient.invalidateQueries({ queryKey: ['my-blocked-slots'] });
    },
    onError: () => toast.error('Error al eliminar bloqueo'),
  });

  const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 transition';

  // Generar opciones de hora (cada hora de 00:00 a 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, '0');
    return `${h}:00`;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase flex items-center gap-2">
            <Ban className="h-6 w-6 text-orange-500" /> Bloquear Horarios
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Bloquea horarios para mantenimiento, torneos privados o cualquier motivo.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="h-4 w-4" /> Nuevo bloqueo
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-orange-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Bloquear horario
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cancha</label>
              <select value={courtId} onChange={e => setCourtId(e.target.value)} className={inp}>
                <option value="">Seleccionar cancha</option>
                {courts.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp}
                min={format(new Date(), 'yyyy-MM-dd')} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Hora inicio</label>
              <select value={startTime} onChange={e => setStartTime(e.target.value)} className={inp}>
                <option value="">Seleccionar</option>
                {hours.map(h => (
                  <option key={h} value={h}>{formatTime12h(h)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Hora fin</label>
              <select value={endTime} onChange={e => setEndTime(e.target.value)} className={inp}>
                <option value="">Seleccionar</option>
                {hours.filter(h => h > startTime).map(h => (
                  <option key={h} value={h}>{formatTime12h(h)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Motivo (opcional)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} className={inp}
              placeholder="Ej: Mantenimiento, Torneo privado..." />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!courtId || !date || !startTime || !endTime || createMutation.isPending}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              {createMutation.isPending ? 'Bloqueando...' : 'Confirmar bloqueo'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de bloqueos */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : blocks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Ban className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No tienes horarios bloqueados</p>
          <p className="text-gray-400 text-sm mt-1">Los horarios bloqueados no estarán disponibles para reservas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block: any) => {
            const blockDate = new Date(block.date);
            const isPast = blockDate < new Date(new Date().setHours(0, 0, 0, 0));
            return (
              <div key={block._id}
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${isPast ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-orange-100 bg-white'}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPast ? 'bg-gray-200' : 'bg-orange-100'}`}>
                    <Ban className={`h-5 w-5 ${isPast ? 'text-gray-400' : 'text-orange-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{block.courtName}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(blockDate, "EEE dd MMM yyyy", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime12h(block.startTime)} – {formatTime12h(block.endTime)}
                      </span>
                      {block.reason && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                          {block.reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isPast && (
                  <button
                    onClick={() => deleteMutation.mutate(block._id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Eliminar bloqueo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
