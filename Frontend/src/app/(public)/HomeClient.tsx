'use client';

import Link from 'next/link';
import { Search, ChevronRight, CheckCircle, Calendar, CreditCard, Smile, Users, TrendingUp, Shield } from 'lucide-react';
import CourtCard from '@/components/courts/CourtCard';
import FadeIn from '@/components/ui/FadeIn';
import FaqAccordion from '@/components/ui/FaqAccordion';
import HeroSearch from '@/components/home/HeroSearch';
import MobileSearchTrigger from '@/components/home/MobileSearchTrigger';
import type { Court } from '@/types';

const SPORT_GALLERY = [
  { key: 'futbol',      label: 'Futbol',      img: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&q=80', desc: 'La adrenalina y el trabajo en equipo se fusionan.' },
  { key: 'padel',       label: 'Padel',       img: 'https://imagenes2.eltiempo.com/files/image_1200_675/uploads/2025/02/08/67a826ea4f6fb.jpeg', desc: 'Canchas diseñadas para jugadores que buscan emocion.' },
  { key: 'voley_playa', label: 'Voley Playa', img: 'https://lajauladelangel.com.co/vivaenvigado/wp-content/uploads/2025/01/IMG_0146-scaled.jpg', desc: 'Arena profesional para partidos epicos.' },
];

const STEPS = [
  { n: 1, icon: Search,     label: 'Busca experiencias' },
  { n: 2, icon: Calendar,   label: 'Elige Fecha' },
  { n: 3, icon: CreditCard, label: 'Paga Online' },
  { n: 4, icon: Smile,      label: 'Diviertete' },
];

const FAQ = [
  { q: 'Necesito crear una cuenta para reservar?', a: 'No. Solo ingresas tu nombre, email y telefono al momento de reservar. Sin contrasenas, sin registro.' },
  { q: 'Como cancelo mi reserva?',                 a: 'Recibes un link de cancelacion en tu email. Puedes cancelar gratis hasta 2 horas antes de tu turno.' },
  { q: 'Cuales son los metodos de pago?',          a: 'Aceptamos tarjetas de credito/debito, Nequi, Daviplata y PSE a traves de Wompi, la plataforma de pagos mas segura de Colombia.' },
  { q: 'Como recibo la confirmacion?',             a: 'Al instante por email. Incluye los datos de la cancha, horario y el link para cancelar si lo necesitas.' },
];

interface PublicStats {
  totalCourts: number;
  totalBookings: number;
  totalCities: number;
  avgRating: number;
  featuredCourts: any[];
}

interface Props {
  stats: PublicStats;
}

export default function HomeClient({ stats }: Props) {
  const featured = stats.featuredCourts.length > 0 ? stats.featuredCourts : [];

  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative h-[500px] md:h-[620px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://www.unila.edu.mx/wp-content/uploads/2025/09/los-5-deportes-mas-populares-del-mundo.jpg"
            alt="cancha de futbol"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 text-center text-white space-y-4 md:space-y-6">
          <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
            <p className="text-lime-400 font-semibold tracking-wide text-xs md:text-sm uppercase">Partido hoy?</p>
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-black uppercase leading-tight">
              Reserva canchas deportivas o{' '}
              <span className="text-lime-400">unete a emocionantes eventos</span>
            </h1>
          </div>

          {/* Buscador propio (deporte / ciudad / fecha / hora).
              En móvil se reemplaza por la píldora que abre el sheet. */}
          <div className="mt-4 md:mt-6 hidden md:block">
            <HeroSearch />
          </div>
          <div className="mt-4">
            <MobileSearchTrigger />
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-6 md:mb-8">
          <p className="text-lime-600 font-semibold text-xs md:text-sm flex items-center gap-1.5 mb-2">
            <span className="text-lime-500">*</span> Servicios
          </p>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Encuentra tu lugar en la cancha</h2>
          <p className="text-gray-500 mt-2 text-sm md:text-base">Instalaciones de calidad, reservas en segundos y eventos que unen a la comunidad.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8 md:mb-10">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center gap-2">
              <div className="flex items-center gap-2 md:gap-3 border border-gray-200 rounded-xl px-2 md:px-4 py-2 md:py-3 flex-1 bg-white hover:border-lime-400 transition-colors">
                <step.icon className="h-4 w-4 md:h-5 md:w-5 text-gray-600 shrink-0" />
                <span className="text-xs md:text-sm font-medium text-gray-700">
                  <span className="font-bold">{step.n}.</span> {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 hidden md:block" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="rounded-xl overflow-hidden h-[120px] md:h-[380px]">
            <img src="https://imagenes2.eltiempo.com/files/image_1200_675/uploads/2025/02/08/67a826ea4f6fb.jpeg" alt="padel" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="rounded-xl overflow-hidden h-[120px] md:h-[180px]">
              <img src="https://lajauladelangel.com.co/vivaenvigado/wp-content/uploads/2025/01/IMG_0146-scaled.jpg" alt="voley" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-xl overflow-hidden h-[120px] md:h-[180px]">
              <img src="https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80" alt="futbol" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPLORA NUESTRAS CANCHAS ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Explora nuestras canchas</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Juega en instalaciones con iluminacion nocturna, cesped de primera y mas.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {SPORT_GALLERY.map((s) => (
            <Link key={s.key} href={`/empresas?sport=${s.key}`} className="block h-[200px] md:h-[260px] rounded-2xl overflow-hidden relative">
              <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 text-white">
                <div className="text-lg md:text-2xl font-black">{s.label}</div>
                <div className="text-xs md:text-sm text-white/80 mt-1">{s.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CANCHAS DESTACADAS (DATOS REALES) ─────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-gray-50 py-8 md:py-16">
          <div className="max-w-6xl mx-auto px-4 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Canchas Destacadas</h2>
              <Link href="/empresas" className="flex items-center gap-1 font-semibold text-gray-700 hover:text-lime-600 transition-colors text-sm md:text-base">
                Ver todas <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
              {featured.slice(0, 4).map((court: any, i: number) => (
                <FadeIn key={court._id} delay={i * 80}>
                  <CourtCard court={court as Court} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── POR QUE ELEGIRNOS ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-8 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase text-center mb-8 md:mb-12">Por que elegirnos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield,      title: 'Pago 100% seguro',       desc: 'Procesamos pagos con Wompi, la plataforma mas segura de Colombia. Nequi, Daviplata y tarjetas.' },
              { icon: Users,       title: 'Sin registro',           desc: 'Reserva en segundos sin crear cuenta. Solo nombre, email y telefono. Asi de facil.' },
              { icon: TrendingUp,  title: 'Para propietarios',      desc: 'Dashboard completo con analytics, pagos automaticos y gestion de reservas en tiempo real.' },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 90} className="bg-white rounded-2xl p-6 border border-gray-100 text-center space-y-3 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-lime-100 rounded-2xl flex items-center justify-center mx-auto">
                  <item.icon className="h-7 w-7 text-lime-600" />
                </div>
                <h3 className="font-black text-gray-900 uppercase text-sm">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-8 md:py-16 space-y-6 md:space-y-8">
        <div>
          <p className="text-lime-600 font-semibold text-xs md:text-sm flex items-center gap-1.5 mb-2">
            <span>*</span> FAQ
          </p>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Preguntas frecuentes</h2>
        </div>

        <FaqAccordion
          items={FAQ}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-start"
          itemClassName="w-full text-left bg-white border border-gray-200 rounded-xl p-3 md:p-5 hover:border-lime-400"
          openItemClassName="border-lime-400 shadow-[0_14px_40px_-20px_rgba(132,204,22,0.7)]"
          questionClassName="font-semibold text-gray-800 text-xs md:text-sm"
          answerClassName="text-xs md:text-sm text-gray-500 leading-relaxed"
          iconClassName="h-4 w-4"
        />

        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 pt-4">
          {['Sin registro requerido', 'Pago seguro', 'Cancelacion gratis'].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-lime-500 shrink-0" /> {t}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
