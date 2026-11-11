'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { format, isSameDay, isSameMonth, isToday, parseISO, subDays, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle, ArrowRight, ArrowUpRight, Ban, BarChart3, Building2, CalendarDays, Clock, Contact, Copy,
  ExternalLink, Globe, Link2, PhoneCall, Plus, ScanLine, Store, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';
import { netoDueno } from '@/lib/neto';
import { esManual, type Booking } from '@/types/booking.types';
import ReservaManualDialog from '@/components/dashboard/ReservaManualDialog';
import EscanerQr from '@/components/dashboard/EscanerQr';

const EASE = [0.22, 1, 0.36, 1] as const;

const to12h = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const copCorto = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${Math.round(n / 1_000)}K` : `$${n}`;
const fechaDe = (b: Booking) => { try { return parseISO(b.date as unknown as string); } catch { return new Date(NaN); } };
const cuenta = (b: Booking) => b.status !== 'pending';

interface Atajo {
  label: string;
  detalle: string;
  icon: typeof Plus;
  color: string;
  href?: string;
  onClick?: () => void;
  /** Quién no lo ve: el equipo entero, o solo recepción. */
  oculto?: boolean;
}

export default function OwnerHome({ nombre }: { nombre: string }) {
  const session = useApiAuth();
  const reduce = useReducedMotion();
  const token = (session as any)?.accessToken;
  const esStaff = !!(session as any)?.user?.esStaff;
  const esRecepcion = esStaff && (session as any)?.user?.rolEquipo === 'recepcion';
  const [anotar, setAnotar] = useState(false);
  const [escanear, setEscanear] = useState(false);

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['owner-bookings'],
    queryFn: async () => (await api.get('/bookings/owner')).data,
    enabled: !!token,
  });

  const { data: club } = useQuery<any>({
    queryKey: ['club-info'],
    queryFn: async () => {
      const { data } = await api.get('/clubs/my-club');
      if (data && !data.slug) {
        try { data.slug = (await api.get('/clubs/my-club/ensure-slug')).data.slug; } catch { /* sin slug todavía */ }
      }
      return data;
    },
    enabled: !!token,
    retry: 1,
  });

  const d = useMemo(() => {
    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const validas = bookings.filter(cuenta);
    const hoy = validas
      .filter((b) => isToday(fechaDe(b)))
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    const aMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const proximo = hoy.find((b) => aMin(b.endTime) > minutosAhora);
    const mes = validas.filter((b) => isSameMonth(fechaDe(b), ahora));
    const mesPasado = validas.filter((b) => isSameMonth(fechaDe(b), subMonths(ahora, 1)));
    const suma = (l: Booking[]) => l.reduce((s, b) => s + netoDueno(b), 0);
    const ingresoMes = suma(mes);
    const ingresoMesPasado = suma(mesPasado);
    const semana = Array.from({ length: 7 }, (_, i) => {
      const dia = subDays(ahora, 6 - i);
      const delDia = validas.filter((b) => isSameDay(fechaDe(b), dia));
      return { dia: format(dia, 'EEE', { locale: es }), reservas: delDia.length, ingresos: suma(delDia), hoy: isToday(dia) };
    });
    return {
      hoy,
      proximo,
      ingresoHoy: suma(hoy),
      enClubHoy: suma(hoy.filter((b) => esManual(b))),
      ingresoMes,
      reservasMes: mes.length,
      variacion: ingresoMesPasado > 0 ? Math.round(((ingresoMes - ingresoMesPasado) / ingresoMesPasado) * 100) : null,
      semana,
      esperandoPago: bookings.filter((b) => b.status === 'pending').length,
      yaPaso: (b: Booking) => aMin(b.endTime) <= minutosAhora,
      enCurso: (b: Booking) => aMin(b.startTime) <= minutosAhora && aMin(b.endTime) > minutosAhora,
    };
  }, [bookings]);

  const urlPublica = club?.slug ? `https://reservatucancha.site/club/${club.slug}` : '';

  const ATAJOS: Atajo[] = ([
    { label: 'Anotar reserva', detalle: 'Teléfono o mostrador', icon: PhoneCall,    color: 'bg-lime-400 text-gray-900', onClick: () => setAnotar(true) },
    { label: 'Escanear QR',    detalle: 'Recibe al jugador',    icon: ScanLine,     color: 'bg-gray-900 text-lime-400', onClick: () => setEscanear(true) },
    { label: 'Reservas',       detalle: 'Agenda y calendario',  icon: CalendarDays, color: 'bg-blue-50 text-blue-600',   href: '/dashboard/propetario/reservas' },
    { label: 'Caja',           detalle: 'Cierre y Excel',       icon: Wallet,       color: 'bg-green-50 text-green-600', href: '/dashboard/propetario/caja', oculto: esStaff },
    { label: 'Clientes',       detalle: 'Frecuentes y faltas',  icon: Contact,      color: 'bg-amber-50 text-amber-600', href: '/dashboard/propetario/clientes', oculto: esStaff },
    { label: 'Bloquear horario', detalle: 'Mantenimiento, torneos', icon: Ban,      color: 'bg-orange-50 text-orange-600', href: '/dashboard/propetario/bloqueos' },
    { label: 'Canchas y precios', detalle: 'Precios por horario', icon: Building2,  color: 'bg-purple-50 text-purple-600', href: '/dashboard/propetario/canchas', oculto: esRecepcion },
    { label: 'Estadísticas',   detalle: 'Ocupación e ingresos', icon: BarChart3,    color: 'bg-indigo-50 text-indigo-600', href: '/dashboard/propetario/analytics', oculto: esRecepcion },
  ] as Atajo[]).filter((a) => !a.oculto);

  const entra = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.06, ease: EASE },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* ── Saludo ── */}
      <motion.div {...entra(0)} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lime-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-1">
            {esRecepcion ? 'Recepción' : esStaff ? 'Equipo del club' : 'Panel Propietario'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Hola, {nombre}</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            <span className="inline-block first-letter:uppercase">{format(new Date(), "EEEE d 'de' MMMM", { locale: es })}</span>
            {club?.name ? <span> · {club.name}</span> : null}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEscanear(true)}
            className="flex flex-1 items-center justify-center gap-2 border border-gray-200 bg-white hover:border-gray-400 text-gray-800 font-bold text-sm px-5 py-3 rounded-xl transition-colors sm:flex-none">
            <ScanLine className="h-4 w-4" /> Escanear QR
          </button>
          <button onClick={() => setAnotar(true)}
            className="flex flex-1 items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-lg shadow-green-600/20 sm:flex-none">
            <PhoneCall className="h-4 w-4" /> Anotar reserva
          </button>
        </div>
      </motion.div>

      {/* ── Falta la cuenta de ePayco: sin ella no hay a dónde consignar ── */}
      {!esStaff && club && !club.epaycoReceptorId && (
        <motion.div {...entra(1)}>
          <Link href="/dashboard/propetario/pagos" className="group flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors duration-200 hover:border-amber-300 hover:bg-amber-100 sm:p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500"><AlertCircle className="h-5 w-5 text-white" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-amber-900">Conecta tu cuenta de ePayco</span>
              <span className="block text-xs leading-snug text-amber-700">Sin ella tus canchas no pueden recibir reservas pagadas en línea.</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-amber-700 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      )}

      {/* ── Hoy ── */}
      <motion.section {...entra(1)} className="relative overflow-hidden rounded-[28px] bg-gray-900 p-5 sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-lime-400">
              <span className="h-2 w-2 rounded-full bg-lime-400 rtc-live" /> Hoy
            </p>
            {isLoading ? (
              <div className="mt-3 h-12 w-48 animate-pulse rounded-xl bg-white/10" />
            ) : esRecepcion ? (
              <p className="mt-2 text-4xl font-black text-white tabular-nums sm:text-5xl">
                {d.hoy.length} <span className="text-lg font-bold text-gray-400">{d.hoy.length === 1 ? 'reserva' : 'reservas'}</span>
              </p>
            ) : (
              <>
                <p className="mt-2 text-4xl font-black text-white tabular-nums sm:text-5xl">{cop(d.ingresoHoy)}</p>
                <p className="mt-1 text-sm text-gray-400">
                  te entra hoy en {d.hoy.length} {d.hoy.length === 1 ? 'reserva' : 'reservas'}
                  {d.enClubHoy > 0 && <> · {cop(d.enClubHoy)} en el club</>}
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Próximo turno</p>
              {d.proximo ? (
                <>
                  <p className="mt-1 text-lg font-black text-white">{to12h(d.proximo.startTime)}</p>
                  <p className="truncate text-xs text-gray-400">{d.proximo.guestName}</p>
                </>
              ) : (
                <p className="mt-1 text-sm font-bold text-gray-500">{d.hoy.length ? 'Ya no quedan hoy' : 'Sin turnos hoy'}</p>
              )}
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{esRecepcion ? 'Este mes' : 'Va del mes'}</p>
              <p className="mt-1 text-lg font-black text-white tabular-nums">
                {esRecepcion ? `${d.reservasMes} reservas` : copCorto(d.ingresoMes)}
              </p>
              {!esRecepcion && (
                d.variacion === null ? (
                  <p className="text-xs text-gray-400">{d.reservasMes} {d.reservasMes === 1 ? 'reserva' : 'reservas'}</p>
                ) : (
                  <p className={`flex items-center gap-1 text-xs font-bold ${d.variacion >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
                    {d.variacion >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {d.variacion >= 0 ? '+' : ''}{d.variacion}% vs. mes pasado
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Atajos ── */}
      <motion.section {...entra(2)}>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Atajos</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ATAJOS.map((a) => {
            const contenido = (
              <>
                <span className={`grid h-10 w-10 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${a.color}`}>
                  <a.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="mt-3 flex items-center gap-1 text-sm font-black text-gray-900">
                  {a.label}
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-green-600" />
                </span>
                <span className="block text-xs text-gray-500">{a.detalle}</span>
              </>
            );
            const clases = 'group block w-full rounded-2xl border border-gray-100 bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-900/5';
            return a.href
              ? <Link key={a.label} href={a.href} className={clases}>{contenido}</Link>
              : <button key={a.label} type="button" onClick={a.onClick} className={clases}>{contenido}</button>;
          })}
        </div>
      </motion.section>

      {/* ── Agenda de hoy + semana ── */}
      <div className={`grid grid-cols-1 gap-5 ${esRecepcion ? '' : 'xl:grid-cols-3'}`}>
        <motion.section {...entra(3)} className={`rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 ${esRecepcion ? '' : 'xl:col-span-2'}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900">Agenda de hoy</h2>
              <p className="text-xs text-gray-500">
                {isLoading ? 'Cargando…' : d.hoy.length ? `${d.hoy.length} ${d.hoy.length === 1 ? 'turno' : 'turnos'}` : 'Sin turnos'}
                {d.esperandoPago > 0 && <span className="text-amber-600"> · {d.esperandoPago} esperando pago</span>}
              </p>
            </div>
            <Link href="/dashboard/propetario/reservas" className="flex items-center gap-1 text-xs font-bold text-green-700 transition-colors hover:text-green-800">
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-50" />)}</div>
          ) : d.hoy.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-green-50"><CalendarDays className="h-6 w-6 text-green-600" /></span>
              <p className="mt-3 text-sm font-black text-gray-700">Hoy no hay reservas todavía</p>
              <p className="mt-1 max-w-xs text-xs text-gray-500">Comparte tu página o anota las que te lleguen por teléfono.</p>
              <button onClick={() => setAnotar(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-bold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95">
                <Plus className="h-3.5 w-3.5" /> Anotar reserva
              </button>
            </div>
          ) : (
            <ol className="relative space-y-2">
              {d.hoy.map((b) => {
                const cancha = typeof b.courtId === 'object' ? (b.courtId as any)?.name : '';
                const enCurso = d.enCurso(b);
                const paso = d.yaPaso(b);
                return (
                  <li key={b._id}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-200 ${
                      enCurso ? 'border-green-300 bg-green-50' : paso ? 'border-gray-100 bg-gray-50/60 opacity-70' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}>
                    <div className="w-[4.5rem] shrink-0">
                      <p className={`text-sm font-black tabular-nums ${enCurso ? 'text-green-700' : 'text-gray-900'}`}>{to12h(b.startTime)}</p>
                      <p className="text-[11px] text-gray-500 tabular-nums">{to12h(b.endTime)}</p>
                    </div>
                    <span className={`h-9 w-1 shrink-0 rounded-full ${enCurso ? 'bg-green-500' : esManual(b) ? 'bg-amber-300' : 'bg-blue-300'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-bold text-gray-900">
                        <span className="truncate">{b.guestName}</span>
                        {enCurso && <span className="shrink-0 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">En juego</span>}
                        {b.noShow && <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">No llegó</span>}
                      </p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-gray-500">
                        {esManual(b) ? <Store className="h-3 w-3 shrink-0" /> : <Globe className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{cancha}{cancha ? ' · ' : ''}{esManual(b) ? 'Se cobra en el club' : 'Pagada en línea'}</span>
                      </p>
                    </div>
                    {!esRecepcion && <p className="shrink-0 text-sm font-black text-green-700 tabular-nums">{cop(netoDueno(b))}</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </motion.section>

        {!esRecepcion && (
          <motion.section {...entra(4)} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
            <h2 className="text-sm font-black text-gray-900">Últimos 7 días</h2>
            <p className="text-xs text-gray-500">
              {d.semana.reduce((s, x) => s + x.reservas, 0)} reservas ·{' '}
              <span className="font-semibold text-green-700">{cop(d.semana.reduce((s, x) => s + x.ingresos, 0))}</span>
            </p>
            {isLoading ? (
              <div className="mt-4 h-44 animate-pulse rounded-xl bg-gray-50" />
            ) : (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={176}>
                  <BarChart data={d.semana} margin={{ top: 4, right: 0, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => copCorto(Number(v))} />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}
                      formatter={(v: any, _n: any, p: any) => [`${cop(Number(v))} · ${p?.payload?.reservas ?? 0} reservas`, 'Te entró']}
                    />
                    <Bar dataKey="ingresos" radius={[6, 6, 0, 0]} maxBarSize={36}>
                      {d.semana.map((x, i) => <Cell key={i} fill={x.hoy ? '#16a34a' : '#bbf7d0'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <Link href="/dashboard/propetario/analytics" className="mt-3 flex items-center gap-1 border-t border-gray-50 pt-3 text-xs font-bold text-green-700 transition-colors hover:text-green-800">
              Ver estadísticas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.section>
        )}
      </div>

      {/* ── Página pública ── */}
      {urlPublica && (
        <motion.section {...entra(5)} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-400"><Link2 className="h-5 w-5 text-gray-900" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-gray-900">Tu página para recibir reservas</p>
            <p className="truncate text-xs text-gray-500">{urlPublica.replace('https://', '')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { navigator.clipboard.writeText(urlPublica); toast.success('Link copiado: pégalo en tu Instagram o WhatsApp'); }}
              className="flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95">
              <Copy className="h-3.5 w-3.5" /> Copiar link
            </button>
            <Link href={`/club/${club.slug}`} target="_blank"
              className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-gray-400">
              <ExternalLink className="h-3.5 w-3.5" /> Ver
            </Link>
          </div>
        </motion.section>
      )}

      <ReservaManualDialog open={anotar} onOpenChange={setAnotar} />
      <EscanerQr open={escanear} onOpenChange={setEscanear} bookings={bookings} />
    </div>
  );
}
