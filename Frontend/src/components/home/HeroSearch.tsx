'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, MapPin, Calendar, Clock, ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { SPORTS, CITIES, getSport } from '@/lib/constants';
import SportIcon from '@/components/ui/SportIcon';

type Panel = 'deporte' | 'ciudad' | 'fecha' | 'hora' | null;

const HOURS = Array.from({ length: 18 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);
const DOW = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

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
}

export default function HeroSearch({ initialSport, initialCity, initialDate, initialTime }: HeroSearchProps) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  const [panel, setPanel] = useState<Panel>(null);
  const [sport, setSport] = useState(initialSport ?? '');
  const [city, setCity] = useState(initialCity ?? '');
  const [date, setDate] = useState<Date | null>(
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? parse(initialDate, 'yyyy-MM-dd', new Date()) : null,
  );
  const [time, setTime] = useState(initialTime ?? '');

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPanel(null);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

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
  };

  const sportLabel = sport ? getSport(sport).label : 'Elige deporte';
  const dateLabel = date ? format(date, "EEE d 'de' MMM", { locale: es }) : '¿Qué día?';

  // estilos compartidos
  const fieldBase = 'w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all';
  const fieldState = (p: Panel) =>
    panel === p ? 'border-green-500 bg-green-50 ring-2 ring-green-500/15' : 'border-gray-200 bg-white hover:border-green-300';
  const dropBase = 'rtc-drop absolute z-50 top-[calc(100%+8px)] left-0 w-full min-w-[260px] bg-white rounded-2xl border border-gray-100 overflow-hidden';
  const dropShadow = { boxShadow: '0 20px 48px rgba(0,0,0,.14)' };

  return (
    <div ref={wrapRef} className="text-left">
      <div className="bg-white rounded-2xl p-2.5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* ── DEPORTE ── */}
          <div className="relative">
            <button type="button" onClick={() => toggle('deporte')} className={`${fieldBase} ${fieldState('deporte')}`}>
              <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
                <SportIcon sport={sport || undefined} size={17} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-green-600">Deporte</span>
                <span className={`block text-sm font-semibold truncate ${sport ? 'text-gray-900' : 'text-gray-400'}`}>{sportLabel}</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${panel === 'deporte' ? 'rotate-180' : ''}`} />
            </button>
            {panel === 'deporte' && (
              <div className={dropBase} style={dropShadow}>
                <div className="p-2">
                  {[{ key: '', label: 'Todos los deportes' }, ...SPORTS.map((s) => ({ key: s.key, label: s.label }))].map((o, i) => {
                    const active = sport === o.key;
                    return (
                      <button key={o.key || 'all'} type="button"
                        onClick={() => { setSport(o.key); setPanel(city ? null : 'ciudad'); }}
                        className={`rtc-item flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${active ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                        style={{ animationDelay: `${i * 35}ms` }}>
                        <span className="w-9 h-9 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
                          <SportIcon sport={o.key || undefined} size={18} />
                        </span>
                        <span className="flex-1 text-sm font-semibold text-gray-800">{o.label}</span>
                        {active && <Check className="h-4 w-4 text-green-600 check-in" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── CIUDAD ── */}
          <div className="relative">
            <button type="button" onClick={() => toggle('ciudad')} className={`${fieldBase} ${fieldState('ciudad')}`}>
              <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
                <MapPin className="h-[17px] w-[17px]" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-green-600">Ciudad</span>
                <span className={`block text-sm font-semibold truncate ${city ? 'text-gray-900' : 'text-gray-400'}`}>{city || 'Elige ciudad'}</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${panel === 'ciudad' ? 'rotate-180' : ''}`} />
            </button>
            {panel === 'ciudad' && (
              <div className={dropBase} style={dropShadow}>
                <div className="p-2 max-h-[280px] overflow-y-auto">
                  {['', ...CITIES].map((c, i) => {
                    const active = city === c;
                    return (
                      <button key={c || 'all'} type="button"
                        onClick={() => { setCity(c); setPanel('fecha'); }}
                        className={`rtc-item flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${active ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                        style={{ animationDelay: `${i * 30}ms` }}>
                        <span className="w-9 h-9 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <span className="flex-1 text-sm font-semibold text-gray-800">{c || 'Todas las ciudades'}</span>
                        {active && <Check className="h-4 w-4 text-green-600 check-in" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── FECHA ── */}
          <div className="relative">
            <button type="button" onClick={() => toggle('fecha')} className={`${fieldBase} ${fieldState('fecha')}`}>
              <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
                <Calendar className="h-[17px] w-[17px]" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-green-600">Fecha</span>
                <span className={`block text-sm font-semibold truncate capitalize ${date ? 'text-gray-900' : 'text-gray-400'}`}>{dateLabel}</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${panel === 'fecha' ? 'rotate-180' : ''}`} />
            </button>
            {panel === 'fecha' && (
              <div className={dropBase} style={dropShadow}>
                <MiniCalendar value={date} onPick={(d) => { setDate(d); setPanel('hora'); }} />
                {date && (
                  <div className="px-4 pb-3">
                    <button type="button" onClick={() => setDate(null)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                      Limpiar fecha
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── HORA ── */}
          <div className="relative">
            <button type="button" onClick={() => toggle('hora')} className={`${fieldBase} ${fieldState('hora')}`}>
              <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 grid place-items-center shrink-0">
                <Clock className="h-[17px] w-[17px]" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-green-600">Hora</span>
                <span className={`block text-sm font-semibold truncate ${time ? 'text-gray-900' : 'text-gray-400'}`}>{time ? to12h(time) : 'Cualquier hora'}</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${panel === 'hora' ? 'rotate-180' : ''}`} />
            </button>
            {panel === 'hora' && (
              <div className={dropBase} style={dropShadow}>
                <div className="p-2 max-h-[280px] overflow-y-auto">
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

                  <div className="h-px bg-gray-100 my-1" />

                  {/* Lista de horas (12h) */}
                  {HOURS.map((t, i) => {
                    const active = time === t;
                    return (
                      <button key={t} type="button"
                        onClick={() => { setTime(t); setPanel(null); }}
                        className={`rtc-item flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left transition-colors ${active ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                        style={{ animationDelay: `${Math.min(i, 10) * 22}ms` }}>
                        <span className={`text-sm font-semibold ${active ? 'text-green-700' : 'text-gray-800'}`}>{to12h(t)}</span>
                        {active && <Check className="h-4 w-4 text-green-600 check-in" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTÓN BUSCAR ── */}
        <button type="button" onClick={search}
          className={`mt-2 w-full flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-300 active:scale-[.99] text-gray-900 font-bold py-3 rounded-xl transition-all ${ready ? 'rtc-ready' : ''}`}>
          <Search className="h-4 w-4" /> Buscar canchas
        </button>
      </div>

      {/* ── Indicador de progreso ── */}
      <div className="flex items-center gap-1.5 mt-3 justify-center">
        {[!!sport, !!city, !!date, !!time].map((done, i) => (
          <div key={i} className="h-1 rounded-full transition-all duration-300"
            style={{ width: done ? 22 : 8, background: done ? '#84cc16' : 'rgba(255,255,255,.4)' }} />
        ))}
      </div>
    </div>
  );
}
