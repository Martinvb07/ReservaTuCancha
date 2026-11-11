'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowDownCircle, ArrowUpCircle, Banknote, CheckCircle2, Globe, Lock, LockOpen, Minus, Plus, Store, Trash2, TriangleAlert,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';

const EASE = [0.22, 1, 0.36, 1] as const;
const cop = (n: number) => `$${Math.round(n ?? 0).toLocaleString('es-CO')}`;
/* Todo en hora Colombia, sin importar dónde esté el navegador. */
const horaCol = (iso: string) =>
  new Date(iso)
    .toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s*a\.\s*m\./i, ' AM')
    .replace(/\s*p\.\s*m\./i, ' PM');
const fechaCol = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long' });
const hora12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const errorDe = (e: any, porDefecto: string) => {
  const msg = e?.response?.data?.message;
  return Array.isArray(msg) ? msg[0] : msg || porDefecto;
};
const MEDIO: Record<string, string> = { 'en línea': 'En línea', efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

interface Movimiento { _id: string; tipo: 'ingreso' | 'gasto'; concepto: string; valor: number; fecha: string; por?: string }
interface Turno { _id: string; abiertaEn: string; abiertaPor?: string; base: number; movimientos: Movimiento[] }
interface Resumen {
  base: number;
  reservas: { _id: string; inicio: string; fin: string; cancha: string; cliente: string; origen: 'club' | 'online'; medio: string; valor: number; noShow: boolean }[];
  efectivoReservas: number; otrosMedios: number; enLinea: number; ingresos: number; gastos: number;
  efectivoEsperado: number; totalTurno: number;
}

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl = 'block text-xs font-semibold text-gray-500 mb-1';

function CampoPlata({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">$</span>
      <input type="number" inputMode="numeric" min={0} step={1000} autoFocus={autoFocus} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} className={`${inp} pl-8 font-bold tabular-nums`} />
    </div>
  );
}

/**
 * El turno de caja: se abre con una base, junta lo que se cobra mientras está
 * abierto y se cierra contando el efectivo. Lo usa quien atiende, recepción
 * incluida; el cierre le llega al dueño por correo.
 */
