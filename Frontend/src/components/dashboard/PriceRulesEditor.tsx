'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Moon, Plus, Sun, Trash2, CalendarDays } from 'lucide-react';
import SelectField from '@/components/ui/SelectField';
import { DAYS, TIME_OPTIONS } from '@/components/dashboard/AvailabilityEditor';
import type { ReglaPrecio } from '@/lib/precios';

const EASE = [0.22, 1, 0.36, 1] as const;

/* "00:00" como fin es la medianoche: se muestra aparte para que no parezca
   que la franja termina antes de empezar. */
const FIN_OPTIONS = [
  ...TIME_OPTIONS.filter((t) => t.value !== '00:00'),
  { value: '00:00', label: 'Medianoche' },
];

const PLANTILLAS: { icon: typeof Moon; label: string; regla: Omit<ReglaPrecio, 'pricePerHour'> }[] = [
  { icon: Moon,         label: 'Noche',         regla: { label: 'Noche', days: [1, 2, 3, 4, 5], from: '18:00', to: '00:00' } },
  { icon: CalendarDays, label: 'Fin de semana', regla: { label: 'Fin de semana', days: [0, 6], from: '06:00', to: '00:00' } },
  { icon: Sun,          label: 'Hora valle',    regla: { label: 'Hora valle', days: [1, 2, 3, 4, 5], from: '09:00', to: '16:00' } },
];

const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const hora = (v: string, fin = false) => (fin ? FIN_OPTIONS : TIME_OPTIONS).find((t) => t.value === v)?.label ?? v;

interface Props {
  /** Precio base, para proponer el de una franja nueva y para el resumen. */
  precioBase: number;
  value: ReglaPrecio[];
  onChange: (reglas: ReglaPrecio[]) => void;
}

/**
 * Franjas con otro precio: la noche, el fin de semana, las horas valle. Lo que
 * no caiga en ninguna franja se cobra al precio base.
 */
export default function PriceRulesEditor({ precioBase, value, onChange }: Props) {
  const reduce = useReducedMotion();

  const agregar = (base: Omit<ReglaPrecio, 'pricePerHour'>, factor = 1.25) =>
    onChange([
      ...value,
      { ...base, pricePerHour: Math.max(1000, Math.round(((precioBase || 0) * factor) / 1000) * 1000) },
    ]);

  const cambiar = (i: number, cambios: Partial<ReglaPrecio>) =>
    onChange(value.map((r, j) => (j === i ? { ...r, ...cambios } : r)));

  const alternarDia = (i: number, dia: number) => {
    const dias = value[i].days.includes(dia)
      ? value[i].days.filter((d) => d !== dia)
      : [...value[i].days, dia].sort((a, b) => a - b);
    if (dias.length) cambiar(i, { days: dias }); // una franja sin días no aplicaría nunca
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-black text-gray-900">Precios por horario</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Cobra distinto de noche o el fin de semana. Lo que no caiga en una franja se cobra a{' '}
          <strong className="text-gray-700">{cop(precioBase || 0)}</strong> la hora.
        </p>
      </div>

      {/* Plantillas: un toque y la franja queda armada, lista para ajustar. */}
      <div className="flex flex-wrap gap-2">
        {PLANTILLAS.map((p) => (
          <motion.button
            key={p.label}
            type="button"
            whileTap={reduce ? undefined : { scale: 0.95 }}
            onClick={() => agregar(p.regla, p.label === 'Hora valle' ? 0.8 : 1.25)}
            className="flex items-center gap-1.5 rounded-full border-2 border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors duration-200 hover:border-green-300 hover:text-green-700"
          >
            <p.icon className="h-3.5 w-3.5" /> {p.label}
          </motion.button>
        ))}
        <motion.button
          type="button"
          whileTap={reduce ? undefined : { scale: 0.95 }}
          onClick={() => agregar({ label: '', days: [1, 2, 3, 4, 5, 6, 0], from: '18:00', to: '22:00' })}
          className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors duration-200 hover:border-green-400 hover:text-green-700"
        >
          <Plus className="h-3.5 w-3.5" /> Otra franja
        </motion.button>
      </div>

      {value.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
          Sin franjas: la cancha vale lo mismo a toda hora.
        </p>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {value.map((r, i) => (
              <motion.div
                key={i}
                layout={!reduce}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Nombre de la franja"
                    value={r.label ?? ''}
                    maxLength={40}
                    onChange={(e) => cambiar(i, { label: e.target.value })}
                    placeholder="Nombre (ej: Noche)"
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                  />
                  <button
                    type="button"
                    aria-label="Quitar franja"
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1.5 sm:flex sm:gap-2">
                  {DAYS.map((d, dia) => {
                    const activo = r.days.includes(dia);
                    return (
                      <motion.button
                        key={d}
                        type="button"
                        aria-pressed={activo}
                        whileTap={reduce ? undefined : { scale: 0.92 }}
                        onClick={() => alternarDia(i, dia)}
                        className={`h-9 w-full sm:w-11 rounded-xl border-2 text-[11px] font-bold transition-colors duration-200 ${
                          activo ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:border-green-300'
                        }`}
                      >
                        {d}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_11rem]">
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs text-gray-500">Desde</label>
                    <SelectField
                      aria-label="Desde"
                      value={r.from}
                      onChange={(v) => cambiar(i, { from: v })}
                      options={TIME_OPTIONS}
                      className="px-3 py-2 rounded-lg"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs text-gray-500">Hasta</label>
                    <SelectField
                      aria-label="Hasta"
                      value={r.to}
                      onChange={(v) => cambiar(i, { to: v })}
                      options={FIN_OPTIONS}
                      className="px-3 py-2 rounded-lg"
                    />
                  </div>
                  <div className="col-span-2 min-w-0 sm:col-span-1">
                    <label className="mb-1 block text-xs text-gray-500">Precio por hora</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">$</span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        aria-label="Precio por hora de la franja"
                        value={Number.isFinite(r.pricePerHour) ? r.pricePerHour : ''}
                        onChange={(e) => cambiar(i, { pricePerHour: Number(e.target.value) })}
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-7 pr-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  {r.days.length === 7 ? 'Todos los días' : r.days.map((d) => DAYS[d]).join(', ')} · {hora(r.from)} a {hora(r.to, true)} ·{' '}
                  <strong className={r.pricePerHour >= (precioBase || 0) ? 'text-gray-800' : 'text-green-700'}>
                    {cop(r.pricePerHour || 0)} la hora
                  </strong>
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {value.length > 1 && (
            <p className="text-[11px] text-gray-500">Si dos franjas se cruzan, se cobra la que está más arriba.</p>
          )}
        </div>
      )}
    </div>
  );
}
