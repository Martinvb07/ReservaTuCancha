'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Banknote, ChevronLeft, ChevronRight, CreditCard, Download, Globe, Loader2, Plus, ReceiptText, Store, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PillTabs from '@/components/ui/PillTabs';
import ReservaManualDialog from '@/components/dashboard/ReservaManualDialog';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';
import { exportarCaja, nombreMedio, type Caja } from '@/lib/exportarCaja';

const EASE = [0.22, 1, 0.36, 1] as const;
const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const deYmd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const hora12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const TABS = ['Día', 'Mes'];

export default function CajaPage() {
  const session = useApiAuth();
  const reduce = useReducedMotion();
  const esStaff = !!(session as any)?.user?.esStaff;
  const [modo, setModo] = useState('Día');
  /* Fecha de referencia: el día elegido, o cualquier día del mes elegido. */
  const [ref, setRef] = useState(() => new Date());
  const [anotar, setAnotar] = useState(false);
  const [bajando, setBajando] = useState(false);

  const { desde, hasta } = useMemo(() => {
    if (modo === 'Día') return { desde: ymd(ref), hasta: ymd(ref) };
    return {
      desde: ymd(new Date(ref.getFullYear(), ref.getMonth(), 1)),
      hasta: ymd(new Date(ref.getFullYear(), ref.getMonth() + 1, 0)),
    };
  }, [modo, ref]);

  const mover = (dir: 1 | -1) =>
    setRef((d) => (modo === 'Día'
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + dir)
      : new Date(d.getFullYear(), d.getMonth() + dir, 1)));

  const { data: caja, isLoading, isFetching } = useQuery<Caja>({
    queryKey: ['owner-caja', desde, hasta],
    queryFn: async () => (await api.get('/bookings/owner/caja', { params: { desde, hasta } })).data,
    enabled: !!(session as any)?.accessToken && !esStaff,
    placeholderData: (previa) => previa,
  });

  const { data: club } = useQuery<{ name?: string }>({
    queryKey: ['mi-club-nombre'],
    queryFn: async () => (await api.get('/clubs/my-club')).data,
    enabled: !!(session as any)?.accessToken && !esStaff,
    retry: false,
  });

  const etiqueta = modo === 'Día'
    ? ref.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    : ref.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const esHoy = modo === 'Día' && ymd(ref) === ymd(new Date());

  const descargar = async () => {
    if (!caja) return;
    setBajando(true);
    try {
      await exportarCaja(caja, club?.name ? `Caja ${club.name}` : 'Caja');
      toast.success('Excel descargado');
    } catch {
      toast.error('No se pudo generar el Excel');
    } finally {
      setBajando(false);
    }
  };

  /* En la vista de mes los movimientos van agrupados por día. */
  const porDia = useMemo(() => {
    const grupos = new Map<string, Caja['movimientos']>();
    for (const m of caja?.movimientos ?? []) grupos.set(m.fecha, [...(grupos.get(m.fecha) ?? []), m]);
    return Array.from(grupos.entries());
  }, [caja]);

  if (esStaff) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <Wallet className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="font-black text-gray-500 text-sm">Solo el dueño del club ve la caja</p>
      </div>
    );
  }

  const t = caja?.totales;
  const TARJETAS = [
    { icon: Wallet, label: 'Total del periodo',  valor: cop(t?.total ?? 0),   color: 'bg-green-50 text-green-600', fuerte: true },
    { icon: Globe,  label: 'Pagado en línea',    valor: cop(t?.enLinea ?? 0), color: 'bg-blue-50 text-blue-600' },
    { icon: Store,  label: 'Cobrado en el club', valor: cop(t?.enClub ?? 0),  color: 'bg-amber-50 text-amber-600' },
    { icon: ReceiptText, label: 'Reservas',      valor: String(t?.reservas ?? 0), color: 'bg-gray-100 text-gray-600' },
  ];
  const mediosClub = Object.entries(t?.porMedio ?? {}).filter(([m]) => m !== 'en línea');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lime-600 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-1">Panel Propietario</p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Caja</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-xl">
            Lo que te entró: lo pagado en línea, ya con los costos descontados, y lo que cobraste en el club.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAnotar(true)}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:border-gray-400 text-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="h-4 w-4" /> Anotar cobro
          </button>
          <button onClick={descargar} disabled={!caja || caja.movimientos.length === 0 || bajando}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-600/20">
            {bajando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Excel
          </button>
        </div>
      </div>

      {/* Periodo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl border border-gray-100 p-3">
        <PillTabs id="caja-modo" tabs={TABS} active={modo} onChange={setModo} className="!justify-start" />
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button onClick={() => mover(-1)} aria-label="Anterior"
            className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[11rem] text-center">
            <p className="text-sm font-black text-gray-900 first-letter:uppercase">{etiqueta}</p>
            {modo === 'Día' && (
              <input
                type="date"
                aria-label="Elegir fecha"
                value={ymd(ref)}
                onChange={(e) => e.target.value && setRef(deYmd(e.target.value))}
                className="mt-0.5 bg-transparent text-center text-[11px] font-semibold text-gray-500 focus:outline-none"
              />
            )}
          </div>
          <button onClick={() => mover(1)} aria-label="Siguiente"
            className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50">
            <ChevronRight className="h-4 w-4" />
          </button>
          {!esHoy && (
            <button onClick={() => { setModo('Día'); setRef(new Date()); }}
              className="rounded-full bg-gray-900 px-3.5 py-2 text-xs font-bold text-white transition-transform duration-200 hover:scale-[1.03] active:scale-95">
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Totales */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 transition-opacity duration-200 ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
        {TARJETAS.map((c, i) => (
          <motion.div
            key={c.label}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: EASE }}
            className={`rounded-2xl border p-4 ${c.fuerte ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-100'}`}
          >
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${c.fuerte ? 'bg-lime-400 text-gray-900' : c.color}`}><c.icon className="h-4 w-4" /></span>
            <p className={`mt-3 text-[11px] font-bold uppercase tracking-widest ${c.fuerte ? 'text-gray-400' : 'text-gray-500'}`}>{c.label}</p>
            {isLoading
              ? <Skeleton className="mt-1 h-7 w-24 rounded-lg" />
              : <p className={`text-xl sm:text-2xl font-black tabular-nums ${c.fuerte ? 'text-white' : 'text-gray-900'}`}>{c.valor}</p>}
          </motion.div>
        ))}
      </div>

      {mediosClub.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mediosClub.map(([medio, valor]) => (
            <span key={medio} className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600">
              {medio === 'efectivo' ? <Banknote className="h-3.5 w-3.5 text-green-600" /> : <CreditCard className="h-3.5 w-3.5 text-blue-600" />}
              {nombreMedio(medio)} <strong className="text-gray-900 tabular-nums">{cop(valor)}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Movimientos */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : !caja || caja.movimientos.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <ReceiptText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-black text-gray-500 text-xs">No hubo movimientos en este periodo</p>
          <p className="mt-1 text-xs text-gray-500">Lo que cobres en el club lo anotas con “Anotar cobro”.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${desde}-${hasta}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="space-y-5"
          >
            {porDia.map(([dia, movimientos]) => (
              <div key={dia}>
                {modo === 'Mes' && (
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-xs font-black tracking-widest text-gray-500 first-letter:uppercase">
                      {deYmd(dia).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs font-black text-gray-700 tabular-nums">{cop(movimientos.reduce((a, m) => a + m.ingreso, 0))}</p>
                  </div>
                )}
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100">
                  {movimientos.map((m) => (
                    <div key={m._id} className="flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-gray-50">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${m.origen === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {m.origen === 'online' ? <Globe className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {m.cliente || 'Sin nombre'}
                          {m.noShow && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">No llegó</span>}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {hora12(m.inicio)} – {hora12(m.fin)} · {m.cancha} · {nombreMedio(m.medio)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-green-700 tabular-nums">{cop(m.ingreso)}</p>
                        {m.descuentos > 0 && <p className="text-[11px] text-gray-500 tabular-nums">de {cop(m.precio)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <ReservaManualDialog open={anotar} onOpenChange={setAnotar} />
    </div>
  );
}
