/** Dirección pública del sitio, sin barra final. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://reservatucancha.site').replace(/\/+$/, '');

/** URL absoluta a partir de una ruta del sitio. */
export const urlAbsoluta = (ruta = '/') => `${SITE_URL}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
