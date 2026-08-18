'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { solicitudesApi } from '@/lib/api/solicitudes.api';
import Link from 'next/link';
import {
  CheckCircle2, Loader2, ChevronRight, ChevronLeft, Pencil,
} from 'lucide-react';
import StepWizard, { WIZARD_EASE, type WizardStep } from '@/components/ui/StepWizard';

const schema = z.object({
  firstName:    z.string().min(2, 'Mínimo 2 caracteres'),
  lastName:     z.string().min(2, 'Mínimo 2 caracteres'),
  email:        z.string().email('Email inválido'),
  phone:        z.string().min(7, 'Teléfono inválido'),
  businessName: z.string().min(2, 'Ingresa el nombre del complejo'),
  nit:          z.string().min(5, 'NIT o cédula inválido'),
  city:         z.string().min(2, 'Ingresa la ciudad'),
  department:   z.string().min(2, 'Ingresa el departamento'),
  message:      z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

/* `fields` = lo que se valida antes de dejar avanzar */
const STEPS: (WizardStep & { fields: (keyof FormValues)[] })[] = [
  { title: 'Tus datos',  hint: 'Para poder contactarte',       fields: ['firstName', 'lastName', 'email', 'phone'] },
  { title: 'Tu negocio', hint: 'Datos del complejo deportivo', fields: ['businessName', 'nit', 'city', 'department'] },
  { title: 'Confirmar',  hint: 'Revisa y envía tu solicitud',  fields: [] },
];

const LAST = STEPS.length - 1;

const BENEFITS = [
  'Reservas automáticas 24/7',
  'Pagos en línea integrados',
  'Analytics e informes de tus canchas',
  'Notificaciones automáticas a tus clientes',
];

const inputClass =
  'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';

const labelClass = 'block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5';


/* Campo con mensaje de error animado */
function Field({ label, error, optional, children }: {
  label: string; error?: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label} {optional
          ? <span className="text-gray-400 font-medium normal-case">(opcional)</span>
          : <span className="text-red-500">*</span>}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            className="text-xs text-red-500 mt-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SolicitarAccesoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState(0);
  /* Dirección del último movimiento: define hacia dónde se desliza el paso */
  const [dir, setDir]             = useState(1);
  const reduce = useReducedMotion();

  const { register, handleSubmit, trigger, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  const values = watch();

  const goTo = (target: number) => {
    setDir(target > step ? 1 : -1);
    setStep(target);
  };

  const next = async () => {
    const ok = await trigger(STEPS[step].fields, { shouldFocus: true });
    if (ok) goTo(Math.min(step + 1, LAST));
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await solicitudesApi.create(data);
      setSubmitted(true);
    } catch {
      toast.error('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  /* Si el envío final falla, volvemos al primer paso que tenga el error */
  const onInvalid = (errs: typeof errors) => {
    const bad = STEPS.findIndex(s => s.fields.some(f => errs[f]));
    if (bad >= 0) {
      goTo(bad);
      toast.error('Revisa los campos marcados en rojo.');
    }
  };

  /* Enter y el botón principal avanzan de paso; solo el último envía */
  const handleFormSubmit = (e: React.FormEvent) => {
    if (step < LAST) {
      e.preventDefault();
      void next();
      return;
    }
    void handleSubmit(onSubmit, onInvalid)(e);
  };

  const RESUMEN = [
    { label: 'Nombre',        value: `${values.firstName ?? ''} ${values.lastName ?? ''}`.trim(), step: 0 },
    { label: 'Email',         value: values.email,        step: 0 },
    { label: 'Teléfono',      value: values.phone,        step: 0 },
    { label: 'Negocio',       value: values.businessName, step: 1 },
    { label: 'NIT / Cédula',  value: values.nit,          step: 1 },
    { label: 'Ubicación',     value: [values.city, values.department].filter(Boolean).join(', '), step: 1 },
  ];

  // ─── SUCCESS ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-md text-center space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: WIZARD_EASE }}
        >
          <motion.div
            className="w-20 h-20 rounded-full bg-lime-400 flex items-center justify-center mx-auto shadow-lg"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 }}
          >
            <CheckCircle2 className="h-10 w-10 text-gray-900" />
          </motion.div>
          <div className="text-white space-y-2">
            <h2 className="text-3xl font-black uppercase">¡Solicitud enviada!</h2>
            <p className="text-gray-400 text-base">
              Revisaremos tu información y te contactaremos en las próximas{' '}
              <span className="text-white font-semibold">24–48 horas hábiles</span>{' '}
              para activar tu cuenta.
            </p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-5 text-sm text-gray-400 space-y-1 border border-gray-700">
            <p>✉️ Revisa tu bandeja de entrada y spam.</p>
            <p>🔑 Recibirás tus credenciales por email.</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-bold px-8 py-3.5 rounded-full transition-colors"
          >
            Volver al inicio <ChevronRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  // ─── FORM ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO compacto ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 py-14">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-lime-400 rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center text-white space-y-4">
          <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <span>✦</span> Para propietarios de canchas
          </p>
          <h1 className="text-4xl md:text-5xl font-black uppercase leading-tight">
            Publica tu cancha y empieza a
            <span className="block text-lime-400">recibir reservas hoy</span>
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto">
            Son 3 pasos rápidos. Validamos tu información en menos de 48 horas.
          </p>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ── FORMULARIO POR PASOS ────────────────────────────────── */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">

              <form onSubmit={handleFormSubmit}>
                <StepWizard steps={STEPS} step={step} dir={dir} onGoTo={goTo}>
                      {/* ── PASO 1: datos personales ───────────────── */}
                      {step === 0 && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nombre" error={errors.firstName?.message}>
                              <input className={inputClass} placeholder="Juan" {...register('firstName')} />
                            </Field>
                            <Field label="Apellido" error={errors.lastName?.message}>
                              <input className={inputClass} placeholder="Pérez" {...register('lastName')} />
                            </Field>
                          </div>
                          <Field label="Email" error={errors.email?.message}>
                            <input type="email" className={inputClass} placeholder="juan@email.com" {...register('email')} />
                          </Field>
                          <Field label="Teléfono" error={errors.phone?.message}>
                            <input type="tel" className={inputClass} placeholder="+57 300 123 4567" {...register('phone')} />
                          </Field>
                        </>
                      )}

                      {/* ── PASO 2: negocio ─────────────────────────── */}
                      {step === 1 && (
                        <>
                          <Field label="Nombre del complejo / negocio" error={errors.businessName?.message}>
                            <input className={inputClass} placeholder="Ej: Complejo Deportivo Los Campeones" {...register('businessName')} />
                          </Field>
                          <Field label="NIT / Cédula" error={errors.nit?.message}>
                            <input className={inputClass} placeholder="900.123.456-7" {...register('nit')} />
                          </Field>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Ciudad" error={errors.city?.message}>
                              <input className={inputClass} placeholder="Ej: Villavicencio" {...register('city')} />
                            </Field>
                            <Field label="Departamento" error={errors.department?.message}>
                              <input className={inputClass} placeholder="Ej: Meta" {...register('department')} />
                            </Field>
                          </div>
                        </>
                      )}

                      {/* ── PASO 3: mensaje + resumen ───────────────── */}
                      {step === 2 && (
                        <>
                          <Field label="Mensaje adicional" optional>
                            <textarea
                              rows={3}
                              className={inputClass}
                              style={{ resize: 'none' }}
                              placeholder="Más info sobre tu negocio, redes sociales, cantidad de canchas..."
                              {...register('message')}
                            />
                          </Field>

                          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
                            <p className="px-4 py-3 text-xs font-black text-gray-900 uppercase tracking-widest bg-gray-50">
                              Resumen de tu solicitud
                            </p>
                            {RESUMEN.map((r) => (
                              <div key={r.label} className="flex items-center gap-3 px-4 py-2.5">
                                <span className="text-xs text-gray-400 w-28 shrink-0">{r.label}</span>
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

                {/* ── Navegación ───────────────────────────────────── */}
                <div className="flex items-center gap-3 pt-6">
                  {step > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => goTo(step - 1)}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, ease: WIZARD_EASE }}
                      whileTap={reduce ? undefined : { scale: 0.97 }}
                      className="flex items-center gap-1.5 shrink-0 whitespace-nowrap bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-bold text-sm px-5 py-4 rounded-2xl transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" /> Atrás
                    </motion.button>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black text-base py-4 rounded-2xl transition-colors shadow-lg shadow-green-600/20"
                  >
                    {loading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Enviando solicitud...</>
                    ) : step < LAST ? (
                      <>Continuar <ChevronRight className="h-5 w-5" /></>
                    ) : (
                      <>Enviar solicitud <ChevronRight className="h-5 w-5" /></>
                    )}
                  </motion.button>
                </div>

                <AnimatePresence initial={false}>
                  {step === LAST && (
                    <motion.p
                      className="text-center text-xs text-gray-400 pt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Al enviar aceptas nuestros{' '}
                      <Link href="/terminos" className="underline hover:text-green-600 transition-colors">términos de uso</Link>
                      {' '}y{' '}
                      <Link href="/privacidad" className="underline hover:text-green-600 transition-colors">política de privacidad</Link>.
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            </div>

            <p className="text-sm text-gray-500 mt-6 text-center lg:hidden">
              ¿Ya tienes acceso?{' '}
              <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-bold hover:underline">
                Inicia sesión aquí →
              </Link>
            </p>
          </div>

          {/* ── BENEFICIOS (resumen corto, no compite con el formulario) ── */}
          <aside className="lg:col-span-2 order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-black text-gray-900 uppercase">Lo que obtienes</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Todo lo necesario para gestionar tu cancha, sin mensualidad ni contrato:
                solo el 6% de cada reserva pagada por la plataforma.
              </p>
            </div>

            <ul className="space-y-2.5">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3">
              <span className="text-lg font-black text-green-700 shrink-0">100%</span>
              <p className="text-xs text-green-800 leading-snug">
                <span className="font-bold">Gratis para empezar.</span> Sin suscripción ni comisión por reserva.
              </p>
            </div>

            <p className="hidden lg:block text-sm text-gray-500">
              ¿Ya tienes acceso?{' '}
              <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-bold hover:underline">
                Inicia sesión aquí →
              </Link>
            </p>
          </aside>
        </div>
      </section>

      {/* ── CTA STATS ─────────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { n: '+500',  label: 'Canchas registradas' },
              { n: '+12K',  label: 'Reservas realizadas' },
              { n: '+8',    label: 'Ciudades de Colombia' },
              { n: '4.8★',  label: 'Calificación promedio' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black text-lime-400">{s.n}</div>
                <div className="text-sm text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
