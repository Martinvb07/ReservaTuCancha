'use client';

import { usePathname } from 'next/navigation';
import WhatsAppButton from './WhatsAppButton';

/* Los flotantes estorban en las pantallas de autenticación (que ocupan
   toda la ventana), así que ahí no se montan.
   El changelog ya no vive acá: tiene su propia página en /novedades, enlazada
   desde el footer. */
export default function FloatingActions() {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/auth')) return null;

  return <WhatsAppButton />;
}
