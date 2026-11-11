/**
 * Precios por horario (misma cuenta que el backend: courts/precios.ts).
 *
 * Una cancha tiene un precio base por hora y, opcional, reglas que lo cambian
 * en ciertos días y horas. El servidor es quien cobra; esto solo sirve para
 * mostrar el precio antes de reservar, y por eso las dos cuentas son iguales.
 */

export interface ReglaPrecio {
  /** 0 = domingo … 6 = sábado */
  days: number[];
  /** "HH:mm" */
  from: string;
  /** "HH:mm". "00:00" es la medianoche del final del día. */
  to: string;
  pricePerHour: number;
  label?: string;
}

export interface CanchaConPrecios {
  pricePerHour: number;
  priceRules?: ReglaPrecio[] | null;
}

const aMin = (hhmm: string): number => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const finDe = (r: ReglaPrecio): number => {
  const fin = aMin(r.to);
  return fin <= aMin(r.from) ? 24 * 60 : fin;
};

/** Precio por hora que rige en un minuto dado de un día de la semana. */
export function precioPorHoraEn(cancha: CanchaConPrecios, diaSemana: number, minuto: number): number {
  for (const r of cancha.priceRules ?? []) {
    if (!r?.days?.includes(diaSemana)) continue;
    if (minuto >= aMin(r.from) && minuto < finDe(r)) return r.pricePerHour;
  }
  return cancha.pricePerHour;
}

/** Lo que vale un turno, sin la tarifa de servicio. */
export function precioTurno(cancha: CanchaConPrecios, diaSemana: number, inicio: string, fin: string): number {
  const ini = aMin(inicio);
  let hasta = aMin(fin);
  if (hasta <= ini) hasta += 24 * 60;
  if (!cancha.priceRules?.length) return Math.round((cancha.pricePerHour * (hasta - ini)) / 60);
  let total = 0;
  for (let m = ini; m < hasta; m++) total += precioPorHoraEn(cancha, diaSemana, m % (24 * 60)) / 60;
  return Math.round(total);
}

/** El precio más bajo y el más alto por hora, para "Desde $X". */
export function rangoPrecios(cancha: CanchaConPrecios): { min: number; max: number; varia: boolean } {
  const todos = [cancha.pricePerHour, ...(cancha.priceRules ?? []).map((r) => r.pricePerHour)];
  const min = Math.min(...todos);
  const max = Math.max(...todos);
  return { min, max, varia: min !== max };
}
