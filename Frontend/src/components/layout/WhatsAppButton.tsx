// src/components/layout/WhatsAppButton.tsx
'use client';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/573124352786?text=Hola%2C%20necesito%20ayuda%20con%20ReservaTuCancha"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
        ¿Necesitas ayuda?
      </span>
    </a>
  );
}