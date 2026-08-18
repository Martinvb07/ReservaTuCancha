'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Banknote, CheckCircle, Loader2, Landmark, AlertCircle, Copy, Undo2, ChevronDown,
} from 'lucide-react';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';

interface Periodo {
  inicio: string;
  fin: string;
  giro: string;
  etiqueta: string;
  enCurso: boolean;
  tieneGiros: boolean;
}

interface Banco {
  titular?: string;
  documento?: string;
  banco?: string;
  tipoCuenta?: string;
  numero?: string;
}

interface FilaClub {
  ownerId: string;
  clubNombre: string;
  reservas: number;
  bruto: number;
  comision: number;
  neto: number;
  estado: 'pendiente' | 'girada';
  giradaAt?: string;
  referencia?: string;
  banco?: Banco;
}

interface Resumen {
  periodo: { inicio: string; fin: string; giro: string; etiqueta: string; enCurso: boolean };
  comisionPorcentaje: number;
  clubes: FilaClub[];
  totales: { clubes: number; reservas: number; bruto: number; comision: number; neto: number; pendiente: number };
}

const cop = (n: number) => `$${(n ?? 0).toLocaleString('es-CO')}`;

export default function AdminLiquidacionPage() {
  useApiAuth();
  const queryClient = useQueryClient();

  /** Semana seleccionada. Vacío = la que toca girar (la última cerrada). */
  const [inicio, setInicio] = useState('');
  /** Club cuya fila está expandida, para ver la cuenta y registrar el giro. */
  const [abierto, setAbierto] = useState<string | null>(null);
  const [referencia, setReferencia] = useState('');

  const { data: periodos } = useQuery<Periodo[]>({
    queryKey: ['liquidacion-periodos'],
    queryFn: async () => (await api.get('/liquidaciones/periodos')).data,
  });

  const { data, isLoading, isError } = useQuery<Resumen>({
    queryKey: ['liquidacion', inicio],
    queryFn: async () => (await api.get('/liquidaciones', { params: inicio ? { inicio } : {} })).data,
  });

  const girar = useMutation({
    mutationFn: (v: { ownerId: string; referencia?: string }) =>
      api.post('/liquidaciones/girar', { ...v, inicio: data?.periodo.inicio }),
    onSuccess: () => {
      toast.success('Giro registrado');
      setAbierto(null);
      setReferencia('');
      queryClient.invalidateQueries({ queryKey: ['liquidacion'] });
      queryClient.invalidateQueries({ queryKey: ['liquidacion-periodos'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'No se pudo registrar el giro'),
  });

  const revertir = useMutation({
    mutationFn: (ownerId: string) =>
      api.delete('/liquidaciones/girar', { params: { ownerId, inicio: data?.periodo.inicio } }),
    onSuccess: () => {
      toast.success('Giro revertido');
      queryClient.invalidateQueries({ queryKey: ['liquidacion'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'No se pudo revertir'),
  });

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success('Copiado');
  };

  const t = data?.totales;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">

      {/* Encabezado */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Liquidación
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase">Pagos a los clubes</h1>
        <p className="text-gray-500 text-sm mt-1">
          La semana cierra el domingo al mediodía y se gira el lunes a las 2:00 PM.
          {data && <> Comisión de la plataforma: <strong className="text-gray-700">{data.comisionPorcentaje}%</strong>.</>}
        </p>
      </div>

      {/* Selector de semana */}
      <div className="flex flex-wrap gap-2">
        {periodos?.map((p) => {
          const activo = inicio ? p.inicio === inicio : (!p.enCurso && p === periodos.find((x) => !x.enCurso));
          return (
            <button key={p.inicio} type="button" onClick={() => { setInicio(p.inicio); setAbierto(null); }}
              className={`px-3.5 py-2 rounded-full text-[13px] font-bold border-2 whitespace-nowrap transition-all ${
                activo ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}>
              {p.etiqueta}
              {p.enCurso && <span className="ml-1.5 text-[10px] opacity-70">en curso</span>}
              {p.tieneGiros && !p.enCurso && <CheckCircle className="inline h-3 w-3 ml-1.5 text-green-500" />}
            </button>
          );
        })}
      </div>

      {/* Totales */}
      {t && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Clubes', valor: String(t.clubes), pie: `${t.reservas} reservas` },
            { label: 'Recaudado', valor: cop(t.bruto), pie: 'lo que pagaron los jugadores' },
            { label: `Comisión ${data?.comisionPorcentaje}%`, valor: cop(t.comision), pie: 'se queda en la plataforma' },
            { label: 'Falta girar', valor: cop(t.pendiente), pie: `de ${cop(t.neto)} en total`, destacar: true },
          ].map((c) => (
            <div key={c.label}
              className={`rounded-2xl border p-4 ${c.destacar ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-xl md:text-2xl font-black mt-1 ${c.destacar ? 'text-green-700' : 'text-gray-900'}`}>{c.valor}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{c.pie}</p>
            </div>
          ))}
        </div>
      )}

      {data?.periodo.enCurso && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-900">
            Esta semana todavía está abierta: los montos van a seguir subiendo hasta el corte del domingo al mediodía.
            Se gira el {format(parseISO(data.periodo.giro), "EEEE d 'de' MMMM 'a las' h:mm a", { locale: es })}.
          </p>
        </div>
      )}

      {/* Tabla de clubes */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-gray-500">Error cargando la liquidación.</div>
      ) : !data?.clubes.length ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
          <Banknote className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-900">Sin reservas pagadas en esta semana</p>
          <p className="text-gray-500 text-sm mt-1">No hay nada que girar en el periodo seleccionado.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.clubes.map((c) => {
            const expandido = abierto === c.ownerId;
            const girada = c.estado === 'girada';

            return (
              <div key={c.ownerId} className={`rounded-2xl border ${girada ? 'border-green-200 bg-green-50/40' : 'border-gray-200 bg-white'}`}>

                <button type="button" onClick={() => { setAbierto(expandido ? null : c.ownerId); setReferencia(c.referencia ?? ''); }}
                  className="w-full flex flex-wrap items-center justify-between gap-3 p-4 md:p-5 text-left">
                  <div className="min-w-0">
                    <p className="font-black text-gray-900 flex items-center gap-2">
                      {c.clubNombre}
                      {girada && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.reservas} {c.reservas === 1 ? 'reserva' : 'reservas'} · bruto {cop(c.bruto)} · comisión {cop(c.comision)}
                      {girada && c.giradaAt && ` · girada el ${format(parseISO(c.giradaAt), "d 'de' MMM", { locale: es })}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xl md:text-2xl font-black text-gray-900">{cop(c.neto)}</p>
                      <p className="text-[11px] text-gray-400">{girada ? 'ya girado' : 'a girar'}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expandido ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {expandido && (
                  <div className="px-4 md:px-5 pb-5 pt-1 border-t border-gray-100 space-y-4">

                    {/* Datos para hacer la transferencia */}
                    {c.banco?.numero ? (
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                          <Landmark className="h-3.5 w-3.5" /> Cuenta del club
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                          <p className="text-gray-600">Titular: <strong className="text-gray-900">{c.banco.titular || '—'}</strong></p>
                          <p className="text-gray-600">Documento: <strong className="text-gray-900">{c.banco.documento || '—'}</strong></p>
                          <p className="text-gray-600">Banco: <strong className="text-gray-900">{c.banco.banco || '—'}</strong></p>
                          <p className="text-gray-600 capitalize">Tipo: <strong className="text-gray-900">{c.banco.tipoCuenta || '—'}</strong></p>
                          <p className="text-gray-600 sm:col-span-2 flex items-center gap-2">
                            Número: <strong className="text-gray-900">{c.banco.numero}</strong>
                            <button type="button" onClick={() => copiar(c.banco!.numero!)}
                              className="text-gray-400 hover:text-green-600 transition-colors" title="Copiar">
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-amber-900">
                          Este club todavía no registró su cuenta de pagos. Pídele que la llene en su panel,
                          en <strong>Pagos → Cuenta de pagos</strong>, antes de girarle.
                        </p>
                      </div>
                    )}

                    {/* Registrar o revertir el giro */}
                    {girada ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-green-800">
                          Girada{c.referencia ? <> · referencia <strong>{c.referencia}</strong></> : null}
                        </p>
                        <button type="button" onClick={() => revertir.mutate(c.ownerId)} disabled={revertir.isPending}
                          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors">
                          <Undo2 className="h-4 w-4" /> Revertir
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          value={referencia}
                          onChange={(e) => setReferencia(e.target.value)}
                          placeholder="Referencia de la transferencia (opcional)"
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        <button type="button"
                          onClick={() => girar.mutate({ ownerId: c.ownerId, referencia: referencia.trim() || undefined })}
                          disabled={girar.isPending}
                          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
                          {girar.isPending
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                            : <><CheckCircle className="h-4 w-4" /> Marcar como girada</>}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
