'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { CalendarDays, XCircle, CreditCard } from 'lucide-react';

function formatTime12h(time24h: string): string {
  const [hours, minutes] = time24h.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function RealtimeNotifications() {
  const { on } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub1 = on('new-booking', (data) => {
      const b = data.booking;
      toast.success('Nueva reserva recibida', {
        description: `${b.guestName} — ${b.courtName} · ${b.startTime ? formatTime12h(b.startTime) : ''} ${b.endTime ? '- ' + formatTime12h(b.endTime) : ''} · $${Number(b.totalPrice).toLocaleString('es-CO')}`,
        icon: <CalendarDays className="h-5 w-5 text-green-500" />,
        duration: 8000,
      });
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    });

    const unsub2 = on('booking-cancelled', (data) => {
      const b = data.booking;
      toast.error('Reserva cancelada', {
        description: `${b.guestName} — ${b.courtName} · ${b.startTime ? formatTime12h(b.startTime) : ''} · Código: ${b.bookingCode}`,
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        duration: 8000,
      });
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    });

    const unsub3 = on('payment-confirmed', (data) => {
      const b = data.booking;
      toast.success('Pago confirmado', {
        description: `${b.guestName} — ${b.courtName} · $${Number(b.totalPrice).toLocaleString('es-CO')} · ${b.bookingCode}`,
        icon: <CreditCard className="h-5 w-5 text-blue-500" />,
        duration: 8000,
      });
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [on, queryClient]);

  return null; // No renderiza nada, solo escucha eventos
}
