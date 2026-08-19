// src/app/(public)/reservas/reprogramar/page.tsx
'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  addMinutes, format, getDay, isBefore, parse, startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDays, Clock, MapPin, Loader2, CheckCircle2, AlertCircle, ArrowRight, XCircle,
} from 'lucide-react';
import api from '@/lib/api/axios';

/** Horas antes del turno hasta las que se puede mover. Igual que el backend. */
const HORAS_LIMITE = 24;

interface Disponibilidad {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
}

const fmt12 = (t: string) => {
  try { return format(parse(t, 'HH:mm', new Date()), 'h:mm a'); } catch { return t; }
};

/** Divide el horario de atención de un día en turnos de la duración del club. */
function generarTurnos(openTime: string, closeTime: string, minutos: number): string[] {
  const turnos: string[] = [];
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime === '00:00' ? [24, 0] : closeTime.split(':').map(Number);

  const limite = new Date(2000, 0, 1, ch, cm);
  let actual = new Date(2000, 0, 1, oh, om);

  while (isBefore(addMinutes(actual, minutos), limite) || +addMinutes(actual, minutos) === +limite) {
    turnos.push(format(actual, 'HH:mm'));
    actual = addMinutes(actual, minutos);
  }
  return turnos;
}

/** Próximos días en los que el club atiende. */
function diasDisponibles(disponibilidad: Disponibilidad[], cuantos = 14): Date[] {
  const abiertos = disponibilidad.map((d) => d.dayOfWeek);
  const dias: Date[] = [];
  const hoy = startOfDay(new Date());

  for (let i = 0; i < 45 && dias.length < cuantos; i++) {
    const d = new Date(hoy.getTime() + i * 24 * 60 * 60 * 1000);
    if (abiertos.includes(getDay(d))) dias.push(d);
  }
  return dias;
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">{children}</div>
    </main>
  );
}

