'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Smartphone } from 'lucide-react';

/* Los ids de reserva son ObjectId de Mongo. Se valida para no rebotar a la
   app con cualquier cosa que traiga la URL. */
const ID_VALIDO = /^[a-f0-9]{24}$/i;

/**
 * Regreso a la app después de pagar.
 *
 * La app abre el checkout de ePayco en el navegador del teléfono y le pide a
 * ePayco que al terminar vuelva acá. Esta página salta de inmediato al
 * esquema propio de la app (`reservatucancha://pago?bookingId=`), que sí saca
 * al usuario del navegador; la app ya está consultando si el pago entró. Si
 * el navegador bloquea el salto, queda el botón, y si la persona no tiene la
 * app, la confirmación de la web.
 */
function VolverContent() {
  const params = useSearchParams();
  const bookingId = params.get('bookingId') ?? '';
  const valido = ID_VALIDO.test(bookingId);
  const destino = useMemo(
    () => (valido ? `reservatucancha://pago?bookingId=${bookingId}` : ''),
    [bookingId, valido],
  );

  useEffect(() => {
    if (destino) window.location.replace(destino);
  }, [destino]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-lime-400 shadow-lg shadow-lime-400/30 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-gray-900" />
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-xs uppercase tracking-widest text-lime-400">Pago procesado</p>
          <h1 className="text-3xl font-black uppercase text-white">Volviendo a la app</h1>
          <p className="text-gray-400 text-sm">
            Si no se abre sola, toca el botón. Ahí verás si tu reserva quedó confirmada.
          </p>
        </div>

        {valido && (
          <a href={destino}
            className="w-full inline-flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold py-3.5 rounded-2xl transition-colors">
            <Smartphone className="h-5 w-5" /> Volver a la app
          </a>
        )}

        <Link
          href={valido ? `/reservas/confirmacion?bookingId=${bookingId}` : '/'}
          className="inline-block text-sm font-semibold text-gray-400 hover:text-white">
          {valido ? 'Ver la confirmación aquí' : 'Ir al inicio'}
        </Link>
      </div>
    </div>
  );
}

export default function VolverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <VolverContent />
    </Suspense>
  );
}
