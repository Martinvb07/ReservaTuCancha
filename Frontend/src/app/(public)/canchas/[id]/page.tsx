import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, ArrowLeft, Clock, Users, CheckCircle } from 'lucide-react';
import BookingForm from '@/components/bookings/BookingForm';
import ReviewCard from '@/components/reviews/ReviewCard';

const SPORT_LABELS: Record<string, { label: string; emoji: string; img: string }> = {
  futbol:      { label: 'Fútbol',      emoji: '⚽', img: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&q=80' },
  padel:       { label: 'Pádel',       emoji: '🎾', img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=80' },
  voley_playa: { label: 'Voley Playa', emoji: '🏐', img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80' },
};

async function getCourt(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courts/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getReviews(courtId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/court/${courtId}`, {
    next: { revalidate: 120 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const court = await getCourt(params.id);
  if (!court) return { title: 'Cancha no encontrada' };

  const sport = SPORT_LABELS[court.sport] ?? { label: court.sport, emoji: '', img: '' };
  const title = `${court.name} — ${sport.label} en ${court.location.city}`;
  const description = court.description
    ? court.description.slice(0, 155)
    : `Reserva ${court.name} (${sport.label}) en ${court.location.address}, ${court.location.city}. $${court.pricePerHour.toLocaleString('es-CO')} COP/hora.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: court.photos?.[0] ? [{ url: court.photos[0], width: 1200, height: 630 }] : [],
      type: 'website',
      locale: 'es_CO',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: court.photos?.[0] ? [court.photos[0]] : [],
    },
  };
}

export default async function CourtDetailPage({ params }: { params: { id: string } }) {
  const [court, reviews] = await Promise.all([getCourt(params.id), getReviews(params.id)]);
  if (!court) notFound();

  const sport = SPORT_LABELS[court.sport] ?? { label: court.sport, emoji: '🏟️', img: '' };

  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative h-72 md:h-96 overflow-hidden bg-gray-900">
        {court.photos?.[0] ? (
          <Image src={court.photos[0]} alt={court.name} fill className="object-cover opacity-60" />
        ) : (
          <Image src={sport.img} alt={sport.label} fill className="object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

        <div className="absolute top-4 left-4">
          <Link href="/empresas"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-3 py-2 rounded-full border border-white/20 transition-all">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Volver a canchas</span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 bg-lime-400 text-gray-900 text-xs font-black px-3 py-1 rounded-full mb-2">
                  {sport.emoji} {sport.label}
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-white uppercase leading-tight truncate">{court.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1.5 text-gray-300 text-xs md:text-sm">
                    <MapPin className="h-3.5 w-3.5 text-lime-400 shrink-0" />
                    <span className="truncate">{court.location.address}, {court.location.city}</span>
                  </span>
                  {court.totalReviews > 0 && (
                    <span className="flex items-center gap-1 text-gray-300 text-xs md:text-sm shrink-0">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {court.averageRating.toFixed(1)} · {court.totalReviews} reseñas
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl md:text-4xl font-black text-lime-400">${court.pricePerHour.toLocaleString('es-CO')}</p>
                <p className="text-gray-400 text-xs">COP / hora</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALERÍA DE FOTOS ──────────────────────────────────────── */}
      {court.photos?.length > 1 && (
        <section className="max-w-6xl mx-auto px-4 pt-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {court.photos.map((url: string, i: number) => (
              <div key={i} className={`relative rounded-xl overflow-hidden ${i === 0 ? 'ring-2 ring-lime-400' : ''}`}>
                <Image src={url} alt={`${court.name} foto ${i + 1}`} width={300} height={200} className="w-full h-24 sm:h-28 object-cover hover:scale-105 transition-transform" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-lime-400 text-gray-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">Principal</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CONTENIDO ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
            {court.description && (
              <div className="space-y-3">
                <h2 className="text-xl font-black text-gray-900 uppercase flex items-center gap-2">
                  <span className="w-1 h-5 bg-lime-400 rounded-full inline-block" /> Sobre esta cancha
                </h2>
                <p className="text-gray-600 leading-relaxed">{court.description}</p>
              </div>
            )}

            {court.amenities?.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-black text-gray-900 uppercase flex items-center gap-2">
                  <span className="w-1 h-5 bg-lime-400 rounded-full inline-block" /> Instalaciones
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {court.amenities.map((a: string) => (
                    <div key={a} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm font-medium text-gray-700">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 uppercase flex items-center gap-2">
                <span className="w-1 h-5 bg-lime-400 rounded-full inline-block" />
                Reseñas {reviews.length > 0 && <span className="text-gray-400 font-normal normal-case text-base">({reviews.length})</span>}
              </h2>
              {reviews.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                  <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Aún no hay reseñas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.slice(0, 5).map((review: any) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-6 space-y-4">
              <BookingForm
                courtId={court._id}
                courtName={court.name}
                pricePerHour={court.pricePerHour}
                availability={court.availability}
              />
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Información</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="h-4 w-4 text-green-600 shrink-0" />Duración mínima: 1 hora</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Users className="h-4 w-4 text-green-600 shrink-0" />Sin límite de jugadores</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="h-4 w-4 text-green-600 shrink-0" />Cancelación gratis hasta 2h antes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}