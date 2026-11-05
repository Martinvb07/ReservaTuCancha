'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { urlParaVolver } from '@/lib/listadoGuardado';

/**
 * "Volver" de la ficha de una cancha: si se entró desde el listado, lleva a
 * esa misma búsqueda (y el listado se restaura con sus filtros y scroll);
 * si no, al listado general.
 */
export default function VolverListado({
  className, children, ariaLabel,
}: { className?: string; children: React.ReactNode; ariaLabel?: string }) {
  const [href, setHref] = useState('/empresas');
  useEffect(() => setHref(urlParaVolver()), []);
  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
