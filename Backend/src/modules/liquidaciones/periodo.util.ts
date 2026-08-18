// src/modules/liquidaciones/periodo.util.ts
//
// Semanas de liquidación.
//
// El corte es el domingo a las 12:00 del mediodía (hora Colombia) y el giro se
// hace el lunes a las 2:00 PM, cuando Wompi ya dispersó al banco lo cobrado
// durante la semana. Lo que se agende después del corte entra al periodo
// siguiente, así que los periodos son contiguos: no hay reservas huérfanas.

/** Colombia no tiene horario de verano: el desfase con UTC es fijo. */
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Día y hora del corte, hora Colombia. 0 = domingo. */
export const CORTE_DIA_SEMANA = 0;
export const CORTE_HORA = 12;

/** Hora del lunes en la que se giran las transferencias. */
export const GIRO_HORA = 14;

export interface Periodo {
  /** Inicio inclusive (instante UTC) */
  inicio: Date;
  /** Fin exclusive (instante UTC) */
  fin: Date;
  /** Lunes a las 2:00 PM siguiente al corte: cuándo se gira */
  giro: Date;
}

/** Reloj de pared colombiano expresado como Date cuyos campos UTC son la hora local. */
function aHoraLocal(instante: Date): Date {
  return new Date(instante.getTime() - BOGOTA_OFFSET_MS);
}

function aUTC(horaLocal: Date): Date {
  return new Date(horaLocal.getTime() + BOGOTA_OFFSET_MS);
}

/** Último corte (domingo 12:00) ocurrido en o antes del instante dado. */
function corteAnterior(instante: Date): Date {
  const local = aHoraLocal(instante);

  const corte = new Date(local);
  corte.setUTCHours(CORTE_HORA, 0, 0, 0);
  // Retroceder hasta el domingo de esa misma semana
  corte.setUTCDate(corte.getUTCDate() - ((corte.getUTCDay() - CORTE_DIA_SEMANA + 7) % 7));

  // Si el corte calculado todavía no ha pasado, el vigente es el de la semana anterior
  if (corte.getTime() > local.getTime()) corte.setUTCDate(corte.getUTCDate() - 7);

  return aUTC(corte);
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * 24 * 60 * 60 * 1000);
}

/** Construye el periodo que arranca en un corte dado. */
function desdeCorte(inicio: Date): Periodo {
  const fin = sumarDias(inicio, 7);

  /* El giro es el lunes siguiente al cierre, a las 2 PM. `fin` cae domingo al
     mediodía, así que el lunes es el día siguiente. */
  const giroLocal = aHoraLocal(fin);
  giroLocal.setUTCDate(giroLocal.getUTCDate() + 1);
  giroLocal.setUTCHours(GIRO_HORA, 0, 0, 0);

  return { inicio, fin, giro: aUTC(giroLocal) };
}

/** Periodo en curso: el que todavía no cierra. */
export function periodoActual(ahora: Date = new Date()): Periodo {
  return desdeCorte(corteAnterior(ahora));
}

/** Periodo ya cerrado más reciente: el que toca girar este lunes. */
export function periodoAnterior(ahora: Date = new Date()): Periodo {
  return desdeCorte(sumarDias(corteAnterior(ahora), -7));
}

/** Los N periodos ya cerrados, del más reciente al más antiguo. */
export function periodosCerrados(cantidad: number, ahora: Date = new Date()): Periodo[] {
  const base = corteAnterior(ahora);
  return Array.from({ length: cantidad }, (_, i) => desdeCorte(sumarDias(base, -7 * (i + 1))));
}

/** El periodo que contiene una fecha cualquiera (para ubicar una reserva). */
export function periodoDe(fecha: Date): Periodo {
  return desdeCorte(corteAnterior(fecha));
}

/** "13 ene – 19 ene" para mostrar el rango sin repetir el año. */
export function etiquetaPeriodo(periodo: Periodo): string {
  const fmt = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
  });
  // `fin` es exclusivo: el último día del periodo es el instante anterior
  const ultimoDia = new Date(periodo.fin.getTime() - 1);
  return `${fmt.format(periodo.inicio)} – ${fmt.format(ultimoDia)}`;
}
