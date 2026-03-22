// src/app/(public)/mis-reservas/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, CalendarDays, Clock, MapPin, Mail, ChevronRight, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api/axios';

const STATUS_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  pending:   { pill: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400', label: 'Pendiente'  },
  confirmed: { pill: 'bg-green-100 text-green-700',   dot: 'bg-green-500',  label: 'Confirmada' },
  cancelled: { pill: 'bg-red-100 text-red-600',       dot: 'bg-red-400',    label: 'Cancelada'  },
  completed: { pill: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400',   label: 'Completada' },
};

export default function MisReservasPage() {
  const [email, setEmail]     = useState('');
  const [query, setQuery]     = useState('');
  const [searched, setSearched] = useState(false);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['mis-reservas', query],
    queryFn: async () => {
      const { data } = await api.get('/bookings', { params: { guestEmail: query } });
      return data;
    },
    enabled: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setQuery(email.trim());
    setSearched(true);
    setTimeout(() => refetch(), 50);
  };

  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative bg-gray-900 overflow-hidden py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-lime-400 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center space-y-4">
          <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <span>✦</span> Sin necesidad de cuenta
          </p>
          <h1 className="text-4xl font-black text-white uppercase">Mis reservas</h1>
          <p className="text-gray-400">Ingresa el email con el que hiciste tu reserva para verla</p>

          {/* Buscador */}
          <form onSubmit={handleSearch} className="flex gap-2 mt-6 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 transition"
              />
            </div>
            <button type="submit" disabled={isLoading}
              className="flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-black px-5 py-3 rounded-xl transition-colors disabled:opacity-60 shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Resultados */}
      <section className="max-w-3xl mx-auto px-4 py-10">

        {/* No buscó aún */}
        {!searched && (
          <div className="text-center py-16 space-y-3">
            <CalendarDays className="h-14 w-14 text-gray-200 mx-auto" />
            <p className="font-black text-gray-300 uppercase text-sm tracking-widest">Ingresa tu email para ver tus reservas</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {/* Sin resultados */}
        {searched && !isLoading && bookings.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <X className="h-8 w-8 text-gray-300" />
            </div>
            <p className="font-black text-gray-400 uppercase text-sm">No encontramos reservas</p>
            <p className="text-gray-400 text-sm">No hay reservas asociadas a <strong>{query}</strong></p>
            <Link href="/empresas"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors">
              Buscar canchas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Lista de reservas */}
        {!isLoading && bookings.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-semibold">
              {bookings.length} reserva{bookings.length !== 1 ? 's' : ''} encontrada{bookings.length !== 1 ? 's' : ''} para <strong className="text-gray-900">{query}</strong>
            </p>

            {bookings.map((booking: any) => {
              const court = typeof booking.courtId === 'object' ? booking.courtId : null;
              const st    = STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending;
              const code  = booking._id?.slice(-8).toUpperCase();

              return (
                <div key={booking._id} className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-900">{court?.name ?? 'Cancha'}</span>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${st.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                      {court?.location && (
                        <p className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="h-3 w-3" />{court.location.city}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Código</p>
                      <p className="font-black text-lime-600 text-sm">#{code}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarDays className="h-4 w-4 text-green-600 shrink-0" />
                      {format(new Date(booking.date), "dd 'de' MMM yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-green-600 shrink-0" />
                      {booking.startTime} – {booking.endTime}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-black text-green-700 text-lg">${booking.totalPrice?.toLocaleString('es-CO')} COP</span>
                    {booking.status !== 'cancelled' && booking.cancelToken && (
                      <a
                        href={`/reservas/cancelar?token=${booking.cancelToken}`}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline transition-colors"
                      >
                        Cancelar reserva
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}