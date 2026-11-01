'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PhoneCall, Repeat } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api/axios';

interface Cancha {
  _id: string;
  name: string;
  pricePerHour: number;
}

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40';
const lbl = 'block text-xs font-semibold text-gray-500 mb-1';

const aMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Anotar una reserva que llegó por teléfono o al mostrador. Ocupa el horario
 * para que nadie más la pague en línea; el cobro queda en el club.
 */
export default function ReservaManualDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data: canchas = [] } = useQuery<Cancha[]>({
    queryKey: ['owner-courts-min'],
    queryFn: async () => (await api.get('/courts/owner/my-courts')).data,
    enabled: open,
  });

  const [f, setF] = useState({
    courtId: '', date: hoy(), startTime: '19:00', endTime: '20:00',
    guestName: '', guestPhone: '', guestEmail: '', notes: '', semanas: 1, precio: '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: k === 'semanas' ? Number(e.target.value) : e.target.value }));

  useEffect(() => {
    if (!f.courtId && canchas.length) setF((p) => ({ ...p, courtId: canchas[0]._id }));
  }, [canchas, f.courtId]);

  const cancha = canchas.find((c) => c._id === f.courtId);
  const minutos = aMin(f.endTime) - aMin(f.startTime);
  const precioLista = cancha && minutos > 0 ? Math.round((cancha.pricePerHour * minutos) / 60) : 0;

  const crear = useMutation({
    mutationFn: async () => (await api.post('/bookings/manual', {
      courtId: f.courtId,
      date: f.date,
      startTime: f.startTime,
      endTime: f.endTime,
      guestName: f.guestName.trim(),
      guestPhone: f.guestPhone.trim() || undefined,
      guestEmail: f.guestEmail.trim() || undefined,
      notes: f.notes.trim() || undefined,
      semanas: f.semanas,
      precio: f.precio === '' ? undefined : Number(f.precio),
    })).data as { creadas: number },
    onSuccess: (r) => {
      toast.success(r.creadas > 1 ? `Turno fijo anotado: ${r.creadas} semanas` : 'Reserva anotada');
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      onOpenChange(false);
      setF((p) => ({ ...p, guestName: '', guestPhone: '', guestEmail: '', notes: '', semanas: 1, precio: '' }));
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'No se pudo anotar la reserva');
    },
  });

  const listo = f.courtId && f.guestName.trim().length >= 2 && minutos > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black uppercase text-gray-900">
            <PhoneCall className="h-5 w-5 text-green-600" /> Anotar reserva
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500 -mt-1">
          Para las que te piden por teléfono o en el mostrador. Bloquea el horario en la web y la app, y la cobras tú en el club.
        </p>

        <form className="space-y-3 pt-1" onSubmit={(e) => { e.preventDefault(); if (listo) crear.mutate(); }}>
          <div>
            <label className={lbl}>Cancha</label>
            <select className={inp} value={f.courtId} onChange={set('courtId')}>
              {canchas.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 sm:col-span-1">
              <label className={lbl}>Fecha</label>
              <input type="date" className={inp} min={hoy()} value={f.date} onChange={set('date')} />
            </div>
            <div>
              <label className={lbl}>Desde</label>
              <input type="time" step={1800} className={inp} value={f.startTime} onChange={set('startTime')} />
            </div>
            <div>
              <label className={lbl}>Hasta</label>
              <input type="time" step={1800} className={inp} value={f.endTime} onChange={set('endTime')} />
            </div>
          </div>
          <div>
            <label className={lbl}>A nombre de</label>
            <input className={inp} placeholder="Ej: Carlos o 'Equipo de los martes'" value={f.guestName} onChange={set('guestName')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Celular <span className="font-normal text-gray-400">(opcional)</span></label>
              <input type="tel" className={inp} placeholder="300 123 4567" value={f.guestPhone} onChange={set('guestPhone')} />
            </div>
            <div>
              <label className={lbl}>Correo <span className="font-normal text-gray-400">(opcional)</span></label>
              <input type="email" className={inp} placeholder="para el recordatorio" value={f.guestEmail} onChange={set('guestEmail')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`${lbl} flex items-center gap-1`}><Repeat className="h-3 w-3" /> Repetir</label>
              <select className={inp} value={f.semanas} onChange={set('semanas')}>
                <option value={1}>Solo esta fecha</option>
                {[4, 8, 12, 26].map((n) => <option key={n} value={n}>Cada semana, {n} semanas</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Cobras <span className="font-normal text-gray-400">(por fecha)</span></label>
              <input type="number" min={0} step={1000} className={inp}
                placeholder={precioLista ? `$${precioLista.toLocaleString('es-CO')}` : 'Precio de lista'}
                value={f.precio} onChange={set('precio')} />
            </div>
          </div>
          <div>
            <label className={lbl}>Notas <span className="font-normal text-gray-400">(opcional)</span></label>
            <textarea rows={2} className={inp} style={{ resize: 'none' }} value={f.notes} onChange={set('notes')} />
          </div>

          <button type="submit" disabled={!listo || crear.isPending}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold text-sm py-3 rounded-xl transition-colors">
            {crear.isPending ? 'Anotando…' : f.semanas > 1 ? `Anotar ${f.semanas} semanas` : 'Anotar reserva'}
          </button>
          <p className="text-[11px] text-center text-gray-400">
            No pasa por ePayco ni tiene comisión. Si alguna fecha ya está ocupada, no se anota ninguna y te decimos cuál.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
