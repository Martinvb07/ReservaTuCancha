'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star, ChevronRight, CheckCircle, Calendar, CreditCard, Smile } from 'lucide-react';

const SPORTS = [
  { key: 'futbol',      label: 'Fútbol',      img: 'https://canchasintetica.com/wp-content/uploads/2023/01/cancha-sintetica-de-futbol-scaled.jpg', desc: 'La adrenalina y el trabajo en equipo se fusionan.' },
  { key: 'padel',       label: 'Pádel',       img: 'https://imagenes2.eltiempo.com/files/image_1200_675/uploads/2025/02/08/67a826ea4f6fb.jpeg', desc: 'Canchas diseñadas para jugadores que buscan emoción.' },
  { key: 'voley_playa', label: 'Voley Playa', img: 'https://lajauladelangel.com.co/vivaenvigado/wp-content/uploads/2025/01/IMG_0146-scaled.jpg', desc: 'Arena profesional para partidos épicos.' },
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

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative h-[500px] md:h-[620px] flex items-center justify-center overflow-hidden">
        <img
          src="https://www.unila.edu.mx/wp-content/uploads/2025/09/los-5-deportes-mas-populares-del-mundo.jpg"
          alt="cancha de fútbol"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center text-white space-y-4 md:space-y-6">
          <p className="text-lime-400 font-semibold tracking-wide text-xs md:text-sm uppercase">¿Partido hoy?</p>
          <h1 className="text-2xl md:text-4xl lg:text-6xl font-black uppercase leading-tight">
            Reserva canchas deportivas o{' '}
            <span className="text-lime-400">únete a emocionantes eventos</span>
          </h1>

          {/* Search box */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-1.5 mt-4 md:mt-6">
            <div className="flex items-center gap-2 px-4 py-2.5 text-white/70 text-xs md:text-sm">
              <Search className="h-4 w-4" />
              <span>Búsqueda de canchas</span>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <select
                  value={sport}
                  onChange={e => setSport(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs md:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400"
                >
                  <option value="">Elige deporte</option>
                  <option value="futbol">⚽ Fútbol</option>
                  <option value="padel">🎾 Pádel</option>
                  <option value="voley_playa">🏐 Voley Playa</option>
                </select>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs md:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400"
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
                className="w-full bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold py-2.5 md:py-3 rounded-xl transition-colors text-xs md:text-sm"
              >
                Ver canchas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-6 md:mb-8">
          <p className="text-lime-600 font-semibold text-xs md:text-sm flex items-center gap-1.5 mb-2">
            <span className="text-lime-500">✦</span> Servicios
          </p>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Encuentra tu lugar en la cancha</h2>
          <p className="text-gray-500 mt-2 text-sm md:text-base">Instalaciones de calidad, reservas en segundos y eventos que unen a la comunidad.</p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8 md:mb-10">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center gap-2">
              <div className="flex items-center gap-2 md:gap-3 border border-gray-200 rounded-xl px-2 md:px-4 py-2 md:py-3 flex-1 bg-white hover:border-lime-400 transition-colors">
                <step.icon className="h-4 w-4 md:h-5 md:w-5 text-gray-600 shrink-0" />
                <span className="text-xs md:text-sm font-medium text-gray-700">
                  <span className="font-bold">{step.n}.</span> <span className="hidden sm:inline">{step.label}</span>
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 hidden md:block" />
              )}
            </div>
          ))}
        </div>

        {/* Grid imágenes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="rounded-xl overflow-hidden h-[120px] md:h-[180px]">
            <img src="https://imagenes2.eltiempo.com/files/image_1200_675/uploads/2025/02/08/67a826ea4f6fb.jpeg" alt="pádel" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="rounded-xl overflow-hidden h-[120px] md:h-[180px]">
              <img src="https://lajauladelangel.com.co/vivaenvigado/wp-content/uploads/2025/01/IMG_0146-scaled.jpg" alt="voley" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-xl overflow-hidden h-[120px] md:h-[180px]">
              <img src="https://canchasintetica.com/wp-content/uploads/2023/01/cancha-sintetica-de-futbol-scaled.jpg" alt="fútbol" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
  
      </section>

      {/* ── EXPLORA NUESTRAS CANCHAS ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Explora nuestras canchas</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Juega en instalaciones con iluminación nocturna, césped de primera y más.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {SPORTS.map((s) => (
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

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {[
              { n: '+500', label: 'Canchas registradas' },
              { n: '+12K', label: 'Reservas realizadas' },
              { n: '+8',   label: 'Ciudades de Colombia' },
              { n: '4.8★', label: 'Calificación promedio' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-4xl font-black text-lime-400">{stat.n}</div>
                <div className="text-xs md:text-sm text-white/60 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CANCHAS DESTACADAS ────────────────────────────────────────── */}
      <section className="bg-gray-50 py-8 md:py-16">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Canchas Destacadas</h2>
            <Link href="/empresas" className="flex items-center gap-1 font-semibold text-gray-700 hover:text-lime-600 transition-colors text-sm md:text-base">
              Ver más <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {['futbol', 'padel', 'voley_playa'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-semibold border-2 transition-all whitespace-nowrap ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {FEATURED.filter(c =>
              activeTab === 'futbol' ? c.sport === 'Fútbol' :
              activeTab === 'padel'  ? c.sport === 'Pádel'  : c.sport === 'Voley Playa'
            ).concat(FEATURED).slice(0, 4).map((court, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group">
                <div className="relative h-32 md:h-44 overflow-hidden">
                  <img src={court.img} alt={court.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3 md:p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{court.rating}</span>
                    <span>· Sintético · Natural</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{court.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {court.city}
                  </div>
                  <Link
                    href={`/empresas?sport=${court.sport === 'Fútbol' ? 'futbol' : court.sport === 'Pádel' ? 'padel' : 'voley_playa'}`}
                    className="mt-2 flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold text-xs md:text-sm px-3 md:px-4 py-2 rounded-full transition-all w-fit"
                  >
                    Ver cancha <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA PROPIETARIOS ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <img
          src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1600&q=80"
          alt="cancha aérea"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-950/80" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-white space-y-3 md:space-y-5">
              <p className="text-lime-400 font-semibold text-xs md:text-sm flex items-center gap-1.5">
                <span>✦</span> Trabaja con nosotros
              </p>
              <h2 className="text-2xl md:text-4xl font-black uppercase leading-tight">
                Tu cancha puede ser el próximo punto de encuentro
              </h2>
              <p className="text-white/70 text-sm md:text-base">
                Gestiona reservas y pagos automáticos, atrae más clientes y controla todo desde tu móvil.
              </p>
              <Link
                href="/solicitar-acceso"
                className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-5 md:px-7 py-2 md:py-3 rounded-full transition-colors text-sm md:text-base"
              >
                Más Información <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
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
      <section className="max-w-4xl mx-auto px-4 py-8 md:py-16 space-y-6 md:space-y-8">
        <div>
          <p className="text-lime-600 font-semibold text-xs md:text-sm flex items-center gap-1.5 mb-2">
            <span>✦</span> FAQ
          </p>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Preguntas frecuentes de los jugadores</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {FAQ.map((item, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="text-left border border-gray-200 rounded-xl p-3 md:p-5 hover:border-lime-400 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-gray-800 text-xs md:text-sm">{item.q}</span>
                <ChevronRight className={`h-4 w-4 text-gray-400 shrink-0 mt-0.5 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
              </div>
              {openFaq === i && (
                <p className="text-xs md:text-sm text-gray-500 mt-3 leading-relaxed">{item.a}</p>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 pt-4">
          {['Sin registro requerido', 'Pago seguro', 'Cancelación gratis'].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-lime-500 shrink-0" /> {t}
            </span>
          ))}
        </div>
      </section>

    </main>
  );
}