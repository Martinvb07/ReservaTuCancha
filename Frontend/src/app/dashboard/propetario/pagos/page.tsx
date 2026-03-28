'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, ChevronRight, Download, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api/axios';
import { toast } from 'sonner';

const ESTADO_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
};

export default function OwnerPagosPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'historial' | 'wompi'>('historial');
  const [showPassword, setShowPassword] = useState(false);
  const [wompiForm, setWompiForm] = useState({
    wompiMerchantId: '',
    wompiPublicKey: '',
    wompiApiKey: '',
  });

  // Obtener reservas confirmadas (pagos)
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['owner-bookings'],
    queryFn: async () => {
      const { data } = await api.get('/bookings/owner');
      return data;
    },
  });

  // Obtener info del club (incluyendo Wompi)
  const { data: clubInfo, isLoading: loadingClub } = useQuery({
    queryKey: ['club-info'],
    queryFn: async () => {
      const { data } = await api.get('/clubs/my-club'); // Necesitas este endpoint
      return data;
    },
  });

  // Mutación para guardar credenciales Wompi
  const saveWompi = useMutation({
    mutationFn: async (data: typeof wompiForm) =>
      api.patch(`/clubs/${clubInfo?._id}/wompi`, data),
    onSuccess: () => {
      toast.success('✅ Credenciales de Wompi guardadas');
      queryClient.invalidateQueries({ queryKey: ['club-info'] });
      setWompiForm({ wompiMerchantId: '', wompiPublicKey: '', wompiApiKey: '' });
    },
    onError: () => toast.error('❌ Error al guardar credenciales'),
  });

  const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed');
  const totalRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
  const pendingBookings = bookings.filter((b: any) => b.status === 'pending');

  const stats = [
    { label: 'Ingresos confirmados', value: `$${totalRevenue.toLocaleString('es-CO')}`, sub: `${confirmedBookings.length} reservas`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pendiente de pago', value: `$${pendingBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0).toLocaleString('es-CO')}`, sub: `${pendingBookings.length} reserva${pendingBookings.length !== 1 ? 's' : ''}`, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Estado Wompi', value: clubInfo?.wompiConfigured ? '✅ Configurado' : '❌ No configurado', sub: 'Credenciales de pago', icon: CreditCard, color: clubInfo?.wompiConfigured ? 'text-green-600' : 'text-red-600', bg: clubInfo?.wompiConfigured ? 'bg-green-50' : 'bg-red-50' },
    { label: 'Total acumulado', value: `$${(totalRevenue + pendingBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)).toLocaleString('es-CO')}`, sub: 'Desde el inicio', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
            <span>✦</span> Panel Propietario
          </p>
          <h1 className="text-3xl font-black text-gray-900 uppercase">Pagos y Wompi</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona tus credenciales de Wompi e historial de cobros</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('wompi')}
          className={`px-6 py-3 rounded-full text-sm font-bold border-2 transition-all ${
            tab === 'wompi'
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'border-gray-200 text-gray-500 hover:border-gray-400'
          }`}
        >
          <Lock className="inline h-4 w-4 mr-2" /> Configurar Wompi
        </button>
        <button
          onClick={() => setTab('historial')}
          className={`px-6 py-3 rounded-full text-sm font-bold border-2 transition-all ${
            tab === 'historial'
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'border-gray-200 text-gray-500 hover:border-gray-400'
          }`}
        >
          Historial de Reservas
        </button>
      </div>

      {/* TAB: Configurar Wompi */}
      {tab === 'wompi' && (
        <div className="space-y-6">
          {/* Advertencia si no está configurado */}
          {!clubInfo?.wompiConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-yellow-900">⚠️ Wompi no configurado</p>
                <p className="text-sm text-yellow-700 mt-1">Agrega tus credenciales de Wompi para recibir los pagos de tus reservas directamente en tu cuenta.</p>
              </div>
            </div>
          )}

          {/* Formulario Wompi */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Merchant ID de Wompi</label>
              <input
                type="text"
                placeholder="pub_live_xxxxxx..."
                value={wompiForm.wompiMerchantId}
                onChange={(e) => setWompiForm({...wompiForm, wompiMerchantId: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <p className="text-xs text-gray-400 mt-1">Encuentra esto en tu dashboard de Wompi → Configuración → Llaves API</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Public Key</label>
              <input
                type="text"
                placeholder="pk_live_xxxxxx..."
                value={wompiForm.wompiPublicKey}
                onChange={(e) => setWompiForm({...wompiForm, wompiPublicKey: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">API Key (privada)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="sk_live_xxxxxx..."
                  value={wompiForm.wompiApiKey}
                  onChange={(e) => setWompiForm({...wompiForm, wompiApiKey: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">🔒 Tu clave se almacena encriptada en nuestros servidores</p>
            </div>

            <button
              onClick={() => saveWompi.mutate(wompiForm)}
              disabled={saveWompi.isPending || !wompiForm.wompiMerchantId || !wompiForm.wompiPublicKey || !wompiForm.wompiApiKey}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors"
            >
              {saveWompi.isPending ? 'Guardando...' : clubInfo?.wompiConfigured ? '✅ Actualizar credenciales' : '🔐 Guardar credenciales'}
            </button>

            {clubInfo?.wompiConfigured && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700 font-semibold">✅ Wompi está configurado correctamente</p>
                <p className="text-xs text-green-600 mt-1">Los clientes podrán pagar tus reservas directamente a tu cuenta Wompi</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Historial de Reservas */}
      {tab === 'historial' && (
        <div className="space-y-6">
          {/* Saldo disponible */}
          {confirmedBookings.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-gray-900">Saldo confirmado</p>
                  <p className="text-sm text-gray-500">Ingresos de reservas confirmadas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-green-700">${totalRevenue.toLocaleString('es-CO')}</p>
                <button className="mt-2 text-xs font-bold text-green-700 hover:underline flex items-center gap-1 ml-auto">
                  Ver detalles <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Tabla de reservas */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{bookings.length} reservas totales</p>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-16">
                <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="font-black text-gray-400 uppercase text-sm">No hay reservas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {bookings.map((b: any) => (
                  <div key={b._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      b.status === 'confirmed' ? 'bg-green-100' : b.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      {b.status === 'confirmed'
                        ? <CheckCircle className="h-4 w-4 text-green-600" />
                        : b.status === 'pending'
                        ? <Clock className="h-4 w-4 text-yellow-600" />
                        : <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{b.guestName}</p>
                      <p className="text-xs text-gray-400">{new Date(b.date).toLocaleDateString('es-CO')} · {b.startTime} – {b.endTime}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-gray-900">${b.totalPrice?.toLocaleString('es-CO')}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_STYLES[b.status]}`}>
                        {b.status === 'confirmed' ? 'Pagada' : b.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}