'use client';

import { useMemo, useState } from 'react';
import {
  Landmark, Smartphone, KeyRound, CheckCircle2, AlertCircle, Loader2, Save,
  Pencil, ChevronLeft, ChevronRight, ShieldCheck,
} from 'lucide-react';
import StepWizard, { type WizardStep } from '@/components/ui/StepWizard';

/** Por dónde le giramos al club. Debe coincidir con METODOS_PAGO del backend. */
export type MetodoPago = 'bancolombia' | 'nequi' | 'daviplata' | 'breb';

export interface DatosBanco {
  metodo?: MetodoPago | string;
  titular?: string;
  documento?: string;
  banco?: string;
  tipoCuenta?: string;
  numero?: string;
  llave?: string;
  tipoLlave?: string;
}

interface Props {
  /** Lo que ya está guardado, si el club lo configuró antes. */
  actual?: DatosBanco | null;
  guardando: boolean;
  onGuardar: (datos: DatosBanco) => void;
}

const METODOS: {
  key: MetodoPago; nombre: string; desc: string; Icon: typeof Landmark; color: string;
}[] = [
  { key: 'bancolombia', nombre: 'Bancolombia', desc: 'Cuenta de ahorros o corriente', Icon: Landmark,   color: 'text-yellow-600' },
  { key: 'nequi',       nombre: 'Nequi',       desc: 'A tu número de celular',        Icon: Smartphone, color: 'text-fuchsia-600' },
  { key: 'daviplata',   nombre: 'Daviplata',   desc: 'A tu número de celular',        Icon: Smartphone, color: 'text-red-600' },
  { key: 'breb',        nombre: 'Llave Bre-B', desc: 'Con tu llave, sin número de cuenta', Icon: KeyRound, color: 'text-blue-600' },
];

const TIPOS_LLAVE: { key: string; label: string; ejemplo: string }[] = [
  { key: 'alfanumerica', label: 'Alfanumérica', ejemplo: '@micancha' },
  { key: 'celular',      label: 'Celular',      ejemplo: '3001234567' },
  { key: 'correo',       label: 'Correo',       ejemplo: 'club@correo.com' },
  { key: 'documento',    label: 'Documento',    ejemplo: '1.234.567.890' },
];

const PASOS: WizardStep[] = [
  { title: 'Método',   hint: 'Por dónde quieres recibir' },
  { title: 'Datos',    hint: 'A nombre de quién giramos' },
  { title: 'Confirma', hint: 'Revisa antes de guardar' },
];

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';

export function etiquetaMetodo(m?: string): string {
  return METODOS.find((x) => x.key === m)?.nombre ?? m ?? '—';
}

/** Lo que se le muestra al club de su cuenta ya guardada. */
function resumenFilas(d: DatosBanco): { label: string; value: string }[] {
  const filas = [
    { label: 'Método', value: etiquetaMetodo(d.metodo) },
    { label: 'Titular', value: d.titular || '—' },
    { label: 'Cédula o NIT', value: d.documento || '—' },
  ];
  if (d.metodo === 'bancolombia') {
    filas.push({ label: 'Tipo de cuenta', value: d.tipoCuenta === 'corriente' ? 'Corriente' : 'Ahorros' });
    filas.push({ label: 'Número de cuenta', value: d.numero || '—' });
  } else if (d.metodo === 'breb') {
    filas.push({ label: 'Tipo de llave', value: TIPOS_LLAVE.find((t) => t.key === d.tipoLlave)?.label ?? '—' });
    filas.push({ label: 'Llave', value: d.llave || '—' });
  } else {
    filas.push({ label: 'Celular', value: d.numero || '—' });
  }
  return filas;
}

