'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, AlertCircle, CreditCard } from 'lucide-react';
import { cargarEpayco } from '@/lib/epayco';

/* Los ids de sesión de ePayco son hexadecimales. Se valida antes de pasarlo
   al checkout para que esta página no abra cualquier cosa que le pongan en
   la URL. */
const SESION_VALIDA = /^[a-f0-9]{16,64}$/i;

/**
 * Puente entre la app y el checkout de ePayco.
 *
 * La app crea la sesión en el backend (que fija el monto) y abre esta página
 * en el navegador del teléfono con el id. Acá solo se abre el checkout: al
 * terminar, ePayco vuelve a la URL de respuesta que el backend dejó en la
 * sesión.
 */
function PagarContent() {
  const params = useSearchParams();
  const sesion = params.get('session') ?? '';
  const test = params.get('test') === '1';
  const valida = SESION_VALIDA.test(sesion);

  const [error, setError] = useState<string | null>(valida ? null : 'El enlace de pago no es válido.');
  const [abriendo, setAbriendo] = useState(valida);

  const abrir = useCallback(async () => {
    if (!valida) return;
    setAbriendo(true);
    setError(null);
    try {
      const ePayco = await cargarEpayco();
      ePayco.checkout.configure({ sessionId: sesion, type: 'standard', test }).open();
    } catch (e: any) {
      setAbriendo(false);
      setError(e?.message ?? 'No se pudo abrir el pago');
    }
  }, [sesion, test, valida]);

  useEffect(() => { abrir(); }, [abrir]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-lime-400 shadow-lg shadow-lime-400/30 flex items-center justify-center mx-auto">
          {error
            ? <AlertCircle className="h-10 w-10 text-gray-900" />
            : <Lock className="h-10 w-10 text-gray-900" />}
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-xs uppercase tracking-widest text-lime-400">Pago seguro con ePayco</p>
          <h1 className="text-3xl font-black uppercase text-white">
            {error ? 'No se pudo abrir' : 'Abriendo el pago'}
          </h1>
          <p className="text-gray-400 text-sm">
            {error ?? 'En un momento verás el checkout de ePayco. No cierres esta ventana.'}
          </p>
        </div>

        {abriendo && !error && <Loader2 className="h-6 w-6 text-lime-400 animate-spin mx-auto" />}

        {valida && !abriendo && (
          <button onClick={abrir}
            className="w-full inline-flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold py-3.5 rounded-2xl transition-colors">
            <CreditCard className="h-5 w-5" /> Abrir el pago
          </button>
        )}

        {!valida && (
          <Link href="/" className="inline-block text-sm font-semibold text-lime-400 hover:underline">
            Volver al inicio
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PagarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <PagarContent />
    </Suspense>
  );
}
