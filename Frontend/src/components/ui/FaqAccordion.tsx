'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export type FaqItem = { q: string; a: string };

/* Curva tipo "out expo": arranca rápido y frena elegante */
const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  items: FaqItem[];
  /** Al cambiar, la lista se reanima y se cierra la pregunta abierta (ej: la categoría activa) */
  resetKey?: string | number;
  className?: string;
  itemClassName?: string;
  /** Clases extra que se aplican solo a la tarjeta abierta */
  openItemClassName?: string;
  questionClassName?: string;
  answerClassName?: string;
  iconClassName?: string;
}

export default function FaqAccordion({
  items,
  resetKey,
  className = 'space-y-3',
  itemClassName = 'w-full text-left bg-white border border-gray-100 rounded-2xl p-5 hover:border-green-200',
  openItemClassName = 'border-green-300 shadow-[0_14px_40px_-20px_rgba(22,163,74,0.55)]',
  questionClassName = 'font-bold text-gray-800',
  answerClassName = 'text-sm text-gray-500 leading-relaxed',
  iconClassName = 'h-5 w-5',
}: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => { setOpen(null); }, [resetKey]);

  return (
    /* popLayout: la lista saliente sale del flujo, así la entrante ocupa su lugar
       de inmediato y no se produce el salto de altura al cambiar de categoría */
    <div className="relative">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={resetKey ?? 'faq'}
          className={`${className} w-full`}
          initial="hidden"
          whileInView="show"
          exit="exit"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
            exit: { transition: { staggerChildren: reduce ? 0 : 0.03, staggerDirection: -1 } },
          }}
        >
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={item.q}
                variants={{
                  hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
                  show:   { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.4, ease: EASE } },
                  exit:   { opacity: 0, y: reduce ? 0 : -8, transition: { duration: 0.15, ease: 'easeIn' } },
                }}
              >
                <motion.button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.99 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`${itemClassName} ${isOpen ? openItemClassName : ''} transition-[border-color,box-shadow] duration-300`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={questionClassName}>{item.q}</span>
                    <motion.span
                      className="shrink-0 mt-0.5"
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 28 }}
                    >
                      <ChevronRight
                        className={`${iconClassName} transition-colors duration-200 ${isOpen ? 'text-green-500' : 'text-gray-400'}`}
                      />
                    </motion.span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height:  { duration: reduce ? 0 : 0.34, ease: EASE },
                          opacity: { duration: reduce ? 0 : 0.22 },
                        }}
                      >
                        <motion.p
                          className={`${answerClassName} pt-3`}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.28, ease: EASE, delay: reduce ? 0 : 0.06 } }}
                          exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
                        >
                          {item.a}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
