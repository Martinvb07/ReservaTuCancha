import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Como se reparte la plata de una reserva.
 *
 * Todos los montos quedan congelados en la reserva al crearla: si manana sube
 * la tarifa de ePayco, lo que ya se cobro y lo que se le debe al club no se
 * mueve.
 */
export interface DesgloseCobro {
  /** Lo que vale el turno segun el precio de lista del club */
  precioCancha: number;
  /** Lo que se le suma al jugador por usar la plataforma */
  tarifaServicio: number;
  /** Lo que el jugador paga en el checkout, y sobre lo que cobra ePayco */
  totalPagado: number;
  /** Lo que se queda la pasarela (ya con IVA) */
  costoPasarela: number;
  /** Lo que le queda limpio a ReservaTuCancha */
  gananciaPlataforma: number;
  /** Lo que ePayco le consigna al club por esta reserva */
  netoDueno: number;
}

/**
 * Modelo de cobro.
 *
 * Al jugador se le suma una tarifa fija ($2.000) sin importar lo que cueste la
 * cancha, y de lo recaudado salen primero la pasarela y despues la ganancia
 * fija de la plataforma ($2.250). El club recibe el resto.
 *
 * El efecto practico es que la comision real del club baja a medida que sube
 * el ticket: en una cancha de $50.000 ronda el 5,4% y en una de $120.000 el
 * 4,1%, porque la tarifa del jugador cubre casi todo el costo de la pasarela.
 *
 * Todo vive en el entorno porque son numeros de negocio: una tarifa nueva de
 * Davivienda no deberia obligar a desplegar.
 */
@Injectable()
export class CobrosService {
  private readonly logger = new Logger(CobrosService.name);

  constructor(private readonly config: ConfigService) {}

  /** Lee una env numerica, con rango, y cae al valor por defecto si viene mal. */
  private num(clave: string, pordefecto: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    const raw = Number(this.config.get(clave));
    if (!Number.isFinite(raw) || raw < min || raw > max) return pordefecto;
    return raw;
  }

  /** Tarifa de servicio que paga el jugador, fija por reserva. */
  get tarifaServicio(): number {
    return Math.round(this.num('TARIFA_SERVICIO_JUGADOR', 2000, 0, 100_000));
  }

  /** Lo que la plataforma se queda limpio por reserva, despues de la pasarela. */
  get gananciaPlataforma(): number {
    return Math.round(this.num('GANANCIA_PLATAFORMA', 2250, 0, 100_000));
  }

  /* ── Tarifa de ePayco (Davivienda) ──────────────────────────────────── */

  /** Porcentaje sobre el total cobrado, antes de IVA. */
  get pasarelaPorcentaje(): number {
    return this.num('EPAYCO_TARIFA_PORCENTAJE', 2.64, 0, 100);
  }

  /** Fijo por transaccion, antes de IVA. */
  get pasarelaFijo(): number {
    return this.num('EPAYCO_TARIFA_FIJA', 690, 0, 100_000);
  }

  /** IVA que ePayco le suma a su propia tarifa. */
  get pasarelaIva(): number {
    return this.num('EPAYCO_TARIFA_IVA', 19, 0, 100);
  }

  /**
   * Lo que cobra ePayco por mover `total` pesos.
   *
   *   costo = (total x porcentaje + fijo) x (1 + IVA)
   *
   * Con los valores por defecto, $62.000 cuestan $2.769 y $122.000 cuestan
   * $4.654, que es lo que factura Davivienda por el canal.
   */
  costoPasarela(total: number): number {
    const base = (total * this.pasarelaPorcentaje) / 100 + this.pasarelaFijo;
    return Math.round(base * (1 + this.pasarelaIva / 100));
  }

