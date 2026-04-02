// src/app/(public)/reserva/confirmacion/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, ChevronRight } from 'lucide-react';

function ConfirmacionContent() {
  const params = useSearchParams();
  const method = params.get('method');
  const isEfectivo = method === 'efectivo';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">

        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg ${isEfectivo ? 'bg-amber-400 shadow-amber-400/30' : 'bg-lime-400 shadow-lime-400/30'}`}>
          {isEfectivo
            ? <Clock className="h-12 w-12 text-gray-900" />
            : <CheckCircle className="h-12 w-12 text-gray-900" />
          }
        </div>

        <div className="space-y-2">
          {isEfectivo ? (
            <>
              <p className="text-amber-400 font-semibold text-sm uppercase tracking-widest">✦ Reserva pendiente</p>
              <h1 className="text-4xl font-black text-white uppercase">¡Listo!</h1>
              <p className="text-gray-400 text-base leading-relaxed">
                Tu reserva fue creada exitosamente.<br />
                Recuerda llevar el pago en efectivo cuando llegues al lugar.
              </p>
            </>
          ) : (
            <>
              <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest">✦ Pago procesado</p>
              <h1 className="text-4xl font-black text-white uppercase">¡Listo!</h1>
              <p className="text-gray-400 text-base leading-relaxed">
                Tu pago fue recibido exitosamente.<br />
                Te enviamos todos los detalles de tu reserva al correo electrónico, incluyendo el link para cancelar si lo necesitas.
              </p>
            </>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-gray-400">
          {isEfectivo
            ? 'Revisa tu correo — te enviamos los detalles y el link para cancelar si lo necesitas.'
            : 'Revisa tu bandeja de entrada (y carpeta de spam por si acaso).'
          }
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/empresas"
            className={`flex-1 flex items-center justify-center gap-2 font-bold py-3.5 rounded-full transition-colors ${isEfectivo ? 'bg-amber-400 hover:bg-amber-300 text-gray-900' : 'bg-lime-400 hover:bg-lime-300 text-gray-900'}`}>
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
