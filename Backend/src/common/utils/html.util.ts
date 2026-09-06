/**
 * Escapa texto que viene del usuario antes de meterlo en el HTML de un correo.
 *
 * El nombre y las notas de una reserva los escribe cualquiera desde el
 * formulario publico, y esos correos los abre el dueno del club. Sin escapar,
 * un nombre como `<a href="...">Actualiza tu cuenta</a>` llega como un enlace
 * de verdad dentro de un correo legitimo nuestro.
 */
export function escapeHtml(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
