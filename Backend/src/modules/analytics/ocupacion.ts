/**
 * Ocupación de las canchas por día de la semana y hora.
 *
 * La capacidad sale del horario de atención de cada cancha (los turnos que se
 * podían vender ese día) menos lo que el club bloqueó; lo ocupado, de las
 * reservas activas. Todo se cuenta en minutos y se reparte por hora de reloj,
 * así un turno de 18:30 a 19:30 suma media hora a las 18 y media a las 19.
 */

export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export interface CanchaHorario {
  availability?: { dayOfWeek: number; openTime: string; closeTime: string; slotDurationMinutes?: number }[];
}

export interface TramoOcupado {
  courtId: string;
  /** Medianoche local del día. */
  date: Date;
  startTime: string;
  endTime: string;
}

export interface Celda {
  dia: number;
  hora: number;
  /** Horas que se podían vender en esa franja en todo el período. */
  capacidad: number;
  /** Horas reservadas en esa franja. */
  ocupado: number;
  /** 0 a 100. */
  pct: number;
}

const aMin = (hhmm: string) => {
  const [h, m] = String(hhmm ?? '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const claveDia = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Suma los minutos de [ini, fin) a cada hora de reloj que tocan. */
function repartir(destino: number[], ini: number, fin: number) {
  for (let t = Math.max(0, ini); t < Math.min(fin, 24 * 60);) {
    const hora = Math.floor(t / 60);
    const corte = Math.min(fin, (hora + 1) * 60);
    destino[hora] += corte - t;
    t = corte;
  }
}

const pct = (ocupado: number, capacidad: number) =>
  capacidad > 0 ? Math.round((Math.min(ocupado, capacidad) / capacidad) * 1000) / 10 : 0;
const horas = (min: number) => Math.round((min / 60) * 10) / 10;

export function calcularOcupacion(params: {
  canchas: Map<string, CanchaHorario>;
  reservas: TramoOcupado[];
  bloqueos: TramoOcupado[];
  /** Primer día del período (medianoche local). */
  desde: Date;
  dias: number;
}) {
  const { canchas, reservas, bloqueos, desde, dias } = params;
  const capacidad = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const ocupado = Array.from({ length: 7 }, () => new Array(24).fill(0));

  const porDia = (lista: TramoOcupado[]) => {
    const m = new Map<string, TramoOcupado[]>();
    for (const t of lista) {
      const k = `${t.courtId}|${claveDia(new Date(t.date))}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    }
    return m;
  };
  const reservasDia = porDia(reservas);
  const bloqueosDia = porDia(bloqueos);

  for (let i = 0; i < dias; i++) {
    const dia = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i);
    const semana = dia.getDay();

    for (const [courtId, cancha] of canchas) {
      const horario = (cancha.availability ?? []).find((a) => a.dayOfWeek === semana);
      if (!horario) continue;
      const abre = aMin(horario.openTime);
      const cierra = aMin(horario.closeTime);
      if (cierra <= abre) continue;

      const k = `${courtId}|${claveDia(dia)}`;
      const vendible = new Array(24).fill(0);
      repartir(vendible, abre, cierra);
      /* Lo bloqueado no se podía vender: sale de la capacidad. */
      for (const b of bloqueosDia.get(k) ?? []) {
        const quitar = new Array(24).fill(0);
        repartir(quitar, Math.max(abre, aMin(b.startTime)), Math.min(cierra, aMin(b.endTime)));
        for (let h = 0; h < 24; h++) vendible[h] = Math.max(0, vendible[h] - quitar[h]);
      }
      for (let h = 0; h < 24; h++) capacidad[semana][h] += vendible[h];

      for (const r of reservasDia.get(k) ?? []) repartir(ocupado[semana], aMin(r.startTime), aMin(r.endTime));
    }
  }

  const celdas: Celda[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (!capacidad[d][h] && !ocupado[d][h]) continue;
      celdas.push({
        dia: d,
        hora: h,
        capacidad: horas(capacidad[d][h]),
        ocupado: horas(Math.min(ocupado[d][h], capacidad[d][h] || ocupado[d][h])),
        pct: pct(ocupado[d][h], capacidad[d][h]),
      });
    }
  }

  const sumar = (filtro: (c: Celda) => boolean) => {
    const sel = celdas.filter(filtro);
    const cap = sel.reduce((a, c) => a + c.capacidad, 0);
    const ocu = sel.reduce((a, c) => a + Math.min(c.ocupado, c.capacidad), 0);
    return { capacidad: Math.round(cap * 10) / 10, ocupado: Math.round(ocu * 10) / 10, pct: pct(ocu, cap) };
  };

  const horasConCapacidad = [...new Set(celdas.filter((c) => c.capacidad > 0).map((c) => c.hora))].sort((a, b) => a - b);

  return {
    celdas,
    porHora: horasConCapacidad.map((h) => ({ hora: h, ...sumar((c) => c.hora === h) })),
    porDia: DIAS_SEMANA.map((nombre, d) => ({ dia: d, nombre, ...sumar((c) => c.dia === d) })),
    total: sumar(() => true),
    /* Las franjas que más se quedan vacías: candidatas a promoción. */
    horasVacias: celdas
      .filter((c) => c.capacidad > 0)
      .sort((a, b) => a.pct - b.pct || b.capacidad - a.capacidad)
      .slice(0, 5)
      .map((c) => ({ ...c, nombre: DIAS_SEMANA[c.dia] })),
    horasPico: celdas
      .filter((c) => c.capacidad > 0 && c.ocupado > 0)
      .sort((a, b) => b.pct - a.pct || b.ocupado - a.ocupado)
      .slice(0, 5)
      .map((c) => ({ ...c, nombre: DIAS_SEMANA[c.dia] })),
  };
}
