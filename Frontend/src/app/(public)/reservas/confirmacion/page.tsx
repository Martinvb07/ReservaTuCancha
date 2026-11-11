'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, ChevronRight, Repeat } from 'lucide-react';
import api from '@/lib/api/axios';
import type { Booking } from '@/types';

/** Si la reserva es un turno fijo, muestra todas las fechas que se pagaron. */
function ResumenSerie({ bookingId }: { bookingId: string }) {
  const { data } = useQuery<Booking>({
    queryKey: ['reserva-confirmada', bookingId],
    queryFn: async () => (await api.get(`/bookings/${bookingId}`)).data,
    retry: false,
  });
  const serie = data?.serie;
  if (!serie || serie.semanas < 2) return null;
  const corta = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };
  return (
    <div className="bg-gray-800 border border-lime-400/30 rounded-2xl px-5 py-4 text-left space-y-2">
      <p className="flex items-center gap-2 text-xs font-bold text-lime-400 uppercase tracking-widest">
        <Repeat className="h-4 w-4" /> Turno fijo · {serie.semanas} semanas
      </p>
      <p className="text-white text-sm font-semibold">{serie.fechas.map(corta).join(' · ')}</p>
      <p className="text-gray-400 text-xs">
        {data?.startTime} – {data?.endTime} · Total ${serie.total.toLocaleString('es-CO')} COP
      </p>
    </div>
  );
}

function ConfirmacionContent() {
  const params = useSearchParams();
  const method = params.get('method');
  const code = params.get('code');
  const bookingId = params.get('bookingId');
  const isEfectivo = method === 'efectivo';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12 overflow-x-hidden">
      <div className="w-full max-w-sm text-center space-y-6">

        {/* Icono */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg ${isEfectivo ? 'bg-amber-400 shadow-amber-400/30' : 'bg-lime-400 shadow-lime-400/30'}`}>
          {isEfectivo
            ? <Clock className="h-10 w-10 text-gray-900" />
            : <CheckCircle className="h-10 w-10 text-gray-900" />
          }
        </div>

        {/* Título */}
        <div className="space-y-2">
          <p className={`font-semibold text-xs uppercase tracking-widest ${isEfectivo ? 'text-amber-400' : 'text-lime-400'}`}>
            {isEfectivo ? 'Reserva registrada' : 'Pago procesado'}
          </p>
          <h1 className="text-3xl font-black text-white">¡Todo listo!</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            {isEfectivo
              ? 'Tu reserva fue registrada. Preséntate con tu código de reserva y realiza el pago en efectivo al llegar.'
              : 'Tu pago fue recibido. Te enviamos los detalles al correo con el link para cambiar de horario si lo necesitas.'
            }
          </p>
        </div>

        {/* Código de reserva — solo para efectivo */}
        {isEfectivo && code && (
          <div className="bg-gray-800 border border-amber-400/30 rounded-2xl px-6 py-5 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Código de reserva</p>
            <p className="text-amber-400 text-4xl font-black tracking-widest">#{code}</p>
            <div className="h-px bg-gray-700" />
            <p className="text-gray-400 text-xs leading-relaxed">
              Presenta este código cuando llegues al lugar para confirmar tu reserva.
            </p>
          </div>
        )}

        {bookingId && !isEfectivo && <ResumenSerie bookingId={bookingId} />}

        {/* Nota de correo */}
        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-gray-400">
          {isEfectivo
            ? 'Te enviamos un correo con todos los detalles y el link de cancelación.'
            : 'Revisa tu bandeja de entrada (y carpeta de spam por si acaso).'
          }
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 pt-1">
          <Link href="/empresas"
            className={`flex items-center justify-center gap-2 font-bold py-3.5 rounded-full transition-colors ${isEfectivo ? 'bg-amber-400 hover:bg-amber-300 text-gray-900' : 'bg-lime-400 hover:bg-lime-300 text-gray-900'}`}>
            Buscar más canchas <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href="/"
            className="flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white text-sm font-semibold py-3.5 rounded-full transition-colors">
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
