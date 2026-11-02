import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LOGO_URL } from '@/lib/logo';

/** Marco de las pantallas de acceso (recuperar y restablecer la clave). */
export default function TarjetaCuenta({ titulo, subtitulo, children }: {
  titulo: string; subtitulo: string; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50">
      <div className="min-h-full flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
          </Link>
          <div className="space-y-2">
            <img src={LOGO_URL} alt="" className="h-10 w-10 object-contain" />
            <h1 className="text-2xl font-black text-gray-900">{titulo}</h1>
            <p className="text-sm text-gray-500">{subtitulo}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export const campo = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40';
export const boton = 'w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-2xl transition-colors';

/** Mensaje de error del backend (class-validator puede mandar una lista). */
export function mensajeDe(e: any, porDefecto: string) {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m[0] : m || porDefecto;
}
