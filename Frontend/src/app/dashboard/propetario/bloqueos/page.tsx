'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Ban, Plus, X, Trash2, Clock, CalendarDays, AlertTriangle, Loader2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import api from '@/lib/api/axios';
import SelectField from '@/components/ui/SelectField';
import { useApiAuth } from '@/hooks/useApiAuth';

function formatTime12h(time24h: string): string {
  const [hours, minutes] = time24h.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function BloqueosPage() {
  const reduce = useReducedMotion();
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
  const lbl = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';

  // Opciones de hora (cada hora de 00:00 a 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const courtOptions = courts.map((c: any) => ({ value: c._id, label: c.name }));
  const startOptions = hours.map(h => ({ value: h, label: formatTime12h(h) }));
  const endOptions   = hours.filter(h => !startTime || h > startTime).map(h => ({ value: h, label: formatTime12h(h) }));

  /* Al mover la hora de inicio, la de fin puede quedar inválida */
  const pickStart = (v: string) => {
    setStartTime(v);
    if (endTime && endTime <= v) setEndTime('');
  };

  const horas = startTime && endTime ? Number(endTime.split(':')[0]) - Number(startTime.split(':')[0]) : 0;
  const listo = !!courtId && !!date && !!startTime && !!endTime;

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
        <motion.button
          onClick={() => setShowForm(v => !v)}
          whileTap={reduce ? undefined : { scale: 0.97 }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-orange-500/20 shrink-0"
        >
          <motion.span animate={{ rotate: showForm ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
            <Plus className="h-4 w-4" />
          </motion.span>
          {showForm ? 'Cerrar' : 'Nuevo bloqueo'}
        </motion.button>
      </div>

      {/* Formulario */}
      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            key="form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.32, ease: EASE }, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-5 md:p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </span>
                  <div>
                    <h3 className="font-black text-orange-900 leading-tight">Bloquear horario</h3>
                    <p className="text-xs text-orange-700/70">Ese rango dejará de aparecer como disponible</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  aria-label="Cerrar formulario"
                  className="p-1.5 rounded-lg text-orange-400 hover:text-orange-700 hover:bg-orange-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Cancha</label>
                  <SelectField
                    accent="orange"
                    aria-label="Cancha"
                    value={courtId || undefined}
                    onChange={setCourtId}
                    options={courtOptions}
                    placeholder={courtOptions.length ? 'Seleccionar cancha' : 'No tienes canchas'}
                    disabled={courtOptions.length === 0}
                  />
                </div>
                <div>
                  <label className={lbl}>Fecha</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp}
                    min={format(new Date(), 'yyyy-MM-dd')} />
                </div>
                <div>
                  <label className={lbl}>Hora inicio</label>
                  <SelectField
                    accent="orange"
                    aria-label="Hora de inicio"
                    value={startTime || undefined}
                    onChange={pickStart}
                    options={startOptions}
                    placeholder="Seleccionar"
                  />
                </div>
                <div>
                  <label className={lbl}>Hora fin</label>
                  <SelectField
                    accent="orange"
                    aria-label="Hora de fin"
                    value={endTime || undefined}
                    onChange={setEndTime}
                    options={endOptions}
                    placeholder={startTime ? 'Seleccionar' : 'Elige primero la hora de inicio'}
                    disabled={!startTime}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>Motivo <span className="text-gray-400 font-medium normal-case">(opcional)</span></label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} className={inp}
                  placeholder="Ej: Mantenimiento, Torneo privado..." />
              </div>

              {/* Resumen en vivo de lo que se va a bloquear */}
              <AnimatePresence initial={false}>
                {listo && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 text-sm text-orange-800 bg-orange-100/70 rounded-xl px-4 py-3"
                  >
                    <Clock className="h-4 w-4 shrink-0" />
                    Se bloquearán <strong>{horas} hora{horas === 1 ? '' : 's'}</strong> el{' '}
                    <strong>{format(new Date(`${date}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })}</strong>
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button onClick={() => setShowForm(false)}
                  className="px-5 py-3 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:border-gray-300 transition-colors">
                  Cancelar
                </button>
                <motion.button
                  onClick={() => createMutation.mutate()}
                  disabled={!listo || createMutation.isPending}
                  whileTap={reduce || !listo ? undefined : { scale: 0.98 }}
                  className="flex-1 sm:flex-none sm:px-8 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl transition-colors text-sm shadow-lg shadow-orange-500/20"
                >
                  {createMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Bloqueando...</>
                    : <><Ban className="h-4 w-4" /> Confirmar bloqueo</>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <AnimatePresence initial={false}>
          {blocks.map((block: any, i: number) => {
            const blockDate = new Date(block.date);
            const isPast = blockDate < new Date(new Date().setHours(0, 0, 0, 0));
            return (
              <motion.div key={block._id}
                layout={!reduce}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: isPast ? 0.6 : 1, y: 0, transition: { duration: 0.3, ease: EASE, delay: Math.min(i * 0.04, 0.2) } }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24, transition: { duration: 0.18 } }}
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${isPast ? 'border-gray-100 bg-gray-50' : 'border-orange-100 bg-white hover:border-orange-200'}`}>
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
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
