import { calcularOcupacion } from './ocupacion';

// 2026-11-02 es lunes.
const lunes = new Date(2026, 10, 2);
const cancha = { availability: [{ dayOfWeek: 1, openTime: '18:00', closeTime: '22:00', slotDurationMinutes: 60 }] };

describe('calcularOcupacion', () => {
  it('cuenta la capacidad del horario y lo reservado por hora', () => {
    const r = calcularOcupacion({
      canchas: new Map([['c1', cancha]]),
      reservas: [{ courtId: 'c1', date: lunes, startTime: '19:00', endTime: '21:00' }],
      bloqueos: [],
      desde: lunes,
      dias: 7,
    });
    expect(r.total).toEqual({ capacidad: 4, ocupado: 2, pct: 50 });
    expect(r.celdas.find((c) => c.hora === 19)).toMatchObject({ dia: 1, capacidad: 1, ocupado: 1, pct: 100 });
    expect(r.celdas.find((c) => c.hora === 18)).toMatchObject({ pct: 0 });
    expect(r.porDia[1]).toMatchObject({ nombre: 'Lun', pct: 50 });
    expect(r.porDia[2]).toMatchObject({ capacidad: 0, pct: 0 });
    expect(r.horasVacias[0].pct).toBe(0);
    expect(r.horasPico[0]).toMatchObject({ pct: 100 });
  });

  it('reparte un turno que cruza la hora entre las dos franjas', () => {
    const r = calcularOcupacion({
      canchas: new Map([['c1', cancha]]),
      reservas: [{ courtId: 'c1', date: lunes, startTime: '18:30', endTime: '19:30' }],
      bloqueos: [],
      desde: lunes,
      dias: 1,
    });
    expect(r.celdas.find((c) => c.hora === 18)?.pct).toBe(50);
    expect(r.celdas.find((c) => c.hora === 19)?.pct).toBe(50);
  });

  it('lo bloqueado sale de la capacidad', () => {
    const r = calcularOcupacion({
      canchas: new Map([['c1', cancha]]),
      reservas: [],
      bloqueos: [{ courtId: 'c1', date: lunes, startTime: '20:00', endTime: '22:00' }],
      desde: lunes,
      dias: 1,
    });
    expect(r.total.capacidad).toBe(2);
  });

  it('suma varias semanas y varias canchas', () => {
    const r = calcularOcupacion({
      canchas: new Map([['c1', cancha], ['c2', cancha]]),
      reservas: [
        { courtId: 'c1', date: lunes, startTime: '18:00', endTime: '19:00' },
        { courtId: 'c2', date: new Date(2026, 10, 9), startTime: '18:00', endTime: '19:00' },
      ],
      bloqueos: [],
      desde: lunes,
      dias: 14,
    });
    expect(r.celdas.find((c) => c.hora === 18)).toMatchObject({ capacidad: 4, ocupado: 2, pct: 50 });
    expect(r.total.capacidad).toBe(16);
  });
});
