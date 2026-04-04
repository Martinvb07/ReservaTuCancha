'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, ChevronRight, CheckCircle, Calendar, CreditCard, Smile, Quote, Users, TrendingUp, Shield } from 'lucide-react';

const SPORTS = [
  { key: 'futbol',      label: 'Futbol',      img: 'https://canchasintetica.com/wp-content/uploads/2023/01/cancha-sintetica-de-futbol-scaled.jpg', desc: 'La adrenalina y el trabajo en equipo se fusionan.' },
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

const TESTIMONIALS = [
  { name: 'Andres M.', role: 'Jugador frecuente', text: 'Reservo cancha todos los martes en 30 segundos. Antes teniamos que llamar y esperar. Ahora todo es inmediato.', city: 'Bogota', sport: 'Futbol' },
  { name: 'Laura G.', role: 'Propietaria de Club', text: 'Desde que usamos ReservaTuCancha mis canchas estan llenas. Las reservas online me ahorraron una secretaria.', city: 'Villavicencio', sport: 'Padel' },
  { name: 'Carlos R.', role: 'Capitan de equipo', text: 'Lo mejor es que no necesitas cuenta. Le paso el link a mis amigos y reservan en el momento. Super practico.', city: 'Acacias', sport: 'Futbol' },
];

const SPORT_LABELS: Record<string, string> = {
  futbol: 'Futbol', padel: 'Padel', voley_playa: 'Voley Playa',
};

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
  const router = useRouter();
  const [sport, setSport]     = useState('');
  const [city, setCity]       = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (city)  params.set('city', city);
    router.push(`/empresas?${params.toString()}`);
  };

  const featured = stats.featuredCourts.length > 0 ? stats.featuredCourts : [];

  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative h-[500px] md:h-[620px] flex items-center justify-center overflow-hidden">
        <img
          src="https://www.unila.edu.mx/wp-content/uploads/2025/09/los-5-deportes-mas-populares-del-mundo.jpg"
          alt="cancha de futbol"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center text-white space-y-4 md:space-y-6">
          <p className="text-lime-400 font-semibold tracking-wide text-xs md:text-sm uppercase">Partido hoy?</p>
          <h1 className="text-2xl md:text-4xl lg:text-6xl font-black uppercase leading-tight">
            Reserva canchas deportivas o{' '}
            <span className="text-lime-400">unete a emocionantes eventos</span>
          </h1>

          {/* Search box */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-1.5 mt-4 md:mt-6">
            <div className="flex items-center gap-2 px-4 py-2.5 text-white/70 text-xs md:text-sm">
              <Search className="h-4 w-4" />
              <span>Busqueda de canchas</span>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <select value={sport} onChange={e => setSport(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs md:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400">
                  <option value="">Elige deporte</option>
                  <option value="futbol">Futbol</option>
                  <option value="padel">Padel</option>
                  <option value="voley_playa">Voley Playa</option>
                </select>
                <select value={city} onChange={e => setCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs md:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-400">
                  <option value="">Elige ciudad</option>
                  <option value="bogota">Bogota</option>
                  <option value="villavicencio">Villavicencio</option>
                  <option value="acacias">Acacias</option>
                  <option value="restrepo">Restrepo</option>
                </select>
              </div>
              <button onClick={handleSearch}
                className="w-full bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold py-2.5 md:py-3 rounded-xl transition-colors text-xs md:text-sm">
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
              <img src="https://canchasintetica.com/wp-content/uploads/2023/01/cancha-sintetica-de-futbol-scaled.jpg" alt="futbol" className="w-full h-full object-cover" />
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

      {/* ── STATS REALES ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {[
              { n: `+${stats.totalCourts}`, label: 'Canchas registradas' },
              { n: `+${stats.totalBookings.toLocaleString('es-CO')}`, label: 'Reservas realizadas' },
              { n: `+${stats.totalCities}`,   label: 'Ciudades de Colombia' },
              { n: `${stats.avgRating}`, label: 'Calificacion promedio' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-4xl font-black text-lime-400">{stat.n}</div>
                <div className="text-xs md:text-sm text-white/60 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
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
              {featured.slice(0, 4).map((court: any) => (
                <Link key={court._id} href={`/canchas/${court._id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group block">
                  <div className="relative h-32 md:h-44 overflow-hidden bg-gray-200">
                    {court.photos?.[0] ? (
                      <img src={court.photos[0]} alt={court.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                        {court.sport === 'futbol' ? '.' : court.sport === 'padel' ? '.' : '.'}
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-lime-400 text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      {SPORT_LABELS[court.sport] || court.sport}
                    </span>
                  </div>
                  <div className="p-3 md:p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{court.averageRating?.toFixed(1) || '-'}</span>
                      <span>({court.totalReviews || 0} resenas)</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm truncate">{court.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {court.location?.city || '-'}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-green-700 font-black text-sm">${court.pricePerHour?.toLocaleString('es-CO')} COP</span>
                      <span className="text-lime-600 text-xs font-bold flex items-center gap-0.5">
                        Reservar <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIOS ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-6 md:mb-10 text-center">
          <p className="text-lime-600 font-semibold text-xs md:text-sm flex items-center justify-center gap-1.5 mb-2">
            <span className="text-lime-500">*</span> Testimonios
          </p>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase">Lo que dicen nuestros jugadores</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 space-y-4 hover:shadow-lg transition-shadow relative">
              <Quote className="h-8 w-8 text-lime-400/40 absolute top-4 right-4" />
              <p className="text-gray-600 text-sm leading-relaxed italic">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-lime-100 flex items-center justify-center">
                  <span className="text-lime-700 font-black text-sm">{t.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role} - {t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

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
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 text-center space-y-3 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-lime-100 rounded-2xl flex items-center justify-center mx-auto">
                  <item.icon className="h-7 w-7 text-lime-600" />
                </div>
                <h3 className="font-black text-gray-900 uppercase text-sm">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA PROPIETARIOS ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <img src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1600&q=80" alt="cancha aerea" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-blue-950/80" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-white space-y-3 md:space-y-5">
              <p className="text-lime-400 font-semibold text-xs md:text-sm flex items-center gap-1.5">
                <span>*</span> Trabaja con nosotros
              </p>
              <h2 className="text-2xl md:text-4xl font-black uppercase leading-tight">
                Tu cancha puede ser el proximo punto de encuentro
              </h2>
              <p className="text-white/70 text-sm md:text-base">
                Gestiona reservas y pagos automaticos, atrae mas clientes y controla todo desde tu movil.
              </p>
              <div className="flex flex-wrap gap-3 text-white/60 text-xs">
                {['Dashboard en tiempo real', 'Pagos automaticos', 'Notificaciones al instante', 'Analytics detallados'].map(f => (
                  <span key={f} className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                    <CheckCircle className="h-3 w-3 text-lime-400" /> {f}
                  </span>
                ))}
              </div>
              <Link href="/solicitar-acceso"
                className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-5 md:px-7 py-2 md:py-3 rounded-full transition-colors text-sm md:text-base">
                Solicitar acceso <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </div>
            <div className="hidden lg:block">
              <img src="https://images.unsplash.com/photo-1459865264687-595d652de67e?w=700&q=80" alt="cancha aerea" className="rounded-2xl shadow-2xl w-full max-w-md ml-auto" />
            </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {FAQ.map((item, i) => (
            <button key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="text-left border border-gray-200 rounded-xl p-3 md:p-5 hover:border-lime-400 transition-all">
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-gray-800 text-xs md:text-sm">{item.q}</span>
                <ChevronRight className={`h-4 w-4 text-gray-400 shrink-0 mt-0.5 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
              </div>
              {openFaq === i && <p className="text-xs md:text-sm text-gray-500 mt-3 leading-relaxed">{item.a}</p>}
            </button>
          ))}
        </div>

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
