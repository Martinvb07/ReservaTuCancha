'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Send, CheckCircle, Clock, Trash2, Eye, ChevronDown, Loader2, Tag } from 'lucide-react';
import api from '@/lib/api/axios';
import { toast } from 'sonner';

type TipoTag = 'nueva_funcion' | 'mejora' | 'correccion' | 'importante' | 'mantenimiento';

const TAGS: Record<TipoTag, { label: string; color: string; bg: string }> = {
  nueva_funcion:  { label: '✨ Nueva función',  color: 'text-blue-700',   bg: 'bg-blue-100'   },
  mejora:         { label: '⚡ Mejora',          color: 'text-purple-700', bg: 'bg-purple-100' },
  correccion:     { label: '🐛 Corrección',      color: 'text-orange-700', bg: 'bg-orange-100' },
  importante:     { label: '🔴 Importante',      color: 'text-red-700',    bg: 'bg-red-100'    },
  mantenimiento:  { label: '🔧 Mantenimiento',   color: 'text-gray-700',   bg: 'bg-gray-100'   },
};

const DESTINATARIOS = [
  { value: 'todos',        label: 'Todos los propietarios' },
  { value: 'pro',          label: 'Solo plan Pro'          },
  { value: 'empresarial',  label: 'Solo Empresarial'       },
  { value: 'basico',       label: 'Solo plan Básico'       },
];

// Modal de preview
function PreviewModal({ cambio, onClose, onSend, loading }: { cambio: any; onClose: () => void; onSend: () => void; loading: boolean }) {
  const tag = TAGS[cambio.tag as TipoTag] ?? TAGS.mejora;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase">Vista previa</h2>
            <p className="text-gray-400 text-sm mt-1">Así verán el cambio los propietarios</p>
          </div>
          <span className={`text-xs font-black px-3 py-1.5 rounded-full ${tag.bg} ${tag.color}`}>{tag.label}</span>
        </div>

        {/* Email preview */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center">
              <Bell className="h-4 w-4 text-gray-900" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">ReservaTuCancha</p>
              <p className="text-[10px] text-gray-400">notificaciones@reservatucancha.co</p>
            </div>
          </div>
          <p className="font-black text-gray-900 text-base">{cambio.titulo || 'Sin título'}</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{cambio.descripcion || 'Sin descripción'}</p>
          {cambio.version && (
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">Versión {cambio.version} · {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          Se enviará a: <strong>{DESTINATARIOS.find(d => d.value === cambio.destinatarios)?.label}</strong>
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl transition-all">
            Editar
          </button>
          <button onClick={onSend} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-3 rounded-xl transition-colors">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</> : <><Send className="h-4 w-4" />Enviar ahora</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCambiosPage() {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    version: '',
    tag: 'nueva_funcion' as TipoTag,
    destinatarios: 'todos',
  });

  const { data: historial, isLoading } = useQuery({
    queryKey: ['admin-cambios'],
    queryFn: async () => {
      const { data } = await api.get('/changelog');
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: () => api.post('/changelog', form),
    onSuccess: () => {
      toast.success('¡Cambio publicado y notificaciones enviadas!');
      queryClient.invalidateQueries({ queryKey: ['admin-cambios'] });
      setShowPreview(false);
      setForm({ titulo: '', descripcion: '', version: '', tag: 'nueva_funcion', destinatarios: 'todos' });
    },
    onError: () => toast.error('Error al publicar el cambio'),
  });

  const inp  = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
  const lbl  = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';

  const cambios: any[] = historial ?? [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Administración
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Cambios y actualizaciones</h1>
        <p className="text-gray-500 text-sm mt-1">Publica actualizaciones y notifica a tus propietarios por email</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Formulario ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
              <Plus className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Nuevo cambio</span>
          </div>

          {/* Tag */}
          <div>
            <label className={lbl}>Tipo de cambio</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(TAGS) as [TipoTag, any][]).map(([key, t]) => (
                <button key={key} type="button" onClick={() => setForm({ ...form, tag: key })}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${
                    form.tag === key ? `border-green-500 ${t.bg} ${t.color}` : 'border-gray-200 text-gray-500 hover:border-green-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className={lbl}>Título <span className="text-red-500">*</span></label>
            <input className={inp} placeholder="Ej: Nuevo sistema de pagos con Wompi"
              value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
          </div>

          {/* Descripción */}
          <div>
            <label className={lbl}>Descripción <span className="text-red-500">*</span></label>
            <textarea rows={4} className={inp} style={{ resize: 'none' }}
              placeholder="Describe los cambios en detalle. Este texto llegará por email a los propietarios..."
              value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.descripcion.length}/500</p>
          </div>

          {/* Versión y destinatarios */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Versión <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input className={inp} placeholder="Ej: v2.4.0"
                value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
            </div>
            <div>
              <label className={lbl}>Destinatarios</label>
              <div className="relative">
                <select className={inp + " appearance-none pr-8"} value={form.destinatarios}
                  onChange={e => setForm({ ...form, destinatarios: e.target.value })}>
                  {DESTINATARIOS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button"
              onClick={() => setShowPreview(true)}
              disabled={!form.titulo || !form.descripcion}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl transition-all disabled:opacity-40"
            >
              <Eye className="h-4 w-4" /> Vista previa
            </button>
            <button type="button"
              onClick={() => mutation.mutate()}
              disabled={!form.titulo || !form.descripcion || mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-colors"
            >
              {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</> : <><Send className="h-4 w-4" />Publicar y enviar</>}
            </button>
          </div>
        </div>

        {/* ── Historial ──────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Historial de cambios</h2>
            <span className="text-xs text-gray-400">{cambios.length} publicados</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : cambios.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="font-black text-gray-400 uppercase text-sm">Sin cambios publicados</p>
              <p className="text-gray-400 text-xs mt-1">Los cambios que publiques aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {cambios.map((c: any) => {
                const tag = TAGS[c.tag as TipoTag] ?? TAGS.mejora;
                return (
                  <div key={c._id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 hover:border-green-200 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${tag.bg} ${tag.color}`}>{tag.label}</span>
                        {c.version && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{c.version}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-[10px] text-green-600 font-bold">Enviado</span>
                      </div>
                    </div>
                    <p className="font-black text-gray-900 text-sm">{c.titulo}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{c.descripcion}</p>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(c.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        → {DESTINATARIOS.find(d => d.value === c.destinatarios)?.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal preview */}
      {showPreview && (
        <PreviewModal
          cambio={form}
          onClose={() => setShowPreview(false)}
          onSend={() => mutation.mutate()}
          loading={mutation.isPending}
        />
      )}
    </div>
  );
}