'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  KeyRound, UserRound, ShieldAlert, Eye, EyeOff, Check, Loader2, Save, Mail, BadgeCheck,
} from 'lucide-react';
import api from '@/lib/api/axios';
import SettingsTabs, { type SettingsSection } from '@/components/ui/SettingsTabs';
import { mensajeDe } from '@/components/auth/TarjetaCuenta';
import { reglasClave, claveLista } from '@/components/auth/CamposClave';

/* Los mismos estilos de Mi Club. */
const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';

/** Qué tan buena es la contraseña, de 0 a 4. */
function fuerza(clave: string) {
  if (!clave) return 0;
  let p = 0;
  if (clave.length >= 8) p++;
  if (/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(clave) && /\d/.test(clave)) p++;
  if (clave.length >= 12) p++;
  if (/[A-Z]/.test(clave) && /[a-z]/.test(clave) && /[^A-Za-z0-9]/.test(clave)) p++;
  return p;
}
const NIVELES = [
  { texto: '', color: 'bg-gray-200', tono: 'text-gray-500' },
  { texto: 'Débil', color: 'bg-red-500', tono: 'text-red-600' },
  { texto: 'Aceptable', color: 'bg-amber-500', tono: 'text-amber-600' },
  { texto: 'Buena', color: 'bg-green-500', tono: 'text-green-600' },
  { texto: 'Muy fuerte', color: 'bg-green-600', tono: 'text-green-700' },
];

function CampoClave({ id, valor, onCambio, ver, autoComplete, placeholder }: {
  id: string; valor: string; onCambio: (v: string) => void; ver: boolean; autoComplete: string; placeholder?: string;
}) {
  return (
    <input id={id} type={ver ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder}
      className={inp} value={valor} onChange={(e) => onCambio(e.target.value)} />
  );
}

/** Mi cuenta: los datos de acceso y cambiar la contraseña. Es obligatorio si entró con una temporal. */
export default function MiCuentaPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const obligatorio = !!user?.debeCambiarClave;
  const [seccion, setSeccion] = useState('clave');
  const [actual, setActual] = useState('');
  const [clave, setClave] = useState('');
  const [repetir, setRepetir] = useState('');
  const [ver, setVer] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const rol = user?.role === 'admin' ? 'Administrador' : user?.esStaff ? 'Equipo del club' : 'Propietario';
  const inicial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  const nivel = NIVELES[fuerza(clave)];
  const listo = !!actual && claveLista(clave, repetir);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listo) return;
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

  const SECCIONES: SettingsSection[] = [
    { id: 'clave', title: 'Contraseña', hint: 'Cámbiala cuando quieras; tu sesión sigue abierta al guardar', icon: KeyRound, alert: obligatorio },
    { id: 'datos', title: 'Datos', hint: 'Con qué datos entras al panel', icon: UserRound },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          {user?.role === 'admin' ? 'Administración' : 'Panel Propietario'}
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase">Mi cuenta</h1>
        <p className="text-gray-500 text-sm mt-1">Tu acceso al panel de ReservaTuCancha</p>
      </div>

      {/* Quién está conectado */}
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-lime-400 grid place-items-center text-xl font-black text-gray-900 shrink-0">
          {inicial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black truncate">{user?.name ?? 'Tu cuenta'}</p>
          <p className="text-sm text-gray-400 truncate">{user?.email}</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold bg-lime-400 text-gray-900 px-3 py-1.5 rounded-full shrink-0">
          <BadgeCheck className="h-3.5 w-3.5" /> {rol}
        </span>
      </div>

      {obligatorio && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-bold">Elige tu propia contraseña</p>
            <p className="mt-0.5">Entraste con la contraseña temporal que te llegó por correo. Cámbiala para seguir usando el panel.</p>
          </div>
        </div>
      )}

      <SettingsTabs id="mi-cuenta" sections={SECCIONES} active={seccion} onChange={setSeccion}>

        {seccion === 'clave' && (
          <form onSubmit={guardar} className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label htmlFor="actual" className={`${lbl} mb-0`}>
                  {obligatorio ? 'Contraseña temporal' : 'Contraseña actual'}
                </label>
                <Link href="/auth/olvide" className="text-xs font-semibold text-gray-500 hover:text-green-600">
                  ¿No la recuerdas?
                </Link>
              </div>
              <CampoClave id="actual" valor={actual} onCambio={setActual} ver={ver} autoComplete="current-password"
                placeholder={obligatorio ? 'La que te llegó por correo' : ''} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nueva" className={lbl}>Contraseña nueva</label>
                <div className="relative">
                  <CampoClave id="nueva" valor={clave} onCambio={setClave} ver={ver} autoComplete="new-password" />
                  <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="repetir" className={lbl}>Repítela</label>
                <CampoClave id="repetir" valor={repetir} onCambio={setRepetir} ver={ver} autoComplete="new-password" />
                {repetir && repetir !== clave && <p className="text-xs text-red-500 mt-1">No coinciden</p>}
              </div>
            </div>

            {/* Fuerza y reglas */}
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={`h-1.5 rounded-full transition-colors ${fuerza(clave) >= i ? nivel.color : 'bg-gray-200'}`} />
                  ))}
                </div>
                <span className={`text-xs font-bold w-20 text-right ${nivel.tono}`}>{nivel.texto}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {reglasClave(clave).map((r) => (
                  <span key={r.texto}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                      r.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500'
                    }`}>
                    <Check className="h-3.5 w-3.5" /> {r.texto}
                  </span>
                ))}
                <span className="text-xs text-gray-500 self-center">Con 12 o más, mayúsculas y un símbolo queda muy fuerte.</span>
              </div>
            </div>

            <button type="submit" disabled={guardando || !listo}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-green-600/20">
              {guardando
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>
                : <><Save className="h-5 w-5" /> Guardar contraseña</>}
            </button>
          </form>
        )}

        {seccion === 'datos' && (
          <div className="space-y-4">
            {[
              { icono: UserRound, etiqueta: 'Nombre', valor: user?.name ?? '—' },
              { icono: Mail, etiqueta: 'Correo de acceso', valor: user?.email ?? '—' },
              { icono: BadgeCheck, etiqueta: 'Rol', valor: rol },
            ].map((d) => (
              <div key={d.etiqueta} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 grid place-items-center shrink-0">
                  <d.icono className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{d.etiqueta}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.valor}</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500">
              ¿Necesitas cambiar el correo con el que entras? Escríbenos desde{' '}
              <Link href="/dashboard/propetario/soporte" className="font-semibold text-green-600 hover:underline">Soporte</Link>.
              Los datos que ven tus clientes se editan en{' '}
              <Link href="/dashboard/propetario/mi-club" className="font-semibold text-green-600 hover:underline">Mi Club</Link>.
            </p>
          </div>
        )}
      </SettingsTabs>
    </div>
  );
}
