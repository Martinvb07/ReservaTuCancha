'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CalendarDays, Clock, User, Phone, Mail, Eye, X, CheckCircle, Search, List, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import api from '@/lib/api/axios';
import { toast } from 'sonner';
import type { Booking } from '@/types/booking.types';
import BookingsCalendar from '@/components/dashboard/BookingsCalendar';

function formatTime12h(time24h: string): string {
  const [hours, minutes] = time24h.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  pending:   { pill: 'bg-yellow-100 text-yellow-700',  dot: 'bg-yellow-400'  },
  confirmed: { pill: 'bg-green-100 text-green-700',    dot: 'bg-green-500'   },
  cancelled: { pill: 'bg-red-100 text-red-600',        dot: 'bg-red-400'     },
  completed: { pill: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400'    },
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada',
};

const ITEMS_PER_PAGE = 10;

export default function ReservasOwnerPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected]   = useState<Booking | null>(null);
  const [filterStatus, setFilter] = useState('all');
  const [search, setSearch]       = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<'list' | 'calendar'>('calendar');

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['owner-bookings'],
    queryFn: async () => { const { data } = await api.get('/bookings/owner'); return data; },
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      setSelected(null);
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  const handleChangeStatus = (id: string, status: string) => {
    changeStatus.mutate({ id, status });
  };

  const filtered = bookings
    .filter(b => filterStatus === 'all' || b.status === filterStatus)
    .filter(b => !search ||
      b.guestName?.toLowerCase().includes(search.toLowerCase()) ||
      b.guestEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingCode?.toLowerCase().includes(search.replace('#', '').toLowerCase())
    );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedBookings = filtered.slice(startIdx, endIdx);

  const pendientes  = bookings.filter(b => b.status === 'pending').length;
  const confirmadas = bookings.filter(b => b.status === 'confirmed').length;

  const handleFilterChange = (status: string) => {
    setFilter(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-lime-600 font-semibold text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
            <span>✦</span> Panel Propietario
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Reservas</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {bookings.length} reservas ·{' '}
            <span className="text-yellow-600 font-semibold">{pendientes} pendientes</span> ·{' '}
            <span className="text-green-600 font-semibold">{confirmadas} confirmadas</span>
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              view === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Calendario
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              view === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </button>
        </div>
      </div>

      {/* Filtros (ambas vistas) */}
      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, email o código (#XXXXXXXX)..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold border-2 transition-all ${
                filterStatus === s
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {s === 'all' ? 'Todas' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 sm:h-24 rounded-2xl" />)}
        </div>
      )}

      {/* ═══ CALENDAR VIEW ═══ */}
      {!isLoading && view === 'calendar' && (
        <BookingsCalendar
          bookings={filtered}
          onChangeStatus={handleChangeStatus}
        />
      )}

      {/* ═══ LIST VIEW ═══ */}
      {!isLoading && view === 'list' && (
        <>
          {/* Empty */}
          {filtered.length === 0 && (
            <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-gray-100">
              <CalendarDays className="h-10 sm:h-12 w-10 sm:w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-black text-gray-400 uppercase text-xs sm:text-sm">Sin reservas</p>
              <p className="text-gray-400 text-xs mt-1">
                {search || filterStatus !== 'all' ? 'Intenta con otros filtros' : 'Las reservas de tus canchas aparecerán aquí'}
              </p>
            </div>
          )}

          {/* Lista */}
          {filtered.length > 0 && (
            <div className="space-y-3">
              {paginatedBookings.map(booking => {
                const court = typeof booking.courtId === 'object' ? booking.courtId : null;
                const st    = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;
                return (
                  <div
                    key={booking._id}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-green-50 rounded-xl px-2.5 py-2 text-center min-w-[44px] shrink-0">
                        <p className="text-[9px] text-green-600 font-bold uppercase leading-none">
                          {format(new Date(booking.date), 'MMM', { locale: es })}
                        </p>
                        <p className="text-lg font-black text-green-700 leading-tight">
                          {format(new Date(booking.date), 'd')}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {court && <span className="font-black text-gray-900 text-sm">{court.name}</span>}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {STATUS_LABELS[booking.status]}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />{formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <User className="h-3 w-3 shrink-0" /><span className="truncate">{booking.guestName}</span>
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" /><span className="truncate">{booking.guestEmail}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setSelected(booking)} title="Ver detalles"
                          className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {booking.status === 'pending' && (
                          <button onClick={() => changeStatus.mutate({ id: booking._id, status: 'confirmed' })} title="Confirmar"
                            className="w-8 h-8 rounded-full border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-500 hover:bg-amber-100 transition-all">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button onClick={() => changeStatus.mutate({ id: booking._id, status: 'cancelled' })} title="Cancelar"
                            className="w-8 h-8 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-all">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50">
                      {booking.bookingCode
                        ? <span className="font-mono text-xs font-bold text-gray-400">#{booking.bookingCode}</span>
                        : <span />
                      }
                      <span className="font-black text-green-700 text-sm">${booking.totalPrice?.toLocaleString('es-CO')} <span className="text-[10px] font-normal text-gray-400">COP</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {filtered.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-xs sm:text-sm text-gray-600 font-medium text-center sm:text-left">
                Mostrando <span className="font-bold">{startIdx + 1}</span> a <span className="font-bold">{Math.min(endIdx, filtered.length)}</span> de <span className="font-bold">{filtered.length}</span> reservas
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold text-xs sm:text-sm transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    const isActive = page === currentPage;
                    const isNear = Math.abs(page - currentPage) <= 1;
                    const isFirstOrLast = page === 1 || page === totalPages;
                    if (!isActive && !isNear && !isFirstOrLast) {
                      if (page === 2 || page === totalPages - 1) {
                        return <span key={page} className="text-gray-400">...</span>;
                      }
                      return null;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                          isActive
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-200 text-gray-700 hover:border-green-400 hover:bg-green-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold text-xs sm:text-sm transition-all"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal detalles (solo vista lista) */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-gray-900">Detalle de reserva</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_STYLES[selected.status]?.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[selected.status]?.dot}`} />
                {STATUS_LABELS[selected.status]}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><CalendarDays className="h-4 w-4 text-green-600" />{format(new Date(selected.date), 'PPP', { locale: es })}</div>
                <div className="flex items-center gap-2 text-gray-600"><Clock className="h-4 w-4 text-green-600" />{formatTime12h(selected.startTime)} – {formatTime12h(selected.endTime)}</div>
                <div className="flex items-center gap-2 text-gray-600"><User className="h-4 w-4 text-green-600" />{selected.guestName}</div>
                <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 text-green-600" />{selected.guestEmail}</div>
                <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-green-600" />{selected.guestPhone}</div>
                {selected.notes && <div className="text-gray-500 pt-1 border-t border-gray-100">📝 {selected.notes}</div>}
              </div>
              {selected.bookingCode && (
                <div className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-500 font-semibold">Código</span>
                  <span className="font-black text-gray-700 font-mono tracking-widest">#{selected.bookingCode}</span>
                </div>
              )}
              <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-600 font-semibold">Total</span>
                <span className="font-black text-green-700 text-lg">${selected.totalPrice?.toLocaleString('es-CO')} COP</span>
              </div>
              {(selected.status === 'pending' || selected.status === 'confirmed') && (
                <div className="flex gap-2">
                  {selected.status === 'pending' && (
                    <button
                      onClick={() => changeStatus.mutate({ id: selected._id, status: 'confirmed' })}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" /> Confirmar
                    </button>
                  )}
                  <button
                    onClick={() => changeStatus.mutate({ id: selected._id, status: 'cancelled' })}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-red-200 hover:bg-red-50 text-red-500 font-bold text-sm py-2.5 rounded-xl transition-colors"
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setSelected(null)} className="w-full border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm py-2.5 rounded-xl transition-all">
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
