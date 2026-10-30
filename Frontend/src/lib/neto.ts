/**
 * Lo que le llega al club por una reserva: el total menos la pasarela y la
 * parte de la plataforma. El panel del dueño muestra esto, no lo que pagó el
 * jugador, porque la tarifa de servicio y la comisión nunca son plata suya.
 *
 * Las reservas anteriores al cambio a ePayco no traen el desglose; para ellas
 * se muestra el total, que es lo que el panel mostraba entonces.
 */
export function netoDueno(b: { netoDueno?: number; totalPrice?: number } | null | undefined): number {
  return b?.netoDueno ?? b?.totalPrice ?? 0;
}
