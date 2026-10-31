/**
 * Fila de medios de pago que acepta el checkout de ePayco.
 *
 * Van dibujados en SVG en línea, sin imágenes externas: cargan con el
 * formulario, se ven nítidos en cualquier pantalla y no dependen de que un CDN
 * responda justo cuando el jugador va a pagar.
 */

const chip = 'h-7 min-w-[46px] px-1.5 rounded-md bg-white border border-gray-200 flex items-center justify-center shadow-sm';

function Visa() {
  return (
    <svg viewBox="0 0 48 16" className="h-3" aria-hidden>
      <text x="24" y="13" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900"
        fontStyle="italic" fontSize="15" fill="#1A1F71" letterSpacing="0.5">VISA</text>
    </svg>
  );
}

function Mastercard() {
  return (
    <svg viewBox="0 0 32 20" className="h-4" aria-hidden>
      <circle cx="12" cy="10" r="8" fill="#EB001B" />
      <circle cx="20" cy="10" r="8" fill="#F79E1B" />
      <path d="M16 3.07a8 8 0 0 1 0 13.86 8 8 0 0 1 0-13.86z" fill="#FF5F00" />
    </svg>
  );
}

function Nequi() {
  return (
    <svg viewBox="0 0 44 16" className="h-3.5" aria-hidden>
      <rect x="1" y="2" width="3" height="3" rx="0.5" fill="#DA0081" />
      <text x="25" y="13" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800"
        fontSize="13" fill="#200020">Nequi</text>
    </svg>
  );
}

function Pse() {
  return (
    <svg viewBox="0 0 20 20" className="h-5" aria-hidden>
      <circle cx="10" cy="10" r="9.5" fill="#1B3A6B" />
      <text x="10" y="13" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700"
        fontStyle="italic" fontSize="7.5" fill="#fff">pse</text>
    </svg>
  );
}

function DaviPlata() {
  return (
    <svg viewBox="0 0 58 16" className="h-3" aria-hidden>
      <text x="29" y="12.5" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800"
        fontSize="12" fill="#ED1C27">DaviPlata</text>
    </svg>
  );
}

const MEDIOS = [
  { nombre: 'Visa', Logo: Visa },
  { nombre: 'Mastercard', Logo: Mastercard },
  { nombre: 'Nequi', Logo: Nequi },
  { nombre: 'PSE', Logo: Pse },
  { nombre: 'DaviPlata', Logo: DaviPlata },
];

export default function MediosPago({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className}`} aria-label="Medios de pago aceptados">
      {MEDIOS.map(({ nombre, Logo }) => (
        <li key={nombre} className={chip} title={nombre}>
          <Logo />
          <span className="sr-only">{nombre}</span>
        </li>
      ))}
    </ul>
  );
}
