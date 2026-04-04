import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: [
      'https://reservatucancha.site',
      'https://www.reservatucancha.site',
      'http://localhost:3000',
    ],
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;
      const role = payload.role;

      // Unir al room del usuario (para notificaciones personales)
      client.join(`user:${userId}`);

      // Si es admin, unir al room de admin
      if (role === 'admin') {
        client.join('admin');
      }

      // Guardar datos en el socket para referencia
      client.data.userId = userId;
      client.data.role = role;

      this.logger.log(`Client connected: ${userId} (${role})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.userId) {
      this.logger.log(`Client disconnected: ${client.data.userId}`);
    }
  }

  /**
   * Notificar al owner de una cancha que tiene una nueva reserva
   */
  notifyNewBooking(ownerId: string, booking: any) {
    this.server.to(`user:${ownerId}`).emit('new-booking', {
      type: 'new-booking',
      booking: {
        _id: booking._id,
        guestName: booking.guestName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalPrice: booking.totalPrice,
        status: booking.status,
        courtName: booking.courtId?.name ?? 'Cancha',
        paymentMethod: booking.paymentMethod,
        bookingCode: booking.bookingCode,
      },
      createdAt: new Date().toISOString(),
    });

    // También notificar al admin
    this.server.to('admin').emit('new-booking', {
      type: 'new-booking',
      booking: {
        _id: booking._id,
        guestName: booking.guestName,
        totalPrice: booking.totalPrice,
        courtName: booking.courtId?.name ?? 'Cancha',
        bookingCode: booking.bookingCode,
      },
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Notificar al owner que una reserva fue cancelada
   */
  notifyBookingCancelled(ownerId: string, booking: any) {
    this.server.to(`user:${ownerId}`).emit('booking-cancelled', {
      type: 'booking-cancelled',
      booking: {
        _id: booking._id,
        guestName: booking.guestName,
        date: booking.date,
        startTime: booking.startTime,
        courtName: booking.courtId?.name ?? 'Cancha',
        bookingCode: booking.bookingCode,
      },
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Notificar al owner que un pago fue confirmado
   */
  notifyPaymentConfirmed(ownerId: string, booking: any) {
    this.server.to(`user:${ownerId}`).emit('payment-confirmed', {
      type: 'payment-confirmed',
      booking: {
        _id: booking._id,
        guestName: booking.guestName,
        totalPrice: booking.totalPrice,
        courtName: booking.courtId?.name ?? 'Cancha',
        bookingCode: booking.bookingCode,
      },
      createdAt: new Date().toISOString(),
    });
  }
}
