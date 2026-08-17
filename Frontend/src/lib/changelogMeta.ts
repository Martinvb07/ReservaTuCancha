import { Sparkles, Zap, Bug, AlertTriangle, Wrench } from 'lucide-react';
import type { ComponentType } from 'react';
import type { ChangelogTag } from '@/types/changelog.types';

export interface ChangelogTagMeta {
  label: string;
  /** Frase corta que explica cuándo usar este tipo */
  hint: string;
  icon: ComponentType<{ className?: string }>;
  /** Chip del tag: fondo + texto + borde */
  chip: string;
  /** Color del icono suelto (el selector marca la selección en verde, así que
   *  el color del tipo vive solo en el icono) */
  text: string;
  /** Punto de la línea de tiempo */
  dot: string;
  /** Color del punto en formato CSS, para el halo */
  glow: string;
}

/** Metadatos de cada tipo de cambio para la página pública de novedades.
 *  Las mismas claves que usa el formulario de admin en /dashboard/admin/cambios. */
export const CHANGELOG_TAGS: Record<ChangelogTag, ChangelogTagMeta> = {
  nueva_funcion: {
    label: 'Nueva función',
    hint: 'Algo que antes no existía',
    icon: Sparkles,
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    glow: 'rgba(59,130,246,.30)',
  },
  mejora: {
    label: 'Mejora',
    hint: 'Algo que ya existía, ahora mejor',
    icon: Zap,
    chip: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'text-purple-600',
    dot: 'bg-purple-500',
    glow: 'rgba(168,85,247,.30)',
  },
  correccion: {
    label: 'Corrección',
    hint: 'Se arregló un error',
    icon: Bug,
    chip: 'bg-orange-50 text-orange-700 border-orange-200',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
    glow: 'rgba(249,115,22,.30)',
  },
  importante: {
    label: 'Importante',
    hint: 'Requiere atención del propietario',
    icon: AlertTriangle,
    chip: 'bg-red-50 text-red-700 border-red-200',
    text: 'text-red-600',
    dot: 'bg-red-500',
    glow: 'rgba(239,68,68,.30)',
  },
  mantenimiento: {
    label: 'Mantenimiento',
    hint: 'Trabajos programados o pausas',
    icon: Wrench,
    chip: 'bg-gray-100 text-gray-700 border-gray-200',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
    glow: 'rgba(107,114,128,.28)',
  },
};

/** Orden en el que se muestran los filtros */
export const CHANGELOG_TAG_ORDER: ChangelogTag[] = [
  'nueva_funcion', 'mejora', 'correccion', 'importante', 'mantenimiento',
];

export function getChangelogTag(tag: string): ChangelogTagMeta {
  return CHANGELOG_TAGS[tag as ChangelogTag] ?? CHANGELOG_TAGS.mejora;
}

/**
 * El campo `version` se escribe a mano en el panel de admin y a veces ya viene
 * con la "v" delante ("v1.0.1"), así que se normaliza antes de mostrarlo para
 * no terminar con "vv1.0.1".
 */
export function formatVersion(version?: string): string | null {
  const v = version?.trim().replace(/^v\.?\s*/i, '');
  return v ? `v${v}` : null;
}

/** Etiqueta del plan al que apunta el cambio (vacío si es para todos) */
export const CHANGELOG_AUDIENCE: Record<string, string> = {
  pro:         'Plan Pro',
  empresarial: 'Plan Empresarial',
  basico:      'Plan Básico',
};
