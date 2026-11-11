import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OwnerHome from '@/components/dashboard/OwnerHome';
import { AdminHomeWidgets } from '@/components/dashboard/AdminHomeWidgets';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const name = session?.user?.name?.split(' ')[0] ?? '';

  // ── OWNER (y su equipo) ─────────────────────────────────────
  /* Todo sale de las reservas, que también las ve recepción: el inicio no
     depende de /analytics/owner, que el rol de recepción no puede consultar. */
  if (role !== 'admin') {
    return <OwnerHome nombre={name} />;
  }

  // ── ADMIN (dueño del SaaS) ───────────────────────────────────
  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div>
        <p className="text-lime-600 font-semibold text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          Panel Administrador
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">Hola, {name}</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Vista completa de ReservaTuCancha — {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <AdminHomeWidgets />
    </div>
  );
}