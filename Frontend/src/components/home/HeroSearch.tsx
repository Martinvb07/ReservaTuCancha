'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Clock, ChevronLeft, ChevronRight, Check, Sunrise, Sun, Moon } from 'lucide-react';
import { SPORTS, CITIES, getSport, SPORT_ICONO } from '@/lib/constants';
import SportIcon from '@/components/ui/SportIcon';
import CityGlyph, { cityKey } from '@/components/ui/CityGlyph';

export type Panel = 'deporte' | 'ciudad' | 'fecha' | 'hora' | null;

/* Tile de color + tagline por deporte (mismos tonos que sus chips en constants) */
const SPORT_META: Record<string, { tag: string; bg: string; color: string }> = {
  futbol:      { tag: 'El clásico de siempre',    bg: '#e8f5e9', color: '#2e7d32' },
  padel:       { tag: 'El deporte que más crece', bg: '#e3f2fd', color: '#1565c0' },
  voley_playa: { tag: 'Arena, sol y equipo',      bg: '#fff8e1', color: '#ef6c00' },
};

/* Tile de color + departamento por ciudad (estilo Airbnb) */
const CITY_META: Record<string, { dept: string; bg: string; color: string }> = {
  villavicencio: { dept: 'Meta',            bg: '#e3f2fd', color: '#1565c0' },
  acacias:       { dept: 'Meta',            bg: '#e8f5e9', color: '#2e7d32' },
  restrepo:      { dept: 'Meta',            bg: '#fff8e1', color: '#e65100' },
  bogota:        { dept: 'Cundinamarca',    bg: '#ede7f6', color: '#4527a0' },
  medellin:      { dept: 'Antioquia',       bg: '#fce4ec', color: '#c62828' },
  cali:          { dept: 'Valle del Cauca', bg: '#fff3e0', color: '#ef6c00' },
  barranquilla:  { dept: 'Atlántico',       bg: '#e0f7fa', color: '#00838f' },
  bucaramanga:   { dept: 'Santander',       bg: '#e8f5e9', color: '#1b5e20' },
};

const HOURS = Array.from({ length: 18 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);
const DOW = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/* Franjas del día para el selector de hora (6 horas cada una) */
const HOUR_GROUPS = [
  { label: 'Mañana', Icon: Sunrise, hours: HOURS.slice(0, 6) },  // 6:00 – 11:00
  { label: 'Tarde',  Icon: Sun,     hours: HOURS.slice(6, 12) }, // 12:00 – 5:00 PM
  { label: 'Noche',  Icon: Moon,    hours: HOURS.slice(12) },    // 6:00 – 11:00 PM
];

// Muestra la hora en formato 12h (no militar). Internamente se guarda "HH:mm".
function to12h(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${period}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Mini calendario propio (selección de un día) ─────────────────
function MiniCalendar({ value, onPick }: { value: Date | null; onPick: (d: Date) => void }) {
  const [view, setView] = useState(() => {
    const base = value ?? new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const today = startOfDay(new Date());
  const first = new Date(view.y, view.m, 1);
  const startDow = (first.getDay() + 6) % 7; // semana inicia lunes
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(view.y, view.m, d);
    const past = date < today;
    const selected = !!value && sameDay(date, value);
    const isToday = sameDay(date, today);
    let cls = 'aspect-square grid place-items-center text-[13px] font-semibold rounded-full transition-all ';
    if (past) cls += 'text-gray-300 cursor-not-allowed';
    else if (selected) cls += 'bg-green-600 text-white cursor-pointer rtc-pick';
    else if (isToday) cls += 'border-2 border-green-500 text-green-700 cursor-pointer hover:bg-green-50';
    else cls += 'text-gray-700 cursor-pointer hover:bg-green-50 hover:text-green-700';
    cells.push(
      <div key={d} className={cls} onClick={() => !past && onPick(date)}>
        {d}
      </div>,
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: (v.m + 11) % 12 }))}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-bold text-gray-800 text-sm capitalize">
          {format(new Date(view.y, view.m, 1), 'MMMM yyyy', { locale: es })}
        </span>
        <button type="button" onClick={() => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: (v.m + 1) % 12 }))}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => <div key={d} className="text-center text-[11px] font-bold text-gray-500 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">{cells}</div>
    </div>
  );
}

