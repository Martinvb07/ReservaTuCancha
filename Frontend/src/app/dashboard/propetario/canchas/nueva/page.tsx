'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Building2, MapPin, DollarSign, Clock, Loader2, Plus, CheckCircle2, Users } from 'lucide-react';
import Link from 'next/link';
import { courtsApi } from '@/lib/api/courts.api';

const schema = z.object({
  name:            z.string().min(3, 'Mínimo 3 caracteres'),
  description:     z.string().max(300).optional(),
  sport:           z.enum(['futbol', 'padel', 'voley_playa'], { required_error: 'Selecciona un deporte' }),
  futbolModalidad: z.enum(['futbol_5', 'futbol_7', 'futbol_11']).optional(),
  address:         z.string().min(5, 'Ingresa la dirección'),
  city:            z.string().min(2, 'Ingresa la ciudad'),
  department:      z.string().min(2, 'Ingresa el departamento'),
  pricePerHour:    z.coerce.number().min(1000, 'Precio mínimo $1.000 COP'),
  currency:        z.string().default('COP'),
}).refine(d => !(d.sport === 'futbol' && !d.futbolModalidad), {
  message: 'Selecciona la modalidad', path: ['futbolModalidad'],
});

type FormValues = z.infer<typeof schema>;

const SPORTS = [
  { value: 'futbol',      label: 'Fútbol',      emoji: '⚽', desc: 'Fútbol 5, 7 u 11' },
  { value: 'padel',       label: 'Pádel',       emoji: '🎾', desc: 'Techada o abierta' },
  { value: 'voley_playa', label: 'Voley Playa', emoji: '🏐', desc: 'Arena profesional'  },
];

const FUTBOL_MODALIDADES = [
  { value: 'futbol_5',  label: 'Fútbol 5',  players: '10 jug.', desc: 'Cancha pequeña'      },
  { value: 'futbol_7',  label: 'Fútbol 7',  players: '14 jug.', desc: 'Cancha mediana'       },
  { value: 'futbol_11', label: 'Fútbol 11', players: '22 jug.', desc: 'Cancha reglamentaria' },
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const AMENITIES_OPTIONS = [
  'Luz nocturna', 'Parqueadero', 'Duchas', 'Vestiarios',
  'Cafetería', 'Graderías', 'Wi-Fi', 'Alquiler de equipos',
];

interface AvailabilitySlot { dayOfWeek: number; openTime: string; closeTime: string; slotDurationMinutes: number; }

const inp  = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl  = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';
const card = 'bg-white rounded-2xl border border-gray-100 p-6';

const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-100">
    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
      <Icon className="h-3 w-3 text-white" />
    </div>
    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{label}</span>
  </div>
);