function ReprogramarContenido() {
  const params = useSearchParams();
  const token = params.get('token');

  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora]   = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const { data: reserva, isLoading, isError } = useQuery({
    queryKey: ['reserva-reprogramar', token],
    queryFn: async () => (await api.get(`/bookings/cancel-info?token=${token}`)).data,
    enabled: !!token,
    retry: false,
  });

  const cancha = reserva?.courtId ?? {};
  const disponibilidad: Disponibilidad[] = cancha.availability ?? [];

  /* La reserva conserva su duración: solo cambia cuándo se juega. */
  const duracionMin = useMemo(() => {
    if (!reserva) return 60;
    const min = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    return min(reserva.endTime) - min(reserva.startTime);
  }, [reserva]);

  const dias = useMemo(() => diasDisponibles(disponibilidad), [disponibilidad]);

  const reglaDelDia = fecha ? disponibilidad.find((d) => d.dayOfWeek === getDay(fecha)) : null;
  const turnos = reglaDelDia
    ? generarTurnos(reglaDelDia.openTime, reglaDelDia.closeTime, reglaDelDia.slotDurationMinutes)
    : [];

  const ymd = fecha ? format(fecha, 'yyyy-MM-dd') : '';

  const { data: ocupados = [] } = useQuery<{ startTime: string; endTime: string }[]>({
    queryKey: ['ocupados', cancha._id, ymd],
    queryFn: async () => (await api.get('/bookings/slots', { params: { courtId: cancha._id, date: ymd } })).data,
    enabled: !!fecha && !!cancha._id,
  });

  const { data: bloqueados = [] } = useQuery<{ startTime: string; endTime: string }[]>({
    queryKey: ['bloqueados', cancha._id, ymd],
    queryFn: async () => (await api.get(`/courts/${cancha._id}/blocked-slots`, { params: { date: ymd } })).data,
    enabled: !!fecha && !!cancha._id,
  });

  /** Un turno queda tomado si se cruza con una reserva o un bloqueo. */
  const expandir = (rangos: { startTime: string; endTime: string }[]) => {
    const fuera: string[] = [];
    rangos.forEach((r) => turnos.forEach((t) => { if (t >= r.startTime && t < r.endTime) fuera.push(t); }));
    return fuera;
  };

  const tomados = [...expandir(ocupados), ...expandir(bloqueados)];

  /* El turno actual de esta reserva sí se puede volver a elegir: no cuenta
     como ocupado contra sí misma. */
  const esSuPropioTurno = (t: string) =>
    ymd === format(new Date(reserva.date), 'yyyy-MM-dd') && t === reserva.startTime;

  const ahoraCO = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const hoyYMD = format(ahoraCO, 'yyyy-MM-dd');
  const minutosAhora = ahoraCO.getHours() * 60 + ahoraCO.getMinutes();

  const noDisponible = (t: string) => {
    if (esSuPropioTurno(t)) return false;
    if (tomados.includes(t)) return true;
    if (ymd < hoyYMD) return true;
    if (ymd === hoyYMD) {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m <= minutosAhora;
    }
    return false;
  };

  const horaFin = hora
    ? format(addMinutes(parse(hora, 'HH:mm', new Date()), duracionMin), 'HH:mm')
    : '';

  const mover = useMutation({
    mutationFn: async () =>
      (await api.post(`/bookings/reprogramar?token=${token}`, {
        date: ymd,
        startTime: hora,
        endTime: horaFin,
      })).data,
    onSuccess: () => setListo(true),
  });

  // ── Sin token ───────────────────────────────────────────────
  if (!token) {
    return (
      <Marco>
        <div className="bg-gray-800 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-black text-white uppercase">Link incompleto</h2>
          <p className="text-gray-400">Abre el enlace tal como llegó en tu correo de confirmación.</p>
        </div>
      </Marco>
    );
  }

  if (isLoading) {
    return (
      <Marco>
        <div className="bg-gray-800 rounded-3xl p-10 grid place-items-center">
          <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
        </div>
      </Marco>
    );
  }

  if (isError || !reserva) {
    return (
      <Marco>
        <div className="bg-gray-800 rounded-3xl p-8 text-center space-y-3">
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-2xl font-black text-white uppercase">No se puede cambiar</h2>
          <p className="text-gray-400">El link expiró o la reserva ya fue cancelada.</p>
          <Link href="/" className="inline-block text-green-400 font-semibold hover:underline pt-2">Ir al inicio</Link>
        </div>
      </Marco>
    );
  }

  // ── Ya quedó movida ─────────────────────────────────────────
  if (listo) {
    return (
      <Marco>
        <div className="bg-gray-800 rounded-3xl p-8 text-center space-y-4">
          <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto" />
          <h2 className="text-2xl font-black text-white uppercase">Horario cambiado</h2>
          <p className="text-gray-300">
            Tu reserva en <strong className="text-white">{cancha.name}</strong> quedó para el{' '}
            <strong className="text-white capitalize">
              {format(fecha!, "EEEE d 'de' MMMM", { locale: es })}
            </strong>{' '}
            a las <strong className="text-white">{fmt12(hora!)}</strong>.
          </p>
          <p className="text-gray-400 text-sm">Te acabamos de enviar la confirmación por correo.</p>
          <Link href="/" className="inline-block text-green-400 font-semibold hover:underline pt-2">Ir al inicio</Link>
        </div>
      </Marco>
    );
  }

  const horasRestantes =
    (new Date(`${format(new Date(reserva.date), 'yyyy-MM-dd')}T${reserva.startTime}`).getTime() - Date.now()) / 3600000;
  const fueraDePlazo = horasRestantes < HORAS_LIMITE;

  return (
    <Marco>
      <div className="bg-gray-800 rounded-3xl overflow-hidden">

        <div className="p-6 md:p-8 space-y-1 border-b border-gray-700">
          <p className="text-green-400 font-semibold text-xs uppercase tracking-widest">Reserva #{reserva.bookingCode}</p>
          <h1 className="text-2xl font-black text-white uppercase">Cambia tu horario</h1>
          <p className="text-gray-400 text-sm">
            Elige otro día y hora para el mismo turno. No se cobra nada extra ni se devuelve dinero.
          </p>
        </div>

        {/* Reserva actual */}
        <div className="p-6 md:p-8 space-y-2.5 border-b border-gray-700">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ahora tienes</p>
          <p className="text-white font-bold text-lg">{cancha.name}</p>
          <p className="flex items-center gap-2 text-gray-300 text-sm">
            <MapPin className="h-4 w-4 text-green-400 shrink-0" />
            {cancha.location?.address}{cancha.location?.city ? `, ${cancha.location.city}` : ''}
          </p>
          <p className="flex items-center gap-2 text-gray-300 text-sm capitalize">
            <CalendarDays className="h-4 w-4 text-green-400 shrink-0" />
            {format(new Date(reserva.date), "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <p className="flex items-center gap-2 text-gray-300 text-sm">
            <Clock className="h-4 w-4 text-green-400 shrink-0" />
            {fmt12(reserva.startTime)} – {fmt12(reserva.endTime)}
          </p>
        </div>

        {fueraDePlazo ? (
          <div className="p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-200 text-sm">
                Ya pasó el plazo: el horario solo se puede cambiar hasta {HORAS_LIMITE} horas antes del turno.
                Escríbenos a soporte y miramos qué se puede hacer.
              </p>
            </div>
            <Link href="/soporte"
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl transition-colors">
              Ir a soporte
            </Link>
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-6">

            {/* Día */}
            <div className="space-y-2.5">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Nuevo día</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {dias.map((d) => {
                  const activo = ymd === format(d, 'yyyy-MM-dd');
                  return (
                    <button key={d.toISOString()} type="button"
                      onClick={() => { setFecha(d); setHora(null); }}
                      className={`rounded-xl py-2.5 text-center transition-all border ${
                        activo ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-green-500'
                      }`}>
                      <span className="block text-[10px] uppercase font-bold opacity-70">
                        {format(d, 'EEE', { locale: es })}
                      </span>
                      <span className="block text-lg font-black leading-tight">{format(d, 'd')}</span>
                      <span className="block text-[10px] opacity-70">{format(d, 'MMM', { locale: es })}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hora */}
            {fecha && (
              <div className="space-y-2.5">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Nueva hora</p>
                {turnos.length === 0 ? (
                  <p className="text-gray-500 text-sm">El club no atiende ese día.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {turnos.map((t) => {
                      const ocupado = noDisponible(t);
                      const activo = hora === t;
                      return (
                        <button key={t} type="button" disabled={ocupado}
                          onClick={() => setHora(t)}
                          className={`rounded-xl py-2.5 text-sm font-bold transition-all border ${
                            activo
                              ? 'bg-green-600 border-green-500 text-white'
                              : ocupado
                                ? 'bg-gray-800 border-gray-700 text-gray-600 line-through cursor-not-allowed'
                                : 'bg-gray-700/50 border-gray-600 text-gray-200 hover:border-green-500'
                          }`}>
                          {fmt12(t)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {mover.isError && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">
                  {(mover.error as any)?.response?.data?.message || 'No se pudo cambiar el horario. Intenta con otro turno.'}
                </p>
              </div>
            )}

            <button type="button"
              onClick={() => mover.mutate()}
              disabled={!hora || mover.isPending}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-colors">
              {mover.isPending
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Cambiando…</>
                : <>Confirmar cambio <ArrowRight className="h-5 w-5" /></>}
            </button>

          </div>
        )}
      </div>
    </Marco>
  );
}

export default function ReprogramarPage() {
  return (
    <Suspense fallback={
      <Marco>
        <div className="bg-gray-800 rounded-3xl p-10 grid place-items-center">
          <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
        </div>
      </Marco>
    }>
      <ReprogramarContenido />
    </Suspense>
  );
}