interface HeroSearchProps {
  initialSport?: string;
  initialCity?: string;
  initialDate?: string; // yyyy-MM-dd
  initialTime?: string; // HH:mm
  /* Versión para el sheet móvil: tarjetas apiladas estilo Airbnb + barra fija
     Limpiar/Buscar. `onSearch` cierra el sheet al buscar. */
  mobile?: boolean;
  onSearch?: () => void;
  /** Avisa cuando se elige un deporte en el buscador (las pestañas del
   *  inicio lo siguen). Si cambia `initialSport` desde afuera, el campo se
   *  actualiza. */
  onSportChange?: (sport: string) => void;
  /** Campo que se abre de entrada (el buscador del navbar abre el que se tocó). */
  initialPanel?: Panel;
}

export default function HeroSearch({ initialSport, initialCity, initialDate, initialTime, mobile = false, onSearch, onSportChange, initialPanel = null }: HeroSearchProps) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  const [panel, setPanel] = useState<Panel>(mobile ? 'deporte' : initialPanel);
  const [sport, setSportInterno] = useState(initialSport ?? '');
  const setSport = (v: string) => {
    setSportInterno(v);
    onSportChange?.(v);
  };
  /* La pestaña de deporte del inicio manda: si cambia, el campo la sigue. */
  useEffect(() => {
    if (initialSport !== undefined) setSportInterno(initialSport);
  }, [initialSport]);
  const [city, setCity] = useState(initialCity ?? '');
  const [date, setDate] = useState<Date | null>(
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? parse(initialDate, 'yyyy-MM-dd', new Date()) : null,
  );
  const [time, setTime] = useState(initialTime ?? '');

  /* Cerrar al hacer clic fuera — solo en desktop. En móvil el buscador vive en
     un sheet propio con su botón de cierre. */
  useEffect(() => {
    if (mobile) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPanel(null);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [mobile]);

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  /* Píldora blanca que se desliza al campo activo (escritorio). Se mide el
     campo y la píldora viaja con transición, en vez de que cada campo
     cambie de fondo de golpe. */
  const barRef = useRef<HTMLDivElement>(null);
  const [pildora, setPildora] = useState<{ left: number; width: number; deslizar: boolean } | null>(null);
  const panelAnterior = useRef<Panel>(null);
  useEffect(() => {
    /* Al abrir desde cerrado la píldora aparece en su campo (solo fundido);
       de un campo a otro se desliza. */
    const venia = panelAnterior.current;
    panelAnterior.current = panel;
    if (mobile || !panel || !barRef.current) return;
    const medir = (deslizar: boolean) => {
      const el = barRef.current?.querySelector<HTMLElement>(`[data-campo="${panel}"]`);
      if (el) setPildora({ left: el.offsetLeft, width: el.offsetWidth, deslizar });
    };
    medir(!!venia);
    const alCambiarTamano = () => medir(false);
    window.addEventListener('resize', alCambiarTamano);
    return () => window.removeEventListener('resize', alCambiarTamano);
  }, [panel, mobile]);
  const ready = !!(sport || city || date || time);

  const search = () => {
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (city) params.set('city', city);
    if (date) params.set('date', format(date, 'yyyy-MM-dd'));
    if (time) params.set('start', time);
    router.push(`/empresas${params.toString() ? `?${params}` : ''}`);
    setPanel(null);
    onSearch?.();
  };

  const sportLabel = sport ? getSport(sport).label : 'Elige tu deporte';
  const dateLabel = date ? format(date, "EEE d 'de' MMM", { locale: es }) : '¿Qué día?';

  // ── Contenido de cada panel — compartido entre los dropdowns de desktop y
  //    las tarjetas del sheet móvil ─────────────────────────────────────────
  const deporteList = (
    <>
      {[{ key: '', label: 'Todos los deportes' }, ...SPORTS.map((s) => ({ key: s.key, label: s.label }))].map((o, i) => {
        const active = sport === o.key;
        const meta = SPORT_META[o.key];
        return (
          <button key={o.key || 'all'} type="button"
            onClick={() => { setSport(o.key); setPanel(city ? null : 'ciudad'); }}
            className={`rtc-item flex items-center gap-3 w-full px-3 py-2.5 rounded-full text-left transition-colors ${active ? 'bg-green-50' : 'hover:bg-gray-50'}`}
            style={{ animationDelay: `${i * 35}ms` }}>
            <span className="w-10 h-10 rounded-full grid place-items-center shrink-0"
              style={{ background: meta?.bg ?? '#f0fdf4' }} aria-hidden>
              {SPORT_ICONO[o.key]
                ? <img src={SPORT_ICONO[o.key]} alt="" width={26} height={26} className="h-[26px] w-[26px]" />
                : <SportIcon sport={o.key || undefined} size={21} stroke={2} />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-sm font-semibold text-gray-800">{o.label}</span>
              <span className="block truncate text-xs text-gray-500">{meta?.tag ?? 'Explora todas las canchas'}</span>
            </span>
            {active && <Check className="h-4 w-4 text-green-600 check-in" />}
          </button>
        );
      })}
    </>
  );

  const ciudadList = (
    <>
      {['', ...CITIES].map((c, i) => {
        const active = city === c;
        const meta = c ? CITY_META[cityKey(c)] : undefined;
        return (
          <button key={c || 'all'} type="button"
            onClick={() => { setCity(c); setPanel('fecha'); }}
            className={`rtc-item flex items-center gap-3 w-full px-3 py-2.5 rounded-full text-left transition-colors ${active ? 'bg-green-50' : 'hover:bg-gray-50'}`}
            style={{ animationDelay: `${i * 30}ms` }}>
            <span className="w-10 h-10 rounded-full grid place-items-center shrink-0"
              style={{ background: meta?.bg ?? '#fff8e1', color: meta?.color ?? '#16a34a' }}>
              <CityGlyph city={c || 'colombia'} color={meta?.color ?? '#16a34a'} size={26} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-sm font-semibold text-gray-800">{c || 'Todas las ciudades'}</span>
              <span className="block truncate text-xs text-gray-500">{meta?.dept ?? 'En toda Colombia'}</span>
            </span>
            {active && <Check className="h-4 w-4 text-green-600 check-in" />}
          </button>
        );
      })}
    </>
  );

  const fechaInner = (
    <>
      <MiniCalendar value={date} onPick={(d) => { setDate(d); setPanel('hora'); }} />
      {date && (
        <div className="px-4 pb-3">
          <button type="button" onClick={() => setDate(null)}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors">
            Limpiar fecha
          </button>
        </div>
      )}
    </>
  );

  const horaInner = (
    <>
      {/* Cualquier hora (fijado arriba) */}
      <button type="button" onClick={() => { setTime(''); setPanel(null); }}
        className={`rtc-item flex items-center justify-between w-full px-3 py-2.5 rounded-full text-left transition-colors ${time === '' ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
        <span className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-green-50 text-green-600 grid place-items-center shrink-0">
            <Clock className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-gray-800">Cualquier hora</span>
        </span>
        {time === '' && <Check className="h-4 w-4 text-green-600 check-in" />}
      </button>

      <div className="h-px bg-gray-100 my-2" />

      {/* Franjas del día con chips de hora (12h) */}
      {HOUR_GROUPS.map((g, gi) => (
        <div key={g.label} className={gi > 0 ? 'mt-3' : ''}>
          <p className="rtc-item flex items-center gap-1.5 px-1 mb-1.5 text-[11px] font-extrabold uppercase tracking-[.08em] text-gray-500"
            style={{ animationDelay: `${gi * 45}ms` }}>
            <g.Icon className="h-3.5 w-3.5" /> {g.label}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {g.hours.map((t, i) => {
              const active = time === t;
              return (
                <button key={t} type="button"
                  onClick={() => { setTime(t); setPanel(null); }}
                  className={`rtc-item py-2 rounded-full text-[13px] font-semibold text-center transition-all border ${
                    active
                      ? 'bg-green-600 border-green-600 text-white rtc-pick'
                      : 'border-gray-200 text-gray-700 hover:border-green-400 hover:bg-green-50 hover:text-green-700'
                  }`}
                  style={{ animationDelay: `${gi * 45 + i * 18}ms` }}>
                  {to12h(t)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  /* ─────────── LAYOUT MÓVIL — estilo Airbnb: la sección activa es una tarjeta
     grande, las demás quedan colapsadas (valor a la derecha) + barra fija
     Limpiar/Buscar ─────────── */
  if (mobile) {
    const clearAll = () => { setSport(''); setCity(''); setDate(null); setTime(''); };
    const cardStyle = { boxShadow: '0 10px 36px rgba(20,14,30,.16)' };
    /* Tarjeta colapsada: etiqueta a la izquierda, valor (bold) a la derecha */
    const collapsed = (p: Panel, label: string, value: string, filled: boolean) => (
      <button type="button" onClick={() => toggle(p)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-white rounded-2xl text-left"
        style={{ boxShadow: '0 2px 16px rgba(20,14,30,.10)' }}>
        <span className="text-[15px] text-gray-500 flex-none">{label}</span>
        <span className={`text-[15px] font-bold truncate text-right capitalize ${filled ? 'text-gray-900' : 'text-gray-500'}`}>{value}</span>
      </button>
    );

    return (
      <div ref={wrapRef} className="flex flex-col gap-3 mobile-search-stack pb-24 text-left">
        {/* ── ¿QUÉ JUEGAS? ── */}
        {panel === 'deporte' ? (
          <div className="bg-white rounded-3xl p-4" style={cardStyle}>
            <h3 className="text-[22px] font-extrabold text-gray-900 mb-3 px-1">¿Qué juegas?</h3>
            {deporteList}
          </div>
        ) : collapsed('deporte', 'Deporte', sportLabel, !!sport)}

        {/* ── ¿DÓNDE? ── */}
        {panel === 'ciudad' ? (
          <div className="bg-white rounded-3xl p-4" style={cardStyle}>
            <h3 className="text-[22px] font-extrabold text-gray-900 mb-3 px-1">¿Dónde?</h3>
            {ciudadList}
          </div>
        ) : collapsed('ciudad', 'Ciudad', city || 'Elige tu ciudad', !!city)}

        {/* ── ¿CUÁNDO? ── */}
        {panel === 'fecha' ? (
          <div className="bg-white rounded-3xl p-2" style={cardStyle}>
            <h3 className="text-[22px] font-extrabold text-gray-900 pt-3 px-4">¿Cuándo?</h3>
            {fechaInner}
          </div>
        ) : collapsed('fecha', 'Fecha', dateLabel, !!date)}

        {/* ── ¿A QUÉ HORA? ── */}
        {panel === 'hora' ? (
          <div className="bg-white rounded-3xl p-4" style={cardStyle}>
            <h3 className="text-[22px] font-extrabold text-gray-900 mb-3 px-1">¿A qué hora?</h3>
            {horaInner}
          </div>
        ) : collapsed('hora', 'Hora', time ? to12h(time) : 'Cualquier hora', !!time)}

        {/* ── Barra fija inferior: Limpiar + Buscar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-[110] flex items-center justify-between px-5 py-3.5 bg-white border-t border-gray-100"
          style={{ boxShadow: '0 -4px 20px rgba(20,14,30,.07)' }}>
          <button type="button" onClick={clearAll} className="text-[15px] font-bold text-gray-900 underline">Limpiar</button>
          <button type="button" onClick={search}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-white font-bold text-[15px] bg-green-600 active:scale-[.98] transition-transform"
            style={{ boxShadow: '0 8px 22px rgba(22,163,74,.42)' }}>
            <Search className="h-[17px] w-[17px]" /> Buscar
          </button>
        </div>
      </div>
    );
  }

  /* Píldora estilo Airbnb: cuatro campos con etiqueta arriba y valor abajo.
     Con un panel abierto la barra se pone gris y el campo activo sube como
     una tarjeta blanca. */
  const field = (p: Panel) =>
    `relative z-[1] w-full h-full flex flex-col justify-center px-7 py-3 text-left rounded-full transition-colors duration-200 ${
      panel === p ? '' : panel ? 'hover:bg-gray-200/70' : 'hover:bg-gray-100'
    }`;
  const fieldLabel = 'block text-xs font-bold text-gray-900';
  const fieldValue = (filled: boolean) => `block text-sm truncate ${filled ? 'font-semibold text-gray-900' : 'text-gray-500'}`;
  const dropBase = 'rtc-drop absolute z-50 top-[calc(100%+12px)] bg-white rounded-[28px] overflow-hidden';
  const dropStyle = { boxShadow: '0 12px 40px rgba(0,0,0,.16)' };
  /* La rayita entre campos se esconde junto al campo activo, como en Airbnb. */
  const divider = (antes: Panel, despues: Panel) => (
    <div className={`w-px my-3.5 flex-none transition-opacity duration-300 ${panel === antes || panel === despues ? 'opacity-0' : 'bg-gray-200'}`} />
  );

  return (
    <div ref={wrapRef} className="text-left">
      <div
        ref={barRef}
        className={`relative flex items-stretch rounded-full border transition-colors duration-300 ${
          panel ? 'bg-gray-100 border-transparent' : 'bg-white border-gray-200'
        }`}
        style={{ boxShadow: '0 3px 12px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)' }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.14)]"
          style={{
            left: pildora?.left ?? 0,
            width: pildora?.width ?? 0,
            opacity: panel && pildora ? 1 : 0,
            transition: pildora?.deslizar
              ? 'left .38s cubic-bezier(.2,.8,.2,1), width .38s cubic-bezier(.2,.8,.2,1), opacity .2s ease'
              : 'opacity .2s ease',
          }}
        />
        {/* ── DEPORTE ── */}
        <div data-campo="deporte" className="relative flex-1 min-w-0">
          <button type="button" onClick={() => toggle('deporte')} className={field('deporte')}>
            <span className={fieldLabel}>Deporte</span>
            <span className={fieldValue(!!sport)}>{sportLabel}</span>
          </button>
          {panel === 'deporte' && (
            <div className={`${dropBase} left-0 w-[340px]`} style={dropStyle}>
              <div className="p-3">{deporteList}</div>
            </div>
          )}
        </div>

        {divider('deporte', 'ciudad')}

        {/* ── UBICACIÓN ── */}
        <div data-campo="ciudad" className="relative flex-1 min-w-0">
          <button type="button" onClick={() => toggle('ciudad')} className={field('ciudad')}>
            <span className={fieldLabel}>Dónde</span>
            <span className={fieldValue(!!city)}>{city || 'Elige tu ciudad'}</span>
          </button>
          {panel === 'ciudad' && (
            <div className={`${dropBase} left-0 w-[340px]`} style={dropStyle}>
              <div className="p-3 max-h-[360px] overflow-y-auto no-scrollbar">{ciudadList}</div>
            </div>
          )}
        </div>

        {divider('ciudad', 'fecha')}

        {/* ── FECHA ── */}
        <div data-campo="fecha" className="relative flex-1 min-w-0">
          <button type="button" onClick={() => toggle('fecha')} className={field('fecha')}>
            <span className={fieldLabel}>Fecha</span>
            <span className={`${fieldValue(!!date)} capitalize`}>{dateLabel}</span>
          </button>
          {panel === 'fecha' && (
            /* Centrado con left y no con translate: la animación rtc-drop usa
               transform y lo pisaba, y el calendario quedaba corrido. */
            <div className={`${dropBase} left-[calc(50%-160px)] w-[320px]`} style={dropStyle}>
              {fechaInner}
            </div>
          )}
        </div>

        {divider('fecha', 'hora')}

        {/* ── HORA + BUSCAR — el botón vive dentro del último campo, como en Airbnb ── */}
        <div data-campo="hora" className="relative flex-[1.25] min-w-0">
          <div className={`${field('hora')} !flex-row items-center gap-2 !pr-2`}>
            <button type="button" onClick={() => toggle('hora')} className="flex-1 min-w-0 text-left">
              <span className={fieldLabel}>Hora</span>
              <span className={fieldValue(!!time)}>{time ? to12h(time) : 'Cualquier hora'}</span>
            </button>
            <button type="button" onClick={search} aria-label="Buscar canchas"
              className={`flex h-12 shrink-0 items-center justify-center rounded-full bg-green-600 font-bold text-sm text-white transition-all duration-300 ease-out hover:bg-green-700 active:scale-95 ${
                ready || panel ? 'px-5' : 'w-12'
              }`}>
              <Search className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
              <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${ready || panel ? 'ml-2 max-w-[80px] opacity-100' : 'max-w-0 opacity-0'}`}>
                Buscar
              </span>
            </button>
          </div>
          {panel === 'hora' && (
            <div className={`${dropBase} right-0 w-[340px]`} style={dropStyle}>
              <div className="p-3 max-h-[440px] overflow-y-auto no-scrollbar">{horaInner}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
