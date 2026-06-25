'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, addMinutes, parse, getDay, isToday, isBefore, startOfDay, addHours } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, Clock, User, Mail, Phone, CreditCard, ChevronRight,
  ArrowLeft, Lock, AlertCircle, Banknote, Pencil, ChevronLeft,
} from 'lucide-react';
import { bookingsApi } from '@/lib/api/bookings.api';
import type { AvailabilitySlot } from '@/types/court.types';
import api from '@/lib/api/axios';

const schema = z.object({
  guestName:  z.string().min(2, 'Nombre muy corto'),
  guestEmail: z.string().email('Email inválido'),
  guestPhone: z.string().min(7, 'Teléfono inválido'),
  notes:      z.string().max(200).optional(),
});
type FormValues = z.infer<typeof schema>;

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// "HH:mm" → "6:00 AM" (formato 12h, no militar)
const fmt12 = (t: string) => {
  try { return format(parse(t, 'HH:mm', new Date()), 'h:mm a'); } catch { return t; }
};

function generateTimeSlots(openTime: string, closeTime: string, slotMinutes: number): string[] {
  const slots: string[] = [];
  const [oh, om] = openTime.split(':').map(Number);
  let ch = 0, cm = 0;
  if (closeTime === '00:00') { ch = 24; cm = 0; }
  else { [ch, cm] = closeTime.split(':').map(Number); }
  const base  = new Date(2000, 0, 1, oh, om);
  const limit = new Date(2000, 0, 1, ch, cm);
  let current = base;
  while (isBefore(addMinutes(current, slotMinutes), limit) || +addMinutes(current, slotMinutes) === +limit) {
    slots.push(format(current, 'HH:mm'));
    current = addMinutes(current, slotMinutes);
  }
  return slots;
}

function getAvailableDates(availability: AvailabilitySlot[], daysAhead = 30): Date[] {
  const availableDays = availability.map(s => s.dayOfWeek);
  const dates: Date[] = [];
  const today = startOfDay(new Date());
  for (let i = 0; i < daysAhead; i++) {
    const d = addHours(today, i * 24);
    if (availableDays.includes(getDay(d))) dates.push(d);
    if (dates.length >= 14) break;
  }
  return dates;
}

interface BookingFormProps {
  courtId: string;
  courtName: string;
  pricePerHour: number;
  availability: AvailabilitySlot[];
  /** preselección desde el buscador (yyyy-MM-dd) */
  initialDate?: string;
  /** preselección desde el buscador (HH:mm) */
  initialStart?: string;
}

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition';
const lbl = 'flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5';

