import type { MetadataRoute } from 'next';
import { urlAbsoluta, SITE_URL } from '@/lib/site';

/**
 * Lo privado o de un solo uso queda fuera del índice: el panel, el checkout y
 * las páginas a las que se llega con el token de un correo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/api/',
        '/auth/',
        '/pagar',
        '/app/',
        '/reservas/',
        '/resena',
        '/mis-reservas',
        '/r/',
      ],
    },
    sitemap: urlAbsoluta('/sitemap.xml'),
    host: SITE_URL,
  };
}
