'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, ShieldAlert } from 'lucide-react';
import api from '@/lib/api/axios';
import { boton, campo, mensajeDe } from '@/components/auth/TarjetaCuenta';
import CamposClave, { claveLista } from '@/components/auth/CamposClave';

/** Mi cuenta: cambiar la contraseña. Es obligatorio si entró con una temporal. */
export default function MiCuentaPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const obligatorio = !!(session?.user as any)?.debeCambiarClave;
  const [actual, setActual] = useState('');
  const [clave, setClave] = useState('');
  const [repetir, setRepetir] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claveLista(clave, repetir) || !actual) return;
    setGuardando(true);
    try {
      await api.post('/cuenta/clave', { actual, nueva: clave });
      await update({ debeCambiarClave: false });
      toast.success('Contraseña actualizada');
      setActual(''); setClave(''); setRepetir('');
      if (obligatorio) router.replace('/dashboard');
    } catch (err) {
      toast.error(mensajeDe(err, 'No se pudo cambiar la contraseña'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Mi cuenta</h1>
        <p className="text-gray-500 text-sm mt-1">{session?.user?.email}</p>
      </div>

      {obligatorio && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-sm text-amber-900">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
          <p>Entraste con la contraseña temporal que te llegó por correo. Elige una tuya para seguir usando el panel.</p>
        </div>
      )}

      <form onSubmit={guardar} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <p className="flex items-center gap-2 font-black text-gray-900 text-sm">
          <KeyRound className="h-4 w-4 text-green-600" /> Cambiar contraseña
        </p>
        <div>
          <label htmlFor="actual" className="block text-xs font-bold text-gray-700 mb-1.5">
            {obligatorio ? 'Contraseña temporal (la del correo)' : 'Contraseña actual'}
          </label>
          <input id="actual" type="password" autoComplete="current-password" className={campo}
            value={actual} onChange={(e) => setActual(e.target.value)} />
        </div>
        <CamposClave clave={clave} setClave={setClave} repetir={repetir} setRepetir={setRepetir} />
        <button type="submit" disabled={guardando || !actual || !claveLista(clave, repetir)} className={boton}>
          {guardando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
}
