'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, CalendarDays, Building2, BarChart3,
  Users, LogOut, Home, FileText, Plus, UserCheck, PenLine,
  CreditCard, Image, MessageSquare, Zap, Ban,
} from 'lucide-react';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';

const OWNER_LINKS = [
  { href: '/dashboard',                            label: 'Inicio',        icon: LayoutDashboard },
  { href: '/dashboard/propetario/canchas',         label: 'Mis canchas',   icon: Building2       },
  { href: '/dashboard/propetario/reservas',        label: 'Reservas',      icon: CalendarDays    },
  { href: '/dashboard/propetario/analytics',       label: 'Analytics',     icon: BarChart3       },
  { href: '/dashboard/propetario/pagos',           label: 'Pagos',         icon: CreditCard      },
  { href: '/dashboard/propetario/bloqueos',        label: 'Bloqueos',      icon: Ban             },
  { href: '/dashboard/propetario/fotos',           label: 'Fotos',         icon: Image           },
  { href: '/dashboard/propetario/mi-club',         label: 'Mi Club',       icon: Building2       },
  { href: '/dashboard/propetario/suscripcion',     label: 'Mi Plan',       icon: Zap             },
  { href: '/dashboard/propetario/soporte',         label: 'Soporte',       icon: MessageSquare   },
];

const ADMIN_LINKS = [
  { href: '/dashboard',                    label: 'Inicio',      icon: LayoutDashboard },
  { href: '/dashboard/admin/usuarios',     label: 'Usuarios',    icon: Users           },
  { href: '/dashboard/admin/suscripciones', label: 'Suscripciones',     icon: UserCheck},
  { href: '/dashboard/admin/solicitudes',  label: 'Solicitudes', icon: FileText        },
  { href: '/dashboard/admin/cambios',      label: 'Cambios', icon: PenLine         },
  { href: '/dashboard/admin/reportes',     label: 'Reportes',    icon: BarChart3       },
];

const PLAN_CHIP: Record<string, { label: string; color: string }> = {
  basico:      { label: 'Básico',      color: 'bg-gray-700 text-gray-300'    },
  pro:         { label: 'Pro',         color: 'bg-blue-600 text-white'        },
  empresarial: { label: 'Empresarial', color: 'bg-purple-600 text-white'      },
};

interface Props { role: string; userName: string; }

export default function DashboardSidebar({ role, userName }: Props) {
  const pathname = usePathname();
  const links    = role === 'admin' ? ADMIN_LINKS : OWNER_LINKS;
  const session  = useApiAuth();
  const token    = (session as any)?.accessToken;

  const { data: planInfo } = useQuery<any>({
    queryKey: ['my-plan'],
    queryFn: async () => { const { data } = await api.get('/users/my-plan'); return data; },
    enabled: role === 'owner' && !!token,
    staleTime: 5 * 60 * 1000,
  });

  const chip = planInfo ? (PLAN_CHIP[planInfo.plan] ?? PLAN_CHIP.basico) : null;

  return (
    <aside className="w-48 sm:w-64 bg-gray-900 flex flex-col h-screen overflow-hidden">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logos/Logo.png" alt="logo" className="h-8 w-8 object-contain" />
          <span className="font-black text-sm text-white tracking-tight">
            Reserva<span className="text-lime-400">TuCancha</span>
          </span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-lime-400 flex items-center justify-center text-gray-900 font-black text-sm shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{userName}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[9px] font-bold uppercase tracking-widest text-lime-400">
                {role === 'admin' ? 'Administrador' : 'Propietario'}
              </span>
              {chip && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${chip.color}`}>
                  {chip.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 sm:gap-3 px-1.5 sm:px-3 py-1.5 sm:py-2.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-lime-400 text-gray-900'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
    <div className="px-3 py-3 sm:py-4 border-t border-white/10 space-y-1 shrink-0">
      <Link
        href="/"
        className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-400 hover:bg-white/10 hover:text-white transition-all"
      >
        <Home className="h-4 w-4 shrink-0" />
        <span className="truncate">Ver sitio</span>
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="truncate">Cerrar sesión</span>
      </button>
    </div>
    </aside>
  );
}