import { precioTurno, precioPorHoraEn, rangoPrecios } from './precios';

describe('precios por horario', () => {
  const base = { pricePerHour: 60000 };
  const conReglas = {
    pricePerHour: 60000,
    priceRules: [
      { days: [1, 2, 3, 4, 5], from: '18:00', to: '00:00', pricePerHour: 90000, label: 'Noche' },
      { days: [0, 6], from: '06:00', to: '00:00', pricePerHour: 100000, label: 'Fin de semana' },
    ],
  };

  it('sin reglas cobra el precio base prorrateado', () => {
    expect(precioTurno(base, 2, '09:00', '10:00')).toBe(60000);
    expect(precioTurno(base, 2, '09:00', '10:30')).toBe(90000);
  });

  it('aplica la regla del día y la hora', () => {
    expect(precioTurno(conReglas, 2, '19:00', '20:00')).toBe(90000);
    expect(precioTurno(conReglas, 2, '10:00', '11:00')).toBe(60000);
    expect(precioTurno(conReglas, 6, '10:00', '11:00')).toBe(100000);
  });

  it('un turno que cruza de franja cobra cada parte a lo suyo', () => {
    // 17:30–18:30 un martes: media hora a 60.000 y media a 90.000
    expect(precioTurno(conReglas, 2, '17:30', '18:30')).toBe(75000);
  });

  it('"00:00" como fin es la medianoche, también en el turno', () => {
    expect(precioTurno(conReglas, 2, '23:00', '00:00')).toBe(90000);
    expect(precioPorHoraEn(conReglas, 2, 23 * 60 + 59)).toBe(90000);
  });

  it('si dos reglas se pisan gana la primera', () => {
    const c = {
      pricePerHour: 50000,
      priceRules: [
        { days: [5], from: '18:00', to: '22:00', pricePerHour: 80000 },
        { days: [5], from: '20:00', to: '23:00', pricePerHour: 120000 },
      ],
    };
    expect(precioTurno(c, 5, '20:00', '21:00')).toBe(80000);
    expect(precioTurno(c, 5, '22:00', '23:00')).toBe(120000);
  });

  it('rangoPrecios da el más bajo y el más alto', () => {
    expect(rangoPrecios(base)).toEqual({ min: 60000, max: 60000 });
    expect(rangoPrecios(conReglas)).toEqual({ min: 60000, max: 100000 });
  });
});
