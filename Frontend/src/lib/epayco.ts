/**
 * Checkout de ePayco en el navegador.
 *
 * Lo usan el formulario de reserva de la web y la página /pagar, a la que
 * llega la app: el checkout es un script de navegador y la app no lo puede
 * cargar, así que abre esa página con el id de la sesión ya creada.
 */

const EPAYCO_SDK = 'https://checkout.epayco.co/checkout-v2.js';

/**
 * Carga el checkout de ePayco una sola vez y resuelve cuando está listo.
 *
 * Se trae bajo demanda, al pulsar "pagar", para no arrastrar un script de
 * terceros en cada visita a la ficha de una cancha.
 */
export function cargarEpayco(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.ePayco) { resolve(w.ePayco); return; }

    const existente = document.querySelector<HTMLScriptElement>(`script[src="${EPAYCO_SDK}"]`);
    const script = existente ?? document.createElement('script');

    script.addEventListener('load', () => {
      if (w.ePayco) resolve(w.ePayco);
      else reject(new Error('El checkout no cargó bien'));
    });
    script.addEventListener('error', () => reject(new Error('No se pudo cargar el checkout')));

    if (!existente) {
      script.src = EPAYCO_SDK;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}
