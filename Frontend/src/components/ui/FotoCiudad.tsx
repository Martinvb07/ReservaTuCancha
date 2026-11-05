'use client';

import { useEffect, useRef, useState } from 'react';
import { FOTO_CIUDAD } from '@/lib/ciudades';

/**
 * Foto de una ciudad (enlazada a su sitio de origen). Si no carga, usa la de
 * respaldo (por ejemplo, una cancha de esa ciudad) y, si tampoco hay, no
 * pinta nada: queda el fondo del contenedor. Llena su contenedor, que tiene
 * que ser `relative`.
 */
export default function FotoCiudad({
  ciudad, respaldo = '', className = '', prioridad = false,
}: { ciudad: string; respaldo?: string; className?: string; prioridad?: boolean }) {
  const elegir = () => FOTO_CIUDAD[ciudad] || respaldo;
  const [src, setSrc] = useState(elegir);
  useEffect(() => setSrc(elegir()), [ciudad, respaldo]); // eslint-disable-line react-hooks/exhaustive-deps
  const fallar = () => setSrc((actual) => (actual !== respaldo ? respaldo : ''));
  /* Si la foto falló antes de que React tomara la página (viene del HTML del
     servidor), el onError ya pasó: se revisa al montar. */
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) fallar();
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!src) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt={`Canchas en ${ciudad}`}
      loading={prioridad ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={fallar}
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
}
