// src/app/(public)/terminos/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Términos de uso | ReservaTuCancha',
  description: 'Términos y condiciones de uso de la plataforma ReservaTuCancha.',
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-3xl mx-auto px-4 py-16 space-y-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest mb-2">✦ ReservaTuCancha</p>
          <h1 className="text-4xl font-black text-gray-900 uppercase">Términos de uso</h1>
          <p className="text-gray-400 text-sm mt-2">Última actualización: Marzo 2026</p>
        </div>
        <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
          <p>Al usar ReservaTuCancha, aceptas los presentes términos. Si no estás de acuerdo, por favor no uses el servicio.</p>
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 uppercase">1. Uso del servicio</h2>
            <p>ReservaTuCancha es una plataforma que conecta usuarios con propietarios de canchas deportivas en Colombia. Actuamos como intermediarios y no somos responsables por las instalaciones físicas de terceros.</p>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 uppercase">2. Reservas y pagos</h2>
            <p>Las reservas son vinculantes una vez confirmadas. Los pagos se procesan de forma segura a través de Stripe. Las cancelaciones gratuitas aplican hasta 2 horas antes del turno reservado. Pasado ese tiempo, el propietario puede no efectuar el reembolso.</p>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 uppercase">3. Responsabilidades</h2>
            <p>ReservaTuCancha no se hace responsable por lesiones, daños o pérdidas ocurridas durante el uso de las instalaciones. Cada propietario es responsable de sus canchas y equipos.</p>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 uppercase">4. Contacto</h2>
            <p>Para consultas sobre estos términos: <a href="mailto:soporte@reservatucancha.pro" className="text-green-600 hover:underline">soporte@reservatucancha.pro</a></p>
          </div>
        </div>
      </section>
    </main>
  );
}