"use client";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import api from '@/lib/api/axios';

import DashboardShell from '@/components/layout/DashboardShell';
import RealtimeNotifications from '@/components/dashboard/RealtimeNotifications';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Inyectar token en axios una sola vez para todo el dashboard
  // Evita 401s en páginas que hacen llamadas API antes de montar useApiAuth
  useEffect(() => {
    if ((session as any)?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${(session as any).accessToken}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [session]);

  /* Esqueleto con la forma del panel (menú a la izquierda y tarjetas) en vez
     de una pantalla negra con una ruedita: al cargar la sesión el panel
     aparece donde ya se lo esperaba. */
  if (status === "loading") return (
    <div className="flex h-screen bg-gray-50" aria-busy="true" aria-label="Cargando el panel">
      <div className="hidden lg:flex w-64 shrink-0 flex-col gap-3 border-r border-slate-200 bg-white p-4">
        <div className="h-9 w-36 rounded-xl bg-slate-100 animate-pulse" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 sm:p-8 space-y-4">
        <div className="h-8 w-48 rounded-xl bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white border border-gray-100 animate-pulse" />
      </div>
    </div>
  );

  if (!session) {
    router.replace("/auth/login");
    return null;
  }

  const role = (session.user as any).role;
  return (
    <DashboardShell
      sidebarRole={role}
      sidebarUserName={session.user?.name ?? ''}
    >
      {children}
      <RealtimeNotifications />
    </DashboardShell>
  );
}