export default function BookingForm({
  courtId, courtName, pricePerHour, availability, initialDate, initialStart,
}: BookingFormProps) {
  const [step, setStep]                 = useState<'when' | 'checkout'>('when');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [dateOffset, setDateOffset]     = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'efectivo' | null>(null);
  const [processing, setProcessing]     = useState(false);

  const { data: wompiConfig } = useQuery({
    queryKey: ['wompi-config', courtId],
    queryFn: async () => {
      const { data } = await api.get(`/courts/${courtId}/wompi-config`);
      return data;
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const availableDates = getAvailableDates(availability);
  const PER_PAGE = 8;
  const visibleDates = availableDates.slice(dateOffset, dateOffset + PER_PAGE);
  const slotForDay   = selectedDate ? availability.find(s => s.dayOfWeek === getDay(selectedDate)) : null;
  const timeSlots    = slotForDay ? generateTimeSlots(slotForDay.openTime, slotForDay.closeTime, slotForDay.slotDurationMinutes) : [];
  const slotDuration = slotForDay?.slotDurationMinutes ?? 60;
  const slotDurationH = slotDuration / 60;

  const endTime = selectedSlots.length > 0
    ? (() => { try { return format(addMinutes(parse(selectedSlots[0], 'HH:mm', new Date()), slotDuration * selectedSlots.length), 'HH:mm'); } catch { return ''; } })()
    : '';

  const totalPrice = Math.round(pricePerHour * slotDurationH * (selectedSlots.length || 1));

  const { data: bookedSlots = [] } = useQuery<{ startTime: string; endTime: string }[]>({
    queryKey: ['booked-slots', courtId, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      const { data } = await api.get('/bookings/slots', { params: { courtId, date: format(selectedDate, 'yyyy-MM-dd') } });
      return data;
    },
    enabled: !!selectedDate,
  });

  const { data: blockedSlots = [] } = useQuery<{ startTime: string; endTime: string; reason?: string }[]>({
    queryKey: ['blocked-slots', courtId, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      const { data } = await api.get(`/courts/${courtId}/blocked-slots`, { params: { date: format(selectedDate, 'yyyy-MM-dd') } });
      return data;
    },
    enabled: !!selectedDate,
  });

  function expandUnavailable(slots: { startTime: string; endTime: string }[]) {
    const out: string[] = [];
    slots.forEach((slot) => timeSlots.forEach(t => { if (t >= slot.startTime && t < slot.endTime) out.push(t); }));
    return out;
  }
  const bookedTimes  = expandUnavailable(bookedSlots);
  const blockedTimes = expandUnavailable(blockedSlots);

  // Slots pasados (hora Colombia)
  const nowInBogota = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const todayStr = format(nowInBogota, 'yyyy-MM-dd');
  const selectedStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const isPastDate = !!selectedStr && selectedStr < todayStr;
  const selectedIsToday = selectedStr === todayStr;
  const nowMinsCO = nowInBogota.getHours() * 60 + nowInBogota.getMinutes();
  const isSlotPast = (slot: string) => {
    if (isPastDate) return true;
    if (!selectedIsToday) return false;
    const [sh, sm] = slot.split(':').map(Number);
    return sh * 60 + sm <= nowMinsCO;
  };
  const isUnavailable = (slot: string) =>
    bookedTimes.includes(slot) || blockedTimes.includes(slot) || isSlotPast(slot);

  // ── Preselección desde el buscador ───────────────────────────
  const appliedDate = useRef(false);
  useEffect(() => {
    if (appliedDate.current) return;
    if (!initialDate) { appliedDate.current = true; return; }
    const match = availableDates.find(d => format(d, 'yyyy-MM-dd') === initialDate);
    if (match) {
      setSelectedDate(match);
      const idx = availableDates.findIndex(d => format(d, 'yyyy-MM-dd') === initialDate);
      if (idx >= 0) setDateOffset(Math.floor(idx / PER_PAGE) * PER_PAGE);
    }
    appliedDate.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDates]);

  const appliedStart = useRef(false);
  useEffect(() => {
    if (appliedStart.current) return;
    if (!initialStart || !selectedDate || timeSlots.length === 0) return;
    if (timeSlots.includes(initialStart) && !isUnavailable(initialStart)) {
      setSelectedSlots([initialStart]);
    }
    appliedStart.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, timeSlots, bookedTimes, blockedTimes]);

  // Si por carrera quedó seleccionado un slot que se volvió no disponible, lo soltamos.
  useEffect(() => {
    if (selectedSlots.some(isUnavailable)) {
      setSelectedSlots(prev => prev.filter(s => !isUnavailable(s)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookedSlots, blockedSlots]);

  // ── Selección contigua de horarios ───────────────────────────
  function toggleSlot(slot: string) {
    if (isUnavailable(slot)) return;
    if (selectedSlots.includes(slot)) {
      const i = selectedSlots.indexOf(slot);
      setSelectedSlots(selectedSlots.slice(0, i)); // recorta hasta antes del que toqué
      return;
    }
    if (selectedSlots.length === 0) { setSelectedSlots([slot]); return; }
    const idx = timeSlots.indexOf(slot);
    const lastIdx = timeSlots.indexOf(selectedSlots[selectedSlots.length - 1]);
    if (idx === lastIdx + 1) setSelectedSlots([...selectedSlots, slot]); // extiende contiguo
    else setSelectedSlots([slot]);                                       // empieza de nuevo
  }

  function pickDate(d: Date) {
    setSelectedDate(d);
    setSelectedSlots([]);
  }

  // ── Mutaciones ───────────────────────────────────────────────
  const createBookingMutation = useMutation({
    mutationFn: (values: FormValues) => bookingsApi.create({
      courtId, guestName: values.guestName, guestEmail: values.guestEmail,
      guestPhone: values.guestPhone, date: format(selectedDate!, 'yyyy-MM-dd'),
      startTime: selectedSlots[0], endTime, notes: values.notes, totalPrice,
      paymentMethod: paymentMethod ?? 'wompi',
    }),
  });

  const paymentMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const redirectUrl = `${window.location.origin}/reservas/confirmacion?bookingId=${bookingId}`;
      const { data } = await api.post(`/bookings/${bookingId}/payment`, { redirectUrl });
      return data;
    },
    onSuccess: (data) => { if (data.redirectUrl) window.location.href = data.redirectUrl; },
    onError: (err: Error) => { setProcessing(false); toast.error(err.message || 'Error al procesar el pago'); },
  });

  const goCheckout = () => {
    if (!selectedDate || selectedSlots.length === 0) { toast.error('Selecciona una fecha y horario'); return; }
    setStep('checkout');
  };

  const onSubmit = (values: FormValues) => {
    if (!paymentMethod) { toast.error('Selecciona un método de pago'); return; }
    setProcessing(true);
    createBookingMutation.mutate(values, {
      onSuccess: (bookingData) => {
        if (paymentMethod === 'efectivo') {
          window.location.href = `/reservas/confirmacion?bookingId=${bookingData._id}&method=efectivo&code=${bookingData.bookingCode}`;
        } else {
          paymentMutation.mutate(bookingData._id);
        }
      },
      onError: (err: any) => {
        setProcessing(false);
        toast.error(err?.response?.data?.message || err?.message || 'No se pudo crear la reserva');
      },
    });
  };

  const dateLabel = selectedDate
    ? formatInTimeZone(selectedDate, 'America/Bogota', "EEEE d 'de' MMMM", { locale: es })
    : '';

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">${pricePerHour.toLocaleString('es-CO')}</span>
            <span className="text-gray-500 text-sm"> COP / hora</span>
          </div>
          <span className="text-xs font-medium text-gray-400">
            {step === 'when' ? 'Paso 1 de 2' : 'Paso 2 de 2'}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* ─────────────────── PASO 1: CUÁNDO ─────────────────── */}
        {step === 'when' && (
          <div className="space-y-5">
            {/* Fecha */}
            <div>
              <label className={lbl}><CalendarDays className="h-3.5 w-3.5" /> Elige un día</label>
              {availability.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-sm text-gray-400">Esta cancha no tiene días configurados aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setDateOffset(Math.max(0, dateOffset - PER_PAGE))} disabled={dateOffset === 0}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs text-gray-400 font-medium">
                      {visibleDates.length > 0 && `${format(visibleDates[0], 'd MMM', { locale: es })} – ${format(visibleDates[visibleDates.length - 1], 'd MMM', { locale: es })}`}
                    </span>
                    <button type="button" onClick={() => setDateOffset(dateOffset + PER_PAGE)} disabled={dateOffset + PER_PAGE >= availableDates.length}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {visibleDates.map(date => {
                      const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      return (
                        <button key={date.toISOString()} type="button" onClick={() => pickDate(date)}
                          className={`flex flex-col items-center py-2.5 rounded-xl border transition-all ${isSelected ? 'border-green-600 bg-green-50 rtc-pick' : 'border-gray-200 hover:border-green-400'}`}>
                          <span className="text-[10px] text-gray-400 uppercase">{DAYS_ES[getDay(date)]}</span>
                          <span className={`text-base font-bold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>{format(date, 'd')}</span>
                          <span className="text-[10px] text-gray-400">{format(date, 'MMM', { locale: es })}</span>
                          {isToday(date) && <span className="text-[9px] text-green-600 font-semibold mt-0.5">Hoy</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Hora */}
            {selectedDate && (
              <div>
                <label className={lbl}>
                  <Clock className="h-3.5 w-3.5" /> Horarios
                  <span className="text-gray-400 font-normal">({slotDuration} min)</span>
                </label>
                {timeSlots.length === 0 ? (
                  <Skeleton className="h-24 rounded-xl" />
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => {
                        const selected = selectedSlots.includes(slot);
                        const unavailable = isUnavailable(slot);
                        const slot12h = format(parse(slot, 'HH:mm', new Date()), 'h:mm a');
                        return (
                          <button key={slot} type="button" disabled={unavailable} onClick={() => toggleSlot(slot)}
                            title={unavailable ? 'No disponible' : slot12h}
                            className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                              selected
                                ? 'border-green-600 bg-green-600 text-white rtc-pick'
                                : unavailable
                                  ? 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed'
                                  : 'border-gray-200 text-gray-700 hover:border-green-400 hover:bg-green-50'
                            }`}>
                            {slot12h}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-2.5 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-green-600 bg-green-600 inline-block" /> Elegido</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-200 inline-block" /> Libre</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" /> Ocupado</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">Toca varias horas seguidas para reservar más tiempo.</p>
                  </>
                )}
              </div>
            )}

            {/* Resumen vivo */}
            {selectedDate && selectedSlots.length > 0 && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                <div className="text-sm min-w-0">
                  <p className="font-semibold text-green-900 capitalize truncate">{dateLabel}</p>
                  <p className="text-green-700 text-xs">{fmt12(selectedSlots[0])} – {fmt12(endTime)} · {slotDuration * selectedSlots.length} min</p>
                </div>
                <span className="font-bold text-green-800 shrink-0">${totalPrice.toLocaleString('es-CO')}</span>
              </div>
            )}

            <button type="button" onClick={goCheckout} disabled={!selectedDate || selectedSlots.length === 0}
              className={`w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold py-3.5 rounded-2xl transition-colors ${selectedDate && selectedSlots.length > 0 ? 'rtc-ready' : ''}`}>
              Continuar <ChevronRight className="h-5 w-5" />
            </button>
            <p className="text-xs text-center text-gray-400">Sin registro · Cancelación gratis hasta 2h antes</p>
          </div>
        )}

        {/* ─────────────────── PASO 2: CHECKOUT ─────────────────── */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <button type="button" onClick={() => setStep('when')}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>

            {/* Resumen editable */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
              <div className="text-sm min-w-0">
                <p className="font-semibold text-gray-900 capitalize truncate">{dateLabel}</p>
                <p className="text-gray-500 text-xs">{fmt12(selectedSlots[0])} – {fmt12(endTime)} · {courtName}</p>
              </div>
              <button type="button" onClick={() => setStep('when')}
                className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800 shrink-0">
                <Pencil className="h-3 w-3" /> Editar
              </button>
            </div>

            {/* Datos */}
            <div className="space-y-3">
              <div>
                <label className={lbl}><User className="h-3.5 w-3.5" /> Nombre completo</label>
                <input className={inp} placeholder="Juan Pérez" {...register('guestName')} />
                {errors.guestName && <p className="text-xs text-red-500 mt-1">{errors.guestName.message}</p>}
              </div>
              <div>
                <label className={lbl}><Mail className="h-3.5 w-3.5" /> Email</label>
                <input type="email" className={inp} placeholder="juan@email.com" {...register('guestEmail')} />
                {errors.guestEmail && <p className="text-xs text-red-500 mt-1">{errors.guestEmail.message}</p>}
              </div>
              <div>
                <label className={lbl}><Phone className="h-3.5 w-3.5" /> Teléfono / WhatsApp</label>
                <input type="tel" className={inp} placeholder="+57 300 123 4567" {...register('guestPhone')} />
                {errors.guestPhone && <p className="text-xs text-red-500 mt-1">{errors.guestPhone.message}</p>}
              </div>
              <div>
                <label className={lbl}>Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea rows={2} className={inp} style={{ resize: 'none' }} placeholder="Ej: venimos 5 personas…" {...register('notes')} />
              </div>
            </div>

            {/* Método de pago */}
            <div className="space-y-2.5">
              <p className={lbl}><Lock className="h-3.5 w-3.5" /> Método de pago</p>

              {wompiConfig && !wompiConfig.configured ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Pago en línea no disponible para esta cancha. Puedes reservar y pagar en efectivo en el lugar.</span>
                </div>
              ) : (
                <button type="button" onClick={() => setPaymentMethod('wompi')}
                  className={`w-full flex items-center justify-between border rounded-2xl p-4 text-left transition-all ${paymentMethod === 'wompi' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-400'}`}>
                  <span className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wompi' ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                      {paymentMethod === 'wompi' && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    <span>
                      <span className="block font-semibold text-gray-900 text-sm">Pago en línea</span>
                      <span className="block text-xs text-gray-500">Nequi · Daviplata · Tarjeta (Wompi)</span>
                    </span>
                  </span>
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </button>
              )}

              <button type="button" onClick={() => setPaymentMethod('efectivo')}
                className={`w-full flex items-center justify-between border rounded-2xl p-4 text-left transition-all ${paymentMethod === 'efectivo' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}>
                <span className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'efectivo' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'efectivo' && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span>
                    <span className="block font-semibold text-gray-900 text-sm">Efectivo en el lugar</span>
                    <span className="block text-xs text-gray-500">Lleva el dinero el día de tu reserva</span>
                  </span>
                </span>
                <Banknote className="h-5 w-5 text-amber-500" />
              </button>
            </div>

            {/* Total + CTA */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-2xl font-bold text-gray-900">${totalPrice.toLocaleString('es-CO')} <span className="text-sm font-normal text-gray-500">COP</span></span>
            </div>

            <button type="submit" disabled={processing || !paymentMethod}
              className={`w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-colors ${paymentMethod === 'efectivo' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'}`}>
              {paymentMethod === 'efectivo' ? <Banknote className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
              {processing ? 'Procesando…' : paymentMethod === 'efectivo' ? 'Confirmar reserva' : 'Confirmar y pagar'}
            </button>
            <p className="text-xs text-center text-gray-400">Recibirás la confirmación y el link de cancelación por email.</p>
          </form>
        )}
      </div>
    </div>
  );
}
