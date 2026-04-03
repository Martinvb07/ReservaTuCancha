'use client';

import { useQuery } from '@tanstack/react-query';
import { useApiAuth } from '@/hooks/useApiAuth';
import {
  Zap, Crown, Building2, CheckCircle, XCircle, Clock,
  CalendarDays, AlertTriangle, MessageSquare, ArrowRight, Star,
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api/axios';

// ─── Definición de planes ─────────────────────────────────────────────────────
const PLANES = {
  basico: {
    label: 'Básico',
    precio: 'Gratis',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    icon: Zap,
    iconColor: 'text-gray-500',
    iconBg: 'bg-gray-100',
  },
  pro: {
    label: 'Pro',
    precio: '$89.900 / mes',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    icon: Crown,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
  },
  empresarial: {
    label: 'Empresarial',
    precio: '$189.900 / mes',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    icon: Building2,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
  },
} as const;

const ESTADOS = {
  activa:    { label: 'Activa',    color: 'text-green-700 bg-green-100',  icon: CheckCircle },
  trial:     { label: 'Trial',     color: 'text-amber-700 bg-amber-100',  icon: Clock       },
  vencida:   { label: 'Vencida',   color: 'text-red-700 bg-red-100',      icon: XCircle     },
  cancelada: { label: 'Cancelada', color: 'text-gray-600 bg-gray-100',    icon: XCircle     },
} as const;

// ─── Features por plan ────────────────────────────────────────────────────────
const FEATURES: { label: string; basico: boolean | string; pro: boolean | string; empresarial: boolean | string }[] = [
  { label: 'Canchas activas',             basico: '1',          pro: 'Hasta 5',   empresarial: 'Ilimitadas' },
  { label: 'Reservas mensuales',          basico: 'Ilimitadas', pro: 'Ilimitadas', empresarial: 'Ilimitadas' },
  { label: 'Pago online con Wompi',       basico: false,        pro: true,         empresarial: true         },
  { label: 'Efectivo (pago en el lugar)', basico: true,         pro: true,         empresarial: true         },
  { label: 'Analytics completo',          basico: false,        pro: true,         empresarial: true         },
  { label: 'Exportar CSV',                basico: false,        pro: true,         empresarial: true         },
  { label: 'Fotos por cancha',            basico: '3',          pro: '10',         empresarial: 'Ilimitadas' },
  { label: 'Historial de reservas',       basico: '30 días',    pro: 'Ilimitado',  empresarial: 'Ilimitado'  },
  { label: 'Emails profesionales',        basico: true,         pro: true,         empresarial: true         },
  { label: 'Soporte',                     basico: '72h email',  pro: 'Prioritario 24h', empresarial: 'Dedicado'  },
  { label: 'Novedades en beta',           basico: false,        pro: false,        empresarial: true         },
];

function FeatureValue({ val }: { val: boolean | string }) {
  if (val === false) return <XCircle className="h-4 w-4 text-gray-300 mx-auto" />;
  if (val === true)  return <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />;
  return <span className="text-xs font-bold text-gray-700">{val}</span>;
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function SuscripcionPage() {
  const session = useApiAuth();
  const token = (session as any)?.accessToken;

  const { data: plan, isLoading } = useQuery({
    queryKey: ['my-plan'],
    queryFn: async () => {
      const { data } = await api.get('/users/my-plan');
      return data;
    },
    enabled: !!token,
  });

  const planKey = (plan?.plan ?? 'basico') as keyof typeof PLANES;
  const estadoKey = (plan?.estado ?? 'trial') as keyof typeof ESTADOS;
  const planInfo  = PLANES[planKey];
  const estadoInfo = ESTADOS[estadoKey];
  const PlanIcon   = planInfo.icon;
  const EstadoIcon = estadoInfo.icon;

  const isUpgradeable = planKey === 'basico' || planKey === 'pro';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-14 px-1 sm:px-0">

      {/* ── Header ── */}
      <div>
        <p className="text-lime-600 font-semibold text-xs uppercase tracking-widest flex items-center gap-2 mb-1">
          <span>✦</span> Panel Propietario
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase">Mi Suscripción</h1>
        <p className="text-gray-500 text-sm mt-1">Plan actual y opciones de tu cuenta</p>
      </div>

      {/* ── Alertas de estado ── */}
      {!isLoading && plan?.isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-black text-red-900 text-sm">Tu suscripción venció</p>
            <p className="text-xs text-red-700 mt-0.5">Algunas funciones están bloqueadas. Contáctanos para renovar tu plan.</p>
          </div>
        </div>
      )}

      {!isLoading && plan?.isExpiringSoon && !plan?.isExpired && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-black text-amber-900 text-sm">Tu plan vence en {plan.daysLeft} día{plan.daysLeft !== 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-700 mt-0.5">Renueva antes de que expire para no perder el acceso a tus funciones.</p>
          </div>
        </div>
      )}

      {/* ── Card plan actual ── */}
      <div className={`bg-white rounded-2xl border-2 ${planInfo.border} p-5 sm:p-7`}>
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl ${planInfo.iconBg} flex items-center justify-center shrink-0`}>
              <PlanIcon className={`h-7 w-7 ${planInfo.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-xl font-black text-gray-900">Plan {planInfo.label}</h2>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${estadoInfo.color}`}>
                  <EstadoIcon className="h-3.5 w-3.5" /> {estadoInfo.label}
                </span>
              </div>
              <p className={`text-sm font-black ${planInfo.color}`}>{planInfo.precio}</p>
              {plan?.endsAt && !plan?.isExpired && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {plan.estado === 'trial' ? 'Trial hasta' : 'Renovar antes del'}{' '}
                  <strong>{format(parseISO(plan.endsAt), "dd 'de' MMMM yyyy", { locale: es })}</strong>
                  {plan.daysLeft !== null && plan.daysLeft > 0 && (
                    <span className="ml-1 text-amber-600 font-bold">({plan.daysLeft} días)</span>
                  )}
                </p>
              )}
            </div>
            {isUpgradeable && (
              <Link
                href="/dashboard/propetario/soporte"
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <Zap className="h-4 w-4" /> Mejorar plan
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Comparativa de planes ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-sm uppercase tracking-widest">Comparativa de planes</h2>
          <p className="text-xs text-gray-400 mt-0.5">Qué incluye cada plan</p>
        </div>

        {/* Header de planes */}
        <div className="grid grid-cols-4 gap-px bg-gray-100">
          <div className="bg-white px-3 py-3" />
          {(['basico', 'pro', 'empresarial'] as const).map(p => {
            const info = PLANES[p];
            const isCurrent = p === planKey;
            return (
              <div key={p} className={`bg-white px-2 sm:px-4 py-3 text-center ${isCurrent ? 'bg-lime-50' : ''}`}>
                <p className={`text-xs font-black uppercase tracking-wide ${info.color}`}>{info.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">{info.precio}</p>
                {isCurrent && (
                  <span className="inline-block mt-1 text-[9px] font-black bg-lime-400 text-gray-900 px-2 py-0.5 rounded-full">
                    Tu plan
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Filas de features */}
        <div className="divide-y divide-gray-50">
          {FEATURES.map((f, i) => (
            <div key={i} className="grid grid-cols-4 gap-px bg-gray-100">
              <div className="bg-white px-3 sm:px-5 py-3 flex items-center">
                <span className="text-xs text-gray-600 font-medium leading-tight">{f.label}</span>
              </div>
              {(['basico', 'pro', 'empresarial'] as const).map(p => (
                <div key={p} className={`bg-white px-2 py-3 flex items-center justify-center ${p === planKey ? 'bg-lime-50/50' : ''}`}>
                  <FeatureValue val={f[p]} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Cómo renovar / subir de plan ── */}
      {isUpgradeable && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 bg-lime-400 rounded-xl flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h3 className="font-black text-lg">
                {planKey === 'basico' ? 'Pasa al Plan Pro' : 'Pasa al Plan Empresarial'}
              </h3>
              <p className="text-gray-400 text-sm mt-0.5">
                {planKey === 'basico'
                  ? 'Activa pagos online con Wompi, analytics completo y hasta 5 canchas.'
                  : 'Canchas ilimitadas, soporte dedicado y acceso anticipado a nuevas funciones.'
                }
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 space-y-2 mb-5 text-sm">
            <p className="font-black text-white text-xs uppercase tracking-widest mb-3">¿Cómo renovar o subir de plan?</p>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 bg-lime-400 text-gray-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
              <p className="text-gray-300 text-xs">Escríbenos a través de Soporte indicando el plan que deseas.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 bg-lime-400 text-gray-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
              <p className="text-gray-300 text-xs">Te enviamos los datos de pago (Nequi, Daviplata o transferencia bancaria).</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 bg-lime-400 text-gray-900 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
              <p className="text-gray-300 text-xs">En menos de 24h activamos tu plan y recibirás confirmación por email.</p>
            </div>
          </div>

          <Link
            href="/dashboard/propetario/soporte"
            className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-gray-900 font-black text-sm px-6 py-3 rounded-xl transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Contactar soporte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ── Plan empresarial activo ── */}
      {planKey === 'empresarial' && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-black text-purple-900 text-sm">Estás en el plan máximo</p>
            <p className="text-xs text-purple-700 mt-0.5">Tienes acceso a todas las funciones de la plataforma. ¡Gracias por confiar en nosotros!</p>
          </div>
        </div>
      )}

    </div>
  );
}
