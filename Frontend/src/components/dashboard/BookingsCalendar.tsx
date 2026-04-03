'use client';

import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Clock, User, Mail, Phone,
  Eye, X, CheckCircle, CalendarDays,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { Booking } from '@/types/booking.types';

const STATUS_STYLES: Record<string, { pill: string; dot: string; bg: string }> = {
  pending:   { pill: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400', bg: 'bg-yellow-400' },
  confirmed: { pill: 'bg-green-100 text-green-700',   dot: 'bg-green-500',  bg: 'bg-green-500'  },
  cancelled: { pill: 'bg-red-100 text-red-600',       dot: 'bg-red-400',    bg: 'bg-red-400'    },
  completed: { pill: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400',   bg: 'bg-blue-400'   },
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const COLOMBIA_TZ = 'America/Bogota';

// Convertir hora 24h (ej: "17:00") a 12h AM/PM (ej: "5:00 PM")
function formatTime12h(time24h: string): string {
  const [hours, minutes] = time24h.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

interface Props {
  bookings: Booking[];
  onChangeStatus: (id: string, status: string) => void;
}

export default function BookingsCalendar({ bookings, onChangeStatus }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Group bookings by date string (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      const key = b.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    // Sort each day's bookings by startTime
    Object.values(map).forEach(arr => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [bookings]);

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd   = endOfMonth(currentMonth);
    const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const dayBookings = selectedDay
    ? bookingsByDate[format(selectedDay, 'yyyy-MM-dd')] ?? []
    : [];

  return (
    <div className="space-y-4">
      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase py-2.5">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const key      = format(day, 'yyyy-MM-dd');
            const dayItems = bookingsByDate[key] ?? [];
            const inMonth  = isSameMonth(day, currentMonth);
            const today    = isToday(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`
                  relative min-h-[72px] sm:min-h-[90px] p-1.5 sm:p-2 border-b border-r border-gray-50
                  text-left transition-all hover:bg-green-50/50 group
                  ${!inMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'bg-green-50 ring-2 ring-inset ring-green-400' : ''}
                `}
              >
                {/* Day number */}
                <span className={`
                  inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs sm:text-sm font-bold
                  ${today ? 'bg-green-600 text-white' : 'text-gray-700 group-hover:text-green-700'}
                `}>
                  {format(day, 'd')}
                </span>

                {/* Booking indicators */}
                {dayItems.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {/* Show up to 3 bookings on desktop, 2 dots on mobile */}
                    <div className="hidden sm:block space-y-0.5">
                      {dayItems.slice(0, 3).map(b => {
                        const st = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending;
                        const court = typeof b.courtId === 'object' ? b.courtId : null;
                        return (
                          <div
                            key={b._id}
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md truncate ${st.pill}`}
                          >
                            {formatTime12h(b.startTime)} {court?.name ?? ''}
                          </div>
                        );
                      })}
                      {dayItems.length > 3 && (
                        <div className="text-[9px] font-bold text-gray-400 px-1.5">
                          +{dayItems.length - 3} más
                        </div>
                      )}
                    </div>
                    {/* Mobile: just dots */}
                    <div className="flex gap-0.5 sm:hidden flex-wrap">
                      {dayItems.slice(0, 5).map(b => {
                        const st = STATUS_STYLES[b.status] ?? STATUS_STYLES.pending;
                        return (
                          <span key={b._id} className={`w-1.5 h-1.5 rounded-full ${st.bg}`} />
                        );
                      })}
                      {dayItems.length > 5 && (
                        <span className="text-[8px] font-bold text-gray-400">+{dayItems.length - 5}</span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLES[key].bg}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-gray-900 text-sm sm:text-base uppercase">
                {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
              </h3>
              <p className="text-xs text-gray-400">
                {dayBookings.length} {dayBookings.length === 1 ? 'reserva' : 'reservas'}
              </p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {dayBookings.length === 0 ? (
            <div className="text-center py-10">
              <CalendarDays className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-semibold">Sin reservas este día</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {dayBookings.map(booking => {
                const court = typeof booking.courtId === 'object' ? booking.courtId : null;
                const st    = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;
                return (
                  <div key={booking._id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/50 transition-all">
                    {/* Time block */}
                    <div className="w-16 sm:w-20 shrink-0 text-center">
                      <p className="text-sm sm:text-base font-black text-gray-900">{formatTime12h(booking.startTime)}</p>
                      <p className="text-[10px] text-gray-400">{formatTime12h(booking.endTime)}</p>
                    </div>

                    {/* Vertical line with status color */}
                    <div className={`w-1 self-stretch rounded-full ${st.bg}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {court && <span className="font-bold text-gray-900 text-sm">{court.name}</span>}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{booking.guestName}</span>
                        </span>
                        <span className="font-black text-green-700">
                          ${booking.totalPrice?.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setSelectedBooking(booking)} title="Ver detalles"
                        className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {booking.status === 'pending' && (
                        <button onClick={() => onChangeStatus(booking._id, 'confirmed')} title="Confirmar"
                          className="w-8 h-8 rounded-full border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-500 hover:bg-amber-100 transition-all">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button onClick={() => onChangeStatus(booking._id, 'cancelled')} title="Cancelar"
                          className="w-8 h-8 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-all">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Booking detail modal */}
      <Dialog open={!!selectedBooking} onOpenChange={open => { if (!open) setSelectedBooking(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-gray-900">Detalle de reserva</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-2">
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_STYLES[selectedBooking.status]?.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[selectedBooking.status]?.dot}`} />
                {STATUS_LABELS[selectedBooking.status]}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><CalendarDays className="h-4 w-4 text-green-600" />{format(new Date(selectedBooking.date), 'PPP', { locale: es })}</div>
                <div className="flex items-center gap-2 text-gray-600"><Clock className="h-4 w-4 text-green-600" />{formatTime12h(selectedBooking.startTime)} – {formatTime12h(selectedBooking.endTime)}</div>
                <div className="flex items-center gap-2 text-gray-600"><User className="h-4 w-4 text-green-600" />{selectedBooking.guestName}</div>
                <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 text-green-600" />{selectedBooking.guestEmail}</div>
                <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-green-600" />{selectedBooking.guestPhone}</div>
                {selectedBooking.notes && <div className="text-gray-500 pt-1 border-t border-gray-100">📝 {selectedBooking.notes}</div>}
              </div>
              {selectedBooking.bookingCode && (
                <div className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-500 font-semibold">Código</span>
                  <span className="font-black text-gray-700 font-mono tracking-widest">#{selectedBooking.bookingCode}</span>
                </div>
              )}
              <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-600 font-semibold">Total</span>
                <span className="font-black text-green-700 text-lg">${selectedBooking.totalPrice?.toLocaleString('es-CO')} COP</span>
              </div>
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                <div className="flex gap-2">
                  {selectedBooking.status === 'pending' && (
                    <button
                      onClick={() => { onChangeStatus(selectedBooking._id, 'confirmed'); setSelectedBooking(null); }}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" /> Confirmar
                    </button>
                  )}
                  <button
                    onClick={() => { onChangeStatus(selectedBooking._id, 'cancelled'); setSelectedBooking(null); }}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 hover:bg-red-50 text-red-500 font-bold text-sm py-2.5 rounded-xl transition-colors"
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setSelectedBooking(null)} className="w-full border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm py-2.5 rounded-xl transition-all">
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
