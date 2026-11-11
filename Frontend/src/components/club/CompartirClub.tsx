'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

/** Comparte la página del club con el menú del teléfono; si no hay, copia el link. */
export default function CompartirClub({ nombre, className = '' }: { nombre: string; className?: string }) {
  const compartir = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: nombre, text: `Reserva tu cancha en ${nombre}`, url }); } catch { /* canceló */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    } catch {
      toast.error('No se pudo copiar el link');
    }
  };
  return (
    <button type="button" onClick={compartir} className={className} aria-label="Compartir este club">
      <Share2 className="h-4 w-4" /> Compartir
    </button>
  );
}
