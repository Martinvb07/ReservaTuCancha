'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Alto del navbar (`h-16`), más un margen para que el cambio no ocurra justo
 *  en el borde y quede la píldora medio tapada. */
const NAV_HEIGHT = 64;
const TRIGGER = NAV_HEIGHT + 6;

/** Id que deben llevar las páginas con buscador propio (home, /empresas). */
export const SEARCH_ANCHOR_ID = 'hero-search-anchor';

/**
 * `true` cuando el buscador grande de la página ya pasó por encima del navbar.
 * En ese momento el navbar cambia sus links por un buscador compacto
 * (comportamiento tipo Airbnb).
 *
 * Si la página no tiene buscador el ancla no existe y devuelve `false`, así que
 * el navbar se comporta como siempre sin tener que enumerar rutas aquí.
 */
export function useSearchDock(): boolean {
  const pathname = usePathname();
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    const read = () => {
      const anchor = document.getElementById(SEARCH_ANCHOR_ID);
      /* height 0 = el ancla está oculta (display:none). Sin esto un ancla
         `hidden md:block` mediría bottom 0 y el navbar quedaría siempre docked. */
      if (!anchor) return setDocked(false);
      const rect = anchor.getBoundingClientRect();
      if (rect.height === 0) return setDocked(false);
      setDocked(rect.bottom <= TRIGGER);
    };

    read();
    /* El ancla puede montarse un frame después de navegar */
    const raf = requestAnimationFrame(read);

    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [pathname]);

  return docked;
}
