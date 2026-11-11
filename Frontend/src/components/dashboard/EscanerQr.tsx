'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import jsQR from 'jsqr';
import { toast } from 'sonner';
import { CalendarDays, CameraOff, CheckCircle2, Clock, Keyboard, MapPin, ScanLine, Trophy, User, UserX, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api/axios';
import { esManual, type Booking } from '@/types/booking.types';

const EASE = [0.22, 1, 0.36, 1] as const;

const hora12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

/** Lo que trae el QR: `https://reservatucancha.site/r/<código o id>`, o el código suelto. */
export function refDeQr(texto: string): string | null {
  const limpio = texto.trim();
  const enlace = limpio.match(/\/r\/([^/?#\s]+)/i);
  const ref = enlace ? decodeURIComponent(enlace[1]) : limpio.replace(/^#/, '');
  return /^[A-Za-z0-9]{6,24}$/.test(ref) ? ref : null;
}

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  confirmed:  { texto: 'Confirmada y pagada', clase: 'bg-green-100 text-green-700' },
  reagendada: { texto: 'Confirmada · horario cambiado', clase: 'bg-green-100 text-green-700' },
  completed:  { texto: 'Ya se jugó', clase: 'bg-blue-100 text-blue-700' },
  pending:    { texto: 'Pago pendiente', clase: 'bg-amber-100 text-amber-700' },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Las reservas del club: el QR se busca aquí, sin otra consulta. */
  bookings: Booking[];
}

/**
 * Escáner del QR que el jugador muestra al llegar. Lee con la cámara (o con
 * el código escrito a mano) y enseña de quién es la reserva y a qué hora,
 * para marcarla como jugada o como falta.
 */
export default function EscanerQr({ open, onOpenChange, bookings }: Props) {
  const reduce = useReducedMotion();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [camara, setCamara] = useState<'iniciando' | 'lista' | 'sin-permiso'>('iniciando');
  const [manual, setManual] = useState('');
  /** undefined: aún escaneando · null: QR leído pero no es de este club. */
  const [hallada, setHallada] = useState<Booking | null | undefined>(undefined);

  const apagar = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const buscar = useCallback((texto: string) => {
    const ref = refDeQr(texto);
    if (!ref) return false;
    const b = bookings.find((x) => x._id === ref || (x.bookingCode ?? '').toUpperCase() === ref.toUpperCase());
    setHallada(b ?? null);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(60);
    return true;
  }, [bookings]);

  /* Cámara: se enciende mientras el diálogo está abierto y sin resultado. */
  useEffect(() => {
    if (!open || hallada !== undefined) return;
    let vivo = true;
    setCamara('iniciando');

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!vivo) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setCamara('lista');

        const lienzo = document.createElement('canvas');
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        const leer = () => {
          if (!vivo || !ctx) return;
          if (video.readyState >= 2 && video.videoWidth) {
            /* Cuadro reducido: jsQR no necesita más y así no calienta el teléfono. */
            const escala = Math.min(1, 480 / video.videoWidth);
            lienzo.width = Math.round(video.videoWidth * escala);
            lienzo.height = Math.round(video.videoHeight * escala);
            ctx.drawImage(video, 0, 0, lienzo.width, lienzo.height);
            const img = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
            const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
            if (qr?.data && buscar(qr.data)) { apagar(); return; }
          }
          rafRef.current = requestAnimationFrame(leer);
        };
        rafRef.current = requestAnimationFrame(leer);
      } catch {
        if (vivo) setCamara('sin-permiso');
      }
    })();

    return () => { vivo = false; apagar(); };
  }, [open, hallada, buscar, apagar]);

  /* Al cerrar, todo vuelve a cero para el siguiente escaneo. */
  useEffect(() => {
    if (!open) { setHallada(undefined); setManual(''); }
  }, [open]);

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['owner-clientes'] });
    queryClient.invalidateQueries({ queryKey: ['owner-caja'] });
  };
  const completar = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/status`, { status: 'completed' }),
    onSuccess: () => { toast.success('Marcada como jugada'); refrescar(); onOpenChange(false); },
    onError: () => toast.error('No se pudo marcar la reserva'),
  });
  const noLlego = useMutation({
    mutationFn: (id: string) => api.patch(`/bookings/${id}/no-show`, { noShow: true }),
    onSuccess: () => { toast.success('Marcada: el cliente no llegó'); refrescar(); onOpenChange(false); },
    onError: () => toast.error('No se pudo guardar'),
  });

  const cancha = hallada && typeof hallada.courtId === 'object' ? (hallada.courtId as any)?.name : '';
  const estado = hallada ? ESTADOS[hallada.status] ?? ESTADOS.pending : null;
  const activa = hallada && (hallada.status === 'confirmed' || hallada.status === 'reagendada');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black text-gray-900">
            <ScanLine className="h-5 w-5 text-green-600" /> Escanear reserva
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait" initial={false}>
          {hallada === undefined ? (
            <motion.div key="camara"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }} className="space-y-4">
              <p className="text-xs text-gray-500 -mt-1">Pídele al jugador el QR de su reserva (está en su correo y en la app) y ponlo frente a la cámara.</p>

              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-900">
                <video ref={videoRef} playsInline muted className={`h-full w-full object-cover transition-opacity duration-300 ${camara === 'lista' ? 'opacity-100' : 'opacity-0'}`} />
                {camara === 'lista' && (
                  <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="relative h-[62%] w-[62%] rounded-3xl ring-2 ring-white/80 shadow-[0_0_0_999px_rgba(17,24,39,.45)]">
                      <span className="rtc-escaner-linea absolute inset-x-3 top-3 h-0.5 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,.9)]" />
                    </div>
                  </div>
                )}
                {camara === 'iniciando' && (
                  <div className="absolute inset-0 grid place-items-center">
                    <p className="animate-pulse text-xs font-semibold text-gray-400">Abriendo la cámara…</p>
                  </div>
                )}
                {camara === 'sin-permiso' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
                    <CameraOff className="h-8 w-8 text-gray-500" />
                    <p className="text-sm font-bold text-white">No pudimos usar la cámara</p>
                    <p className="text-xs text-gray-400">Dale permiso al navegador o escribe el código de la reserva aquí abajo.</p>
                  </div>
                )}
              </div>

              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!buscar(manual)) toast.error('Ese código no es válido'); else apagar(); }}>
                <div className="relative flex-1">
                  <Keyboard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={manual}
                    onChange={(e) => setManual(e.target.value.toUpperCase())}
                    placeholder="O escribe el código"
                    aria-label="Código de la reserva"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 font-mono text-sm font-bold uppercase tracking-widest text-gray-900 placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                  />
                </div>
                <button type="submit" disabled={manual.trim().length < 6}
                  className="rounded-xl bg-gray-900 px-4 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-40">
                  Buscar
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="resultado"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }} className="space-y-4">
              {hallada === null ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-red-50"><XCircle className="h-8 w-8 text-red-500" /></span>
                  <p className="mt-4 font-black text-gray-900">Esta reserva no es de tu club</p>
                  <p className="mt-1 max-w-xs text-sm text-gray-500">El código no coincide con ninguna reserva de tus canchas. Revisa que sea el QR correcto.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center pt-2 text-center">
                    <span className={`grid h-16 w-16 place-items-center rounded-full ${activa ? 'bg-green-50' : 'bg-gray-100'}`}>
                      <CheckCircle2 className={`h-8 w-8 check-in ${activa ? 'text-green-600' : 'text-gray-400'}`} />
                    </span>
                    <p className="mt-3 text-lg font-black text-gray-900">{hallada.guestName}</p>
                    <span className={`mt-1.5 rounded-full px-3 py-1 text-xs font-bold ${estado?.clase}`}>{estado?.texto}</span>
                    {hallada.noShow && <span className="mt-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">Marcada como falta</span>}
                  </div>
                  <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-green-600" />
                      <span className="first-letter:uppercase">{new Date(hallada.date as unknown as string).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</span></p>
                    <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-green-600" />{hora12(hallada.startTime)} – {hora12(hallada.endTime)}</p>
                    {cancha && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-600" />{cancha}</p>}
                    <p className="flex items-center gap-2"><User className="h-4 w-4 text-green-600" />{esManual(hallada) ? 'Se cobra en el club' : 'Pagada en línea'} · <span className="font-mono font-bold">#{hallada.bookingCode}</span></p>
                  </div>
                  {activa && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => noLlego.mutate(hallada._id)} disabled={noLlego.isPending || completar.isPending}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50">
                        <UserX className="h-4 w-4" /> No llegó
                      </button>
                      <button onClick={() => completar.mutate(hallada._id)} disabled={noLlego.isPending || completar.isPending}
                        className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50">
                        <Trophy className="h-4 w-4" /> Llegó, a jugar
                      </button>
                    </div>
                  )}
                </>
              )}
              <button onClick={() => { setHallada(undefined); setManual(''); }}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-400">
                Escanear otro
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
