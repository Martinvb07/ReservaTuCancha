'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type State = 'closed' | 'open' | 'closing';

/**
 * Abrir / cerrar dejando que la animación de salida termine antes de desmontar.
 *
 * Sin esto el cierre es un corte seco: el nodo desaparece en el mismo frame del
 * clic. `closing` permite pintar la clase de salida y `exitMs` debe coincidir con
 * la duración de esa animación en CSS.
 */
export function useAnimatedDisclosure(exitMs: number) {
  const [state, setState] = useState<State>('closed');
  /* Espejo en ref: hide() necesita leer el estado actual sin recrearse en cada
     render ni arrastrar closures viejas. */
  const stateRef = useRef<State>('closed');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  };

  const set = useCallback((s: State) => { stateRef.current = s; setState(s); }, []);

  const show = useCallback(() => { clearTimer(); set('open'); }, [set]);

  const hide = useCallback(() => {
    if (stateRef.current !== 'open') return;
    clearTimer();
    set('closing');
    timer.current = setTimeout(() => { timer.current = null; set('closed'); }, exitMs);
  }, [exitMs, set]);

  /* Cierre instantáneo, sin animación de salida (cambio de ruta, resize, etc.) */
  const reset = useCallback(() => { clearTimer(); set('closed'); }, [set]);

  useEffect(() => clearTimer, []);

  return {
    open:    state !== 'closed',
    closing: state === 'closing',
    show, hide, reset,
  };
}
