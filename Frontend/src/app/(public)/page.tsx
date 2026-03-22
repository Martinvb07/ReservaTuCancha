'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star, ChevronRight, CheckCircle, Calendar, CreditCard, Smile } from 'lucide-react';

const SPORTS = [
  { key: 'futbol',      label: 'Fútbol',      img: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80', desc: 'La adrenalina y el trabajo en equipo se fusionan.' },
  { key: 'padel',       label: 'Pádel',       img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80', desc: 'Canchas diseñadas para jugadores que buscan emoción.' },
  { key: 'voley_playa', label: 'Voley Playa', img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80', desc: 'Arena profesional para partidos épicos.' },
];

const STEPS = [
  { n: 1, icon: Search,   label: 'Busca experiencias' },
  { n: 2, icon: Calendar, label: 'Elige Fecha'        },
  { n: 3, icon: CreditCard, label: 'Paga Online'       },
  { n: 4, icon: Smile,    label: 'Diviértete'         },
];

const FEATURED = [
  { name: 'Cancha El Estadio',   sport: 'Fútbol',      rating: 4.5, city: 'Bogotá, Chapinero',       img: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&q=80' },
  { name: 'Pádel Center Norte',  sport: 'Pádel',       rating: 4.2, city: 'Medellín, El Poblado',    img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80' },
  { name: 'Arena Playa Club',    sport: 'Voley Playa', rating: 4.8, city: 'Cali, Granada',           img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&q=80' },
  { name: 'Futbol 5 La 80',      sport: 'Fútbol',      rating: 4.1, city: 'Bogotá, Suba',            img: 'https://images.unsplash.com/photo-1487466365202-1afdb86c764e?w=600&q=80' },
];

const FAQ = [
  { q: '¿Necesito crear una cuenta para reservar?', a: 'No. Solo ingresas tu nombre, email y teléfono al momento de reservar. Sin contraseñas, sin registro.' },
  { q: '¿Cómo cancelo mi reserva?',                 a: 'Recibes un link de cancelación en tu email. Puedes cancelar gratis hasta 2 horas antes de tu turno.' },
  { q: '¿Cuáles son los métodos de pago?',          a: 'Aceptamos tarjetas de crédito/débito y PSE a través de Stripe, la plataforma de pagos más segura del mundo.' },
  { q: '¿Cómo recibo la confirmación?',             a: 'Al instante por email. Incluye los datos de la cancha, horario y el link para cancelar si lo necesitas.' },
];

export default function HomePage() {
  const router = useRouter();
  const [sport, setSport]   = useState('');
  const [city, setCity]     = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('futbol');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (city)  params.set('city', city);
    router.push(`/empresas?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO con foto de fondo ─────────────────────────────────────── */}
      <section className="relative h-[620px] flex items-center justify-center overflow-hidden">
        {/* Foto de fondo */}
        <img
          src="https://images.unsplash.com/photo-1551958219-acbc595b8cc8?w=1600&q=80"
          alt="cancha de fútbol"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Contenido */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center text-white space-y-6">
          <p className="text-lime-400 font-semibold tracking-wide text-sm uppercase">¿Partido hoy?</p>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-tight">
            Reserva canchas deportivas o{' '}
            <span className="text-lime-400">únete a emocionantes eventos</span>
          </h1>

          {/* Search box */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-1.5 mt-6">
            <div className="flex items-center gap-2 px-4 py-2.5 text-white/70 text-sm">
              <Search className="h-4 w-4" />
              <span>Búsqueda de canchas</span>
            </div>
            <div className="bg-white rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={sport}
                  onChange={e => setSport(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400"
                >
                  <option value="">Elige deporte</option>
                  <option value="futbol">⚽ Fútbol</option>
                  <option value="padel">🎾 Pádel</option>
                  <option value="voley_playa">🏐 Voley Playa</option>
                </select>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400"
                >
                  <option value="">Elige ciudad</option>
                  <option value="bogota">Bogotá</option>
                  <option value="medellin">Medellín</option>
                  <option value="cali">Cali</option>
                  <option value="barranquilla">Barranquilla</option>
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="w-full bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Ver canchas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS / CÓMO FUNCIONA ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-8">
          <p className="text-lime-600 font-semibold text-sm flex items-center gap-1.5 mb-2">
            <span className="text-lime-500">✦</span> Servicios
          </p>
          <h2 className="text-4xl font-black text-gray-900 uppercase">Encuentra tu lugar en la cancha</h2>
          <p className="text-gray-500 mt-2">Instalaciones de calidad, reservas en segundos y eventos que unen a la comunidad.</p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center gap-2">
              <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 flex-1 bg-white hover:border-lime-400 transition-colors">
                <step.icon className="h-5 w-5 text-gray-600 shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  <span className="font-bold">{step.n}.</span> {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 hidden md:block" />
              )}
            </div>
          ))}
        </div>

        {/* Grid imágenes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: '380px' }}>
          <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <img src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80" alt="pádel" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '380px' }}>
            <div style={{ borderRadius: '16px', overflow: 'hidden', flex: 1 }}>
              <img src="https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&q=80" alt="voley" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ borderRadius: '16px', overflow: 'hidden', flex: 1 }}>
              <img src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80" alt="fútbol" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPLORA NUESTRAS CANCHAS ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-gray-900 uppercase">Explora nuestras canchas</h2>
          <p className="text-gray-500 mt-1">Juega en instalaciones con iluminación nocturna, césped de primera y más.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {SPORTS.map((s) => (
            <Link key={s.key} href={`/empresas?sport=${s.key}`} style={{ display: 'block', height: '260px', borderRadius: '16px', overflow: 'hidden', position: 'relative', textDecoration: 'none' }}>
              <img src={s.img} alt={s.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                <div style={{ color: 'white', fontSize: '22px', fontWeight: 900 }}>{s.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '4px' }}>{s.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', textAlign: 'center' }}>
            {[
              { n: '+500', label: 'Canchas registradas' },
              { n: '+12K', label: 'Reservas realizadas' },
              { n: '+8',   label: 'Ciudades de Colombia' },
              { n: '4.8★', label: 'Calificación promedio' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ color: '#a3e635', fontSize: '40px', fontWeight: 900, lineHeight: 1 }}>{stat.n}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '8px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CANCHAS DESTACADAS ────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black text-gray-900 uppercase">Canchas Destacadas</h2>
            <Link href="/empresas" className="flex items-center gap-1 font-semibold text-gray-700 hover:text-lime-600 transition-colors">
              Ver más <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {['futbol', 'padel', 'voley_playa'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                  activeTab === t
                    ? 'border-gray-800 text-gray-800 bg-white'
                    : 'border-gray-200 text-gray-400 bg-white hover:border-gray-400'
                }`}
              >
                {t === 'futbol' ? 'Fútbol' : t === 'padel' ? 'Pádel' : 'Voley Playa'}
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURED.filter(c =>
              activeTab === 'futbol' ? c.sport === 'Fútbol' :
              activeTab === 'padel'  ? c.sport === 'Pádel'  : c.sport === 'Voley Playa'
            ).concat(FEATURED).slice(0, 4).map((court, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group">
                <div className="relative h-44 overflow-hidden">
                  <img src={court.img} alt={court.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{court.rating}</span>
                    <span>· Sintético · Natural</span>
                  </div>
                  <h3 className="font-bold text-gray-900">{court.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {court.city}
                  </div>
                  <Link
                    href={`/empresas?sport=${court.sport === 'Fútbol' ? 'futbol' : court.sport === 'Pádel' ? 'padel' : 'voley_playa'}`}
                    className="mt-2 flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold text-sm px-4 py-2 rounded-full transition-all w-fit"
                  >
                    Ver cancha <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA PROPIETARIOS (fondo oscuro azul) ──────────────────────── */}
      <section className="relative overflow-hidden py-20">
        <img
          src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1600&q=80"
          alt="cancha aérea"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-950/80" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-5">
              <p className="text-lime-400 font-semibold text-sm flex items-center gap-1.5">
                <span>✦</span> Trabaja con nosotros
              </p>
              <h2 className="text-4xl font-black uppercase leading-tight">
                Tu cancha puede ser el próximo punto de encuentro
              </h2>
              <p className="text-white/70 text-base">
                Gestiona reservas y pagos automáticos, atrae más clientes y controla todo desde tu móvil.
              </p>
              <Link
                href="/solicitar-acceso"
                className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-7 py-3 rounded-full transition-colors"
              >
                Más Información <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1459865264687-595d652de67e?w=700&q=80"
                  alt="cancha aérea"
                  className="rounded-2xl shadow-2xl w-full max-w-md ml-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-16 space-y-8">
        <div>
          <p className="text-lime-600 font-semibold text-sm flex items-center gap-1.5 mb-2">
            <span>✦</span> FAQ
          </p>
          <h2 className="text-4xl font-black text-gray-900 uppercase">Preguntas frecuentes de los jugadores</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQ.map((item, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="text-left border border-gray-200 rounded-xl p-5 hover:border-lime-400 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-gray-800 text-sm">{item.q}</span>
                <ChevronRight className={`h-4 w-4 text-gray-400 shrink-0 mt-0.5 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
              </div>
              {openFaq === i && (
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">{item.a}</p>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-8 pt-4">
          {['Sin registro requerido', 'Pago seguro', 'Cancelación gratis'].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-lime-500" /> {t}
            </span>
          ))}
        </div>
      </section>

    </main>
  );
}