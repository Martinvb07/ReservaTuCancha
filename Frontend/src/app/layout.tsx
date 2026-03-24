import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import Providers from '@/components/layout/Providers';
import ProgressBar from '@/components/layout/ProgressBar';
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'ReservaTuCancha — Fútbol, Pádel y Voley Playa',
    template: '%s | ReservaTuCancha',
  },
  description: 'Reserva canchas deportivas de fútbol, pádel y voley playa fácil y rápido. Sin registro requerido.',
  keywords: ['canchas', 'fútbol', 'pádel', 'voley playa', 'reservas deportivas', 'Colombia'],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'ReservaTuCancha',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <head>
        <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="ReservaTuCancha" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <ProgressBar />
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}