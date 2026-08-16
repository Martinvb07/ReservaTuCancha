'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ChevronRight, Shield, BarChart3, CalendarDays, ArrowLeft, AlertCircle } from 'lucide-react';
import { LOGO_URL } from '@/lib/logo';

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type FormValues = z.infer<typeof schema>;

const inputBase =
  'w-full bg-white border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition disabled:opacity-60';
const inputOk  = `${inputBase} border-gray-200 focus:ring-green-400`;
const inputBad = `${inputBase} border-red-300 bg-red-50/40 focus:ring-red-300`;

const FEATURES = [
  { icon: CalendarDays, label: 'Gestiona tus reservas en tiempo real' },
  { icon: BarChart3,    label: 'Analytics e ingresos de tus canchas'  },
  { icon: Shield,       label: 'Panel seguro con acceso exclusivo'     },
];

/* Foto de respaldo por si la principal deja de responder */
const HERO_IMG = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1600&q=80';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [imgOk, setImgOk]       = useState(true);
  const reduce = useReducedMotion();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setAuthError(null);
    const result = await signIn('credentials', {
      email:    values.email,
      password: values.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setAuthError('Email o contraseña incorrectos. Verifica tus datos e intenta de nuevo.');
      toast.error('Credenciales inválidas.');
      return;
    }
    toast.success('¡Bienvenido de vuelta!');
    router.push('/dashboard');
    router.refresh();
  };

  /* Entrada escalonada del formulario */
  const fade = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: EASE, delay: reduce ? 0 : delay },
  });

  return (
    <div className="fixed inset-0 z-50 grid grid-cols-1 lg:grid-cols-2 bg-white">

      {/* ── LEFT ──────────────────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gray-900 px-12 py-10">
        {/* Fondo: si la foto falla, queda el degradado (nunca se ve rota) */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-green-950" />
        {imgOk && (
          <img
            src={HERO_IMG}
            alt=""
            aria-hidden
            onError={() => setImgOk(false)}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-lime-400/10 blur-3xl" />

        {/* Logo top */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src={LOGO_URL} alt="" className="h-11 w-11 object-contain" />
            <span className="font-black text-xl text-white tracking-tight">
              Reserva<span className="text-lime-400">TuCancha</span>
            </span>
          </Link>
        </div>

        {/* Content center */}
        <motion.div
          className="relative z-10 space-y-6"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } }}
        >
          <motion.div
            className="space-y-3"
            variants={{
              hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
              show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
            }}
          >
            <p className="text-lime-400 font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
              <span>✦</span> Panel de propietarios
            </p>
            <h2 className="text-4xl font-black text-white uppercase leading-tight">
              Gestiona tu cancha
              <span className="block text-lime-400">desde un solo lugar</span>
            </h2>
            <p className="text-gray-400 text-base">
              Reservas, pagos, analytics y más. Todo en tiempo real.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FEATURES.map((f) => (
              <motion.div
                key={f.label}
                className="flex items-center gap-3"
                variants={{
                  hidden: reduce ? { opacity: 0 } : { opacity: 0, x: -14 },
                  show:   { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-lime-400/20 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-lime-400" />
                </div>
                <span className="text-sm text-gray-300 font-medium">{f.label}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10"
            variants={{
              hidden: { opacity: 0 },
              show:   { opacity: 1, transition: { duration: 0.5, ease: EASE } },
            }}
          >
            {[
              { n: '+500', label: 'Canchas'      },
              { n: '+12K', label: 'Reservas'     },
              { n: '4.8★', label: 'Calificación' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black text-lime-400">{s.n}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-gray-500">
          © {new Date().getFullYear()} ReservaTuCancha · Colombia 🇨🇴
        </div>
      </div>

      {/* ── RIGHT ─────────────────────────────────────────────────── */}
      <div className="flex flex-col bg-white overflow-y-auto">

        {/* Top bar con flecha volver */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-100">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <span className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-gray-400 group-hover:bg-gray-50 transition-all">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </span>
            Volver al inicio
          </Link>

          {/* Logo mobile */}
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <img src={LOGO_URL} alt="" className="h-9 w-9 object-contain" />
              <span className="font-black text-base text-gray-900 tracking-tight">
                Reserva<span className="text-green-600">TuCancha</span>
              </span>
            </Link>
          </div>

          <div className="hidden lg:block w-32" /> {/* spacer */}
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-16 py-10">
          <div className="w-full max-w-md space-y-7">

            <motion.div className="space-y-1" {...fade(0.05)}>
              <h1 className="text-3xl font-black text-gray-900 uppercase">Iniciar sesión</h1>
              <p className="text-gray-500 text-sm">
                Accede a tu dashboard para gestionar tus canchas deportivas.
              </p>
            </motion.div>

            {/* Error de credenciales: persiste hasta el siguiente intento */}
            <AnimatePresence initial={false}>
              {authError && (
                <motion.div
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{authError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate {...fade(0.12)}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-black text-gray-700 uppercase tracking-widest">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={errors.email ? inputBad : inputOk}
                  placeholder="propietario@email.com"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                <AnimatePresence initial={false}>
                  {errors.email && (
                    <motion.p
                      className="text-xs text-red-500"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-black text-gray-700 uppercase tracking-widest">
                    Contraseña
                  </label>
                  <Link
                    href="/soporte"
                    className="text-xs font-semibold text-gray-400 hover:text-green-600 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    className={`${errors.password ? inputBad : inputOk} pr-11`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {errors.password && (
                    <motion.p
                      className="text-xs text-red-500"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-base py-4 rounded-2xl transition-colors shadow-lg shadow-green-600/20"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Ingresando...</>
                ) : (
                  <>Ingresar al dashboard <ChevronRight className="h-5 w-5" /></>
                )}
              </motion.button>
            </motion.form>

            <motion.div className="pt-5 border-t border-gray-100 space-y-2 text-center" {...fade(0.2)}>
              <p className="text-sm text-gray-500">
                ¿Aún no tienes acceso?{' '}
                <Link href="/solicitar-acceso" className="text-green-600 hover:text-green-700 font-bold hover:underline transition-colors">
                  Solicitar acceso →
                </Link>
              </p>
              <p className="text-xs text-gray-400">
                ¿Solo quieres reservar?{' '}
                <Link href="/empresas" className="font-semibold text-gray-500 hover:text-green-600 hover:underline transition-colors">
                  Buscar canchas
                </Link>
              </p>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
