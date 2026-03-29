'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { solicitudesApi } from '@/lib/api/solicitudes.api';
import Link from 'next/link';
import {
  CheckCircle2, Loader2, Building2, MapPin,
  User, Mail, Phone, MessageSquare, ChevronRight,
  CalendarDays, CreditCard, BarChart3, Bell, Star, Shield,
} from 'lucide-react';

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

const BENEFITS = [
  { icon: CalendarDays, label: 'Reservas automáticas 24/7'       },
  { icon: CreditCard,   label: 'Pagos en línea integrados'        },
  { icon: BarChart3,    label: 'Analytics e informes detallados'  },
  { icon: Bell,         label: 'Notificaciones automáticas'       },
  { icon: Star,         label: 'Reseñas verificadas de clientes'  },
  { icon: Shield,       label: 'Sin comisión por reserva'         },
];

const inputClass =
  'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition';

const labelClass = 'block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5';

export default function SolicitarAccesoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await solicitudesApi.create(values);
      setSubmitted(true);
    } catch {
      toast.error('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ─── SUCCESS ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-lime-400 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="h-10 w-10 text-gray-900" />
          </div>
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
        </div>
      </div>
    );
  }

  // ─── FORM ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO compacto ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 py-16">
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
            Completa el formulario y nuestro equipo validará tu información en menos de 48 horas.
          </p>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ── LEFT: beneficios ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Título */}
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-gray-900 uppercase">Lo que obtienes</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Una plataforma completa para gestionar tu cancha deportiva sin complicaciones.
              </p>
            </div>

            {/* Benefits list */}
            <div className="space-y-3">
              {BENEFITS.map((b) => (
                <div key={b.label} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
                    <b.icon className="h-4 w-4 text-green-700" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{b.label}</span>
                  <CheckCircle2 className="ml-auto h-4 w-4 text-green-500 shrink-0" />
                </div>
              ))}
            </div>

            {/* Badge gratis */}
            <div className="relative overflow-hidden bg-gray-900 text-white rounded-2xl p-6 space-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400 opacity-10 rounded-full translate-x-8 -translate-y-8" />
              <div className="relative">
                <p className="text-lime-400 text-xs font-bold uppercase tracking-widest mb-1">✦ Sin costo</p>
                <p className="font-black text-2xl">100% gratis</p>
                <p className="text-gray-400 text-sm mt-1">
                  Sin cobros de suscripción ni comisiones. Solo publicas y ganas.
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              ¿Ya tienes acceso?{' '}
              <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-bold hover:underline">
                Inicia sesión aquí →
              </Link>
            </p>
          </div>

          {/* ── RIGHT: formulario ───────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 shadow-sm">

              <div className="mb-8">
                <h3 className="text-2xl font-black text-gray-900">Solicitar acceso</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Completa todos los campos marcados con <span className="text-red-500">*</span>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* ── Datos personales ─────────────────────────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Datos personales</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nombre <span className="text-red-500">*</span></label>
                      <input className={inputClass} placeholder="Juan" {...register('firstName')} />
                      {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Apellido <span className="text-red-500">*</span></label>
                      <input className={inputClass} placeholder="Pérez" {...register('lastName')} />
                      {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                      <input type="email" className={inputClass} placeholder="juan@email.com" {...register('email')} />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Teléfono <span className="text-red-500">*</span></label>
                      <input type="tel" className={inputClass} placeholder="+57 300 123 4567" {...register('phone')} />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>
                </div>

                {/* ── Info del negocio ─────────────────────────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <Building2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Información del negocio</span>
                  </div>

                  <div>
                    <label className={labelClass}>Nombre del complejo / negocio <span className="text-red-500">*</span></label>
                    <input className={inputClass} placeholder="Ej: Complejo Deportivo Los Campeones" {...register('businessName')} />
                    {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>NIT / Cédula <span className="text-red-500">*</span></label>
                      <input className={inputClass} placeholder="900.123.456-7" {...register('nit')} />
                      {errors.nit && <p className="text-xs text-red-500 mt-1">{errors.nit.message}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Ciudad <span className="text-red-500">*</span></label>
                      <input className={inputClass} placeholder="Ej: Villavicencio" {...register('city')} />
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Departamento <span className="text-red-500">*</span></label>
                    <input className={inputClass} placeholder="Ej: Meta" {...register('department')} />
                    {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
                  </div>
                </div>

                {/* ── Mensaje adicional ────────────────────────────── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">
                      Mensaje adicional <span className="text-gray-400 font-medium normal-case">(opcional)</span>
                    </span>
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      className={inputClass}
                      style={{ resize: 'none' }}
                      placeholder="Más info sobre tu negocio, redes sociales, cantidad de canchas..."
                      {...register('message')}
                    />
                  </div>
                </div>

                {/* ── Submit ───────────────────────────────────────── */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black text-base py-4 rounded-2xl transition-colors shadow-lg"
                >
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Enviando solicitud...</>
                  ) : (
                    <>Enviar solicitud <ChevronRight className="h-5 w-5" /></>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Al enviar aceptas nuestros{' '}
                  <Link href="/terminos" className="underline hover:text-green-600 transition-colors">términos de uso</Link>
                  {' '}y{' '}
                  <Link href="/privacidad" className="underline hover:text-green-600 transition-colors">política de privacidad</Link>.
                </p>

              </form>
            </div>
          </div>
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