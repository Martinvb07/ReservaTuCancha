import { getSport } from '@/lib/constants';
import { urlAbsoluta } from '@/lib/site';

const DIAS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Horario de atención en el formato de schema.org. */
function horarios(availability: any[] = []) {
  return availability
    .filter((a) => a && typeof a.dayOfWeek === 'number' && a.openTime && a.closeTime)
    .map((a) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DIAS[a.dayOfWeek]}`,
      opens: a.openTime,
      closes: a.closeTime,
    }));
}

/** Ficha de una cancha como lugar deportivo, con precio y reseñas. */
export function jsonLdCancha(court: any, reviews: any[] = []) {
  const sport = getSport(court.sport);
  const [lng, lat] = court.location?.coordinates ?? [];
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': urlAbsoluta(`/canchas/${court._id}`),
    name: court.name,
    description: court.description || `Cancha de ${sport.label} en ${court.location?.city ?? 'Colombia'}`,
    url: urlAbsoluta(`/canchas/${court._id}`),
    image: court.photos?.length ? court.photos : undefined,
    sport: sport.label,
    priceRange: `$${Number(court.pricePerHour).toLocaleString('es-CO')} COP/hora`,
    currenciesAccepted: 'COP',
    paymentAccepted: 'Tarjeta, PSE, Nequi',
    address: {
      '@type': 'PostalAddress',
      streetAddress: court.location?.address,
      addressLocality: court.location?.city,
      addressRegion: court.location?.department,
      addressCountry: 'CO',
    },
    amenityFeature: (court.amenities ?? []).map((a: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    })),
    openingHoursSpecification: horarios(court.availability),
  };
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    data.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
  }
  if (court.totalReviews > 0 && court.averageRating > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(court.averageRating).toFixed(1),
      reviewCount: court.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }
  if (reviews.length) {
    data.review = reviews.slice(0, 5).map((r: any) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.guestName || 'Jugador' },
      datePublished: r.createdAt ? String(r.createdAt).slice(0, 10) : undefined,
      reviewBody: r.comment || undefined,
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    }));
  }
  return data;
}

/** Página pública de un club con sus canchas. */
export function jsonLdClub(club: any) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsClub',
    '@id': urlAbsoluta(`/club/${club.slug}`),
    name: club.name,
    description: club.description || undefined,
    slogan: club.slogan || undefined,
    url: urlAbsoluta(`/club/${club.slug}`),
    logo: club.logo || undefined,
    image: club.photos?.length ? club.photos : club.courts?.[0]?.photos?.[0],
    telephone: club.contactPhone || undefined,
    email: club.contactEmail || undefined,
    address: club.address || club.city
      ? {
          '@type': 'PostalAddress',
          streetAddress: club.address || undefined,
          addressLocality: club.city || undefined,
          addressCountry: 'CO',
        }
      : undefined,
    sameAs: Object.values(club.socialLinks ?? {}).filter(
      (v) => typeof v === 'string' && /^https?:\/\//.test(v),
    ),
    containsPlace: (club.courts ?? []).map((c: any) => ({
      '@type': 'SportsActivityLocation',
      name: c.name,
      url: urlAbsoluta(`/canchas/${c._id}`),
      sport: getSport(c.sport).label,
    })),
  };
  if (club.totalReviews > 0 && club.avgRating > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: club.avgRating,
      reviewCount: club.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return data;
}

/** Quiénes somos, para la portada. */
export function jsonLdSitio() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ReservaTuCancha',
      url: urlAbsoluta('/'),
      logo: urlAbsoluta('/Logos/ReservaTuCanchaLOGO.png'),
      areaServed: 'CO',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ReservaTuCancha',
      url: urlAbsoluta('/'),
      inLanguage: 'es-CO',
    },
  ];
}
