import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';

const APIFY = 'https://apify.epayco.co';

/** Lo que ePayco necesita para abrir un checkout. */
export interface DatosSesion {
  /** Lo que se le cobra al jugador, en pesos */
  total: number;
  /** Nuestra referencia: el código de la reserva */
  invoice: string;
  nombre: string;
  descripcion: string;
  /** A dónde vuelve el navegador al terminar */
  responseUrl: string;
  /** A dónde ePayco nos avisa el resultado real */
  confirmationUrl: string;
  cliente?: { nombre?: string; email?: string; telefono?: string };
  ip?: string;
  /** Reparto de la plata entre el club y la plataforma. */
  split?: DatosSplit;
}

/**
 * Cómo se parte el cobro.
 *
 * Las tres partes tienen que sumar lo que paga el jugador: lo del club, lo
 * nuestro y lo de la pasarela.
 */
export interface DatosSplit {
  /** P_CUST_ID_CLIENTE del club, que recibe su parte directo */
  receptorId: string;
  /** Lo que le llega al club */
  netoDueno: number;
  /** Lo que se queda la plataforma */
  gananciaPlataforma: number;
  /** Lo que se queda ePayco */
  costoPasarela: number;
}

/**
 * Pasarela de pagos.
 *
 * Con pagos divididos activos, ePayco reparte el cobro en el momento: al club
 * le consigna directo a su propia cuenta de ePayco y a nosotros nuestra parte,
 * sin que la plata quede represada en la cuenta de la empresa.
 *
 * Se usa el Smart Checkout: el backend crea la sesión con las llaves privadas y
 * el navegador solo recibe un `sessionId`, que no sirve para cobrar otra cosa
 * ni para abrir una sesión nueva.
 */
@Injectable()
export class EpaycoService {
  private readonly logger = new Logger(EpaycoService.name);

  constructor(private readonly config: ConfigService) {}

  get publicKey(): string | undefined {
    return this.config.get<string>('EPAYCO_PUBLIC_KEY');
  }

  private get privateKey(): string | undefined {
    return this.config.get<string>('EPAYCO_PRIVATE_KEY');
  }

  /** Identificador del comercio. Solo se usa para validar la firma. */
  private get custIdCliente(): string | undefined {
    return this.config.get<string>('EPAYCO_P_CUST_ID_CLIENTE');
  }

  /** Llave privada de la firma de confirmación (distinta de la API key). */
  private get pKey(): string | undefined {
    return this.config.get<string>('EPAYCO_P_KEY');
  }

  /**
   * Pagos divididos: ePayco reparte el cobro en el momento y le consigna al
   * club directo, sin que la plata pase por la cuenta de la empresa.
   *
   * Vive en el entorno porque ePayco lo activa por ticket de soporte: hasta que
   * no esté activo en la cuenta, mandar los parámetros de split hace fallar el
   * cobro entero.
   */
  get splitActivo(): boolean {
    return String(this.config.get('EPAYCO_SPLIT') ?? 'false').toLowerCase() === 'true';
  }

  /** En pruebas ePayco no mueve plata de verdad. */
  get testMode(): boolean {
    return String(this.config.get('EPAYCO_TEST') ?? 'false').toLowerCase() === 'true';
  }

  /** Sin llaves no se puede cobrar: el formulario avisa y no deja reservar. */
  get configured(): boolean {
    return !!(this.publicKey && this.privateKey && this.custIdCliente && this.pKey);
  }

  /* ── Checkout ───────────────────────────────────────────────────────── */

