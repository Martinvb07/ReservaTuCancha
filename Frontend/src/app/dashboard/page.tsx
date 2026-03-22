import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  CalendarDays, DollarSign, Building2, Users,
  TrendingUp, FileText, Bell, ChevronRight,
  CheckCircle, Clock, XCircle, Plus, BarChart3,
  ArrowUpRight, Zap,
} from 'lucide-react';
import Link from 'next/link';

async function getStats(token: string, role: string) {
  try {
    const endpoint = role === 'admin' ? '/analytics/admin' : '/analytics/owner';
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const token   = (session as any)?.accessToken;
  const role    = (session?.user as any)?.role;
  const name    = session?.user?.name?.split(' ')[0] ?? '';
  const stats   = await getStats(token, role);

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
            { href: '/dashboard/canchas/nueva', label: 'Nueva cancha',  icon: Plus,        color: 'bg-lime-400',   text: 'text-gray-900' },
            { href: '/dashboard/reservas',      label: 'Ver reservas',  icon: CalendarDays,color: 'bg-blue-600',   text: 'text-white'    },
            { href: '/dashboard/analytics',     label: 'Analytics',     icon: BarChart3,   color: 'bg-purple-600', text: 'text-white'    },
            { href: '/dashboard/canchas',       label: 'Mis canchas',   icon: Building2,   color: 'bg-gray-800',   text: 'text-white'    },
          ].map(a => (
            <Link key={a.href} href={a.href} className={`${a.color} ${a.text} rounded-2xl p-5 flex flex-col gap-3 hover:opacity-90 hover:scale-[1.02] transition-all`}>
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><a.icon className="h-5 w-5" /></div>
              <p className="font-black text-base">{a.label}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ── ADMIN (dueño del SaaS) ───────────────────────────────────
  const adminKpis = [
    {
      title: 'Propietarios activos',
      value: stats?.totalOwners ?? 0,
      change: `+${stats?.newOwners ?? 0} este mes`,
      trend: 'up',
      icon: Users,
      color: 'text-blue-600', bg: 'bg-blue-50',
      href: '/dashboard/admin/usuarios',
    },
    {
      title: 'Canchas publicadas',
      value: stats?.totalCourts ?? 0,
      change: 'En toda Colombia',
      trend: 'up',
      icon: Building2,
      color: 'text-purple-600', bg: 'bg-purple-50',
      href: '/dashboard/admin/canchas',
    },
    {
      title: 'Reservas totales',
      value: stats?.totalBookings ?? 0,
      change: '+12% vs mes anterior',
      trend: 'up',
      icon: CalendarDays,
      color: 'text-green-600', bg: 'bg-green-50',
      href: '/dashboard/admin/reportes',
    },
    {
      title: 'Ingresos plataforma',
      value: `$${((stats?.totalRevenue ?? 0)/1000000).toFixed(1)}M`,
      change: 'COP este mes',
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-600', bg: 'bg-emerald-50',
      href: '/dashboard/admin/reportes',
    },
    {
      title: 'Solicitudes pendientes',
      value: stats?.pendingSolicitudes ?? 0,
      change: 'Requieren aprobación',
      trend: stats?.pendingSolicitudes > 0 ? 'warn' : 'neutral',
      icon: FileText,
      color: 'text-orange-600', bg: 'bg-orange-50',
      href: '/dashboard/admin/solicitudes',
    },
    {
      title: 'Suscripciones activas',
      value: stats?.activeSubs ?? 0,
      change: `${stats?.trialSubs ?? 0} en período de prueba`,
      trend: 'up',
      icon: Zap,
      color: 'text-yellow-600', bg: 'bg-yellow-50',
      href: '/dashboard/admin/suscripciones',
    },
  ];

  const quickActions = [
    { href: '/dashboard/admin/solicitudes', label: 'Aprobar solicitudes', desc: 'Nuevos propietarios esperando', icon: FileText,   color: 'bg-lime-400',   text: 'text-gray-900', hot: (stats?.pendingSolicitudes ?? 0) > 0 },
    { href: '/dashboard/admin/usuarios',    label: 'Propietarios',        desc: 'Gestionar cuentas activas',    icon: Users,      color: 'bg-blue-600',   text: 'text-white',    hot: false },
    { href: '/dashboard/admin/suscripciones',label: 'Suscripciones',      desc: 'Planes y pagos',               icon: Zap,        color: 'bg-yellow-500', text: 'text-white',    hot: false },
    { href: '/dashboard/admin/cambios',     label: 'Publicar cambio',     desc: 'Notificar a propietarios',     icon: Bell,       color: 'bg-purple-600', text: 'text-white',    hot: false },
    { href: '/dashboard/admin/reportes',    label: 'Reportes',            desc: 'Métricas globales del SaaS',   icon: BarChart3,  color: 'bg-gray-800',   text: 'text-white',    hot: false },
    { href: '/dashboard/admin/canchas',     label: 'Todas las canchas',   desc: 'Ver y moderar canchas',        icon: Building2,  color: 'bg-teal-600',   text: 'text-white',    hot: false },
  ];

  const recentActivity = [
    { icon: FileText,    color: 'bg-orange-100 text-orange-600', text: 'Nueva solicitud de "Complejo Los Andes"',     time: 'Hace 5 min',   type: 'solicitud' },
    { icon: CheckCircle, color: 'bg-green-100 text-green-600',   text: 'Propietario "Juan García" aprobado',          time: 'Hace 20 min',  type: 'aprobado'  },
    { icon: Building2,   color: 'bg-blue-100 text-blue-600',     text: 'Cancha "Arena Playa Sur" publicada',          time: 'Hace 1 hora',  type: 'cancha'    },
    { icon: DollarSign,  color: 'bg-emerald-100 text-emerald-600',text: 'Nuevo pago de suscripción Pro recibido',     time: 'Hace 2 horas', type: 'pago'      },
    { icon: XCircle,     color: 'bg-red-100 text-red-600',       text: 'Solicitud de "Pádel Club Bogotá" rechazada', time: 'Hace 3 horas', type: 'rechazado' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
            <span>✦</span> Panel SaaS · Dueño
          </p>
          <h1 className="text-3xl font-black text-gray-900 uppercase">Hola, {name} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">
            Vista completa de ReservaTuCancha — {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(stats?.pendingSolicitudes ?? 0) > 0 && (
            <Link href="/dashboard/admin/solicitudes"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <FileText className="h-4 w-4" />
              {stats.pendingSolicitudes} solicitud{stats.pendingSolicitudes > 1 ? 'es' : ''} pendiente{stats.pendingSolicitudes > 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* ── KPIs 6 cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {adminKpis.map((k) => (
          <Link key={k.title} href={k.href}
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-green-200 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-green-500 transition-colors" />
            </div>
            <p className="text-2xl font-black text-gray-900">{k.value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1 leading-tight">{k.title}</p>
            <p className={`text-[10px] mt-1 font-semibold ${k.trend === 'warn' ? 'text-orange-500' : 'text-green-600'}`}>
              {k.change}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Grid principal ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Acciones rápidas — 2/3 */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href}
                className={`${a.color} ${a.text} rounded-2xl p-4 flex flex-col gap-2.5 hover:opacity-90 hover:scale-[1.02] transition-all shadow-sm relative overflow-hidden`}
              >
                {a.hot && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <a.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-black text-sm">{a.label}</p>
                  <p className="text-[11px] opacity-70 mt-0.5 leading-tight">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Actividad reciente — 1/3 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Actividad reciente</h2>
            <Link href="/dashboard/admin/reportes" className="text-xs text-green-600 font-bold hover:underline flex items-center gap-1">
              Ver todo <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 leading-snug">{item.text}</p>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />{item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Estado del sistema ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Estado del sistema</h2>
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Todos los servicios operativos
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'API Backend',      status: 'Operativo', color: 'text-green-600 bg-green-50' },
            { label: 'Base de datos',    status: 'Operativo', color: 'text-green-600 bg-green-50' },
            { label: 'Pagos (Stripe)',   status: 'Operativo', color: 'text-green-600 bg-green-50' },
            { label: 'Emails (SendGrid)',status: 'Operativo', color: 'text-green-600 bg-green-50' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <span className="text-xs font-semibold text-gray-600">{s.label}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.color}`}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}