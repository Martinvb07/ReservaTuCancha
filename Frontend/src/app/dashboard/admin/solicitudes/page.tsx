'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Mail, User, Building2, FileText, Calendar, Eye, CheckCircle, XCircle, Send, Loader2, Phone, MessageSquare, Briefcase, Search } from 'lucide-react';
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

const ESTADO_STYLES: Record<EstadoSolicitud, { pill: string; dot: string }> = {
  pendiente: { pill: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  aprobada:  { pill: 'bg-green-100 text-green-700',   dot: 'bg-green-500'  },
  rechazada: { pill: 'bg-red-100 text-red-600',       dot: 'bg-red-400'    },
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Administración
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Solicitudes de acceso</h1>
        <p className="text-gray-500 text-sm mt-1">
          {solicitudes.length} solicitudes ·{' '}
          <span className="text-yellow-600 font-semibold">{pendientes} pendientes</span>
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre, email o empresa..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
        </div>
        <div className="flex gap-2">
          {(['all', 'pendiente', 'aprobada', 'rechazada'] as const).map(e => (
            <button key={e} onClick={() => setFilterEstado(e)}
              className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                filterEstado === e ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-400'
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
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-black text-gray-400 uppercase text-sm">Sin solicitudes</p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {filtered.map(s => {
          const st = ESTADO_STYLES[s.estado];
          return (
            <div key={s._id} className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 shrink-0">
                  <User className="h-5 w-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-gray-900 text-sm">{s.nombre} {s.apellido}</span>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${st.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {ESTADO_LABELS[s.estado]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{s.empresa}</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />NIT: {s.nit}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(s.createdAt), 'dd/MM/yyyy')}</span>
                  </div>
                </div>

                {/* Botones circulares */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Ver — gris */}
                  <button onClick={() => openDetail(s)} title="Ver detalle"
                    className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  {s.estado === 'pendiente' && (
                    <>
                      {/* Aprobar — verde */}
                      <button onClick={() => { setSelected(s); setConfirmAction('aprobar'); setModalOpen(true); }}
                        title="Aprobar"
                        className="w-9 h-9 rounded-full border border-green-200 bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-all">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </button>
                      {/* Rechazar — rojo */}
                      <button onClick={() => { setSelected(s); setConfirmAction('rechazar'); setModalOpen(true); }}
                        title="Rechazar"
                        className="w-9 h-9 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-all">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  {s.estado === 'aprobada' && (
                    /* Reenviar — azul */
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
      <Dialog open={modalOpen} onOpenChange={v => { setModalOpen(v); if (!v) setConfirmAction(null); }}>
        <DialogContent className="max-w-lg rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 font-black text-gray-900">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-orange-700" />
                  </div>
                  {selected.nombre} {selected.apellido}
                </DialogTitle>
              </DialogHeader>

              {/* Detalle */}
              {!confirmAction && (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-2xl p-4 text-sm">
                    {[
                      { icon: Mail,      label: 'Email',    val: selected.email },
                      { icon: Phone,     label: 'Teléfono', val: selected.telefono ?? 'No especificado' },
                      { icon: Building2, label: 'Empresa',  val: selected.empresa },
                      { icon: Briefcase, label: 'Cargo',    val: selected.cargo },
                      { icon: FileText,  label: 'NIT',      val: selected.nit },
                      { icon: Calendar,  label: 'Fecha',    val: format(new Date(selected.createdAt), "d 'de' MMMM yyyy", { locale: es }) },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                        <p className="font-semibold text-gray-700 flex items-center gap-1.5 text-xs">
                          <Icon className="h-3 w-3 text-gray-400 shrink-0" />{val}
                        </p>
                      </div>
                    ))}
                  </div>

                  {selected.mensaje && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Mensaje
                      </p>
                      <p className="text-sm text-gray-600 italic">"{selected.mensaje}"</p>
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
                <div className="space-y-4 py-2">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-2">
                    <p className="font-black text-green-800 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Confirmar aprobación</p>
                    <p className="text-sm text-green-700">Se enviará email a <strong>{selected.email}</strong> con:</p>
                    <ul className="text-sm text-green-700 space-y-1 ml-2">
                      <li>✅ Contraseña temporal generada</li>
                      <li>✅ Link de acceso al dashboard</li>
                      <li>✅ Instrucciones de inicio</li>
                    </ul>
                  </div>
                  <DialogFooter className="gap-2">
                    <button onClick={() => setConfirmAction(null)}
                      className="flex-1 border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm py-3 rounded-xl transition-all">
                      Cancelar
                    </button>
                    <button onClick={() => aprobarMutation.mutate(selected._id)} disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black text-sm py-3 rounded-xl transition-colors disabled:opacity-60">
                      {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</> : <><Send className="h-4 w-4" /> Aprobar y enviar</>}
                    </button>
                  </DialogFooter>
                </div>
              )}

              {/* Confirmar rechazar */}
              {confirmAction === 'rechazar' && (
                <div className="space-y-4 py-2">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2">
                    <p className="font-black text-red-800 flex items-center gap-2"><XCircle className="h-4 w-4" /> Confirmar rechazo</p>
                    <p className="text-sm text-red-700">Se notificará a <strong>{selected.email}</strong> que su solicitud fue rechazada.</p>
                  </div>
                  <DialogFooter className="gap-2">
                    <button onClick={() => setConfirmAction(null)}
                      className="flex-1 border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm py-3 rounded-xl transition-all">
                      Cancelar
                    </button>
                    <button onClick={() => rechazarMutation.mutate(selected._id)} disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-sm py-3 rounded-xl transition-colors disabled:opacity-60">
                      {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</> : <><XCircle className="h-4 w-4" /> Rechazar</>}
                    </button>
                  </DialogFooter>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}