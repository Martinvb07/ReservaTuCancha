/* Ilustraciones SVG propias por ciudad — estilo "landmark" tipo Airbnb.
   Cada glifo usa una línea de color sólido sobre un relleno tenue del mismo
   tono, para leerse bien dentro de su tile redondeado. */
import type { CSSProperties } from 'react';

type Glyph = (c: string) => React.ReactNode;

/* Claves normalizadas: minúsculas y sin tildes ("Acacías" → "acacias") */
export function cityKey(city: string) {
  return city.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/* stroke = color de marca de la ciudad; fill suave = mismo color al ~18% */
const GLYPHS: Record<string, Glyph> = {
  /* Villavicencio — cordillera, la puerta al llano */
  villavicencio: (c) => (
    <>
      <path d="M6 34 18 16l7 10 5-7 10 15z" fill={c} opacity=".2" />
      <path d="M6 34 18 16l7 10 5-7 10 15" stroke={c} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M15 20.5l3 2.6 2.4-1.8" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 34h34" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  /* Acacías — palma llanera y sol sobre el piedemonte */
  acacias: (c) => (
    <>
      <circle cx="33" cy="15" r="5" fill={c} opacity=".25" />
      <path d="M20 40c0-9 1-16 2-22" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 17c-4-2-8-1-11 2m11-2c4-2 9-1 12 3m-12-3c-2-4-1-8 1-11m-1 11c3-3 7-4 11-3" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 40h32" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  /* Restrepo — casita del piedemonte con montaña detrás */
  restrepo: (c) => (
    <>
      <path d="M27 37 36 24l8 13z" fill={c} opacity=".18" />
      <path d="M27 37 36 24l8 13" stroke={c} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12 23v14h13V23" fill={c} opacity=".18" />
      <path d="M12 23v14h13V23" stroke={c} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M9 24l9.5-8 9.5 8" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 37v-5a2.5 2.5 0 0 1 5 0v5" stroke={c} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M5 37h38" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  /* Bogotá — cerro de Monserrate y skyline */
  bogota: (c) => (
    <>
      <path d="M4 38 15 21l7 11z" fill={c} opacity=".2" />
      <path d="M4 38 15 21l7 11" stroke={c} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M15 21v-4m-2.5 1.5h5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M26 38V19h8v19" fill={c} opacity=".18" />
      <path d="M26 38V19h8v19M37 38V26h7v12" stroke={c} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M29.5 24h1.5m-1.5 5h1.5m-1.5 5h1.5" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 38h40" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  /* Medellín — flor de la Feria de las Flores */
  medellin: (c) => (
    <>
      <circle cx="24" cy="10.5" r="4.5" fill={c} opacity=".2" />
      <circle cx="31.5" cy="15.5" r="4.5" fill={c} opacity=".2" />
      <circle cx="28.8" cy="24" r="4.5" fill={c} opacity=".2" />
      <circle cx="19.2" cy="24" r="4.5" fill={c} opacity=".2" />
      <circle cx="16.5" cy="15.5" r="4.5" fill={c} opacity=".2" />
      <circle cx="24" cy="17.5" r="4" stroke={c} strokeWidth="2.2" />
      <path d="M24 25v13" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 32c-3-.5-5.5-2.5-6.5-5.5" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 38h20" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  /* Cali — sol del valle sobre las colinas de las Tres Cruces */
  cali: (c) => (
    <>
      <circle cx="31" cy="13" r="5" fill={c} opacity=".25" />
      <circle cx="31" cy="13" r="5" stroke={c} strokeWidth="2.2" />
      <path d="M31 4v2.5M31 19.5V22m-9-9h2.5m13 0H40M24.5 6.5l1.8 1.8m11.4-1.8-1.8 1.8" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 37l11-13 8 9 6-6 15 10z" fill={c} opacity=".18" />
      <path d="M4 37l11-13 8 9 6-6 15 10" stroke={c} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
    </>
  ),
  /* Barranquilla — sol caribe sobre las olas del mar */
  barranquilla: (c) => (
    <>
      <path d="M15 24a9 9 0 0 1 18 0z" fill={c} opacity=".25" />
      <path d="M15 24a9 9 0 0 1 18 0" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 8v4M11 11l2.8 2.8M37 11l-2.8 2.8M7 20h4m26 0h4" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 31c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2 2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 38c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2 2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  /* Bucaramanga — árbol de la ciudad de los parques */
  bucaramanga: (c) => (
    <>
      <circle cx="24" cy="17" r="10" fill={c} opacity=".2" />
      <circle cx="24" cy="17" r="10" stroke={c} strokeWidth="2.4" />
      <path d="M24 38V22m0 5-4.5-4.5M24 24l4-4" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 38h24" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  /* Colombia — bandera tricolor ondeando (para "Todas las ciudades").
     Usa los colores reales de la bandera, ignora el color de marca. */
  colombia: () => (
    <>
      <path d="M11 6v36" stroke="#a1887f" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M14 9c9-3.5 17 3.5 26 0v11c-9 3.5-17-3.5-26 0z" fill="#FCD116" />
      <path d="M14 20c9-3.5 17 3.5 26 0v5.5c-9 3.5-17-3.5-26 0z" fill="#003893" />
      <path d="M14 25.5c9-3.5 17 3.5 26 0V31c-9 3.5-17-3.5-26 0z" fill="#CE1126" />
    </>
  ),
  /* Genérico — pin de ubicación (ciudades sin glifo propio) */
  pin: (c) => (
    <>
      <path d="M24 6c-7.2 0-13 5.6-13 12.6C11 28 24 42 24 42s13-14 13-23.4C37 11.6 31.2 6 24 6z" fill={c} opacity=".18" />
      <path d="M24 6c-7.2 0-13 5.6-13 12.6C11 28 24 42 24 42s13-14 13-23.4C37 11.6 31.2 6 24 6z" stroke={c} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="24" cy="18.5" r="4.5" stroke={c} strokeWidth="2.2" />
    </>
  ),
};

interface CityGlyphProps {
  city: string;
  color: string;
  size?: number;
  style?: CSSProperties;
}

export default function CityGlyph({ city, color, size = 26, style }: CityGlyphProps) {
  const glyph = GLYPHS[cityKey(city)] ?? GLYPHS.pin;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style} aria-hidden="true">
      {glyph(color)}
    </svg>
  );
}
