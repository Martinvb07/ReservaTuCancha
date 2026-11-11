import { PNG } from 'pngjs';

/**
 * Mapa fijo de una ubicación, para los correos.
 *
 * Un correo no puede cargar un mapa interactivo, así que se arma una imagen:
 * se bajan las teselas públicas de OpenStreetMap que cubren el punto, se
 * recortan centradas en él y se les pinta el pin encima. Todo en JS puro
 * (pngjs), sin librerías nativas que compliquen el despliegue.
 *
 * Las imágenes quedan en memoria: una cancha no se mueve, y así casi nunca
 * se le vuelve a pedir nada a OpenStreetMap.
 */

const TESELA = 256;
const ZOOM = 16;
export const MAPA_ANCHO = 600;
export const MAPA_ALTO = 280;

const USER_AGENT = 'ReservaTuCancha/1.0 (+https://reservatucancha.site)';
const TESELAS_URL = 'https://tile.openstreetmap.org';

export type BajarTesela = (z: number, x: number, y: number) => Promise<Buffer>;

const bajarDeOsm: BajarTesela = async (z, x, y) => {
  const res = await fetch(`${TESELAS_URL}/${z}/${x}/${y}.png`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Tesela ${z}/${x}/${y}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

/** Posición del punto en píxeles del mapa mundial (proyección de Mercator). */
export function aPixeles(lat: number, lng: number, zoom = ZOOM): { x: number; y: number } {
  const escala = TESELA * 2 ** zoom;
  const seno = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * escala,
    y: (0.5 - Math.log((1 + seno) / (1 - seno)) / (4 * Math.PI)) * escala,
  };
}

/** Pinta un círculo con borde suavizado. */
function circulo(img: PNG, cx: number, cy: number, radio: number, [r, g, b]: number[], opacidad = 1) {
  for (let y = Math.floor(cy - radio - 1); y <= cy + radio + 1; y++) {
    for (let x = Math.floor(cx - radio - 1); x <= cx + radio + 1; x++) {
      if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const a = Math.max(0, Math.min(1, radio - d + 0.5)) * opacidad;
      if (a <= 0) continue;
      const i = (img.width * y + x) << 2;
      img.data[i] = Math.round(img.data[i] * (1 - a) + r * a);
      img.data[i + 1] = Math.round(img.data[i + 1] * (1 - a) + g * a);
      img.data[i + 2] = Math.round(img.data[i + 2] * (1 - a) + b * a);
      img.data[i + 3] = 255;
    }
  }
}

export async function armarMapa(lat: number, lng: number, bajar: BajarTesela = bajarDeOsm): Promise<Buffer> {
  const centro = aPixeles(lat, lng);
  const x0 = Math.round(centro.x - MAPA_ANCHO / 2);
  const y0 = Math.round(centro.y - MAPA_ALTO / 2);
  const salida = new PNG({ width: MAPA_ANCHO, height: MAPA_ALTO });
  salida.data.fill(235); // gris claro si alguna tesela falla

  const maxTesela = 2 ** ZOOM;
  const pendientes: Promise<void>[] = [];
  for (let ty = Math.floor(y0 / TESELA); ty <= Math.floor((y0 + MAPA_ALTO - 1) / TESELA); ty++) {
    for (let tx = Math.floor(x0 / TESELA); tx <= Math.floor((x0 + MAPA_ANCHO - 1) / TESELA); tx++) {
      if (ty < 0 || ty >= maxTesela) continue;
      const txReal = ((tx % maxTesela) + maxTesela) % maxTesela;
      pendientes.push(
        bajar(ZOOM, txReal, ty).then((buf) => {
          const tesela = PNG.sync.read(buf);
          /* Recorte de la tesela que cae dentro de la imagen. */
          const dx = tx * TESELA - x0;
          const dy = ty * TESELA - y0;
          const sx = Math.max(0, -dx);
          const sy = Math.max(0, -dy);
          const ancho = Math.min(tesela.width - sx, MAPA_ANCHO - Math.max(0, dx));
          const alto = Math.min(tesela.height - sy, MAPA_ALTO - Math.max(0, dy));
          if (ancho > 0 && alto > 0) {
            PNG.bitblt(tesela, salida, sx, sy, ancho, alto, Math.max(0, dx), Math.max(0, dy));
          }
        }),
      );
    }
  }
  const resultados = await Promise.allSettled(pendientes);
  if (resultados.every((r) => r.status === 'rejected')) {
    throw new Error('No se pudo bajar ninguna tesela del mapa');
  }

  /* El pin: sombra, borde blanco, verde de la marca y punto blanco. */
  const px = MAPA_ANCHO / 2;
  const py = MAPA_ALTO / 2;
  circulo(salida, px, py + 3, 17, [0, 0, 0], 0.18);
  circulo(salida, px, py, 15, [255, 255, 255]);
  circulo(salida, px, py, 11.5, [22, 163, 74]);
  circulo(salida, px, py, 4, [255, 255, 255]);

  return PNG.sync.write(salida);
}

/* ── Caché en memoria ─────────────────────────────────────────────────── */

const cache = new Map<string, Buffer>();
const MAX_EN_CACHE = 300;

export async function mapaDe(lat: number, lng: number, bajar?: BajarTesela): Promise<Buffer> {
  const clave = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const ya = cache.get(clave);
  if (ya) return ya;
  const img = await armarMapa(lat, lng, bajar);
  if (cache.size >= MAX_EN_CACHE) cache.delete(cache.keys().next().value as string);
  cache.set(clave, img);
  return img;
}
