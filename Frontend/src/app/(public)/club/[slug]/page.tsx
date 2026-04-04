import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Phone, Mail, Star, Users, Trophy } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:4000';

async function getClub(slug: string) {
  try {
    const res = await fetch(`${API}/api/clubs/slug/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const club = await getClub(params.slug);
  if (!club) return { title: 'Club no encontrado' };
  return {
    title: `${club.name} — ReservaTuCancha`,
    description: club.description || `Reserva canchas en ${club.name}, ${club.city}. ${club.totalCourts} cancha${club.totalCourts !== 1 ? 's' : ''} disponible${club.totalCourts !== 1 ? 's' : ''}.`,
    openGraph: {
      title: club.name,
      description: club.description || `Reserva en ${club.name}`,
      images: club.courts?.[0]?.photos?.[0] ? [{ url: club.courts[0].photos[0] }] : [],
    },
  };
}

function SportBadge({ sport }: { sport: string }) {
  const map: Record<string, { label: string; icon: string; color: string }> = {
    futbol:     { label: 'Fútbol',      icon: '⚽', color: 'bg-green-100 text-green-800' },
    padel:      { label: 'Pádel',       icon: '🎾', color: 'bg-blue-100 text-blue-800'  },
    voley_playa:{ label: 'Vóley Playa', icon: '🏐', color: 'bg-yellow-100 text-yellow-800' },
  };
  const s = map[sport] ?? { label: sport, icon: '🏟️', color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export default async function ClubPublicPage({ params }: { params: { slug: string } }) {
  const club = await getClub(params.slug);
  if (!club) notFound();

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 flex flex-col md:flex-row items-center gap-8">
          {/* Logo o inicial */}
          <div className="shrink-0">
            {club.logo ? (
              <img src={club.logo} alt={club.name} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-lime-400/30" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-lime-400 flex items-center justify-center text-4xl font-black text-gray-900">
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <p className="text-lime-400 text-xs font-bold uppercase tracking-widest mb-2">Club deportivo</p>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-3">{club.name}</h1>
            {club.description && (
              <p className="text-gray-400 text-sm max-w-xl">{club.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center md:justify-start">
              {club.city && (
                <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <MapPin className="h-4 w-4 text-lime-400" /> {club.city}
                </span>
              )}
              {club.contactPhone && (
                <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Phone className="h-4 w-4 text-lime-400" /> {club.contactPhone}
                </span>
              )}
              {club.contactEmail && (
                <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Mail className="h-4 w-4 text-lime-400" /> {club.contactEmail}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 md:flex-col md:gap-3 shrink-0">
            <div className="text-center">
              <p className="text-3xl font-black text-lime-400">{club.totalCourts}</p>
              <p className="text-xs text-gray-400">Canchas</p>
            </div>
            {club.avgRating > 0 && (
              <div className="text-center">
                <p className="text-3xl font-black text-lime-400">{club.avgRating}</p>
                <p className="text-xs text-gray-400">Rating</p>
              </div>
            )}
            {club.totalReviews > 0 && (
              <div className="text-center">
                <p className="text-3xl font-black text-lime-400">{club.totalReviews}</p>
                <p className="text-xs text-gray-400">Reseñas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Canchas */}
        <section>
          <h2 className="text-2xl font-black text-gray-900 uppercase mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-lime-500" /> Canchas disponibles
          </h2>

          {club.courts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-400 font-bold">Sin canchas disponibles por el momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {club.courts.map((court: any) => (
                <div key={court._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Foto */}
                  <div className="relative h-48 bg-gray-100">
                    {court.photos?.[0] ? (
                      <img src={court.photos[0]} alt={court.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {court.sport === 'futbol' ? '⚽' : court.sport === 'padel' ? '🎾' : '🏐'}
                      </div>
                    )}
                    {court.photos?.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                        +{court.photos.length - 1} fotos
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-black text-gray-900 text-lg">{court.name}</h3>
                        <SportBadge sport={court.sport} />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-black text-gray-900">
                          ${court.pricePerHour?.toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-gray-400">por hora</p>
                      </div>
                    </div>

                    {court.averageRating > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <StarRating rating={court.averageRating} />
                        <span className="text-xs text-gray-500">{court.averageRating} ({court.totalReviews} reseñas)</span>
                      </div>
                    )}

                    {court.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {court.amenities.slice(0, 4).map((a: string) => (
                          <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/canchas/${court._id}`}
                      className="block w-full text-center bg-lime-400 hover:bg-lime-300 text-gray-900 font-black py-3 rounded-xl transition-colors text-sm uppercase tracking-wide"
                    >
                      Reservar ahora →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reseñas */}
        {club.reviews.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-gray-900 uppercase mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" /> Lo que dicen nuestros clientes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {club.reviews.map((r: any) => (
                <div key={r._id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{r.guestName}</p>
                      <p className="text-xs text-gray-400">{r.courtName}</p>
                    </div>
                    <StarRating rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-gray-600 text-sm leading-relaxed">"{r.comment}"</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA final */}
        <section className="bg-gray-900 rounded-3xl p-10 text-center text-white">
          <Users className="h-10 w-10 text-lime-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black uppercase mb-2">¿Listo para jugar?</h2>
          <p className="text-gray-400 text-sm mb-6">Reserva tu cancha en minutos, paga en efectivo o en línea</p>
          <Link
            href="/empresas"
            className="inline-block bg-lime-400 hover:bg-lime-300 text-gray-900 font-black py-3 px-8 rounded-xl transition-colors uppercase tracking-wide"
          >
            Ver todas las canchas
          </Link>
        </section>
      </div>
    </div>
  );
}
