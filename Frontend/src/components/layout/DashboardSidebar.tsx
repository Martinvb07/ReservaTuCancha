'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  LayoutDashboard, CalendarDays, Building2, BarChart3,
  Users, LogOut, Home, FileText, PenLine,
  CreditCard, Image as ImageIcon, MessageSquare, Zap, Ban,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '@/lib/api/axios';
import { useApiAuth } from '@/hooks/useApiAuth';
import { LOGO_URL } from '@/lib/logo';

type NavItem = { href: string; label: string; icon: any };
type NavSection = { label: string | null; items: NavItem[] };

const ADMIN_SECTIONS: NavSection[] = [
  { label: null, items: [
    { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  ]},
  { label: 'Gestión', items: [
    { href: '/dashboard/admin/usuarios',      label: 'Usuarios',      icon: Users      },
    { href: '/dashboard/admin/suscripciones', label: 'Suscripciones', icon: CreditCard },
    { href: '/dashboard/admin/solicitudes',   label: 'Solicitudes',   icon: FileText   },
  ]},
  { label: 'Sistema', items: [
    { href: '/dashboard/admin/cambios',  label: 'Cambios',  icon: PenLine   },
    { href: '/dashboard/admin/reportes', label: 'Reportes', icon: BarChart3 },
  ]},
];

const OWNER_SECTIONS: NavSection[] = [
  { label: null, items: [
    { href: '/dashboard',                     label: 'Inicio',      icon: LayoutDashboard },
    { href: '/dashboard/propetario/canchas',  label: 'Mis canchas', icon: Building2       },
    { href: '/dashboard/propetario/reservas', label: 'Reservas',    icon: CalendarDays    },
  ]},
  { label: 'Operación', items: [
    { href: '/dashboard/propetario/analytics', label: 'Analytics', icon: BarChart3  },
    { href: '/dashboard/propetario/pagos',     label: 'Pagos',     icon: CreditCard },
    { href: '/dashboard/propetario/bloqueos',  label: 'Bloqueos',  icon: Ban        },
    { href: '/dashboard/propetario/fotos',     label: 'Fotos',     icon: ImageIcon  },
  ]},
  { label: 'Cuenta', items: [
    { href: '/dashboard/propetario/mi-club',     label: 'Mi Club', icon: Building2     },
    { href: '/dashboard/propetario/suscripcion', label: 'Mi Plan', icon: Zap          },
    { href: '/dashboard/propetario/soporte',     label: 'Soporte', icon: MessageSquare },
  ]},
];

const PLAN_CHIP: Record<string, { label: string; color: string }> = {
  basico:      { label: 'Básico',      color: 'bg-slate-200 text-slate-600'   },
  pro:         { label: 'Pro',         color: 'bg-blue-100 text-blue-700'      },
  empresarial: { label: 'Empresarial', color: 'bg-purple-100 text-purple-700' },
};

/* Variantes para la entrada con stagger */
const navContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
};
const navItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

/* ─── Encabezado de sección ─── */
function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 mx-auto h-px w-6 bg-slate-200" />;
  return (
    <p className="mb-1 mt-4 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

/* ─── Link de navegación ─── */
function SidebarLink({ item, active, collapsed, uid }: { item: NavItem; active: boolean; collapsed: boolean; uid: string }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl text-sm font-semibold transition-colors ${
        collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
      } ${
        active ? 'bg-green-50 text-green-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {active && (
        <motion.span
          layoutId={`${uid}-active`}
          className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-to-b from-green-500 to-green-600"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? 'text-green-600' : 'group-hover:scale-110'}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

interface Props {
  role: string;
  userName: string;
  variant?: 'desktop' | 'mobile';
}

export default function DashboardSidebar({ role, userName, variant = 'desktop' }: Props) {
  const pathname = usePathname() || '';
  const sections = role === 'admin' ? ADMIN_SECTIONS : OWNER_SECTIONS;
  const session  = useApiAuth();
  const token    = (session as any)?.accessToken;
  const uid      = useId();

  // El colapso solo aplica en desktop; en el drawer móvil siempre va expandido.
  const [collapsedPref, setCollapsedPref] = useState(false);
  const collapsed = variant === 'mobile' ? false : collapsedPref;

  useEffect(() => {
    if (variant === 'mobile') return;
    if (localStorage.getItem('dash-sidebar-collapsed') === '1') setCollapsedPref(true);
  }, [variant]);

  const toggleCollapse = () =>
    setCollapsedPref(v => {
      const next = !v;
      try { localStorage.setItem('dash-sidebar-collapsed', next ? '1' : '0'); } catch {}
      return next;
    });

  const { data: planInfo } = useQuery<any>({
    queryKey: ['my-plan'],
    queryFn: async () => { const { data } = await api.get('/users/my-plan'); return data; },
    enabled: role === 'owner' && !!token,
    staleTime: 5 * 60 * 1000,
  });

  const chip = planInfo ? (PLAN_CHIP[planInfo.plan] ?? PLAN_CHIP.basico) : null;
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative flex flex-col h-screen overflow-hidden border-r border-slate-100 bg-white shadow-sm shadow-slate-200/40 transition-[width] duration-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex h-16 shrink-0 items-center border-b border-slate-100 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <motion.img
            src={LOGO_URL}
            alt="ReservaTuCancha"
            className="h-10 w-10 shrink-0 object-contain"
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap font-black text-sm tracking-tight text-slate-900"
              >
                Reserva<span className="text-green-600">TuCancha</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Perfil */}
      <div className={`shrink-0 border-b border-slate-100 ${collapsed ? 'flex justify-center py-3' : 'px-4 py-4'}`}>
        {collapsed ? (
          <div title={userName} className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-sm font-black text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-sm font-black text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{userName}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-green-600">
                  {role === 'admin' ? 'Administrador' : 'Propietario'}
                </span>
                {chip && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${chip.color}`}>
                    {chip.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <motion.nav
        variants={navContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3"
      >
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && <SectionLabel collapsed={collapsed}>{section.label}</SectionLabel>}
            <div className="flex flex-col gap-0.5">
              {section.items.map(item => (
                <motion.div key={item.href} variants={navItem}>
                  <SidebarLink item={item} active={isActive(item.href)} collapsed={collapsed} uid={uid} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </motion.nav>

      {/* Footer */}
      <div className="shrink-0 space-y-1 border-t border-slate-100 p-3">
        <Link
          href="/"
          title={collapsed ? 'Ver sitio' : undefined}
          className={`group flex items-center gap-3 rounded-xl text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          <Home className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && 'Ver sitio'}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`group flex w-full items-center gap-3 rounded-xl text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          {!collapsed && 'Cerrar sesión'}
        </button>
        {variant === 'desktop' && (
          <button
            onClick={toggleCollapse}
            title={collapsed ? 'Expandir' : 'Contraer'}
            className={`group hidden w-full items-center gap-3 rounded-xl text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:flex ${
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            {collapsed
              ? <ChevronRight className="h-[18px] w-[18px] shrink-0" />
              : <><ChevronLeft className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" /> Contraer</>}
          </button>
        )}
      </div>
    </motion.aside>
  );
}
