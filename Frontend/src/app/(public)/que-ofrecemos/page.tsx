'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  CalendarDays, CreditCard, Bell, BarChart3, Shield, Smartphone,
  CheckCircle, ChevronRight, Star, Users, Building2, Clock,
} from 'lucide-react';

const PLANES = [
  {
    name: 'Básico',
    price: 'Gratis',
    period: 'para siempre',
    desc: 'Perfecto para empezar a recibir reservas.',
    color: 'border-gray-200',
    badge: '',
    features: [
      'Hasta 2 canchas activas',
      'Reservas ilimitadas',
      'Confirmaciones por email',
      'Panel de gestión básico',
      'Soporte por email',
    ],
    cta: 'Comenzar gratis',
    ctaHref: '/solicitar-acceso',
    ctaStyle: 'border-2 border-green-600 text-green-700 hover:bg-green-50',
  },
  {
    name: 'Pro',
    price: '$149.000',
    period: 'COP / mes',
    desc: 'Para propietarios que quieren crecer.',
    color: 'border-green-500',
    badge: 'Más popular',
    features: [
      'Canchas ilimitadas',
      'Dashboard analytics completo',
      'Notificaciones SMS + Email',
      'Reseñas verificadas',
      'Pagos en línea integrados',
      'Soporte prioritario 24/7',
      'Personalización de perfil',
    ],
    cta: 'Solicitar acceso Pro',
    ctaHref: '/solicitar-acceso',
    ctaStyle: 'bg-green-600 hover:bg-green-700 text-white',
  },
  {
    name: 'Empresarial',
    price: 'A medida',
    period: 'según volumen',
    desc: 'Para cadenas y complejos deportivos.',
    color: 'border-gray-200',
    badge: '',
    features: [
      'Todo lo de Pro',
      'Multi-sede centralizada',
      'API de integración',
      'Manager de cuenta dedicado',
      'SLA garantizado',
      'Facturación corporativa',
    ],
    cta: 'Hablar con ventas',
    ctaHref: '/soporte',
    ctaStyle: 'border-2 border-gray-800 text-gray-800 hover:bg-gray-50',
  },
];

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Gestión de reservas en tiempo real',
    desc: 'Visualiza, confirma y cancela reservas desde tu panel. Calendario intuitivo con disponibilidad actualizada al instante.',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: CreditCard,
    title: 'Pagos online integrados',
    desc: 'Cobra con tarjeta, PSE o Nequi a través de Stripe y Wompi. El dinero llega directo a tu cuenta sin intermediarios.',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    icon: Bell,
    title: 'Notificaciones automáticas',
    desc: 'Tus clientes reciben confirmaciones, recordatorios y links de cancelación por email y SMS. Tú te despreocupas.',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics e ingresos',
    desc: 'Reportes de ocupación, ingresos por mes, canchas más reservadas y comportamiento de tus clientes.',
    color: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    icon: Star,
    title: 'Reseñas verificadas',
    desc: 'Solo pueden opinar quienes reservaron. Construye tu reputación con reseñas reales que generan confianza.',
    color: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
  },
  {
    icon: Smartphone,
    title: 'Gestión desde el móvil',
    desc: 'Panel 100% responsivo. Administra tus canchas, ve tus reservas y cobra desde tu teléfono en cualquier lugar.',
    color: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
];

const STATS = [
  { n: '+500',  label: 'Canchas registradas', icon: Building2 },
  { n: '+12K',  label: 'Reservas realizadas', icon: CalendarDays },
  { n: '+8',    label: 'Ciudades de Colombia', icon: Users },
  { n: '4.8★',  label: 'Calificación promedio', icon: Star },
];

