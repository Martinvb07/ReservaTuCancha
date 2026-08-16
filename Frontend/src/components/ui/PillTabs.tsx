'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
  /** Único por página: identifica la píldora que se desliza (layoutId) */
  id: string;
  className?: string;
}

export default function PillTabs({ tabs, active, onChange, id, className = '' }: Props) {
  const reduce = useReducedMotion();

  return (
    <div className={`flex flex-wrap gap-2 justify-center ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <motion.button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            aria-pressed={isActive}
            whileTap={reduce ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`relative px-5 py-2 rounded-full text-sm font-bold border-2 bg-white transition-colors duration-300 ${
              isActive ? 'border-green-600' : 'border-gray-200 hover:border-green-300'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`${id}-tab-pill`}
                className="absolute -inset-[2px] rounded-full bg-green-600 shadow-lg shadow-green-600/25"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
