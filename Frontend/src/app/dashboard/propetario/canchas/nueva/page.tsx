// Ruta: src/app/dashboard/propetario/canchas/nueva/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, DollarSign, Loader2, Plus, CheckCircle2, Users,
  ChevronLeft, ChevronRight, Pencil, Upload, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { courtsApi } from '@/lib/api/courts.api';
import api from '@/lib/api/axios';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { UpgradePlanModal, extractUpgradeError } from '@/components/dashboard/UpgradePlanModal';
import StepWizard, { WIZARD_EASE, type WizardStep } from '@/components/ui/StepWizard';
import { FutbolIcon, PadelIcon, VoleyIcon } from '@/components/ui/SportIcons';
import SelectField from '@/components/ui/SelectField';
import AvailabilityEditor, { DAYS, type AvailabilitySlot } from '@/components/dashboard/AvailabilityEditor';

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
  { value: 'futbol',      label: 'Fútbol',      Icon: FutbolIcon, desc: 'Fútbol 5, 7 u 11' },
  { value: 'padel',       label: 'Pádel',       Icon: PadelIcon,  desc: 'Techada o abierta' },
  { value: 'voley_playa', label: 'Voley Playa', Icon: VoleyIcon,  desc: 'Arena profesional'  },
];

/* El `value` se guarda como amenidad ("futbol_5" → "Fútbol 5"), así que la
   etiqueta debe coincidir con él. Jugadores = 2 equipos completos. */
const FUTBOL_MODALIDADES = [
  { value: 'futbol_5',  label: 'Fútbol 5',  players: '10 jug.', desc: 'Cancha pequeña'       },
  { value: 'futbol_7',  label: 'Fútbol 7',  players: '14 jug.', desc: 'Cancha mediana'       },
  { value: 'futbol_11', label: 'Fútbol 11', players: '22 jug.', desc: 'Cancha reglamentaria' },
];

const AMENITIES_OPTIONS = [
  'Luz nocturna', 'Parqueadero', 'Duchas', 'Vestiarios',
  'Cafetería', 'Graderías', 'Wi-Fi', 'Alquiler de equipos',
];

const CURRENCIES = [
  { value: 'COP', label: 'COP' },
  { value: 'USD', label: 'USD' },
];

const inp = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';
const lbl = 'block text-xs font-black text-gray-500 uppercase tracking-widest mb-2';

const STEPS: (WizardStep & { fields: (keyof FormValues)[] })[] = [
  { title: 'Deporte',  hint: 'Qué se juega en la cancha',      fields: ['sport', 'futbolModalidad'] },
  { title: 'Datos',    hint: 'Nombre y dónde queda',           fields: ['name', 'address', 'city', 'department'] },
  { title: 'Precio',   hint: 'Tarifa y horarios de atención',  fields: ['pricePerHour'] },
  { title: 'Fotos',    hint: 'Lo primero que ve el jugador',   fields: [] },
  { title: 'Publicar', hint: 'Comodidades y revisión final',   fields: [] },
];

const LAST = STEPS.length - 1;

/** Foto elegida en el wizard: aún no existe la cancha, así que se sube al final */
type PendingPhoto = { file: File; preview: string };

