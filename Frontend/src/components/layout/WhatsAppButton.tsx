// src/components/layout/WhatsAppButton.tsx
'use client';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/573124352786?text=Hola%2C%20necesito%20ayuda%20con%20ReservaTuCancha"
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed bottom-6 right-6 z-50 
        flex items-center
        bg-green-500 hover:bg-green-600 
        text-white shadow-xl hover:shadow-2xl 
        transition-all duration-500 ease-in-out group
        rounded-full
        /* Estado inicial: Círculo perfecto de 56px */
        h-14 w-14 hover:w-56
        overflow-hidden
      "
      aria-label="Contactar por WhatsApp"
    >
      {/* Contenedor del icono: Siempre centrado y fijo */}
      <div className="flex items-center justify-center h-14 w-14 shrink-0">
        {/* Icono de 28px para que se vea igual de grande que la campana */}
        <MessageCircle className="h-7 w-7" />
      </div>
      
      {/* Texto: Expansión suave */}
      <span className="
        opacity-0 group-hover:opacity-100
        max-w-0 group-hover:max-w-full
        transition-all duration-500 ease-in-out
        whitespace-nowrap font-bold text-sm
        pr-6
      ">
        ¿Necesitas ayuda?
      </span>
    </a>
  );
}