// src/app/(public)/reservas/cancelar/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, CalendarDays, Clock, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api/axios';

function CancelarContent() {
  const params = useSearchParams();
  const token  = params.get('token');
  const [cancelled, setCancelled] = useState(false);

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking-cancel', token],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/cancel-info?token=${token}`);
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get(`/bookings/cancel?token=${token}`);
      return data;
    },
    onSuccess: () => setCancelled(true),
  });

  // Sin token
  if (!token) {
    return (
      <div className="text-center space-y-4 py-20">
        <XCircle className="h-16 w-16 text-red-400 mx-auto" />
        <h2 className="text-2xl font-black text-white uppercase">Link inválido</h2>
        <p className="text-gray-400">Este link de cancelación no es válido.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-6 py-3 rounded-full transition-colors">
          Volver al inicio
        </Link>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-lime-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Error — token inválido o ya cancelada
  if (isError) {
    return (
      <div className="text-center space-y-4 py-20 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase">No se puede cancelar</h2>
        <p className="text-gray-400">El link expiró, la reserva ya fue cancelada, o han pasado más de 2 horas del turno.</p>
        <Link href="/mis-reservas" className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-6 py-3 rounded-full transition-colors">
          Ver mis reservas
        </Link>
      </div>
    );
  }

  // Cancelada exitosamente
  if (cancelled) {
    return (
      <div className="text-center space-y-6 py-10 max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase">¡Reserva cancelada!</h2>
          <p className="text-gray-400 mt-2">
            Tu reserva fue cancelada exitosamente. Si pagaste online, el reembolso se procesará en 5-7 días hábiles.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-gray-400 space-y-1 text-left">
          <p>✉️ Recibirás un email de confirmación de cancelación.</p>
          <p>💳 Reembolso en 5-7 días hábiles si pagaste con tarjeta.</p>
        </div>
        <Link href="/empresas" className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-6 py-3 rounded-full transition-colors">
          Buscar otra cancha
        </Link>
      </div>
    );
  }

  // Confirmar cancelación
  const court = typeof booking?.courtId === 'object' ? booking.courtId : null;

  return (
    <div className="max-w-md mx-auto space-y-6 py-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase">Cancelar reserva</h2>
        <p className="text-gray-400 text-sm">¿Estás seguro? Esta acción no se puede deshacer.</p>
      </div>

      {/* Detalle reserva */}
      {booking && (
        <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-gray-900 px-5 py-4">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Reserva a cancelar</p>
            <p className="text-white font-black text-lg">{court?.name ?? 'Cancha'}</p>
          </div>
          <div className="p-5 space-y-3">
            {court?.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                {court.location.city}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="h-4 w-4 text-green-600 shrink-0" />
              {booking.date && format(new Date(booking.date), "EEEE dd 'de' MMMM yyyy", { locale: es })}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-green-600 shrink-0" />
              {booking.startTime} – {booking.endTime}
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-black text-green-700 text-lg">${booking.totalPrice?.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-sm text-yellow-300">
        ⚠️ La cancelación gratuita aplica hasta 2 horas antes del turno. Pasado ese tiempo el propietario puede no efectuar el reembolso.
      </div>

      <div className="flex gap-3">
        <Link href="/mis-reservas"
          className="flex-1 flex items-center justify-center border-2 border-white/20 hover:border-white/40 text-white font-bold py-3.5 rounded-2xl transition-all">
          Mantener reserva
        </Link>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl transition-colors"
        >
          {mutation.isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Cancelando...</>
            : <><XCircle className="h-4 w-4" /> Sí, cancelar</>}
        </button>
      </div>
    </div>
  );
}

export default function CancelarReservaPage() {
  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Suspense fallback={<div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-gray-700 border-t-lime-400 rounded-full animate-spin" /></div>}>
          <CancelarContent />
        </Suspense>
      </div>
    </main>
  );
}