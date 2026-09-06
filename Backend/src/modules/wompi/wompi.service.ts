import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * Pasarela de pagos.
 *
 * Todo el dinero entra a la cuenta Wompi de ReservaTuCancha, no a la de cada
 * club: el club recibe su parte en la liquidación semanal (ver LiquidacionesService).
 * Por eso las llaves viven en variables de entorno y ya no en el documento del club.
 */
@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);

  constructor(private readonly config: ConfigService) {}

  get publicKey(): string | undefined {
    return this.config.get<string>('WOMPI_PUBLIC_KEY');
  }

  get integritySecret(): string | undefined {
    return this.config.get<string>('WOMPI_INTEGRITY_SECRET');
  }

  get eventsSecret(): string | undefined {
    return this.config.get<string>('WOMPI_EVENTS_SECRET');
  }

  /** Sin llaves no se puede cobrar: el formulario avisa y no deja reservar. */
  get configured(): boolean {
    return !!(this.publicKey && this.integritySecret);
  }

  /**
   * Valida que el webhook venga realmente de Wompi.
   * Fórmula del checksum: id + status + amount_in_cents + timestamp + events_secret
   *
   * Sin secreto devuelve false y el webhook se rechaza. Antes se aceptaba el
   * evento igual, asi que una env sin poner alcanzaba para que cualquiera
   * confirmara reservas sin pagar o borrara las ajenas mandando DECLINED.
   */
  validateSignature(data: any, timestamp: number, checksum: string): boolean {
    if (!this.eventsSecret) {
      this.logger.error('WOMPI_EVENTS_SECRET sin definir: se rechaza el webhook');
      return false;
    }
    if (!checksum || typeof checksum !== 'string') return false;

    const transaction = data?.transaction;
    if (!transaction) return false;

    const chain = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}${this.eventsSecret}`;
    const esperado = createHash('sha256').update(chain).digest('hex');

    /* Comparacion de tiempo constante: un `===` sobre el hash filtra, en el
       tiempo que tarda, cuantos caracteres iniciales coincidian. */
    const a = Buffer.from(esperado, 'utf8');
    const b = Buffer.from(checksum.toLowerCase(), 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  /**
   * URL de checkout de Wompi (hosted payment page) con las llaves de la empresa.
   * La firma de integridad es requerida: SHA256(reference + amount_in_cents + currency + integritySecret)
   */
  generateCheckoutUrl(amountCOP: number, reference: string, redirectUrl: string): string {
    const amountInCents = Math.round(amountCOP * 100);
    const currency = 'COP';

    const signatureChain = `${reference}${amountInCents}${currency}${this.integritySecret}`;
    const signature = createHash('sha256').update(signatureChain).digest('hex');

    // NO usar URLSearchParams: codifica ":" como "%3A" y Wompi no reconoce "signature%3Aintegrity"
    return (
      `https://checkout.wompi.co/p/` +
      `?public-key=${encodeURIComponent(this.publicKey ?? '')}` +
      `&currency=${currency}` +
      `&amount-in-cents=${amountInCents}` +
      `&reference=${encodeURIComponent(reference)}` +
      `&redirect-url=${encodeURIComponent(redirectUrl)}` +
      `&signature:integrity=${signature}`
    );
  }
}
