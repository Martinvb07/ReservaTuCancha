import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  CalendarDays, DollarSign, Building2, Users,
  TrendingUp, FileText, Bell, ChevronRight,
  CheckCircle, Clock, XCircle, Plus, BarChart3,
  ArrowUpRight, Zap, AlertTriangle, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { OwnerHomeWidgets } from '@/components/dashboard/OwnerHomeWidgets';
import { AdminHomeWidgets } from '@/components/dashboard/AdminHomeWidgets';

interface StatsResponse {
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalCourts: number;
  pendingBookings?: number;
  topCourt?: any;
  totalOwners?: number;
  newOwners?: number;
  pendingSolicitudes?: number;
  activeSubs?: number;
  trialSubs?: number;
}

async function getStats(token: string | undefined, role: string): Promise<StatsResponse | null> {
  try {
    if (!token) {
      console.error('❌ No token found');
      return null;
    }

    const endpoint = role === 'admin' ? '/analytics/admin' : '/analytics/owner';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      console.error('❌ NEXT_PUBLIC_API_URL not configured');
      return null;
    }

    const url = `${apiUrl}${endpoint}`;
    
    console.log('🔄 Fetching from:', url);
    console.log('📌 Role:', role);
    
    const res = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    console.log('📊 Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Error ${res.status}:`, errorText);
      return null;
    }

    const data = await res.json();
    console.log('✅ Stats loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Fetch error:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.accessToken;
  const role = (session?.user as any)?.role;
  const name = session?.user?.name?.split(' ')[0] ?? '';
  const stats = await getStats(token, role);

  // ── OWNER ───────────────────────────────────────────────────
  if (role !== 'admin') {
    const kpis = [
      { title: 'Reservas totales',  value: stats?.totalBookings ?? 0,    icon: CalendarDays, color: 'text-blue-600',   bg: 'bg-blue-50'    },
      { title: 'Confirmadas',       value: stats?.confirmedBookings ?? 0, icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50'   },
      { title: 'Ingresos',          value: `$${((stats?.totalRevenue ?? 0)/1000).toFixed(0)}K`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { title: 'Mis canchas',       value: stats?.totalCourts ?? 0,       icon: Building2,    color: 'text-purple-600', bg: 'bg-purple-50'  },
    ];
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1"><span>✦</span> Panel Propietario</p>
          <h1 className="text-3xl font-black text-gray-900 uppercase">Hola, {name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen de tus canchas y reservas</p>
        </div>

        {!stats && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-1">⚠️ No se pudieron cargar los datos</h3>
                <p className="text-amber-700 text-sm">Verifica que el servidor backend esté corriendo en {process.env.NEXT_PUBLIC_API_URL}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.title} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{k.title}</p>
                <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}><k.icon className={`h-4 w-4 ${k.color}`} /></div>
              </div>
              <p className="text-2xl font-black text-gray-900">{k.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/dashboard/propetario/canchas/nueva', label: 'Nueva cancha',  icon: Plus,        color: 'bg-lime-400',   text: 'text-gray-900' },
            { href: '/dashboard/propetario/reservas',      label: 'Ver reservas',  icon: CalendarDays,color: 'bg-blue-600',   text: 'text-white'    },
            { href: '/dashboard/propetario/analytics',     label: 'Analytics',     icon: BarChart3,   color: 'bg-purple-600', text: 'text-white'    },
            { href: '/dashboard/propetario/canchas',       label: 'Mis canchas',   icon: Building2,   color: 'bg-gray-800',   text: 'text-white'    },
          ].map(a => (
            <Link key={a.href} href={a.href} className={`${a.color} ${a.text} rounded-2xl p-5 flex flex-col gap-3 hover:opacity-90 hover:scale-[1.02] transition-all`}>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><a.icon className="h-5 w-5" /></div>
              <p className="font-black text-base">{a.label}</p>
            </Link>
          ))}
        </div>

        {/* ── Widgets dinámicos ── */}
        <OwnerHomeWidgets />
      </div>
    );
  }

  // ── ADMIN (dueño del SaaS) ───────────────────────────────────
  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div>
        <p className="text-lime-600 font-semibold text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Panel Administrador
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Hola, {name} 👋</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Vista completa de ReservaTuCancha — {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <AdminHomeWidgets />
    </div>
  );
}