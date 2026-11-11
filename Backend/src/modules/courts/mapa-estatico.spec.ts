import { PNG } from 'pngjs';
import { aPixeles, armarMapa, MAPA_ALTO, MAPA_ANCHO } from './mapa-estatico';

/** Tesela de un solo color, para poder leer qué quedó en la imagen. */
const tesela = (r: number, g: number, b: number) => {
  const png = new PNG({ width: 256, height: 256 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
};

describe('mapa de los correos', () => {
  // Villavicencio
  const lat = 4.142, lng = -73.6266;

  it('ubica el punto en píxeles de Mercator', () => {
    const { x, y } = aPixeles(0, 0, 0);
    expect(x).toBeCloseTo(128);
    expect(y).toBeCloseTo(128);
  });

  it('arma una imagen del tamaño esperado con el pin verde en el centro', async () => {
    const pedidas: string[] = [];
    const png = PNG.sync.read(
      await armarMapa(lat, lng, async (z, x, y) => {
        pedidas.push(`${z}/${x}/${y}`);
        return tesela(200, 200, 200);
      }),
    );
    expect(png.width).toBe(MAPA_ANCHO);
    expect(png.height).toBe(MAPA_ALTO);
    expect(pedidas.length).toBeGreaterThanOrEqual(3);
    expect(pedidas.every((p) => p.startsWith('16/'))).toBe(true);

    const en = (x: number, y: number) => {
      const i = (png.width * y + x) << 2;
      return [png.data[i], png.data[i + 1], png.data[i + 2]];
    };
    expect(en(5, 5)).toEqual([200, 200, 200]);                       // el mapa
    expect(en(MAPA_ANCHO / 2 + 8, MAPA_ALTO / 2)).toEqual([22, 163, 74]); // el pin
    expect(en(MAPA_ANCHO / 2, MAPA_ALTO / 2)).toEqual([255, 255, 255]);   // su punto
  });

  it('si una tesela falla igual entrega el mapa; si fallan todas, error', async () => {
    let n = 0;
    await expect(
      armarMapa(lat, lng, async () => {
        if (n++ === 0) throw new Error('caída');
        return tesela(10, 10, 10);
      }),
    ).resolves.toBeInstanceOf(Buffer);
    await expect(armarMapa(lat, lng, async () => { throw new Error('caída'); })).rejects.toThrow();
  });
});
