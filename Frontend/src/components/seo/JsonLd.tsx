/**
 * Datos estructurados (schema.org) para que Google entienda la página y pueda
 * mostrar estrellas, precio y dirección en el resultado.
 *
 * Se escapa `<` para que un texto del club (una reseña, una descripción) no
 * pueda cerrar la etiqueta <script> e inyectar HTML.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
