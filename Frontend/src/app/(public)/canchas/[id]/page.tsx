// Este archivo va en: src/app/(public)/canchas/[id]/page.tsx
// Es idéntico al de empresas/[id] pero con la ruta de volver correcta

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

        <div className="absolute top-5 left-5">
          <Link href="/empresas"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/20 transition-all">
            <ArrowLeft className="h-4 w-4" /> Volver a canchas
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-lime-400 text-gray-900 text-xs font-black px-3 py-1 rounded-full mb-3">
                  {sport.emoji} {sport.label}
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase leading-tight">{court.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-gray-300 text-sm">
                    <MapPin className="h-4 w-4 text-lime-400" />
                    {court.location.address}, {court.location.city}
                  </span>
                  {court.totalReviews > 0 && (
                    <span className="flex items-center gap-1.5 text-gray-300 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {court.averageRating.toFixed(1)} · {court.totalReviews} reseñas
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-lime-400">${court.pricePerHour.toLocaleString('es-CO')}</p>
                <p className="text-gray-400 text-sm">COP / hora</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENIDO ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-8">
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

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
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