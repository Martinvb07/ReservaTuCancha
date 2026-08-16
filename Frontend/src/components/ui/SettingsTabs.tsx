'use client';

import type { ComponentType, ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export type SettingsSection = {
  id: string;
  title: string;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  /** Marca la sección con un punto rojo (por ejemplo, si tiene errores) */
  alert?: boolean;
};

interface Props {
  sections: SettingsSection[];
  active: string;
  onChange: (id: string) => void;
  /** Identificador único de la píldora que se desliza (layoutId) */
  id?: string;
  children: ReactNode;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Navegación por secciones tipo "ajustes": en móvil y tablet es una fila
 * deslizable arriba; en escritorio, una columna fija a la izquierda.
 */
export default function SettingsTabs({ sections, active, onChange, id = 'settings', children }: Props) {
  const reduce = useReducedMotion();
  const current = sections.find(s => s.id === active) ?? sections[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-5">

      {/* ── Selector de sección ─────────────────────────────────── */}
      <nav className="lg:sticky lg:top-6 lg:self-start">
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1
                        [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map(s => {
            const isActive = s.id === current.id;
            return (
              <motion.button
                key={s.id}
                type="button"
                onClick={() => onChange(s.id)}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                aria-current={isActive}
                className={`relative shrink-0 lg:w-full flex items-center gap-2.5 rounded-2xl px-4 py-3 text-left transition-colors duration-200 ${
                  isActive ? '' : 'hover:bg-gray-100'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={`${id}-active`}
                    className="absolute inset-0 rounded-2xl bg-green-600 shadow-lg shadow-green-600/20"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-2.5 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  <s.icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-bold whitespace-nowrap">{s.title}</span>
                  {s.alert && (
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-red-500'}`} />
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* ── Panel de la sección activa ──────────────────────────── */}
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduce ? 0.12 : 0.25, ease: EASE }}
            className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6"
          >
            <div className="pb-4 mb-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">{current.title}</h2>
              {current.hint && <p className="text-sm text-gray-500 mt-0.5">{current.hint}</p>}
            </div>
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
