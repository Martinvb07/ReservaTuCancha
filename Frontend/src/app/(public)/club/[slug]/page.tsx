import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Phone, Star, Users, Trophy, Camera, Clock } from 'lucide-react';

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
            <h1 className="text-4xl font-black uppercase tracking-tight mb-2">{club.name}</h1>
            {club.slogan && (
              <p className="text-lime-300/80 text-sm font-medium italic mb-3">"{club.slogan}"</p>
            )}
            {club.description && (
              <p className="text-gray-400 text-sm max-w-xl">{club.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center md:justify-start">
              {club.address && (
                <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <MapPin className="h-4 w-4 text-lime-400" /> {club.address}{club.city ? `, ${club.city}` : ''}
                </span>
              )}
              {club.schedule && (
                <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Clock className="h-4 w-4 text-lime-400" /> {club.schedule}
                </span>
              )}
              {club.contactPhone && (
                <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Phone className="h-4 w-4 text-lime-400" /> {club.contactPhone}
                </span>
              )}
            </div>
            {/* Redes sociales */}
            {(club.socialLinks?.instagram || club.socialLinks?.facebook || club.socialLinks?.tiktok || club.socialLinks?.whatsapp) && (
              <div className="flex items-center gap-3 mt-4 justify-center md:justify-start">
                {club.socialLinks.instagram && (
                  <a href={club.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-yellow-400 text-gray-400 hover:text-white flex items-center justify-center transition-all">
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {club.socialLinks.facebook && (
                  <a href={club.socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#1877F2] text-gray-400 hover:text-white flex items-center justify-center transition-all">
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {club.socialLinks.tiktok && (
                  <a href={club.socialLinks.tiktok} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-black text-gray-400 hover:text-white flex items-center justify-center transition-all">
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.17v-3.45a4.85 4.85 0 01-1.81-.36 4.87 4.87 0 01-1.64-1.1V6.69h3.45z"/></svg>
                  </a>
                )}
                {club.socialLinks.whatsapp && (
                  <a href={club.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#25D366] text-gray-400 hover:text-white flex items-center justify-center transition-all">
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                )}
              </div>
            )}
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

        {/* Fotos del club / instalaciones */}
        {club.photos?.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-gray-900 uppercase mb-6 flex items-center gap-2">
              <Camera className="h-6 w-6 text-lime-500" /> Nuestras instalaciones
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {club.photos.map((url: string, i: number) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <img src={url} alt={`Instalación ${i + 1}`} className="w-full h-44 object-cover hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          </section>
        )}

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
