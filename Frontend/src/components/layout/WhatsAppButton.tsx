// src/components/layout/WhatsAppButton.tsx
'use client';
import { MessageCircle } from 'lucide-react';

/** `oculto` lo usa el asistente de soporte: en vez de desmontar el botón
 *  (que se ve como un parpadeo) lo desvanece mientras su panel está abierto. */
export default function WhatsAppButton({ oculto = false }: { oculto?: boolean }) {
  return (
    <a
      href="https://wa.me/573124352786?text=Hola%2C%20necesito%20ayuda%20con%20ReservaTuCancha"
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={oculto ? -1 : 0}
      aria-hidden={oculto}
      className={`
        fab-float fab-expand
        fixed bottom-6 right-6 z-50
        flex items-center
        bg-green-500 hover:bg-green-600
        text-white shadow-xl hover:shadow-2xl
        transition-all duration-500 ease-in-out group
        rounded-full
        /* Estado inicial: Círculo perfecto de 56px */
        h-14 w-14
        overflow-hidden
        ${oculto
          ? 'pointer-events-none scale-50 opacity-0'
          : 'scale-100 opacity-100 active:scale-95'}
      `}
      aria-label="Contactar por WhatsApp"
    >
      {/* Contenedor del icono: Siempre centrado y fijo */}
      <div className="flex items-center justify-center h-14 w-14 shrink-0">
        {/* Icono de 28px para que se vea igual de grande que la campana */}
        <MessageCircle className="h-7 w-7" />
      </div>
      
      {/* Texto: Expansión suave (solo en dispositivos con puntero, ver .fab-expand) */}
      <span className="
        fab-expand-label
        opacity-0
        max-w-0
        transition-all duration-500 ease-in-out
        whitespace-nowrap font-bold text-sm
        pr-6
      ">
        ¿Necesitas ayuda?
      </span>
    </a>
  );
}