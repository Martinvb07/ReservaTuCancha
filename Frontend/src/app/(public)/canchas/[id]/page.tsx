import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, ArrowLeft, Clock, Users, ShieldCheck } from 'lucide-react';
import BookingForm from '@/components/bookings/BookingForm';
import ReviewCard from '@/components/reviews/ReviewCard';
import SportIcon from '@/components/ui/SportIcon';
import CourtLocationMap from '@/components/map/CourtLocationMap';
import { getSport } from '@/lib/constants';
import { amenityIcon } from '@/lib/amenityIcons';

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

  const sport = getSport(court.sport);
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

// Encabezado de sección con acento verde.
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-lg md:text-xl font-bold text-gray-900">
      <span className="w-1.5 h-5 bg-lime-400 rounded-full inline-block" />
      {children}
    </h2>
  );
}

export default async function CourtDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string; start?: string };
}) {
  const [court, reviews] = await Promise.all([getCourt(params.id), getReviews(params.id)]);
  if (!court) notFound();

  const sport = getSport(court.sport);
  const photos: string[] = court.photos?.length ? court.photos : [sport.img];

  return (
    <main className="min-h-screen bg-white">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative h-64 md:h-80 overflow-hidden bg-gray-900">
        <Image src={photos[0]} alt={court.name} fill priority className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-gray-900/20" />

        <div className="absolute top-4 left-0 right-0">
          <div className="max-w-6xl mx-auto px-4">
            <Link
              href="/empresas"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3.5 py-2 rounded-full border border-white/20 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Volver a canchas
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 bg-lime-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full mb-2.5">
                  <SportIcon sport={court.sport} size={14} /> {sport.label}
                </span>
                <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight truncate">{court.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                  <span className="flex items-center gap-1.5 text-gray-200 text-sm">
                    <MapPin className="h-4 w-4 text-lime-400 shrink-0" />
                    <span className="truncate">{court.location.address}, {court.location.city}</span>
                  </span>
                  {court.totalReviews > 0 && (
                    <span className="flex items-center gap-1.5 text-gray-200 text-sm shrink-0">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{court.averageRating.toFixed(1)}</span>
                      <span className="text-gray-400">· {court.totalReviews} reseñas</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl md:text-4xl font-bold text-lime-400">${court.pricePerHour.toLocaleString('es-CO')}</p>
                <p className="text-gray-400 text-xs">COP / hora</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENIDO ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
            {/* Galería */}
            {photos.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {photos.map((url, i) => (
                  <div key={i} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={url}
                      alt={`${court.name} foto ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}

            {court.description && (
              <div className="space-y-3">
                <SectionHeading>Sobre esta cancha</SectionHeading>
                <p className="text-gray-600 leading-relaxed">{court.description}</p>
              </div>
            )}

            {court.amenities?.length > 0 && (
              <div className="space-y-3">
                <SectionHeading>Instalaciones</SectionHeading>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {court.amenities.map((a: string) => {
                    const Icon = amenityIcon(a);
                    return (
                      <div key={a} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100">
                        <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-gray-700 truncate">{a}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <SectionHeading>Dónde queda</SectionHeading>
              <CourtLocationMap
                coordinates={court.location?.coordinates}
                city={court.location?.city}
                address={court.location?.address}
                seed={court._id}
                name={court.name}
              />
            </div>

            <div className="space-y-4">
              <SectionHeading>
                Reseñas {reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
              </SectionHeading>
              {reviews.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                  <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Aún no hay reseñas</p>
                  <p className="text-gray-400 text-sm mt-1">¡Sé el primero en reservar y opinar!</p>
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

          {/* Columna de reserva */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-6 space-y-4">
              <BookingForm
                courtId={court._id}
                courtName={court.name}
                pricePerHour={court.pricePerHour}
                availability={court.availability}
                initialDate={searchParams?.date}
                initialStart={searchParams?.start}
              />
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Información</p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-gray-600"><Clock className="h-4 w-4 text-green-600 shrink-0" />Duración mínima: 1 hora</div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600"><Users className="h-4 w-4 text-green-600 shrink-0" />Sin límite de jugadores</div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600"><ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />Cambio de horario hasta 24h antes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
