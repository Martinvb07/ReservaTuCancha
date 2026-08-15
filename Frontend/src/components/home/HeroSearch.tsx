'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, MapPin, Calendar, Clock, ChevronDown, ChevronLeft, ChevronRight, Check, Sunrise, Sun, Moon } from 'lucide-react';
import { SPORTS, CITIES, getSport } from '@/lib/constants';
import SportIcon from '@/components/ui/SportIcon';
import CityGlyph, { cityKey } from '@/components/ui/CityGlyph';

type Panel = 'deporte' | 'ciudad' | 'fecha' | 'hora' | null;

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
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-bold text-gray-800 text-sm capitalize">
          {format(new Date(view.y, view.m, 1), 'MMMM yyyy', { locale: es })}
        </span>
        <button type="button" onClick={() => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: (v.m + 1) % 12 }))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>)}
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
}

export default function HeroSearch({ initialSport, initialCity, initialDate, initialTime, mobile = false, onSearch }: HeroSearchProps) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  const [panel, setPanel] = useState<Panel>(mobile ? 'deporte' : null);
  const [sport, setSport] = useState(initialSport ?? '');
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
            className={`rtc-item flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${active ? 'bg-green-50' : 'hover:bg-gray-50'}`}
            style={{ animationDelay: `${i * 35}ms` }}>
            <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
              style={{ background: meta?.bg ?? '#f0fdf4', color: meta?.color ?? '#16a34a' }}>
              <SportIcon sport={o.key || undefined} size={21} stroke={2} />
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
            className={`rtc-item flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${active ? 'bg-green-50' : 'hover:bg-gray-50'}`}
            style={{ animationDelay: `${i * 30}ms` }}>
            <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
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
        className={`rtc-item flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left transition-colors ${time === '' ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
        <span className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
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
          <p className="rtc-item flex items-center gap-1.5 px-1 mb-1.5 text-[11px] font-extrabold uppercase tracking-[.08em] text-gray-400"
            style={{ animationDelay: `${gi * 45}ms` }}>
            <g.Icon className="h-3.5 w-3.5" /> {g.label}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {g.hours.map((t, i) => {
              const active = time === t;
              return (
                <button key={t} type="button"
                  onClick={() => { setTime(t); setPanel(null); }}
                  className={`rtc-item py-2 rounded-lg text-[13px] font-semibold text-center transition-all border ${
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
        <span className={`text-[15px] font-bold truncate text-right capitalize ${filled ? 'text-gray-900' : 'text-gray-400'}`}>{value}</span>
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

  // estilos compartidos — estética de barra única: campo activo con tinte,
  // borde de la barra que se ilumina cuando hay un panel abierto
  const fieldActive = (p: Panel) => (panel === p ? 'bg-green-50' : 'hover:bg-gray-50');
  const fieldLabel = 'block text-[10px] font-extrabold uppercase tracking-[.1em] text-green-600';
  const fieldValue = (filled: boolean) => `block text-sm font-semibold truncate ${filled ? 'text-gray-900' : 'text-gray-500'}`;
  const dropBase = 'rtc-drop absolute z-50 top-[calc(100%+8px)] left-0 w-full min-w-[280px] md:min-w-0 bg-white rounded-2xl overflow-hidden';
  const dropStyle = { border: '1.5px solid #e5e7eb', boxShadow: '0 20px 48px rgba(0,0,0,.14)' };
  const divider = <div className="h-px md:h-auto md:w-px bg-gray-100 md:bg-gray-200 mx-4 md:mx-0 md:my-3 flex-none" />;

  return (
    <div ref={wrapRef} className="text-left">
      {/* ── Barra de búsqueda: horizontal en desktop, apilada en móvil ── */}
      <div
        className="bg-white rounded-2xl flex flex-col md:flex-row md:items-stretch"
        style={{
          border: `1.5px solid ${panel ? '#86efac' : '#e5e7eb'}`,
          boxShadow: panel ? '0 0 0 3px rgba(22,163,74,.10), 0 6px 28px rgba(0,0,0,.10)' : '0 6px 28px rgba(0,0,0,.14)',
          transition: 'border-color .15s, box-shadow .15s',
        }}
      >
        {/* ── DEPORTE ── */}
        <div className="relative flex-1 min-w-0">
          <button type="button" onClick={() => toggle('deporte')}
            className={`w-full h-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors rounded-t-2xl md:rounded-none md:rounded-l-2xl ${fieldActive('deporte')}`}>
            <span className="w-9 h-9 rounded-full bg-green-50 text-green-600 grid place-items-center shrink-0">
              <SportIcon sport={sport || undefined} size={17} />
            </span>
            <span className="flex-1 min-w-0">
              <span className={fieldLabel}>Deporte</span>
              <span className={fieldValue(!!sport)}>{sportLabel}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${panel === 'deporte' ? 'rotate-180' : ''}`} />
          </button>
          {panel === 'deporte' && (
            <div className={`${dropBase} md:w-[320px] md:left-[calc(50%-160px)]`} style={dropStyle}>
              <div className="p-2">{deporteList}</div>
            </div>
          )}
        </div>

        {divider}

        {/* ── UBICACIÓN ── */}
        <div className="relative flex-1 min-w-0">
          <button type="button" onClick={() => toggle('ciudad')}
            className={`w-full h-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${fieldActive('ciudad')}`}>
            <span className="w-9 h-9 rounded-full bg-green-50 text-green-600 grid place-items-center shrink-0">
              <MapPin className="h-[17px] w-[17px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className={fieldLabel}>Ubicación</span>
              <span className={fieldValue(!!city)}>{city || 'Elige tu ciudad'}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${panel === 'ciudad' ? 'rotate-180' : ''}`} />
          </button>
          {panel === 'ciudad' && (
            <div className={`${dropBase} md:w-[320px] md:left-[calc(50%-160px)]`} style={dropStyle}>
              <div className="p-2 max-h-[340px] overflow-y-auto no-scrollbar">{ciudadList}</div>
            </div>
          )}
        </div>

        {divider}

        {/* ── FECHA ── */}
        <div className="relative flex-1 min-w-0">
          <button type="button" onClick={() => toggle('fecha')}
            className={`w-full h-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${fieldActive('fecha')}`}>
            <span className="w-9 h-9 rounded-full bg-green-50 text-green-600 grid place-items-center shrink-0">
              <Calendar className="h-[17px] w-[17px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className={fieldLabel}>Fecha</span>
              <span className={`${fieldValue(!!date)} capitalize`}>{dateLabel}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${panel === 'fecha' ? 'rotate-180' : ''}`} />
          </button>
          {panel === 'fecha' && (
            <div className={`${dropBase} md:w-[300px] md:left-[calc(50%-150px)]`} style={dropStyle}>
              {fechaInner}
            </div>
          )}
        </div>

        {divider}

        {/* ── HORA ── */}
        <div className="relative flex-1 min-w-0">
          <button type="button" onClick={() => toggle('hora')}
            className={`w-full h-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${fieldActive('hora')}`}>
            <span className="w-9 h-9 rounded-full bg-green-50 text-green-600 grid place-items-center shrink-0">
              <Clock className="h-[17px] w-[17px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className={fieldLabel}>Hora</span>
              <span className={fieldValue(!!time)}>{time ? to12h(time) : 'Cualquier hora'}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${panel === 'hora' ? 'rotate-180' : ''}`} />
          </button>
          {panel === 'hora' && (
            <div className={`${dropBase} md:w-[320px] md:left-[calc(50%-160px)]`} style={dropStyle}>
              <div className="p-3 max-h-[440px] overflow-y-auto no-scrollbar">{horaInner}</div>
            </div>
          )}
        </div>

        {/* ── BOTÓN BUSCAR — en desktop: círculo con solo la lupa; se expande a
            píldora con texto cuando ya hay algo seleccionado. En móvil: full-width ── */}
        <div className="p-2 md:p-0 md:flex md:items-center md:pr-2.5 md:pl-1 flex-none">
          <button type="button" onClick={search} aria-label="Buscar canchas"
            className={`w-full md:w-auto flex items-center justify-center gap-2 md:gap-0 bg-green-600 hover:bg-green-700 active:scale-[.98] text-white font-bold text-sm py-3 rounded-xl md:rounded-full transition-all duration-300 ease-out ${ready ? 'px-6 md:px-5 rtc-ready' : 'px-6 md:px-3'}`}>
            <Search className="h-4 w-4 shrink-0" />
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${ready ? 'md:max-w-[130px] md:opacity-100 md:ml-2' : 'md:max-w-0 md:opacity-0'}`}>
              Buscar canchas
            </span>
          </button>
        </div>
      </div>

      {/* ── Indicador de progreso ── */}
      <div className="flex items-center gap-1.5 mt-3 justify-center">
        {[!!sport, !!city, !!date, !!time].map((done, i) => (
          <div key={i} className="h-1 rounded-full transition-all duration-300"
            style={{ width: done ? 22 : 8, background: done ? '#22c55e' : 'rgba(255,255,255,.4)' }} />
        ))}
      </div>
    </div>
  );
}
