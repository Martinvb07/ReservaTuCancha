/**
 * Escapa un texto para usarlo como literal dentro de una expresion regular.
 *
 * Sin esto, un `?ciudad=` con metacaracteres cambia el sentido de la consulta
 * o la vuelve catastroficamente lenta.
 */
export function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, (m) => '\\' + m);
}
