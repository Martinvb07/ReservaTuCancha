import { NextResponse } from 'next/server';

/**
 * Digital Asset Links: le dice a Android que la app de ReservaTuCancha puede
 * abrir los enlaces de este dominio (los de los correos, los compartidos por
 * WhatsApp) sin pasar por el navegador.
 *
 * Las huellas SHA-256 salen de la llave con la que se firma la app y van en
 * ANDROID_APP_SHA256, separadas por coma si hay más de una (la de subida y la
 * de Play App Signing). Sin la variable se responde una lista vacía y los
 * enlaces siguen abriendo la web, que es lo seguro.
 */
const PAQUETE = 'site.reservatucancha.reservatucancha';

export function GET() {
  const huellas = (process.env.ANDROID_APP_SHA256 ?? '')
    .split(',')
    .map((h) => h.trim().toUpperCase())
    .filter((h) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(h));

  const cuerpo = huellas.length
    ? [{
        relation: ['delegate_permission/common.handle_all_urls'],
        target: { namespace: 'android_app', package_name: PAQUETE, sha256_cert_fingerprints: huellas },
      }]
    : [];

  return NextResponse.json(cuerpo, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