export default function AdminNuevaCanchaPage() {
  const router = useRouter();
  const [amenities, setAmenities]       = useState<string[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    [1,2,3,4,5].map(d => ({ dayOfWeek: d, openTime: '07:00', closeTime: '22:00', slotDurationMinutes: 60 }))
  );

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const watchSport     = watch('sport');
  const watchModalidad = watch('futbolModalidad');

  const mutation = useMutation({
    mutationFn: (v: FormValues) => courtsApi.create({
      name: v.name, description: v.description, sport: v.sport,
      amenities: v.futbolModalidad
        ? [v.futbolModalidad.replace('_',' ').replace('futbol','Fútbol'), ...amenities]
        : amenities,
      location: { address: v.address, city: v.city, department: v.department },
      pricePerHour: v.pricePerHour, currency: v.currency, availability,
    }),
    // ← redirige a admin/canchas, no a /dashboard/canchas
    onSuccess: () => { toast.success('¡Cancha publicada!'); router.push('/dashboard/admin/canchas'); },
    onError:   (e: Error) => toast.error(e.message || 'Error al crear la cancha'),
  });

  const toggleDay = (day: number) =>
    setAvailability(prev => prev.find(s => s.dayOfWeek === day)
      ? prev.filter(s => s.dayOfWeek !== day)
      : [...prev, { dayOfWeek: day, openTime: '07:00', closeTime: '22:00', slotDurationMinutes: 60 }].sort((a,b) => a.dayOfWeek - b.dayOfWeek));

  const updateSlot = (day: number, field: keyof AvailabilitySlot, value: string | number) =>
    setAvailability(prev => prev.map(s => s.dayOfWeek === day ? { ...s, [field]: value } : s));

  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/propetario/canchas"
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
          <div className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-400 flex items-center justify-center transition-all">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Volver
        </Link>
      </div>

      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Nueva cancha
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Publicar cancha</h1>
        <p className="text-gray-500 text-sm mt-1">Completa la información para que los jugadores puedan reservar</p>
      </div>

      <form onSubmit={handleSubmit(v => mutation.mutate(v))}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* ── Columna izquierda ─────────────────────────── */}
          <div className="space-y-5">

            {/* Deporte + nombre + descripción */}
            <div className={card}>
              <SectionTitle icon={Building2} label="Deporte" />
              <div className="grid grid-cols-3 gap-3 mb-4">
                {SPORTS.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => { setValue('sport', s.value as any, { shouldValidate: true }); if (s.value !== 'futbol') setValue('futbolModalidad', undefined); }}
                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${watchSport === s.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <span className="text-xs font-black text-gray-800">{s.label}</span>
                    <span className="text-[10px] text-gray-400 text-center">{s.desc}</span>
                    {watchSport === s.value && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  </button>
                ))}
              </div>
              {errors.sport && <p className="text-xs text-red-500 mb-3">{errors.sport.message}</p>}

              {watchSport === 'futbol' && (
                <div className="space-y-2 mb-4">
                  <label className={lbl}><Users className="inline h-3 w-3 mr-1" />Modalidad <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {FUTBOL_MODALIDADES.map(m => (
                      <button key={m.value} type="button"
                        onClick={() => setValue('futbolModalidad', m.value as any, { shouldValidate: true })}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${watchModalidad === m.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                      >
                        <span className="text-lg font-black text-green-700">{m.label.split(' ')[1]}</span>
                        <span className="text-xs font-bold text-gray-700">{m.label}</span>
                        <span className="text-[10px] text-gray-400">{m.desc}</span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{m.players}</span>
                      </button>
                    ))}
                  </div>
                  {errors.futbolModalidad && <p className="text-xs text-red-500">{errors.futbolModalidad.message}</p>}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className={lbl}>Nombre <span className="text-red-500">*</span></label>
                  <input className={inp} placeholder="Ej: Cancha Sintética El Estadio" {...register('name')} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className={lbl}>Descripción <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                  <textarea rows={3} className={inp} style={{ resize: 'none' }}
                    placeholder="Superficie, capacidad, características especiales..."
                    {...register('description')} />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className={card}>
              <SectionTitle icon={MapPin} label="Ubicación" />
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Dirección <span className="text-red-500">*</span></label>
                  <input className={inp} placeholder="Ej: Calle 72 #45-23, Barrio El Centro" {...register('address')} />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Ciudad <span className="text-red-500">*</span></label>
                    <input className={inp} placeholder="Villavicencio" {...register('city')} />
                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Departamento <span className="text-red-500">*</span></label>
                    <input className={inp} placeholder="Meta" {...register('department')} />
                    {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Columna derecha ───────────────────────────── */}
          <div className="space-y-5">

            {/* Precio */}
            <div className={card}>
              <SectionTitle icon={DollarSign} label="Precio" />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Precio por hora <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                    <input type="number" min={1000} step={1000} placeholder="80000"
                      className={inp + " pl-8"} {...register('pricePerHour')} />
                  </div>
                  {errors.pricePerHour && <p className="text-xs text-red-500 mt-1">{errors.pricePerHour.message}</p>}
                </div>
                <div>
                  <label className={lbl}>Moneda</label>
                  <select className={inp} onChange={e => setValue('currency', e.target.value)} defaultValue="COP">
                    <option value="COP">🇨🇴 COP</option>
                    <option value="USD">🇺🇸 USD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Disponibilidad */}
            <div className={card}>
              <SectionTitle icon={Clock} label="Disponibilidad" />
              <div className="flex gap-2 flex-wrap mb-4">
                {DAYS.map((day, i) => {
                  const active = availability.some(s => s.dayOfWeek === i);
                  return (
                    <button key={day} type="button" onClick={() => toggleDay(i)}
                      className={`w-11 h-11 rounded-xl text-xs font-bold border-2 transition-all ${active ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400 hover:border-green-300'}`}
                    >{day}</button>
                  );
                })}
              </div>
              {availability.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  {availability.map(slot => (
                    <div key={slot.dayOfWeek} className="flex items-center gap-2">
                      <span className="w-9 text-xs font-bold text-gray-500 shrink-0">{DAYS[slot.dayOfWeek]}</span>
                      <input type="time" value={slot.openTime}
                        onChange={e => updateSlot(slot.dayOfWeek, 'openTime', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 flex-1" />
                      <span className="text-gray-400 text-xs">—</span>
                      <input type="time" value={slot.closeTime}
                        onChange={e => updateSlot(slot.dayOfWeek, 'closeTime', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 flex-1" />
                      <select value={String(slot.slotDurationMinutes)}
                        onChange={e => updateSlot(slot.dayOfWeek, 'slotDurationMinutes', Number(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 w-20">
                        <option value="60">1h</option>
                        <option value="90">1.5h</option>
                        <option value="120">2h</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenidades */}
            <div className={card}>
              <SectionTitle icon={CheckCircle2} label="Comodidades (opcional)" />
              <div className="flex flex-wrap gap-2">
                {AMENITIES_OPTIONS.map(a => {
                  const active = amenities.includes(a);
                  return (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${active ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'}`}
                    >
                      {active && <CheckCircle2 className="h-3 w-3" />}
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-5">
          <button type="button" onClick={() => router.push('/dashboard/admin/canchas')}
            className="flex-1 border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold py-4 rounded-2xl transition-all"
            disabled={mutation.isPending}>
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-colors shadow-lg">
            {mutation.isPending
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>
              : <><Plus className="h-5 w-5" /> Publicar cancha</>}
          </button>
        </div>
      </form>
    </div>
  );
}
