import { randomBytes, randomInt } from 'crypto';

/** Sin ambiguos (0/O, 1/I/L) para que se pueda dictar por telefono. */
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Codigo corto de reserva.
 *
 * Va con `randomInt` y no con `Math.random`: los codigos se le muestran a
 * cualquiera que reserve, asi que con `Math.random` cada codigo entregado seria
 * una muestra del generador, y de ahi se reconstruye su estado interno.
 */
export function generarCodigoReserva(largo = 8): string {
  let codigo = '';
  for (let i = 0; i < largo; i++) {
    codigo += ALFABETO_CODIGO.charAt(randomInt(ALFABETO_CODIGO.length));
  }
  return codigo;
}

/**
 * Clave temporal para un club recien aprobado. Se la mandamos por correo y
 * vive hasta que la cambien, asi que tiene que ser impredecible de verdad.
 */
export function generarPasswordTemporal(): string {
  // 9 bytes en base64url ≈ 12 caracteres, ~72 bits de entropia.
  const base = randomBytes(9).toString('base64url');
  // Garantiza mayuscula, digito y simbolo por si el club valida complejidad.
  return `${base}A1!`;
}
