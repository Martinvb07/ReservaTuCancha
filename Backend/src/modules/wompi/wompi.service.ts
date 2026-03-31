import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { createHmac } from 'crypto';

@Injectable()
export class WompiService {
  private sandboxUrl = 'https://sandbox.wompi.co/api/transactions';
  private prodUrl = 'https://api.wompi.co/api/transactions';

  /**
   * Valida que el webhook venga realmente de Wompi.
   * @param data El objeto 'data' que llega en el body del webhook
   * @param timestamp El timestamp que llega en el body
   * @param checksum El valor enviado en el header 'x-event-checksum'
   * @param eventsSecret El Secret de Eventos del club (se obtiene del dashboard de Wompi)
   */
  validateSignature(data: any, timestamp: number, checksum: string, eventsSecret: string): boolean {
    const transaction = data.transaction;
    
    // La fórmula de Wompi para el checksum es:
    // id + status + amount_in_cents + timestamp + events_secret
    const chain = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}${eventsSecret}`;
    
    const hash = createHmac('sha256', eventsSecret)
      .update(chain)
      .digest('hex');

    return hash === checksum;
  }

  async createTransaction(
    apiKey: string,
    amount: number,
    description: string,
    customerEmail: string,
    customerPhone: string,
    orderId: string,
    redirectUrl: string,
  ) {
    try {
      const response = await axios.post(
        this.sandboxUrl,
        {
          amount_in_cents: Math.round(amount * 100),
          currency: 'COP',
          customer_email: customerEmail,
          customer_phone: customerPhone,
          reference: orderId,
          description,
          redirect_url: redirectUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error('Wompi error:', error.response?.data);
      throw new BadRequestException(
        error.response?.data?.message || 'Error al crear transacción en Wompi',
      );
    }
  }

  async getTransaction(apiKey: string, transactionId: string) {
    try {
      const response = await axios.get(
        `${this.sandboxUrl}/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new BadRequestException('Error al obtener transacción');
    }
  }
}