'use client';

import { usePathname } from 'next/navigation';
import WhatsAppButton from './WhatsAppButton';
import ChangelogFloatingButton from './ChangelogFloatingButton';

/* Los flotantes estorban en las pantallas de autenticación (que ocupan
   toda la ventana), así que ahí no se montan. */
export default function FloatingActions() {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/auth')) return null;

  return (
    <>
      <WhatsAppButton />
      <ChangelogFloatingButton />
    </>
  );
}
