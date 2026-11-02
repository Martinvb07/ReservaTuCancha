'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import api from '@/lib/api/axios';
import TarjetaCuenta, { boton, mensajeDe } from '@/components/auth/TarjetaCuenta';
import CamposClave, { claveLista } from '@/components/auth/CamposClave';

function Restablecer() {
  const token = useSearchParams().get('token') ?? '';
  const [clave, setClave] = useState('');
  const [repetir, setRepetir] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claveLista(clave, repetir)) return;
    setGuardando(true);
    setError(null);
    try {
      await api.post('/cuenta/restablecer', { token, clave });
      setListo(true);
    } catch (err) {
      setError(mensajeDe(err, 'No se pudo cambiar la contraseña'));
    } finally {
      setGuardando(false);
    }
  };

  if (!token) {
    return (
      <TarjetaCuenta titulo="Enlace incompleto" subtitulo="Abre el enlace tal cual llegó al correo, o pide uno nuevo.">
        <Link href="/auth/olvide" className={`${boton} block text-center`}>Pedir un enlace nuevo</Link>
      </TarjetaCuenta>
    );
  }

  return (
    <TarjetaCuenta titulo="Elige tu contraseña nueva" subtitulo="Al guardarla se cierran las sesiones abiertas en otros equipos.">
      {listo ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 flex gap-3 text-sm text-green-900">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" /> Listo, ya puedes entrar con tu contraseña nueva.
          </div>
          <Link href="/auth/login" className={`${boton} block text-center`}>Iniciar sesión</Link>
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-4">
          <CamposClave clave={clave} setClave={setClave} repetir={repetir} setRepetir={setRepetir} />
          {error && (
            <p className="text-sm text-red-600">
              {error} {error.includes('venció') && <Link href="/auth/olvide" className="underline font-semibold">Pedir otro</Link>}
            </p>
          )}
          <button type="submit" disabled={guardando || !claveLista(clave, repetir)} className={boton}>
            {guardando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </TarjetaCuenta>
  );
}

export default function RestablecerClavePage() {
  return (
    <Suspense>
      <Restablecer />
    </Suspense>
  );
}