export default function TurnoCaja() {
  const session = useApiAuth();
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const [base, setBase] = useState('');
  const [mov, setMov] = useState<{ tipo: 'ingreso' | 'gasto'; concepto: string; valor: string } | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [contado, setContado] = useState('');
  const [notas, setNotas] = useState('');

  const { data, isLoading } = useQuery<{ turno: Turno | null; resumen: Resumen | null }>({
    queryKey: ['caja-turno'],
    queryFn: async () => (await api.get('/bookings/owner/caja/turno')).data,
    enabled: !!(session as any)?.accessToken,
    refetchInterval: 60_000, // las reservas del turno van entrando solas
  });
  const turno = data?.turno ?? null;
  const r = data?.resumen ?? null;

  const guardar = (d: any) => queryClient.setQueryData(['caja-turno'], d);
  const abrir = useMutation({
    mutationFn: async () => (await api.post('/bookings/owner/caja/turno/abrir', { base: Number(base) || 0 })).data,
    onSuccess: (d) => { guardar(d); setBase(''); toast.success('Caja abierta'); },
    onError: (e) => toast.error(errorDe(e, 'No se pudo abrir la caja')),
  });
  const registrar = useMutation({
    mutationFn: async () => (await api.post('/bookings/owner/caja/turno/movimientos', {
      tipo: mov!.tipo, concepto: mov!.concepto.trim(), valor: Number(mov!.valor),
    })).data,
    onSuccess: (d) => { guardar(d); toast.success(mov?.tipo === 'gasto' ? 'Gasto registrado' : 'Ingreso registrado'); setMov(null); },
    onError: (e) => toast.error(errorDe(e, 'No se pudo registrar')),
  });
  const quitar = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/bookings/owner/caja/turno/movimientos/${id}`)).data,
    onSuccess: (d) => { guardar(d); toast.success('Movimiento quitado'); },
    onError: (e) => toast.error(errorDe(e, 'No se pudo quitar')),
  });
  const cerrar = useMutation({
    mutationFn: async () => (await api.post('/bookings/owner/caja/turno/cerrar', {
      efectivoContado: Number(contado) || 0, notas: notas.trim() || undefined,
    })).data,
    onSuccess: () => {
      guardar({ turno: null, resumen: null });
      queryClient.invalidateQueries({ queryKey: ['caja-cierres'] });
      setCerrando(false); setContado(''); setNotas('');
      toast.success('Caja cerrada: el cierre le llega al dueño por correo');
    },
    onError: (e) => toast.error(errorDe(e, 'No se pudo cerrar la caja')),
  });

  if (isLoading) return <Skeleton className="h-56 rounded-[28px]" />;

  /* ── Caja cerrada: abrir ── */
  if (!turno || !r) {
    return (
      <motion.section
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}
        className="rounded-[28px] border border-gray-100 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gray-100 text-gray-500"><Lock className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-black text-gray-900">La caja está cerrada</h2>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                Ábrela al empezar el turno con el efectivo que hay en el cajón. Desde ese momento se va sumando lo que
                cobres, y al cerrar cuentas la plata y le llega el resumen al dueño.
              </p>
            </div>
          </div>
          <form className="flex w-full flex-col gap-2 sm:flex-row md:w-auto" onSubmit={(e) => { e.preventDefault(); abrir.mutate(); }}>
            <div className="sm:w-44">
              <label className={lbl}>Base en efectivo</label>
              <CampoPlata value={base} onChange={setBase} placeholder="0" />
            </div>
            <button type="submit" disabled={abrir.isPending}
              className="flex items-center justify-center gap-2 self-end rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition-colors hover:bg-green-700 disabled:opacity-50">
              <LockOpen className="h-4 w-4" /> {abrir.isPending ? 'Abriendo…' : 'Abrir caja'}
            </button>
          </form>
        </div>
      </motion.section>
    );
  }

  /* ── Caja abierta ── */
  const diferencia = (Number(contado) || 0) - r.efectivoEsperado;
  const cuenta = [
    { label: 'Base inicial', valor: r.base, signo: '' },
    { label: 'Reservas en efectivo', valor: r.efectivoReservas, signo: '+' },
    ...(r.ingresos ? [{ label: 'Otros ingresos', valor: r.ingresos, signo: '+' }] : []),
    ...(r.gastos ? [{ label: 'Gastos', valor: r.gastos, signo: '−' }] : []),
  ];

  return (
    <motion.section
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}
      className="space-y-4">
      {/* Resumen */}
      <div className="relative overflow-hidden rounded-[28px] bg-gray-900 p-5 sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-lime-400">
              <span className="h-2 w-2 rounded-full bg-lime-400 rtc-live" /> Caja abierta
            </p>
            <p className="mt-2 text-4xl font-black text-white tabular-nums sm:text-5xl">{cop(r.efectivoEsperado)}</p>
            <p className="mt-1 text-sm text-gray-400">
              debe haber en el cajón · abierta a las {horaCol(turno.abiertaEn)}
              {turno.abiertaPor ? ` por ${turno.abiertaPor}` : ''}
            </p>
            <p className="text-xs text-gray-500 first-letter:uppercase">{fechaCol(turno.abiertaEn)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setMov({ tipo: 'ingreso', concepto: '', valor: '' })}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
              <Plus className="h-4 w-4 text-lime-400" /> Ingreso
            </button>
            <button onClick={() => setMov({ tipo: 'gasto', concepto: '', valor: '' })}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
              <Minus className="h-4 w-4 text-red-400" /> Gasto
            </button>
            <button onClick={() => setCerrando(true)}
              className="flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-black text-gray-900 transition-all duration-200 hover:scale-[1.03] hover:bg-lime-300 active:scale-95">
              <Lock className="h-4 w-4" /> Cerrar caja
            </button>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: Banknote, label: 'Base', valor: r.base },
            { icon: Store, label: 'Efectivo de reservas', valor: r.efectivoReservas },
            { icon: Store, label: 'Transferencia y tarjeta', valor: r.otrosMedios },
            { icon: Globe, label: 'Pagado en línea', valor: r.enLinea },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400"><c.icon className="h-3 w-3" /> {c.label}</p>
              <p className="mt-1 text-lg font-black text-white tabular-nums">{cop(c.valor)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Reservas del turno */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 lg:col-span-2">
          <h3 className="text-sm font-black text-gray-900">Reservas del turno</h3>
          <p className="text-xs text-gray-500">Las que se juegan con la caja abierta. Las del club las cobras tú; las de en línea ya están pagadas.</p>
          {r.reservas.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">Todavía no hay reservas en este turno.</p>
          ) : (
            <div className="mt-3 divide-y divide-gray-100">
              {r.reservas.map((x) => (
                <div key={x._id} className="flex items-center gap-3 py-2.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${x.origen === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    {x.origen === 'online' ? <Globe className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {x.cliente || 'Sin nombre'}
                      {x.noShow && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">No llegó</span>}
                    </p>
                    <p className="truncate text-xs text-gray-500">{hora12(x.inicio)} – {hora12(x.fin)} · {x.cancha} · {MEDIO[x.medio] ?? x.medio}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-black tabular-nums ${x.origen === 'club' && x.noShow ? 'text-gray-300 line-through' : 'text-green-700'}`}>{cop(x.valor)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ingresos y gastos */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h3 className="text-sm font-black text-gray-900">Ingresos y gastos</h3>
          <p className="text-xs text-gray-500">Lo que entra o sale del cajón aparte de las reservas.</p>
          {turno.movimientos.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">Sin movimientos.</p>
          ) : (
            <div className="mt-3 space-y-2">
              <AnimatePresence initial={false}>
                {turno.movimientos.map((m) => (
                  <motion.div key={m._id} layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="group flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5">
                    {m.tipo === 'gasto'
                      ? <ArrowUpCircle className="h-4 w-4 shrink-0 text-red-500" />
                      : <ArrowDownCircle className="h-4 w-4 shrink-0 text-green-600" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">{m.concepto}</p>
                      <p className="truncate text-[11px] text-gray-500">{horaCol(m.fecha)}{m.por ? ` · ${m.por}` : ''}</p>
                    </div>
                    <p className={`shrink-0 text-sm font-black tabular-nums ${m.tipo === 'gasto' ? 'text-red-600' : 'text-gray-900'}`}>
                      {m.tipo === 'gasto' ? '−' : '+'}{cop(m.valor)}
                    </p>
                    <button onClick={() => quitar.mutate(m._id)} aria-label={`Quitar ${m.concepto}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Ingreso o gasto */}
      <Dialog open={!!mov} onOpenChange={(v) => { if (!v) setMov(null); }}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-gray-900">{mov?.tipo === 'gasto' ? 'Registrar gasto' : 'Registrar ingreso'}</DialogTitle>
          </DialogHeader>
          {mov && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (mov.concepto.trim().length >= 2 && Number(mov.valor) > 0) registrar.mutate(); }}>
              <div>
                <label className={lbl}>Concepto</label>
                <input autoFocus className={inp} maxLength={120} value={mov.concepto}
                  placeholder={mov.tipo === 'gasto' ? 'Ej: Bolsas de hielo' : 'Ej: Venta de hidratación'}
                  onChange={(e) => setMov({ ...mov, concepto: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Valor en efectivo</label>
                <CampoPlata value={mov.valor} onChange={(v) => setMov({ ...mov, valor: v })} placeholder="0" />
              </div>
              <button type="submit" disabled={registrar.isPending || mov.concepto.trim().length < 2 || !(Number(mov.valor) > 0)}
                className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-colors disabled:opacity-40 ${mov.tipo === 'gasto' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {registrar.isPending ? 'Guardando…' : mov.tipo === 'gasto' ? 'Registrar gasto' : 'Registrar ingreso'}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Cierre */}
      <Dialog open={cerrando} onOpenChange={setCerrando}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black text-gray-900"><Lock className="h-5 w-5 text-green-600" /> Cerrar caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm">
              {cuenta.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-gray-600">
                  <span>{c.label}</span><span className="font-bold tabular-nums text-gray-900">{c.signo}{cop(c.valor)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 font-black text-gray-900">
                <span>Debe haber en el cajón</span><span className="tabular-nums">{cop(r.efectivoEsperado)}</span>
              </div>
            </div>

            <div>
              <label className={lbl}>¿Cuánto efectivo contaste?</label>
              <CampoPlata value={contado} onChange={setContado} placeholder={String(r.efectivoEsperado)} autoFocus />
            </div>

            <AnimatePresence initial={false}>
              {contado !== '' && (
                <motion.div key={diferencia === 0 ? 'ok' : diferencia > 0 ? 'sobra' : 'falta'}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold ${
                    diferencia === 0 ? 'bg-green-50 text-green-700' : diferencia > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'
                  }`}>
                  {diferencia === 0 ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <TriangleAlert className="h-4 w-4 shrink-0" />}
                  {diferencia === 0 ? 'La caja cuadra exacto' : diferencia > 0 ? `Sobran ${cop(diferencia)}` : `Faltan ${cop(-diferencia)}`}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className={lbl}>Nota <span className="font-normal">(opcional)</span></label>
              <textarea rows={2} maxLength={500} className={inp} style={{ resize: 'none' }} value={notas}
                placeholder={diferencia !== 0 && contado !== '' ? 'Explica la diferencia' : 'Algo que el dueño deba saber'}
                onChange={(e) => setNotas(e.target.value)} />
            </div>

            <button onClick={() => cerrar.mutate()} disabled={cerrar.isPending || contado === ''}
              className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-40">
              {cerrar.isPending ? 'Cerrando…' : 'Cerrar caja y enviar el cierre'}
            </button>
            <p className="text-center text-[11px] text-gray-500">Queda con la fecha y hora de Colombia, y el resumen le llega al dueño por correo.</p>
          </div>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
