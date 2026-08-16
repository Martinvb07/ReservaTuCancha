'use client';

import { motion, useReducedMotion } from 'framer-motion';
import SelectField from '@/components/ui/SelectField';

export interface AvailabilitySlot {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
}

export const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Horas en punto, en formato AM/PM */
export const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i < 12 ? 'AM' : 'PM';
  const label = i === 0 ? '12:00 AM' : i === 12 ? '12:00 PM' : `${String(i % 12).padStart(2, '0')}:00 ${ampm}`;
  return { value: `${String(i).padStart(2, '0')}:00`, label };
});

export const DURATIONS = [
  { value: '60',  label: '1h'   },
  { value: '90',  label: '1.5h' },
  { value: '120', label: '2h'   },
];

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  value: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
}

/** Días de atención + franja horaria de cada día. */
export default function AvailabilityEditor({ value, onChange }: Props) {
  const reduce = useReducedMotion();

  const toggleDay = (day: number) =>
    onChange(
      value.find(s => s.dayOfWeek === day)
        ? value.filter(s => s.dayOfWeek !== day)
        : [...value, { dayOfWeek: day, openTime: '07:00', closeTime: '22:00', slotDurationMinutes: 60 }]
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    );

  const updateSlot = (day: number, field: keyof AvailabilitySlot, v: string | number) =>
    onChange(value.map(s => (s.dayOfWeek === day ? { ...s, [field]: v } : s)));

  return (
    <div className="space-y-4">
      {/* 7 columnas: en móvil los días siguen cabiendo en una sola fila */}
      <div className="grid grid-cols-7 gap-1.5 sm:flex sm:gap-2">
        {DAYS.map((day, i) => {
          const active = value.some(s => s.dayOfWeek === i);
          return (
            <motion.button
              key={day}
              type="button"
              whileTap={reduce ? undefined : { scale: 0.92 }}
              onClick={() => toggleDay(i)}
              className={`h-11 w-full sm:w-11 rounded-xl text-[11px] sm:text-xs font-bold border-2 bg-white transition-colors duration-200 ${
                active ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400 hover:border-green-300'
              }`}
            >
              {day}
            </motion.button>
          );
        })}
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-gray-400">Selecciona al menos un día de atención.</p>
      ) : (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          {value.map(slot => (
            <motion.div
              key={slot.dayOfWeek}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              /* Móvil: una tarjeta por día. Desktop: una sola fila. */
              className="rounded-xl border border-gray-200 bg-white p-3 sm:border-0 sm:bg-transparent sm:p-0"
            >
              <p className="text-xs font-black text-gray-700 uppercase tracking-widest mb-2 sm:hidden">
                {DAYS[slot.dayOfWeek]}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end sm:gap-3">
                <div className="hidden sm:block sm:w-12 sm:shrink-0">
                  <span className="text-xs text-gray-400 block mb-1 font-bold">{DAYS[slot.dayOfWeek]}</span>
                </div>

                <div className="min-w-0 sm:flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Inicio</label>
                  <SelectField
                    aria-label={`Hora de inicio ${DAYS[slot.dayOfWeek]}`}
                    value={slot.openTime}
                    onChange={v => updateSlot(slot.dayOfWeek, 'openTime', v)}
                    options={TIME_OPTIONS}
                    className="px-3 py-2 rounded-lg"
                  />
                </div>

                <span className="hidden sm:block text-gray-400 font-bold pb-2">—</span>

                <div className="min-w-0 sm:flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Fin</label>
                  <SelectField
                    aria-label={`Hora de cierre ${DAYS[slot.dayOfWeek]}`}
                    value={slot.closeTime}
                    onChange={v => updateSlot(slot.dayOfWeek, 'closeTime', v)}
                    options={TIME_OPTIONS}
                    className="px-3 py-2 rounded-lg"
                  />
                </div>

                <div className="col-span-2 min-w-0 sm:w-24 sm:shrink-0">
                  <label className="text-xs text-gray-400 block mb-1">Duración</label>
                  <SelectField
                    aria-label={`Duración del turno ${DAYS[slot.dayOfWeek]}`}
                    value={String(slot.slotDurationMinutes)}
                    onChange={v => updateSlot(slot.dayOfWeek, 'slotDurationMinutes', Number(v))}
                    options={DURATIONS}
                    className="px-3 py-2 rounded-lg"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
