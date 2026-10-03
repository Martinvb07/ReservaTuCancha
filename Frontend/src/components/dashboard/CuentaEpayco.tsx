'use client';

import { useState } from 'react';
import { CheckCircle, ExternalLink, Loader2, Save, ShieldCheck } from 'lucide-react';

interface Props {
  /** Id ya registrado, si el club lo tiene */
  actual?: string;
  guardando: boolean;
  onGuardar: (epaycoReceptorId: string) => void;
}

const PASOS = [
  'Crea tu cuenta en ePayco con el RUT y la Cámara de Comercio del club.',
  'En tu panel de ePayco, regístrate como comercio y también como receptor.',
  'Agrega a ReservaTuCancha como comercio asociado.',
  'Copia tu ID de cliente (P_CUST_ID_CLIENTE) y pégalo acá abajo.',
];

/**
 * Cuenta de ePayco del club.
 *
 * Reemplaza al formulario de datos bancarios: con pagos divididos la plata ya
 * no pasa por la cuenta de ReservaTuCancha, ePayco le consigna al club directo
 * en el momento del cobro. Por eso lo que hace falta no es un número de cuenta
 * sino el id del club como receptor.
 */
export default function CuentaEpayco({ actual, guardando, onGuardar }: Props) {
  const [valor, setValor] = useState(actual ?? '');
  const listo = !!actual;

  /* Mismo criterio que valida el backend: solo dígitos. Avisar acá evita que
     el club se entere del error en el primer cobro fallido. */
  const valido = /^\d{3,32}$/.test(valor.trim());

  return (
    <div className="space-y-5">

      {listo && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-green-900 text-sm">Tu cuenta está conectada</p>
            <p className="text-xs text-green-700 mt-0.5">
              Cada reserva se te consigna directo, sin esperar a fin de semana.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 grid place-items-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-lime-400" />
          </div>
          <div className="min-w-0">
            <h2 className="font-black text-gray-900 uppercase text-sm tracking-wide">Cuenta de ePayco</h2>
            <p className="text-gray-500 text-sm mt-1 leading-snug">
              El pago de cada reserva se divide en el momento: a ti te llega tu parte y a nosotros la
              nuestra. Para eso necesitas tu propia cuenta de ePayco.
            </p>
          </div>
        </div>

        <ol className="mt-5 space-y-2.5">
          {PASOS.map((paso, i) => (
            <li key={paso} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold grid place-items-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {paso}
            </li>
          ))}
        </ol>

        <a href="https://epayco.com/registro" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-green-700 hover:text-green-800">
          Abrir cuenta en ePayco <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <label htmlFor="epayco-id" className="block text-xs font-semibold text-gray-500 mb-1.5">
            Tu ID de cliente en ePayco
          </label>
          <input
            id="epayco-id"
            inputMode="numeric"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Ej: 1234567"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 transition"
          />
          {valor.trim() !== '' && !valido && (
            <p className="text-xs text-red-500 mt-1.5">
              El ID de ePayco son solo números, sin espacios ni guiones.
            </p>
          )}

          <button
            type="button"
            disabled={!valido || guardando || valor.trim() === (actual ?? '')}
            onClick={() => onGuardar(valor.trim())}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-colors"
          >
            {guardando
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
              : <><Save className="h-4 w-4" /> {listo ? 'Actualizar' : 'Conectar mi cuenta'}</>}
          </button>

          {!listo && (
            <p className="text-[11px] text-gray-400 mt-3 leading-snug text-center">
              Mientras no conectes tu cuenta, tus canchas no pueden recibir reservas pagadas en línea.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
