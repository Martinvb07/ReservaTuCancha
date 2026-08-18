'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, Send, CheckCircle, Clock, Eye, Loader2,
  ExternalLink, Users, X, Check, History,
} from 'lucide-react';
import api from '@/lib/api/axios';
import { toast } from 'sonner';
import SelectField from '@/components/ui/SelectField';
import {
  CHANGELOG_TAGS, CHANGELOG_TAG_ORDER, getChangelogTag, formatVersion,
} from '@/lib/changelogMeta';
import type { Changelog, ChangelogTag } from '@/types/changelog.types';

/* Tope de la UI, no del backend (el schema no limita `descripcion`). Da espacio
   para anunciar un release grande sin quedarse corto. */
const DESCRIPCION_MAX = 1200;

const DESTINATARIOS = [
  { value: 'todos',        label: 'Todos los propietarios' },
  { value: 'pro',          label: 'Solo plan Pro'          },
  { value: 'empresarial',  label: 'Solo Empresarial'       },
  { value: 'basico',       label: 'Solo plan Básico'       },
];

/** Respuesta de GET /changelog/next-version */
interface VersionHint {
  /** Última versión publicada, ya normalizada a X.Y.Z (null si no hay ninguna) */
  ultima: string | null;
  sugerida: string;
  salto: 'minor' | 'patch';
}

interface FormState {
  titulo: string;
  descripcion: string;
  version: string;
  tag: ChangelogTag;
  destinatarios: string;
}

