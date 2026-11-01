import type { MetadataRoute } from 'next';
import { urlAbsoluta } from '@/lib/site';

/* Se regenera cada hora: una cancha nueva aparece en el sitemap sin desplegar. */
export const revalidate = 3600;

const ESTATICAS: { ruta: string; prioridad: number; frecuencia: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { ruta: '/', prioridad: 1, frecuencia: 'daily' },
  { ruta: '/empresas', prioridad: 0.9, frecuencia: 'daily' },
  { ruta: '/para-clubes', prioridad: 0.7, frecuencia: 'monthly' },
  { ruta: '/que-ofrecemos', prioridad: 0.6, frecuencia: 'monthly' },
  { ruta: '/solicitar-acceso', prioridad: 0.5, frecuencia: 'monthly' },
  { ruta: '/novedades', prioridad: 0.4, frecuencia: 'weekly' },
  { ruta: '/soporte', prioridad: 0.4, frecuencia: 'monthly' },
  { ruta: '/terminos', prioridad: 0.2, frecuencia: 'yearly' },
  { ruta: '/privacidad', prioridad: 0.2, frecuencia: 'yearly' },
];

async function paginasDinamicas(): Promise<{ canchas: any[]; clubes: any[] }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seo/sitemap`, { next: { revalidate } });
    if (!res.ok) return { canchas: [], clubes: [] };
    const data = await res.json();
    return { canchas: data.canchas ?? [], clubes: data.clubes ?? [] };
  } catch {
    /* En el build la API puede no estar arriba todavía: se sirve lo estático y
       la próxima regeneración trae las canchas. */
    return { canchas: [], clubes: [] };
  }
}

const fecha = (v?: string | null) => (v ? new Date(v) : undefined);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { canchas, clubes } = await paginasDinamicas();
  return [
    ...ESTATICAS.map((p) => ({
      url: urlAbsoluta(p.ruta),
      changeFrequency: p.frecuencia,
      priority: p.prioridad,
    })),
    ...canchas.map((c) => ({
      url: urlAbsoluta(`/canchas/${c.id}`),
      lastModified: fecha(c.actualizado),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...clubes.map((c) => ({
      url: urlAbsoluta(`/club/${c.slug}`),
      lastModified: fecha(c.actualizado),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
