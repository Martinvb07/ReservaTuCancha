'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ChevronRight, Shield, BarChart3, CalendarDays, ArrowLeft } from 'lucide-react';
import { LOGO_URL } from '@/lib/logo';

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type FormValues = z.infer<typeof schema>;

const inputClass =
  'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';

const FEATURES = [
  { icon: CalendarDays, label: 'Gestiona tus reservas en tiempo real' },
  { icon: BarChart3,    label: 'Analytics e ingresos de tus canchas'  },
  { icon: Shield,       label: 'Panel seguro con acceso exclusivo'     },
];

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const result = await signIn('credentials', {
      email:    values.email,
      password: values.password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error('Credenciales inválidas. Verifica tu email y contraseña.');
      return;
    }
    toast.success('¡Bienvenido de vuelta!');
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 grid grid-cols-1 lg:grid-cols-2 bg-white">

      {/* ── LEFT ──────────────────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gray-900 px-12 py-10">
        <img
          src="https://images.unsplash.com/photo-1551958219-acbc595b8cc8?w=1200&q=80"
          alt="cancha"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

        {/* Logo top */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="ReservaTuCancha" className="h-9 w-9 object-contain" />
            <span className="font-black text-xl text-white tracking-tight">
              Reserva<span className="text-lime-400">TuCancha</span>
            </span>
          </Link>
        </div>

        {/* Content center */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
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
          </div>

          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-lime-400/20 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-lime-400" />
                </div>
                <span className="text-sm text-gray-300 font-medium">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {[
              { n: '+500', label: 'Canchas'      },
              { n: '+12K', label: 'Reservas'     },
              { n: '4.8★', label: 'Calificación' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black text-lime-400">{s.n}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-gray-600">
          © {new Date().getFullYear()} ReservaTuCancha · Colombia 🇨🇴
        </div>
      </div>

      {/* ── RIGHT ─────────────────────────────────────────────────── */}
      <div className="flex flex-col bg-white overflow-y-auto">

        {/* Top bar con flecha volver */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-gray-400 group-hover:bg-gray-50 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Volver al inicio
          </Link>

          {/* Logo mobile */}
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <img src={LOGO_URL} alt="ReservaTuCancha" className="h-7 w-7 object-contain" />
              <span className="font-black text-base text-gray-900 tracking-tight">
                Reserva<span className="text-green-600">TuCancha</span>
              </span>
            </Link>
          </div>

          <div className="hidden lg:block w-32" /> {/* spacer */}
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-8 md:px-16 py-8">
          <div className="w-full max-w-md space-y-7">

            <div className="space-y-1">
              <h1 className="text-3xl font-black text-gray-900 uppercase">Iniciar sesión</h1>
              <p className="text-gray-500 text-sm">
                Accede a tu dashboard para gestionar tus canchas deportivas.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">
                  Email
                </label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="propietario@email.com"
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={inputClass}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black text-base py-4 rounded-2xl transition-colors shadow-lg"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Ingresando...</>
                ) : (
                  <>Ingresar al dashboard <ChevronRight className="h-5 w-5" /></>
                )}
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                ¿Aún no tienes acceso?{' '}
                <Link href="/solicitar-acceso" className="text-green-600 hover:text-green-700 font-bold hover:underline transition-colors">
                  Solicitar acceso →
                </Link>
              </p>
              <p className="text-sm text-gray-500 text-center">
                ¿Quieres reservar una cancha?{' '}
                <Link href="/empresas" className="text-green-600 hover:text-green-700 font-bold hover:underline transition-colors">
                  Buscar canchas →
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}