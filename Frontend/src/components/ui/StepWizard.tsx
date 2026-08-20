'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

export const WIZARD_EASE = [0.22, 1, 0.36, 1] as const;

export type WizardStep = { title: string; hint?: string };

interface Props {
  steps: WizardStep[];
  step: number;
  /** 1 = avanzando, -1 = retrocediendo: define hacia dónde se desliza el paso */
  dir: number;
  /** Si se pasa, el stepper deja volver a un paso ya completado */
  onGoTo?: (i: number) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Cabecera con stepper + contenedor animado del paso actual.
 * Quien lo usa se encarga del formulario y de los botones de navegación.
 */
export default function StepWizard({ steps, step, dir, onGoTo, children, className = '' }: Props) {
  const reduce = useReducedMotion();
  const last = steps.length - 1;

  /* Medimos el paso visible para animar el alto con `height` real: usar `layout`
     deformaría los campos mientras dura la transición. */
  const [boxH, setBoxH] = useState<number | 'auto'>('auto');
  const roRef = useRef<ResizeObserver | null>(null);
  const measure = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;            // el paso saliente se desmonta después: lo ignoramos
    roRef.current?.disconnect();
    const ro = new ResizeObserver(() => setBoxH(el.offsetHeight));
    ro.observe(el);
    roRef.current = ro;
    setBoxH(el.offsetHeight);
  }, []);
  useEffect(() => () => roRef.current?.disconnect(), []);

  return (
    <div className={className}>
      {/* ── Stepper ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center">
          {steps.map((s, i) => {
            const done    = i < step;
            const current = i === step;
            return (
              <Fragment key={s.title}>
                <button
                  type="button"
                  onClick={() => done && onGoTo?.(i)}
                  disabled={!done || !onGoTo}
                  className={`flex items-center gap-2 shrink-0 ${done && onGoTo ? 'cursor-pointer group' : 'cursor-default'}`}
                >
                  <motion.span
                    animate={{ scale: current ? 1.1 : 1 }}
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 22 }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-colors duration-300 ${
                      done    ? 'bg-green-600 text-white' :
                      current ? 'bg-gray-900 text-white ring-4 ring-gray-900/10' :
                                'bg-white border border-gray-200 text-gray-400'
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {done ? (
                        <motion.span key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </motion.span>
                      ) : (
                        <motion.span key="num" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
                          {i + 1}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.span>
                  {/* Las etiquetas solo caben en desktop; en móvil el paso se
                      identifica con el título grande de abajo */}
                  <span className={`hidden lg:block text-xs font-black uppercase tracking-wide whitespace-nowrap transition-colors duration-300 ${
                    current ? 'text-gray-900' : done ? 'text-green-700 group-hover:text-green-800' : 'text-gray-400'
                  }`}>
                    {s.title}
                  </span>
                </button>

                {i < last && (
                  <div className="flex-1 min-w-[0.75rem] h-0.5 mx-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-600 origin-left"
                      initial={false}
                      animate={{ scaleX: done ? 1 : 0 }}
                      transition={reduce ? { duration: 0 } : { duration: 0.4, ease: WIZARD_EASE }}
                    />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest">
            Paso {step + 1} de {steps.length}
          </p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{steps[step].title}</h3>
          {steps[step].hint && <p className="text-gray-500 text-sm mt-0.5">{steps[step].hint}</p>}
        </div>
      </div>

      {/* ── Paso actual ─────────────────────────────────────────── */}
      <motion.div
        className="relative overflow-hidden"
        initial={false}
        animate={{ height: boxH }}
        transition={reduce ? { duration: 0 } : { duration: 0.3, ease: WIZARD_EASE }}
      >
        {/* popLayout saca del flujo al paso saliente para que no empuje nada */}
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={step}
            ref={measure}
            custom={dir}
            variants={{
              enter:  (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 48 }),
              center: { opacity: 1, x: 0 },
              exit:   (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -48 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0.12 : 0.3, ease: WIZARD_EASE }}
            /* El p-1 entra en la medida del alto: deja aire para que el
               overflow-hidden no recorte el anillo verde de foco */
            className="space-y-4 p-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