/* ── Chip de tipo de cambio, con icono ─────────────────────────── */
function TagChip({ tag, className = '' }: { tag: string; className?: string }) {
  const meta = getChangelogTag(tag);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${meta.chip} ${className}`}>
      <meta.icon className="h-3.5 w-3.5 shrink-0" />
      {meta.label}
    </span>
  );
}

/* ── Modal de vista previa del email ───────────────────────────── */
function PreviewModal({ cambio, onClose, onSend, loading }: {
  cambio: FormState; onClose: () => void; onSend: () => void; loading: boolean;
}) {
  const version = formatVersion(cambio.version);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6"
      onClick={onClose}
    >
      {/* Alto acotado + columna: con descripciones largas la cabecera y los
          botones se salían de la pantalla. Solo el cuerpo hace scroll. */}
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera fija */}
        <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-gray-100 flex-none">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-gray-900 uppercase">Vista previa</h2>
            <p className="text-gray-400 text-sm mt-1">Así verán el cambio los propietarios</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar vista previa"
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 grid place-items-center text-gray-600 transition-colors flex-none">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 py-5 space-y-4">
          {/* Simulación del email */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-gray-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">ReservaTuCancha</p>
                <p className="text-[10px] text-gray-400 truncate">notificaciones@reservatucancha.co</p>
              </div>
              <TagChip tag={cambio.tag} className="ml-auto shrink-0" />
            </div>
            <p className="font-black text-gray-900 text-base leading-tight">{cambio.titulo || 'Sin título'}</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {cambio.descripcion || 'Sin descripción'}
            </p>
            {version && (
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">
                Versión {version} · {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            Se enviará a: <strong className="text-gray-700">{DESTINATARIOS.find(d => d.value === cambio.destinatarios)?.label}</strong>
          </p>
        </div>

        {/* Acciones fijas */}
        <div className="flex gap-3 p-6 pt-4 border-t border-gray-100 flex-none">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold py-3.5 rounded-2xl transition-all">
            Editar
          </button>
          <button onClick={onSend} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-green-600/20">
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
  const [form, setForm] = useState<FormState>({
    titulo: '',
    descripcion: '',
    version: '',
    tag: 'nueva_funcion',
    destinatarios: 'todos',
  });

  const { data: historial, isLoading } = useQuery<Changelog[]>({
    queryKey: ['admin-cambios'],
    queryFn: async () => {
      const { data } = await api.get<Changelog[]>('/changelog');
      return data ?? [];
    },
  });

  /* El backend dice cuál fue la última versión y cuál toca según el tipo de
     cambio: una función nueva sube el minor (2.1.1 → 2.2.0) y una corrección
     el patch (2.1.1 → 2.1.2). Así no hay que acordarse de cuál iba. */
  const { data: sugerencia } = useQuery<VersionHint>({
    queryKey: ['changelog-next-version', form.tag],
    queryFn: async () => {
      const { data } = await api.get<VersionHint>('/changelog/next-version', { params: { tag: form.tag } });
      return data;
    },
  });

  /* Mientras el admin no escriba una versión propia, el campo sigue a la
     sugerencia (que cambia al cambiar el tipo). En cuanto la toca, manda él. */
  const versionTocada = useRef(false);
  useEffect(() => {
    if (!sugerencia?.sugerida || versionTocada.current) return;
    setForm(f => ({ ...f, version: sugerencia.sugerida }));
  }, [sugerencia?.sugerida]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/changelog', form);
      return data as { envio?: { enviados: number; destinatarios: number } };
    },
    /* El backend dice cuántos correos salieron de verdad: si son cero, se avisa
       en vez de dar por hecho que llegaron. */
    onSuccess: (data) => {
      const enviados = data?.envio?.enviados ?? 0;
      if (enviados > 0) {
        toast.success(`Publicado y enviado a ${enviados} propietario${enviados === 1 ? '' : 's'}`);
      } else {
        toast.warning('Publicado, pero no se envió ningún correo. Revisa si hay propietarios que coincidan.');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-cambios'] });
      queryClient.invalidateQueries({ queryKey: ['changelog-public'] });
      queryClient.invalidateQueries({ queryKey: ['changelog-next-version'] });
      setShowPreview(false);
      // La versión vuelve a seguir la sugerencia para la próxima publicación.
      versionTocada.current = false;
      setForm({ titulo: '', descripcion: '', version: '', tag: 'nueva_funcion', destinatarios: 'todos' });
    },
    /* El backend rechaza versiones que no avanzan ("2.1" después de "2.1.1")
       y dice cuál corresponde: ese mensaje tiene que llegar tal cual. */
    onError: (e: any) => {
      const msg = e?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join('. ') : msg || 'Error al publicar el cambio');
      setShowPreview(false);
    },
  });

  const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
  const lbl = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';

  const cambios = historial ?? [];
  const incompleto = !form.titulo.trim() || !form.descripcion.trim();
  const restantes = DESCRIPCION_MAX - form.descripcion.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
            <span>✦</span> Administración
          </p>
          <h1 className="text-3xl font-black text-gray-900 uppercase">Cambios y actualizaciones</h1>
          <p className="text-gray-500 text-sm mt-1">Publica actualizaciones y notifica a tus propietarios por email</p>
        </div>
        {/* Todo lo que se publica aquí sale también en la página pública */}
        <Link href="/novedades" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-green-700 bg-white border border-gray-200 hover:border-green-300 px-4 py-2.5 rounded-xl transition-all">
          <ExternalLink className="h-4 w-4" /> Ver página pública
        </Link>
      </div>

      {/* items-start: cada tarjeta con su alto natural, sin estirar la del
          historial hasta el alto del formulario */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* ── Formulario ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
          <div className="pb-4 mb-5 border-b border-gray-100">
            <h2 className="text-lg font-black text-gray-900">Nuevo cambio</h2>
            <p className="text-sm text-gray-500 mt-0.5">Se envía por email y queda publicado en novedades</p>
          </div>

          <div className="space-y-5">
          {/* Tipo de cambio — píldoras en fila. El color del tipo vive en el
              icono y la selección se marca en verde, como el resto del panel.
              La pista del tipo elegido va en una sola línea debajo, en vez de
              repetirse en las cinco opciones. */}
          <div>
            <label className={lbl}>Tipo de cambio</label>
            <div className="flex flex-wrap gap-2">
              {CHANGELOG_TAG_ORDER.map((key) => {
                const meta = CHANGELOG_TAGS[key];
                const active = form.tag === key;
                return (
                  <button key={key} type="button" onClick={() => setForm({ ...form, tag: key })}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border-2 text-[13px] font-bold transition-all ${
                      active
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-gray-50'
                    }`}
                  >
                    <meta.icon className={`h-4 w-4 shrink-0 ${active ? 'text-green-600' : meta.text}`} />
                    {meta.label}
                    {active && <Check className="h-3.5 w-3.5 text-green-600 shrink-0 check-in" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">{CHANGELOG_TAGS[form.tag].hint}</p>
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
            <textarea rows={8} className={inp} style={{ resize: 'none' }} maxLength={DESCRIPCION_MAX}
              placeholder="Describe los cambios en detalle. Este texto llegará por email a los propietarios y se publicará en /novedades..."
              value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
            <p className={`text-xs mt-1 text-right tabular-nums ${restantes <= 120 ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>
              {form.descripcion.length}/{DESCRIPCION_MAX}
            </p>
          </div>

          {/* Versión y destinatarios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Versión <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
              <input className={inp} placeholder="Ej: 2.4.0"
                value={form.version}
                onChange={e => { versionTocada.current = true; setForm({ ...form, version: e.target.value }); }} />

              {/* Pista de versión: qué se publicó por última vez y qué toca
                  ahora. El botón vuelve a la sugerencia si la editaron. */}
              {sugerencia ? (
                <p className="text-[11px] text-gray-400 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  {sugerencia.ultima
                    ? <>Última publicada: <strong className="text-gray-600">{sugerencia.ultima}</strong> ·</>
                    : <>Primera publicación ·</>}
                  <span>
                    {sugerencia.salto === 'minor' ? 'Función nueva' : 'Cambio menor'}, toca{' '}
                    <strong className="text-gray-600">{sugerencia.sugerida}</strong>
                  </span>
                  {form.version.trim() !== sugerencia.sugerida && (
                    <button type="button"
                      onClick={() => { versionTocada.current = false; setForm({ ...form, version: sugerencia.sugerida }); }}
                      className="font-bold text-green-700 hover:underline">
                      usar {sugerencia.sugerida}
                    </button>
                  )}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1">La "v" se agrega sola al mostrarla</p>
              )}
            </div>
            <div>
              <label className={lbl}>Destinatarios</label>
              <SelectField
                value={form.destinatarios}
                onChange={(v) => setForm({ ...form, destinatarios: v })}
                options={DESTINATARIOS}
                aria-label="Destinatarios del cambio"
              />
              <p className="text-[11px] text-gray-400 mt-1">Define a quién le llega el email</p>
            </div>
          </div>

          {/* Botones — mismo peso que la botonera de editar cancha */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button type="button"
              onClick={() => setShowPreview(true)}
              disabled={incompleto}
              className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold py-4 rounded-2xl transition-all disabled:opacity-40 disabled:hover:border-gray-200"
            >
              <Eye className="h-5 w-5" /> Vista previa
            </button>
            <button type="button"
              onClick={() => mutation.mutate()}
              disabled={incompleto || mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-green-600/20"
            >
              {mutation.isPending
                ? <><Loader2 className="h-5 w-5 animate-spin" />Enviando...</>
                : <><Send className="h-5 w-5" />Publicar y enviar</>}
            </button>
          </div>
          {incompleto && (
            <p className="text-xs text-gray-400 text-center">Completa título y descripción para continuar</p>
          )}
          </div>
        </div>

        {/* ── Historial ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-gray-100">
            <div className="min-w-0">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <History className="h-[18px] w-[18px] text-gray-400 shrink-0" />
                Historial
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Lo que ya salió, de lo más reciente a lo más viejo</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full tabular-nums shrink-0">
              {cambios.length} {cambios.length === 1 ? 'publicado' : 'publicados'}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : cambios.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border border-dashed border-gray-200">
              <span className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-300 grid place-items-center mx-auto mb-4">
                <Bell className="h-7 w-7" />
              </span>
              <p className="font-black text-gray-400 uppercase text-sm">Sin cambios publicados</p>
              <p className="text-gray-400 text-xs mt-1">Los cambios que publiques aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-y-auto no-scrollbar -mr-1 pr-1">
              {cambios.map((c) => {
                const version = formatVersion(c.version);
                const meta = getChangelogTag(c.tag);
                return (
                  <div key={c._id}
                    className="relative bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all p-4 pl-5 space-y-2 overflow-hidden">
                    {/* Franja del color del tipo: identifica el cambio de un vistazo */}
                    <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${meta.dot}`} />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TagChip tag={c.tag} />
                        {version && (
                          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full tabular-nums">
                            {version}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-[10px] text-green-600 font-bold">Enviado</span>
                      </div>
                    </div>

                    <p className="font-black text-gray-900 text-[15px] leading-tight">{c.titulo}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-line leading-relaxed">{c.descripcion}</p>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
                      <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                        <Clock className="h-3 w-3 shrink-0" />
                        {new Date(c.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 min-w-0">
                        <Users className="h-3 w-3 shrink-0" />
                        <span className="truncate">{DESTINATARIOS.find(d => d.value === c.destinatarios)?.label ?? c.destinatarios}</span>
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
