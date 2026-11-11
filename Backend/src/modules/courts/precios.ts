/**
 * Precios por horario.
 *
 * Una cancha tiene un precio base por hora y, opcional, reglas que lo cambian
 * en ciertos días y horas (la noche, el fin de semana). El turno se cobra
 * minuto a minuto: si cruza de una franja a otra, cada parte vale lo suyo.
 *
 * Es una función pura a propósito: la misma cuenta la repiten la web y la app
 * para mostrar el precio antes de reservar, y el servidor es quien manda.
 */

export interface ReglaPrecio {
  /** Días en que aplica: 0 = domingo … 6 = sábado. */
  days: number[];
  /** Desde qué hora, "HH:mm". */
  from: string;
  /** Hasta qué hora, "HH:mm". "00:00" es la medianoche del final del día. */
  to: string;
  pricePerHour: number;
  /** Nombre que le puso el club: "Noche", "Fin de semana". */
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

/** Fin de una franja: "00:00" (o cualquier fin que no supere al inicio) es el cierre del día. */
const finDe = (regla: ReglaPrecio): number => {
  const fin = aMin(regla.to);
  return fin <= aMin(regla.from) ? 24 * 60 : fin;
};

/** Precio por hora que rige en un minuto dado de un día de la semana. */
export function precioPorHoraEn(cancha: CanchaConPrecios, diaSemana: number, minuto: number): number {
  for (const r of cancha.priceRules ?? []) {
    if (!r?.days?.includes(diaSemana)) continue;
    if (minuto >= aMin(r.from) && minuto < finDe(r)) return r.pricePerHour;
  }
  return cancha.pricePerHour;
}

/**
 * Lo que vale un turno, sin la tarifa de servicio.
 *
 * Si dos reglas se pisan gana la primera de la lista, que es el orden en que
 * el club las ve en su panel.
 */
export function precioTurno(
  cancha: CanchaConPrecios,
  diaSemana: number,
  inicio: string | number,
  fin: string | number,
): number {
  const ini = typeof inicio === 'number' ? inicio : aMin(inicio);
  let hasta = typeof fin === 'number' ? fin : aMin(fin);
  if (hasta <= ini) hasta += 24 * 60; // turno que termina a medianoche
  if (!cancha.priceRules?.length) {
    return Math.round((cancha.pricePerHour * (hasta - ini)) / 60);
  }
  let total = 0;
  for (let m = ini; m < hasta; m++) {
    total += precioPorHoraEn(cancha, diaSemana, m % (24 * 60)) / 60;
  }
  return Math.round(total);
}

/** El precio más bajo y el más alto por hora de la cancha, para "Desde $X". */
export function rangoPrecios(cancha: CanchaConPrecios): { min: number; max: number } {
  const todos = [cancha.pricePerHour, ...(cancha.priceRules ?? []).map((r) => r.pricePerHour)];
  return { min: Math.min(...todos), max: Math.max(...todos) };
}
