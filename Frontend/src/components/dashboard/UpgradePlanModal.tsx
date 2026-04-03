'use client';

import { Zap, Crown, Building2, X, ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface UpgradePlanModalProps {
  open: boolean;
  onClose: () => void;
  code?: string;       // 'COURT_LIMIT_REACHED' | 'WOMPI_NOT_ALLOWED' | 'SUBSCRIPTION_EXPIRED'
  message?: string;
  currentPlan?: string;
  limit?: number;
}

const PLAN_INFO = {
  pro: {
    label: 'Plan Pro',
    precio: '$89.900 / mes',
    icon: Crown,
    color: 'text-blue-700',
    bg: 'bg-blue-600',
    features: [
      'Hasta 5 canchas activas',
      'Pagos online con Wompi',
      'Analytics completo',
      'Exportar CSV',
      'Soporte prioritario 24h',
    ],
  },
  empresarial: {
    label: 'Plan Empresarial',
    precio: '$189.900 / mes',
    icon: Building2,
    color: 'text-purple-700',
    bg: 'bg-purple-600',
    features: [
      'Canchas ilimitadas',
      'Todo lo del Plan Pro',
      'Soporte dedicado',
      'Acceso a funciones beta',
    ],
  },
};

function getContent(code?: string, currentPlan?: string, limit?: number, message?: string) {
  if (code === 'SUBSCRIPTION_EXPIRED') {
    return {
      title: 'Suscripción vencida',
      description: 'Tu suscripción ha vencido. Renuévala para continuar usando todas las funciones.',
      suggestedPlan: currentPlan === 'pro' ? 'pro' : 'pro',
      ctaLabel: 'Renovar plan',
    };
  }
  if (code === 'WOMPI_NOT_ALLOWED') {
    return {
      title: 'Función exclusiva Pro',
      description: 'La integración de pagos con Wompi está disponible en el Plan Pro y Empresarial.',
      suggestedPlan: 'pro',
      ctaLabel: 'Mejorar a Pro',
    };
  }
  if (code === 'COURT_LIMIT_REACHED') {
    return {
      title: `Límite de canchas alcanzado`,
      description: message ?? `Tu plan actual permite máximo ${limit ?? 1} cancha. Mejora tu plan para agregar más.`,
      suggestedPlan: currentPlan === 'pro' ? 'empresarial' : 'pro',
      ctaLabel: currentPlan === 'pro' ? 'Mejorar a Empresarial' : 'Mejorar a Pro',
    };
  }
  return {
    title: 'Mejora tu plan',
    description: message ?? 'Esta función requiere un plan superior.',
    suggestedPlan: 'pro',
    ctaLabel: 'Ver planes',
  };
}

export function UpgradePlanModal({ open, onClose, code, message, currentPlan, limit }: UpgradePlanModalProps) {
  if (!open) return null;

  const content = getContent(code, currentPlan, limit, message);
  const plan    = PLAN_INFO[content.suggestedPlan as keyof typeof PLAN_INFO] ?? PLAN_INFO.pro;
  const PlanIcon = plan.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

        {/* Header degradado */}
        <div className={`${plan.bg} px-6 pt-6 pb-8 text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <PlanIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-black">{content.title}</h2>
          <p className="text-white/80 text-sm mt-1 leading-snug">{content.description}</p>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 space-y-5">

          {/* Plan sugerido */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-gray-900 text-sm">{plan.label}</span>
              <span className="font-black text-gray-700 text-sm">{plan.precio}</span>
            </div>
            <ul className="space-y-1.5">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <Zap className="h-3.5 w-3.5 text-lime-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Instrucciones */}
          <div className="text-xs text-gray-500 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
            Para renovar o mejorar tu plan, escríbenos por Soporte. Activamos en menos de 24h.
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard/propetario/soporte"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-black text-sm py-3.5 rounded-xl transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Contactar soporte
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/propetario/suscripcion"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-400 text-gray-600 font-semibold text-sm py-3 rounded-xl transition-colors"
            >
              Ver planes y precios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hook helper para extraer error de upgrade de axios ───────────────────────
export function extractUpgradeError(error: any): {
  isUpgrade: boolean;
  code?: string;
  message?: string;
  currentPlan?: string;
  limit?: number;
} {
  const data = error?.response?.data;
  if (data?.upgradeRequired) {
    return {
      isUpgrade:   true,
      code:        data.code,
      message:     data.message,
      currentPlan: data.currentPlan,
      limit:       data.limit,
    };
  }
  return { isUpgrade: false };
}
