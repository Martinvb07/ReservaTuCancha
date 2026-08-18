'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import WhatsAppButton from './WhatsAppButton';
import SupportChat from './SupportChat';

/* Los flotantes estorban en las pantallas de autenticación (que ocupan
   toda la ventana), así que ahí no se montan.
   El changelog ya no vive acá: tiene su propia página en /novedades, enlazada
   desde el footer. */
export default function FloatingActions() {
  const pathname = usePathname() || '';
  const [chatAbierto, setChatAbierto] = useState(false);

  if (pathname.startsWith('/auth')) return null;

  return (
    <>
      {/* Con el chat abierto el FAB de WhatsApp queda debajo del panel: se desvanece. */}
      <WhatsAppButton oculto={chatAbierto} />
      <SupportChat open={chatAbierto} onOpenChange={setChatAbierto} />
    </>
  );
}
