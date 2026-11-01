'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Grid3x3, Moon } from 'lucide-react';
import api from '@/lib/api/axios';

interface Celda { dia: number; hora: number; capacidad: number; ocupado: number; pct: number; nombre?: string }
interface Ocupacion {
  semanas: number;
  desde: string;
  hasta: string;
  canchas: { _id: string; name: string }[];
  celdas: Celda[];
  porHora: { hora: number; pct: number; capacidad: number; ocupado: number }[];
  porDia: { dia: number; nombre: string; pct: number; capacidad: number }[];
  total: { capacidad: number; ocupado: number; pct: number };
  horasVacias: Celda[];
  horasPico: Celda[];
}

/* Lunes primero: así lee la semana un club. */
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const hora12 = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;

/** Escala de un solo tono (verde): más oscuro = más lleno. */
function colorDe(pct: number) {
  if (pct >= 80) return 'bg-green-700 text-white';
  if (pct >= 60) return 'bg-green-600 text-white';
  if (pct >= 40) return 'bg-green-400 text-green-950';
  if (pct >= 20) return 'bg-green-200 text-green-900';
  if (pct > 0) return 'bg-green-100 text-green-800';
  return 'bg-gray-50 text-gray-500';
}

/**
 * Qué tan llenas están las canchas por día y hora. Sirve para ver qué
 * franjas se quedan vacías (y vale la pena mover) y cuáles se agotan.
 */
export default function OcupacionHeatmap() {
  const [semanas, setSemanas] = useState(8);
  const [courtId, setCourtId] = useState('');

  const { data, isLoading } = useQuery<Ocupacion>({
    queryKey: ['owner-ocupacion', semanas, courtId],
    queryFn: async () => (await api.get('/analytics/owner/ocupacion', { params: { semanas, courtId: courtId || undefined } })).data,
  });

  const horas = data?.porHora.map((h) => h.hora) ?? [];
  const celda = (dia: number, hora: number) => data?.celdas.find((c) => c.dia === dia && c.hora === hora);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <Grid3x3 className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-sm">Ocupación por hora</h3>
            <p className="text-xs text-gray-500">
              {data ? `Del ${data.desde} al ${data.hasta} · horas reservadas sobre horas que podías vender` : 'Cargando…'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {data && data.canchas.length > 1 && (
            <select value={courtId} onChange={(e) => setCourtId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700">
              <option value="">Todas las canchas</option>
              {data.canchas.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
          <select value={semanas} onChange={(e) => setSemanas(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700">
            {[4, 8, 12, 26].map((n) => <option key={n} value={n}>Últimas {n} semanas</option>)}
          </select>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="h-64 animate-pulse bg-gray-100 rounded-xl" />
      ) : data.total.capacidad === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">Configura el horario de tus canchas para ver la ocupación.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Ocupación</p>
              <p className="text-2xl font-black text-gray-900">{data.total.pct}%</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Horas vendidas</p>
              <p className="text-2xl font-black text-gray-900">{data.total.ocupado.toLocaleString('es-CO')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Horas vacías</p>
              <p className="text-2xl font-black text-gray-900">{Math.max(0, data.total.capacidad - data.total.ocupado).toLocaleString('es-CO')}</p>
            </div>
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <table className="border-separate" style={{ borderSpacing: 3 }}>
              <thead>
                <tr>
                  <th />
                  {horas.map((h) => (
                    <th key={h} className="text-[11px] font-semibold text-gray-500 px-0.5 whitespace-nowrap">{hora12(h)}</th>
                  ))}
                  <th className="text-[11px] font-semibold text-gray-500 pl-2">Día</th>
                </tr>
              </thead>
              <tbody>
                {ORDEN_DIAS.map((d) => {
                  const dia = data.porDia.find((x) => x.dia === d);
                  return (
                    <tr key={d}>
                      <td className="text-[11px] font-bold text-gray-500 pr-1.5">{DIAS[d]}</td>
                      {horas.map((h) => {
                        const c = celda(d, h);
                        if (!c || c.capacidad === 0) return <td key={h} className="w-9 h-8 rounded-md bg-white border border-dashed border-gray-100" title="Cerrado" />;
                        return (
                          <td key={h} title={`${DIAS[d]} ${hora12(h)}: ${c.ocupado} de ${c.capacidad} h (${c.pct}%)`}
                            className={`w-9 h-8 rounded-md text-center text-[11px] font-bold tabular-nums ${colorDe(c.pct)}`}>
                            {Math.round(c.pct)}
                          </td>
                        );
                      })}
                      <td className="text-[11px] font-black text-gray-700 pl-2 tabular-nums">{dia?.capacidad ? `${Math.round(dia.pct)}%` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 flex-wrap">
            <span>Menos lleno</span>
            {[0, 10, 30, 50, 70, 90].map((p) => <span key={p} className={`w-5 h-3 rounded ${colorDe(p).split(' ')[0]}`} />)}
            <span>Más lleno · los números son % ocupado</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-black text-gray-900 mb-2"><Moon className="h-3.5 w-3.5 text-indigo-500" /> Franjas que más se quedan vacías</p>
              <ul className="space-y-1">
                {data.horasVacias.map((c) => (
                  <li key={`${c.dia}-${c.hora}`} className="flex justify-between text-xs text-gray-600">
                    <span>{DIAS[c.dia]} {hora12(c.hora)}</span><span className="font-bold tabular-nums">{c.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-gray-100 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-black text-gray-900 mb-2"><Flame className="h-3.5 w-3.5 text-orange-500" /> Horas pico</p>
              {data.horasPico.length === 0 ? (
                <p className="text-xs text-gray-500">Aún no hay reservas en este período.</p>
              ) : (
                <ul className="space-y-1">
                  {data.horasPico.map((c) => (
                    <li key={`${c.dia}-${c.hora}`} className="flex justify-between text-xs text-gray-600">
                      <span>{DIAS[c.dia]} {hora12(c.hora)}</span><span className="font-bold tabular-nums">{c.pct}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
