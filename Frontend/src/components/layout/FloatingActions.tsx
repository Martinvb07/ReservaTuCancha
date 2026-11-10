'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SupportChat, { ABRIR_SOPORTE } from './SupportChat';

/* Los flotantes estorban en las pantallas de autenticación (que ocupan
   toda la ventana), así que ahí no se montan.
   El changelog ya no vive acá: tiene su propia página en /novedades, enlazada
   desde el footer. */
export default function FloatingActions() {
  const pathname = usePathname() || '';
  const [chatAbierto, setChatAbierto] = useState(false);

  /* La página de soporte no monta su propio chat: pide abrir este. */
  useEffect(() => {
    const abrir = () => setChatAbierto(true);
    window.addEventListener(ABRIR_SOPORTE, abrir);
    return () => window.removeEventListener(ABRIR_SOPORTE, abrir);
  }, []);

  if (pathname.startsWith('/auth')) return null;

  return (
    <>
      <SupportChat open={chatAbierto} onOpenChange={setChatAbierto} />
    </>
  );
}
