import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, Mail, MapPin, Megaphone, Navigation, Phone, Star } from 'lucide-react';
import JsonLd from '@/components/seo/JsonLd';
import { jsonLdClub } from '@/lib/seo';
import FotoRemota from '@/components/ui/FotoRemota';
import FadeIn from '@/components/ui/FadeIn';
import { TarjetaGrande } from '@/components/courts/TarjetasCancha';
import CompartirClub from '@/components/club/CompartirClub';
import type { Court } from '@/types';

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
    /* El template del layout ya agrega "| ReservaTuCancha". */
    title: club.city ? `${club.name} — Canchas en ${club.city}` : club.name,
    alternates: { canonical: `/club/${club.slug ?? params.slug}` },
    description: club.description || `Reserva canchas en ${club.name}, ${club.city}. ${club.totalCourts} cancha${club.totalCourts !== 1 ? 's' : ''} disponible${club.totalCourts !== 1 ? 's' : ''}.`,
    openGraph: {
      title: club.name,
      url: `/club/${club.slug ?? params.slug}`,
      description: club.description || `Reserva en ${club.name}`,
      images: club.courts?.[0]?.photos?.[0] ? [{ url: club.courts[0].photos[0] }] : [],
    },
  };
}

const REDES: { clave: 'instagram' | 'facebook' | 'tiktok' | 'whatsapp'; nombre: string; hover: string; icono: React.ReactNode }[] = [
  { clave: 'instagram', nombre: 'Instagram', hover: 'hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-yellow-400 hover:text-white', icono: <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { clave: 'facebook',  nombre: 'Facebook',  hover: 'hover:bg-[#1877F2] hover:text-white', icono: <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { clave: 'tiktok',    nombre: 'TikTok',    hover: 'hover:bg-black hover:text-white', icono: <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.17v-3.45a4.85 4.85 0 01-1.81-.36 4.87 4.87 0 01-1.64-1.1V6.69h3.45z"/></svg> },
  { clave: 'whatsapp',  nombre: 'WhatsApp',  hover: 'hover:bg-[#25D366] hover:text-white', icono: <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
];

function Estrellas({ nota }: { nota: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(nota) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

/** Píldora de vidrio sobre la portada, igual que en las tarjetas de cancha. */
function Vidrio({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
      {children}
    </span>
  );
}

function Titulo({ children, detalle }: { children: React.ReactNode; detalle?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <h2 className="text-xl font-black text-gray-900 md:text-2xl">{children}</h2>
      {detalle && <p className="shrink-0 text-sm text-gray-500">{detalle}</p>}
    </div>
  );
}

export default async function ClubPublicPage({ params }: { params: { slug: string } }) {
  const club = await getClub(params.slug);
  if (!club) notFound();

  const canchas: any[] = club.courts ?? [];
  const fotos: string[] = club.photos ?? [];
  const portada: string | undefined = club.coverPhoto || fotos[0] || canchas.find((c) => c.photos?.[0])?.photos?.[0];
  const redes = REDES.filter((r) => club.socialLinks?.[r.clave]);

  /* "Cómo llegar": el punto de la primera cancha que lo tenga; si no, la dirección. */
  const punto = canchas.map((c) => c.location?.coordinates).find((c) => Array.isArray(c) && c.length === 2);
  const direccion = [club.address, club.city].filter(Boolean).join(', ');
  const ruta = punto
    ? `https://www.google.com/maps/dir/?api=1&destination=${punto[1]},${punto[0]}`
    : direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}` : '';

  const datos = [
    direccion && { icon: MapPin, label: 'Dirección', valor: direccion, href: ruta },
    club.schedule && { icon: Clock, label: 'Horario', valor: club.schedule },
    club.contactPhone && { icon: Phone, label: 'Teléfono', valor: club.contactPhone, href: `tel:${String(club.contactPhone).replace(/[^\d+]/g, '')}` },
    club.contactEmail && { icon: Mail, label: 'Correo', valor: club.contactEmail, href: `mailto:${club.contactEmail}` },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; valor: string; href?: string }[];

  return (
    <div className="min-h-screen bg-fondo">
      <JsonLd data={jsonLdClub(club)} />

      {/* ── Portada ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-900">
        {portada ? (
          <FotoRemota src={portada} alt={`Instalaciones de ${club.name}`} sizes="100vw" className="object-cover" />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-green-900" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(17,24,39,.55) 0%, rgba(17,24,39,.35) 35%, rgba(17,24,39,.92) 100%)' }} />

        {/* Sin foto de portada la franja es más baja: no deja un hueco oscuro. */}
        <div className={`relative mx-auto flex max-w-6xl flex-col justify-end px-5 pb-8 md:pb-10 ${portada ? 'min-h-[380px] pt-24 md:min-h-[460px]' : 'min-h-[260px] pt-14 md:min-h-[300px]'}`}>
          <div className="rtc-fade flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4 md:gap-5">
              {club.logo ? (
                <img src={club.logo} alt={`Logo de ${club.name}`} className="h-20 w-20 shrink-0 rounded-3xl object-cover ring-4 ring-white/90 shadow-xl md:h-24 md:w-24" />
              ) : (
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-lime-400 text-4xl font-black text-gray-900 ring-4 ring-white/90 shadow-xl md:h-24 md:w-24">
                  {club.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">{club.name}</h1>
                {club.slogan && <p className="mt-1 text-sm font-medium text-lime-300 md:text-base">{club.slogan}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {club.avgRating > 0 && (
                    <Vidrio><Star className="h-3.5 w-3.5 fill-lime-400 text-lime-400" /> {club.avgRating} · {club.totalReviews} {club.totalReviews === 1 ? 'reseña' : 'reseñas'}</Vidrio>
                  )}
                  <Vidrio>{club.totalCourts} {club.totalCourts === 1 ? 'cancha' : 'canchas'}</Vidrio>
                  {club.city && <Vidrio><MapPin className="h-3.5 w-3.5" /> {club.city}</Vidrio>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a href="#canchas"
                className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-black text-gray-900 transition-all duration-200 hover:scale-[1.03] hover:bg-lime-300 active:scale-95">
                Reservar <ArrowRight className="h-4 w-4" />
              </a>
              {ruta && (
                <a href={ruta} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/20">
                  <Navigation className="h-4 w-4" /> Cómo llegar
                </a>
              )}
              <CompartirClub nombre={club.name}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/20" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-5 py-8 md:space-y-14 md:py-10">

        {/* ── Aviso del club ──────────────────────────────────── */}
        {club.anuncio && (
          <FadeIn className="flex items-center gap-3 rounded-[24px] bg-lime-400 px-5 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-900"><Megaphone className="h-[18px] w-[18px] text-lime-400" /></span>
            <p className="text-sm font-bold text-gray-900 md:text-base">{club.anuncio}</p>
          </FadeIn>
        )}

        {/* ── Datos de contacto ───────────────────────────────── */}
        {datos.length > 0 && (
          <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${datos.length >= 4 ? 'lg:grid-cols-4' : datos.length === 3 ? 'lg:grid-cols-3' : ''}`}>
            {datos.map((d, i) => {
              const contenido = (
                <>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-50 text-green-600 transition-colors duration-200 group-hover:bg-green-600 group-hover:text-white">
                    <d.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">{d.label}</span>
                    <span className="block truncate text-sm font-bold text-gray-900">{d.valor}</span>
                  </span>
                </>
              );
              const clases = 'group flex h-full items-center gap-3 rounded-[24px] bg-white p-4';
              return (
                <FadeIn key={d.label} delay={i * 60}>
                  {d.href
                    ? <a href={d.href} {...(d.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={`${clases} transition-shadow duration-300 hover:shadow-lg hover:shadow-gray-900/5`}>{contenido}</a>
                    : <div className={clases}>{contenido}</div>}
                </FadeIn>
              );
            })}
          </div>
        )}

        {/* ── Canchas ─────────────────────────────────────────── */}
        <section id="canchas" className="scroll-mt-24">
          <Titulo detalle={canchas.length > 0 ? `${canchas.length} ${canchas.length === 1 ? 'disponible' : 'disponibles'}` : undefined}>Canchas</Titulo>
          {canchas.length === 0 ? (
            <div className="flex flex-col items-center rounded-[28px] bg-white px-6 py-12 text-center">
              <p className="font-bold text-gray-900">Este club aún no tiene canchas publicadas</p>
              <p className="mt-1 text-sm text-gray-500">Vuelve pronto o mira otras canchas cerca.</p>
              <Link href="/empresas" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95">
                Ver canchas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {canchas.map((c, i) => (
                <FadeIn key={c._id} delay={Math.min(i, 5) * 70}>
                  {/* La misma tarjeta del inicio: toda ella lleva a reservar. */}
                  <TarjetaGrande court={{ ...c, location: c.location ?? { address: club.address ?? '', city: club.city ?? '', department: '' } } as Court} />
                </FadeIn>
              ))}
            </div>
          )}
        </section>

        {/* ── Sobre el club ───────────────────────────────────── */}
        {(club.description || redes.length > 0) && (
          <FadeIn as="section" className="rounded-[28px] bg-white p-6 md:p-8">
            <h2 className="text-xl font-black text-gray-900 md:text-2xl">Sobre {club.name}</h2>
            {club.description && <p className="mt-3 max-w-3xl whitespace-pre-line leading-relaxed text-gray-600">{club.description}</p>}
            {redes.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {redes.map((r) => (
                  <a key={r.clave} href={club.socialLinks[r.clave]} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-all duration-300 ${r.hover}`}>
                    {r.icono} {r.nombre}
                  </a>
                ))}
              </div>
            )}
          </FadeIn>
        )}

        {/* ── Instalaciones ───────────────────────────────────── */}
        {fotos.length > 0 && (
          <section>
            <Titulo detalle={`${fotos.length} ${fotos.length === 1 ? 'foto' : 'fotos'}`}>Instalaciones</Titulo>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {fotos.slice(0, 8).map((url, i) => (
                <FadeIn key={url} delay={Math.min(i, 5) * 50}
                  className={`group relative overflow-hidden rounded-[24px] bg-gray-200 ${i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto' : 'aspect-square'}`}>
                  <FotoRemota src={url} alt={`Instalaciones de ${club.name}, foto ${i + 1}`}
                    sizes={i === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                    className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </FadeIn>
              ))}
            </div>
          </section>
        )}

        {/* ── Reseñas ─────────────────────────────────────────── */}
        {club.reviews?.length > 0 && (
          <section>
            <Titulo detalle={club.avgRating > 0 ? `${club.avgRating} de 5` : undefined}>Lo que dicen los jugadores</Titulo>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {club.reviews.map((r: any, i: number) => (
                <FadeIn key={r._id} delay={Math.min(i, 5) * 60} className="rounded-[24px] bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-50 text-sm font-black text-green-700">
                      {String(r.guestName ?? '?').trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">{r.guestName}</p>
                      <p className="truncate text-xs text-gray-500">{r.courtName}</p>
                    </div>
                    <Estrellas nota={r.rating} />
                  </div>
                  {r.comment && <p className="mt-3 text-sm leading-relaxed text-gray-600">{r.comment}</p>}
                </FadeIn>
              ))}
            </div>
          </section>
        )}

        {/* ── Cierre ──────────────────────────────────────────── */}
        <FadeIn as="section" className="relative overflow-hidden rounded-[28px] bg-gray-900 px-6 py-10 text-center md:py-12">
          <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[520px] max-w-full -translate-x-1/2 rounded-full bg-lime-400/15 blur-3xl" />
          <div className="relative">
            <h2 className="text-2xl font-black text-white md:text-3xl">¿Listo para jugar en {club.name}?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">Elige la cancha y el horario, paga en línea y llega a jugar. Sin llamadas.</p>
            <a href="#canchas"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime-400 px-7 py-3.5 text-sm font-black text-gray-900 transition-all duration-200 hover:scale-[1.03] hover:bg-lime-300 active:scale-95">
              Reservar ahora <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
