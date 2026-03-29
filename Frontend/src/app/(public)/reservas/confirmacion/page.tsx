// src/app/(public)/reserva/confirmacion/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Calendar, Clock, User, Mail, Phone, MapPin, ChevronRight, Download, X } from 'lucide-react';
import api from '@/lib/api/axios';

function ConfirmacionContent() {
  const params    = useSearchParams();
  const bookingId = params.get('bookingId');
  const token     = params.get('token');

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking-confirm', bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${bookingId}`);
      return data;
    },
    enabled: !!bookingId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-lime-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <X className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase">Reserva no encontrada</h2>
          <p className="text-gray-400">El link puede haber expirado o la reserva no existe.</p>
          <Link href="/empresas"
            className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-6 py-3 rounded-full transition-colors">
            Buscar canchas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const court = typeof booking.courtId === 'object' ? booking.courtId : null;

  // Código único de reserva (bookingCode real)
  // Siempre mostrar el bookingCode real si existe
  const codigoReserva = booking.bookingCode || 'N/A';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">

        {/* Header éxito */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-lime-400/30">
            <CheckCircle className="h-10 w-10 text-gray-900" />
          </div>
          <div>
            <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest mb-1">✦ Reserva confirmada</p>
            <h1 className="text-4xl font-black text-white uppercase">¡Todo listo!</h1>
            <p className="text-gray-400 mt-2">
              Revisa tu email — te enviamos todos los detalles y el link para cancelar si lo necesitas.
            </p>
          </div>
        </div>

        {/* Ticket de reserva */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">

          {/* Top — código */}
          <div className="bg-gray-900 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Código de reserva</p>
              <p className="text-lime-400 text-2xl font-black tracking-widest mt-0.5">#{codigoReserva}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
              booking.status === 'pending'   ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {booking.status === 'confirmed' ? '✅ Confirmada' :
               booking.status === 'pending'   ? '⏳ Pendiente' : booking.status}
            </div>
          </div>

          {/* Línea punteada separadora */}
          <div className="flex items-center gap-0 relative">
            <div className="w-5 h-5 bg-gray-900 rounded-full -translate-x-2.5 shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
            <div className="w-5 h-5 bg-gray-900 rounded-full translate-x-2.5 shrink-0" />
          </div>

          {/* Detalles */}
          <div className="px-6 py-5 space-y-4">
            {court && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Cancha</p>
                  <p className="font-black text-gray-900">{court.name}</p>
                  {court.location && (
                    <p className="text-xs text-gray-500">{court.location.address}, {court.location.city}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Fecha</p>
                  <p className="font-black text-gray-900 text-sm">
                    {format(new Date(booking.date), "dd 'de' MMM", { locale: es })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(booking.date), 'yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Horario</p>
                  <p className="font-black text-gray-900 text-sm">{booking.startTime}</p>
                  <p className="text-xs text-gray-500">hasta {booking.endTime}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="font-semibold">{booking.guestName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{booking.guestEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{booking.guestPhone}</span>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">Total pagado</span>
              <span className="text-2xl font-black text-green-700">
                ${booking.totalPrice?.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="bg-gray-50 px-6 py-4 space-y-2">
            <p className="text-xs text-gray-400 text-center">
              ¿Necesitas cancelar? Revisa tu email — te enviamos un link de cancelación gratuita hasta 2 horas antes.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/empresas"
            className="flex-1 flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold py-3.5 rounded-full transition-colors">
            Buscar más canchas <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href="/"
            className="flex-1 flex items-center justify-center gap-2 border-2 border-white/20 hover:border-white/40 text-white font-semibold py-3.5 rounded-full transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReservaConfirmacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-lime-400 rounded-full animate-spin" />
      </div>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}