export default function CuentaPagosWizard({ actual, guardando, onGuardar }: Props) {
  const yaConfigurada = !!actual?.metodo;

  /* Con cuenta guardada se entra en modo resumen; el wizard se abre al editar,
     igual que en la edición de canchas. */
  const [editando, setEditando] = useState(!yaConfigurada);
  const [paso, setPaso] = useState(0);
  const [dir, setDir]   = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<DatosBanco>({
    metodo: actual?.metodo, titular: actual?.titular ?? '', documento: actual?.documento ?? '',
    banco: actual?.banco ?? '', tipoCuenta: actual?.tipoCuenta ?? 'ahorros',
    numero: actual?.numero ?? '', llave: actual?.llave ?? '', tipoLlave: actual?.tipoLlave ?? 'alfanumerica',
  });

  const set = (campo: keyof DatosBanco, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError(null);
  };

  const irA = (destino: number) => { setDir(destino > paso ? 1 : -1); setPaso(destino); setError(null); };

  const esBanco = form.metodo === 'bancolombia';
  const esBreb  = form.metodo === 'breb';
  const metodoActivo = METODOS.find((m) => m.key === form.metodo);

  /** Mismas reglas que el DTO del backend, para avisar antes de mandar. */
  const faltante = useMemo(() => {
    if (paso === 0 && !form.metodo) return 'Elige por dónde quieres recibir tus pagos';
    if (paso === 1) {
      if ((form.titular ?? '').trim().length < 3) return 'Escribe el nombre completo del titular';
      if ((form.documento ?? '').trim().length < 5) return 'La cédula o NIT parece incompleto';
      if (esBreb && !(form.llave ?? '').trim()) return 'Escribe tu llave Bre-B';
      if (!esBreb && !(form.numero ?? '').trim()) {
        return esBanco ? 'Falta el número de cuenta' : 'Falta el número de celular';
      }
    }
    return null;
  }, [paso, form, esBanco, esBreb]);

  const siguiente = () => {
    if (faltante) { setError(faltante); return; }
    irA(Math.min(paso + 1, PASOS.length - 1));
  };

  const guardar = () => {
    const datos: DatosBanco = {
      metodo: form.metodo,
      titular: (form.titular ?? '').trim(),
      documento: (form.documento ?? '').trim(),
      ...(esBanco
        ? { banco: 'Bancolombia', tipoCuenta: form.tipoCuenta, numero: (form.numero ?? '').trim() }
        : esBreb
          ? { llave: (form.llave ?? '').trim(), tipoLlave: form.tipoLlave }
          : { numero: (form.numero ?? '').trim() }),
    };
    onGuardar(datos);
  };

  // ── Modo resumen: ya hay cuenta y no se está editando ───────────
  if (!editando) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 md:p-5 flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-green-600 grid place-items-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </span>
          <div className="text-sm min-w-0">
            <p className="font-bold text-gray-900">Cuenta registrada</p>
            <p className="text-gray-600 mt-1">Acá te transferimos tu liquidación cada lunes. Mantenla al día.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-4 md:p-5 border-b border-gray-100">
            {metodoActivo && (
              <span className="w-11 h-11 rounded-xl bg-gray-50 grid place-items-center shrink-0">
                <metodoActivo.Icon className={`h-5 w-5 ${metodoActivo.color}`} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-black text-gray-900 truncate">{etiquetaMetodo(actual?.metodo)}</p>
              <p className="text-xs text-gray-500 truncate">{actual?.titular}</p>
            </div>
            <button type="button" onClick={() => { setEditando(true); setPaso(0); }}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-700 border-2 border-gray-200 hover:border-gray-400 rounded-xl px-3 py-2 transition-colors shrink-0">
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
          </div>

          <dl className="divide-y divide-gray-100">
            {resumenFilas(actual ?? {}).map((f) => (
              <div key={f.label} className="flex items-start justify-between gap-4 px-4 md:px-5 py-3">
                <dt className="text-sm text-gray-500 shrink-0">{f.label}</dt>
                <dd className="text-sm font-bold text-gray-900 text-right break-all">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    );
  }

  // ── Wizard ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {!yaConfigurada && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:p-5 flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500 grid place-items-center shrink-0">
            <AlertCircle className="h-5 w-5 text-white" />
          </span>
          <div className="text-sm min-w-0">
            <p className="font-bold text-gray-900">Falta tu cuenta de pagos</p>
            <p className="text-gray-600 mt-1">Sin estos datos no podemos girarte lo recaudado. Son tres pasos cortos.</p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-3xl border border-gray-100 p-4 sm:p-6 md:p-8">
        <StepWizard steps={PASOS} step={paso} dir={dir} onGoTo={(i) => i < paso && irA(i)}>

          {/* ── PASO 1: método ───────────────────────────────── */}
          {paso === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {METODOS.map((m) => {
                const activo = form.metodo === m.key;
                return (
                  <button key={m.key} type="button"
                    onClick={() => { set('metodo', m.key); }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 bg-white text-left transition-colors ${
                      activo ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                    }`}>
                    <span className="w-11 h-11 rounded-xl bg-gray-50 grid place-items-center shrink-0">
                      <m.Icon className={`h-5 w-5 ${m.color}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-black text-gray-900 text-sm">{m.nombre}</span>
                      <span className="block text-xs text-gray-500 leading-snug">{m.desc}</span>
                    </span>
                    {activo && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── PASO 2: datos del método elegido ─────────────── */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Titular de la cuenta <span className="text-red-500">*</span></label>
                  <input className={inp} placeholder="Nombre como aparece en el banco"
                    value={form.titular} onChange={(e) => set('titular', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Cédula o NIT <span className="text-red-500">*</span></label>
                  <input className={inp} placeholder="1.234.567.890"
                    value={form.documento} onChange={(e) => set('documento', e.target.value)} />
                </div>
              </div>

              {esBanco && (
                <div>
                  <label className={lbl}>Tipo de cuenta <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    {[['ahorros', 'Ahorros'], ['corriente', 'Corriente']].map(([v, l]) => {
                      const activo = form.tipoCuenta === v;
                      return (
                        <button key={v} type="button" onClick={() => set('tipoCuenta', v)}
                          className={`py-3 rounded-xl border-2 bg-white font-bold text-sm transition-colors ${
                            activo ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600 hover:border-green-300'
                          }`}>
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {esBreb && (
                <div>
                  <label className={lbl}>Tipo de llave <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TIPOS_LLAVE.map((t) => {
                      const activo = form.tipoLlave === t.key;
                      return (
                        <button key={t.key} type="button" onClick={() => set('tipoLlave', t.key)}
                          className={`py-2.5 px-2 rounded-xl border-2 bg-white transition-colors ${
                            activo ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                          }`}>
                          <span className={`block text-[13px] font-bold ${activo ? 'text-green-800' : 'text-gray-700'}`}>{t.label}</span>
                          <span className="block text-[10px] text-gray-400 truncate">{t.ejemplo}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {esBreb ? (
                <div>
                  <label className={lbl}>Tu llave Bre-B <span className="text-red-500">*</span></label>
                  <input className={inp}
                    placeholder={TIPOS_LLAVE.find((t) => t.key === form.tipoLlave)?.ejemplo ?? '@micancha'}
                    value={form.llave} onChange={(e) => set('llave', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Escríbela tal cual la registraste en tu banco, con arroba si la tiene.
                  </p>
                </div>
              ) : (
                <div>
                  <label className={lbl}>
                    {esBanco ? 'Número de cuenta' : 'Número de celular'} <span className="text-red-500">*</span>
                  </label>
                  <input className={inp} inputMode="numeric"
                    placeholder={esBanco ? '000-000000-00' : '3001234567'}
                    value={form.numero} onChange={(e) => set('numero', e.target.value)} />
                  {!esBanco && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      El mismo celular con el que abriste tu {etiquetaMetodo(form.metodo)}.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── PASO 3: revisar ──────────────────────────────── */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <dl className="divide-y divide-gray-100">
                  {resumenFilas(form).map((f) => (
                    <div key={f.label} className="flex items-start justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-gray-500 shrink-0">{f.label}</dt>
                      <dd className="text-sm font-bold text-gray-900 text-right break-all">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl p-3.5">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-blue-900">
                  Revisa que el titular y el documento coincidan con la cuenta: si no cuadran,
                  el banco rechaza la transferencia. Te avisaremos por correo cada vez que estos datos cambien.
                </p>
              </div>
            </div>
          )}
        </StepWizard>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-700">{error}</p>
          </div>
        )}

        {/* Botonera: en móvil ocupa todo el ancho y el principal va primero */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          {(paso > 0 || yaConfigurada) && (
            <button type="button"
              onClick={() => (paso > 0 ? irA(paso - 1) : setEditando(false))}
              disabled={guardando}
              className="inline-flex items-center justify-center gap-1.5 sm:px-6 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold transition-colors">
              <ChevronLeft className="h-4 w-4" /> {paso > 0 ? 'Atrás' : 'Cancelar'}
            </button>
          )}

          {paso < PASOS.length - 1 ? (
            <button type="button" onClick={siguiente}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white font-black py-3.5 rounded-2xl transition-colors">
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={guardar} disabled={guardando}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl transition-colors">
              {guardando
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Guardando…</>
                : <><Save className="h-5 w-5" /> Guardar cuenta</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
