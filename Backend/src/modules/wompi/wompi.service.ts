import { Injectable } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';

@Injectable()
export class WompiService {

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

  /**
   * Genera la URL de checkout de Wompi (hosted payment page).
   * El usuario es redirigido a esta URL para completar el pago con tarjeta, PSE, etc.
   * La firma de integridad es requerida por Wompi: SHA256(reference + amount_in_cents + currency + integritySecret)
   */
  generateCheckoutUrl(
    publicKey: string,
    integritySecret: string,
    amountCOP: number,
    reference: string,
    redirectUrl: string,
  ): string {
    const amountInCents = Math.round(amountCOP * 100);
    const currency = 'COP';

    const signatureChain = `${reference}${amountInCents}${currency}${integritySecret}`;
    const signature = createHash('sha256').update(signatureChain).digest('hex');

    // NO usar URLSearchParams: codifica ":" como "%3A" y Wompi no reconoce "signature%3Aintegrity"
    return (
      `https://checkout.wompi.co/p/` +
      `?public-key=${encodeURIComponent(publicKey)}` +
      `&currency=${currency}` +
      `&amount-in-cents=${amountInCents}` +
      `&reference=${encodeURIComponent(reference)}` +
      `&redirect-url=${encodeURIComponent(redirectUrl)}` +
      `&signature:integrity=${signature}`
    );
  }
}