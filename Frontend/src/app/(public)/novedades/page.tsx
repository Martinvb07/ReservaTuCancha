import type { Metadata } from 'next';
import NovedadesPageClient from './page.client';

export const metadata: Metadata = {
  title: 'Novedades y versiones',
  description: 'Historial de cambios de ReservaTuCancha: nuevas funciones, mejoras y correcciones publicadas en la plataforma.',
  openGraph: {
    title: 'Novedades y versiones | ReservaTuCancha',
    description: 'Cada mejora, corrección y función nueva que sale a producción, en orden.',
    type: 'website',
    locale: 'es_CO',
  },
};

export default function NovedadesPage() {
  return <NovedadesPageClient />;
}