  /**
   * Lo que la plataforma tiene que recibir en un pago dividido para que le
   * queden `ganancia` pesos limpios.
   *
   * En el split ePayco cobra por separado: al club, porcentaje + fijo sobre lo
   * que recibe; al comercio principal, solo el porcentaje (con IVA) sobre su
   * parte. Por eso nuestra parte se infla lo justo para cubrir esa comisión:
   *
   *   bruto = ganancia / (1 - porcentaje x (1 + IVA))
   *
   * Con los valores por defecto, $2.250 limpios piden $2.323 en bruto. Si el
   * club tiene cuenta Davivienda, lo que le llega es el mismo neto del
   * desglose: el fijo se cobra una sola vez, igual que en un cobro normal.
   */
  brutoPlataformaSplit(ganancia: number): number {
    const tasa = (this.pasarelaPorcentaje / 100) * (1 + this.pasarelaIva / 100);
    return Math.round(ganancia / (1 - tasa));
  }

  /**
   * Reparte una reserva entre pasarela, plataforma y club.
   *
   * Si la cancha es tan barata que no alcanza a cubrir pasarela + ganancia, la
   * plataforma cede primero: nunca se le gira un neto negativo al club.
   */
  desglosar(precioCancha: number): DesgloseCobro {
    const tarifaServicio = this.tarifaServicio;
    const totalPagado = Math.round(precioCancha) + tarifaServicio;
    const costoPasarela = this.costoPasarela(totalPagado);

    const repartible = totalPagado - costoPasarela;
    const gananciaPlataforma = Math.max(0, Math.min(this.gananciaPlataforma, repartible));
    const netoDueno = repartible - gananciaPlataforma;

    if (gananciaPlataforma < this.gananciaPlataforma) {
      this.logger.warn(
        `Cancha de $${precioCancha}: la pasarela se come casi todo, la ganancia baja a $${gananciaPlataforma}`,
      );
    }

    return {
      precioCancha: Math.round(precioCancha),
      tarifaServicio,
      totalPagado,
      costoPasarela,
      gananciaPlataforma,
      netoDueno,
    };
  }

  /**
   * Desglose de una reserva fija: varias fechas que se pagan en un solo cobro.
   *
   * Cada fecha lleva su tarifa de servicio y su ganancia, igual que si se
   * reservara suelta. La pasarela, en cambio, cobra una sola vez sobre el
   * total (un solo fijo por transacción), así que su costo real se reparte
   * entre las fechas en proporción a lo que vale cada una. Lo que se ahorra en
   * fijos le queda al club, y las partes de cada fecha siguen sumando exacto
   * lo que se le cobró por ella.
   */
  desglosarSerie(precios: number[]): DesgloseCobro[] {
    const base = precios.map((p) => this.desglosar(p));
    if (base.length <= 1) return base;

    const total = base.reduce((s, d) => s + d.totalPagado, 0);
    const costoReal = this.costoPasarela(total);

    let asignado = 0;
    return base.map((d, i) => {
      const ultima = i === base.length - 1;
      const costoPasarela = ultima
        ? costoReal - asignado
        : total > 0 ? Math.round((costoReal * d.totalPagado) / total) : 0;
      asignado += costoPasarela;

      const repartible = d.totalPagado - costoPasarela;
      const gananciaPlataforma = Math.max(0, Math.min(this.gananciaPlataforma, repartible));
      return {
        ...d,
        costoPasarela,
        gananciaPlataforma,
        netoDueno: repartible - gananciaPlataforma,
      };
    });
  }

  /**
   * Lo que el club deja de recibir frente a su precio de lista, en plata y en
   * porcentaje. Es el numero que le interesa al dueno, no la tarifa nominal.
   */
  comisionEfectiva(desglose: DesgloseCobro): { monto: number; porcentaje: number } {
    const monto = desglose.precioCancha - desglose.netoDueno;
    const porcentaje = desglose.precioCancha > 0
      ? Math.round((monto / desglose.precioCancha) * 10000) / 100
      : 0;
    return { monto, porcentaje };
  }

  /** Lo que el front necesita para pintar el desglose antes de reservar. */
  get publico() {
    return {
      tarifaServicio: this.tarifaServicio,
    };
  }
}
