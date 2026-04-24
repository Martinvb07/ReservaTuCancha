'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, addMinutes, parse, getDay, isToday, isBefore, startOfDay, addHours } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock, User, Mail, Phone, CreditCard, ChevronLeft, ChevronRight, Timer, CheckCircle, ArrowLeft, Lock, AlertCircle, Banknote } from 'lucide-react';
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

function generateTimeSlots(openTime: string, closeTime: string, slotMinutes: number): string[] {
  const slots: string[] = [];
  const [oh, om] = openTime.split(':').map(Number);
  let ch = 0, cm = 0;
  if (closeTime === '00:00') { ch = 24; cm = 0; }
  else { [ch, cm] = closeTime.split(':').map(Number); }
  const base  = new Date(2000, 0, 1, oh, om);
  const limit = new Date(2000, 0, 1, ch, cm);
  let current = base;
  while (isBefore(addMinutes(current, slotMinutes), limit)) {
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
  courtId: string; courtName: string;
  pricePerHour: number; availability: AvailabilitySlot[];
}

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl = 'block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5';

export default function BookingForm({ courtId, courtName, pricePerHour, availability }: BookingFormProps) {
  const [step, setStep]                = useState<'form' | 'summary' | 'payment' | 'success'>('form');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [dateOffset, setDateOffset]   = useState(0);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wompi' | 'efectivo' | null>(null);
  const [wompiLoading, setWompiLoading] = useState(false);

  // Obtener config de Wompi de la cancha
  const { data: wompiConfig, isLoading: loadingWompi } = useQuery({
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
  const visibleDates   = availableDates.slice(dateOffset, dateOffset + 7);
  const slotForDay     = selectedDate ? availability.find(s => s.dayOfWeek === getDay(selectedDate)) : null;
  const timeSlots      = slotForDay ? generateTimeSlots(slotForDay.openTime, slotForDay.closeTime, slotForDay.slotDurationMinutes) : [];
  const slotDuration   = slotForDay?.slotDurationMinutes ?? 60;
  const slotDurationH  = slotDuration / 60;

  const endTime = selectedSlots.length > 0
    ? (() => { try { return format(addMinutes(parse(selectedSlots[0], 'HH:mm', new Date()), slotDuration * selectedSlots.length), 'HH:mm'); } catch { return ''; } })()
    : '';

  const totalPrice = Math.round(pricePerHour * slotDurationH * (selectedSlots.length || 1));

const { data: bookedSlots = [] } = useQuery<{ startTime: string; endTime: string }[]>({
  queryKey: ['booked-slots', courtId, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
  queryFn: async () => {
    if (!selectedDate) return [];
    // IMPORTANTE: Asegúrate de que el backend reciba solo la fecha YYYY-MM-DD
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data } = await api.get('/bookings/slots', { 
      params: { courtId, date: dateStr } 
    });
    return data;
  },
  enabled: !!selectedDate,
});

  // Horarios bloqueados por el owner
  const { data: blockedSlots = [] } = useQuery<{ startTime: string; endTime: string; reason?: string }[]>({
    queryKey: ['blocked-slots', courtId, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data } = await api.get(`/courts/${courtId}/blocked-slots`, { params: { date: dateStr } });
      return data;
    },
    enabled: !!selectedDate,
  });

  function getUnavailableSlotsArray(slots: { startTime: string; endTime: string }[], timeSlots: string[]) {
    const unavailable: string[] = [];
    slots.forEach((slot) => {
      timeSlots.forEach(t => {
        if (t >= slot.startTime && t < slot.endTime) {
          unavailable.push(t);
        }
      });
    });
    return unavailable;
  }

  const bookedTimes  = getUnavailableSlotsArray(bookedSlots, timeSlots);
  const blockedTimes = getUnavailableSlotsArray(blockedSlots, timeSlots);

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

  // Mutación para crear la booking
  const createBookingMutation = useMutation({
    mutationFn: (values: FormValues) => bookingsApi.create({
      courtId, guestName: values.guestName, guestEmail: values.guestEmail,
      guestPhone: values.guestPhone, date: format(selectedDate!, 'yyyy-MM-dd'),
      startTime: selectedSlots[0], endTime, notes: values.notes, totalPrice,
      paymentMethod: selectedPaymentMethod ?? 'wompi',
    }),
  });

  // Mutación para iniciar el pago
  const paymentMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const redirectUrl = `${window.location.origin}/reservas/confirmacion?bookingId=${bookingId}`;
      const { data } = await api.post(`/bookings/${bookingId}/payment`, { redirectUrl });
      return data;
    },
    onSuccess: (data) => {
      // Redirigir a Wompi
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Error al procesar el pago'),
  });

  const onSubmit = (values: FormValues) => {
    if (!selectedDate || selectedSlots.length === 0) { toast.error('Selecciona una fecha y horario'); return; }
    if (step === 'form') { setStep('summary'); return; }
    if (step === 'summary') { setStep('payment'); return; }
    if (step === 'payment') {
      setWompiLoading(true);
      createBookingMutation.mutate(values, {
        onSuccess: (bookingData) => {
          if (selectedPaymentMethod === 'efectivo') {
            setWompiLoading(false);
            window.location.href = `/reservas/confirmacion?bookingId=${bookingData._id}&method=efectivo&code=${bookingData.bookingCode}`;
          } else {
            paymentMutation.mutate(bookingData._id);
          }
        },
        onError: () => setWompiLoading(false),
      });
    }
  };

  // ── SUCCESS ───────────────────────────────────────────────────
  if (step === 'success') {
    const code = bookingResult?.bookingCode || '—';
    return (
      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
        <div className="bg-gray-900 px-6 py-8 text-center space-y-3">
          <div className="w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="h-8 w-8 text-gray-900" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase">¡Reserva creada!</h3>
          <p className="text-gray-400 text-sm">Revisa tu email para ver los detalles y el link de cancelación</p>
          <div className="bg-white/10 rounded-2xl px-6 py-3 inline-block">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Código de reserva</p>
            <p className="text-lime-400 text-2xl font-black tracking-widest">#{code}</p>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span className="text-gray-400">Cancha</span><span className="font-bold text-gray-900">{courtName}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Fecha</span><span className="font-bold text-gray-900">{selectedDate ? formatInTimeZone(selectedDate, 'America/Bogota', "dd 'de' MMM yyyy", { locale: es }) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Horario</span><span className="font-bold text-gray-900">{selectedSlots[0]} – {endTime}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="font-black text-green-700">${totalPrice.toLocaleString('es-CO')} COP</span></div>
          </div>
          <button
            onClick={() => { setStep('form'); setSelectedDate(null); setSelectedSlots([]); setBookingResult(null); }}
            className="w-full border-2 border-gray-200 hover:border-gray-400 text-gray-600 font-bold text-sm py-3 rounded-2xl transition-all"
          >
            Hacer otra reserva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Reservar</p>
            <p className="text-white font-black text-base">{courtName}</p>
          </div>
          <div className="text-right">
            <p className="text-lime-400 text-2xl font-black">${pricePerHour.toLocaleString('es-CO')}</p>
            <p className="text-gray-500 text-xs">COP / hora</p>
          </div>
        </div>
        {/* Steps */}
        <div className="flex items-center gap-2 mt-4">
          {['Fecha y hora', 'Tus datos', 'Pago', 'Confirmado'].map((s, i) => {
            const stepIdx = step === 'form' ? 0 : step === 'summary' ? 1 : step === 'payment' ? 2 : 3;
            const active  = i <= stepIdx;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${active ? 'bg-lime-400 text-gray-900' : 'bg-white/10 text-gray-500'}`}>
                  {i + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide hidden sm:block ${active ? 'text-lime-400' : 'text-gray-600'}`}>{s}</span>
                {i < 3 && <div className={`flex-1 h-px ${active ? 'bg-lime-400/40' : 'bg-white/10'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

        {/* ── PASO 1: Fecha + hora + datos ──────────────── */}
        {step === 'form' && (
          <>
            {/* Selector de fecha */}
            <div>
              <label className={lbl + " flex items-center gap-1.5"}>
                <CalendarDays className="h-3 w-3" /> Elige un día
              </label>
              {availability.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-sm text-gray-400">Esta cancha no tiene días configurados aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setDateOffset(Math.max(0, dateOffset - 7))} disabled={dateOffset === 0}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs text-gray-400 font-semibold">
                      {visibleDates.length > 0 && `${format(visibleDates[0], 'dd MMM', { locale: es })} – ${format(visibleDates[visibleDates.length - 1], 'dd MMM', { locale: es })}`}
                    </span>
                    <button type="button" onClick={() => setDateOffset(dateOffset + 7)} disabled={dateOffset + 7 >= availableDates.length}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {visibleDates.map(date => {
                      const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      return (
                        <button key={date.toISOString()} type="button"
                          onClick={() => { setSelectedDate(date); setSelectedSlots([]); }}
                          className={`flex flex-col items-center py-2.5 rounded-xl border-2 transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                          <span className="text-[10px] text-gray-400 uppercase">{DAYS_ES[getDay(date)]}</span>
                          <span className={`text-base font-black ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>{format(date, 'd')}</span>
                          <span className="text-[10px] text-gray-400">{format(date, 'MMM', { locale: es })}</span>
                          {isToday(date) && <span className="text-[9px] bg-green-500 text-white rounded-full px-1.5 mt-0.5">Hoy</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Selector de hora */}
            {selectedDate && (
              <div>
                <label className={lbl + " flex items-center gap-1.5"}>
                  <Clock className="h-3 w-3" /> Horarios disponibles
                  <span className="text-gray-400 font-normal normal-case">({slotDuration} min)</span>
                </label>
                {timeSlots.length === 0 ? (
                  <Skeleton className="h-24 rounded-xl" />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlots.map((slot, idx) => {
                      const isBooked   = bookedTimes.includes(slot);
                      const isBlocked  = blockedTimes.includes(slot);
                      const isPast     = isSlotPast(slot);
                      const isUnavailable = isBooked || isBlocked || isPast;
                      const isSelected = selectedSlots.includes(slot);
                      const canSelect   = !isUnavailable && (selectedSlots.length === 0 || selectedSlots[selectedSlots.length - 1] === timeSlots[idx - 1]);
                      const slot12h    = format(parse(slot, 'HH:mm', new Date()), 'hh:mm a');
                      const slotEnd    = format(addMinutes(parse(slot, 'HH:mm', new Date()), slotDuration), 'hh:mm a');
                      return (
                        <button key={slot} type="button"
                          disabled={isUnavailable || (!canSelect && !isSelected)}
                          onClick={() => {
                            if (isSelected) { setSelectedSlots(selectedSlots.filter(s => s !== slot)); return; }
                            if (selectedSlots.length === 0 || canSelect) setSelectedSlots([...selectedSlots, slot]);
                          }}
                          className={`flex flex-col items-center py-2.5 rounded-xl border-2 text-xs transition-all ${
                            isPast ? 'border-yellow-400 bg-yellow-50 text-yellow-700 cursor-not-allowed font-bold'
                            : isBlocked ? 'border-orange-400 bg-orange-50 text-orange-600 cursor-not-allowed font-bold'
                            : isBooked ? 'border-red-500 bg-red-100 text-red-700 cursor-not-allowed font-bold'
                            : isSelected ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                            : canSelect ? 'border-gray-200 hover:border-green-300 text-gray-700'
                            : 'border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                          }`}>
                          <span className={`font-bold ${isPast ? 'line-through opacity-70' : ''}`}>{slot12h}</span>
                          <span className="text-[10px] opacity-60">→ {slotEnd}</span>
                          {isPast && <span className="text-[9px] text-yellow-700 mt-0.5 font-bold">Horario no disponible</span>}
                          {isBlocked && !isPast && <span className="text-[9px] text-orange-600 mt-0.5 font-bold">Bloqueado</span>}
                          {isBooked && !isBlocked && !isPast && <span className="text-[9px] text-red-700 mt-0.5 font-bold">Ocupado</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            {selectedDate && selectedSlots.length > 0 && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                <Timer className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-black text-green-800">{formatInTimeZone(selectedDate, 'America/Bogota', "EEEE dd 'de' MMMM", { locale: es })}</p>
                  <p className="text-green-600 text-xs">{selectedSlots[0]} – {endTime} · {slotDuration * selectedSlots.length} min · ${totalPrice.toLocaleString('es-CO')} COP</p>
                </div>
                <span className="text-xs font-black text-green-700 bg-green-200 px-2.5 py-1 rounded-full">✓</span>
              </div>
            )}

            <div className="h-px bg-gray-100" />

            {/* Datos del cliente */}
            <div className="space-y-3">
              <div>
                <label className={lbl + " flex items-center gap-1"}><User className="h-3 w-3" /> Nombre completo</label>
                <input className={inp} placeholder="Juan Pérez" {...register('guestName')} />
                {errors.guestName && <p className="text-xs text-red-500 mt-1">{errors.guestName.message}</p>}
              </div>
              <div>
                <label className={lbl + " flex items-center gap-1"}><Mail className="h-3 w-3" /> Email</label>
                <input type="email" className={inp} placeholder="juan@email.com" {...register('guestEmail')} />
                {errors.guestEmail && <p className="text-xs text-red-500 mt-1">{errors.guestEmail.message}</p>}
              </div>
              <div>
                <label className={lbl + " flex items-center gap-1"}><Phone className="h-3 w-3" /> Teléfono / WhatsApp</label>
                <input type="tel" className={inp} placeholder="+57 300 123 4567" {...register('guestPhone')} />
                {errors.guestPhone && <p className="text-xs text-red-500 mt-1">{errors.guestPhone.message}</p>}
              </div>
              <div>
                <label className={lbl}>Notas <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                <textarea rows={2} className={inp} style={{ resize: 'none' }} placeholder="Ej: venimos 5 personas..." {...register('notes')} />
              </div>
            </div>

            <button type="submit" disabled={!selectedDate || selectedSlots.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-black py-4 rounded-2xl transition-colors">
              Continuar al resumen <ChevronRight className="h-5 w-5" />
            </button>

            {(!selectedDate || selectedSlots.length === 0) && (
              <p className="text-xs text-center text-amber-600">👆 Selecciona un día y horario para continuar</p>
            )}
            <p className="text-xs text-center text-gray-400">Sin registro · Cancelación gratis hasta 2h antes</p>
          </>
        )}

        {/* ── PASO 2: Resumen ────────────────────────────── */}
        {step === 'summary' && (
          <>
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm">
              {[
                { label: 'Cancha',   val: courtName },
                { label: 'Fecha',    val: selectedDate ? formatInTimeZone(selectedDate, 'America/Bogota', "EEEE dd 'de' MMMM yyyy", { locale: es }) : '—' },
                { label: 'Horario',  val: `${selectedSlots[0]} – ${endTime} (${slotDuration * selectedSlots.length} min)` },
                { label: 'Nombre',   val: watch('guestName') },
                { label: 'Email',    val: watch('guestEmail') },
                { label: 'Teléfono', val: watch('guestPhone') },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-gray-400 font-semibold shrink-0">{label}</span>
                  <span className="font-bold text-gray-900 text-right text-xs sm:text-sm">{val}</span>
                </div>
              ))}
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between items-center">
                <span className="font-black text-gray-900">Total a pagar</span>
                <span className="text-2xl font-black text-green-700">${totalPrice.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            <button type="submit"
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl transition-colors shadow-lg">
              <CreditCard className="h-5 w-5" />
              Continuar al pago
            </button>

            <button type="button" onClick={() => setStep('form')}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm py-3 rounded-2xl transition-all">
              <ArrowLeft className="h-4 w-4" /> Volver a editar
            </button>
          </>
        )}

        {/* ── PASO 3: Pago ────────────────────────────── */}
        {step === 'payment' && (
          <>
            {!wompiConfig?.configured ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">Wompi no disponible</p>
                  <p className="text-sm text-red-700 mt-1">{wompiConfig?.message || 'El propietario de esta cancha no ha configurado Wompi aún'}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                  <div className="flex gap-3">
                    <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-900">Selecciona método de pago</p>
                      <p className="text-sm text-blue-700 mt-1">Tu pago es seguro. Puedes cancelar gratis hasta 2h antes de tu reserva.</p>
                    </div>
                  </div>
                </div>

                {/* Opción Wompi */}
                <div
                  onClick={() => setSelectedPaymentMethod('wompi')}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'wompi'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedPaymentMethod === 'wompi' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {selectedPaymentMethod === 'wompi' && <span className="text-white text-sm">✓</span>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Wompi (Nequi/Davidplata/Tarjeta)</p>
                        <p className="text-sm text-gray-500">Pago seguro con encriptación</p>
                      </div>
                    </div>
                    <CreditCard className="h-6 w-6 text-gray-400" />
                  </div>
                </div>

                {/* Opción Efectivo */}
                <div
                  onClick={() => setSelectedPaymentMethod('efectivo')}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'efectivo'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedPaymentMethod === 'efectivo' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                      }`}>
                        {selectedPaymentMethod === 'efectivo' && <span className="text-white text-sm">✓</span>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Efectivo (pagar en el lugar)</p>
                        <p className="text-sm text-gray-500">Lleva el dinero el día de tu reserva</p>
                      </div>
                    </div>
                    <Banknote className="h-6 w-6 text-amber-500" />
                  </div>
                </div>

                {/* Resumen final */}
                <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm border border-gray-100">
                  <p className="font-bold text-gray-900 text-base">Resumen de pago</p>
                  <div>
                    <span className="text-gray-500">Cancha: <span className="font-bold text-gray-900">{courtName}</span></span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha: <span className="font-bold text-gray-900">{selectedDate ? formatInTimeZone(selectedDate, 'America/Bogota', "dd 'de' MMMM", { locale: es }) : '—'}</span></span>
                  </div>
                  <div>
                    <span className="text-gray-500">Horario: <span className="font-bold text-gray-900">{selectedSlots[0]} – {endTime}</span></span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-black text-green-700">${totalPrice.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                <button type="submit" disabled={wompiLoading || paymentMutation.isPending || !selectedPaymentMethod}
                  className={`w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-colors shadow-lg ${
                    selectedPaymentMethod === 'efectivo'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}>
                  {selectedPaymentMethod === 'efectivo'
                    ? <Banknote className="h-5 w-5" />
                    : <CreditCard className="h-5 w-5" />
                  }
                  {wompiLoading || paymentMutation.isPending
                    ? 'Procesando...'
                    : selectedPaymentMethod === 'efectivo'
                      ? 'Confirmar reserva (pago en el lugar)'
                      : 'Confirmar y pagar'
                  }
                </button>
              </>
            )}

            <button type="button" onClick={() => setStep('summary')} disabled={wompiLoading || paymentMutation.isPending}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm py-3 rounded-2xl transition-all disabled:opacity-50">
              <ArrowLeft className="h-4 w-4" /> Volver al resumen
            </button>
          </>
        )}
      </form>
    </div>
  );
}