// src/app/not-found.tsx
import Link from 'next/link';
import { ChevronRight, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-lg">
        {/* Número 404 */}
        <div className="relative">
          <p className="text-[160px] font-black text-white/5 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-2 text-center">
              <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                <span>✦</span> Página no encontrada
              </p>
              <h1 className="text-4xl font-black text-white uppercase">
                Ups, se fue
                <span className="block text-lime-400">al vestuario</span>
              </h1>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-base">
          La página que buscas no existe o fue movida. Vuelve al inicio y encuentra tu cancha.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-6 py-3 rounded-full transition-colors">
            <Home className="h-4 w-4" /> Volver al inicio
          </Link>
          <Link href="/empresas"
            className="inline-flex items-center gap-2 border-2 border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-full transition-colors">
            <Search className="h-4 w-4" /> Buscar canchas
          </Link>
        </div>
      </div>
    </main>
  );
}