export default function AdminNuevaCanchaPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir]   = useState(1);
  const [photos, setPhotos]             = useState<PendingPhoto[]>([]);
  const [dragging, setDragging]         = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [amenities, setAmenities]       = useState<string[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    [1,2,3,4,5].map(d => ({ dayOfWeek: d, openTime: '07:00', closeTime: '22:00', slotDurationMinutes: 60 }))
  );
  const [upgradeError, setUpgradeError] = useState<ReturnType<typeof extractUpgradeError> & { isUpgrade: true } | null>(null);

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  const values = watch();

  /* `sport` y `futbolModalidad` no pasan por register(): se eligen con botones.
     Con el campo sin registrar, RHF no garantiza el re-render tras setValue
     (por eso al primer click no aparecía la modalidad), así que el estado
     visible vive acá y se sincroniza hacia el formulario. */
  const [watchSport, setSportState]         = useState<FormValues['sport'] | undefined>();
  const [watchModalidad, setModalidadState] = useState<FormValues['futbolModalidad']>();

  const pickSport = (value: FormValues['sport']) => {
    setSportState(value);
    setValue('sport', value, { shouldValidate: true });
    if (value !== 'futbol') {
      setModalidadState(undefined);
      setValue('futbolModalidad', undefined, { shouldValidate: true });
    }
  };

  const pickModalidad = (value: NonNullable<FormValues['futbolModalidad']>) => {
    setModalidadState(value);
    setValue('futbolModalidad', value, { shouldValidate: true });
  };

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      const court = await courtsApi.create({
        name: v.name, description: v.description, sport: v.sport,
        amenities: v.futbolModalidad
          ? [v.futbolModalidad.replace('_',' ').replace('futbol','Fútbol'), ...amenities]
          : amenities,
        location: { address: v.address, city: v.city, department: v.department },
        pricePerHour: v.pricePerHour, currency: v.currency, availability,
      });

      /* Las fotos necesitan el id de la cancha, así que van después de crearla.
         Si alguna falla no se pierde la cancha: se avisa y se sigue. */
      if (photos.length > 0) {
        let fallidas = 0;
        for (let i = 0; i < photos.length; i++) {
          setUploadStatus(`Subiendo foto ${i + 1} de ${photos.length}...`);
          try {
            const url = await uploadToCloudinary(photos[i].file);
            await api.post(`/courts/${court._id}/photos`, { url });
          } catch {
            fallidas++;
          }
        }
        setUploadStatus(null);
        if (fallidas > 0) {
          toast.warning(`${fallidas} foto(s) no se pudieron subir. Puedes reintentarlo desde Fotos.`);
        }
      }
      return court;
    },
    onSuccess: () => { toast.success('¡Cancha publicada!'); router.push('/dashboard/propetario/canchas'); },
    onError: (e: any) => {
      setUploadStatus(null);
      const ue = extractUpgradeError(e);
      if (ue.isUpgrade) { setUpgradeError(ue as any); }
      else { toast.error(e?.response?.data?.message || e.message || 'Error al crear la cancha'); }
    },
  });

  const addFiles = (files: FileList | File[]) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imgs.length === 0) return;
    setPhotos(prev => [
      ...prev,
      ...imgs.slice(0, 10 - prev.length).map(file => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removePhoto = (index: number) =>
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });

  /* Liberamos los object URLs al desmontar */
  useEffect(() => () => { photos.forEach(p => URL.revokeObjectURL(p.preview)); }, [photos]);

  const goTo = (target: number) => {
    setDir(target > step ? 1 : -1);
    setStep(target);
  };

  const next = async () => {
    const ok = await trigger(STEPS[step].fields, { shouldFocus: true });
    if (!ok) return;
    // La disponibilidad no vive en el schema: se valida a mano
    if (step === 2 && availability.length === 0) {
      toast.error('Selecciona al menos un día de atención.');
      return;
    }
    goTo(Math.min(step + 1, LAST));
  };

  const onInvalid = (errs: typeof errors) => {
    const bad = STEPS.findIndex(s => s.fields.some(f => errs[f]));
    if (bad >= 0) {
      goTo(bad);
      toast.error('Revisa los campos marcados en rojo.');
    }
  };

  /* Enter y el botón principal avanzan; solo el último paso publica */
  const handleFormSubmit = (e: React.FormEvent) => {
    if (step < LAST) {
      e.preventDefault();
      void next();
      return;
    }
    void handleSubmit(v => mutation.mutate(v), onInvalid)(e);
  };

  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const sportLabel     = SPORTS.find(s => s.value === watchSport);
  const modalidadLabel = FUTBOL_MODALIDADES.find(m => m.value === watchModalidad);

  const RESUMEN = [
    { label: 'Deporte',  value: [sportLabel?.label, modalidadLabel?.label].filter(Boolean).join(' · '), step: 0 },
    { label: 'Nombre',   value: values.name,                                                            step: 1 },
    { label: 'Dirección',value: values.address,                                                         step: 1 },
    { label: 'Ciudad',   value: [values.city, values.department].filter(Boolean).join(', '),            step: 1 },
    { label: 'Precio',   value: values.pricePerHour ? `$${Number(values.pricePerHour).toLocaleString('es-CO')} ${values.currency || 'COP'} / hora` : '', step: 2 },
    { label: 'Días',     value: availability.length ? availability.map(s => DAYS[s.dayOfWeek]).join(', ') : '', step: 2 },
    { label: 'Fotos',    value: photos.length ? `${photos.length} seleccionada${photos.length > 1 ? 's' : ''}` : 'Ninguna', step: 3 },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/propetario/canchas"
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors group">
          <span className="w-8 h-8 rounded-full border border-gray-200 group-hover:border-gray-400 flex items-center justify-center transition-all">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </span>
          Volver
        </Link>
      </div>

      <div>
        <p className="text-lime-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Nueva cancha
        </p>
        <h1 className="text-3xl font-black text-gray-900 uppercase">Publicar cancha</h1>
        <p className="text-gray-500 text-sm mt-1">Son 4 pasos cortos. Puedes volver atrás cuando quieras.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="bg-gray-50 rounded-3xl border border-gray-100 p-6 md:p-8">
        <StepWizard steps={STEPS} step={step} dir={dir} onGoTo={goTo}>

          {/* ── PASO 1: deporte ──────────────────────────────────── */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {SPORTS.map(s => {
                  const active = watchSport === s.value;
                  return (
                    <motion.button
                      key={s.value}
                      type="button"
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      onClick={() => pickSport(s.value as FormValues['sport'])}
                      className={`relative flex flex-col items-center gap-2 py-5 rounded-2xl border-2 bg-white transition-colors duration-200 ${
                        active ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <s.Icon className={`h-8 w-8 transition-colors duration-200 ${active ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-xs font-black text-gray-800">{s.label}</span>
                      <span className="text-[10px] text-gray-400 text-center px-1">{s.desc}</span>
                      {active && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                          className="absolute top-2 right-2"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {errors.sport && <p className="text-xs text-red-500">{errors.sport.message}</p>}

              {watchSport === 'futbol' && (
                <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: WIZARD_EASE }}
                  className="space-y-2"
                >
                  <label className={lbl}><Users className="inline h-3 w-3 mr-1" />Modalidad <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-2">
                    {FUTBOL_MODALIDADES.map(m => {
                      const active = watchModalidad === m.value;
                      return (
                        <motion.button
                          key={m.value}
                          type="button"
                          whileTap={reduce ? undefined : { scale: 0.97 }}
                          onClick={() => pickModalidad(m.value as NonNullable<FormValues['futbolModalidad']>)}
                          className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 bg-white transition-colors duration-200 ${
                            active ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <span className="text-lg font-black text-green-700">{m.label.split(' ')[1]}</span>
                          <span className="text-xs font-bold text-gray-700">{m.label}</span>
                          <span className="text-[10px] text-gray-400">{m.desc}</span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{m.players}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  {errors.futbolModalidad && <p className="text-xs text-red-500">{errors.futbolModalidad.message}</p>}
                </motion.div>
              )}
            </>
          )}

          {/* ── PASO 2: datos y ubicación ────────────────────────── */}
          {step === 1 && (
            <>
              <div>
                <label className={lbl}>Nombre de la cancha <span className="text-red-500">*</span></label>
                <input className={inp} placeholder="Ej: Cancha Sintética El Estadio" {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className={lbl}>Descripción <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                <textarea rows={3} className={inp} style={{ resize: 'none' }}
                  placeholder="Superficie, capacidad, características especiales..."
                  {...register('description')} />
              </div>

              <div>
                <label className={lbl}>Dirección <span className="text-red-500">*</span></label>
                <input className={inp} placeholder="Ej: Calle 72 #45-23, Barrio El Centro" {...register('address')} />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </>
          )}

          {/* ── PASO 3: precio y disponibilidad ──────────────────── */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className={lbl}><DollarSign className="inline h-3 w-3 mr-1" />Precio por hora <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">$</span>
                    <input type="number" min={1000} step={1000} placeholder="80000"
                      className={inp + ' pl-8'} {...register('pricePerHour')} />
                  </div>
                  {errors.pricePerHour && <p className="text-xs text-red-500 mt-1">{errors.pricePerHour.message}</p>}
                </div>
                <div>
                  <label className={lbl}>Moneda</label>
                  <SelectField
                    aria-label="Moneda"
                    value={values.currency ?? 'COP'}
                    onChange={v => setValue('currency', v)}
                    options={CURRENCIES}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className={lbl}>Días de atención <span className="text-red-500">*</span></label>
                <AvailabilityEditor value={availability} onChange={setAvailability} />
              </div>
            </>
          )}

          {/* ── PASO 4: fotos ────────────────────────────────────── */}
          {step === 3 && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-green-400'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-bold text-gray-700">Arrastra tus fotos o haz click aquí</p>
                <p className="text-xs text-gray-400">JPG o PNG · hasta 10 fotos · la primera será la principal</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={e => { addFiles(e.target.files ?? []); e.target.value = ''; }}
                />
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((p, i) => (
                    <motion.div
                      key={p.preview}
                      layout={!reduce}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.22, ease: WIZARD_EASE }}
                      className="relative group aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Principal
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label="Quitar foto"
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400">
                Puedes saltarte este paso y subirlas después desde <span className="font-semibold text-gray-500">Fotos</span> en el panel.
              </p>
            </>
          )}

          {/* ── PASO 5: comodidades + resumen ────────────────────── */}
          {step === 4 && (
            <>
              <div>
                <label className={lbl}>Comodidades <span className="text-gray-400 font-normal normal-case">(opcional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_OPTIONS.map(a => {
                    const active = amenities.includes(a);
                    return (
                      <motion.button
                        key={a}
                        type="button"
                        whileTap={reduce ? undefined : { scale: 0.95 }}
                        onClick={() => toggleAmenity(a)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border-2 bg-white transition-colors duration-200 ${
                          active ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'
                        }`}
                      >
                        {active && <CheckCircle2 className="h-3 w-3" />}
                        {a}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
                <p className="px-4 py-3 text-xs font-black text-gray-900 uppercase tracking-widest bg-gray-50">
                  Resumen de la cancha
                </p>
                {RESUMEN.map(r => (
                  <div key={r.label} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs text-gray-400 w-24 shrink-0">{r.label}</span>
                    <span className="text-sm font-semibold text-gray-800 truncate">{r.value || '—'}</span>
                    <button
                      type="button"
                      onClick={() => goTo(r.step)}
                      className="ml-auto text-gray-300 hover:text-green-600 transition-colors shrink-0"
                      aria-label={`Editar ${r.label}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </StepWizard>

        {/* ── Navegación ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-6">
          {step > 0 ? (
            <motion.button
              type="button"
              onClick={() => goTo(step - 1)}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: WIZARD_EASE }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 shrink-0 whitespace-nowrap bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-bold text-sm px-5 py-4 rounded-2xl transition-colors disabled:opacity-60"
            >
              <ChevronLeft className="h-4 w-4" /> Atrás
            </motion.button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/dashboard/propetario/canchas')}
              className="shrink-0 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-bold text-sm px-5 py-4 rounded-2xl transition-colors"
            >
              Cancelar
            </button>
          )}

          <motion.button
            type="submit"
            disabled={mutation.isPending}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black text-base py-4 rounded-2xl transition-colors shadow-lg shadow-green-600/20"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {uploadStatus ?? 'Publicando...'}</>
            ) : step < LAST ? (
              <>Continuar <ChevronRight className="h-5 w-5" /></>
            ) : (
              <><Plus className="h-5 w-5" /> Publicar cancha</>
            )}
          </motion.button>
        </div>
      </form>

      <UpgradePlanModal
        open={!!upgradeError}
        onClose={() => setUpgradeError(null)}
        code={upgradeError?.code}
        message={upgradeError?.message}
        currentPlan={upgradeError?.currentPlan}
        limit={upgradeError?.limit}
      />
    </div>
  );
}
