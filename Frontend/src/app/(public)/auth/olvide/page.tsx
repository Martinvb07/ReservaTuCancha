'use client';

import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import api from '@/lib/api/axios';
import TarjetaCuenta, { boton, campo, mensajeDe } from '@/components/auth/TarjetaCuenta';

export default function OlvideClavePage() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await api.post('/cuenta/olvide', { email: email.trim() });
      setEnviado(true);
    } catch (err) {
      setError(mensajeDe(err, 'No pudimos enviar el correo. Intenta de nuevo en un momento.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TarjetaCuenta
      titulo="Recupera tu contraseña"
      subtitulo="Escribe el correo de tu cuenta del panel y te mandamos un enlace para elegir una nueva."
    >
      {enviado ? (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 flex gap-3">
          <MailCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm text-green-900">
            <p className="font-bold">Revisa tu correo</p>
            <p className="mt-1">Te mandamos un enlace a <strong>{email}</strong> que sirve durante 1 hora. Si no lo ves, mira en spam.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1.5">Correo</label>
            <input id="email" type="email" required autoComplete="email" className={campo}
              placeholder="propietario@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={enviando} className={boton}>
            {enviando ? 'Enviando…' : 'Enviarme el enlace'}
          </button>
        </form>
      )}
    </TarjetaCuenta>
  );
}
