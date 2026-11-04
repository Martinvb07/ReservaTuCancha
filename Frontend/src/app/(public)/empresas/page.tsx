import type { Metadata } from 'next';
import { Suspense } from 'react';
import EmpresasPageClient from './page.client';

export const metadata: Metadata = {
  title: 'Canchas deportivas en Colombia',
  description: 'Encuentra y reserva canchas de futbol, padel y voley playa cerca de ti. Sin registro, pago seguro y confirmacion inmediata.',
  openGraph: {
    title: 'Canchas deportivas en Colombia | ReservaTuCancha',
    description: 'Encuentra y reserva canchas de futbol, padel y voley playa cerca de ti.',
    type: 'website',
    locale: 'es_CO',
  },
};

export default function EmpresasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-5 pt-6 md:pt-10">
          <div className="h-9 w-64 rounded-xl bg-fondo-suave animate-pulse" />
          <div className="mt-5 h-16 rounded-3xl bg-white animate-pulse" />
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[28px] bg-white p-2 animate-pulse">
                <div className="aspect-[16/11] rounded-[22px] bg-fondo-suave" />
                <div className="p-3 space-y-3">
                  <div className="h-4 bg-fondo-suave rounded w-3/4" />
                  <div className="h-3 bg-fondo rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <EmpresasPageClient />
    </Suspense>
  );
}