const FAQ_QO = [
  { q: '¿Cuánto tiempo tarda el proceso de aprobación?', a: 'Una vez enviada tu solicitud, nuestro equipo la revisa en máximo 48 horas hábiles. Recibirás un email con tus credenciales de acceso.' },
  { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Puedes subir o bajar de plan cuando quieras desde tu panel. Los cambios aplican en el siguiente ciclo de facturación.' },
  { q: '¿Cobran comisión por reserva?', a: 'No cobramos comisión por reserva. Solo pagas el plan mensual. Los pagos de tus clientes van directo a tu cuenta.' },
  { q: '¿Necesito conocimientos técnicos?', a: 'Para nada. El panel es 100% intuitivo. Te guiamos paso a paso desde la configuración de tu primera cancha hasta recibir tu primer pago.' },
];

export default function QueOfrecemosPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-green-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-lime-400 rounded-full -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center text-white space-y-6">
          <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <span>✦</span> Lo que ofrecemos
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-tight">
            Todo lo que necesitas para
            <span className="block text-lime-400">gestionar tu cancha</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Desde reservas hasta pagos, analytics y reseñas. Una plataforma completa para propietarios de canchas deportivas en Colombia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/solicitar-acceso"
              className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-8 py-3.5 rounded-full transition-colors text-base"
            >
              Solicitar acceso gratis <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              href="/soporte"
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-full transition-colors text-base"
            >
              Hablar con el equipo
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-black text-lime-400">{s.n}</div>
                <div className="text-sm text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-3">
            <span>✦</span> Funcionalidades
          </p>
          <h2 className="text-4xl font-black text-gray-900 uppercase">Una herramienta, todo el control</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Diseñada específicamente para el mercado colombiano de canchas deportivas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all group">
              <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`h-6 w-6 ${f.iconColor}`} />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA PARA PROPIETARIOS ───────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-3">
              <span>✦</span> Proceso
            </p>
            <h2 className="text-4xl font-black text-gray-900 uppercase">Empieza en 4 pasos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { n: '01', title: 'Solicita acceso', desc: 'Llena el formulario con los datos de tu cancha. Lo revisamos en 48h.' },
              { n: '02', title: 'Configura tu perfil', desc: 'Agrega fotos, horarios, precios y descripción de tus canchas.' },
              { n: '03', title: 'Recibe reservas', desc: 'Tus clientes reservan y pagan online. Tú ves todo en tiempo real.' },
              { n: '04', title: 'Cobra y crece', desc: 'Los pagos llegan a tu cuenta. Usa el analytics para optimizar.' },
            ].map((step, i) => (
              <div key={step.n} className="relative flex flex-col items-center text-center">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[65%] w-[70%] h-0.5 bg-green-200" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-green-600 text-white flex items-center justify-center font-black text-xl mb-4 shadow-lg relative z-10">
                  {step.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANES ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-3">
            <span>✦</span> Precios
          </p>
          <h2 className="text-4xl font-black text-gray-900 uppercase">Planes para cada necesidad</h2>
          <p className="text-gray-500 mt-3">Sin comisiones por reserva. Sin sorpresas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANES.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 ${plan.color} p-8 ${plan.badge ? 'shadow-2xl scale-105' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-black text-gray-900 text-lg">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-400 ml-2">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2 mb-3">
              <span>✦</span> FAQ
            </p>
            <h2 className="text-4xl font-black text-gray-900 uppercase">Preguntas frecuentes</h2>
          </div>

          <div className="space-y-3">
            {FAQ_QO.map((item, i) => (
              <button
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left border border-gray-200 bg-white rounded-2xl p-5 hover:border-green-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-gray-800">{item.q}</span>
                  <ChevronRight className={`h-5 w-5 text-gray-400 shrink-0 mt-0.5 transition-transform duration-200 ${openFaq === i ? 'rotate-90 text-green-500' : ''}`} />
                </div>
                {openFaq === i && (
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">{item.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-green-700 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center text-white space-y-6">
          <h2 className="text-4xl font-black uppercase">¿Listo para llenar tu cancha?</h2>
          <p className="text-green-100 text-lg max-w-xl mx-auto">
            Únete a los propietarios que ya digitalizaron su negocio con ReservaTuCancha.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/solicitar-acceso"
              className="inline-flex items-center gap-2 bg-white text-green-800 hover:bg-green-50 font-bold px-8 py-3.5 rounded-full transition-colors"
            >
              Solicitar acceso gratis <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              href="/soporte"
              className="inline-flex items-center gap-2 border-2 border-white/40 text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-full transition-colors"
            >
              Tengo preguntas
            </Link>
          </div>
          <div className="flex justify-center gap-8 pt-2">
            {['Sin contrato', 'Gratis para empezar', 'Sin comisiones'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-green-200">
                <CheckCircle className="h-4 w-4 text-lime-300" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}