import { redirect } from 'next/navigation';

// La ruta canónica de detalle de cancha es /canchas/[id].
// Mantenemos /empresas/[id] como redirect para no romper enlaces antiguos.
export default function EmpresaCourtRedirect({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === 'string') qs.set(k, v);
  }
  const query = qs.toString();
  redirect(`/canchas/${params.id}${query ? `?${query}` : ''}`);
}
