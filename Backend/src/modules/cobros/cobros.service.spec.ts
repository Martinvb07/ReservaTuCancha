import { CobrosService } from './cobros.service';
import { configCon } from '../../test-utils/config';

describe('CobrosService', () => {
  const cobros = new CobrosService(configCon());

  describe('con las tarifas por defecto', () => {
    it('cobra la pasarela como (total x 2,64% + $690) + IVA', () => {
      // Los dos ejemplos que factura Davivienda (ver el comentario del servicio).
      expect(cobros.costoPasarela(62_000)).toBe(2_769);
      expect(cobros.costoPasarela(122_000)).toBe(4_654);
    });

    it('reparte una cancha de $60.000 entre pasarela, plataforma y club', () => {
      const d = cobros.desglosar(60_000);
      expect(d).toEqual({
        precioCancha: 60_000,
        tarifaServicio: 2_000,
        totalPagado: 62_000,
        costoPasarela: 2_769,
        gananciaPlataforma: 2_250,
        netoDueno: 56_981,
      });
    });

    it('las tres partes suman siempre lo que paga el jugador', () => {
      for (const precio of [0, 1_000, 15_000, 45_500, 80_000, 250_000, 1_000_000]) {
        const d = cobros.desglosar(precio);
        expect(d.costoPasarela + d.gananciaPlataforma + d.netoDueno).toBe(d.totalPagado);
      }
    });

    it('redondea los precios prorrateados con decimales', () => {
      const d = cobros.desglosar(37_499.6);
      expect(d.precioCancha).toBe(37_500);
      expect(d.totalPagado).toBe(39_500);
    });

    it('en una cancha muy barata cede la plataforma y el club nunca queda en negativo', () => {
      const d = cobros.desglosar(500);
      expect(d.netoDueno).toBeGreaterThanOrEqual(0);
      expect(d.gananciaPlataforma).toBeLessThan(2_250);
      expect(d.costoPasarela + d.gananciaPlataforma + d.netoDueno).toBe(d.totalPagado);
    });

    it('infla la parte de la plataforma en el split para cubrir su comisión', () => {
      expect(cobros.brutoPlataformaSplit(2_250)).toBe(2_323);
    });

    it('calcula la comisión efectiva que pierde el club frente a su precio', () => {
      const efectiva = cobros.comisionEfectiva(cobros.desglosar(60_000));
      expect(efectiva.monto).toBe(3_019);
      expect(efectiva.porcentaje).toBeCloseTo(5.03, 2);
      expect(cobros.comisionEfectiva(cobros.desglosar(0)).porcentaje).toBe(0);
    });

    it('solo expone la tarifa del jugador al front', () => {
      expect(cobros.publico).toEqual({ tarifaServicio: 2_000 });
    });
  });

  describe('con tarifas en el entorno', () => {
    it('usa los valores del entorno', () => {
      const c = new CobrosService(configCon({
        TARIFA_SERVICIO_JUGADOR: '3000',
        GANANCIA_PLATAFORMA: '1000',
        EPAYCO_TARIFA_PORCENTAJE: '0',
        EPAYCO_TARIFA_FIJA: '0',
        EPAYCO_TARIFA_IVA: '0',
      }));
      expect(c.desglosar(50_000)).toEqual({
        precioCancha: 50_000,
        tarifaServicio: 3_000,
        totalPagado: 53_000,
        costoPasarela: 0,
        gananciaPlataforma: 1_000,
        netoDueno: 52_000,
      });
    });

    it('ignora valores fuera de rango o que no son números', () => {
      const c = new CobrosService(configCon({
        TARIFA_SERVICIO_JUGADOR: 'dos mil',
        GANANCIA_PLATAFORMA: '-5',
        EPAYCO_TARIFA_PORCENTAJE: '150',
      }));
      expect(c.tarifaServicio).toBe(2_000);
      expect(c.gananciaPlataforma).toBe(2_250);
      expect(c.pasarelaPorcentaje).toBe(2.64);
    });
  });
});
