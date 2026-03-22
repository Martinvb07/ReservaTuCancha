import Link from 'next/link';
import { MapPin, Mail, Phone, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logos/Logo.png" alt="logo" className="h-9 w-9 object-contain" />
              <span className="font-black text-lg tracking-tight">
                Reserva<span className="text-lime-400">TuCancha</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              La forma más fácil de reservar canchas deportivas en Colombia. Fútbol, Pádel y Voley Playa.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-lime-400 shrink-0" />
              Colombia 🇨🇴
            </div>
            {/* Redes */}
            <div className="flex gap-3 pt-1">
              {[
                { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
                { icon: Facebook,  href: 'https://facebook.com',  label: 'Facebook'  },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-lime-400 hover:text-gray-900 flex items-center justify-center transition-all group"
                  aria-label={label}>
                  <Icon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Deportes */}
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-300">Deportes</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/empresas?sport=futbol',      label: '⚽ Fútbol'      },
                { href: '/empresas?sport=padel',       label: '🎾 Pádel'       },
                { href: '/empresas?sport=voley_playa', label: '🏐 Voley Playa' },
                { href: '/empresas',                   label: '🏟️ Ver todas'   },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-gray-400 hover:text-lime-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-300">Empresa</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/que-ofrecemos',    label: 'Qué ofrecemos'    },
                { href: '/soporte',          label: 'Soporte'          },
                { href: '/solicitar-acceso', label: 'Solicitar acceso' },
                { href: '/mis-reservas',     label: 'Mis reservas'     },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-gray-400 hover:text-lime-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Contacto */}
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase tracking-widest text-gray-300">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/terminos',   label: 'Términos de uso'      },
                { href: '/privacidad', label: 'Política de privacidad' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-gray-400 hover:text-lime-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-2 space-y-2">
              <h4 className="font-black text-sm uppercase tracking-widest text-gray-300">Contacto</h4>
              <a href="mailto:soporte@reservatucancha.co"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-lime-400 transition-colors">
                <Mail className="h-3.5 w-3.5 shrink-0" /> soporte@reservatucancha.co
              </a>
              <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-lime-400 transition-colors">
                <Phone className="h-3.5 w-3.5 shrink-0" /> +57 300 123 4567
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} ReservaTuCancha · Hecho con ❤️ en Colombia
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terminos" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Términos</Link>
            <Link href="/privacidad" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}