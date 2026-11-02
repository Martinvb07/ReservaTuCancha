import { NextResponse } from 'next/server';

/**
 * Universal Links de iOS: le dice al iPhone que la app de ReservaTuCancha
 * puede abrir estos enlaces del sitio sin pasar por Safari. Es el gemelo de
 * assetlinks.json (Android) y cubre las mismas rutas.
 *
 * El App ID es "<Team ID>.<bundle id>". El Team ID sale de Apple Developer
 * (Membership) y va en APPLE_TEAM_ID. Sin la variable se responde 404 y los
 * enlaces siguen abriendo la web, que es lo seguro.
 */
const BUNDLE_ID = 'site.reservatucancha.reservatucancha';

/* Las mismas rutas del intent-filter de AndroidManifest.xml. */
const RUTAS = [
  { '/': '/canchas/*' },
  { '/': '/empresas' },
  { '/': '/mis-reservas' },
  { '/': '/dashboard*' },
  { '/': '/reservas/reprogramar' },
  { '/': '/resena' },
  { '/': '/auth/restablecer' },
];

export function GET() {
  const team = (process.env.APPLE_TEAM_ID ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(team)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const appId = `${team}.${BUNDLE_ID}`;
  return NextResponse.json(
    { applinks: { details: [{ appIDs: [appId], components: RUTAS }] } },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}
