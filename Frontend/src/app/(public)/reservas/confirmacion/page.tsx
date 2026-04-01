// src/app/(public)/reserva/confirmacion/page.tsx
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, ChevronRight } from 'lucide-react';

function ConfirmacionContent() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">

        <div className="w-24 h-24 bg-lime-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-lime-400/30">
          <CheckCircle className="h-12 w-12 text-gray-900" />
        </div>

        <div className="space-y-2">
          <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest">✦ Pago procesado</p>
          <h1 className="text-4xl font-black text-white uppercase">¡Listo!</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            Tu pago fue recibido exitosamente.<br />
            Te enviamos todos los detalles de tu reserva al correo electrónico, incluyendo el link para cancelar si lo necesitas.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-gray-400">
          Revisa tu bandeja de entrada (y carpeta de spam por si acaso).
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/empresas"
            className="flex-1 flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold py-3.5 rounded-full transition-colors">
            Buscar más canchas <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href="/"
            className="flex-1 flex items-center justify-center gap-2 border-2 border-white/20 hover:border-white/40 text-white font-semibold py-3.5 rounded-full transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReservaConfirmacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-lime-400 rounded-full animate-spin" />
      </div>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}