'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, User, Building2, FileText, Calendar, Eye, CheckCircle, XCircle,
  Send, Loader2, Phone, MessageSquare, Briefcase, Search, Clock, X,
} from 'lucide-react';
import api from '@/lib/api/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada';

interface Solicitud {
  _id: string; nombre: string; apellido: string; email: string;
  empresa: string; cargo: string; nit: string; telefono?: string;
  mensaje?: string; estado: EstadoSolicitud; createdAt: string;
}

const ESTADO_STYLES: Record<EstadoSolicitud, { pill: string; dot: string; avatar: string }> = {
  pendiente: { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', avatar: 'bg-amber-100 text-amber-700' },
  aprobada:  { pill: 'bg-green-100 text-green-700',  dot: 'bg-green-500', avatar: 'bg-green-100 text-green-700' },
  rechazada: { pill: 'bg-red-100 text-red-600',      dot: 'bg-red-400',   avatar: 'bg-slate-100 text-slate-400' },
};
const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada',
};

export default function AdminSolicitudesPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected]           = useState<Solicitud | null>(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [confirmAction, setConfirmAction] = useState<'aprobar' | 'rechazar' | null>(null);
  const [search, setSearch]               = useState('');
  const [filterEstado, setFilterEstado]   = useState<string>('all');

  const { data: solicitudes = [], isLoading } = useQuery<Solicitud[]>({
    queryKey: ['admin-solicitudes'],
    queryFn: async () => { const { data } = await api.get('/solicitudes'); return data; },
  });

  const aprobarMutation = useMutation({
    mutationFn: async (id: string) => { const { data } = await api.patch(`/solicitudes/${id}/aprobar`); return data; },
    onSuccess: (data) => {
      toast.success(`Solicitud aprobada — credenciales enviadas a ${data.email ?? selected?.email}`);
      queryClient.invalidateQueries({ queryKey: ['admin-solicitudes'] });
      setModalOpen(false); setConfirmAction(null);
    },
    onError: (err: any) => toast.error(err.message || 'Error al aprobar'),
  });

  const rechazarMutation = useMutation({
    mutationFn: async (id: string) => { const { data } = await api.patch(`/solicitudes/${id}/rechazar`); return data; },
    onSuccess: () => {
      toast.success('Solicitud rechazada — se notificó al solicitante');
      queryClient.invalidateQueries({ queryKey: ['admin-solicitudes'] });
      setModalOpen(false); setConfirmAction(null);
    },
    onError: (err: any) => toast.error(err.message || 'Error al rechazar'),
  });

  const reenviarMutation = useMutation({
    mutationFn: async (id: string) => { const { data } = await api.post(`/solicitudes/${id}/reenviar-credenciales`); return data; },
    onSuccess: () => toast.success('Credenciales reenviadas'),
    onError: (err: any) => toast.error(err.message || 'Error al reenviar'),
  });

  const isPending = aprobarMutation.isPending || rechazarMutation.isPending;

  const openDetail = (s: Solicitud) => { setSelected(s); setConfirmAction(null); setModalOpen(true); };

  const filtered = solicitudes
    .filter(s => filterEstado === 'all' || s.estado === filterEstado)
    .filter(s => !search || `${s.nombre} ${s.apellido} ${s.email} ${s.empresa}`.toLowerCase().includes(search.toLowerCase()));

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
  const aprobadas  = solicitudes.filter(s => s.estado === 'aprobada').length;
  const rechazadas = solicitudes.filter(s => s.estado === 'rechazada').length;

  const kpis = [
    { label: 'Pendientes', value: pendientes,          icon: Clock,       color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Aprobadas',  value: aprobadas,           icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rechazadas', value: rechazadas,          icon: XCircle,     color: 'text-red-600',   bg: 'bg-red-50'   },
    { label: 'Total',      value: solicitudes.length,  icon: FileText,    color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  const initials = (s: Solicitud) => `${s.nombre?.[0] ?? ''}${s.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Administración
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Solicitudes de acceso</h1>
        <p className="text-slate-500 text-sm mt-1">Revisa y aprueba a los nuevos propietarios</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{k.label}</p>
              <div className={`w-8 h-8 rounded-lg ${k.bg} grid place-items-center`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-2">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre, email o empresa..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/15" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'pendiente', 'aprobada', 'rechazada'] as const).map(e => (
            <button key={e} onClick={() => setFilterEstado(e)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                filterEstado === e ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'
              }`}>
              {e === 'all' ? 'Todas' : ESTADO_LABELS[e]}
            </button>
          ))}
        </div>
      </div>

      {/* Skeletons */}
      {isLoading && <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-black text-slate-400 uppercase text-sm">Sin solicitudes</p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2.5">
        {filtered.map(s => {
          const st = ESTADO_STYLES[s.estado];
          return (
            <div key={s._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/40 hover:border-green-200 hover:shadow-md transition-all p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full grid place-items-center font-black text-sm shrink-0 ${st.avatar}`}>
                  {initials(s) || <User className="h-5 w-5" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-slate-900 text-sm">{s.nombre} {s.apellido}</span>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${st.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {ESTADO_LABELS[s.estado]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" />{s.email}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3 text-slate-400" />{s.empresa}</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-slate-400" />NIT: {s.nit}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" />{format(new Date(s.createdAt), 'dd/MM/yyyy')}</span>
                  </div>
                </div>

                {/* Botones circulares */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openDetail(s)} title="Ver detalle"
                    className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all">
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  {s.estado === 'pendiente' && (
                    <>
                      <button onClick={() => { setSelected(s); setConfirmAction('aprobar'); setModalOpen(true); }}
                        title="Aprobar"
                        className="w-9 h-9 rounded-full border border-green-200 bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-all">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setSelected(s); setConfirmAction('rechazar'); setModalOpen(true); }}
                        title="Rechazar"
                        className="w-9 h-9 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-all">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  {s.estado === 'aprobada' && (
                    <button onClick={() => reenviarMutation.mutate(s._id)}
                      disabled={reenviarMutation.isPending} title="Reenviar credenciales"
                      className="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-100 transition-all disabled:opacity-50">
                      {reenviarMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setModalOpen(false); setConfirmAction(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-full grid place-items-center font-black text-sm shrink-0 ${ESTADO_STYLES[selected.estado].avatar}`}>
                    {initials(selected) || <User className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-slate-900 truncate">{selected.nombre} {selected.apellido}</p>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${ESTADO_STYLES[selected.estado].pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ESTADO_STYLES[selected.estado].dot}`} />
                      {ESTADO_LABELS[selected.estado]}
                    </span>
                  </div>
                </div>
                <button onClick={() => { setModalOpen(false); setConfirmAction(null); }}
                  className="shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Detalle */}
              {!confirmAction && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { icon: Mail,      label: 'Email',    val: selected.email },
                      { icon: Phone,     label: 'Teléfono', val: selected.telefono },
                      { icon: Building2, label: 'Empresa',  val: selected.empresa },
                      { icon: Briefcase, label: 'Cargo',    val: selected.cargo },
                      { icon: FileText,  label: 'NIT',      val: selected.nit },
                      { icon: Calendar,  label: 'Fecha',    val: format(new Date(selected.createdAt), "d 'de' MMMM yyyy", { locale: es }) },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 break-words">{val || 'No especificado'}</p>
                      </div>
                    ))}
                  </div>

                  {selected.mensaje && (
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Mensaje
                      </p>
                      <p className="text-sm text-slate-600 italic">"{selected.mensaje}"</p>
                    </div>
                  )}

                  {selected.estado === 'pendiente' && (
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmAction('aprobar')}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-3 rounded-xl transition-colors">
                        <CheckCircle className="h-4 w-4" /> Aprobar
                      </button>
                      <button onClick={() => setConfirmAction('rechazar')}
                        className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 hover:bg-red-50 text-red-500 font-bold text-sm py-3 rounded-xl transition-colors">
                        <XCircle className="h-4 w-4" /> Rechazar
                      </button>
                    </div>
                  )}
                  {selected.estado === 'aprobada' && (
                    <button onClick={() => reenviarMutation.mutate(selected._id)} disabled={reenviarMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 border-2 border-blue-200 hover:bg-blue-50 text-blue-600 font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-50">
                      {reenviarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Reenviar credenciales
                    </button>
                  )}
                </div>
              )}

              {/* Confirmar aprobar */}
              {confirmAction === 'aprobar' && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-2.5">
                    <p className="font-black text-green-800 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Confirmar aprobación</p>
                    <p className="text-sm text-green-700">Se enviará un email a <strong className="break-words">{selected.email}</strong> con:</p>
                    <ul className="text-sm text-green-700 space-y-1.5">
                      {['Contraseña temporal generada', 'Link de acceso al dashboard', 'Instrucciones de inicio'].map(t => (
                        <li key={t} className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmAction(null)}
                      className="flex-1 border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold text-sm py-3 rounded-xl transition-all">
                      Cancelar
                    </button>
                    <button onClick={() => aprobarMutation.mutate(selected._id)} disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black text-sm py-3 rounded-xl transition-colors disabled:opacity-60">
                      {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</> : <><Send className="h-4 w-4" /> Aprobar y enviar</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmar rechazar */}
              {confirmAction === 'rechazar' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2">
                    <p className="font-black text-red-800 flex items-center gap-2"><XCircle className="h-4 w-4" /> Confirmar rechazo</p>
                    <p className="text-sm text-red-700">Se notificará a <strong className="break-words">{selected.email}</strong> que su solicitud fue rechazada.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmAction(null)}
                      className="flex-1 border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold text-sm py-3 rounded-xl transition-all">
                      Cancelar
                    </button>
                    <button onClick={() => rechazarMutation.mutate(selected._id)} disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3 rounded-xl transition-colors disabled:opacity-60">
                      {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</> : <><XCircle className="h-4 w-4" /> Rechazar</>}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
