'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { LOGO_URL } from '@/lib/logo';

const USER_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/empresas', label: 'Canchas' },
  { href: '/mis-reservas', label: 'Mis reservas' },
  { href: '/soporte', label: 'Soporte' },
];

const BIZ_LINKS = [
  { href: '/para-clubes#beneficios', label: 'Beneficios' },
  { href: '/para-clubes#como-funciona', label: 'Cómo funciona' },
  { href: '/para-clubes#faq', label: 'Preguntas' },
];

// ── Switch animado con framer-motion (layoutId) ──────────────────
// La píldora se mueve apenas se toca (estado optimista), sin esperar a que
// termine la navegación: en móvil eso es lo que hace que el cambio se vea fluido.
function ModeToggle({ isBiz, id, className = '', onSelect }: {
  isBiz: boolean; id: string; className?: string; onSelect?: () => void;
}) {
  const [pending, setPending] = useState<boolean | null>(null);
  useEffect(() => { setPending(null); }, [isBiz]);
  const current = pending ?? isBiz;

  const options = [
    { href: '/', label: 'Reservar', biz: false },
    { href: '/para-clubes', label: 'Para clubes', biz: true },
  ];
  return (
    <div className={`relative inline-flex items-center bg-gray-100 rounded-full p-1 ${className}`}>
      {options.map((o) => {
        const active = current === o.biz;
        return (
          <Link key={o.href} href={o.href}
            onClick={() => { setPending(o.biz); onSelect?.(); }}
            className="relative whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold">
            {active && (
              <motion.span
                layoutId={`${id}-mode-pill`}
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className={`relative z-10 transition-colors duration-200 ${active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}>
              {o.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname() || '/';
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isBiz = pathname.startsWith('/para-clubes') || pathname.startsWith('/solicitar-acceso');
  const links = isBiz ? BIZ_LINKS : USER_LINKS;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* El menú móvil se cierra al navegar, salvo cuando el cambio vino del switch
     Reservar / Para clubes: ahí se queda abierto para ver la transición. */
  const keepOpenRef = useRef(false);
  useEffect(() => {
    if (keepOpenRef.current) { keepOpenRef.current = false; return; }
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-3 lg:justify-self-start">
          <img src={LOGO_URL} alt="ReservaTuCancha" className="h-9 w-9 object-contain" />
          <span className="font-black text-xl text-gray-900 tracking-tight hidden sm:block">
            Reserva<span className="text-green-600">TuCancha</span>
          </span>
        </Link>

        {/* Nav: columna central del grid → queda centrada en la mitad real de
            la página (las columnas 1fr laterales son simétricas). "Ingresar"
            vive acá para acompañar el ritmo del menú. */}
        <div className={`hidden lg:flex items-center gap-1 lg:justify-self-center ${isBiz ? 'lg:-translate-x-10' : ''}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.nav
              key={isBiz ? 'biz' : 'user'}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center gap-1"
            >
              {links.map((l) => {
                const base = l.href.split('#')[0];
                const active = l.href === pathname || (base !== '/' && !l.href.includes('#') && pathname.startsWith(base));
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      active ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              {isBiz && !session && (
                <Link
                  href="/auth/login"
                  className="whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                >
                  Ingresar
                </Link>
              )}
            </motion.nav>
          </AnimatePresence>
        </div>

        {/* Acciones (desktop) + botón móvil. justify-self-end en desktop (grid),
            ml-auto en móvil para empujar el botón hamburguesa a la derecha. */}
        <div className="flex items-center gap-3 shrink-0 ml-auto lg:ml-0 lg:justify-self-end">
          <div className="hidden lg:flex items-center gap-3">
          {isBiz && (
            <Link
              href="/solicitar-acceso"
              className="whitespace-nowrap text-sm font-bold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors lg:mr-6"
            >
              Solicitar acceso
            </Link>
          )}

          <ModeToggle isBiz={isBiz} id="desktop" />

          {session && (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-green-600 text-white text-xs font-bold select-none">
                    {session.user?.name?.charAt(0).toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-gray-100 bg-white overflow-hidden"
                  style={{ zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
                >
                  <div className="px-4 py-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {session.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <LayoutDashboard className="h-4 w-4 text-blue-600" />
                      </div>
                      Dashboard
                    </Link>
                    <div className="h-px bg-gray-100 my-2" />
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

          {/* Mobile hamburger — el icono gira y se funde al alternar */}
          <button
            className="lg:hidden relative p-2 h-9 w-9 grid place-items-center rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'close' : 'open'}
                initial={{ opacity: 0, rotate: mobileOpen ? -90 : 90, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: mobileOpen ? 90 : -90, scale: 0.7 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 grid place-items-center"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu — despliegue suave (alto + fade) y contenido escalonado */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.32, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } }}
            className="lg:hidden border-t border-gray-100 bg-white overflow-hidden"
          >
        <div className="px-4 py-4 space-y-3">
          <ModeToggle isBiz={isBiz} id="mobile" className="w-full justify-center flex"
            onSelect={() => { keepOpenRef.current = true; }} />

          {/* Los enlaces cambian con el modo: se cruzan con un fade corto */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isBiz ? 'biz' : 'user'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-1"
            >
              {links.map((l, i) => (
                <motion.div key={l.href}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + i * 0.045, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={l.href} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="h-px bg-gray-100" />

          {isBiz && !session && (
            <Link href="/auth/login" className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 text-center">
              Ingresar
            </Link>
          )}
          {isBiz && (
            <Link href="/solicitar-acceso" className="block px-4 py-2.5 rounded-xl text-sm font-bold bg-green-600 text-white text-center">
              Solicitar acceso
            </Link>
          )}

          {session && (
            <div className="space-y-2">
              <Link href="/dashboard" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
