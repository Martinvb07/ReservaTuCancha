'use client';

import { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { campo } from './TarjetaCuenta';

/** Las mismas reglas que valida el backend (CuentaService.validarClave). */
export function reglasClave(clave: string) {
  return [
    { ok: clave.length >= 8, texto: 'Al menos 8 caracteres' },
    { ok: /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(clave) && /\d/.test(clave), texto: 'Letras y números' },
  ];
}

/** Clave nueva + confirmación, con las reglas a la vista. */
export default function CamposClave({ clave, setClave, repetir, setRepetir }: {
  clave: string; setClave: (v: string) => void; repetir: string; setRepetir: (v: string) => void;
}) {
  const [ver, setVer] = useState(false);
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="nueva" className="block text-xs font-bold text-gray-700 mb-1.5">Contraseña nueva</label>
        <div className="relative">
          <input id="nueva" type={ver ? 'text' : 'password'} autoComplete="new-password" className={`${campo} pr-11`}
            value={clave} onChange={(e) => setClave(e.target.value)} />
          <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
            {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {reglasClave(clave).map((r) => (
            <li key={r.texto} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-700' : 'text-gray-500'}`}>
              <Check className={`h-3.5 w-3.5 ${r.ok ? 'opacity-100' : 'opacity-30'}`} /> {r.texto}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <label htmlFor="repetir" className="block text-xs font-bold text-gray-700 mb-1.5">Repítela</label>
        <input id="repetir" type={ver ? 'text' : 'password'} autoComplete="new-password" className={campo}
          value={repetir} onChange={(e) => setRepetir(e.target.value)} />
        {repetir && repetir !== clave && <p className="text-xs text-red-600 mt-1">No coinciden</p>}
      </div>
    </div>
  );
}

export const claveLista = (clave: string, repetir: string) =>
  reglasClave(clave).every((r) => r.ok) && clave === repetir;