  /** Token de la API. Dura poco, así que se pide en cada cobro y no se cachea. */
  private async autenticar(): Promise<string> {
    const basic = Buffer.from(`${this.publicKey}:${this.privateKey}`).toString('base64');

    const res = await fetch(`${APIFY}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${basic};` },
      body: '{}',
    });

    if (!res.ok) {
      this.logger.error(`Login de ePayco rechazado: HTTP ${res.status}`);
      throw new ServiceUnavailableException('No se pudo contactar la pasarela de pagos');
    }

    const json: any = await res.json().catch(() => null);
    const token = json?.bearer_token ?? json?.token ?? json?.data?.bearer_token;
    if (!token) {
      this.logger.error(`Login de ePayco sin token: ${JSON.stringify(json)?.slice(0, 300)}`);
      throw new ServiceUnavailableException('No se pudo contactar la pasarela de pagos');
    }
    return token;
  }

  /**
   * Crea la sesión de cobro y devuelve el id que abre el checkout.
   *
   * El monto se manda desde el servidor a propósito: el navegador nunca propone
   * cuánto pagar, solo recibe el id de una sesión ya cerrada.
   */
  async crearSesion(datos: DatosSesion): Promise<string> {
    if (!this.configured) {
      throw new ServiceUnavailableException('Los pagos en línea no están disponibles en este momento');
    }

    const token = await this.autenticar();

    const body = {
      checkout_version: '2',
      name: datos.nombre.slice(0, 50),
      description: datos.descripcion.slice(0, 150),
      invoice: datos.invoice,
      currency: 'COP',
      amount: String(Math.round(datos.total)),
      /* La cancha no discrimina IVA: la base es el total y el impuesto va en
         cero. Si alguna vez hay que facturarlo, se parte acá. */
      tax: '0',
      taxBase: '0',
      country: 'CO',
      lang: 'ES',
      test: this.testMode,
      external: 'false',
      response: datos.responseUrl,
      confirmation: datos.confirmationUrl,
      ip: datos.ip ?? '127.0.0.1',
      /* Viaja de ida y vuelta: la confirmación llega con el código de reserva
         aunque ePayco cambie el formato de la factura. */
      extra1: datos.invoice,
      billing: {
        name: datos.cliente?.nombre ?? '',
        email: datos.cliente?.email ?? '',
        mobilePhone: datos.cliente?.telefono ?? '',
      },
      ...this.parametrosSplit(datos),
    };

    const res = await fetch(`${APIFY}/payment/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const json: any = await res.json().catch(() => null);
    const sessionId =
      json?.data?.sessionId ?? json?.data?.session_id ?? json?.sessionId ?? json?.session_id;

    if (!res.ok || !sessionId) {
      this.logger.error(
        `ePayco no creó la sesión para ${datos.invoice}: HTTP ${res.status} ${JSON.stringify(json)?.slice(0, 300)}`,
      );
      throw new ServiceUnavailableException('No se pudo iniciar el pago, intenta de nuevo');
    }

    return sessionId;
  }

  /**
   * Parámetros de pagos divididos para la sesión.
   *
   * El club entra como receptor con el total de la transacción y nos paga su
   * comisión en `fee`, un valor fijo en pesos (split_type '01') y no un
   * porcentaje: nuestra ganancia es un monto fijo por reserva, no una tajada
   * del ticket. ePayco descuenta su propia tarifa aparte, según la comisión
   * configurada para la cuenta del receptor en su panel; de ahí sale el neto
   * que termina recibiendo el club.
   *
   * `iva` va en cero y `base_iva` carga el total porque el alquiler de la
   * cancha no discrimina IVA; ePayco valida que `iva + base_iva == total`.
   *
   * Devuelve un objeto vacío si el split no está activo o la reserva no trae
   * receptor: así el cobro sigue entrando a la cuenta de la empresa en vez de
   * fallar, que es lo que pasa si se mandan estos campos sin el split activado.
   */
  private parametrosSplit(datos: DatosSesion): Record<string, unknown> {
    const split = datos.split;
    if (!this.splitActivo || !split?.receptorId) return {};

    const partes = Math.round(split.netoDueno + split.gananciaPlataforma + split.costoPasarela);
    if (partes !== Math.round(datos.total)) {
      /* No se cobra a medias: si las partes no suman lo cobrado, ePayco
         repartiría mal y alguien terminaría con plata que no es suya. */
      this.logger.error(
        `Split descuadrado en ${datos.invoice}: las partes suman ${partes} y el cobro es ${datos.total}`,
      );
      throw new ServiceUnavailableException('No se pudo iniciar el pago, intenta de nuevo');
    }

    return {
      splitpayment: 'true',
      split_app_id: this.custIdCliente,
      split_merchant_id: this.custIdCliente,
      /* '01' = comisión fija en pesos. Con '02' sería un porcentaje. */
      split_type: '01',
      split_primary_receiver: this.custIdCliente,
      /* Nuestra parte no se cobra acá sino como `fee` del club: el receptor
         principal no retiene nada por sí mismo. */
      split_primary_receiver_fee: '0',
      split_rule: 'multiple',
      split_receivers: [
        {
          id: split.receptorId,
          total: String(Math.round(datos.total)),
          iva: '0',
          base_iva: String(Math.round(datos.total)),
          fee: String(Math.round(split.gananciaPlataforma)),
        },
      ],
    };
  }

  /* ── Confirmación ───────────────────────────────────────────────────── */

  /**
   * Valida que la confirmación venga realmente de ePayco.
   * Firma: SHA256(p_cust_id_cliente^p_key^x_ref_payco^x_transaction_id^x_amount^x_currency_code)
   *
   * Falla cerrado: sin las llaves en el entorno devuelve false y la
   * confirmación se rechaza, para que una env sin poner no alcance para
   * confirmar reservas sin pagar.
   */
  validarFirma(
    firma: string,
    datos: {
      x_ref_payco: string;
      x_transaction_id: string;
      x_amount: string;
      x_currency_code: string;
    },
  ): boolean {
    if (!this.custIdCliente || !this.pKey) {
      this.logger.error('EPAYCO_P_CUST_ID_CLIENTE o EPAYCO_P_KEY sin definir: se rechaza la confirmación');
      return false;
    }
    if (!firma || typeof firma !== 'string') return false;

    const cadena = [
      this.custIdCliente,
      this.pKey,
      datos.x_ref_payco,
      datos.x_transaction_id,
      datos.x_amount,
      datos.x_currency_code,
    ].join('^');

    const esperado = createHash('sha256').update(cadena).digest('hex');

    /* Comparación de tiempo constante: un `===` sobre el hash filtra, en el
       tiempo que tarda, cuántos caracteres iniciales coincidían. */
    const a = Buffer.from(esperado, 'utf8');
    const b = Buffer.from(firma.toLowerCase(), 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
