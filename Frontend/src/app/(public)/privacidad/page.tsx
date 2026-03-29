// src/app/(public)/privacidad/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Política de privacidad | ReservaTuCancha',
  description: 'Política de privacidad y tratamiento de datos de ReservaTuCancha.',
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-3xl mx-auto px-4 py-16 space-y-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest mb-2">✦ ReservaTuCancha</p>
          <h1 className="text-4xl font-black text-gray-900 uppercase">Política de privacidad</h1>
          <p className="text-gray-400 text-sm mt-2">Última actualización: Marzo 2026</p>
        </div>
        <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
          <p>En ReservaTuCancha nos comprometemos a proteger tu información personal. Esta política describe cómo recopilamos, usamos y protegemos tus datos.</p>
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 uppercase">1. Datos que recopilamos</h2>
            <p>Recopilamos nombre completo, dirección de email y número de teléfono al momento de realizar una reserva. No requerimos registro de cuenta para usar el servicio.</p>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 uppercase">2. Uso de los datos</h2>
            <p>Usamos tus datos exclusivamente para gestionar tu reserva, enviarte confirmaciones y permitirte cancelar si lo necesitas. No compartimos ni vendemos tu información a terceros.</p>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 uppercase">3. Seguridad</h2>
            <p>Los pagos se procesan mediante Stripe, cumpliendo con los estándares PCI-DSS. No almacenamos datos de tarjetas de crédito en nuestros servidores.</p>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 uppercase">4. Tus derechos</h2>
            <p>Puedes solicitar la eliminación, corrección o acceso a tus datos escribiéndonos a <a href="mailto:soporte@reservatucancha.pro" className="text-green-600 hover:underline">soporte@reservatucancha.pro</a>. Respondemos en máximo 5 días hábiles.</p>
          </div>
        </div>
      </section>
    </main>
  );
}