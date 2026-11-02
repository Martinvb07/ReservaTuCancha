import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock, CalendarDays, MapPin, XCircle, Smartphone } from 'lucide-react';

/**
 * A donde lleva el QR de una reserva (https://reservatucancha.site/r/<código o id>).
 *
 * Con la cámara del teléfono, cualquiera ve si la reserva existe y su estado,
 * sin datos personales del jugador. El club la marca como jugada escaneando
 * el mismo QR desde el panel de la app.
 */

export const metadata: Metadata = { title: 'Reserva', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const API = process.env.NEXT_PUBLIC_API_URL;

async function buscar(ref: string) {
  try {
    if (/^[0-9a-f]{24}$/i.test(ref)) {
      const res = await fetch(`${API}/bookings/${ref}`, { cache: 'no-store' });
      return res.ok ? res.json() : null;
    }
    const res = await fetch(`${API}/bookings/public?code=${encodeURIComponent(ref)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const lista = await res.json();
    return Array.isArray(lista) && lista.length ? lista[0] : null;
  } catch {
    return null;
  }
}

const ESTADOS: Record<string, { texto: string; color: string; ok: boolean }> = {
  confirmed:  { texto: 'Confirmada y pagada', color: 'bg-lime-400 text-gray-900', ok: true },
  reagendada: { texto: 'Confirmada · horario cambiado', color: 'bg-lime-400 text-gray-900', ok: true },
  completed:  { texto: 'Ya se jugó', color: 'bg-white/15 text-white', ok: true },
  pending:    { texto: 'Pago pendiente', color: 'bg-amber-400 text-gray-900', ok: false },
};

const hora12 = (hhmm?: string) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number);
  if (Number.isNaN(h)) return hhmm ?? '';
  return `${h % 12 || 12}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export default async function ReservaQrPage({ params }: { params: { ref: string } }) {
  const b = await buscar(params.ref);
  const estado = b ? ESTADOS[b.status] ?? ESTADOS.pending : null;
  const cancha = b?.courtId && typeof b.courtId === 'object' ? b.courtId : null;
  const fecha = b?.date
    ? new Date(b.date).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })
    : '';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-5 text-center">
        {!b ? (
          <>
            <div className="w-20 h-20 rounded-full bg-white/10 grid place-items-center mx-auto">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-black text-white">No encontramos esta reserva</h1>
            <p className="text-gray-400 text-sm">El código no existe o la reserva se canceló porque no se pagó.</p>
          </>
        ) : (
          <>
            <div className={`w-20 h-20 rounded-full grid place-items-center mx-auto ${estado!.ok ? 'bg-lime-400' : 'bg-amber-400'}`}>
              {estado!.ok ? <CheckCircle2 className="h-10 w-10 text-gray-900" /> : <Clock className="h-10 w-10 text-gray-900" />}
            </div>
            <div className="space-y-2">
              <p className="text-lime-400 font-semibold text-xs uppercase tracking-widest">Reserva verificada</p>
              <h1 className="text-3xl font-black text-white">{cancha?.name ?? 'Cancha'}</h1>
              <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${estado!.color}`}>{estado!.texto}</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-3">
              <p className="flex items-center gap-3 text-sm text-gray-200 capitalize">
                <CalendarDays className="h-4 w-4 text-lime-400 shrink-0" /> {fecha}
              </p>
              <p className="flex items-center gap-3 text-sm text-gray-200">
                <Clock className="h-4 w-4 text-lime-400 shrink-0" /> {hora12(b.startTime)} – {hora12(b.endTime)}
              </p>
              {cancha?.location?.city && (
                <p className="flex items-center gap-3 text-sm text-gray-200">
                  <MapPin className="h-4 w-4 text-lime-400 shrink-0" /> {[cancha.location.address, cancha.location.city].filter(Boolean).join(', ')}
                </p>
              )}
              {b.bookingCode && (
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Código</span>
                  <span className="text-lime-400 font-black tracking-widest">#{b.bookingCode}</span>
                </div>
              )}
            </div>

            <p className="flex items-start gap-2 text-left text-xs text-gray-400 bg-white/5 rounded-xl p-3">
              <Smartphone className="h-4 w-4 shrink-0 mt-0.5 text-gray-300" />
              ¿Eres del club? Escanea este QR desde el panel de la app (Escanear QR) para marcar la reserva como jugada.
            </p>
          </>
        )}
        <Link href="/" className="inline-block text-sm font-semibold text-gray-300 hover:text-white">
          Ir a ReservaTuCancha
        </Link>
      </div>
    </div>
  );
}
