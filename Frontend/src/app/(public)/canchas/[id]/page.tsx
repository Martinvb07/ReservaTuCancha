import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, Star, ArrowLeft, Clock, Users, ShieldCheck } from 'lucide-react';
import FotoRemota from '@/components/ui/FotoRemota';
import VolverListado from '@/components/courts/VolverListado';
import BookingForm from '@/components/bookings/BookingForm';
import ReviewCard from '@/components/reviews/ReviewCard';
import SportIcon from '@/components/ui/SportIcon';
import CourtLocationMap from '@/components/map/CourtLocationMap';
import { getSport } from '@/lib/constants';
import { amenityIcon } from '@/lib/amenityIcons';
import JsonLd from '@/components/seo/JsonLd';
import { jsonLdCancha } from '@/lib/seo';

async function getCourt(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courts/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getReviews(courtId: string) {
  /* Sin caché: una reseña recién publicada tiene que verse al volver a la
     ficha. Con revalidate la calificación (que sale del court, con su propio
     caché) subía antes de que apareciera el comentario, y parecía que la
     reseña se había perdido. */
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/court/${courtId}`, {
    cache: 'no-store',
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
    alternates: { canonical: `/canchas/${params.id}` },
    openGraph: {
      title,
      description,
      url: `/canchas/${params.id}`,
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

function Titulo({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg md:text-xl font-bold text-gray-900">{children}</h2>;
}

/** Bloque blanco de la ficha, como las tarjetas de la app. */
function Bloque({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-[28px] p-5 md:p-6 ${className}`}>{children}</div>;
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
  const direccion = [court.location?.address, court.location?.city].filter(Boolean).join(', ');

  return (
    <main className="min-h-screen pb-28 lg:pb-16">
      <JsonLd data={jsonLdCancha(court, reviews)} />

      {/* ── FOTOS ─────────────────────────────────────────────────
          Celular: la foto a todo el ancho y la hoja blanca sube encima,
          como en la app. Escritorio: galería redondeada. */}
      <section className="lg:max-w-6xl lg:mx-auto lg:px-5 lg:pt-6">
        <div className="hidden lg:flex items-center justify-between mb-4">
          <VolverListado className="inline-flex items-center gap-2 bg-white hover:bg-gray-900 hover:text-white text-gray-800 text-sm font-semibold pl-3 pr-4 py-2 rounded-full transition-colors">
            <ArrowLeft className="h-4 w-4" /> Volver a canchas
          </VolverListado>
        </div>
        <div className={`relative grid gap-2 ${photos.length > 2 ? 'lg:grid-cols-[2fr_1fr]' : ''}`}>
          <div className="relative h-[340px] md:h-[400px] lg:h-[440px] overflow-hidden bg-gray-200 lg:rounded-[32px]">
            <FotoRemota src={photos[0]} alt={court.name} priority sizes="(max-width: 1024px) 100vw, 760px" className="object-cover" />
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent lg:hidden" />
            <VolverListado ariaLabel="Volver a canchas"
              className="lg:hidden absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/20 text-white backdrop-blur-md">
              <ArrowLeft className="h-5 w-5" />
            </VolverListado>
          </div>
          {photos.length > 2 && (
            <div className="hidden lg:grid grid-rows-2 gap-2">
              {photos.slice(1, 3).map((url, i) => (
                <div key={i} className="relative overflow-hidden rounded-[28px] bg-gray-200">
                  <FotoRemota src={url} alt={`${court.name} foto ${i + 2}`} sizes="380px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CONTENIDO ─────────────────────────────────────────────── */}
      <section className="relative -mt-8 lg:mt-6 max-w-6xl mx-auto lg:px-5">
        {/* Una sola grilla: en celular todo va en columna dentro de la hoja
            redondeada; en escritorio la reserva ocupa la columna derecha y se
            queda fija. Así hay un solo formulario de reserva en la página. */}
        <div className="grid grid-cols-1 gap-6 rounded-t-[32px] bg-fondo px-5 pt-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-8 lg:rounded-none lg:p-0">
            {/* Nombre, deporte, dirección y nota */}
            <div className="lg:col-start-1">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-[26px] md:text-4xl font-extrabold tracking-tight leading-tight text-gray-900">{court.name}</h1>
                <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-lime-400 px-3 py-1.5 text-xs font-bold text-gray-900">
                  <SportIcon sport={court.sport} size={14} /> {sport.label}
                </span>
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span>{direccion}</span>
              </p>
              {court.totalReviews > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-gray-900">{court.averageRating.toFixed(1)}</span>
                  <a href="#resenas" className="text-gray-500 hover:text-green-700">· {court.totalReviews} reseñas</a>
                </p>
              )}
            </div>

            {/* Lo que ofrece */}
            {court.amenities?.length > 0 && (
              <div className="lg:col-start-1">
                <Titulo>Lo que ofrece</Titulo>
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap">
                  {court.amenities.map((a: string) => {
                    const Icon = amenityIcon(a);
                    return (
                      <div key={a} className="flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-[22px] bg-white px-2 py-3.5 text-center">
                        <Icon className="h-[22px] w-[22px] text-gray-800" />
                        <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-gray-700">{a}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reserva: en celular sigue a "Lo que ofrece"; en escritorio
                pasa a la columna derecha, de arriba a abajo, y queda fija. */}
            <aside id="reservar" className="scroll-mt-24 lg:col-start-2 lg:row-start-1 lg:row-span-6">
              <div className="space-y-4 lg:sticky lg:top-24">
                <div className="lg:hidden"><Titulo>Reserva tu turno</Titulo></div>
                <BookingForm
                  courtId={court._id}
                  courtName={court.name}
                  pricePerHour={court.pricePerHour}
                  availability={court.availability}
                  initialDate={searchParams?.date}
                  initialStart={searchParams?.start}
                />
                <Informacion />
              </div>
            </aside>

            {court.description && (
              <div className="lg:col-start-1">
                <Titulo>Sobre esta cancha</Titulo>
                <p className="mt-2 leading-relaxed text-gray-600">{court.description}</p>
              </div>
            )}

            {photos.length > 1 && (
              <div className="lg:hidden lg:col-start-1">
                <Titulo>Fotos</Titulo>
                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {photos.slice(1).map((url, i) => (
                    <div key={i} className="relative h-36 w-52 shrink-0 overflow-hidden rounded-[22px] bg-gray-200">
                      <FotoRemota src={url} alt={`${court.name} foto ${i + 2}`} sizes="208px" className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="lg:col-start-1">
              <Titulo>Dónde queda</Titulo>
              {/* El mapa ya trae la dirección y el botón "Cómo llegar". */}
              <Bloque className="mt-3 !p-3 md:!p-3">
                <CourtLocationMap
                  coordinates={court.location?.coordinates}
                  city={court.location?.city}
                  address={court.location?.address}
                  seed={court._id}
                  name={court.name}
                />
              </Bloque>
            </div>

            <div id="resenas" className="scroll-mt-24 lg:col-start-1">
              <Titulo>
                Reseñas {reviews.length > 0 && <span className="text-base font-normal text-gray-500">({reviews.length})</span>}
              </Titulo>
              {reviews.length === 0 ? (
                <Bloque className="mt-3 text-center !py-10">
                  <Star className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="font-medium text-gray-700">Aún no hay reseñas</p>
                  <p className="mt-1 text-sm text-gray-500">¡Sé el primero en reservar y opinar!</p>
                </Bloque>
              ) : (
                <div className="mt-3 space-y-3">
                  {reviews.map((review: any) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>
              )}
            </div>
        </div>
      </section>

      {/* Barra fija de abajo en celular: precio y botón al formulario */}
      <div className="barra-reserva lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/95 px-5 py-3 backdrop-blur"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Precio</p>
            <p className="text-gray-900">
              <span className="text-xl font-extrabold">${court.pricePerHour.toLocaleString('es-CO')}</span>
              <span className="text-xs text-gray-500"> /hora</span>
            </p>
          </div>
          <a href="#reservar" className="rounded-full bg-green-600 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-green-700">
            Reservar
          </a>
        </div>
      </div>
    </main>
  );
}

function Informacion() {
  return (
    <div className="bg-white rounded-[28px] p-5 space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Información</p>
      <div className="flex items-center gap-2.5 text-sm text-gray-700"><Clock className="h-4 w-4 shrink-0 text-green-600" />Duración mínima: 1 hora</div>
      <div className="flex items-center gap-2.5 text-sm text-gray-700"><Users className="h-4 w-4 shrink-0 text-green-600" />Sin límite de jugadores</div>
      <div className="flex items-center gap-2.5 text-sm text-gray-700"><ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />Cambio de horario hasta 24h antes</div>
    </div>
  );
}
