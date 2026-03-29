'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, LogOut, User, ChevronDown, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen]             = useState(false);
  const [deportesOpen, setDeportesOpen]             = useState(false);
  const [reservasOpen, setReservasOpen]             = useState(false);
  const [mobileOpen, setMobileOpen]                 = useState(false);
  const [mobileDeportesOpen, setMobileDeportesOpen] = useState(false);
  const [mobileReservasOpen, setMobileReservasOpen] = useState(false);

  const userMenuRef  = useRef<HTMLDivElement>(null);
  const deportesRef  = useRef<HTMLDivElement>(null);
  const reservasRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (deportesRef.current && !deportesRef.current.contains(e.target as Node)) {
        setDeportesOpen(false);
      }
      if (reservasRef.current && !reservasRef.current.contains(e.target as Node)) {
        setReservasOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const DEPORTES = [
    { href: '/empresas?sport=futbol',      label: 'Fútbol',      emoji: '⚽', desc: 'Canchas de 7, 9 y 11' },
    { href: '/empresas?sport=padel',       label: 'Pádel',       emoji: '🎾', desc: 'Techadas y al aire libre' },
    { href: '/empresas?sport=voley_playa', label: 'Voley Playa', emoji: '🏐', desc: 'Canchas de arena' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src="/logos/Logo.png" alt="logo" className="h-9 w-9 object-contain" />
            <span className="font-black text-xl text-gray-900 tracking-tight hidden sm:block">
              Reserva<span className="text-green-600">TuCancha</span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">

            <Link href="/" className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">
              Inicio
            </Link>

            {/* Reservas dropdown */}
            <div ref={reservasRef} className="relative">
              <button
                onClick={() => setReservasOpen(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  reservasOpen ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Reservas
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${reservasOpen ? 'rotate-180 text-green-600' : ''}`} />
              </button>
              {reservasOpen && (
                <div className="absolute left-0 mt-2 w-60 rounded-2xl border border-gray-100 bg-white overflow-hidden" style={{ zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
                  <div className="p-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">Mis reservas</p>
                    <Link href="/mis-reservas" onClick={() => setReservasOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-green-100 transition-colors">📋</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Ver mis reservas</p>
                        <p className="text-xs text-gray-400">Busca por tu email</p>
                      </div>
                    </Link>
                    <Link href="/reservas/cancelar" onClick={() => setReservasOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-red-100 transition-colors">❌</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Cancelar reserva</p>
                        <p className="text-xs text-gray-400">Con tu link de cancelación</p>
                      </div>
                    </Link>
                    <Link href="/resena" onClick={() => setReservasOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-yellow-100 transition-colors">⭐</div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Dejar reseña</p>
                        <p className="text-xs text-gray-400">Con tu link de reseña</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Deportes dropdown */}
            <div ref={deportesRef} className="relative">
              <button
                onClick={() => setDeportesOpen(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  deportesOpen ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Deportes
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${deportesOpen ? 'rotate-180 text-green-600' : ''}`} />
              </button>

              {deportesOpen && (
                <div
                  className="absolute left-0 mt-2 w-72 rounded-2xl border border-gray-100 bg-white overflow-hidden"
                  style={{ zIndex: 9999, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
                >
                  <div className="p-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
                      Elige tu deporte
                    </p>
                    {DEPORTES.map(d => (
                      <Link
                        key={d.href}
                        href={d.href}
                        onClick={() => setDeportesOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-green-100 transition-colors">
                          {d.emoji}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{d.label}</p>
                          <p className="text-xs text-gray-400">{d.desc}</p>
                        </div>
                        <ChevronDown className="ml-auto h-3.5 w-3.5 text-gray-300 -rotate-90 group-hover:text-green-500 transition-colors" />
                      </Link>
                    ))}
                    <div className="h-px bg-gray-100 my-2" />
                    <Link
                      href="/empresas"
                      onClick={() => setDeportesOpen(false)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                    >
                      Ver todas las canchas →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/soporte" className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">
              Soporte
            </Link>

            <Link href="/que-ofrecemos" className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">
              Qué Ofrecemos
            </Link>

          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link
              href="/solicitar-acceso"
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-50 border border-gray-200 transition-all"
            >
              Solicitar acceso
            </Link>

            {session ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-green-600 text-white text-xs font-bold select-none">
                      {session.user?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-gray-800 max-w-[90px] truncate">
                    {session.user?.name?.split(' ')[0]}
                  </span>
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
            ) : (
              <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 rounded-xl h-9">
                <Link href="/auth/login">
                  <User className="mr-1.5 h-4 w-4" />
                  Ingresar
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Inicio
            </Link>
            <button onClick={() => setMobileReservasOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Reservas
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileReservasOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileReservasOpen && (
              <div className="ml-4 space-y-1 border-l-2 border-green-100 pl-4">
                <Link href="/mis-reservas" onClick={() => { setMobileOpen(false); setMobileReservasOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  📋 Ver mis reservas
                </Link>
                <Link href="/reservas/cancelar" onClick={() => { setMobileOpen(false); setMobileReservasOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  ❌ Cancelar reserva
                </Link>
                <Link href="/resena" onClick={() => { setMobileOpen(false); setMobileReservasOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                  ⭐ Dejar reseña
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileDeportesOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Deportes
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileDeportesOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileDeportesOpen && (
              <div className="ml-4 space-y-1 border-l-2 border-green-100 pl-4">
                {DEPORTES.map(d => (
                  <Link
                    key={d.href}
                    href={d.href}
                    onClick={() => { setMobileOpen(false); setMobileDeportesOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    <span>{d.emoji}</span> {d.label}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/soporte" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Soporte
            </Link>

            <Link href="/que-ofrecemos" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Qué Ofrecemos
            </Link>

            <div className="h-px bg-gray-100 my-2" />
            <Link href="/solicitar-acceso" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 border border-gray-200 text-center">
              Solicitar acceso
            </Link>
            {!session && (
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-bold bg-green-600 text-white text-center mt-1">
                Ingresar
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}