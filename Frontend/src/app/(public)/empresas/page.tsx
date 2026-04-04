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
      <div className="min-h-screen bg-white">
        <div className="bg-gray-900 h-52 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-28 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
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