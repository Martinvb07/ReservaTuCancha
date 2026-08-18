import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Store, ChevronRight, LayoutDashboard, CreditCard, Bell, TrendingUp,
  CalendarCheck, Lock, FileText, Building2, CheckCircle, Quote,
} from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';

export const metadata: Metadata = {
  title: 'Publica tu cancha — Para clubes y empresas',
  description:
    'Recibe reservas y pagos online 24/7, sin dobles reservas. Gestiona tus canchas, horarios y pagos desde un panel. Solicita acceso a ReservaTuCancha.',
  openGraph: {
    title: 'Publica tu cancha con ReservaTuCancha',
    description: 'Llena tu cancha: reservas y pagos automáticos, panel en tiempo real y cero dobles reservas.',
    type: 'website',
    locale: 'es_CO',
  },
};

const BENEFITS = [
  { icon: LayoutDashboard, title: 'Panel en tiempo real', desc: 'Ve tus reservas, ingresos y ocupación al instante desde cualquier dispositivo.' },
  { icon: CreditCard, title: 'Pagos automáticos', desc: 'Tus clientes pagan online con Nequi, Daviplata, PSE o tarjeta. Te transferimos lo recaudado cada lunes.' },
  { icon: CalendarCheck, title: 'Cero dobles reservas', desc: 'El sistema bloquea el horario apenas alguien reserva. Se acabaron los cruces.' },
  { icon: Bell, title: 'Notificaciones al instante', desc: 'Te avisamos cada nueva reserva y pago en el momento en que ocurre.' },
  { icon: TrendingUp, title: 'Analytics de tu negocio', desc: 'Conoce tus horas pico, canchas más rentables y tendencias para decidir mejor.' },
  { icon: Lock, title: 'Control de horarios', desc: 'Bloquea horarios por mantenimiento o eventos privados con un clic.' },
];

const STEPS = [
  { icon: FileText, n: '1', title: 'Solicita acceso', desc: 'Cuéntanos de tu club. Validamos tus datos y activamos tu cuenta.' },
  { icon: Building2, n: '2', title: 'Carga tus canchas', desc: 'Sube fotos, precios, amenidades y tus horarios de atención.' },
  { icon: CreditCard, n: '3', title: 'Recibe reservas y pagos', desc: 'Tus clientes reservan y pagan online, sin llamadas ni WhatsApp.' },
  { icon: LayoutDashboard, n: '4', title: 'Gestiona todo', desc: 'Controla reservas, pagos y estadísticas desde tu panel.' },
];

const FAQ = [
  { q: '¿Cuánto cuesta?', a: 'No hay mensualidad ni contrato. Cobramos una comisión del 6% sobre cada reserva pagada por la plataforma: si nadie reserva, no pagas nada.' },
  { q: '¿Cómo recibo los pagos?', a: 'Tus clientes pagan a ReservaTuCancha con Nequi, Daviplata, PSE o tarjeta. Cada lunes te transferimos lo recaudado de la semana anterior, ya con la comisión del 6% descontada.' },
  { q: '¿Puedo bloquear horarios?', a: 'Sí. Bloqueas horarios por mantenimiento, torneos o eventos privados cuando quieras, desde el panel.' },
  { q: '¿Mis clientes necesitan registrarse?', a: 'No. Reservan con su nombre, email y teléfono. Menos fricción, más reservas para ti.' },
];

async function getPublicStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/public`, {
      next: { revalidate: 300 }, // Cache 5 minutos
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  } catch {
    return { totalCourts: 0, totalBookings: 0, totalCities: 0, avgRating: 4.8, featuredCourts: [] };
  }
}

export default async function ParaClubesPage() {
  const stats = await getPublicStats();
  return (
    <main className="min-h-screen bg-white">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1600&q=80"
          alt="cancha"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center text-white">
          <span className="inline-flex items-center gap-1.5 bg-lime-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full mb-5">
            <Store className="h-3.5 w-3.5" /> Para clubes y empresas
          </span>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Llena tu cancha. <span className="text-lime-400">Nosotros nos encargamos del resto.</span>
          </h1>
          <p className="text-gray-300 mt-5 text-base md:text-lg max-w-2xl mx-auto">
            Recibe reservas y pagos online 24/7, sin secretarias ni dobles reservas.
            Gestiona tus canchas, horarios y pagos desde un solo panel.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/solicitar-acceso"
              className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-7 py-3 rounded-full transition-colors"
            >
              Solicitar acceso <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-7 py-3 rounded-full transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ───────────────────────────────────────── */}
      <section id="beneficios" className="scroll-mt-20 max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-lime-600 font-semibold text-sm">Beneficios</p>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mt-1">Todo para gestionar tu negocio</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {BENEFITS.map((b, i) => (
            <FadeIn key={b.title} delay={i * 70} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 grid place-items-center mb-4">
                <b.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900">{b.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mt-1.5">{b.desc}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {[
              { n: `+${stats.totalCourts}`, label: 'Canchas registradas' },
              { n: `+${stats.totalBookings.toLocaleString('es-CO')}`, label: 'Reservas realizadas' },
              { n: `+${stats.totalCities}`, label: 'Ciudades de Colombia' },
              { n: `${stats.avgRating}`, label: 'Calificación promedio' },
            ].map((stat: { n: string; label: string }) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-4xl font-black text-lime-400">{stat.n}</div>
                <div className="text-xs md:text-sm text-white/60 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────── */}
      <section id="como-funciona" className="scroll-mt-20 bg-gray-50 py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-lime-600 font-semibold text-sm">Cómo funciona</p>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mt-1">Empieza en 4 pasos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 70} className="relative bg-white border border-gray-100 rounded-2xl p-6">
                <span className="absolute top-5 right-5 text-4xl font-black text-gray-100">{s.n}</span>
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 grid place-items-center mb-4">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mt-1.5">{s.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIO ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-14 md:py-20">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-10 relative shadow-sm">
          <Quote className="h-10 w-10 text-lime-400/40 absolute top-6 right-8" />
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed italic">
            “Desde que usamos ReservaTuCancha mis canchas están llenas. Las reservas online me ahorraron una secretaria
            y dejé de perder clientes por no contestar el teléfono.”
          </p>
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
            <div className="w-11 h-11 rounded-full bg-lime-100 flex items-center justify-center">
              <span className="text-lime-700 font-bold">L</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">Laura G.</p>
              <p className="text-sm text-gray-500">Propietaria de club — Villavicencio</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 bg-gray-50 py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-lime-600 font-semibold text-sm">Preguntas frecuentes</p>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mt-1">Lo que los clubes preguntan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="font-semibold text-gray-900 flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /> {item.q}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed mt-2 pl-7">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL (banner separado del footer) ───────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-6 py-9 md:px-12 md:py-11">
          <img src="https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80" alt="cancha aérea" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/85 to-gray-900/40" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="text-white max-w-xl">
              <p className="text-lime-400 font-semibold text-xs md:text-sm">Para clubes y empresas</p>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight mt-1">¿Tienes una cancha? Publícala con nosotros.</h2>
              <p className="text-gray-300 text-sm md:text-base mt-2">
                Recibe reservas y pagos online, sin dobles reservas. Gestiona todo desde un panel.
              </p>
            </div>
            <Link href="/solicitar-acceso"
              className="inline-flex items-center justify-center gap-2 shrink-0 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-6 py-3 rounded-full transition-colors">
              Publica tu cancha <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
